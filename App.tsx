import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Download, Repeat2 } from 'lucide-react';

import Sidebar from './components/Sidebar';
import ImageUploader from './components/ImageUploader';
import Spinner from './components/Spinner';
import SettingsPanel from './components/SettingsPanel';
import PasFotoCanvasControls from './components/PasFotoCanvasControls';
import ProgressBar from './components/ProgressBar';
import ZoomPanCompareViewer from './components/ZoomPanCompareViewer';
import ToastHost, { type ToastItem, type ToastKind } from './components/ToastHost';

import { editImageWithGemini, clearGeminiCache } from './services/geminiService';
import { renderPreviewWindow, postPreviewPayload } from './services/previewWindow';
import {
  buildA3PreviewBlob,
  buildSizedOutputBlob,
  downloadBlob,
  OUTPUT_LONG_EDGE_PX,
  safeName,
  applyAspectRatioToBlob,
} from './services/imageExport';
import { buildPromptTuningText, defaultPromptTuning } from './services/promptTuning';
import {
  applyToneToBlobFull,
  applyToneToBlobPreview,
  defaultToneFilters,
  isToneNeutral,
  type ToneFilters,
} from './services/imageFilters';

import promptCategories from './prompts';
import { buildPasFotoPromptAddon, defaultPasFotoSettings, type PasFotoSettings } from './components/PasFotoPanel';

const CustomPromptStudio = lazy(() => import('./components/CustomPromptStudio'));
const PhotoProductStudio = lazy(() => import('./components/PhotoProductStudio'));

type AppMode = 'original' | 'custom_prompt' | 'photo_product';
type ViewMode = 'before' | 'after';
type DownloadSize = '2k' | '4k' | '8k';

interface GeminiResult {
  image: { url: string; blob: Blob; mimeType: string };
  text?: string | null;
  fromCache?: boolean;
}

function revokeBlobUrl(u: string | null | undefined) {
  if (u && u.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(u);
    } catch {}
  }
}

