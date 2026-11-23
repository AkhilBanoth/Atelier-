import { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header';
import { UploadStudio } from './components/UploadStudio';
import { SampleGallery } from './components/SampleGallery';
import { ItemAnalysisPanel } from './components/ItemAnalysisPanel';
import { OutfitBoard } from './components/OutfitBoard';
import { OutfitDetailModal } from './components/OutfitDetailModal';
import { LookbookDrawer } from './components/LookbookDrawer';
import { AnalyzingSkeleton } from './components/AnalyzingSkeleton';
import { SAMPLE_PIECES } from './data/samplePieces';
import type {
  BackdropStyle,
  OutfitOption,
  SamplePiece,
  SavedLook,
  SeasonPreference,
  StylingResult,
} from './types/stylist';
import {
  loadImageUrlAsBase64,
  type PreparedImageUpload,
} from './utils/imageUpload';
import {
  isSafeImageUrl,
  removeSavedLook,
  toggleSavedLook,
} from './utils/stylistValidation';

const LOOKBOOK_STORAGE_KEY = 'atelier_edit_saved_looks_v1';

function readInitialSavedLooks(): SavedLook[] {
  try {
    const raw = window.localStorage.getItem(LOOKBOOK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is SavedLook =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as SavedLook).id === 'string' &&
        isSafeImageUrl((entry as SavedLook).itemImageUrl)
    );
  } catch {
    return [];
  }
}

