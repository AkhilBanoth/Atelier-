import React, { useRef, useState } from 'react';
import { Upload, ArrowRight, RefreshCw, AlertCircle, Image as ImageIcon } from 'lucide-react';
import type { SeasonPreference } from '../types/stylist';
import type { PreparedImageUpload } from '../utils/imageUpload';
import { prepareImageFile } from '../utils/imageUpload';
import { HERO_FLATLAY_SHOWCASE_URL } from '../data/samplePieces';

interface UploadStudioProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadedImage: PreparedImageUpload | null;
  season: SeasonPreference;
  itemHint: string;
  isAnalyzing: boolean;
  errorMessage: string | null;
  onSelectImage: (prepared: PreparedImageUpload) => void;
  onClearImage: () => void;
  onSeasonChange: (season: SeasonPreference) => void;
  onHintChange: (hint: string) => void;
  onAnalyze: () => void;
  onTryFirstSample: () => void;
}

const SEASON_OPTIONS: { value: SeasonPreference; label: string }[] = [
  { value: 'all-season', label: 'All-Season' },
  { value: 'spring-summer', label: 'Spring / Summer' },
  { value: 'autumn-winter', label: 'Autumn / Winter' },
];

export const UploadStudio: React.FC<UploadStudioProps> = ({
  fileInputRef,
  uploadedImage,
  season,
  itemHint,
  isAnalyzing,
  errorMessage,
  onSelectImage,
  onClearImage,
  onSeasonChange,
  onHintChange,
  onAnalyze,
  onTryFirstSample,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setLocalError(null);
    try {
      const prepared = await prepareImageFile(file);
      onSelectImage(prepared);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : 'Unable to read this photograph. Please try a JPEG or PNG.'
      );
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    void handleFiles(e.dataTransfer.files);
  };

  const activeError = localError || errorMessage;

  return (
    <section
      id="top"
      aria-label="Virtual Stylist Upload Studio"
      className="mx-auto max-w-[1280px] px-6 pt-10 pb-14 md:px-10 md:pt-14 md:pb-20"
    >
      <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left Column: Editorial brief + Upload & Styling Controls */}
        <div className="flex flex-col justify-between lg:col-span-6">
          <div>
            <p className="text-xs font-medium text-[#6B6B64]">
              Virtual Wardrobe Stylist
            </p>
            <h1 className="mt-3 font-serif text-[clamp(2.4rem,4.2vw,3.75rem)] leading-[1.06] font-medium tracking-[-0.02em] text-[#171717]">
              What to wear with that one impossible piece.
            </h1>
            <p className="mt-4 max-w-[54ch] text-[15px] leading-relaxed text-[#575752]">
              Upload a photograph of any tricky patterned skirt, bold jacket, or statement trouser.
              We extract its color palette and proportion, then compose three clean flat-lay
              outfits for Casual, Business, and Night Out.
            </p>

            {/* Upload Dropzone */}
            <div className="mt-7">
              <input
                ref={fileInputRef}
                id="garment-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  void handleFiles(e.target.files);
                  e.target.value = '';
                }}
              />

              <div
                ref={dropZoneRef}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`rounded-sm border border-dashed p-5 transition-colors duration-150 ${
                  isDragging
                    ? 'border-[#263B59] bg-[#263B59]/[0.04]'
                    : 'border-[#CBCBC3] bg-white'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#171717]">
                      {uploadedImage ? uploadedImage.fileName : 'Drop a garment photo here'}
                    </p>
                    <p className="mt-1 text-xs text-[#575752] tabular-nums">
                      {uploadedImage
                        ? `Ready · ${uploadedImage.width} × ${uploadedImage.height}px`
                        : 'JPEG, PNG, or WebP · Laid flat or on a hanger works best'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-sm border border-[#D4D4CC] bg-[#F8F8F6] px-4 py-2 text-sm font-medium text-[#171717] transition-colors duration-150 hover:bg-[#EFEFEB] whitespace-nowrap shrink-0"
                    >
                      <Upload className="h-4 w-4" aria-hidden="true" />
                      {uploadedImage ? 'Replace' : 'Choose Photo'}
                    </button>
                    {uploadedImage && (
                      <button
                        type="button"
                        onClick={onClearImage}
                        aria-label="Remove uploaded photo"
                        className="inline-flex min-h-[40px] cursor-pointer items-center px-3 py-2 text-xs font-medium text-[#575752] transition-colors hover:text-[#171717] whitespace-nowrap shrink-0"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Styling Controls */}
            <div className="mt-5 space-y-4">
              <div>
                <span className="block text-xs font-medium text-[#575752]">Season</span>
                <div
                  role="radiogroup"
                  aria-label="Season preference"
                  className="mt-1.5 grid w-full grid-cols-3 rounded-sm border border-[#E4E4DE] bg-[#EFEFEB] p-1"
                >
                  {SEASON_OPTIONS.map((opt) => {
                    const active = season === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onSeasonChange(opt.value)}
                        className={`cursor-pointer rounded-sm px-2 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap ${
                          active
                            ? 'bg-white text-[#171717] shadow-xs'
                            : 'text-[#575752] hover:text-[#171717]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="styling-note" className="block text-xs font-medium text-[#575752]">
                  Styling preference (optional)
                </label>
                <input
                  id="styling-note"
                  type="text"
                  maxLength={140}
                  value={itemHint}
                  onChange={(e) => onHintChange(e.target.value)}
                  placeholder="e.g. Low heels only, silver jewelry"
                  className="mt-1.5 min-h-[40px] w-full rounded-sm border border-[#D4D4CC] bg-white px-3 py-2 text-sm text-[#171717] placeholder:text-[#8A8A83]"
                />
              </div>
            </div>

            {/* Validation or API Error Feedback */}
            {activeError && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 rounded-sm border border-[#9E3A2F]/25 bg-[#9E3A2F]/[0.06] px-4 py-3 text-sm text-[#7A271E]"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium">Unable to style this image</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#7A271E]/90">{activeError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Row */}
          <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-[#E4E4DE] pt-6">
            <button
              type="button"
              onClick={() => {
                if (!uploadedImage) {
                  fileInputRef.current?.click();
                } else {
                  onAnalyze();
                }
              }}
              disabled={isAnalyzing}
              className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2.5 rounded-sm bg-[#141414] px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#2B2B29] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Analyzing Palette &amp; Outfits…
                </>
              ) : uploadedImage ? (
                <>
                  Generate 3 Outfit Flat-Lays
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              ) : (
                <>
                  Upload Garment Photo
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onTryFirstSample}
              disabled={isAnalyzing}
              className="inline-flex min-h-[44px] cursor-pointer items-center text-sm font-medium text-[#171717] underline decoration-[#171717]/30 underline-offset-4 transition-colors hover:decoration-[#171717] disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              Try with Botanical Midi Skirt
            </button>
          </div>
        </div>

        {/* Right Column: Full-height editorial flat-lay preview or uploaded photo preview */}
        <div className="flex flex-col lg:col-span-6">
          <div className="relative flex flex-1 flex-col overflow-hidden rounded-sm border border-[#E4E4DE] bg-[#EFEFEB]">
            {uploadedImage ? (
              <div className="flex flex-1 items-center justify-center bg-[#F4F3EF] p-6">
                <img
                  src={uploadedImage.dataUrl}
                  alt="Uploaded garment ready for styling analysis"
                  referrerPolicy="no-referrer"
                  className="max-h-[460px] w-auto object-contain shadow-sm"
                />
              </div>
            ) : !heroImgFailed ? (
              <img
                src={HERO_FLATLAY_SHOWCASE_URL}
                alt="Editorial overhead flat-lay pairing a botanical emerald midi skirt with an ivory knit tank, espresso loafers, camel crossbody bag, and gold hoops"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="h-full min-h-[340px] w-full object-cover"
              />
            ) : (
              <div className="flex min-h-[340px] flex-1 flex-col items-center justify-center gap-3 bg-[#EFEFEB] p-8 text-center text-[#575752]">
                <ImageIcon className="h-8 w-8 opacity-40" aria-hidden="true" />
                <p className="font-serif text-xl text-[#171717]">Studio Flat-Lay Preview</p>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 border-t border-[#E4E4DE] bg-white px-5 py-3 text-xs text-[#575752]">
              <span className="truncate">
                {uploadedImage
                  ? 'Uploaded item · Click Generate to extract palette & 3 outfits'
                  : 'Example Edit · Botanical Jacquard Skirt styled for Casual'}
              </span>
              <span className="font-mono text-[11px] text-[#7A7A73] whitespace-nowrap shrink-0">
                Casual · Business · Night Out
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
