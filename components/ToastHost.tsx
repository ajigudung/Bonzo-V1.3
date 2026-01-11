import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Info, XCircle, X } from 'lucide-react';

export type ToastKind = 'success' | 'info' | 'error';

export type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
  createdAt: number;
  ttlMs?: number;
};

function defaultTtl(kind: ToastKind): number {
  if (kind === 'error') return 6500;
  if (kind === 'info') return 4200;
  return 3400;
}

function kindStyles(kind: ToastKind) {
  if (kind === 'success') {
    return {
      border: 'border-cyan-400/70',
      icon: <CheckCircle2 size={18} className="text-cyan-300" />,
      title: 'Success',
    };
  }
  if (kind === 'error') {
    return {
      border: 'border-red-400/70',
      icon: <XCircle size={18} className="text-red-300" />,
      title: 'Error',
    };
  }
  return {
    border: 'border-yellow-400/70',
    icon: <Info size={18} className="text-yellow-300" />,
    title: 'Info',
  };
}

export default function ToastHost(props: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  const { toasts, onDismiss } = props;

  // Exit animation state per toast id
  const [closing, setClosing] = useState<Record<string, boolean>>({});

  // Auto-dismiss timers (per toast)
  const timersRef = useRef<Map<string, number>>(new Map());

  const requestClose = useCallback(
    (id: string) => {
      setClosing((prev) => {
        if (prev[id]) return prev;
        return { ...prev, [id]: true };
      });

      // Let exit animation play, then remove
      window.setTimeout(() => {
        onDismiss(id);
        setClosing((prev) => {
          if (!prev[id]) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 220);
    },
    [onDismiss]
  );

  // Manage auto-dismiss timers for new toasts
  useEffect(() => {
    const timers = timersRef.current;

    for (const t of toasts) {
      if (timers.has(t.id)) continue;
      const ttl = t.ttlMs ?? defaultTtl(t.kind);

      const timer = window.setTimeout(() => {
        requestClose(t.id);
      }, ttl);

      timers.set(t.id, timer);
    }

    // Cleanup timers for removed toasts
    const ids = new Set(toasts.map((t) => t.id));
    for (const [id, timer] of timers.entries()) {
      if (!ids.has(id)) {
        window.clearTimeout(timer);
        timers.delete(id);
      }
    }
  }, [toasts, requestClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const timers = timersRef.current;
      for (const timer of timers.values()) window.clearTimeout(timer);
      timers.clear();
    };
  }, []);

  const sorted = useMemo(() => {
    // Newest on top
    return [...toasts].sort((a, b) => b.createdAt - a.createdAt);
  }, [toasts]);

  if (sorted.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes ajgToastIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ajgToastOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-8px) scale(0.98); }
        }
      `}</style>

      {/* 
        Responsive position:
        - Mobile: top center
        - Desktop (md+): bottom right
      */}
      <div
        className="
          fixed z-50 flex flex-col gap-2
          w-[340px] max-w-[calc(100vw-1.5rem)]
          left-1/2 top-3 -translate-x-1/2
          md:left-auto md:top-auto md:-translate-x-0
          md:right-4 md:bottom-4
        "
      >
        {sorted.map((t) => {
          const s = kindStyles(t.kind);
          const role = t.kind === 'error' ? 'alert' : 'status';
          const isClosing = !!closing[t.id];

          return (
            <div
              key={t.id}
              role={role}
              className={`bg-dark-card border border-dark-border ${s.border} border-l-4 rounded-xl shadow-lg p-3 flex gap-3 items-start`}
              style={{
                animation: isClosing
                  ? 'ajgToastOut 220ms ease forwards'
                  : 'ajgToastIn 260ms cubic-bezier(0.16, 1, 0.3, 1) both',
              }}
            >
              <div className="pt-[2px]">{s.icon}</div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-extrabold text-gray-200">{s.title}</div>
                <div className="text-sm text-gray-100 break-words">{t.message}</div>
              </div>

              <button
                type="button"
                onClick={() => requestClose(t.id)}
                className="p-1 rounded border border-dark-border hover:bg-dark-bg text-gray-200"
                aria-label="Dismiss toast"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
