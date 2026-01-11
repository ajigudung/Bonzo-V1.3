import type { AspectRatioOption, CropMode } from './promptTuning';

const A3_RATIO = Math.SQRT2;

// A3 @ 150 dpi, then 3× upscaling (preview requirement).
// 420mm (16.535in) * 150dpi * 3 ≈ 7441 px (long edge)
export const A3_PREVIEW_LONG_EDGE_PX = 7441;

// Export size presets (long-edge)
export const OUTPUT_LONG_EDGE_PX: Record<'2k' | '4k' | '8k', number> = {
  '2k': 2048,
  '4k': 3840,
  '8k': 7680,
};

export function safeName(s: string) {
  return (
    (s || 'result')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60) || 'result'
  );
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => {
    try { URL.revokeObjectURL(url); } catch {}
  }, 1500);
}

export async function urlToBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  return await res.blob();
}

async function blobToImageBitmap(blob: Blob): Promise<ImageBitmap> {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('createImageBitmap is not supported');
  }
  return await createImageBitmap(blob);
}

function parseRatio(r: string): { w: number; h: number } | null {
  const m = String(r)
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return null;
  return { w, h };
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to encode image'))), type, quality);
  });
}

async function loadBitmapFromAny(input: string | Blob): Promise<{ bitmap: ImageBitmap; cleanup: () => void }>{
  const blob = typeof input === 'string' ? await urlToBlob(input) : input;
  const bmp = await blobToImageBitmap(blob);
  return {
    bitmap: bmp,
    cleanup: () => {
      try { (bmp as any).close?.(); } catch {}
    },
  };
}

// ===================== WORKER BRIDGE =====================

