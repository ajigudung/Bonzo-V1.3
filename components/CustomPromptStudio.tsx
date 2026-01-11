import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Download } from 'lucide-react';

import MultiImageUploader, { type MultiImageValue } from './MultiImageUploader';
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

interface CustomPromptStudioProps {
  tuning: PromptTuning;
  tuningText?: string;
  onBusyChange?: (busy: boolean) => void;
}

type ResultItem = { url: string; blob: Blob };

function revokeUrl(u: string | null | undefined) {
  if (u && u.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(u);
    } catch {}
  }
}

/* =========================
   ULTRA-AGGRESSIVE VARIATION
   + TASK PLAN (ALL MERGE)
   ========================= */

type VariationProfile = {
  name: string;
  lighting: string;
  lens: string;
  composition: string;
  style: string;
  mood: string;
  background: string;
  texture: string;
  post: string;
};

const FIXED_PROFILES: VariationProfile[] = [
  {
    name: 'Natural / Documentary (Keep original background)',
    lighting: 'natural realistic lighting, match the existing light direction from the original background',
    lens: '35mm documentary lens feel, f/2.8, natural perspective',
    composition: 'candid framing, natural spacing, slight off-center, realistic balance',
    style: 'true-to-life color, minimal stylization, realistic tones',
    mood: 'authentic, friendly, natural',
    background: 'keep original background from Image 1 exactly (no replacement)',
    texture: 'preserve natural textures, no plastic smoothing',
    post: 'gentle contrast, subtle warmth, no heavy grading',
  },
  {
    name: 'Studio High-Key (New background)',
    lighting: 'high-key studio lighting, large softbox, clean and even, soft shadows',
    lens: '85mm portrait lens feel, f/2.0, clean bokeh, premium look',
    composition: 'centered composition, clean negative space, tidy edges',
    style: 'e-commerce / editorial studio look, crisp but natural',
    mood: 'polished, premium, minimal',
    background: 'replace background with clean studio backdrop (soft gradient), no clutter',
    texture: 'clean surfaces, controlled micro-contrast',
    post: 'neutral WB, clean highlights, minimal vignette',
  },
  {
    name: 'Cinematic Low-Key / Film Still',
    lighting: 'cinematic low-key lighting, dramatic side key + soft fill, controlled deep shadows',
    lens: '50mm cinematic lens feel, f/1.8, filmic separation',
    composition: 'rule of thirds, subjects off-center, cinematic headroom, depth layers',
    style: 'cinematic film still vibe, subtle teal-orange (very subtle), filmic contrast curve',
    mood: 'dramatic, emotional, story-like',
    background: 'replace background with darker cinematic depth, subtle bokeh/practical lights (not distracting)',
    texture: 'fine film grain (subtle), organic texture',
    post: 'filmic tone curve, highlight roll-off, no crushed blacks',
  },
  {
    name: 'Bold Neon Pop / Graphic',
    lighting: 'modern high-contrast lighting with subtle neon rim accent (tasteful)',
    lens: '24–30mm modern lens feel, dynamic perspective, crisp subjects',
    composition: 'bold graphic composition, diagonal balance or intentional asymmetry, strong negative space',
    style: 'modern commercial pop, punchy but controlled saturation',
    mood: 'energetic, futuristic, vibrant',
    background: 'replace background with stylized clean graphic gradient + subtle texture, no clutter',
    texture: 'slightly sharper micro-contrast, clean edges',
    post: 'higher contrast curve, vibrant accents, avoid halos/oversharpen',
  },
];

function buildAggressiveVariationAddon(index: number, total: number): string {
  const profile = FIXED_PROFILES[index % FIXED_PROFILES.length];
  return `
[AGGRESSIVE VARIATION ${index + 1}/${total}] (Profile: ${profile.name})

HARD REQUIREMENTS (must comply):
- Output must be obviously different from other variations.
- Change MANY axes: lighting + lens feel + composition + style/mood + background/texture + post.
- Keep the same people identity (faces) and keep realism (no cartoon unless user asked).

Directives for this variation:
- Lighting: ${profile.lighting}
- Lens/Camera emulation: ${profile.lens}
- Composition/Framing: ${profile.composition}
- Style/Grade: ${profile.style}
- Mood/Emotion: ${profile.mood}
- Background: ${profile.background}
- Texture/Surface: ${profile.texture}
- Post-processing: ${profile.post}

Do NOT produce the same framing/background/lighting as other outputs.
`.trim();
}

function buildPerOutputTaskPlanAllMerge(index: number, total: number, numInputs: number): string {
  if (numInputs < 2) {
    return `
[TASK PLAN]
Single input detected. Do NOT invent extra people.
No merge possible. Follow the user's prompt and apply variation styling only.
`.trim();
  }

  const keepBg = index === 0;
  return `
[TASK PLAN for OUTPUT ${index + 1}/${total}]
PRIMARY ACTION: MERGE (gabungkan) Image 1 + Image 2 into ONE single natural photo.
- Put BOTH persons in the SAME frame (NOT collage, NOT split-screen).
- Preserve each person's identity and facial features. No face swapping.
- Match lighting, perspective, scale, and sharpness so the composite looks real.
- Make edges/hair/shoulders clean (no cutout artifacts).

Background rule:
- ${keepBg ? 'KEEP ORIGINAL background from Image 1 exactly (do not replace).' : 'Background may be replaced (use the variation profile background).'}
- Even when replacing background, keep it realistic and coherent with lighting.

Uniqueness rule:
- Ensure this merged result is clearly distinct from other outputs (poses/framing/lighting/background/style differ).
`.trim();
}

