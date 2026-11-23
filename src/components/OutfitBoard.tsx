import React, { useState } from 'react';
import { Bookmark, Check, Download, Maximize2 } from 'lucide-react';
import type {
  BackdropStyle,
  OccasionId,
  OutfitOption,
  StylingResult,
} from '../types/stylist';
import { FlatLayCanvas, downloadCleanFlatLayPng } from './FlatLayCanvas';

interface OutfitBoardProps {
  result: StylingResult;
  backdrop: BackdropStyle;
  savedLookIds: ReadonlySet<string>;
  onBackdropChange: (backdrop: BackdropStyle) => void;
  onInspectOutfit: (outfit: OutfitOption) => void;
  onToggleSaveOutfit: (outfit: OutfitOption) => void;
}

type FilterMode = 'all' | OccasionId;

const BACKDROP_OPTIONS: { id: BackdropStyle; label: string }[] = [
  { id: 'chalk', label: 'Studio Chalk' },
  { id: 'travertine', label: 'Raw Travertine' },
  { id: 'linen', label: 'Warm Linen' },
];

const FILTER_OPTIONS: { id: FilterMode; label: string }[] = [
  { id: 'all', label: 'All 3 Looks' },
  { id: 'casual', label: 'Casual' },
  { id: 'business', label: 'Business' },
  { id: 'night_out', label: 'Night Out' },
];

