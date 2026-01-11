/// <reference lib="webworker" />

// Web Worker for heavy canvas resizing/cropping to keep UI responsive.
// Uses OffscreenCanvas + ImageBitmap.

export type WorkerRequest =
  | {
      id: string;
      kind: 'a3_preview';
      bitmap: ImageBitmap;
      longEdgePx: number;
      type: string;
      quality?: number;
    }
  | {
      id: string;
      kind: 'sized_output';
      bitmap: ImageBitmap;
      longEdgePx: number;
      aspectRatio: 'original' | string;
      cropMode: 'fit' | 'fill';
      type: string;
      quality?: number;
    };

export type WorkerResponse =
  | { id: string; ok: true; blob: Blob; width: number; height: number }
  | { id: string; ok: false; error: string };

const A3_RATIO = Math.SQRT2;

function parseRatio(r: string): { w: number; h: number } | null {
  const m = String(r).trim().match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return null;
  return { w, h };
}

async function canvasToBlob(canvas: OffscreenCanvas, type: string, quality?: number): Promise<Blob> {
  // OffscreenCanvas in workers uses convertToBlob
  return await canvas.convertToBlob({ type, quality });
}

async function buildA3PrintBlob(
  bitmap: ImageBitmap,
  longEdgePx: number,
  opts: { type: string; quality?: number }
): Promise<{ blob: Blob; width: number; height: number }> {
  const srcW = bitmap.width;
  const srcH = bitmap.height;
  const isPortrait = srcH >= srcW;

  const outLong = longEdgePx;
  const outShort = Math.max(1, Math.round(outLong / A3_RATIO));
  const outW = isPortrait ? outShort : outLong;
  const outH = isPortrait ? outLong : outShort;

  const canvas = new OffscreenCanvas(outW, outH);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outW, outH);

  ctx.imageSmoothingEnabled = true;
  // @ts-ignore
  ctx.imageSmoothingQuality = 'high';

  // Contain (no crop), center
  const scale = Math.min(outW / srcW, outH / srcH);
  const drawW = srcW * scale;
  const drawH = srcH * scale;
  const dx = (outW - drawW) / 2;
  const dy = (outH - drawH) / 2;

  ctx.drawImage(bitmap, dx, dy, drawW, drawH);

  const blob = await canvasToBlob(canvas, opts.type, opts.quality);
  return { blob, width: outW, height: outH };
}

async function buildSizedOutputBlob(
  bitmap: ImageBitmap,
  opts: { longEdgePx: number; aspectRatio: 'original' | string; cropMode: 'fit' | 'fill'; type: string; quality?: number }
): Promise<{ blob: Blob; width: number; height: number }> {
  const srcW = bitmap.width;
  const srcH = bitmap.height;

  const r = opts.aspectRatio && opts.aspectRatio !== 'original' ? parseRatio(opts.aspectRatio) : null;
  const ratio = r ? r.w / r.h : srcW / srcH;
  const isPortrait = ratio < 1;

  const outLong = opts.longEdgePx;
  const outH = isPortrait ? outLong : Math.max(1, Math.round(outLong / ratio));
  const outW = isPortrait ? Math.max(1, Math.round(outLong * ratio)) : outLong;

  const canvas = new OffscreenCanvas(outW, outH);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.imageSmoothingEnabled = true;
  // @ts-ignore
  ctx.imageSmoothingQuality = 'high';

  if (opts.cropMode === 'fit') {
    // Blurred background (cover)
    ctx.save();
    // @ts-ignore
    ctx.filter = 'blur(22px)';
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

  const blob = await canvasToBlob(canvas, opts.type, opts.quality);
  return { blob, width: outW, height: outH };
}

self.onmessage = async (ev: MessageEvent<WorkerRequest>) => {
  const msg = ev.data;
  try {
    if (!msg || !msg.id) return;

    if (msg.kind === 'a3_preview') {
      const out = await buildA3PrintBlob(msg.bitmap, msg.longEdgePx, { type: msg.type, quality: msg.quality });
      (self as any).postMessage({ id: msg.id, ok: true, blob: out.blob, width: out.width, height: out.height } satisfies WorkerResponse);
      try { msg.bitmap.close(); } catch {}
      return;
    }

    if (msg.kind === 'sized_output') {
      const out = await buildSizedOutputBlob(msg.bitmap, {
        longEdgePx: msg.longEdgePx,
        aspectRatio: msg.aspectRatio,
        cropMode: msg.cropMode,
        type: msg.type,
        quality: msg.quality,
      });
      (self as any).postMessage({ id: msg.id, ok: true, blob: out.blob, width: out.width, height: out.height } satisfies WorkerResponse);
      try { msg.bitmap.close(); } catch {}
      return;
    }

    (self as any).postMessage({ id: msg.id, ok: false, error: 'Unknown request kind' } satisfies WorkerResponse);
  } catch (e: any) {
    try {
      (self as any).postMessage({ id: msg?.id ?? 'unknown', ok: false, error: String(e?.message ?? e ?? 'Worker error') } satisfies WorkerResponse);
    } catch {}
  }
};
