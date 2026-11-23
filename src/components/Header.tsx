import React from 'react';

interface HeaderProps {
  activeSection: 'studio' | 'results';
  savedCount: number;
  onNavigateStudio: () => void;
  onScrollToSamples: () => void;
  onOpenLookbook: () => void;
  onTriggerUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  savedCount,
  onNavigateStudio,
  onScrollToSamples,
  onOpenLookbook,
  onTriggerUpload,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E4E4DE] bg-[#F8F8F6]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-3.5 sm:px-6 md:gap-8 md:px-10 md:py-4">
        {/* Zone 1: Single-line brand wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onNavigateStudio();
          }}
          className="font-serif text-[22px] leading-none font-semibold tracking-[-0.01em] text-[#171717] sm:text-[26px] whitespace-nowrap shrink-0"
        >
          Atelier Edit
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 text-sm font-medium text-[#575752] md:flex"
        >
          <button
            type="button"
            onClick={onNavigateStudio}
            className={`cursor-pointer border-b pb-0.5 transition-colors duration-150 whitespace-nowrap shrink-0 ${
              activeSection === 'studio'
                ? 'border-[#171717] text-[#171717]'
                : 'border-transparent hover:border-[#171717]/40 hover:text-[#171717]'
            }`}
          >
            Studio
          </button>
          <button
            type="button"
            onClick={onScrollToSamples}
            className="cursor-pointer border-b border-transparent pb-0.5 transition-colors duration-150 hover:border-[#171717]/40 hover:text-[#171717] whitespace-nowrap shrink-0"
          >
            Sample Pieces
          </button>
          <button
            type="button"
            onClick={onOpenLookbook}
            className="cursor-pointer border-b border-transparent pb-0.5 transition-colors duration-150 hover:border-[#171717]/40 hover:text-[#171717] whitespace-nowrap shrink-0 tabular-nums"
          >
            {savedCount > 0 ? `Lookbook (${savedCount})` : 'Lookbook'}
          </button>
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenLookbook}
            aria-label={`Open Saved Lookbook (${savedCount} saved)`}
            className="inline-flex min-h-[40px] items-center px-1.5 text-xs font-medium text-[#171717] underline-offset-4 hover:underline md:hidden whitespace-nowrap shrink-0 tabular-nums"
          >
            Lookbook{savedCount > 0 ? ` (${savedCount})` : ''}
          </button>
          <button
            type="button"
            onClick={onTriggerUpload}
            className="inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-sm bg-[#141414] px-3.5 py-2 text-xs font-medium text-white transition-colors duration-150 hover:bg-[#2B2B29] sm:px-5 sm:text-sm whitespace-nowrap shrink-0"
          >
            Upload Piece
          </button>
        </div>
      </div>
    </header>
  );
};