export const OutfitBoard: React.FC<OutfitBoardProps> = ({
  result,
  backdrop,
  savedLookIds,
  onBackdropChange,
  onInspectOutfit,
  onToggleSaveOutfit,
}) => {
  const [filter, setFilter] = useState<FilterMode>('all');
  const [selectedPieceByOutfit, setSelectedPieceByOutfit] = useState<
    Record<string, string | null>
  >({});
  const [exportingId, setExportingId] = useState<string | null>(null);

  const visibleOutfits =
    filter === 'all'
      ? result.outfits
      : result.outfits.filter((o) => o.occasion === filter);

  const handleDownload = async (outfit: OutfitOption) => {
    setExportingId(outfit.id);
    try {
      await downloadCleanFlatLayPng({
        itemImageUrl: result.itemImageUrl,
        itemName: result.item.name,
        itemCategory: result.item.category,
        outfit,
        backdrop,
      });
    } finally {
      setExportingId(null);
    }
  };

  return (
    <section
      aria-labelledby="outfit-board-heading"
      className="mx-auto max-w-[1280px] px-6 py-12 md:px-10 md:py-16"
    >
      {/* Unified Studio Controls Toolbar */}
      <div className="flex flex-col justify-between gap-5 border-b border-[#E4E4DE] pb-6 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-medium text-[#6B6B64]">
            Complete Flat-Lay Looks
          </p>
          <h2
            id="outfit-board-heading"
            className="mt-1 font-serif text-[clamp(1.75rem,2.4vw,2.35rem)] leading-tight font-medium text-[#171717]"
          >
            Three ways to wear your {result.item.name}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Occasion filter tabs */}
          <div
            role="tablist"
            aria-label="Filter outfit occasions"
            className="inline-flex rounded-sm border border-[#E4E4DE] bg-[#EFEFEB] p-1"
          >
            {FILTER_OPTIONS.map((opt) => {
              const active = filter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(opt.id)}
                  className={`cursor-pointer rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap ${
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

          {/* Flat-lay surface backdrop switcher */}
          <div
            role="radiogroup"
            aria-label="Flat-lay backdrop surface"
            className="inline-flex rounded-sm border border-[#E4E4DE] bg-[#EFEFEB] p-1"
          >
            {BACKDROP_OPTIONS.map((opt) => {
              const active = backdrop === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onBackdropChange(opt.id)}
                  className={`cursor-pointer rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap ${
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
      </div>

      {/* 3-Column Flat-Lay Outfit Grid */}
      <div
        className={`mt-8 grid gap-8 ${
          visibleOutfits.length === 1
            ? 'grid-cols-1 lg:grid-cols-12'
            : 'grid-cols-1 lg:grid-cols-3'
        }`}
      >
        {visibleOutfits.map((outfit, idx) => {
          const lookIndex = result.outfits.findIndex((o) => o.id === outfit.id) + 1;
          const highlightedPieceId = selectedPieceByOutfit[outfit.id] ?? null;
          const activePiece =
            outfit.pieces.find((p) => p.id === highlightedPieceId) ?? null;
          const lookKey = `${result.id}:${outfit.id}`;
          const isSaved = savedLookIds.has(lookKey);
          const isSingleView = visibleOutfits.length === 1;

          return (
            <article
              key={outfit.id}
              data-testid={`outfit-card-${outfit.occasion}`}
              className={`flex flex-col overflow-hidden rounded-sm border border-[#E4E4DE] bg-white ${
                isSingleView ? 'lg:col-span-12 lg:grid lg:grid-cols-12' : ''
              }`}
            >
              {/* Flat-Lay Visual */}
              <div
                className={`relative border-b border-[#EFEFEB] ${
                  isSingleView ? 'lg:col-span-6 lg:border-r lg:border-b-0' : ''
                }`}
              >
                <FlatLayCanvas
                  itemImageUrl={result.itemImageUrl}
                  itemName={result.item.name}
                  itemCategory={result.item.category}
                  outfit={outfit}
                  backdrop={backdrop}
                  highlightedPieceId={highlightedPieceId}
                  onSelectPiece={(pieceId) =>
                    setSelectedPieceByOutfit((prev) => ({
                      ...prev,
                      [outfit.id]: pieceId,
                    }))
                  }
                />
              </div>

              {/* Editorial Breakdown & Interactive Piece List */}
              <div
                className={`flex flex-1 flex-col justify-between p-6 ${
                  isSingleView ? 'lg:col-span-6 lg:p-8' : ''
                }`}
              >
                <div>
                  <p className="text-xs text-[#6B6B64]">
                    <span className="font-medium text-[#171717]">
                      0{lookIndex}. {outfit.occasionLabel}
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span className="tabular-nums">{outfit.pieces.length + 1} pieces</span>
                    <span aria-hidden="true"> · </span>
                    <span>{outfit.colorHarmony}</span>
                  </p>

                  <h3 className="mt-1.5 font-serif text-[26px] leading-snug font-medium text-[#171717]">
                    {outfit.title}
                  </h3>

                  <p className="mt-2.5 text-sm leading-relaxed text-[#575752]">
                    {outfit.stylistNote}
                  </p>

                  {/* Interactive Garment Manifest */}
                  <div className="mt-5 border-t border-[#EFEFEB] pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#6B6B64]">
                        Pieces in this flat-lay
                      </span>
                      <span className="text-[11px] text-[#7A7A73]">Click piece to highlight</span>
                    </div>

                    <ul className="mt-2.5 divide-y divide-[#F2F2EC]">
                      <li>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedPieceByOutfit((prev) => ({
                              ...prev,
                              [outfit.id]: highlightedPieceId === 'hero' ? null : 'hero',
                            }))
                          }
                          className={`flex w-full cursor-pointer items-center justify-between gap-3 py-2 text-left text-sm transition-colors ${
                            highlightedPieceId === 'hero'
                              ? 'text-[#263B59] font-medium'
                              : 'text-[#171717] hover:text-[#263B59]'
                          }`}
                        >
                          <span className="truncate">{result.item.name}</span>
                          <span className="text-xs text-[#6B6B64] whitespace-nowrap shrink-0">
                            Your piece
                          </span>
                        </button>
                      </li>

                      {outfit.pieces.map((piece) => {
                        const selected = highlightedPieceId === piece.id;
                        return (
                          <li key={piece.id}>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPieceByOutfit((prev) => ({
                                  ...prev,
                                  [outfit.id]: selected ? null : piece.id,
                                }))
                              }
                              className={`flex w-full cursor-pointer items-center justify-between gap-3 py-2 text-left text-sm transition-colors ${
                                selected
                                  ? 'text-[#263B59] font-medium'
                                  : 'text-[#2C2C29] hover:text-[#263B59]'
                              }`}
                            >
                              <span className="flex min-w-0 items-center gap-2.5">
                                <span
                                  aria-hidden="true"
                                  className="h-3 w-3 shrink-0 rounded-full border border-black/15"
                                  style={{ backgroundColor: piece.colorHex }}
                                />
                                <span className="truncate">{piece.name}</span>
                              </span>
                              <span className="text-xs text-[#7A7A73] whitespace-nowrap shrink-0">
                                {piece.colorName}
                              </span>
                            </button>

                            {selected && (
                              <div className="pb-2.5 pl-5.5 text-xs leading-relaxed text-[#575752]">
                                <p>{piece.stylingReason}</p>
                                <p className="mt-1 text-[11px] text-[#7A7A73]">
                                  {piece.material} · {piece.fitNotes}
                                </p>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {!activePiece && (
                    <p className="mt-4 border-t border-[#EFEFEB] pt-3 text-xs leading-relaxed text-[#6B6B64]">
                      <span className="font-medium text-[#171717]">Proportion note: </span>
                      {outfit.proportionTip}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[#EFEFEB] pt-4">
                  <button
                    type="button"
                    onClick={() => onInspectOutfit(outfit)}
                    aria-label={`Inspect ${outfit.occasionLabel} outfit ${outfit.title}`}
                    className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 text-xs font-medium text-[#171717] transition-colors hover:text-[#263B59] whitespace-nowrap shrink-0"
                  >
                    <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Inspect
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleSaveOutfit(outfit)}
                      aria-label={
                        isSaved
                          ? `Remove ${outfit.title} from Lookbook`
                          : `Save ${outfit.title} to Lookbook`
                      }
                      aria-pressed={isSaved}
                      className={`inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        isSaved
                          ? 'border-[#171717] bg-[#171717] text-white'
                          : 'border-[#D4D4CC] bg-[#F8F8F6] text-[#171717] hover:bg-[#EFEFEB]'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                          Save Look
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDownload(outfit)}
                      disabled={exportingId === outfit.id}
                      aria-label={`Download ${outfit.occasionLabel} flat-lay PNG for ${outfit.title}`}
                      className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-sm border border-[#D4D4CC] bg-white px-3 py-1.5 text-xs font-medium text-[#171717] transition-colors hover:bg-[#EFEFEB] disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      {exportingId === outfit.id ? 'Saving…' : 'PNG'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
