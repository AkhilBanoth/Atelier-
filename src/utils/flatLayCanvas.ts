import type {
  AnalyzedItem,
  BackdropStyle,
  OutfitOption,
  OutfitPiece,
  SilhouetteTemplate,
} from '../types/stylist';
import { loadHtmlImage } from './imageUpload';

export interface FlatLayHitRegion {
  id: string; // 'hero' or piece.id
  label: string;
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  w: number; // normalized 0..1
  h: number; // normalized 0..1
}

export interface FlatLayRenderResult {
  hitRegions: FlatLayHitRegion[];
}

export const FLATLAY_WIDTH = 960;
export const FLATLAY_HEIGHT = 1200;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
}

function shadeHex(hex: string, percent: number): string {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + Math.round(2.55 * percent)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(2.55 * percent)));
  const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(2.55 * percent)));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function isVeryDark(hex: string): boolean {
  const clean = hex.replace('#', '').slice(0, 6);
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  return r * 0.299 + g * 0.587 + b * 0.114 < 62;
}

function isVeryLight(hex: string): boolean {
  const clean = hex.replace('#', '').slice(0, 6);
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  return r * 0.299 + g * 0.587 + b * 0.114 > 215;
}

function drawStudioBackdrop(ctx: CanvasRenderingContext2D, backdrop: BackdropStyle) {
  const w = FLATLAY_WIDTH;
  const h = FLATLAY_HEIGHT;

  if (backdrop === 'travertine') {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#EFECE4');
    grad.addColorStop(0.55, '#E7E2D7');
    grad.addColorStop(1, '#DDD7C9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle mineral travertine veins
    ctx.save();
    for (let i = 0; i < 28; i++) {
      const y = (i * 47 + 23) % h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(
        w * 0.3,
        y + Math.sin(i * 1.4) * 14,
        w * 0.7,
        y - Math.cos(i * 1.1) * 16,
        w,
        y + Math.sin(i * 0.8) * 10
      );
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(130, 118, 98, 0.055)' : 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = i % 3 === 0 ? 12 : 4;
      ctx.stroke();
    }
    // Delicate natural stone pores
    for (let i = 0; i < 160; i++) {
      const px = ((i * 197 + 41) % w);
      const py = ((i * 263 + 89) % h);
      const pw = 2 + (i % 7);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(120, 108, 92, 0.06)' : 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(px, py, pw, 1.5);
    }
    ctx.restore();
  } else if (backdrop === 'linen') {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#F1EEE7');
    grad.addColorStop(1, '#E5DFD3');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle woven flax crosshatch
    ctx.save();
    ctx.strokeStyle = 'rgba(128, 116, 98, 0.045)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  } else {
    // Studio Chalk (default editorial alabaster)
    const grad = ctx.createRadialGradient(w * 0.24, h * 0.18, 80, w * 0.5, h * 0.52, w * 0.92);
    grad.addColorStop(0, '#FAFAF8');
    grad.addColorStop(0.65, '#F4F3EF');
    grad.addColorStop(1, '#EAE8E2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle matte gallery paper texture dots
    ctx.save();
    for (let i = 0; i < 220; i++) {
      const px = (i * 173 + 31) % w;
      const py = (i * 229 + 53) % h;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.018)' : 'rgba(255,255,255,0.25)';
      ctx.fillRect(px, py, 2, 2);
    }
    ctx.restore();
  }

  // Soft directional north-west studio window sheen
  const windowLight = ctx.createLinearGradient(0, 0, w * 0.85, h * 0.85);
  windowLight.addColorStop(0, 'rgba(255, 255, 255, 0.24)');
  windowLight.addColorStop(0.45, 'rgba(255, 255, 255, 0)');
  windowLight.addColorStop(1, 'rgba(23, 23, 20, 0.04)');
  ctx.fillStyle = windowLight;
  ctx.fillRect(0, 0, w, h);

  // Quiet hairline studio mat framing border
  ctx.strokeStyle = 'rgba(23, 23, 20, 0.06)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 24, w - 48, h - 48);
}

/**
 * Extracts a cleanly blended garment cutout if the uploaded photo has a light uniform studio backdrop,
 * or mounts it cleanly on an editorial matte frame if it's a real-world closet/room photo.
 */
function drawUploadedHeroGarment(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  slot: Rect
) {
  const off = document.createElement('canvas');
  const maxDim = 560;
  const aspect = (img.naturalWidth || 3) / (img.naturalHeight || 4);
  const drawW = aspect >= 1 ? maxDim : Math.round(maxDim * aspect);
  const drawH = aspect >= 1 ? Math.round(maxDim / aspect) : maxDim;
  off.width = drawW;
  off.height = drawH;
  const octx = off.getContext('2d');
  if (!octx) return;

  octx.drawImage(img, 0, 0, drawW, drawH);

  let isCleanLightStudio = false;
  try {
    const imgData = octx.getImageData(0, 0, drawW, drawH);
    const data = imgData.data;

    // Sample 4 corners to inspect background luminance and uniformity
    const sampleCoords = [
      [6, 6],
      [drawW - 7, 6],
      [6, drawH - 7],
      [drawW - 7, drawH - 7],
      [Math.floor(drawW / 2), 6],
    ];
    let avgR = 0;
    let avgG = 0;
    let avgB = 0;
    const samples: [number, number, number][] = [];
    for (const [sx, sy] of sampleCoords) {
      const idx = (sy * drawW + sx) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      samples.push([r, g, b]);
      avgR += r;
      avgG += g;
      avgB += b;
    }
    avgR /= samples.length;
    avgG /= samples.length;
    avgB /= samples.length;

    const avgLum = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
    const maxCornerDiff = Math.max(
      ...samples.map(
        ([r, g, b]) => Math.abs(r - avgR) + Math.abs(g - avgG) + Math.abs(b - avgB)
      )
    );

    if (avgLum > 205 && maxCornerDiff < 55) {
      isCleanLightStudio = true;
      // Flood-fill edge-connected background removal so white petals inside a skirt stay opaque!
      const visited = new Uint8Array(drawW * drawH);
      const queue = new Int32Array(drawW * drawH);
      let head = 0;
      let tail = 0;

      const pushIfBg = (x: number, y: number) => {
        const p = y * drawW + x;
        if (visited[p]) return;
        const idx = p * 4;
        const dr = Math.abs(data[idx] - avgR);
        const dg = Math.abs(data[idx + 1] - avgG);
        const db = Math.abs(data[idx + 2] - avgB);
        const dist = dr + dg + db;
        const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        if (dist < 62 && lum > 188) {
          visited[p] = 1;
          queue[tail++] = p;
        }
      };

      for (let x = 0; x < drawW; x++) {
        pushIfBg(x, 0);
        pushIfBg(x, drawH - 1);
      }
      for (let y = 0; y < drawH; y++) {
        pushIfBg(0, y);
        pushIfBg(drawW - 1, y);
      }

      while (head < tail) {
        const p = queue[head++];
        const x = p % drawW;
        const y = (p - x) / drawW;
        data[p * 4 + 3] = 0;
        if (x > 0) pushIfBg(x - 1, y);
        if (x < drawW - 1) pushIfBg(x + 1, y);
        if (y > 0) pushIfBg(x, y - 1);
        if (y < drawH - 1) pushIfBg(x, y + 1);
      }

      // Soften 1px anti-aliased halo along garment perimeter
      for (let y = 1; y < drawH - 1; y++) {
        for (let x = 1; x < drawW - 1; x++) {
          const p = y * drawW + x;
          if (!visited[p]) {
            const touchesBg =
              visited[p - 1] || visited[p + 1] || visited[p - drawW] || visited[p + drawW];
            if (touchesBg) {
              const idx = p * 4;
              const dist =
                Math.abs(data[idx] - avgR) +
                Math.abs(data[idx + 1] - avgG) +
                Math.abs(data[idx + 2] - avgB);
              if (dist < 105) {
                data[idx + 3] = Math.round(data[idx + 3] * 0.45);
              }
            }
          }
        }
      }

      octx.putImageData(imgData, 0, 0);
    }
  } catch {
    isCleanLightStudio = false;
  }

  // Fit inside slot maintaining aspect ratio
  const fitScale = Math.min(slot.w / drawW, slot.h / drawH);
  const finalW = drawW * fitScale;
  const finalH = drawH * fitScale;
  const dx = slot.x + (slot.w - finalW) / 2;
  const dy = slot.y + (slot.h - finalH) / 2;

  ctx.save();
  ctx.translate(dx + finalW / 2, dy + finalH / 2);
  if (slot.rotation) ctx.rotate(slot.rotation);

  if (isCleanLightStudio) {
    ctx.shadowColor = 'rgba(22, 20, 16, 0.22)';
    ctx.shadowBlur = 26;
    ctx.shadowOffsetX = 9;
    ctx.shadowOffsetY = 14;
    ctx.drawImage(off, -finalW / 2, -finalH / 2, finalW, finalH);
  } else {
    // Editorial mounted gallery card for non-studio photos
    const pad = 12;
    ctx.shadowColor = 'rgba(22, 20, 16, 0.16)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-finalW / 2 - pad, -finalH / 2 - pad, finalW + pad * 2, finalH + pad * 2);

    ctx.shadowColor = 'transparent';
    ctx.drawImage(off, -finalW / 2, -finalH / 2, finalW, finalH);

    ctx.strokeStyle = 'rgba(23, 23, 20, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-finalW / 2 - pad, -finalH / 2 - pad, finalW + pad * 2, finalH + pad * 2);
  }

  ctx.restore();
}

function applySoftDropShadow(ctx: CanvasRenderingContext2D, depth = 1) {
  ctx.shadowColor = `rgba(24, 22, 18, ${0.15 * depth})`;
  ctx.shadowBlur = 20 * depth;
  ctx.shadowOffsetX = 7 * depth;
  ctx.shadowOffsetY = 11 * depth;
}

function clearShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function makeFabricGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  baseHex: string,
  sheen = false
): CanvasGradient {
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  if (sheen) {
    grad.addColorStop(0, shadeHex(baseHex, 16));
    grad.addColorStop(0.35, shadeHex(baseHex, 4));
    grad.addColorStop(0.55, shadeHex(baseHex, 18));
    grad.addColorStop(1, shadeHex(baseHex, -12));
  } else {
    grad.addColorStop(0, shadeHex(baseHex, 7));
    grad.addColorStop(0.55, baseHex);
    grad.addColorStop(1, shadeHex(baseHex, -10));
  }
  return grad;
}

