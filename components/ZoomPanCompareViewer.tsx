import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type CropMode = 'fit' | 'fill';
type ViewerMode = 'single' | 'compare';

type Size = { w: number; h: number };

type PreviewSingle = {
  url: string;
  size: Size;
  owned: boolean; // apakah URL ini dibuat oleh viewer (perlu revoke)
};

type PreviewCompare = {
  beforeUrl: string;
  afterUrl: string;
  size: Size;
  ownedBefore: boolean;
  ownedAfter: boolean;
};

async function loadImage(url: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function computeContainScale(container: Size, image: Size): number {
  if (!container.w || !container.h || !image.w || !image.h) return 1;
  return Math.min(container.w / image.w, container.h / image.h);
}

function computeDrawRect(
  src: Size,
  dst: Size,
  cropMode: CropMode
): { dx: number; dy: number; dw: number; dh: number } {
  const scale =
    cropMode === 'fill'
      ? Math.max(dst.w / src.w, dst.h / src.h) // cover
      : Math.min(dst.w / src.w, dst.h / src.h); // contain

  const dw = src.w * scale;
  const dh = src.h * scale;
  const dx = (dst.w - dw) / 2;
  const dy = (dst.h - dh) / 2;
  return { dx, dy, dw, dh };
}

async function downscaleToMaxLongEdge(
  url: string,
  maxLongEdge = 2048
): Promise<{ url: string; size: Size; owned: boolean }> {
  const img = await loadImage(url);
  const srcW = Math.max(1, img.naturalWidth || (img as any).width || 1);
  const srcH = Math.max(1, img.naturalHeight || (img as any).height || 1);

  const longEdge = Math.max(srcW, srcH);
  if (longEdge <= maxLongEdge) {
    // penting: jangan bikin blob baru kalau sudah kecil → biar tidak flicker
    return { url, size: { w: srcW, h: srcH }, owned: false };
  }

  const scale = maxLongEdge / longEdge;
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unsupported');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) reject(new Error('Failed to build preview blob'));
        else resolve(b);
      },
      'image/jpeg',
      0.92
    );
  });

  const blobUrl = URL.createObjectURL(blob);
  return { url: blobUrl, size: { w, h }, owned: true };
}

async function buildComparePair(
  beforeUrl: string,
  afterUrl: string,
  cropMode: CropMode,
  maxLongEdge = 2048
): Promise<PreviewCompare> {
  // downscale AFTER if needed (or reuse as-is)
  const afterPrepared = await downscaleToMaxLongEdge(afterUrl, maxLongEdge);
  const dst = afterPrepared.size;

  const beforeImg = await loadImage(beforeUrl);
  const src: Size = {
    w: Math.max(1, beforeImg.naturalWidth || (beforeImg as any).width || 1),
    h: Math.max(1, beforeImg.naturalHeight || (beforeImg as any).height || 1),
  };

  const canvas = document.createElement('canvas');
  canvas.width = dst.w;
  canvas.height = dst.h;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unsupported');

  const { dx, dy, dw, dh } = computeDrawRect(src, dst, cropMode);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, dst.w, dst.h);
  ctx.drawImage(beforeImg, dx, dy, dw, dh);

  const beforeBlob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) reject(new Error('Failed to build aligned before blob'));
        else resolve(b);
      },
      'image/jpeg',
      0.92
    );
  });

  const beforeBlobUrl = URL.createObjectURL(beforeBlob);

  return {
    beforeUrl: beforeBlobUrl,
    afterUrl: afterPrepared.url,
    size: dst,
    ownedBefore: true,
    ownedAfter: afterPrepared.owned,
  };
}