function joinPromptParts(parts: Array<string | null | undefined>): string {
  return parts
    .map((p) => (p || '').trim())
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

/* ========================= */

export default function CustomPromptStudio({ tuning, tuningText = '', onBusyChange }: CustomPromptStudioProps) {
  const [value, setValue] = useState<MultiImageValue>({ files: [], previews: [] });
  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState<number>(1);

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

  useEffect(() => {
    return () => {
      stopGenProgress();
      for (const r of resultsRef.current) revokeUrl(r?.url);
    };
  }, [stopGenProgress]);

  const canGenerate = value.files.length > 0 && !loading;

  const resetAll = useCallback(() => {
    stopGenProgress();
    setGenProgress(0);
    setValue({ files: [], previews: [] });
    setPrompt('');
    setCount(1);
    setError(null);
    setNotice(null);
    setResults((prev) => {
      for (const r of prev) revokeUrl(r?.url);
      return [];
    });
  }, []);

  const enhancerText = useMemo(() => (tuningText || '').trim(), [tuningText]);
  const userPrompt = useMemo(() => (prompt || '').trim(), [prompt]);

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

  const downloadOne = useCallback(
    async (r: ResultItem, idx: number) => {
      const base = safeName(`custom_${idx + 1}`);
      const out = await buildSizedOutputBlob(r.blob, {
        longEdgePx: OUTPUT_LONG_EDGE_PX['8k'],
        aspectRatio: tuning.aspectRatio,
        cropMode: tuning.cropMode,
      });
      downloadBlob(out.blob, `${base}_8k.png`);
    },
    [tuning.aspectRatio, tuning.cropMode]
  );

  const generateN = useCallback(async () => {
    if (!canGenerate) return;

    setLoading(true);
    setGenProgress(1);
    onBusyChange?.(true);
    setError(null);
    setNotice(null);

    setResults((prev) => {
      for (const r of prev) revokeUrl(r?.url);
      return Array.from({ length: count }, () => null);
    });

    try {
      const multi = count > 1;
      const numInputs = value.files.length;

      for (let i = 0; i < count; i++) {
        const from = Math.round((i / count) * 100);
        const to = Math.round(((i + 0.85) / count) * 100);
        startSegment(from, to);
        // ORDER:
        // 1) User prompt
        // 2) Task plan (ALL MERGE)
        // 3) Aggressive profile
        // 4) Prompt enhancer last
        const taskPlan = buildPerOutputTaskPlanAllMerge(i, count, numInputs);
        const variation = multi ? buildAggressiveVariationAddon(i, count) : '';
        const finalPrompt = joinPromptParts([userPrompt, taskPlan, variation, enhancerText]);

        // multi => disable cache to avoid identical outputs
        const res = await editImageWithGemini(value.files, finalPrompt, {
          mode: 'default',
          cache: !multi,
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
        setGenProgress(Math.round(((i + 1) / count) * 100));
      }
      finishGenProgress(true);
    } catch (e: any) {
      finishGenProgress(false);
      setError(e?.message || 'Generate failed');
    } finally {
      setLoading(false);
      onBusyChange?.(false);
    }
  }, [canGenerate, count, enhancerText, finishGenProgress, onBusyChange, startSegment, stopGenProgress, tuning.aspectRatio, tuning.cropMode, userPrompt, value.files]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-dark-card border border-dark-border rounded-lg p-4 space-y-5">
        <div>
          <div className="text-sm text-gray-300 mb-3">1) Upload 1–5 photos</div>
          <MultiImageUploader value={value} onChange={setValue} maxFiles={5} />
          <div className="text-[11px] text-gray-500 mt-2">
            Untuk mode MERGE 2 orang: upload minimal <b>2 foto</b> (Image 1 &amp; Image 2). Output #1 akan mempertahankan
            background Image 1.
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-300 mb-2">2) Your prompt (executed first)</div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full rounded bg-dark-bg border border-dark-border p-3 text-sm text-gray-100"
            placeholder="Contoh: Gabungkan 2 foto jadi 1 foto, kedua orang terlihat natural…"
          />
          <div className="text-[11px] text-gray-500 mt-2">
            Urutan eksekusi: (1) Prompt kamu → (2) Task plan (ALL MERGE) → (3) Extreme profile → (4) Prompt Enhancer.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <div className="text-gray-400">Variations</div>
            <select
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
              className="rounded bg-dark-bg border border-dark-border px-2 py-1"
              title="Jumlah output"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500">(default 1)</div>
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
              onClick={generateN}
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
                      <img src={r.url} alt={`custom-${idx + 1}`} className="w-full h-full object-contain" />
                    ) : (
                      <div className="py-16">
                        <Spinner size="lg" />
                        <div className="text-xs text-gray-500 mt-3 text-center">
                          {loading ? `Generating ${idx + 1}/${count}…` : 'Waiting…'}
                        </div>
                      </div>
                    )}
                  </div>

                  {r && (
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <button
                        onClick={() => openPreview(r.blob, `Preview • Custom Output ${idx + 1}`)}
                        className="h-10 w-10 rounded-full bg-white/90 text-black flex items-center justify-center shadow"
                        title="Preview (A3 • 150dpi • 3×)"
                        type="button"
                      >
                        <Eye size={18} />
                      </button>

                      <button
                        onClick={() => downloadOne(r, idx)}
                        className="h-10 w-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow"
                        title="Download 8K"
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

      {loading && results.length === 0 && (
        <div className="flex items-center justify-center py-10">
          <Spinner size="lg" />
        </div>
      )}
    </div>
  );
}
