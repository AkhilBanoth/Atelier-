import React, { useState } from 'react';
import { ArrowUpRight, Shirt } from 'lucide-react';
import type { SamplePiece } from '../types/stylist';

interface SampleGalleryProps {
  samples: SamplePiece[];
  activeSampleId?: string | null;
  onSelectSample: (sample: SamplePiece) => void;
}

export const SampleGallery: React.FC<SampleGalleryProps> = ({
  samples,
  activeSampleId,
  onSelectSample,
}) => {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <section
      id="sample-pieces"
      aria-labelledby="sample-pieces-heading"
      className="border-t border-[#E4E4DE] bg-white"
    >
      <div className="mx-auto max-w-[1280px] px-6 py-14 md:px-10 md:py-18">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium text-[#6B6B64]">
              Curated Wardrobe Tests
            </p>
            <h2
              id="sample-pieces-heading"
              className="mt-2 font-serif text-[clamp(1.75rem,2.6vw,2.35rem)] leading-tight font-medium text-[#171717]"
            >
              Start with a difficult-to-match piece
            </h2>
          </div>
          <p className="max-w-[44ch] text-sm leading-relaxed text-[#575752]">
            Select any statement garment below to inspect its extracted color architecture and three
            distinct studio flat-lays immediately.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {samples.map((sample) => {
            const isSelected = activeSampleId === sample.id;
            const imgFailed = Boolean(failedImages[sample.id]);
            return (
              <article
                key={sample.id}
                className={`group flex flex-col overflow-hidden rounded-sm border bg-[#F8F8F6] transition-transform duration-150 hover:-translate-y-0.5 ${
                  isSelected ? 'border-[#171717]' : 'border-[#E4E4DE]'
                }`}
              >
                <div className="aspect-[3/4] w-full overflow-hidden bg-[#F2F1EC]">
                  {!imgFailed ? (
                    <img
                      src={sample.imageUrl}
                      alt={sample.title}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [sample.id]: true }))
                      }
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#7A7A73]">
                      <Shirt className="h-8 w-8 opacity-40" aria-hidden="true" />
                      <span className="text-xs">{sample.title}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between bg-white p-5">
                  <div>
                    <p className="text-xs text-[#6B6B64]">{sample.categoryLabel}</p>
                    <h3 className="mt-1 font-serif text-[22px] leading-snug font-medium text-[#171717]">
                      {sample.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#575752]">
                      {sample.difficultyNote}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#EFEFEB] pt-4">
                    <div className="flex items-center gap-1.5" aria-label="Garment palette preview">
                      {sample.presetResult.item.palette.slice(0, 4).map((swatch) => (
                        <span
                          key={swatch.hex}
                          title={`${swatch.name} (${swatch.hex})`}
                          className="h-3.5 w-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: swatch.hex }}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectSample(sample)}
                      className="inline-flex min-h-[36px] cursor-pointer items-center gap-1 text-sm font-medium text-[#171717] transition-colors hover:text-[#263B59] whitespace-nowrap shrink-0"
                    >
                      View 3 Outfits
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