export default function ZoomPanCompareViewer(props: {
  mode: ViewerMode;
  singleUrl: string | null | undefined;
  beforeUrl: string | null | undefined;
  afterUrl: string | null | undefined;
  cropMode?: CropMode;
  minHeightPx?: number;
  className?: string;
  maxLongEdgePx?: number; // optional
}) {
  const {
    mode,
    singleUrl,
    beforeUrl,
    afterUrl,
    cropMode = 'fit',
    minHeightPx = 320,
    className,
    maxLongEdgePx = 2048,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const [widthPx, setWidthPx] = useState(0);
  const [viewportH, setViewportH] = useState<number>(() => (typeof window !== 'undefined' ? window.innerHeight : 900));

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [singlePreview, setSinglePreview] = useState<PreviewSingle | null>(null);
  const [comparePreview, setComparePreview] = useState<PreviewCompare | null>(null);

  const [comparePos, setComparePos] = useState(50);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const imageSize: Size | null = useMemo(() => {
    if (mode === 'compare') return comparePreview?.size || null;
    return singlePreview?.size || null;
  }, [mode, comparePreview, singlePreview]);

  // Auto height mengikuti rasio gambar (fit lebar)
  const autoHeightPx = useMemo(() => {
    if (!imageSize || !widthPx) return minHeightPx;
    const ratio = imageSize.h / imageSize.w;
    const desired = Math.round(widthPx * ratio);
    const maxH = Math.max(minHeightPx, Math.round(viewportH * 0.72));
    return clamp(desired, minHeightPx, maxH);
  }, [imageSize, widthPx, minHeightPx, viewportH]);

  // Container size (pakai auto height)
  const containerSize: Size = useMemo(() => ({ w: widthPx, h: autoHeightPx }), [widthPx, autoHeightPx]);

  // Track viewport height
  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Track width only (hindari loop ResizeObserver karena height berubah-ubah)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const r = el.getBoundingClientRect();
      const w = Math.round(r.width);
      setWidthPx((prev) => (prev === w ? prev : w));
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  // cleanup owned URLs
  const ownedSingleRef = useRef<string | null>(null);
  const ownedCompareRef = useRef<{ before: string | null; after: string | null }>({ before: null, after: null });

  const safeRevokeLater = (u: string | null) => {
    if (!u) return;
    window.setTimeout(() => {
      try {
        URL.revokeObjectURL(u);
      } catch {}
    }, 0);
  };

  // Build / update previews
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError(null);

      const hadContent = mode === 'compare' ? !!comparePreview : !!singlePreview;
      setBusy(!hadContent);

      try {
        if (mode === 'single') {
          if (!singleUrl) {
            // clear
            if (ownedSingleRef.current) safeRevokeLater(ownedSingleRef.current);
            ownedSingleRef.current = null;
            setSinglePreview(null);
            setBusy(false);
            return;
          }

          const out = await downscaleToMaxLongEdge(singleUrl, maxLongEdgePx);
          if (cancelled) {
            if (out.owned) safeRevokeLater(out.url);
            return;
          }

          const oldOwned = ownedSingleRef.current;
          ownedSingleRef.current = out.owned ? out.url : null;

          setSinglePreview({ url: out.url, size: out.size, owned: out.owned });

          // revoke old AFTER new rendered
          if (oldOwned && oldOwned !== out.url) safeRevokeLater(oldOwned);

          setBusy(false);
          return;
        }

        // compare mode
        if (!beforeUrl || !afterUrl) {
          // clear
          if (ownedCompareRef.current.before) safeRevokeLater(ownedCompareRef.current.before);
          if (ownedCompareRef.current.after) safeRevokeLater(ownedCompareRef.current.after);
          ownedCompareRef.current = { before: null, after: null };
          setComparePreview(null);
          setBusy(false);
          return;
        }

        const out = await buildComparePair(beforeUrl, afterUrl, cropMode, maxLongEdgePx);
        if (cancelled) {
          if (out.ownedBefore) safeRevokeLater(out.beforeUrl);
          if (out.ownedAfter) safeRevokeLater(out.afterUrl);
          return;
        }

        const old = ownedCompareRef.current;
        ownedCompareRef.current = {
          before: out.ownedBefore ? out.beforeUrl : null,
          after: out.ownedAfter ? out.afterUrl : null,
        };

        setComparePreview(out);

        if (old.before && old.before !== out.beforeUrl) safeRevokeLater(old.before);
        if (old.after && old.after !== out.afterUrl) safeRevokeLater(old.after);

        setBusy(false);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to prepare preview');
          setBusy(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
    // NOTE: jangan masukin comparePreview/singlePreview ke deps biar gak loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, singleUrl, beforeUrl, afterUrl, cropMode, maxLongEdgePx]);

  // Fit scale (ikut width/height container yang sudah stabil)
  const fitScale = useMemo(() => {
    if (!imageSize) return 1;
    const s = computeContainScale(containerSize, imageSize);
    return clamp(s || 1, 0.05, 4);
  }, [containerSize, imageSize]);

  const clampOffset = useCallback(
    (x: number, y: number, nextScale: number) => {
      if (!imageSize) return { x, y };

      const scaledW = imageSize.w * nextScale;
      const scaledH = imageSize.h * nextScale;

      const maxX = Math.max(0, (scaledW - containerSize.w) / 2);
      const maxY = Math.max(0, (scaledH - containerSize.h) / 2);

      return {
        x: clamp(x, -maxX, maxX),
        y: clamp(y, -maxY, maxY),
      };
    },
    [containerSize.h, containerSize.w, imageSize]
  );

  const resetToFit = useCallback(() => {
    setScale(fitScale);
    setOffset({ x: 0, y: 0 });
  }, [fitScale]);

  const resetTo100 = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetToFit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, singlePreview?.url, comparePreview?.beforeUrl, comparePreview?.afterUrl, containerSize.w, containerSize.h]);

  const nudgeZoom = useCallback(
    (direction: 'in' | 'out') => {
      const s0 = scale;
      const factor = direction === 'in' ? 1.12 : 1 / 1.12;
      const s1 = clamp(s0 * factor, 0.05, 8);
      if (s1 === s0) return;

      const ratio = s1 / s0;
      const next = clampOffset(offset.x * ratio, offset.y * ratio, s1);

      setScale(s1);
      setOffset(next);
    },
    [scale, offset.x, offset.y, clampOffset]
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!imageSize) return;
      e.preventDefault();

      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const cx = cursorX - centerX;
      const cy = cursorY - centerY;

      const s0 = scale;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const s1 = clamp(s0 * factor, 0.05, 8);
      if (s1 === s0) return;

      const ratio = s1 / s0;
      const nextX = (1 - ratio) * cx + ratio * offset.x;
      const nextY = (1 - ratio) * cy + ratio * offset.y;

      const next = clampOffset(nextX, nextY, s1);
      setScale(s1);
      setOffset(next);
    },
    [imageSize, scale, offset.x, offset.y, clampOffset]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!imageSize) return;
      if ((e as any).button !== undefined && (e as any).button !== 0) return;

      draggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
      try {
        (e.currentTarget as any).setPointerCapture?.(e.pointerId);
      } catch {}
    },
    [imageSize, offset.x, offset.y]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      if (!dragStartRef.current) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      const next = clampOffset(dragStartRef.current.ox + dx, dragStartRef.current.oy + dy, scale);
      setOffset(next);
    },
    [clampOffset, scale]
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    draggingRef.current = false;
    dragStartRef.current = null;
    try {
      (e.currentTarget as any).releasePointerCapture?.(e.pointerId);
    } catch {}
  }, []);

  const content = useMemo(() => {
    if (mode === 'single') {
      if (!singlePreview) return null;
      return (
        <div className="relative" style={{ width: singlePreview.size.w, height: singlePreview.size.h }}>
          <img
            src={singlePreview.url}
            alt="preview"
            draggable={false}
            className="absolute inset-0 w-full h-full select-none pointer-events-none"
          />
        </div>
      );
    }

    if (!comparePreview) return null;

    const clip = `inset(0 ${100 - comparePos}% 0 0)`;
    return (
      <div className="relative" style={{ width: comparePreview.size.w, height: comparePreview.size.h }}>
        <img
          src={comparePreview.beforeUrl}
          alt="before"
          draggable={false}
          className="absolute inset-0 w-full h-full select-none pointer-events-none"
        />
        <img
          src={comparePreview.afterUrl}
          alt="after"
          draggable={false}
          className="absolute inset-0 w-full h-full select-none pointer-events-none"
          style={{ clipPath: clip }}
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-yellow-400/90 pointer-events-none"
          style={{ left: `${comparePos}%` }}
        />
      </div>
    );
  }, [mode, singlePreview, comparePreview, comparePos]);

  const showEmpty = mode === 'single' ? !singleUrl : !beforeUrl || !afterUrl;

  return (
    <div
      ref={containerRef}
      className={className || 'relative rounded-xl overflow-hidden bg-dark-bg flex items-center justify-center w-full'}
      style={{ height: autoHeightPx, minHeight: minHeightPx }}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Controls */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={() => nudgeZoom('out')}
          disabled={!imageSize}
          className="px-2 py-1 rounded border border-dark-border bg-dark-card text-xs disabled:opacity-40"
          title="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => nudgeZoom('in')}
          disabled={!imageSize}
          className="px-2 py-1 rounded border border-dark-border bg-dark-card text-xs disabled:opacity-40"
          title="Zoom in"
        >
          +
        </button>

        <button
          type="button"
          onClick={resetToFit}
          disabled={!imageSize}
          className="px-2 py-1 rounded border border-dark-border bg-dark-card text-xs disabled:opacity-40"
          title="Fit"
        >
          Fit
        </button>
        <button
          type="button"
          onClick={resetTo100}
          disabled={!imageSize}
          className="px-2 py-1 rounded border border-dark-border bg-dark-card text-xs disabled:opacity-40"
          title="100%"
        >
          100%
        </button>
      </div>

      {!!imageSize && (
        <div className="absolute bottom-2 left-2 z-10 text-[11px] text-gray-400 bg-black/30 px-2 py-1 rounded">
          Wheel: zoom • Drag: pan
        </div>
      )}

      {mode === 'compare' && !!comparePreview && (
        <div className="absolute bottom-2 right-2 z-10 w-[180px] md:w-[240px] bg-black/30 px-2 py-1 rounded">
          <input
            type="range"
            min={0}
            max={100}
            value={comparePos}
            onChange={(e) => setComparePos(Number(e.target.value))}
            className="w-full"
            aria-label="Compare slider"
          />
        </div>
      )}

      {/* Busy overlay hanya saat pertama kali belum ada konten */}
      {busy && !content && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
          <div className="text-sm text-gray-200">Preparing preview…</div>
        </div>
      )}

      {!busy && error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20 p-4">
          <div className="text-sm text-red-200 text-center">{error}</div>
        </div>
      )}

      {!busy && !error && showEmpty && (
        <div className="text-sm text-gray-500 py-16 text-center px-6">Upload an image to start.</div>
      )}

      {!error && !!content && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ touchAction: 'none' }}>
          <div style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }} className="will-change-transform">
            <div style={{ transform: `scale(${scale})` }} className="origin-center will-change-transform">
              {content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
