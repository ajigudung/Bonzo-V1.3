export type ToneFilters = {
  saturation: number; // -100..100
  temperature: number; // -100..100 (cooler..warmer)
  brightness: number; // -100..100
  contrast: number; // -100..100
  sharpen: number; // 0..100 (unsharp mask amount)
  highlights: number; // -100..100
  shadows: number; // -100..100
};

export const defaultToneFilters: ToneFilters = {
  saturation: 0,
  temperature: 0,
  brightness: 0,
  contrast: 0,
  sharpen: 0,
  highlights: 0,
  shadows: 0,
};

export function isToneNeutral(f: ToneFilters): boolean {
  return (
    !f ||
    (f.saturation === 0 &&
      f.temperature === 0 &&
      f.brightness === 0 &&
      f.contrast === 0 &&
      (f.sharpen || 0) === 0 &&
      f.highlights === 0 &&
      f.shadows === 0)
  );
}

// ---------- Unsharp mask (fast box-blur based) ----------

function boxBlurRGB(src: Uint8ClampedArray, w: number, h: number, radius: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(src.length);
  if (radius <= 0) {
    out.set(src);
    return out;
  }
  const tmp = new Uint8ClampedArray(src.length);
  const div = radius * 2 + 1;

  // Horizontal blur
  for (let y = 0; y < h; y++) {
    let rsum = 0,
      gsum = 0,
      bsum = 0;

    // init window
    for (let i = -radius; i <= radius; i++) {
      const x = Math.min(w - 1, Math.max(0, i));
      const idx = (y * w + x) * 4;
      rsum += src[idx];
      gsum += src[idx + 1];
      bsum += src[idx + 2];
    }

    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      tmp[idx] = rsum / div;
      tmp[idx + 1] = gsum / div;
      tmp[idx + 2] = bsum / div;
      tmp[idx + 3] = src[idx + 3];

      const xAdd = Math.min(w - 1, x + radius + 1);
      const xSub = Math.max(0, x - radius);
      const idxAdd = (y * w + xAdd) * 4;
      const idxSub = (y * w + xSub) * 4;
      rsum += src[idxAdd] - src[idxSub];
      gsum += src[idxAdd + 1] - src[idxSub + 1];
      bsum += src[idxAdd + 2] - src[idxSub + 2];
    }
  }

  // Vertical blur
  for (let x = 0; x < w; x++) {
    let rsum = 0,
      gsum = 0,
      bsum = 0;

    for (let i = -radius; i <= radius; i++) {
      const y = Math.min(h - 1, Math.max(0, i));
      const idx = (y * w + x) * 4;
      rsum += tmp[idx];
      gsum += tmp[idx + 1];
      bsum += tmp[idx + 2];
    }

    for (let y = 0; y < h; y++) {
      const idx = (y * w + x) * 4;
      out[idx] = rsum / div;
      out[idx + 1] = gsum / div;
      out[idx + 2] = bsum / div;
      out[idx + 3] = tmp[idx + 3];

      const yAdd = Math.min(h - 1, y + radius + 1);
      const ySub = Math.max(0, y - radius);
      const idxAdd = (yAdd * w + x) * 4;
      const idxSub = (ySub * w + x) * 4;
      rsum += tmp[idxAdd] - tmp[idxSub];
      gsum += tmp[idxAdd + 1] - tmp[idxSub + 1];
      bsum += tmp[idxAdd + 2] - tmp[idxSub + 2];
    }
  }

  return out;
}

function applyUnsharpMask(data: ImageData, amount0to100: number): ImageData {
  const amount = Math.max(0, Math.min(100, amount0to100 || 0));
  if (amount <= 0) return data;

  const w = data.width;
  const h = data.height;
  const src = data.data;

  // Radius heuristic: small and fast (1..3)
  const radius = amount < 34 ? 1 : amount < 67 ? 2 : 3;
  const blurred = boxBlurRGB(src, w, h, radius);

  // Strength heuristic: 0..1.5
  const strength = (amount / 100) * 1.35;

  for (let i = 0; i < src.length; i += 4) {
    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];

    const br = blurred[i];
    const bg = blurred[i + 1];
    const bb = blurred[i + 2];

    src[i] = clamp255(r + (r - br) * strength);
    src[i + 1] = clamp255(g + (g - bg) * strength);
    src[i + 2] = clamp255(b + (b - bb) * strength);
    // alpha unchanged
  }
  return data;
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/**
 * In-place tone adjustment (fast, good-enough for photo restoration tweaks).
 * This intentionally avoids heavy color-management; it’s designed for UX and speed.
 */
