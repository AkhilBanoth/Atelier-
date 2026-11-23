import React, { useEffect, useRef, useState } from 'react';
import type { AnalyzedItem, BackdropStyle, OutfitOption } from '../types/stylist';
import {
  renderFlatLayToCanvas,
  type FlatLayHitRegion,
} from '../utils/flatLayCanvas';

interface FlatLayCanvasProps {
  itemImageUrl: string;
  itemName: string;
  itemCategory: AnalyzedItem['category'];
  outfit: OutfitOption;
  backdrop: BackdropStyle;
  highlightedPieceId: string | null;
  onSelectPiece?: (pieceId: string | null) => void;
  className?: string;
}

export const FlatLayCanvas: React.FC<FlatLayCanvasProps> = ({
  itemImageUrl,
  itemName,
  itemCategory,
  outfit,
  backdrop,
  highlightedPieceId,
  onSelectPiece,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hitRegions, setHitRegions] = useState<FlatLayHitRegion[]>([]);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderFlatLayToCanvas(canvas, {
      itemImageUrl,
      itemName,
      itemCategory,
      outfit,
      backdrop,
      highlightedPieceId,
    }).then((res) => {
      if (!cancelled) {
        setHitRegions(res.hitRegions);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [itemImageUrl, itemName, itemCategory, outfit, backdrop, highlightedPieceId]);

  const findRegionAtEvent = (e: React.MouseEvent<HTMLCanvasElement>): FlatLayHitRegion | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    // Search in reverse so foreground accessories register cleanly
    for (let i = hitRegions.length - 1; i >= 0; i--) {
      const r = hitRegions[i];
      if (nx >= r.x && nx <= r.x + r.w && ny >= r.y && ny <= r.y + r.h) {
        return r;
      }
    }
    return null;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSelectPiece) return;
    const region = findRegionAtEvent(e);
    if (!region) {
      onSelectPiece(null);
      return;
    }
    onSelectPiece(region.id === highlightedPieceId ? null : region.id);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const region = findRegionAtEvent(e);
    setHoveredLabel(region ? region.label : null);
  };

  return (
    <div className={`relative overflow-hidden bg-[#EFEFEB] ${className}`}>
      <canvas
        ref={canvasRef}
        data-testid={`flatlay-canvas-${outfit.occasion}`}
        aria-label={`${outfit.occasionLabel} flat-lay outfit: ${outfit.title} featuring ${itemName}`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredLabel(null)}
        className={`block aspect-[4/5] w-full ${onSelectPiece ? 'cursor-pointer' : ''}`}
      />

      {hoveredLabel && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-3 bottom-3 max-w-[85%] truncate rounded-sm bg-[#141414]/88 px-2.5 py-1 text-[11px] font-medium text-white"
        >
          {hoveredLabel}
        </div>
      )}
    </div>
  );
};

export async function downloadCleanFlatLayPng(params: {
  itemImageUrl: string;
  itemName: string;
  itemCategory: AnalyzedItem['category'];
  outfit: OutfitOption;
  backdrop: BackdropStyle;
}): Promise<void> {
  const exportCanvas = document.createElement('canvas');
  await renderFlatLayToCanvas(exportCanvas, {
    ...params,
    highlightedPieceId: null,
  });
  const dataUrl = exportCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  const slug = `${params.outfit.occasion}-${params.outfit.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  link.download = `atelier-edit-${slug}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
