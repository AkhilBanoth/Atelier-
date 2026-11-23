import type {
  AnalyzedItem,
  ColorSwatch,
  GarmentCategory,
  OccasionId,
  OutfitOption,
  OutfitPiece,
  SavedLook,
  SeasonPreference,
  SilhouetteTemplate,
  StylingResult,
} from '../types/stylist';

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export const VALID_SILHOUETTES: ReadonlySet<SilhouetteTemplate> = new Set<SilhouetteTemplate>([
  'boxy-tee',
  'ribbed-tank',
  'silk-camisole',
  'button-down',
  'knit-sweater',
  'turtleneck',
  'tailored-blazer',
  'cropped-cardigan',
  'trench-coat',
  'leather-moto',
  'wide-trousers',
  'straight-denim',
  'pleated-skirt',
  'slip-dress',
  'loafers',
  'minimal-sneakers',
  'strappy-heels',
  'slingback-pumps',
  'ankle-boots',
  'tote-bag',
  'crossbody-bag',
  'structured-clutch',
  'mini-shoulder-bag',
  'gold-hoops',
  'sculptural-cuff',
  'silk-scarf',
  'sunglasses',
  'leather-belt',
]);

export const VALID_CATEGORIES: ReadonlySet<GarmentCategory> = new Set<GarmentCategory>([
  'top',
  'bottom',
  'outerwear',
  'dress',
  'footwear',
  'bag',
  'accessory',
  'eyewear',
  'belt',
]);

export function isAllowedMimeType(mime: unknown): mime is (typeof ALLOWED_MIME_TYPES)[number] {
  return typeof mime === 'string' && (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
}

export function sanitizeTextHint(input: unknown, maxLen = 160): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function normalizeSeason(input: unknown): SeasonPreference {
  if (input === 'spring-summer' || input === 'autumn-winter' || input === 'all-season') {
    return input;
  }
  return 'all-season';
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  cleanBase64?: string;
  byteLength?: number;
}

/**
 * Validates base64 image payload, byte size, and magic bytes matching the declared MIME type.
 */
export function validateBase64Image(
  rawBase64: unknown,
  mimeType: unknown
): ImageValidationResult {
  if (!isAllowedMimeType(mimeType)) {
    return {
      valid: false,
      error: 'Unsupported image format. Please upload a JPEG, PNG, or WebP photograph.',
    };
  }
  if (typeof rawBase64 !== 'string' || rawBase64.trim().length < 32) {
    return {
      valid: false,
      error: 'Image data is missing or incomplete. Please choose a valid photo.',
    };
  }

  const stripped = rawBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '').replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]+=*$/.test(stripped) || stripped.length % 4 !== 0) {
    return {
      valid: false,
      error: 'The uploaded image could not be decoded. Please try another file.',
    };
  }

  const padding = stripped.endsWith('==') ? 2 : stripped.endsWith('=') ? 1 : 0;
  const byteLength = Math.floor((stripped.length * 3) / 4) - padding;
  if (byteLength <= 0 || byteLength > MAX_IMAGE_BYTES) {
    return {
      valid: false,
      error: 'Image exceeds the 5 MB upload limit. Please use a smaller photo.',
    };
  }

  const headerBytes = decodeBase64Prefix(stripped, 16);
  if (!matchesMagicBytes(headerBytes, mimeType)) {
    return {
      valid: false,
      error: 'File content does not match the declared image format.',
    };
  }

  return {
    valid: true,
    cleanBase64: stripped,
    byteLength,
  };
}