function getStrokeTone(baseHex: string): string {
  if (isVeryDark(baseHex)) return 'rgba(255, 255, 255, 0.16)';
  if (isVeryLight(baseHex)) return 'rgba(23, 23, 20, 0.16)';
  return shadeHex(baseHex, -22);
}

function drawEditorialPiece(
  ctx: CanvasRenderingContext2D,
  piece: OutfitPiece,
  slot: Rect
) {
  const { silhouette, colorHex, secondaryColorHex, material } = piece;
  const trim = secondaryColorHex || shadeHex(colorHex, isVeryDark(colorHex) ? 28 : -18);
  const isSilk = /silk|satin|charmeuse|velvet|metallic/i.test(material);
  const isRibbed = /rib|knit|merino|sweater/i.test(material);

  ctx.save();
  ctx.translate(slot.x + slot.w / 2, slot.y + slot.h / 2);
  if (slot.rotation) ctx.rotate(slot.rotation);

  // Normalize coordinate space to centered box [-100..100] scaled cleanly
  const scale = Math.min(slot.w / 220, slot.h / 240);
  ctx.scale(scale, scale);

  const strokeTone = getStrokeTone(colorHex);

  switch (silhouette as SilhouetteTemplate) {
    case 'ribbed-tank': {
      applySoftDropShadow(ctx);
      ctx.beginPath();
      ctx.moveTo(-42, -92);
      ctx.lineTo(-22, -92);
      ctx.quadraticCurveTo(0, -56, 22, -92);
      ctx.lineTo(42, -92);
      ctx.quadraticCurveTo(46, -42, 66, -24);
      ctx.lineTo(62, 92);
      ctx.quadraticCurveTo(0, 98, -62, 92);
      ctx.lineTo(-66, -24);
      ctx.quadraticCurveTo(-46, -42, -42, -92);
      ctx.closePath();
      ctx.fillStyle = makeFabricGradient(ctx, -66, -92, 132, 190, colorHex, isSilk);
      ctx.fill();
      clearShadow(ctx);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Ribbing lines
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = isVeryDark(colorHex)
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(23,23,20,0.06)';
      ctx.lineWidth = 1.3;
      for (let rx = -58; rx <= 58; rx += 6) {
        ctx.beginPath();
        ctx.moveTo(rx, -92);
        ctx.lineTo(rx, 96);
        ctx.stroke();
      }
      ctx.restore();

      // Ribbed neck binding
      ctx.beginPath();
      ctx.moveTo(-25, -88);
      ctx.quadraticCurveTo(0, -48, 25, -88);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 3.5;
      ctx.stroke();
      break;
    }

    case 'silk-camisole': {
      applySoftDropShadow(ctx);
      // Straps
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(-40, -92);
      ctx.lineTo(-42, -48);
      ctx.moveTo(40, -92);
      ctx.lineTo(42, -48);
      ctx.stroke();

      // Fluid draped bias body
      ctx.beginPath();
      ctx.moveTo(-44, -50);
      ctx.quadraticCurveTo(0, -24, 44, -50);
      ctx.quadraticCurveTo(54, -22, 62, -10);
      ctx.lineTo(68, 86);
      ctx.quadraticCurveTo(0, 96, -68, 86);
      ctx.lineTo(-62, -10);
      ctx.quadraticCurveTo(-54, -22, -44, -50);
      ctx.closePath();
      ctx.fillStyle = makeFabricGradient(ctx, -68, -50, 136, 146, colorHex, true);
      ctx.fill();
      clearShadow(ctx);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Soft bias silk fold highlights
      ctx.strokeStyle = isVeryDark(colorHex)
        ? 'rgba(255,255,255,0.12)'
        : 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-28, -28);
      ctx.quadraticCurveTo(-18, 25, -34, 78);
      ctx.moveTo(22, -26);
      ctx.quadraticCurveTo(16, 22, 28, 76);
      ctx.stroke();
      break;
    }

    case 'boxy-tee': {
      applySoftDropShadow(ctx);
      ctx.beginPath();
      ctx.moveTo(-30, -88);
      ctx.quadraticCurveTo(0, -68, 30, -88);
      ctx.lineTo(68, -76);
      ctx.lineTo(98, -22);
      ctx.lineTo(66, -6);
      ctx.lineTo(58, -26);
      ctx.lineTo(60, 88);
      ctx.lineTo(-60, 88);
      ctx.lineTo(-58, -26);
      ctx.lineTo(-66, -6);
      ctx.lineTo(-98, -22);
      ctx.lineTo(-68, -76);
      ctx.closePath();
      ctx.fillStyle = makeFabricGradient(ctx, -98, -88, 196, 176, colorHex, false);
      ctx.fill();
      clearShadow(ctx);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Crew neck collar rib
      ctx.beginPath();
      ctx.moveTo(-30, -84);
      ctx.quadraticCurveTo(0, -61, 30, -84);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 4;
      ctx.stroke();
      break;
    }

    case 'button-down': {
      applySoftDropShadow(ctx);
      ctx.beginPath();
      ctx.moveTo(-26, -94);
      ctx.lineTo(26, -94);
      ctx.lineTo(66, -74);
      ctx.lineTo(94, 52);
      ctx.lineTo(66, 58);
      ctx.lineTo(54, -22);
      ctx.lineTo(56, 86);
      ctx.quadraticCurveTo(0, 96, -56, 86);
      ctx.lineTo(-54, -22);
      ctx.lineTo(-66, 58);
      ctx.lineTo(-94, 52);
      ctx.lineTo(-66, -74);
      ctx.closePath();
      ctx.fillStyle = makeFabricGradient(ctx, -94, -94, 188, 190, colorHex, isSilk);
      ctx.fill();
      clearShadow(ctx);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Sharp collar points
      ctx.beginPath();
      ctx.moveTo(-26, -94);
      ctx.lineTo(-34, -64);
      ctx.lineTo(-4, -72);
      ctx.moveTo(26, -94);
      ctx.lineTo(34, -64);
      ctx.lineTo(4, -72);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.7;
      ctx.stroke();

      // Center placket & buttons
      ctx.beginPath();
      ctx.moveTo(0, -72);
      ctx.lineTo(0, 90);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      for (let by = -48; by <= 64; by += 28) {
        ctx.beginPath();
        ctx.arc(0, by, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = trim;
        ctx.fill();
      }
      break;
    }

    case 'knit-sweater':
    case 'turtleneck':
    case 'cropped-cardigan': {
      const isTurtle = silhouette === 'turtleneck';
      const isCardi = silhouette === 'cropped-cardigan';
      const bottomY = isCardi ? 66 : 86;

      applySoftDropShadow(ctx);
      ctx.beginPath();
      if (isTurtle) {
        ctx.moveTo(-24, -104);
        ctx.lineTo(24, -104);
        ctx.lineTo(28, -80);
      } else {
        ctx.moveTo(-28, -88);
        ctx.quadraticCurveTo(0, isCardi ? -46 : -68, 28, -88);
      }
      ctx.lineTo(66, -72);
      ctx.lineTo(94, 56);
      ctx.lineTo(66, 62);
      ctx.lineTo(54, -22);
      ctx.lineTo(56, bottomY);
      ctx.lineTo(-56, bottomY);
      ctx.lineTo(-54, -22);
      ctx.lineTo(-66, 62);
      ctx.lineTo(-94, 56);
      ctx.lineTo(-66, -72);
      ctx.closePath();
      ctx.fillStyle = makeFabricGradient(ctx, -94, -104, 188, 190, colorHex, false);
      ctx.fill();
      clearShadow(ctx);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      if (isRibbed || isTurtle || isCardi) {
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = isVeryDark(colorHex)
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(23,23,20,0.05)';
        ctx.lineWidth = 1.2;
        for (let x = -90; x <= 90; x += 8) {
          ctx.beginPath();
          ctx.moveTo(x, -104);
          ctx.lineTo(x, bottomY);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Hem ribbing band
      ctx.beginPath();
      ctx.moveTo(-56, bottomY - 14);
      ctx.lineTo(56, bottomY - 14);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.3;
      ctx.stroke();

      if (isCardi) {
        ctx.beginPath();
        ctx.moveTo(0, -60);
        ctx.lineTo(0, bottomY);
        ctx.strokeStyle = strokeTone;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        for (let by = -42; by <= bottomY - 18; by += 24) {
          ctx.beginPath();
          ctx.arc(0, by, 3.8, 0, Math.PI * 2);
          ctx.fillStyle = trim;
          ctx.fill();
        }
      }
      break;
    }

    case 'tailored-blazer':
    case 'trench-coat':
    case 'leather-moto': {
      const isTrench = silhouette === 'trench-coat';
      const isMoto = silhouette === 'leather-moto';
      const hemY = isTrench ? 104 : isMoto ? 66 : 90;

      applySoftDropShadow(ctx, 1.1);
      ctx.beginPath();
      ctx.moveTo(-28, -94);
      ctx.lineTo(28, -94);
      ctx.lineTo(72, -76);
      ctx.lineTo(96, 56);
      ctx.lineTo(68, 62);
      ctx.lineTo(56, -24);
      ctx.lineTo(isTrench ? 64 : 58, hemY);
      ctx.lineTo(isTrench ? -64 : -58, hemY);
      ctx.lineTo(-56, -24);
      ctx.lineTo(-68, 62);
      ctx.lineTo(-96, 56);
      ctx.lineTo(-72, -76);
      ctx.closePath();
      ctx.fillStyle = makeFabricGradient(ctx, -96, -94, 192, hemY + 94, colorHex, isMoto);
      ctx.fill();
      clearShadow(ctx);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Tailored notch lapels
      ctx.beginPath();
      ctx.moveTo(-28, -94);
      ctx.lineTo(-42, -52);
      ctx.lineTo(-26, -44);
      ctx.lineTo(-34, -34);
      ctx.lineTo(0, 6);
      ctx.lineTo(34, -34);
      ctx.lineTo(26, -44);
      ctx.lineTo(42, -52);
      ctx.lineTo(28, -94);
      ctx.fillStyle = shadeHex(colorHex, isVeryDark(colorHex) ? 8 : -7);
      ctx.fill();
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center seam + pockets
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.lineTo(0, hemY);
      ctx.moveTo(-46, 36);
      ctx.lineTo(-18, 36);
      ctx.moveTo(18, 36);
      ctx.lineTo(46, 36);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Buttons or moto zipper
      if (isMoto) {
        ctx.beginPath();
        ctx.moveTo(12, -26);
        ctx.lineTo(12, hemY - 4);
        ctx.strokeStyle = trim;
        ctx.lineWidth = 2.4;
        ctx.stroke();
      } else {
        for (const by of [14, 42]) {
          ctx.beginPath();
          ctx.arc(0, by, 4, 0, Math.PI * 2);
          ctx.fillStyle = trim;
          ctx.fill();
        }
      }
      break;
    }

    case 'wide-trousers':
    case 'straight-denim': {
      const isWide = silhouette === 'wide-trousers';
      applySoftDropShadow(ctx);
      ctx.beginPath();
      ctx.moveTo(-46, -98);
      ctx.lineTo(46, -98);
      ctx.lineTo(isWide ? 66 : 52, 102);
      ctx.lineTo(isWide ? 12 : 8, 102);
      ctx.lineTo(0, -18);
      ctx.lineTo(isWide ? -12 : -8, 102);
      ctx.lineTo(isWide ? -66 : -52, 102);
      ctx.closePath();
      ctx.fillStyle = makeFabricGradient(ctx, -66, -98, 132, 200, colorHex, isSilk);
      ctx.fill();
      clearShadow(ctx);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Waistband & center pleats
      ctx.beginPath();
      ctx.moveTo(-46, -84);
      ctx.lineTo(46, -84);
      ctx.moveTo(0, -98);
      ctx.lineTo(0, -34);
      if (isWide) {
        ctx.moveTo(-26, -84);
        ctx.lineTo(-34, 92);
        ctx.moveTo(26, -84);
        ctx.lineTo(34, 92);
      }
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      break;
    }

    case 'pleated-skirt': {
      applySoftDropShadow(ctx);
      ctx.beginPath();
      ctx.moveTo(-40, -92);
      ctx.lineTo(40, -92);
      ctx.lineTo(74, 92);
      ctx.quadraticCurveTo(0, 100, -74, 92);
      ctx.closePath();
      ctx.fillStyle = makeFabricGradient(ctx, -74, -92, 148, 192, colorHex, isSilk);
      ctx.fill();
      clearShadow(ctx);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Knife pleats
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 11, -80);
        ctx.lineTo(i * 21, 93);
        ctx.strokeStyle = strokeTone;
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
      break;
    }

    case 'slip-dress': {
      applySoftDropShadow(ctx);
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(-34, -104);
      ctx.lineTo(-36, -66);
      ctx.moveTo(34, -104);
      ctx.lineTo(36, -66);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-38, -68);
      ctx.quadraticCurveTo(0, -48, 38, -68);
      ctx.quadraticCurveTo(44, -22, 48, 8);
      ctx.lineTo(58, 102);
      ctx.quadraticCurveTo(0, 110, -58, 102);
      ctx.lineTo(-48, 8);
      ctx.quadraticCurveTo(-44, -22, -38, -68);
      ctx.closePath();
      ctx.fillStyle = makeFabricGradient(ctx, -58, -68, 116, 178, colorHex, true);
      ctx.fill();
      clearShadow(ctx);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      break;
    }

    case 'loafers':
    case 'minimal-sneakers':
    case 'slingback-pumps':
    case 'strappy-heels':
    case 'ankle-boots': {
      const drawSingleShoe = (offsetX: number, offsetY: number, flip: number) => {
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(flip, 1);

        applySoftDropShadow(ctx, 0.9);
        if (silhouette === 'strappy-heels') {
          // Overhead minimalist strappy sandal footbed + straps
          ctx.beginPath();
          ctx.moveTo(-16, -68);
          ctx.quadraticCurveTo(0, -78, 18, -66);
          ctx.quadraticCurveTo(28, -22, 22, 20);
          ctx.quadraticCurveTo(18, 66, 0, 70);
          ctx.quadraticCurveTo(-18, 66, -20, 20);
          ctx.quadraticCurveTo(-24, -22, -16, -68);
          ctx.closePath();
          ctx.fillStyle = shadeHex(colorHex, -8);
          ctx.fill();
          clearShadow(ctx);
          ctx.strokeStyle = strokeTone;
          ctx.lineWidth = 1.4;
          ctx.stroke();

          // Metallic toe & ankle straps
          ctx.fillStyle = makeFabricGradient(ctx, -24, -50, 48, 100, colorHex, true);
          ctx.beginPath();
          ctx.roundRect(-22, -46, 44, 10, 4);
          ctx.roundRect(-19, -8, 38, 9, 4);
          ctx.fill();
          ctx.strokeStyle = trim;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (silhouette === 'slingback-pumps') {
          // Sleek pointed overhead slingback pump with rear strap & leather insole
          // Footbed sole
          ctx.beginPath();
          ctx.moveTo(0, -78);
          ctx.quadraticCurveTo(24, -36, 22, 16);
          ctx.quadraticCurveTo(18, 60, 0, 68);
          ctx.quadraticCurveTo(-18, 60, -22, 16);
          ctx.quadraticCurveTo(-24, -36, 0, -78);
          ctx.closePath();
          ctx.fillStyle = '#E6DAC7';
          ctx.fill();
          clearShadow(ctx);
          ctx.strokeStyle = 'rgba(23,23,20,0.22)';
          ctx.lineWidth = 1.4;
          ctx.stroke();

          // Pointed upper vamp covering toe box
          ctx.beginPath();
          ctx.moveTo(0, -80);
          ctx.quadraticCurveTo(26, -38, 22, -4);
          ctx.quadraticCurveTo(0, -24, -22, -4);
          ctx.quadraticCurveTo(-26, -38, 0, -80);
          ctx.closePath();
          ctx.fillStyle = makeFabricGradient(ctx, -26, -80, 52, 82, colorHex, true);
          ctx.fill();
          ctx.strokeStyle = strokeTone;
          ctx.lineWidth = 1.4;
          ctx.stroke();

          // Delicate slingback ankle strap around heel
          ctx.beginPath();
          ctx.moveTo(-20, -4);
          ctx.quadraticCurveTo(-22, 48, 0, 70);
          ctx.quadraticCurveTo(22, 48, 20, -4);
          ctx.strokeStyle = colorHex;
          ctx.lineWidth = 5;
          ctx.stroke();

          // Subtle insole heel pad + gold foil mark
          ctx.beginPath();
          ctx.roundRect(-8, 24, 16, 26, 6);
          ctx.fillStyle = 'rgba(130, 110, 88, 0.16)';
          ctx.fill();
          ctx.fillStyle = '#C8A55C';
          ctx.fillRect(-5, 34, 10, 2);
        } else if (silhouette === 'minimal-sneakers') {
          // Clean overhead court sneaker
          ctx.beginPath();
          ctx.moveTo(0, -74);
          ctx.quadraticCurveTo(30, -70, 28, -12);
          ctx.quadraticCurveTo(26, 56, 16, 70);
          ctx.quadraticCurveTo(0, 76, -16, 70);
          ctx.quadraticCurveTo(-26, 56, -28, -12);
          ctx.quadraticCurveTo(-30, -70, 0, -74);
          ctx.closePath();
          ctx.fillStyle = makeFabricGradient(ctx, -28, -74, 56, 150, colorHex, false);
          ctx.fill();
          clearShadow(ctx);
          ctx.strokeStyle = trim;
          ctx.lineWidth = 3;
          ctx.stroke();

          // Laces & collar
          ctx.beginPath();
          ctx.ellipse(0, 32, 14, 22, 0, 0, Math.PI * 2);
          ctx.fillStyle = shadeHex(colorHex, -12);
          ctx.fill();
          ctx.strokeStyle = strokeTone;
          ctx.lineWidth = 2;
          for (const ly of [-34, -22, -10, 2]) {
            ctx.beginPath();
            ctx.moveTo(-12, ly);
            ctx.lineTo(12, ly);
            ctx.stroke();
          }
        } else {
          // Loafers / ankle boots overhead
          ctx.beginPath();
          ctx.moveTo(0, -74);
          ctx.quadraticCurveTo(28, -68, 26, -8);
          ctx.quadraticCurveTo(24, 58, 16, 70);
          ctx.quadraticCurveTo(0, 76, -16, 70);
          ctx.quadraticCurveTo(-24, 58, -26, -8);
          ctx.quadraticCurveTo(-28, -68, 0, -74);
          ctx.closePath();
          ctx.fillStyle = makeFabricGradient(ctx, -26, -74, 52, 150, colorHex, true);
          ctx.fill();
          clearShadow(ctx);
          ctx.strokeStyle = strokeTone;
          ctx.lineWidth = 1.6;
          ctx.stroke();

          // Apron stitch + penny strap
          ctx.beginPath();
          ctx.moveTo(-18, -14);
          ctx.quadraticCurveTo(-18, -56, 0, -58);
          ctx.quadraticCurveTo(18, -56, 18, -14);
          ctx.strokeStyle = isVeryDark(colorHex)
            ? 'rgba(255,255,255,0.2)'
            : 'rgba(23,23,20,0.22)';
          ctx.lineWidth = 1.4;
          ctx.stroke();

          ctx.fillStyle = shadeHex(colorHex, isVeryDark(colorHex) ? 10 : -8);
          ctx.beginPath();
          ctx.roundRect(-21, -18, 42, 14, 4);
          ctx.fill();
          ctx.strokeStyle = trim;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.beginPath();
          ctx.ellipse(0, 30, 14, 24, 0, 0, Math.PI * 2);
          ctx.fillStyle = shadeHex(colorHex, -22);
          ctx.fill();
        }
        ctx.restore();
      };

      // Staggered editorial pair
      drawSingleShoe(-34, -6, 1);
      drawSingleShoe(36, 10, -1);
      break;
    }

    case 'tote-bag': {
      applySoftDropShadow(ctx);
      // Leather handles
      ctx.strokeStyle = shadeHex(colorHex, -12);
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(-34, -36);
      ctx.bezierCurveTo(-34, -96, 34, -96, 34, -36);
      ctx.stroke();

      // Trapezoid tote body
      ctx.beginPath();
      ctx.moveTo(-74, -40);
      ctx.lineTo(74, -40);
      ctx.lineTo(62, 78);
      ctx.quadraticCurveTo(0, 84, -62, 78);
      ctx.closePath();
      ctx.fillStyle = makeFabricGradient(ctx, -74, -40, 148, 124, colorHex, false);
      ctx.fill();
      clearShadow(ctx);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Center seam & discreet metal stud
      ctx.beginPath();
      ctx.moveTo(-68, -24);
      ctx.lineTo(68, -24);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, -10, 4, 0, Math.PI * 2);
      ctx.fillStyle = trim;
      ctx.fill();
      break;
    }

    case 'crossbody-bag':
    case 'mini-shoulder-bag': {
      const isMini = silhouette === 'mini-shoulder-bag';
      applySoftDropShadow(ctx);
      // Curved shoulder strap arc
      ctx.strokeStyle = shadeHex(colorHex, -10);
      ctx.lineWidth = isMini ? 5 : 6;
      ctx.beginPath();
      ctx.moveTo(-58, -22);
      ctx.bezierCurveTo(-68, -96, 68, -96, 58, -22);
      ctx.stroke();

      // Structured box flap body
      const bw = isMini ? 128 : 144;
      const bh = isMini ? 76 : 98;
      ctx.beginPath();
      ctx.roundRect(-bw / 2, -26, bw, bh, 12);
      ctx.fillStyle = makeFabricGradient(ctx, -bw / 2, -26, bw, bh, colorHex, isMini);
      ctx.fill();
      clearShadow(ctx);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Front flap curve
      ctx.beginPath();
      ctx.moveTo(-bw / 2, -6);
      ctx.lineTo(-bw / 2, 18);
      ctx.quadraticCurveTo(0, 34, bw / 2, 18);
      ctx.lineTo(bw / 2, -6);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Minimalist metallic clasp
      ctx.fillStyle = trim;
      ctx.beginPath();
      ctx.roundRect(-10, 14, 20, 14, 3);
      ctx.fill();
      break;
    }

    case 'structured-clutch': {
      applySoftDropShadow(ctx);
      // Brass top frame bar
      ctx.fillStyle = trim;
      ctx.beginPath();
      ctx.roundRect(-62, -40, 124, 12, 4);
      ctx.fill();

      // Sleek east-west clutch body
      ctx.beginPath();
      ctx.roundRect(-84, -30, 168, 76, 10);
      ctx.fillStyle = makeFabricGradient(ctx, -84, -30, 168, 76, colorHex, true);
      ctx.fill();
      clearShadow(ctx);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Metallic clasp knob
      ctx.beginPath();
      ctx.arc(0, -40, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = trim;
      ctx.fill();
      break;
    }

    case 'sunglasses': {
      applySoftDropShadow(ctx, 0.75);
      // Left and right acetate frames
      const drawLens = (cx: number) => {
        ctx.beginPath();
        ctx.roundRect(cx - 34, -22, 68, 46, [8, 8, 18, 18]);
        ctx.fillStyle = colorHex;
        ctx.fill();
        clearShadow(ctx);

        ctx.beginPath();
        ctx.roundRect(cx - 27, -15, 54, 32, [4, 4, 13, 13]);
        const lensGrad = ctx.createLinearGradient(cx - 24, -14, cx + 24, 18);
        lensGrad.addColorStop(0, shadeHex(trim, -26));
        lensGrad.addColorStop(0.45, shadeHex(colorHex, -18));
        lensGrad.addColorStop(1, '#1A1816');
        ctx.fillStyle = lensGrad;
        ctx.fill();

        // Subtle studio diagonal glass reflection
        ctx.beginPath();
        ctx.moveTo(cx - 18, -12);
        ctx.lineTo(cx - 4, -12);
        ctx.lineTo(cx - 20, 12);
        ctx.lineTo(cx - 24, 12);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fill();
      };

      drawLens(-40);
      drawLens(40);

      // Bridge
      ctx.fillStyle = colorHex;
      ctx.fillRect(-10, -14, 20, 8);
      break;
    }

    case 'gold-hoops': {
      const drawHoop = (cx: number, cy: number, r: number) => {
        ctx.save();
        applySoftDropShadow(ctx, 0.7);
        const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
        grad.addColorStop(0, shadeHex(colorHex, 28));
        grad.addColorStop(0.45, colorHex);
        grad.addColorStop(1, shadeHex(colorHex, -22));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 13;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0.25, Math.PI * 1.9);
        ctx.stroke();
        clearShadow(ctx);

        // Specular highlight arc
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 2, -Math.PI * 0.75, -Math.PI * 0.25);
        ctx.stroke();
        ctx.restore();
      };
      drawHoop(-32, -8, 28);
      drawHoop(34, 12, 28);
      break;
    }

    case 'sculptural-cuff': {
      applySoftDropShadow(ctx, 0.8);
      const grad = ctx.createLinearGradient(-56, -42, 56, 42);
      grad.addColorStop(0, shadeHex(colorHex, 26));
      grad.addColorStop(0.5, colorHex);
      grad.addColorStop(1, shadeHex(colorHex, -24));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 24;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.ellipse(0, 0, 50, 36, -0.18, 0.45, Math.PI * 1.85);
      ctx.stroke();
      clearShadow(ctx);

      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, 48, 34, -0.18, Math.PI * 1.05, Math.PI * 1.55);
      ctx.stroke();
      break;
    }

    case 'silk-scarf': {
      applySoftDropShadow(ctx, 0.85);
      ctx.beginPath();
      ctx.moveTo(-64, -56);
      ctx.quadraticCurveTo(0, -48, 66, -60);
      ctx.quadraticCurveTo(56, 0, 68, 58);
      ctx.quadraticCurveTo(0, 48, -62, 62);
      ctx.quadraticCurveTo(-52, 0, -64, -56);
      ctx.closePath();
      ctx.fillStyle = makeFabricGradient(ctx, -66, -60, 134, 122, colorHex, true);
      ctx.fill();
      clearShadow(ctx);

      // Editorial framed border stripe
      ctx.strokeStyle = trim;
      ctx.lineWidth = 5;
      ctx.strokeRect(-48, -42, 96, 84);
      break;
    }

    case 'leather-belt': {
      applySoftDropShadow(ctx, 0.8);
      // Coiled editorial leather belt
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.ellipse(0, 0, 56, 32, -0.1, 0, Math.PI * 1.88);
      ctx.stroke();
      clearShadow(ctx);

      // Metallic buckle
      ctx.strokeStyle = trim;
      ctx.lineWidth = 5;
      ctx.strokeRect(42, -16, 22, 26);
      ctx.beginPath();
      ctx.moveTo(42, -3);
      ctx.lineTo(56, -3);
      ctx.stroke();
      break;
    }

    default: {
      applySoftDropShadow(ctx);
      ctx.beginPath();
      ctx.roundRect(-56, -56, 112, 112, 14);
      ctx.fillStyle = makeFabricGradient(ctx, -56, -56, 112, 112, colorHex, false);
      ctx.fill();
      clearShadow(ctx);
      break;
    }
  }

  ctx.restore();
}