function makeToastId() {
  const c: any = crypto as any;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function App() {
  const [mode, setMode] = useState<AppMode>('original');

  const [activeCategoryKey, setActiveCategoryKey] = useState<string>('');
  const [activePromptLabel, setActivePromptLabel] = useState<string>('');
  const [activePrompt, setActivePrompt] = useState<string>('');

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  const [result, setResult] = useState<GeminiResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('before');

  const [compareOn, setCompareOn] = useState(false);

  const [loading, setLoading] = useState(false);
  const [genProgress, setGenProgress] = useState<number>(0);
  const [exporting, setExporting] = useState<null | 'preview' | 'download'>(null);
  const [downloadSize, setDownloadSize] = useState<DownloadSize>('8k');

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // cache clearing guard
  const [cacheClearing, setCacheClearing] = useState(false);

  // Toast stack
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Better dedupe: only suppress identical message if it occurs too quickly (spam guard)
  const lastNoticeRef = useRef<{ msg: string; at: number } | null>(null);
  const lastErrorRef = useRef<{ msg: string; at: number } | null>(null);

  const pushToast = useCallback((kind: ToastKind, message: string, ttlMs?: number) => {
    const item: ToastItem = { id: makeToastId(), kind, message, createdAt: Date.now(), ttlMs };
    setToasts((prev) => [item, ...prev].slice(0, 6));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Auto toast on notice changes
  useEffect(() => {
    if (!notice) return;
    const now = Date.now();

    if (lastNoticeRef.current?.msg === notice && now - lastNoticeRef.current.at < 700) return;
    lastNoticeRef.current = { msg: notice, at: now };

    const n = notice.toLowerCase();
    const kind: ToastKind = n.includes('cache') ? 'info' : 'success';
    pushToast(kind, notice);
  }, [notice, pushToast]);

  // Auto toast on error changes
  useEffect(() => {
    if (!error) return;
    const now = Date.now();

    if (lastErrorRef.current?.msg === error && now - lastErrorRef.current.at < 700) return;
    lastErrorRef.current = { msg: error, at: now };

    pushToast('error', error);
  }, [error, pushToast]);

  const [tuning, setTuning] = useState(defaultPromptTuning);
  const tuningText = useMemo(() => buildPromptTuningText(tuning), [tuning]);

  const [tone, setTone] = useState<ToneFilters>(defaultToneFilters);
  const [toneApplying, setToneApplying] = useState(false);
  const [tonePreviewUrl, setTonePreviewUrl] = useState<string | null>(null);

  const [pasFoto, setPasFoto] = useState<PasFotoSettings>(defaultPasFotoSettings);

  const [showSettings, setShowSettings] = useState(false);
  const [studioBusy, setStudioBusy] = useState(false);

  const originalUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const tonePreviewUrlRef = useRef<string | null>(null);

  const genProgressTimerRef = useRef<number | null>(null);

  const stopGenProgress = useCallback(() => {
    if (genProgressTimerRef.current) {
      window.clearInterval(genProgressTimerRef.current);
      genProgressTimerRef.current = null;
    }
  }, []);

  const startGenProgress = useCallback(() => {
    stopGenProgress();
    setGenProgress(1);
    genProgressTimerRef.current = window.setInterval(() => {
      setGenProgress((p) => {
        if (p >= 90) return p;
        const step = p < 15 ? 5 : p < 55 ? 3 : 2;
        const jitter = p < 55 ? Math.random() * 2 : Math.random();
        const next = Math.min(90, p + step + jitter);
        return Math.round(next);
      });
    }, 240);
  }, [stopGenProgress]);

  const finishGenProgress = useCallback(
    (ok: boolean) => {
      stopGenProgress();
      if (!ok) {
        setGenProgress(0);
        return;
      }
      setGenProgress(100);
      window.setTimeout(() => setGenProgress(0), 900);
    },
    [stopGenProgress]
  );

  useEffect(() => {
    originalUrlRef.current = originalUrl;
  }, [originalUrl]);
  useEffect(() => {
    resultUrlRef.current = result?.image.url ?? null;
  }, [result]);
  useEffect(() => {
    tonePreviewUrlRef.current = tonePreviewUrl;
  }, [tonePreviewUrl]);

  // On unmount: revoke object URLs
  useEffect(() => {
    return () => {
      stopGenProgress();
      revokeBlobUrl(originalUrlRef.current);
      revokeBlobUrl(resultUrlRef.current);
      revokeBlobUrl(tonePreviewUrlRef.current);
    };
  }, [stopGenProgress]);

  // Set default prompt (first category item)
  useEffect(() => {
    if (activePrompt) return;
    const firstCat = Object.entries(promptCategories)[0];
    if (!firstCat) return;
    const [catKey, cat] = firstCat;
    const firstItem = cat.items?.[0];
    if (!firstItem) return;
    setActiveCategoryKey(catKey);
    setActivePromptLabel(firstItem.label);
    setActivePrompt(firstItem.prompt);
  }, [activePrompt]);

  const isPasFoto = useMemo(() => {
    return mode === 'original' && (activeCategoryKey || '').toLowerCase() === 'pas_foto';
  }, [activeCategoryKey, mode]);

  const handleSelectPrompt = useCallback((categoryKey: string, label: string, prompt: string) => {
    setMode('original');
    setActiveCategoryKey(categoryKey);
    setActivePromptLabel(label);
    setActivePrompt(prompt);
    setNotice(null);
    setError(null);
  }, []);

  const handleSelectCustomPrompt = useCallback(() => {
    setMode('custom_prompt');
    setNotice(null);
    setError(null);
  }, []);

  const handleSelectPhotoProduct = useCallback(() => {
    setMode('photo_product');
    setNotice(null);
    setError(null);
  }, []);

  const handleImageSelect = useCallback((file: File, objectUrl: string) => {
    revokeBlobUrl(originalUrlRef.current);
    setOriginalFile(file);
    setOriginalUrl(objectUrl);

    setViewMode('before');
    setCompareOn(false);

    setResult((prev) => {
      revokeBlobUrl(prev?.image.url);
      return null;
    });

    // reset tone preview when new input is chosen
    setTone({ ...defaultToneFilters });
    revokeBlobUrl(tonePreviewUrlRef.current);
    setTonePreviewUrl(null);

    setNotice(null);
    setError(null);
  }, []);

  // ✅ RESET = CLEAR CACHE
  const resetOriginal = useCallback(async () => {
    stopGenProgress();
    setGenProgress(0);

    revokeBlobUrl(originalUrlRef.current);
    revokeBlobUrl(resultUrlRef.current);
    revokeBlobUrl(tonePreviewUrlRef.current);

    setOriginalFile(null);
    setOriginalUrl(null);
    setResult(null);
    setViewMode('before');
    setCompareOn(false);

    setTone({ ...defaultToneFilters });
    setTonePreviewUrl(null);

    setLoading(false);
    setExporting(null);
    setError(null);

    setCacheClearing(true);
    try {
      await clearGeminiCache();
      setNotice('Reset. Cache cleared.');
    } catch {
      setNotice('Reset.');
      setError('Failed to clear cache.');
    } finally {
      setCacheClearing(false);
    }
  }, [stopGenProgress]);

  const finalPrompt = useMemo(() => {
    const base = (activePrompt || '').trim();
    const parts: string[] = [];
    if (base) parts.push(base);
    if (isPasFoto) parts.push(buildPasFotoPromptAddon(pasFoto));
    if (tuningText) parts.push(tuningText);
    return parts.join('\n\n').trim();
  }, [activePrompt, isPasFoto, pasFoto, tuningText]);

  // Real-time preview tone (downscaled) for the AFTER view
  useEffect(() => {
    if (viewMode !== 'after') {
      revokeBlobUrl(tonePreviewUrlRef.current);
      setTonePreviewUrl(null);
      return;
    }

    if (!result?.image?.blob) {
      revokeBlobUrl(tonePreviewUrlRef.current);
      setTonePreviewUrl(null);
      return;
    }

    if (isToneNeutral(tone)) {
      revokeBlobUrl(tonePreviewUrlRef.current);
      setTonePreviewUrl(null);
      return;
    }

    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        const b = await applyToneToBlobPreview(result.image.blob, tone, {
          maxEdgePx: 1700,
          mimeType: result.image.mimeType || 'image/png',
        });
        if (cancelled) return;
        const url = URL.createObjectURL(b);
        revokeBlobUrl(tonePreviewUrlRef.current);
        setTonePreviewUrl(url);
      } catch {
        // ignore preview errors
      }
    }, 140);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [result?.image?.blob, result?.image?.mimeType, tone, viewMode]);

  const canGenerate = useMemo(() => {
    return mode === 'original' && !!originalFile && !loading && !studioBusy && !toneApplying && !cacheClearing;
  }, [cacheClearing, loading, mode, originalFile, studioBusy, toneApplying]);

  const generate = useCallback(async () => {
    if (!canGenerate || !originalFile) return;

    setLoading(true);
    setError(null);
    setNotice(null);
    startGenProgress();

    try {
      const res = await editImageWithGemini(originalFile, finalPrompt, { mode: isPasFoto ? 'pas_foto' : 'default' });

      // Enforce aspect ratio/crop client-side (preview + download)
      const applied = await applyAspectRatioToBlob(res.image.blob, {
        aspectRatio: tuning.aspectRatio,
        cropMode: tuning.cropMode,
      });

      revokeBlobUrl(resultUrlRef.current);
      const url = URL.createObjectURL(applied.blob);

      setResult({
        image: { url, blob: applied.blob, mimeType: applied.blob.type || 'image/png' },
        text: res.text ?? null,
        fromCache: res.fromCache,
      });

      setViewMode('after');
      // Keep compare state; user may want compare immediately
      setTone({ ...defaultToneFilters });
      revokeBlobUrl(tonePreviewUrlRef.current);
      setTonePreviewUrl(null);

      finishGenProgress(true);
      setNotice(res.fromCache ? 'Loaded from cache.' : 'Generated.');
    } catch (e: any) {
      finishGenProgress(false);
      setError(e?.message || 'Failed to generate');
    } finally {
      setLoading(false);
    }
  }, [
    canGenerate,
    originalFile,
    finalPrompt,
    isPasFoto,
    tuning.aspectRatio,
    tuning.cropMode,
    startGenProgress,
    finishGenProgress,
  ]);

  const useResultAsInput = useCallback(async () => {
    if (!result?.image?.blob) return;
    setError(null);
    setNotice(null);

    try {
      const blob = isToneNeutral(tone) ? result.image.blob : await applyToneToBlobFull(result.image.blob, tone);
      const file = new File([blob], 'input.png', { type: blob.type || result.image.mimeType || 'image/png' });
      const url = URL.createObjectURL(file);

      revokeBlobUrl(originalUrlRef.current);
      setOriginalFile(file);
      setOriginalUrl(url);
      setViewMode('before');
      setCompareOn(false);
      setNotice('Result set as new input.');
    } catch (e: any) {
      setError(e?.message || 'Failed to use result as input');
    }
  }, [result, tone]);

  const applyToneToResult = useCallback(async () => {
    if (!result?.image?.blob) return;
    if (isToneNeutral(tone)) return;
    if (toneApplying || exporting) return;

    setToneApplying(true);
    setError(null);
    setNotice(null);
    try {
      const blob = await applyToneToBlobFull(result.image.blob, tone);
      revokeBlobUrl(resultUrlRef.current);
      const url = URL.createObjectURL(blob);
      setResult((prev) =>
        prev
          ? {
              ...prev,
              image: { url, blob, mimeType: blob.type || prev.image.mimeType || 'image/png' },
            }
          : prev
      );
      setTone({ ...defaultToneFilters });
      revokeBlobUrl(tonePreviewUrlRef.current);
      setTonePreviewUrl(null);
      setNotice('Tone applied to result.');
    } catch (e: any) {
      setError(e?.message || 'Apply failed');
    } finally {
      setToneApplying(false);
    }
  }, [exporting, result, tone, toneApplying]);

  const previewA3 = useCallback(async () => {
    if (!result?.image?.blob || exporting) return;
    setExporting('preview');
    setError(null);

    const w = window.open('', '_blank');
    if (!w) {
      setError('Popup diblokir browser. Izinkan pop-up untuk tombol Preview.');
      setExporting(null);
      return;
    }

    try {
      renderPreviewWindow(w, {
        imageUrl: '',
        title: 'A3 Preview',
        info: 'Preview: A3 • 150dpi • 3× | Wheel: zoom | Drag: pan',
      });

      if (!isToneNeutral(tone)) {
        const baseOut = await buildA3PreviewBlob(result.image.blob);
        const afterBlob = await applyToneToBlobFull(baseOut.blob, tone);

        postPreviewPayload(w, {
          type: 'ajg_set_preview_blobs',
          beforeBlob: baseOut.blob,
          afterBlob,
        });
      } else {
        const out = await buildA3PreviewBlob(result.image.blob);
        postPreviewPayload(w, { type: 'ajg_set_preview_blob', blob: out.blob });
      }

      setNotice('Opened A3 preview.');
    } catch (e: any) {
      setError(e?.message || 'Preview failed');
    } finally {
      setExporting(null);
    }
  }, [exporting, result, tone]);

  const downloadSized = useCallback(async () => {
    if (!result?.image?.blob || exporting) return;
    setExporting('download');
    setError(null);
    setNotice(null);

    try {
      const filteredBlob = isToneNeutral(tone) ? result.image.blob : await applyToneToBlobFull(result.image.blob, tone);
      const out = await buildSizedOutputBlob(filteredBlob, {
        longEdgePx: OUTPUT_LONG_EDGE_PX[downloadSize],
        aspectRatio: tuning.aspectRatio,
        cropMode: tuning.cropMode,
      });

      const baseName = safeName(activePromptLabel || 'result');
      downloadBlob(out.blob, `${baseName}_${downloadSize}.png`);
      setNotice(`Downloaded ${downloadSize.toUpperCase()}.`);
    } catch (e: any) {
      setError(e?.message || 'Download failed');
    } finally {
      setExporting(null);
    }
  }, [activePromptLabel, downloadSize, exporting, result, tone, tuning.aspectRatio, tuning.cropMode]);

  const afterUrl = tonePreviewUrl || result?.image.url || null;
  const singleUrl = viewMode === 'before' ? originalUrl : afterUrl;

  const canCompare = !!originalUrl && !!afterUrl;
  const viewerMode = compareOn && canCompare ? 'compare' : 'single';

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 flex">
      {/* Toasts (mobile top-center, desktop bottom-right) */}
      <ToastHost toasts={toasts} onDismiss={dismissToast} />

      <div className="hidden md:block">
        <Sidebar
          categories={promptCategories}
          activePromptLabel={activePromptLabel}
          isCustomPrompt={mode === 'custom_prompt'}
          isPhotoProduct={mode === 'photo_product'}
          onSelectPrompt={handleSelectPrompt}
          onSelectCustomPrompt={handleSelectCustomPrompt}
          onSelectPhotoProduct={handleSelectPhotoProduct}
        />
      </div>

      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="md:hidden flex items-center justify-between gap-2 p-3 border-b border-dark-border bg-dark-card">
          <div className="font-extrabold text-yellow-400">Bonzo</div>
          <button
            type="button"
            onClick={() => setShowSettings((s) => !s)}
            className="px-3 py-2 rounded border border-dark-border hover:bg-dark-bg text-sm"
          >
            {showSettings ? 'Hide Settings' : 'Settings'}
          </button>
        </div>

        <div className="flex-1 p-4 md:p-6 flex flex-col md:flex-row gap-6">
          {/* Main */}
          <main className="flex-1 space-y-6">
            {mode === 'original' && (
              <>
                <div className="bg-dark-card border border-dark-border rounded-lg p-4 space-y-4">
                  <div className="font-bold text-emerald-400 text-lg">
                    BONZO <span className="text-gray-500">|</span>{' '}
                    <span className="text-gray-100">{activePromptLabel || 'Select preset'}</span>
                  </div>

                  <ImageUploader onImageSelect={handleImageSelect} />

                  {originalUrl && (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCompareOn(false);
                          setViewMode('before');
                        }}
                        className={`px-3 py-2 rounded border text-sm font-semibold transition ${
                          viewMode === 'before' && !compareOn
                            ? 'bg-yellow-500 text-black border-yellow-400'
                            : 'border-dark-border hover:bg-dark-bg text-gray-200'
                        }`}
                      >
                        Before
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCompareOn(false);
                          setViewMode('after');
                        }}
                        disabled={!afterUrl}
                        className={`px-3 py-2 rounded border text-sm font-semibold transition disabled:opacity-40 ${
                          viewMode === 'after' && !compareOn
                            ? 'bg-yellow-500 text-black border-yellow-400'
                            : 'border-dark-border hover:bg-dark-bg text-gray-200'
                        }`}
                      >
                        After
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!canCompare) return;
                          setCompareOn((v) => {
                            const next = !v;
                            if (next) setViewMode('after');
                            return next;
                          });
                        }}
                        disabled={!canCompare}
                        className={`px-3 py-2 rounded border text-sm font-semibold transition disabled:opacity-40 ${
                          compareOn
                            ? 'bg-yellow-500 text-black border-yellow-400'
                            : 'border-dark-border hover:bg-dark-bg text-gray-200'
                        }`}
                        title="Compare slider"
                      >
                        Compare
                      </button>
                    </div>
                  )}
                </div>

                {isPasFoto && <PasFotoCanvasControls value={pasFoto} onChange={setPasFoto} />}

                <div className="bg-dark-card border border-dark-border rounded-lg p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={generate}
                        disabled={!canGenerate}
                        className="px-5 py-3 rounded bg-cyan-500 text-black font-extrabold disabled:opacity-40"
                      >
                        {loading ? 'Generating…' : cacheClearing ? 'Clearing cache…' : '✨ Generate'}
                      </button>

                      {(loading || genProgress > 0) && <ProgressBar percent={genProgress} />}
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        type="button"
                        onClick={resetOriginal}
                        disabled={loading || exporting !== null || cacheClearing}
                        className="px-3 py-2 rounded border border-dark-border hover:bg-dark-bg text-sm disabled:opacity-40"
                        title="Reset input & output (clear cache)"
                      >
                        Reset
                      </button>

                      <button
                        type="button"
                        onClick={previewA3}
                        disabled={!result?.image?.blob || exporting !== null || cacheClearing}
                        className="px-3 py-2 rounded border border-dark-border hover:bg-dark-bg text-sm disabled:opacity-40 flex items-center gap-2"
                      >
                        {exporting === 'preview' ? <Spinner size="sm" /> : <Eye size={16} />}
                        Preview
                      </button>

                      <div className="flex items-center gap-2">
                        <select
                          value={downloadSize}
                          onChange={(e) => setDownloadSize(e.target.value as DownloadSize)}
                          className="px-2 py-2 rounded border border-dark-border bg-dark-bg text-sm"
                          title="Download size"
                        >
                          <option value="8k">8K</option>
                          <option value="4k">4K</option>
                          <option value="2k">2K</option>
                        </select>

                        <button
                          type="button"
                          onClick={downloadSized}
                          disabled={!result?.image?.blob || exporting !== null || cacheClearing}
                          className="px-3 py-2 rounded border border-dark-border hover:bg-dark-bg text-sm disabled:opacity-40 flex items-center gap-2"
                        >
                          {exporting === 'download' ? <Spinner size="sm" /> : <Download size={16} />}
                          Download
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={useResultAsInput}
                        disabled={!result?.image?.blob || cacheClearing}
                        className="px-3 py-2 rounded border border-dark-border hover:bg-dark-bg text-sm disabled:opacity-40 flex items-center gap-2"
                        title="Use current result as new input"
                      >
                        <Repeat2 size={16} />
                        Use result as Input
                      </button>
                    </div>
                  </div>
                </div>

                {/* Preview Box + badges */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-3 shadow relative overflow-hidden">
                  <div className="absolute top-3 left-3 z-10 flex gap-2">
                    {result?.fromCache && (
                      <span className="text-xs font-extrabold px-2 py-1 rounded bg-black/40 border border-dark-border text-yellow-200">
                        Cached
                      </span>
                    )}
                    {!!tonePreviewUrl && (
                      <span className="text-xs font-extrabold px-2 py-1 rounded bg-black/40 border border-dark-border text-cyan-200">
                        Preview Adjustments
                      </span>
                    )}
                  </div>

                  <ZoomPanCompareViewer
                    mode={viewerMode}
                    singleUrl={singleUrl}
                    beforeUrl={originalUrl}
                    afterUrl={afterUrl}
                    cropMode={tuning.cropMode}
                    minHeightPx={320}
                  />
                </div>

                {/* Optional: still show big error box (toast already shown too) */}
                {error && (
                  <div className="p-3 border border-red-500/40 bg-red-500/10 rounded text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {result?.text && (
                  <div className="bg-dark-card border border-dark-border rounded-lg p-4 text-sm text-gray-100 whitespace-pre-wrap">
                    {result.text}
                  </div>
                )}
              </>
            )}

            {mode !== 'original' && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-10">
                    <Spinner size="lg" />
                  </div>
                }
              >
                {mode === 'custom_prompt' ? (
                  <CustomPromptStudio tuning={tuning} tuningText={tuningText} onBusyChange={setStudioBusy} />
                ) : (
                  <PhotoProductStudio tuning={tuning} tuningText={tuningText} onBusyChange={setStudioBusy} />
                )}
              </Suspense>
            )}
          </main>

          {/* Right settings */}
          <SettingsPanel
            show={showSettings}
            onClose={() => setShowSettings(false)}
            tuning={tuning}
            onTuningChange={setTuning}
            tone={mode === 'original' ? tone : undefined}
            onToneChange={mode === 'original' ? setTone : undefined}
            onApplyTone={mode === 'original' ? applyToneToResult : undefined}
            toneDisabled={!result?.image?.blob || loading || exporting !== null || studioBusy || toneApplying || cacheClearing}
            toneApplying={toneApplying}
          />
        </div>
      </div>
    </div>
  );
}
