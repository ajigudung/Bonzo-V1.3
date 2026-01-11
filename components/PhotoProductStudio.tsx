import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Download, Repeat2 } from 'lucide-react';

import ImageUploader from './ImageUploader';
import Spinner from './Spinner';
import ProgressBar from './ProgressBar';

import { editImageWithGemini } from '../services/geminiService';
import { renderPreviewWindow, postPreviewPayload } from '../services/previewWindow';
import {
  buildA3PreviewBlob,
  buildSizedOutputBlob,
  downloadBlob,
  OUTPUT_LONG_EDGE_PX,
  safeName,
  applyAspectRatioToBlob,
} from '../services/imageExport';

import type { PromptTuning } from '../services/promptTuning';
import {
  CREATIVE_DIRECTIONS,
  EFFECT_PACKS,
  type CreativeDirection,
  type EffectPack,
  type LightingMode,
  type SceneMode,
  buildProductPrompt,
  pickCreatives,
  pickEffectPacks,
} from '../photoProductPrompts';

interface PhotoProductStudioProps {
  tuning: PromptTuning;
  tuningText?: string;
  onBusyChange?: (busy: boolean) => void;
}

type ResultItem = { url: string; blob: Blob };

type DownloadSize = '2k' | '4k' | '8k';

function revokeUrl(u: string | null | undefined) {
  if (u && u.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(u);
    } catch {}
  }
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function PhotoProductStudio({ tuning, tuningText = '', onBusyChange }: PhotoProductStudioProps) {
  const [file, setFile] = useState<File | null>(null);
  const [inputUrl, setInputUrl] = useState<string | null>(null);

  const [lighting, setLighting] = useState<LightingMode>('light');
  const [scene, setScene] = useState<SceneMode>('clean');

  // "Auto" will randomly pick per output
  const [creativeKey, setCreativeKey] = useState<string>('auto');
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);

  const [outputs, setOutputs] = useState<1 | 2 | 4>(4);
  const [downloadSize, setDownloadSize] = useState<DownloadSize>('8k');

  const [results, setResults] = useState<(ResultItem | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [genProgress, setGenProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const genProgressTimerRef = useRef<number | null>(null);
  const stopGenProgress = useCallback(() => {
    if (genProgressTimerRef.current) {
      window.clearInterval(genProgressTimerRef.current);
      genProgressTimerRef.current = null;
    }
  }, []);

  const startSegment = useCallback(
    (from: number, to: number) => {
      stopGenProgress();
      setGenProgress(Math.max(0, Math.min(100, Math.round(from))));
      const max = Math.max(0, Math.min(99, Math.round(to)));
      genProgressTimerRef.current = window.setInterval(() => {
        setGenProgress((p) => {
          if (p >= max) return p;
          const delta = Math.max(1, Math.floor((max - p) * 0.18));
          return Math.min(max, p + delta);
        });
      }, 220);
    },
    [stopGenProgress]
  );

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

  const resultsRef = useRef<(ResultItem | null)[]>([]);
  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  const inputUrlRef = useRef<string | null>(null);
  useEffect(() => {
    inputUrlRef.current = inputUrl;
  }, [inputUrl]);

  useEffect(() => {
    return () => {
      stopGenProgress();
      revokeUrl(inputUrlRef.current);
      for (const r of resultsRef.current) revokeUrl(r?.url);
    };
  }, [stopGenProgress]);

  const canGenerate = !!file && !loading;

  const onImageSelect = useCallback((f: File, url: string) => {
    revokeUrl(inputUrlRef.current);
    setFile(f);
    setInputUrl(url);
    setError(null);
    setNotice(null);
    setResults((prev) => {
      for (const r of prev) revokeUrl(r?.url);
      return [];
    });
  }, []);

  const resetAll = useCallback(() => {
    stopGenProgress();
    setGenProgress(0);
    revokeUrl(inputUrlRef.current);
    setFile(null);
    setInputUrl(null);
    setLighting('light');
    setScene('clean');
    setCreativeKey('auto');
    setSelectedEffects([]);
    setOutputs(4);
    setDownloadSize('8k');
    setError(null);
    setNotice(null);
    setResults((prev) => {
      for (const r of prev) revokeUrl(r?.url);
      return [];
    });
  }, [stopGenProgress]);

  const toggleEffect = useCallback((key: string) => {
    setSelectedEffects((prev) => {
      if (prev.includes(key)) return prev.filter((x) => x !== key);
      // limit selections to keep prompt stable
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
  }, []);

  const openPreview = useCallback(async (blob: Blob, title = 'Preview') => {
    const w = window.open('', '_blank');
    if (!w) {
      setError('Popup diblokir browser. Izinkan pop-up untuk tombol Preview.');
      return;
    }

    try {
      renderPreviewWindow(w, {
        imageUrl: '',
        title,
        info: 'Preview: A3 • 150dpi • 3× | Wheel: zoom | Drag: pan',
      });

      const out = await buildA3PreviewBlob(blob);
      postPreviewPayload(w, { type: 'ajg_set_preview_blob', blob: out.blob });
    } catch (e: any) {
      setError(e?.message || 'Preview failed');
    }
  }, []);

  const longEdgePx = useMemo(() => {
    return OUTPUT_LONG_EDGE_PX[downloadSize];
  }, [downloadSize]);

  const downloadOne = useCallback(
    async (r: ResultItem, idx: number) => {
      const base = safeName(`product_${idx + 1}`);
      const out = await buildSizedOutputBlob(r.blob, {
        longEdgePx,
        aspectRatio: tuning.aspectRatio,
        cropMode: tuning.cropMode,
      });
      downloadBlob(out.blob, `${base}_${downloadSize}.png`);
    },
    [downloadSize, longEdgePx, tuning.aspectRatio, tuning.cropMode]
  );

  const useAsInput = useCallback((r: ResultItem) => {
    const f = new File([r.blob], 'input.png', { type: r.blob.type || 'image/png' });
    const url = URL.createObjectURL(f);
    revokeUrl(inputUrlRef.current);
    setFile(f);
    setInputUrl(url);
    setNotice('Result set as new input.');
  }, []);

  const generate = useCallback(async () => {
    if (!file || !canGenerate) return;

    setLoading(true);
    setGenProgress(1);
    onBusyChange?.(true);
    setError(null);
    setNotice(null);

    setResults((prev) => {
      for (const r of prev) revokeUrl(r?.url);
      return Array.from({ length: outputs }, () => null);
    });

    try {
      // Per-run RNG
      const seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
      const rng = mulberry32(seed);

      // Creatives
      const pickedCreatives: CreativeDirection[] =
        creativeKey === 'auto'
          ? pickCreatives(scene, outputs, rng)
          : Array.from({ length: outputs }, () => CREATIVE_DIRECTIONS.find((c) => c.key === creativeKey)!).filter(
              Boolean
            );

      // Effects (manual or auto)
      const manualEffects: EffectPack[] = selectedEffects
        .map((k) => EFFECT_PACKS.find((e) => e.key === k))
        .filter(Boolean) as EffectPack[];

      for (let i = 0; i < outputs; i++) {
        const from = Math.round((i / outputs) * 100);
        const to = Math.round(((i + 0.85) / outputs) * 100);
        startSegment(from, to);
        const creative = pickedCreatives[i] || pickedCreatives[0] || CREATIVE_DIRECTIONS[0];

        const effects = manualEffects.length
          ? manualEffects
          : // auto: none for output 1, then 1–2 for additional outputs
            (i === 0 ? [] : pickEffectPacks(1 + (rng() > 0.75 ? 1 : 0), rng));

        const prompt = buildProductPrompt({
          lighting,
          scene,
          creative,
          effects,
          tuningText,
          variationIndex: i,
        });

        const res = await editImageWithGemini(file, prompt, {
          mode: 'default',
          // prompt differs per output, so cache is fine
          cache: true,
        });

        const applied = await applyAspectRatioToBlob(res.image.blob, {
          aspectRatio: tuning.aspectRatio,
          cropMode: tuning.cropMode,
        });

        const blob = applied.blob;
        const url = URL.createObjectURL(blob);

        setResults((prev) => {
          const next = [...prev];
          revokeUrl(next[i]?.url);
          next[i] = { url, blob };
          return next;
        });

        stopGenProgress();
        setGenProgress(Math.round(((i + 1) / outputs) * 100));
      }

      finishGenProgress(true);
    } catch (e: any) {
      finishGenProgress(false);
      setError(e?.message || 'Generate failed');
    } finally {
      setLoading(false);
      onBusyChange?.(false);
    }
  }, [canGenerate, creativeKey, file, finishGenProgress, lighting, onBusyChange, outputs, scene, selectedEffects, startSegment, stopGenProgress, tuning.aspectRatio, tuning.cropMode, tuningText]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-dark-card border border-dark-border rounded-lg p-4 space-y-4">
        <ImageUploader onImageSelect={onImageSelect} />

        {inputUrl && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-gray-200">Input Preview</div>
              <button
                type="button"
                onClick={() => file && openPreview(file, 'Preview • Input')}
                className="px-3 py-1.5 rounded-lg border border-dark-border hover:bg-dark-bg text-sm font-bold flex items-center gap-2"
                disabled={!file}
                title="Preview input (A3 • 150dpi • 3×)"
              >
                <Eye size={16} />
                Preview
              </button>
            </div>

              <div className="rounded-xl overflow-hidden bg-dark-bg border border-dark-border flex items-center justify-center h-[150px] md:h-[200px] max-w-[560px] mx-auto">
                <img src={inputUrl} alt="input" className="max-w-full max-h-full object-contain" />
              </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="text-sm">
            <div className="mb-1 text-gray-300">Lighting</div>
            <select
              value={lighting}
              onChange={(e) => setLighting(e.target.value as LightingMode)}
              className="w-full rounded bg-dark-bg border border-dark-border p-2"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>

          <label className="text-sm">
            <div className="mb-1 text-gray-300">Scene</div>
            <select
              value={scene}
              onChange={(e) => setScene(e.target.value as SceneMode)}
              className="w-full rounded bg-dark-bg border border-dark-border p-2"
            >
              <option value="clean">Clean</option>
              <option value="crowded">Crowded</option>
            </select>
          </label>

          <label className="text-sm md:col-span-2">
            <div className="mb-1 text-gray-300">Creative direction</div>
            <select
              value={creativeKey}
              onChange={(e) => setCreativeKey(e.target.value)}
              className="w-full rounded bg-dark-bg border border-dark-border p-2"
            >
              <option value="auto">Auto (Random)</option>
              {CREATIVE_DIRECTIONS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <div className="text-sm text-gray-300 mb-2">Effects (optional, max 3)</div>
          <div className="flex flex-wrap gap-2">
            {EFFECT_PACKS.slice(0, 10).map((e) => {
              const active = selectedEffects.includes(e.key);
              return (
                <button
                  key={e.key}
                  type="button"
                  onClick={() => toggleEffect(e.key)}
                  className={`px-3 py-1.5 rounded-full border text-xs transition ${
                    active
                      ? 'bg-yellow-500 text-black border-yellow-400'
                      : 'border-dark-border hover:bg-dark-bg text-gray-200'
                  }`}
                  title={e.text}
                >
                  {e.name}
                </button>
              );
            })}
          </div>
          <div className="text-[11px] text-gray-500 mt-2">
            Kalau tidak memilih effect, sistem akan auto memilih ringan untuk variasi.
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm text-gray-400">Outputs</div>
            <select
              value={outputs}
              onChange={(e) => setOutputs(parseInt(e.target.value, 10) as any)}
              className="rounded bg-dark-bg border border-dark-border px-2 py-1"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={4}>4</option>
            </select>

            <div className="text-sm text-gray-400 ml-3">Download</div>
            <select
              value={downloadSize}
              onChange={(e) => setDownloadSize(e.target.value as DownloadSize)}
              className="rounded bg-dark-bg border border-dark-border px-2 py-1"
            >
              <option value="8k">8K</option>
              <option value="4k">4K</option>
              <option value="2k">2K</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <button
              onClick={resetAll}
              className="px-4 py-2 rounded border border-dark-border hover:bg-dark-bg text-sm"
              disabled={loading}
            >
              Reset
            </button>

            <button
              onClick={generate}
              disabled={!canGenerate}
              className="px-5 py-3 rounded bg-cyan-500 text-black font-extrabold disabled:opacity-40"
            >
              {loading ? 'Generating…' : '✨ Generate'}
            </button>

            {(loading || genProgress > 0) && <ProgressBar percent={genProgress} />}
          </div>
        </div>
      </div>

      {error && <div className="p-3 border border-red-500/40 bg-red-500/10 rounded text-red-300 text-sm">{error}</div>}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="text-center text-2xl font-extrabold text-gray-100">Outputs</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((r, idx) => (
              <div key={idx} className="bg-dark-card border border-dark-border rounded-2xl p-3 shadow">
                <div className="relative">
                  <div className="rounded-xl overflow-hidden bg-dark-bg flex items-center justify-center min-h-[280px]">
                    {r ? (
                      <img src={r.url} alt={`product-${idx + 1}`} className="w-full h-full object-contain" />
                    ) : (
                      <div className="py-16">
                        <Spinner size="lg" />
                        <div className="text-xs text-gray-500 mt-3 text-center">
                          {loading ? `Generating ${idx + 1}/${outputs}…` : 'Waiting…'}
                        </div>
                      </div>
                    )}
                  </div>

                  {r && (
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <button
                        onClick={() => useAsInput(r)}
                        className="h-10 w-10 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow"
                        title="Use as Input"
                        type="button"
                      >
                        <Repeat2 size={18} />
                      </button>

                      <button
                        onClick={() => openPreview(r.blob, `Preview • Photo Product ${idx + 1}`)}
                        className="h-10 w-10 rounded-full bg-white/90 text-black flex items-center justify-center shadow"
                        title="Preview (A3 • 150dpi • 3×)"
                        type="button"
                      >
                        <Eye size={18} />
                      </button>

                      <button
                        onClick={() => downloadOne(r, idx)}
                        className="h-10 w-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow"
                        title={`Download ${downloadSize.toUpperCase()}`}
                        type="button"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!file && (
        <div className="text-xs text-gray-500 text-center">
          Upload 1 foto produk untuk mulai.
        </div>
      )}
    </div>
  );
}