export default function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const [uploadedImage, setUploadedImage] = useState<PreparedImageUpload | null>(null);
  const [season, setSeason] = useState<SeasonPreference>('all-season');
  const [itemHint, setItemHint] = useState('');
  const [backdrop, setBackdrop] = useState<BackdropStyle>('travertine');

  const [stylingResult, setStylingResult] = useState<StylingResult | null>(null);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [inspectedOutfit, setInspectedOutfit] = useState<OutfitOption | null>(null);
  const [lookbookOpen, setLookbookOpen] = useState(false);
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>(readInitialSavedLooks);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOOKBOOK_STORAGE_KEY, JSON.stringify(savedLooks));
    } catch {
      // Ignore storage quota exceptions gracefully
    }
  }, [savedLooks]);

  const savedLookIds = useMemo(() => new Set(savedLooks.map((l) => l.id)), [savedLooks]);

  const runLiveAiAnalysis = async (params: {
    base64: string;
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
    season: SeasonPreference;
    itemHint: string;
  }) => {
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/stylist/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: params.base64,
          mimeType: params.mimeType,
          season: params.season,
          itemHint: params.itemHint,
        }),
      });

      const rawText = await response.text();
      let payload: (StylingResult & { error?: string }) | null = null;
      try {
        payload = rawText ? (JSON.parse(rawText) as StylingResult & { error?: string }) : null;
      } catch {
        payload = null;
      }

      if (!response.ok || !payload || !payload.item || !Array.isArray(payload.outfits)) {
        const isHtmlResponse = /^\s*</.test(rawText);
        const fallbackMessage =
          response.status === 404
            ? 'The styling API route (/api/stylist/analyze) was not found. Make sure the API serverless functions are deployed.'
            : response.status === 413
              ? 'This photograph is too large to upload. Please try a smaller image.'
              : response.status === 504
                ? 'The styling analysis timed out. Please try again with a slightly smaller photo.'
                : isHtmlResponse
                  ? 'The styling API returned an unexpected page instead of JSON. Please check your deployment API routes and try again.'
                  : 'Could not analyze this garment photograph. Please try again.';
        throw new Error(payload?.error || fallbackMessage);
      }

      setStylingResult(payload);
      setActiveSampleId(null);
      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to reach the styling service right now.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeUploaded = () => {
    if (!uploadedImage) {
      fileInputRef.current?.click();
      return;
    }
    void runLiveAiAnalysis({
      base64: uploadedImage.base64,
      mimeType: uploadedImage.mimeType,
      season,
      itemHint,
    });
  };

  const handleSelectSample = (sample: SamplePiece) => {
    setErrorMessage(null);
    setActiveSampleId(sample.id);
    setStylingResult(sample.presetResult);
    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleReanalyzeCurrentWithAi = async () => {
    if (!stylingResult) return;
    setErrorMessage(null);
    setIsAnalyzing(true);
    try {
      const { base64, mimeType } = await loadImageUrlAsBase64(stylingResult.itemImageUrl);
      await runLiveAiAnalysis({
        base64,
        mimeType,
        season,
        itemHint,
      });
    } catch (err) {
      setIsAnalyzing(false);
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to prepare this image for AI analysis.'
      );
    }
  };

  const handleToggleSaveOutfit = (outfit: OutfitOption) => {
    if (!stylingResult) return;
    const lookId = `${stylingResult.id}:${outfit.id}`;
    const candidate: SavedLook = {
      id: lookId,
      savedAt: new Date().toISOString(),
      itemName: stylingResult.item.name,
      itemImageUrl: stylingResult.itemImageUrl,
      itemCategory: stylingResult.item.category,
      backdrop,
      outfit,
    };
    setSavedLooks((prev) => toggleSavedLook(prev, candidate));
  };

  const handleNavigateStudio = () => {
    setStylingResult(null);
    setActiveSampleId(null);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToSamples = () => {
    if (stylingResult) {
      setStylingResult(null);
      window.setTimeout(() => {
        document.getElementById('sample-pieces')?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      document.getElementById('sample-pieces')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTriggerUpload = () => {
    if (stylingResult) {
      setStylingResult(null);
      window.setTimeout(() => {
        fileInputRef.current?.click();
      }, 60);
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#171717]">
      <Header
        activeSection={stylingResult ? 'results' : 'studio'}
        savedCount={savedLooks.length}
        onNavigateStudio={handleNavigateStudio}
        onScrollToSamples={handleScrollToSamples}
        onOpenLookbook={() => setLookbookOpen(true)}
        onTriggerUpload={handleTriggerUpload}
      />

      <main>
        {!stylingResult && (
          <UploadStudio
            fileInputRef={fileInputRef}
            uploadedImage={uploadedImage}
            season={season}
            itemHint={itemHint}
            isAnalyzing={isAnalyzing}
            errorMessage={errorMessage}
            onSelectImage={(prepared) => {
              setUploadedImage(prepared);
              setErrorMessage(null);
            }}
            onClearImage={() => {
              setUploadedImage(null);
              setErrorMessage(null);
            }}
            onSeasonChange={setSeason}
            onHintChange={setItemHint}
            onAnalyze={handleAnalyzeUploaded}
            onTryFirstSample={() => handleSelectSample(SAMPLE_PIECES[0])}
          />
        )}

        {isAnalyzing && <AnalyzingSkeleton />}

        {stylingResult && !isAnalyzing && (
          <div ref={resultsRef}>
            {errorMessage && (
              <div
                role="alert"
                className="mx-auto max-w-[1280px] px-6 pt-6 md:px-10"
              >
                <div className="rounded-sm border border-[#9E3A2F]/25 bg-[#9E3A2F]/[0.06] px-4 py-3 text-sm text-[#7A271E]">
                  {errorMessage}
                </div>
              </div>
            )}

            <ItemAnalysisPanel
              result={stylingResult}
              isReanalyzing={isAnalyzing}
              onReanalyzeWithAi={() => void handleReanalyzeCurrentWithAi()}
              onResetToStudio={handleNavigateStudio}
            />

            <OutfitBoard
              result={stylingResult}
              backdrop={backdrop}
              savedLookIds={savedLookIds}
              onBackdropChange={setBackdrop}
              onInspectOutfit={setInspectedOutfit}
              onToggleSaveOutfit={handleToggleSaveOutfit}
            />
          </div>
        )}

        <SampleGallery
          samples={SAMPLE_PIECES}
          activeSampleId={activeSampleId}
          onSelectSample={handleSelectSample}
        />
      </main>

      <footer className="border-t border-[#E4E4DE] bg-[#F8F8F6]">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-4 px-6 py-8 text-xs text-[#6B6B64] sm:flex-row sm:items-center md:px-10">
          <p className="font-serif text-base font-medium text-[#171717]">Atelier Edit</p>
          <p>
            Color palette extraction &amp; flat-lay outfit composition for Casual, Business, and
            Night Out.
          </p>
        </div>
      </footer>

      <OutfitDetailModal
        outfit={inspectedOutfit}
        itemName={stylingResult?.item.name ?? ''}
        itemImageUrl={stylingResult?.itemImageUrl ?? ''}
        itemCategory={stylingResult?.item.category ?? 'bottom'}
        backdrop={backdrop}
        isSaved={
          Boolean(stylingResult && inspectedOutfit) &&
          savedLookIds.has(`${stylingResult!.id}:${inspectedOutfit!.id}`)
        }
        onBackdropChange={setBackdrop}
        onToggleSave={() => {
          if (inspectedOutfit) handleToggleSaveOutfit(inspectedOutfit);
        }}
        onClose={() => setInspectedOutfit(null)}
      />

      <LookbookDrawer
        open={lookbookOpen}
        savedLooks={savedLooks}
        onClose={() => setLookbookOpen(false)}
        onRemoveLook={(id) => setSavedLooks((prev) => removeSavedLook(prev, id))}
      />
    </div>
  );
}
