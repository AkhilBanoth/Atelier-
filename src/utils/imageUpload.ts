import { ALLOWED_MIME_TYPES, MAX_IMAGE_BYTES } from './stylistValidation';

export interface PreparedImageUpload {
  dataUrl: string;
  base64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  fileName: string;
  width: number;
  height: number;
}

const MAX_DIMENSION = 960;

export async function prepareImageFile(file: File): Promise<PreparedImageUpload> {
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    throw new Error('Please choose a JPEG, PNG, or WebP photograph of your garment.');
  }
  if (file.size > MAX_IMAGE_BYTES * 3) {
    throw new Error('This file is larger than 15 MB. Please pick a smaller image.');
  }

  const rawDataUrl = await readFileAsDataUrl(file);
  const img = await loadHtmlImage(rawDataUrl);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const targetWidth = Math.max(1, Math.round((img.naturalWidth || 800) * scale));
  const targetHeight = Math.max(1, Math.round((img.naturalHeight || 800) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not process this image in the browser.');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  let outputMime: 'image/jpeg' | 'image/png' | 'image/webp' =
    file.type === 'image/png' && file.size < 600_000 ? 'image/png' : 'image/jpeg';
  let compressedDataUrl = canvas.toDataURL(outputMime, 0.84);
  if (outputMime === 'image/png' && compressedDataUrl.length > 900_000) {
    outputMime = 'image/jpeg';
    compressedDataUrl = canvas.toDataURL('image/jpeg', 0.84);
  }
  const base64 = compressedDataUrl.split(',')[1] ?? '';

  return {
    dataUrl: compressedDataUrl,
    base64,
    mimeType: outputMime,
    fileName: file.name,
    width: targetWidth,
    height: targetHeight,
  };
}

export async function loadImageUrlAsBase64(imageUrl: string): Promise<{
  base64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}> {
  if (imageUrl.startsWith('data:image/')) {
    const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(imageUrl);
    if (match) {
      return {
        mimeType: match[1] as 'image/jpeg' | 'image/png' | 'image/webp',
        base64: match[2],
      };
    }
  }

  const img = await loadHtmlImage(imageUrl);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const width = Math.max(1, Math.round((img.naturalWidth || 800) * scale));
  const height = Math.max(1, Math.round((img.naturalHeight || 800) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas unavailable.');
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  return {
    mimeType: 'image/jpeg',
    base64: dataUrl.split(',')[1] ?? '',
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read the selected file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the selected file.'));
    reader.readAsDataURL(file);
  });
}

export function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load garment photograph.'));
    img.src = src;
  });
}
