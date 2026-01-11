import React from 'react';

export interface UIParam {
  key: string;
  label: string;
  type: 'range' | 'select' | 'number';
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  default: number | string;
}

interface Props {
  params: UIParam[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export default function PromptParams({ params, values, onChange }: Props) {
  return (
    <div className="space-y-4">
      {params.map((p) => (
        <div key={p.key}>
          <label className="block text-sm mb-1 text-gray-300">
            {p.label}: <span className="text-purple-400">{values[p.key]}</span>
          </label>

          {p.type === 'range' && (
            <input
              type="range"
              min={p.min}
              max={p.max}
              step={p.step}
              value={values[p.key]}
              onChange={(e) => onChange(p.key, Number(e.target.value))}
              className="w-full"
            />
          )}
        </div>
      ))}
    </div>
  );
}
