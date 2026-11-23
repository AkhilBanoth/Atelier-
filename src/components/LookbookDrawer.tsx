import React, { useEffect } from 'react';
import { Bookmark, Download, Trash2, X } from 'lucide-react';
import type { SavedLook } from '../types/stylist';
import { FlatLayCanvas, downloadCleanFlatLayPng } from './FlatLayCanvas';

interface LookbookDrawerProps {
  open: boolean;
  savedLooks: SavedLook[];
  onClose: () => void;
  onRemoveLook: (id: string) => void;
}

export const LookbookDrawer: React.FC<LookbookDrawerProps> = ({
  open,
  savedLooks,
  onClose,
  onRemoveLook,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lookbook-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-[#141414]/45 backdrop-blur-[1px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-full w-full max-w-[460px] flex-col border-l border-[#E4E4DE] bg-[#F8F8F6] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E4E4DE] bg-white px-6 py-5">
          <div>
            <h2
              id="lookbook-drawer-title"
              className="font-serif text-2xl font-medium text-[#171717]"
            >
              Saved Lookbook
            </h2>
            <p className="mt-0.5 text-xs text-[#6B6B64] tabular-nums">
              {savedLooks.length === 0
                ? 'No outfits saved yet'
                : `${savedLooks.length} saved ${savedLooks.length === 1 ? 'flat-lay' : 'flat-lays'}`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Saved Lookbook"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm border border-[#E4E4DE] text-[#575752] transition-colors hover:bg-[#F8F8F6] hover:text-[#171717]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {savedLooks.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <Bookmark className="h-7 w-7 text-[#8A8A83]" aria-hidden="true" />
              <p className="mt-4 font-serif text-xl text-[#171717]">Your lookbook is empty</p>
              <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-[#575752]">
                Save any Casual, Business, or Night Out flat-lay to compare combinations and export
                them later.
              </p>
            </div>
          ) : (
            <ul className="space-y-6">
              {savedLooks.map((entry) => (
                <li
                  key={entry.id}
                  className="overflow-hidden rounded-sm border border-[#E4E4DE] bg-white"
                >
                  <div className="grid grid-cols-12 items-stretch">
                    <div className="col-span-5 border-r border-[#EFEFEB] bg-[#EFEFEB]">
                      <FlatLayCanvas
                        itemImageUrl={entry.itemImageUrl}
                        itemName={entry.itemName}
                        itemCategory={entry.itemCategory}
                        outfit={entry.outfit}
                        backdrop={entry.backdrop}
                        highlightedPieceId={null}
                      />
                    </div>
                    <div className="col-span-7 flex flex-col justify-between p-4">
                      <div>
                        <p className="text-[11px] text-[#6B6B64]">
                          {entry.outfit.occasionLabel} · {entry.outfit.pieces.length + 1} pieces
                        </p>
                        <h3 className="mt-1 font-serif text-xl leading-snug font-medium text-[#171717]">
                          {entry.outfit.title}
                        </h3>
                        <p className="mt-1 truncate text-xs text-[#575752]">{entry.itemName}</p>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#EFEFEB] pt-3">
                        <button
                          type="button"
                          onClick={() =>
                            void downloadCleanFlatLayPng({
                              itemImageUrl: entry.itemImageUrl,
                              itemName: entry.itemName,
                              itemCategory: entry.itemCategory,
                              outfit: entry.outfit,
                              backdrop: entry.backdrop,
                            })
                          }
                          aria-label={`Download PNG for ${entry.outfit.title}`}
                          className="inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 text-xs font-medium text-[#171717] hover:text-[#263B59] whitespace-nowrap"
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          Export PNG
                        </button>

                        <button
                          type="button"
                          onClick={() => onRemoveLook(entry.id)}
                          aria-label={`Remove ${entry.outfit.title} from Lookbook`}
                          className="inline-flex min-h-[34px] cursor-pointer items-center gap-1 text-xs font-medium text-[#7A271E] hover:underline whitespace-nowrap"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
