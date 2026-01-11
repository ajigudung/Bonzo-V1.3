import React from 'react';
import type { ToneFilters } from '../services/imageFilters';
import { defaultToneFilters } from '../services/imageFilters';

export interface ResultEnhancerPanelProps {
  value: ToneFilters;
  onChange: (next: ToneFilters) => void;
  disabled?: boolean;
  onApply?: () => void;
  applying?: boolean;
}

function SliderRow({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const mn = min ?? -100;
  const mx = max ?? 100;

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    const vv = v < mn ? mn : v > mx ? mx : v;
    onChange(vv);
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
        <span>{label}</span>
        <span className="text-gray-400">{value}</span>
      </div>

      <input type="range" min={mn} max={mx} step={1} value={value} onChange={handle} className="w-full" />
    </div>
  );
}

export default function ResultEnhancerPanel({ value, onChange, disabled, onApply, applying }: ResultEnhancerPanelProps) {
  const reset = () => onChange({ ...defaultToneFilters });

  return (
    <div className="p-3 border border-dark-border rounded bg-dark-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-bold text-yellow-400">Result Enhancer</div>
        <button
          type="button"
          onClick={reset}
          disabled={disabled}
          className="px-2 py-1 rounded border border-dark-border hover:bg-dark-bg text-xs disabled:opacity-40"
          title="Reset semua slider"
        >
          Reset
        </button>
      </div>

      <div className="text-[11px] text-gray-400">
        Slider ini memproses <b>hasil gambar</b> (post-process result), tidak mengubah prompt.
      </div>

      <SliderRow label="Saturation" value={value.saturation} onChange={(v) => onChange({ ...value, saturation: v })} />
      <SliderRow
        label="Temperature"
        value={value.temperature}
        onChange={(v) => onChange({ ...value, temperature: v })}
      />
      <SliderRow
        label="Brightness"
        value={value.brightness}
        onChange={(v) => onChange({ ...value, brightness: v })}
      />
      <SliderRow label="Contrast" value={value.contrast} onChange={(v) => onChange({ ...value, contrast: v })} />
      <SliderRow
        label="Sharpen (Unsharp mask)"
        value={value.sharpen}
        min={0}
        max={100}
        onChange={(v) => onChange({ ...value, sharpen: v })}
      />
      <SliderRow
        label="Highlight"
        value={value.highlights}
        onChange={(v) => onChange({ ...value, highlights: v })}
      />
      <SliderRow label="Shadow" value={value.shadows} onChange={(v) => onChange({ ...value, shadows: v })} />

      {onApply && (
        <button
          type="button"
          onClick={onApply}
          disabled={disabled || applying}
          className="w-full px-3 py-2 rounded bg-emerald-500 text-black font-extrabold disabled:opacity-40"
          title="Bake / terapkan slider ke output (full resolution)"
        >
          {applying ? 'Applying…' : 'Apply to Result'}
        </button>
      )}
    </div>
  );
}