/**
 * Computes clean non-overlapping studio flat-lay layout slots tailored to the uploaded item's category.
 */
function buildLayoutSlots(
  itemCategory: AnalyzedItem['category'],
  pieces: OutfitPiece[]
): { heroSlot: Rect; pieceSlots: Map<string, Rect> } {
  const pieceSlots = new Map<string, Rect>();

  const primaryTopOrDress = pieces.find((p) => p.category === 'top' || p.category === 'dress');
  const primaryBottom = pieces.find((p) => p.category === 'bottom');
  const outerwear = pieces.find((p) => p.category === 'outerwear');
  const footwear = pieces.find((p) => p.category === 'footwear');
  const bag = pieces.find((p) => p.category === 'bag');
  const extras = pieces.filter(
    (p) =>
      p !== primaryTopOrDress &&
      p !== primaryBottom &&
      p !== outerwear &&
      p !== footwear &&
      p !== bag
  );

  // Default layout: uploaded item is a bottom (e.g., patterned skirt or trousers)
  if (itemCategory === 'bottom') {
    const heroSlot: Rect = { x: 64, y: 510, w: 460, h: 610, rotation: -0.015 };

    if (primaryTopOrDress && outerwear) {
      pieceSlots.set(primaryTopOrDress.id, { x: 68, y: 82, w: 280, h: 360, rotation: -0.02 });
      pieceSlots.set(outerwear.id, { x: 356, y: 74, w: 300, h: 375, rotation: 0.025 });
    } else if (primaryTopOrDress) {
      pieceSlots.set(primaryTopOrDress.id, { x: 112, y: 86, w: 360, h: 390, rotation: -0.01 });
    } else if (outerwear) {
      pieceSlots.set(outerwear.id, { x: 112, y: 86, w: 360, h: 390, rotation: -0.01 });
    }

    if (bag) {
      pieceSlots.set(bag.id, {
        x: 560,
        y: outerwear ? 462 : 340,
        w: 320,
        h: 280,
        rotation: 0.02,
      });
    }

    if (footwear) {
      pieceSlots.set(footwear.id, { x: 564, y: 770, w: 320, h: 335, rotation: -0.02 });
    }

    const extraSpots: Rect[] = outerwear
      ? [
          { x: 690, y: 110, w: 200, h: 170, rotation: 0.03 },
          { x: 690, y: 284, w: 200, h: 155, rotation: -0.03 },
        ]
      : [
          { x: 568, y: 110, w: 300, h: 190, rotation: 0.02 },
          { x: 560, y: 610, w: 200, h: 145, rotation: -0.03 },
        ];

    extras.forEach((p, idx) => {
      const spot = extraSpots[idx] ?? {
        x: 680,
        y: 120 + idx * 170,
        w: 200,
        h: 150,
      };
      pieceSlots.set(p.id, spot);
    });

    return { heroSlot, pieceSlots };
  }

  // Uploaded item is top or outerwear (e.g., cobalt tweed jacket)
  if (itemCategory === 'top' || itemCategory === 'outerwear') {
    const heroSlot: Rect = { x: 66, y: 86, w: 460, h: 495, rotation: -0.015 };

    if (primaryBottom) {
      pieceSlots.set(primaryBottom.id, { x: 96, y: 610, w: 395, h: 515, rotation: 0.01 });
    } else if (primaryTopOrDress && itemCategory === 'outerwear') {
      pieceSlots.set(primaryTopOrDress.id, { x: 108, y: 618, w: 375, h: 500, rotation: 0.01 });
    }

    if (primaryTopOrDress && primaryBottom) {
      // Layering top sits cleanly top-right
      pieceSlots.set(primaryTopOrDress.id, { x: 568, y: 88, w: 310, h: 330, rotation: 0.02 });
    } else if (outerwear && itemCategory === 'top') {
      pieceSlots.set(outerwear.id, { x: 568, y: 88, w: 310, h: 340, rotation: 0.02 });
    }

    const hasTopRight =
      (primaryTopOrDress && primaryBottom) || (outerwear && itemCategory === 'top');

    if (bag) {
      pieceSlots.set(bag.id, {
        x: 564,
        y: hasTopRight ? 446 : 330,
        w: 320,
        h: 280,
        rotation: -0.02,
      });
    }

    if (footwear) {
      pieceSlots.set(footwear.id, { x: 566, y: 762, w: 320, h: 340, rotation: 0.02 });
    }

    const extraSpots: Rect[] = hasTopRight
      ? [
          { x: 566, y: 670, w: 170, h: 110, rotation: -0.03 },
          { x: 740, y: 670, w: 160, h: 110, rotation: 0.03 },
        ]
      : [
          { x: 572, y: 112, w: 300, h: 185, rotation: 0.02 },
          { x: 572, y: 615, w: 220, h: 135, rotation: -0.03 },
        ];

    // If top-right is occupied and we have 1 extra, place it cleanly top-right corner or beside bag
    extras.forEach((p, idx) => {
      if (hasTopRight) {
        pieceSlots.set(
          p.id,
          idx === 0
            ? { x: 718, y: 362, w: 178, h: 135, rotation: 0.04 }
            : { x: 550, y: 362, w: 165, h: 135, rotation: -0.03 }
        );
      } else {
        pieceSlots.set(
          p.id,
          extraSpots[idx] ?? { x: 640, y: 120 + idx * 180, w: 220, h: 150 }
        );
      }
    });

    return { heroSlot, pieceSlots };
  }

  // Fallback for dress, footwear, or bag hero item
  const heroSlot: Rect = { x: 72, y: 140, w: 450, h: 740, rotation: -0.01 };
  const rightSlots: Rect[] = [
    { x: 562, y: 92, w: 320, h: 330, rotation: 0.02 },
    { x: 562, y: 446, w: 320, h: 280, rotation: -0.02 },
    { x: 562, y: 758, w: 320, h: 330, rotation: 0.02 },
    { x: 96, y: 904, w: 220, h: 190, rotation: -0.02 },
    { x: 336, y: 904, w: 210, h: 190, rotation: 0.02 },
  ];
  pieces.forEach((p, idx) => {
    pieceSlots.set(p.id, rightSlots[idx % rightSlots.length]);
  });

  return { heroSlot, pieceSlots };
}

