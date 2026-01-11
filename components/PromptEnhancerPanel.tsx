import React from 'react';
import type { PromptTuning } from '../services/promptTuning';
import { ASPECT_RATIO_OPTIONS, CROP_OPTIONS } from '../services/promptTuning';

export interface PromptEnhancerPanelProps {
  value: PromptTuning;
  onChange: (next: PromptTuning) => void;
}

// NOTE: This panel is intentionally small (only framing) so it doesn't change the user's prompt structure.
export default function PromptEnhancerPanel({ value, onChange }: PromptEnhancerPanelProps) {
  return (
    <div className="p-3 border border-dark-border rounded bg-dark-card space-y-3">
      <div className="font-bold text-yellow-400">Output Framing</div>

      <label className="text-sm block">
        <div className="mb-1 text-gray-300">Aspect Ratio</div>
        <select
          value={value.aspectRatio}
          onChange={(e) => onChange({ ...value, aspectRatio: e.target.value as any })}
          className="w-full rounded bg-dark-bg border border-dark-border p-2"
        >
          {ASPECT_RATIO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm block">
        <div className="mb-1 text-gray-300">Cropping</div>
        <select
          value={value.cropMode}
          onChange={(e) => onChange({ ...value, cropMode: e.target.value as any })}
          className="w-full rounded bg-dark-bg border border-dark-border p-2"
        >
          {CROP_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="text-[11px] text-gray-400 mt-1">
          Aspect ratio & crop diterapkan secara nyata pada hasil (preview & download).
        </div>
      </label>
    </div>
  );
}
