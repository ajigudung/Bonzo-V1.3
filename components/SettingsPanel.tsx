import React from 'react';
import PromptEnhancerPanel from './PromptEnhancerPanel';
import ResultEnhancerPanel from './ResultEnhancerPanel';
import type { PromptTuning } from '../services/promptTuning';
import type { ToneFilters } from '../services/imageFilters';

export interface SettingsPanelProps {
  show: boolean;
  onClose: () => void;
  tuning: PromptTuning;
  onTuningChange: (t: PromptTuning) => void;

  // Optional: post-process result enhancer (sliders)
  tone?: ToneFilters;
  onToneChange?: (t: ToneFilters) => void;
  onApplyTone?: () => void;
  toneDisabled?: boolean;
  toneApplying?: boolean;
}

export default function SettingsPanel({
  show,
  onClose,
  tuning,
  onTuningChange,
  tone,
  onToneChange,
  onApplyTone,
  toneDisabled,
  toneApplying,
}: SettingsPanelProps) {
  return (
    <aside className={`w-full md:w-[360px] shrink-0 ${show ? 'block' : 'hidden md:block'}`}>
      <div className="bg-dark-card border border-dark-border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-extrabold text-gray-100">Settings</div>
          <button
            type="button"
            onClick={onClose}
            className="md:hidden px-3 py-1 rounded border border-dark-border hover:bg-dark-bg text-sm"
          >
            Close
          </button>
        </div>

        <PromptEnhancerPanel value={tuning} onChange={onTuningChange} />

        {tone && onToneChange && (
          <ResultEnhancerPanel
            value={tone}
            onChange={onToneChange}
            disabled={toneDisabled}
            onApply={onApplyTone}
            applying={toneApplying}
          />
        )}
      </div>
    </aside>
  );
}