export async function renderFlatLayToCanvas(
  canvas: HTMLCanvasElement,
  params: {
    itemImageUrl: string;
    itemName: string;
    itemCategory: AnalyzedItem['category'];
    outfit: OutfitOption;
    backdrop: BackdropStyle;
    highlightedPieceId?: string | null;
  }
): Promise<FlatLayRenderResult> {
  canvas.width = FLATLAY_WIDTH;
  canvas.height = FLATLAY_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { hitRegions: [] };

  drawStudioBackdrop(ctx, params.backdrop);

  const { heroSlot, pieceSlots } = buildLayoutSlots(params.itemCategory, params.outfit.pieces);
  const hitRegions: FlatLayHitRegion[] = [];

  // Draw the user's real uploaded garment photograph
  try {
    const heroImg = await loadHtmlImage(params.itemImageUrl);
    drawUploadedHeroGarment(ctx, heroImg, heroSlot);
  } catch {
    // Graceful editorial frame fallback if image fails to load
    ctx.save();
    ctx.fillStyle = '#E6E4DD';
    ctx.fillRect(heroSlot.x + 24, heroSlot.y + 24, heroSlot.w - 48, heroSlot.h - 48);
    ctx.restore();
  }

  hitRegions.push({
    id: 'hero',
    label: params.itemName,
    x: heroSlot.x / FLATLAY_WIDTH,
    y: heroSlot.y / FLATLAY_HEIGHT,
    w: heroSlot.w / FLATLAY_WIDTH,
    h: heroSlot.h / FLATLAY_HEIGHT,
  });

  // Draw all paired pieces
  for (const piece of params.outfit.pieces) {
    const slot = pieceSlots.get(piece.id);
    if (!slot) continue;
    drawEditorialPiece(ctx, piece, slot);

    hitRegions.push({
      id: piece.id,
      label: piece.name,
      x: slot.x / FLATLAY_WIDTH,
      y: slot.y / FLATLAY_HEIGHT,
      w: slot.w / FLATLAY_WIDTH,
      h: slot.h / FLATLAY_HEIGHT,
    });
  }

  // Subtle editorial highlight indicator if user selected a piece (never baked into exports when highlightedPieceId is null)
  if (params.highlightedPieceId) {
    const region = hitRegions.find((r) => r.id === params.highlightedPieceId);
    if (region) {
      ctx.save();
      ctx.strokeStyle = '#263B59';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(
        region.x * FLATLAY_WIDTH + 6,
        region.y * FLATLAY_HEIGHT + 6,
        region.w * FLATLAY_WIDTH - 12,
        region.h * FLATLAY_HEIGHT - 12
      );
      ctx.restore();
    }
  }

  // Quiet bottom-left palette bar subtly stamped into the studio mat edge
  const swatches = params.outfit.paletteUsed.slice(0, 5);
  if (swatches.length > 0) {
    ctx.save();
    const startX = 48;
    const baseY = FLATLAY_HEIGHT - 56;
    swatches.forEach((hex, idx) => {
      ctx.fillStyle = hex;
      ctx.fillRect(startX + idx * 24, baseY, 18, 12);
      ctx.strokeStyle = 'rgba(23, 23, 20, 0.14)';
      ctx.lineWidth = 1;
      ctx.strokeRect(startX + idx * 24, baseY, 18, 12);
    });
    ctx.restore();
  }

  return { hitRegions };
}
