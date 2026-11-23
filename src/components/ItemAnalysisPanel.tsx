import React, { useState } from 'react';
import { Check, Copy, RefreshCw, ArrowLeft } from 'lucide-react';
import type { StylingResult } from '../types/stylist';
import { getContrastTextColor } from '../utils/stylistValidation';

interface ItemAnalysisPanelProps {
  result: StylingResult;
  isReanalyzing: boolean;
  onReanalyzeWithAi: () => void;
  onResetToStudio: () => void;
}

export const ItemAnalysisPanel: React.FC<ItemAnalysisPanelProps> = ({
  result,
  isReanalyzing,
  onReanalyzeWithAi,
  onResetToStudio,
}) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const { item } = result;

  const handleCopyHex = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      window.setTimeout(() => setCopiedHex(null), 1500);
    } catch {
      setCopiedHex(hex);
      window.setTimeout(() => setCopiedHex(null), 1500);
    }
  };

  return (
    <section
      aria-label="Uploaded item style and color analysis"
      className="border-b border-[#E4E4DE] bg-white"
    >
      <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
          <button
            type="button"
            onClick={onResetToStudio}
            className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 text-sm font-medium text-[#575752] transition-colors hover:text-[#171717] whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Upload Another Piece
          </button>

          <div className="flex items-center gap-4">
            <span className="text-xs text-[#6B6B64]">
              {result.source === 'ai'
                ? 'Live Gemini Stylist Analysis'
                : 'Curated Studio Preset'}
            </span>
            <button
              type="button"
              onClick={onReanalyzeWithAi}
              disabled={isReanalyzing}
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-2 rounded-sm border border-[#D4D4CC] bg-[#F8F8F6] px-4 py-1.5 text-xs font-medium text-[#171717] transition-colors hover:bg-[#EFEFEB] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isReanalyzing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              {isReanalyzing ? 'Re-analyzing…' : 'Refresh with Live AI'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 border-t border-[#EFEFEB] pt-8 lg:grid-cols-12">
          {/* Uploaded garment thumbnail */}
          <div className="lg:col-span-3">
            <div className="aspect-[3/4] overflow-hidden rounded-sm border border-[#E4E4DE] bg-[#F4F3EF]">
              <img
                src={result.itemImageUrl}
                alt={item.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain p-2"
              />
            </div>
          </div>

          {/* Style profile + Extracted Color Palette */}
          <div className="flex flex-col justify-between lg:col-span-9">
            <div>
              <p className="text-xs text-[#6B6B64]">
                <span>{item.silhouette}</span>
                <span aria-hidden="true"> · </span>
                <span>{item.pattern}</span>
                <span aria-hidden="true"> · </span>
                <span>{item.fabric}</span>
              </p>

              <h1 className="mt-2 font-serif text-[clamp(2rem,3vw,2.85rem)] leading-tight font-medium text-[#171717]">
                {item.name}
              </h1>

              <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h2 className="text-xs font-medium text-[#6B6B64]">
                    Editorial Read
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#2C2C29]">
                    {item.styleSummary}
                  </p>
                </div>
                <div>
                  <h2 className="text-xs font-medium text-[#6B6B64]">
                    Why It Feels Tricky
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#575752]">
                    {item.stylingChallenge}
                  </p>
                  <p className="mt-2 text-xs text-[#6B6B64]">
                    Formality range: <span className="text-[#171717]">{item.formalityRange}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* 5-Swatch Color Palette Architecture */}
            <div className="mt-8 border-t border-[#EFEFEB] pt-6">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-xs font-medium text-[#6B6B64]">
                  Extracted Color Palette
                </h2>
                <span className="text-xs text-[#7A7A73]">Click any swatch to copy hex</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {item.palette.map((swatch) => {
                  const textOnSwatch = getContrastTextColor(swatch.hex);
                  const isCopied = copiedHex === swatch.hex;
                  return (
                    <button
                      key={`${swatch.name}-${swatch.hex}`}
                      type="button"
                      onClick={() => void handleCopyHex(swatch.hex)}
                      aria-label={`Copy ${swatch.name} color ${swatch.hex}`}
                      className="group flex cursor-pointer flex-col overflow-hidden rounded-sm border border-[#E4E4DE] bg-white text-left transition-transform duration-150 hover:-translate-y-0.5"
                    >
                      <div
                        className="flex h-14 w-full items-end justify-between px-2.5 py-2"
                        style={{ backgroundColor: swatch.hex, color: textOnSwatch }}
                      >
                        <span className="font-mono text-[11px] font-medium tabular-nums">
                          {swatch.proportion}%
                        </span>
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Copy
                            className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-80"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div className="px-2.5 py-2">
                        <p className="truncate text-xs font-medium text-[#171717]">{swatch.name}</p>
                        <p className="mt-0.5 flex items-center justify-between gap-1 text-[11px] text-[#6B6B64]">
                          <span className="truncate">{swatch.role}</span>
                          <span className="font-mono tabular-nums">
                            {isCopied ? 'Copied' : swatch.hex}
                          </span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
