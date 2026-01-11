import React from 'react';

export default function ProgressBar({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, Math.round(percent || 0)));

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-44 rounded bg-dark-bg border border-dark-border overflow-hidden">
        <div
          className="h-full bg-yellow-500 transition-[width] duration-200"
          style={{ width: `${p}%` }}
        />
      </div>
      <div className="text-xs font-extrabold text-yellow-400 tabular-nums w-10 text-right">{p}%</div>
    </div>
  );
}