export function applyToneToImageData(data: ImageData, f: ToneFilters): ImageData {
  const arr = data.data;

  const sat = (f.saturation || 0) / 100; // -1..1
  const temp = (f.temperature || 0) / 100; // -1..1
  const bright = (f.brightness || 0) / 100; // -1..1
  const cont = (f.contrast || 0) / 100; // -1..1
  const hi = (f.highlights || 0) / 100; // -1..1
  const sh = (f.shadows || 0) / 100; // -1..1
  const sharpen = Math.max(0, Math.min(100, f.sharpen || 0));

  // Brightness scale: +/- 0.25 * 255 ≈ +/- 64
  const brightOffset = bright * 64;

  // Contrast factor around mid gray.
  // cont in [-1..1] -> c in [-255..255]
  const c = cont * 255;
  const contrastFactor = (259 * (c + 255)) / (255 * (259 - c));

  // Temperature: push R up & B down when warm; opposite when cool
  const tempShift = temp * 30; // +/-30

  for (let i = 0; i < arr.length; i += 4) {
    let r = arr[i];
    let g = arr[i + 1];
    let b = arr[i + 2];

    // 1) Brightness
    r += brightOffset;
    g += brightOffset;
    b += brightOffset;

    // 2) Contrast
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    // 3) Temperature
    r += tempShift;
    b -= tempShift;

    // 4) Saturation (luma blend)
    if (sat !== 0) {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const s = 1 + sat;
      r = lum + (r - lum) * s;
      g = lum + (g - lum) * s;
      b = lum + (b - lum) * s;
    }

    // 5) Highlights / Shadows (simple tonal curve)
    if (hi !== 0 || sh !== 0) {
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255; // 0..1

      // Shadows affect darker tones more
      if (sh !== 0 && lum < 0.55) {
        const w = (0.55 - lum) / 0.55; // 0..1
        const delta = sh * w * 55; // +/-55
        r += delta;
        g += delta;
        b += delta;
      }

      // Highlights affect brighter tones more
      if (hi !== 0 && lum > 0.45) {
        const w = (lum - 0.45) / 0.55; // 0..1
        const delta = hi * w * 55; // +/-55
        r += delta;
        g += delta;
        b += delta;
      }
    }

    arr[i] = clamp255(r);
    arr[i + 1] = clamp255(g);
    arr[i + 2] = clamp255(b);
    // alpha unchanged
  }

  // 6) Sharpen (unsharp mask) - done after tone changes
  if (sharpen > 0) {
    applyUnsharpMask(data, sharpen);
  }

  return data;
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to encode image'))), type, quality);
  });
}

/**
 * Real-time preview filter (runs on main thread) at a capped resolution.
 */
export async function applyToneToBlobPreview(
  input: Blob,
  f: ToneFilters,
  opts: { maxEdgePx?: number; mimeType?: string } = {}
): Promise<Blob> {
  if (isToneNeutral(f)) return input;
  if (typeof document === 'undefined') return input;
  if (typeof createImageBitmap !== 'function') return input;

  const bmp = await createImageBitmap(input);
  try {
    const srcW = bmp.width;
    const srcH = bmp.height;
    const maxEdge = Math.max(1, opts.maxEdgePx ?? 1600);
    const scale = Math.min(1, maxEdge / Math.max(srcW, srcH));
    const outW = Math.max(1, Math.round(srcW * scale));
    const outH = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true } as any);
    if (!ctx) return input;

    ctx.imageSmoothingEnabled = true;
    (ctx as any).imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, outW, outH);

    const img = ctx.getImageData(0, 0, outW, outH);
    applyToneToImageData(img, f);
    ctx.putImageData(img, 0, 0);

    const type = opts.mimeType || 'image/png';
    return await canvasToBlob(canvas, type);
  } finally {
    try { (bmp as any).close?.(); } catch {}
  }
}

// ===================== WORKER BRIDGE =====================

let _worker: Worker | null = null;
let _workerReady = false;
const _pending = new Map<string, { resolve: Function; reject: Function }>();

function uid(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (_worker) return _worker;
  try {
    _worker = new Worker(new URL('./imageFilters.worker.ts', import.meta.url), { type: 'module' });
    _worker.onmessage = (ev: MessageEvent<any>) => {
      const msg = ev.data;
      const p = _pending.get(msg?.id);
      if (!p) return;
      _pending.delete(msg.id);
      if (msg.ok) p.resolve(msg);
      else p.reject(new Error(msg.error || 'Worker failed'));
    };
    _worker.onerror = () => {
      _workerReady = false;
    };
    _workerReady = true;
    return _worker;
  } catch {
    _worker = null;
    _workerReady = false;
    return null;
  }
}

async function runWorker(payload: any, transfer: Transferable[] = []) {
  const w = getWorker();
  if (!w || !_workerReady) throw new Error('Worker unavailable');
  return await new Promise<any>((resolve, reject) => {
    _pending.set(payload.id, { resolve, reject });
    w.postMessage(payload, transfer);
  });
}

/**
 * Full-resolution tone filter (runs in worker). Use this for final export/apply.
 */
export async function applyToneToBlobFull(input: Blob, f: ToneFilters): Promise<Blob> {
  if (isToneNeutral(f)) return input;

  const w = getWorker();
  if (!w || typeof createImageBitmap !== 'function') {
    // fallback: main thread (may be slower for large images)
    return await applyToneToBlobPreview(input, f, { maxEdgePx: Number.MAX_SAFE_INTEGER, mimeType: input.type || 'image/png' });
  }

  const id = uid();
  const bmp = await createImageBitmap(input);
  try {
    const res = await runWorker(
      {
        id,
        kind: 'tone_full',
        bitmap: bmp,
        filters: f,
        type: input.type || 'image/png',
      },
      [bmp]
    );
    return res.blob as Blob;
  } finally {
    // bmp ownership transferred to worker; no close here
  }
}
