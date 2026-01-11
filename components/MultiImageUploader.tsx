import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { UploadIcon, XCircleIcon } from './Icons';

export interface MultiImageValue {
  files: File[];
  previews: string[]; // object URLs (blob:...)
}

interface MultiImageUploaderProps {
  value: MultiImageValue;
  onChange: (next: MultiImageValue) => void;
  maxFiles?: number;
}

const isBlobUrl = (u: string) => typeof u === 'string' && u.startsWith('blob:');

export default function MultiImageUploader({ value, onChange, maxFiles = 5 }: MultiImageUploaderProps) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const prevPreviewsRef = useRef<string[]>(value.previews);

  // Revoke removed previews to avoid memory leaks
  useEffect(() => {
    const prev = prevPreviewsRef.current;
    const next = value.previews;
    const nextSet = new Set(next);
    for (const u of prev) {
      if (!nextSet.has(u) && isBlobUrl(u)) {
        try { URL.revokeObjectURL(u); } catch {}
      }
    }
    prevPreviewsRef.current = next;
  }, [value.previews]);

  // On unmount, revoke everything still in state
  useEffect(() => {
    return () => {
      for (const u of prevPreviewsRef.current) {
        if (isBlobUrl(u)) {
          try { URL.revokeObjectURL(u); } catch {}
        }
      }
    };
  }, []);

  const remaining = useMemo(() => Math.max(0, maxFiles - value.files.length), [maxFiles, value.files.length]);

  const addFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list).filter((f) => f.type.startsWith('image/'));
    if (incoming.length === 0) return;

    const canTake = incoming.slice(0, remaining);
    if (canTake.length === 0) return;

    const previews = canTake.map((f) => URL.createObjectURL(f));
    onChange({
      files: [...value.files, ...canTake],
      previews: [...value.previews, ...previews],
    });
  };

  const removeAt = (idx: number) => {
    const u = value.previews[idx];
    if (u && isBlobUrl(u)) {
      try { URL.revokeObjectURL(u); } catch {}
    }
    const nextFiles = value.files.filter((_, i) => i !== idx);
    const nextPrev = value.previews.filter((_, i) => i !== idx);
    onChange({ files: nextFiles, previews: nextPrev });
  };

  const onDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  const onDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  const onDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await addFiles(e.dataTransfer.files);
        e.dataTransfer.clearData();
      }
    },
    [remaining, value.files, value.previews]
  );

  return (
    <div className="space-y-3">
      {/* Thumbnails */}
      {value.previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.previews.map((src, idx) => (
            <div key={src} className="relative group">
              <img src={src} alt={`upload-${idx + 1}`} className="h-16 w-16 object-cover rounded border border-dark-border" />
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition"
                title="Remove"
              >
                <XCircleIcon className="w-6 h-6 text-red-300" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor={inputId}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dark-border border-dashed rounded-lg cursor-pointer bg-dark-bg hover:bg-gray-800 transition-colors ${
            isDragging ? 'border-brand-purple bg-gray-800' : ''
          } ${remaining === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className="flex flex-col items-center justify-center pt-4 pb-5">
            <UploadIcon className="w-10 h-4 mb-2 text-gray-500" />
            <p className="text-sm text-gray-400">
              <span className="font-semibold">Click to upload</span> atau drag & drop
            </p>
            <p className="text-xs text-gray-500 mt-1">Max {maxFiles} foto • Tersisa {remaining}</p>
          </div>
          <input
            id={inputId}
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            disabled={remaining === 0}
            onChange={async (e) => {
              await addFiles(e.target.files);
              // reset value so user can re-add the same file if needed
              e.currentTarget.value = '';
            }}
          />
        </label>
      </div>
    </div>
  );
}
