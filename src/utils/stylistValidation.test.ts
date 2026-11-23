import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getContrastTextColor,
  isAllowedMimeType,
  isSafeImageUrl,
  normalizeHexColor,
  normalizeStylingPayload,
  removeSavedLook,
  toggleSavedLook,
  validateBase64Image,
} from './stylistValidation';
import type { SavedLook } from '../types/stylist';

// Minimal valid 1x1 PNG header bytes (plus padding so length >= 32 chars)
const VALID_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

// Minimal valid JPEG magic bytes (FF D8 FF E0 ...)
const VALID_JPEG_BASE64 = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
  0x00, 0x01, 0x00, 0x00, 0xff, 0xd9, 0x00, 0x00,
]).toString('base64');

test('isAllowedMimeType accepts jpeg, png, webp and rejects svg/gif', () => {
  assert.equal(isAllowedMimeType('image/jpeg'), true);
  assert.equal(isAllowedMimeType('image/png'), true);
  assert.equal(isAllowedMimeType('image/webp'), true);
  assert.equal(isAllowedMimeType('image/svg+xml'), false);
  assert.equal(isAllowedMimeType('text/html'), false);
});

test('validateBase64Image verifies magic bytes and rejects mismatched MIME types', () => {
  const validPng = validateBase64Image(`data:image/png;base64,${VALID_PNG_BASE64}`, 'image/png');
  assert.equal(validPng.valid, true);
  assert.ok(validPng.cleanBase64 && validPng.cleanBase64.length > 0);

  const validJpeg = validateBase64Image(VALID_JPEG_BASE64, 'image/jpeg');
  assert.equal(validJpeg.valid, true);

  // PNG bytes sent as JPEG should fail magic byte verification
  const spoofed = validateBase64Image(VALID_PNG_BASE64, 'image/jpeg');
  assert.equal(spoofed.valid, false);
  assert.match(spoofed.error ?? '', /does not match/i);

  // SVG MIME rejected immediately
  const svg = validateBase64Image(VALID_PNG_BASE64, 'image/svg+xml');
  assert.equal(svg.valid, false);
});

test('normalizeHexColor and getContrastTextColor calculate valid contrast pairs', () => {
  assert.equal(normalizeHexColor('#abc'), '#AABBCC');
  assert.equal(normalizeHexColor('1f3d2e'), '#1F3D2E');
  assert.equal(normalizeHexColor('not-a-color', '#112233'), '#112233');

  assert.equal(getContrastTextColor('#FFFFFF'), '#171717');
  assert.equal(getContrastTextColor('#F4EFE6'), '#171717');
  assert.equal(getContrastTextColor('#153A2B'), '#FFFFFF');
  assert.equal(getContrastTextColor('#141414'), '#FFFFFF');
});

test('isSafeImageUrl blocks javascript: and non-image data URLs', () => {
  assert.equal(isSafeImageUrl('/src/assets/images/sample_botanical_skirt_1795414262844.jpg'), true);
  assert.equal(isSafeImageUrl(`data:image/png;base64,${VALID_PNG_BASE64}`), true);
  assert.equal(isSafeImageUrl('javascript:alert(1)'), false);
  assert.equal(isSafeImageUrl('data:text/html;base64,PHNjcmlwdD4='), false);
  assert.equal(isSafeImageUrl('/src/assets/images/../../etc/passwd'), false);
});

test('normalizeStylingPayload orders Casual, Business, Night Out and normalizes invalid silhouettes', () => {
  const raw = {
    item: {
      name: 'Emerald Botanical Skirt',
      category: 'bottom',
      palette: [
        { name: 'Forest', hex: '1b4332', role: 'Dominant', proportion: 52 },
        { name: 'Ochre', hex: '#c89b3c', role: 'Accent', proportion: 28 },
      ],
    },
    outfits: [
      {
        occasion: 'night_out',
        title: 'Evening Silk Edit',
        pieces: [
          {
            name: 'Black Silk Cami',
            category: 'top',
            silhouette: 'unknown-shape',
            colorName: 'Obsidian',
            colorHex: '#111',
          },
        ],
      },
      {
        occasion: 'casual',
        title: 'Gallery Morning',
        pieces: [
          {
            name: 'Ivory Ribbed Tank',
            category: 'top',
            silhouette: 'ribbed-tank',
            colorName: 'Ivory',
            colorHex: '#f5f2eb',
          },
        ],
      },
      {
        occasion: 'business',
        title: 'Studio Tailoring',
        pieces: [
          {
            name: 'Structured Blazer',
            category: 'outerwear',
            silhouette: 'tailored-blazer',
            colorName: 'Espresso',
            colorHex: '#3c2a21',
          },
        ],
      },
    ],
  };

  const result = normalizeStylingPayload(raw, '/src/assets/images/test.jpg', 'all-season');
  assert.equal(result.outfits.length, 3);
  assert.deepEqual(
    result.outfits.map((o) => o.occasion),
    ['casual', 'business', 'night_out']
  );
  // Unknown silhouette falls back safely based on category ('top' -> 'knit-sweater')
  assert.equal(result.outfits[2].pieces[0].silhouette, 'knit-sweater');
  assert.equal(result.outfits[2].pieces[0].colorHex, '#111111');
  assert.equal(result.item.palette[0].hex, '#1B4332');
});

test('toggleSavedLook adds, deduplicates, and removes saved looks immutably', () => {
  const mockLook: SavedLook = {
    id: 'look-1',
    savedAt: '2026-11-22T00:00:00.000Z',
    itemName: 'Botanical Skirt',
    itemImageUrl: '/src/assets/images/sample.jpg',
    itemCategory: 'bottom',
    backdrop: 'travertine',
    outfit: {
      id: 'outfit-casual',
      occasion: 'casual',
      occasionLabel: 'Casual',
      title: 'Gallery Walk',
      vibe: 'Relaxed',
      colorHarmony: 'Tonal',
      stylistNote: 'Clean pairing',
      proportionTip: 'Tuck in',
      paletteUsed: ['#1B4332'],
      pieces: [],
    },
  };

  const added = toggleSavedLook([], mockLook);
  assert.equal(added.length, 1);
  assert.equal(added[0].id, 'look-1');

  const toggledOff = toggleSavedLook(added, mockLook);
  assert.equal(toggledOff.length, 0);

  const removed = removeSavedLook(added, 'look-1');
  assert.equal(removed.length, 0);
});
