// Browser-side helpers to keep Gemini requests reliable.
//
// Why this exists:
// - Inline image data has practical limits (request size + per-file limits).
// - Gemini 2.5 Flash Image supports up to 3 image parts per prompt on many
//   endpoints. We still want to allow users to upload up to 5 images in the UI.
//
// Strategy:
// - If user uploads 1–3 images: send them as separate image parts (best fidelity).
// - If user uploads 4–5 images: merge into a single collage image and send 1 part.
// - Always downscale/compress to reduce INTERNAL/500 errors caused by oversized payloads.

export type Base64Image = {
  data: string; // base64 bytes (NO data: prefix)
  mimeType: string;
  width: number;
  height: number;
};

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

async function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image'));
    img.src = dataUrl;
  });
}

function containFit(srcW: number, srcH: number, dstW: number, dstH: number) {
  const scale = Math.min(dstW / srcW, dstH / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  const x = (dstW - w) / 2;
  const y = (dstH - h) / 2;
  return { x, y, w, h };
}

async function canvasToJpegBase64(canvas: HTMLCanvasElement, quality: number): Promise<string> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to encode JPEG'))),
      'image/jpeg',
      quality
    );
  });
  const buf = await blob.arrayBuffer();
  // Convert to base64
  let binary = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Resize/compress a single image file to JPEG base64.
 * - maxSide keeps the longest edge under control.
 * - quality defaults to a visually safe value.
 */
export async function fileToResizedJpegBase64(
  file: File,
  opts?: { maxSide?: number; quality?: number; background?: string }
): Promise<Base64Image> {
  const maxSide = opts?.maxSide ?? 1536;
  const quality = opts?.quality ?? 0.9;
  const bg = opts?.background ?? '#111827';

  const dataUrl = await fileToDataUrl(file);
  const img = await loadImageFromDataUrl(dataUrl);

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const scale = Math.min(1, maxSide / Math.max(srcW, srcH));
  const outW = Math.max(1, Math.round(srcW * scale));
  const outH = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, outW, outH);
  ctx.imageSmoothingEnabled = true;
  (ctx as any).imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, outW, outH);

  const b64 = await canvasToJpegBase64(canvas, quality);
  return { data: b64, mimeType: 'image/jpeg', width: outW, height: outH };
}

/**
 * Merge up to 5 images into a single collage JPEG base64.
 * This is used when user uploads 4–5 images so we still send only 1 image part.
 */
export async function filesToCollageJpegBase64(
  files: File[],
  opts?: { maxWidth?: number; cellPadding?: number; quality?: number; background?: string }
): Promise<Base64Image> {
  const maxWidth = opts?.maxWidth ?? 1536;
  const pad = opts?.cellPadding ?? 12;
  const quality = opts?.quality ?? 0.9;
  const bg = opts?.background ?? '#111827';

  const count = Math.min(files.length, 5);
  const imgs = await Promise.all(files.slice(0, count).map(async (f) => {
    const dataUrl = await fileToDataUrl(f);
    const img = await loadImageFromDataUrl(dataUrl);
    return img;
  }));

  // Layout: 1–3 => 1 row, N cols
  // 4 => 2x2
  // 5 => 3 cols x 2 rows
  let cols = 1;
  let rows = 1;
  if (count <= 3) {
    cols = count;
    rows = 1;
  } else if (count === 4) {
    cols = 2;
    rows = 2;
  } else {
    cols = 3;
    rows = 2;
  }

  const cellW = Math.floor((maxWidth - pad * (cols + 1)) / cols);
  const cellH = cellW; // square cells for consistent UI
  const outW = pad + cols * (cellW + pad);
  const outH = pad + rows * (cellH + pad);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, outW, outH);
  ctx.imageSmoothingEnabled = true;
  (ctx as any).imageSmoothingQuality = 'high';

  imgs.forEach((img, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x0 = pad + c * (cellW + pad);
    const y0 = pad + r * (cellH + pad);
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;
    const fit = containFit(srcW, srcH, cellW, cellH);
    ctx.drawImage(img, x0 + fit.x, y0 + fit.y, fit.w, fit.h);
  });

  const b64 = await canvasToJpegBase64(canvas, quality);
  return { data: b64, mimeType: 'image/jpeg', width: outW, height: outH };
}