function decodeBase64Prefix(base64: string, maxBytes: number): Uint8Array {
  const charsNeeded = Math.ceil(maxBytes / 3) * 4;
  const slice = base64.slice(0, charsNeeded);
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(slice, 'base64');
    return new Uint8Array(buf.buffer, buf.byteOffset, Math.min(buf.byteLength, maxBytes));
  }
  const binary = atob(slice);
  const out = new Uint8Array(Math.min(binary.length, maxBytes));
  for (let i = 0; i < out.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function matchesMagicBytes(
  bytes: Uint8Array,
  mimeType: (typeof ALLOWED_MIME_TYPES)[number]
): boolean {
  if (bytes.length < 12) return false;
  if (mimeType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  if (mimeType === 'image/webp') {
    return (
      bytes[0] === 0x52 && // R
      bytes[1] === 0x49 && // I
      bytes[2] === 0x46 && // F
      bytes[3] === 0x46 && // F
      bytes[8] === 0x57 && // W
      bytes[9] === 0x45 && // E
      bytes[10] === 0x42 && // B
      bytes[11] === 0x50 // P
    );
  }
  return false;
}

export function normalizeHexColor(value: unknown, fallback = '#2B2B29'): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  const sixDigit = /^#?([0-9a-fA-F]{6})$/.exec(trimmed);
  if (sixDigit) {
    return `#${sixDigit[1].toUpperCase()}`;
  }
  const threeDigit = /^#?([0-9a-fA-F]{3})$/.exec(trimmed);
  if (threeDigit) {
    const [r, g, b] = threeDigit[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return fallback;
}

export function getContrastTextColor(hex: string): '#171717' | '#FFFFFF' {
  const clean = normalizeHexColor(hex, '#2B2B29').slice(1);
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const linear = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return luminance > 0.42 ? '#171717' : '#FFFFFF';
}

export function fallbackSilhouetteForCategory(category: GarmentCategory): SilhouetteTemplate {
  switch (category) {
    case 'top':
      return 'knit-sweater';
    case 'bottom':
      return 'wide-trousers';
    case 'outerwear':
      return 'tailored-blazer';
    case 'dress':
      return 'slip-dress';
    case 'footwear':
      return 'loafers';
    case 'bag':
      return 'crossbody-bag';
    case 'eyewear':
      return 'sunglasses';
    case 'belt':
      return 'leather-belt';
    case 'accessory':
    default:
      return 'gold-hoops';
  }
}

export function isSafeImageUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim()) return false;
  if (url.startsWith('/src/assets/images/') || url.startsWith('/assets/')) {
    return !url.includes('..');
  }
  return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(url);
}

const OCCASION_ORDER: OccasionId[] = ['casual', 'business', 'night_out'];
const OCCASION_LABELS: Record<OccasionId, 'Casual' | 'Business' | 'Night Out'> = {
  casual: 'Casual',
  business: 'Business',
  night_out: 'Night Out',
};

const SWATCH_ROLES: ColorSwatch['role'][] = [
  'Dominant',
  'Secondary',
  'Accent',
  'Neutral Anchor',
  'Bridge Tone',
];

export function normalizeStylingPayload(
  raw: Record<string, unknown>,
  itemImageUrl: string,
  season: SeasonPreference
): StylingResult {
  const rawItem = (raw.item ?? {}) as Record<string, unknown>;
  const itemCategoryRaw = String(rawItem.category ?? 'bottom').toLowerCase();
  const itemCategory: AnalyzedItem['category'] =
    itemCategoryRaw === 'top' ||
    itemCategoryRaw === 'bottom' ||
    itemCategoryRaw === 'outerwear' ||
    itemCategoryRaw === 'dress' ||
    itemCategoryRaw === 'footwear' ||
    itemCategoryRaw === 'bag'
      ? itemCategoryRaw
      : 'bottom';

  const rawPalette = Array.isArray(rawItem.palette) ? rawItem.palette : [];
  const palette: ColorSwatch[] = rawPalette.slice(0, 5).map((entry, idx) => {
    const obj = (entry ?? {}) as Record<string, unknown>;
    const roleCandidate = String(obj.role ?? '');
    const role = SWATCH_ROLES.includes(roleCandidate as ColorSwatch['role'])
      ? (roleCandidate as ColorSwatch['role'])
      : SWATCH_ROLES[idx % SWATCH_ROLES.length];
    const propNum = Number(obj.proportion);
    return {
      name: sanitizeTextHint(obj.name, 40) || `Tone ${idx + 1}`,
      hex: normalizeHexColor(obj.hex, '#3A3A36'),
      role,
      proportion: Number.isFinite(propNum) ? Math.min(75, Math.max(5, Math.round(propNum))) : 20,
    };
  });

  if (palette.length === 0) {
    palette.push(
      { name: 'Charcoal Slate', hex: '#2D3033', role: 'Dominant', proportion: 45 },
      { name: 'Warm Ivory', hex: '#F2EFE9', role: 'Neutral Anchor', proportion: 30 },
      { name: 'Burnished Ochre', hex: '#B48446', role: 'Accent', proportion: 25 }
    );
  }

  const item: AnalyzedItem = {
    name: sanitizeTextHint(rawItem.name, 80) || 'Statement Wardrobe Piece',
    category: itemCategory,
    silhouette: sanitizeTextHint(rawItem.silhouette, 60) || 'Structured silhouette',
    pattern: sanitizeTextHint(rawItem.pattern, 60) || 'Textured weave',
    fabric: sanitizeTextHint(rawItem.fabric, 60) || 'Mid-weight natural blend',
    formalityRange: sanitizeTextHint(rawItem.formalityRange, 60) || 'Smart Casual to Evening',
    styleSummary:
      sanitizeTextHint(rawItem.styleSummary, 260) ||
      'A distinct anchor piece balanced best with clean tonal neutrals and deliberate texture contrast.',
    stylingChallenge:
      sanitizeTextHint(rawItem.stylingChallenge, 220) ||
      'Balancing visual texture and color weight without competing prints.',
    palette,
  };

  const rawOutfits = Array.isArray(raw.outfits) ? raw.outfits : [];
  const outfitsByOccasion = new Map<OccasionId, OutfitOption>();

  for (const entry of rawOutfits) {
    const obj = (entry ?? {}) as Record<string, unknown>;
    const occRaw = String(obj.occasion ?? '')
      .toLowerCase()
      .replace(/[\s-]+/g, '_');
    const occasion: OccasionId =
      occRaw === 'casual' || occRaw === 'business' || occRaw === 'night_out'
        ? occRaw
        : !outfitsByOccasion.has('casual')
          ? 'casual'
          : !outfitsByOccasion.has('business')
            ? 'business'
            : 'night_out';

    if (outfitsByOccasion.has(occasion)) continue;

    const rawPieces = Array.isArray(obj.pieces) ? obj.pieces : [];
    const pieces: OutfitPiece[] = rawPieces.slice(0, 6).map((p, pIdx) => {
      const po = (p ?? {}) as Record<string, unknown>;
      const catRaw = String(po.category ?? 'accessory').toLowerCase() as GarmentCategory;
      const category: GarmentCategory = VALID_CATEGORIES.has(catRaw) ? catRaw : 'accessory';
      const silRaw = String(po.silhouette ?? '').toLowerCase() as SilhouetteTemplate;
      const silhouette: SilhouetteTemplate = VALID_SILHOUETTES.has(silRaw)
        ? silRaw
        : fallbackSilhouetteForCategory(category);

      return {
        id: `${occasion}-piece-${pIdx + 1}`,
        name: sanitizeTextHint(po.name, 70) || 'Complementary Piece',
        category,
        silhouette,
        colorName: sanitizeTextHint(po.colorName, 40) || 'Neutral',
        colorHex: normalizeHexColor(po.colorHex, '#E8E4DC'),
        secondaryColorHex: po.secondaryColorHex
          ? normalizeHexColor(po.secondaryColorHex, '#C8A96A')
          : undefined,
        material: sanitizeTextHint(po.material, 50) || 'Natural fiber',
        fitNotes: sanitizeTextHint(po.fitNotes, 90) || 'Relaxed tailored fit',
        stylingReason:
          sanitizeTextHint(po.stylingReason, 180) ||
          'Echoes a key undertone in your uploaded piece for effortless cohesion.',
      };
    });

    const paletteUsedRaw = Array.isArray(obj.paletteUsed) ? obj.paletteUsed : [];
    const paletteUsed =
      paletteUsedRaw.length > 0
        ? paletteUsedRaw.slice(0, 5).map((h) => normalizeHexColor(h, '#2B2B29'))
        : pieces.slice(0, 4).map((p) => p.colorHex);

    outfitsByOccasion.set(occasion, {
      id: `outfit-${occasion}-${Date.now().toString(36)}`,
      occasion,
      occasionLabel: OCCASION_LABELS[occasion],
      title: sanitizeTextHint(obj.title, 70) || `${OCCASION_LABELS[occasion]} Edit`,
      vibe: sanitizeTextHint(obj.vibe, 80) || 'Clean editorial balance',
      colorHarmony: sanitizeTextHint(obj.colorHarmony, 60) || 'Tonal Contrast',
      stylistNote:
        sanitizeTextHint(obj.stylistNote, 260) ||
        'Anchors your hero item with quiet, structured proportions and cohesive tones.',
      proportionTip:
        sanitizeTextHint(obj.proportionTip, 180) ||
        'Keep hemlines clean and define the waist to maintain balance.',
      paletteUsed,
      pieces,
    });
  }

  const orderedOutfits: OutfitOption[] = OCCASION_ORDER.map((occ) => {
    const existing = outfitsByOccasion.get(occ);
    if (existing) return existing;
    throw new Error(`Missing required outfit option for occasion: ${occ}`);
  });

  return {
    id: `session-${Date.now().toString(36)}`,
    source: 'ai',
    itemImageUrl,
    season,
    createdAt: new Date().toISOString(),
    item,
    outfits: orderedOutfits,
  };
}

export function toggleSavedLook(existing: SavedLook[], candidate: SavedLook): SavedLook[] {
  const alreadySaved = existing.some((item) => item.id === candidate.id);
  if (alreadySaved) {
    return existing.filter((item) => item.id !== candidate.id);
  }
  return [candidate, ...existing];
}

export function removeSavedLook(existing: SavedLook[], lookId: string): SavedLook[] {
  return existing.filter((item) => item.id !== lookId);
}
