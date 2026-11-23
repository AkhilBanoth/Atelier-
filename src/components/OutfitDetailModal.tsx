import React, { useEffect, useState } from 'react';
import { Bookmark, Check, Download, X } from 'lucide-react';
import type { AnalyzedItem, BackdropStyle, OutfitOption } from '../types/stylist';
import { FlatLayCanvas, downloadCleanFlatLayPng } from './FlatLayCanvas';

interface OutfitDetailModalProps {
  outfit: OutfitOption | null;
  itemName: string;
  itemImageUrl: string;
  itemCategory: AnalyzedItem['category'];
  backdrop: BackdropStyle;
  isSaved: boolean;
  onBackdropChange: (backdrop: BackdropStyle) => void;
  onToggleSave: () => void;
  onClose: () => void;
}

const BACKDROPS: { id: BackdropStyle; label: string }[] = [
  { id: 'chalk', label: 'Studio Chalk' },
  { id: 'travertine', label: 'Raw Travertine' },
  { id: 'linen', label: 'Warm Linen' },
];

export const OutfitDetailModal: React.FC<OutfitDetailModalProps> = ({
  outfit,
  itemName,
  itemImageUrl,
  itemCategory,
  backdrop,
  isSaved,
  onBackdropChange,
  onToggleSave,
  onClose,
}) => {
  const [highlightedPieceId, setHighlightedPieceId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setHighlightedPieceId(null);
  }, [outfit?.id]);

  useEffect(() => {
    if (!outfit) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [outfit, onClose]);

  if (!outfit) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadCleanFlatLayPng({
        itemImageUrl,
        itemName,
        itemCategory,
        outfit,
        backdrop,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="outfit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#141414]/55 p-4 backdrop-blur-[2px] md:p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative grid max-h-[90vh] w-full max-w-[1080px] grid-cols-1 overflow-y-auto rounded-sm border border-[#E4E4DE] bg-white shadow-xl lg:grid-cols-12 lg:overflow-hidden">
        {/* Left: Centered Flat-Lay Studio Canvas */}
        <div className="flex flex-col items-center justify-center border-b border-[#E4E4DE] bg-[#F3F2EE] p-4 lg:col-span-6 lg:border-r lg:border-b-0 lg:p-6">
          <div className="w-full max-w-[460px] overflow-hidden rounded-sm border border-[#E4E4DE] bg-white shadow-xs">
            <FlatLayCanvas
              itemImageUrl={itemImageUrl}
              itemName={itemName}
              itemCategory={itemCategory}
              outfit={outfit}
              backdrop={backdrop}
              highlightedPieceId={highlightedPieceId}
              onSelectPiece={setHighlightedPieceId}
            />
          </div>
          <p className="mt-3 text-center text-xs text-[#6B6B64]">
            Click any piece on the flat-lay or list to inspect its styling role
          </p>
        </div>

        {/* Right: Independently Scrollable Detailed Piece Breakdown */}
        <div className="flex flex-col justify-between p-6 lg:col-span-6 lg:max-h-[90vh] lg:overflow-y-auto lg:p-7">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-[#6B6B64]">
                  <span className="font-medium text-[#171717]">{outfit.occasionLabel}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{outfit.vibe}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{outfit.colorHarmony}</span>
                </p>
                <h2
                  id="outfit-modal-title"
                  className="mt-1 font-serif text-3xl leading-tight font-medium text-[#171717]"
                >
                  {outfit.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close outfit inspection modal"
                className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-[#E4E4DE] text-[#575752] transition-colors hover:bg-[#F8F8F6] hover:text-[#171717]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-3.5 text-sm leading-relaxed text-[#2C2C29]">{outfit.stylistNote}</p>

            <div className="mt-3.5 border-t border-[#EFEFEB] pt-3.5 text-xs leading-relaxed text-[#575752]">
              <span className="font-medium text-[#171717]">Proportion &amp; Fit Tip: </span>
              {outfit.proportionTip}
            </div>

            {/* Backdrop Switcher inside modal */}
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#EFEFEB] pt-4">
              <span className="text-xs font-medium text-[#575752]">Studio surface</span>
              <div className="inline-flex rounded-sm border border-[#E4E4DE] bg-[#EFEFEB] p-0.5">
                {BACKDROPS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onBackdropChange(b.id)}
                    className={`cursor-pointer rounded-sm px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                      backdrop === b.id
                        ? 'bg-white text-[#171717] shadow-xs'
                        : 'text-[#575752] hover:text-[#171717]'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Complete Piece List */}
            <div className="mt-4 border-t border-[#EFEFEB] pt-4">
              <h3 className="text-xs font-medium text-[#6B6B64]">
                Garment Breakdown
              </h3>
              <ul className="mt-2.5 space-y-2.5">
                {outfit.pieces.map((piece) => {
                  const selected = highlightedPieceId === piece.id;
                  return (
                    <li
                      key={piece.id}
                      className={`rounded-sm border p-3 transition-colors ${
                        selected
                          ? 'border-[#263B59] bg-[#263B59]/[0.03]'
                          : 'border-[#EFEFEB] bg-[#FAF9F6]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setHighlightedPieceId(selected ? null : piece.id)}
                        className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
                      >
                        <span className="flex items-center gap-2.5 text-sm font-medium text-[#171717]">
                          <span
                            aria-hidden="true"
                            className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/15"
                            style={{ backgroundColor: piece.colorHex }}
                          />
                          {piece.name}
                        </span>
                        <span className="font-mono text-[11px] text-[#6B6B64] tabular-nums">
                          {piece.colorHex}
                        </span>
                      </button>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#575752]">
                        {piece.stylingReason}
                      </p>
                      <p className="mt-1 text-[11px] text-[#7A7A73]">
                        {piece.colorName} · {piece.material} · {piece.fitNotes}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-[#EFEFEB] pt-5">
            <button
              type="button"
              onClick={onToggleSave}
              className={`inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-sm border px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                isSaved
                  ? 'border-[#171717] bg-[#171717] text-white'
                  : 'border-[#D4D4CC] bg-white text-[#171717] hover:bg-[#EFEFEB]'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Saved to Lookbook
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4" aria-hidden="true" />
                  Save to Lookbook
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={isDownloading}
              className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-sm bg-[#141414] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2B2B29] disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {isDownloading ? 'Exporting…' : 'Download Flat-Lay PNG'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
