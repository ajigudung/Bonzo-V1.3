// Web Worker: apply tone filters at full resolution

type ToneFilters = {
  saturation: number;
  temperature: number;
  brightness: number;
  contrast: number;
  sharpen: number; // 0..100
  highlights: number;
  shadows: number;
};

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

  const radius = amount < 34 ? 1 : amount < 67 ? 2 : 3;
  const blurred = boxBlurRGB(src, w, h, radius);
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
  }

  return data;
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

function applyToneToImageData(data: ImageData, f: ToneFilters): ImageData {
  const arr = data.data;

  const sat = (f.saturation || 0) / 100;
  const temp = (f.temperature || 0) / 100;
  const bright = (f.brightness || 0) / 100;
  const cont = (f.contrast || 0) / 100;
  const sharpen = Math.max(0, Math.min(100, f.sharpen || 0));
  const hi = (f.highlights || 0) / 100;
  const sh = (f.shadows || 0) / 100;

  const brightOffset = bright * 64;
  const c = cont * 255;
  const contrastFactor = (259 * (c + 255)) / (255 * (259 - c));
  const tempShift = temp * 30;

  for (let i = 0; i < arr.length; i += 4) {
    let r = arr[i];
    let g = arr[i + 1];
    let b = arr[i + 2];

    // Brightness
    r += brightOffset;
    g += brightOffset;
    b += brightOffset;

    // Contrast
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    // Temperature
    r += tempShift;
    b -= tempShift;

    // Saturation
    if (sat !== 0) {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const s = 1 + sat;
      r = lum + (r - lum) * s;
      g = lum + (g - lum) * s;
      b = lum + (b - lum) * s;
    }

    // Highlights / Shadows
    if (hi !== 0 || sh !== 0) {
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (sh !== 0 && lum < 0.55) {
        const w = (0.55 - lum) / 0.55;
        const delta = sh * w * 55;
        r += delta;
        g += delta;
        b += delta;
      }
      if (hi !== 0 && lum > 0.45) {
        const w = (lum - 0.45) / 0.55;
        const delta = hi * w * 55;
        r += delta;
        g += delta;
        b += delta;
      }
    }

    arr[i] = clamp255(r);
    arr[i + 1] = clamp255(g);
    arr[i + 2] = clamp255(b);
  }

  if (sharpen > 0) {
    applyUnsharpMask(data, sharpen);
  }

  return data;
}

self.onmessage = async (ev: MessageEvent<any>) => {
  const msg = ev.data;
  const id = msg?.id;
  try {
    if (msg?.kind !== 'tone_full') {
      (self as any).postMessage({ id, ok: false, error: 'Unknown worker task' });
      return;
    }

    const bmp: ImageBitmap = msg.bitmap;
    const filters: ToneFilters = msg.filters || {
      saturation: 0,
      temperature: 0,
      brightness: 0,
      contrast: 0,
      sharpen: 0,
      highlights: 0,
      shadows: 0,
    };
    const outType: string = msg.type || 'image/png';

    if (typeof OffscreenCanvas === 'undefined') {
      (self as any).postMessage({ id, ok: false, error: 'OffscreenCanvas not supported' });
      return;
    }

    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true } as any);
    if (!ctx) {
      (self as any).postMessage({ id, ok: false, error: 'Canvas not supported' });
      return;
    }

    ctx.drawImage(bmp, 0, 0);
    try {
      (bmp as any).close?.();
    } catch {}

    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyToneToImageData(img, filters);
    ctx.putImageData(img, 0, 0);

    const blob = await (canvas as any).convertToBlob({ type: outType });
    (self as any).postMessage({ id, ok: true, blob });
  } catch (e: any) {
    (self as any).postMessage({ id, ok: false, error: e?.message || 'Worker failed' });
  }
};
