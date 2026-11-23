import React from 'react';

export const AnalyzingSkeleton: React.FC = () => {
  return (
    <section
      aria-live="polite"
      aria-busy="true"
      className="mx-auto max-w-[1280px] px-6 py-14 md:px-10"
    >
      <div className="rounded-sm border border-[#E4E4DE] bg-white p-8">
        <p className="text-xs font-medium text-[#6B6B64]">
          Studio Analysis In Progress
        </p>
        <h2 className="mt-2 font-serif text-3xl font-medium text-[#171717]">
          Reading fabric palette and composing three flat-lay outfits…
        </h2>
        <p className="mt-2 text-sm text-[#575752]">
          Extracting dominant and bridge tones, balancing proportions for Casual, Business, and
          Night Out.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {['01. Casual', '02. Business', '03. Night Out'].map((label) => (
            <div
              key={label}
              className="overflow-hidden rounded-sm border border-[#EFEFEB] bg-[#FAF9F6]"
            >
              <div className="aspect-[4/5] w-full animate-pulse bg-[#EFEFEB]" />
              <div className="space-y-2.5 p-5">
                <p className="text-xs font-medium text-[#6B6B64]">{label}</p>
                <div className="h-5 w-2/3 animate-pulse rounded-xs bg-[#E7E6DF]" />
                <div className="h-3.5 w-full animate-pulse rounded-xs bg-[#EFEFEB]" />
                <div className="h-3.5 w-4/5 animate-pulse rounded-xs bg-[#EFEFEB]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