let _worker: Worker | null = null;
let _workerReady = false;
const _pending = new Map<string, { resolve: Function; reject: Function }>();

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (_worker) return _worker;
  try {
    _worker = new Worker(new URL('./imageExport.worker.ts', import.meta.url), { type: 'module' });
    _worker.onmessage = (ev: MessageEvent<any>) => {
      const msg = ev.data;
      const p = _pending.get(msg?.id);
      if (!p) return;
      _pending.delete(msg.id);
      if (msg.ok) p.resolve(msg);
      else p.reject(new Error(msg.error || 'Worker failed'));
    };
    _worker.onerror = () => {
      // If worker crashes, fallback to main thread
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

function uid(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

async function runWorker(payload: any, transfer: Transferable[] = []) {
  const w = getWorker();
  if (!w || !_workerReady) throw new Error('Worker unavailable');
  const id = payload.id;
  return await new Promise<any>((resolve, reject) => {
    _pending.set(id, { resolve, reject });
    w.postMessage(payload, transfer);
  });
}

// ===================== MAIN IMPLEMENTATIONS =====================

async function buildA3PreviewMain(input: string | Blob): Promise<{ blob: Blob; width: number; height: number }> {
  const { bitmap, cleanup } = await loadBitmapFromAny(input);
  try {
    const srcW = bitmap.width;
    const srcH = bitmap.height;
    const isPortrait = srcH >= srcW;

    const outLong = A3_PREVIEW_LONG_EDGE_PX;
    const outShort = Math.max(1, Math.round(outLong / A3_RATIO));
    const outW = isPortrait ? outShort : outLong;
    const outH = isPortrait ? outLong : outShort;

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outW, outH);
    ctx.imageSmoothingEnabled = true;
    (ctx as any).imageSmoothingQuality = 'high';

    const scale = Math.min(outW / srcW, outH / srcH);
    const drawW = srcW * scale;
    const drawH = srcH * scale;
    const dx = (outW - drawW) / 2;
    const dy = (outH - drawH) / 2;

    ctx.drawImage(bitmap, dx, dy, drawW, drawH);

    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
    return { blob, width: outW, height: outH };
  } finally {
    cleanup();
  }
}

async function buildSizedOutputMain(
  input: string | Blob,
  opts: { longEdgePx: number; aspectRatio: AspectRatioOption; cropMode: CropMode }
): Promise<{ blob: Blob; width: number; height: number }> {
  const { bitmap, cleanup } = await loadBitmapFromAny(input);
  try {
    const srcW = bitmap.width;
    const srcH = bitmap.height;

    const r = opts.aspectRatio !== 'original' ? parseRatio(opts.aspectRatio) : null;
    const ratio = r ? r.w / r.h : srcW / srcH;
    const isPortrait = ratio < 1;

    const outLong = opts.longEdgePx;
    const outH = isPortrait ? outLong : Math.max(1, Math.round(outLong / ratio));
    const outW = isPortrait ? Math.max(1, Math.round(outLong * ratio)) : outLong;

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.imageSmoothingEnabled = true;
    (ctx as any).imageSmoothingQuality = 'high';

    if (opts.cropMode === 'fit') {
      // Blurred background (cover)
      ctx.save();
      (ctx as any).filter = 'blur(22px)';
      const coverScale = Math.max(outW / srcW, outH / srcH);
      const cw = srcW * coverScale;
      const ch = srcH * coverScale;
      ctx.drawImage(bitmap, (outW - cw) / 2, (outH - ch) / 2, cw, ch);
      ctx.restore();

      const containScale = Math.min(outW / srcW, outH / srcH);
      const dw = srcW * containScale;
      const dh = srcH * containScale;
      ctx.drawImage(bitmap, (outW - dw) / 2, (outH - dh) / 2, dw, dh);
    } else {
      // Fill (cover crop)
      const scale = Math.max(outW / srcW, outH / srcH);
      const dw = srcW * scale;
      const dh = srcH * scale;
      ctx.drawImage(bitmap, (outW - dw) / 2, (outH - dh) / 2, dw, dh);
    }

    const blob = await canvasToBlob(canvas, 'image/png');
    return { blob, width: outW, height: outH };
  } finally {
    cleanup();
  }
}

// ===================== PUBLIC API =====================

export async function buildA3PreviewBlob(input: string | Blob): Promise<{ blob: Blob; width: number; height: number }> {
  // Prefer worker if supported
  try {
    const w = getWorker();
    if (w && typeof createImageBitmap === 'function') {
      const id = uid();
      const blob = typeof input === 'string' ? await urlToBlob(input) : input;
      const bmp = await createImageBitmap(blob);
      const res = await runWorker(
        {
          id,
          kind: 'a3_preview',
          bitmap: bmp,
          longEdgePx: A3_PREVIEW_LONG_EDGE_PX,
          type: 'image/jpeg',
          quality: 0.92,
        },
        [bmp]
      );
      return { blob: res.blob, width: res.width, height: res.height };
    }
  } catch {
    // ignore and fallback
  }
  return await buildA3PreviewMain(input);
}

export async function buildSizedOutputBlob(
  input: string | Blob,
  opts: { longEdgePx: number; aspectRatio: AspectRatioOption; cropMode: CropMode }
): Promise<{ blob: Blob; width: number; height: number }> {
  // Prefer worker if supported
  try {
    const w = getWorker();
    if (w && typeof createImageBitmap === 'function') {
      const id = uid();
      const blob = typeof input === 'string' ? await urlToBlob(input) : input;
      const bmp = await createImageBitmap(blob);
      const res = await runWorker(
        {
          id,
          kind: 'sized_output',
          bitmap: bmp,
          longEdgePx: opts.longEdgePx,
          aspectRatio: opts.aspectRatio,
          cropMode: opts.cropMode,
          type: 'image/png',
        },
        [bmp]
      );
      return { blob: res.blob, width: res.width, height: res.height };
    }
  } catch {
    // ignore and fallback
  }
  return await buildSizedOutputMain(input, opts);
}

export async function applyAspectRatioToBlob(
  input: string | Blob,
  opts: { aspectRatio: AspectRatioOption; cropMode: CropMode }
): Promise<{ blob: Blob; width: number; height: number }> {
  // If original, just return the original blob
  if (opts.aspectRatio === 'original') {
    const blob = typeof input === 'string' ? await urlToBlob(input) : input;
    const bmp = await createImageBitmap(blob);
    const width = bmp.width;
    const height = bmp.height;
    try { (bmp as any).close?.(); } catch {}
    return { blob, width, height };
  }
  // Keep source long-edge
  const blob = typeof input === 'string' ? await urlToBlob(input) : input;
  const bmp = await createImageBitmap(blob);
  const longEdge = Math.max(bmp.width, bmp.height);
  try { (bmp as any).close?.(); } catch {}
  return await buildSizedOutputBlob(blob, { longEdgePx: longEdge, aspectRatio: opts.aspectRatio, cropMode: opts.cropMode });
}
