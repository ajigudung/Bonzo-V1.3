import React from 'react';
import type { PasFotoSettings, Gender, RetouchLevel, HeadCrop } from './PasFotoPanel';

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded border text-sm font-semibold transition ${
        active ? 'bg-cyan-500 text-black border-cyan-400' : 'border-dark-border hover:bg-dark-bg text-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm text-gray-300 mb-2">{title}</div>
      {children}
    </div>
  );
}

export default function PasFotoCanvasControls({
  value,
  onChange,
}: {
  value: PasFotoSettings;
  onChange: (next: PasFotoSettings) => void;
}) {
  const setGender = (g: Gender) => onChange({ ...value, gender: g });
  const setRetouch = (r: RetouchLevel) => onChange({ ...value, retouch: r });
  const setHeadCrop = (c: HeadCrop) => onChange({ ...value, headCrop: c });

  const setBg = (hex: string) => onChange({ ...value, bgColor: hex });

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-4 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-gray-100">Pas Foto</div>
          <div className="text-xs text-gray-400">
            Setting Pas Foto ada di sini (canvas). Aspect ratio / crop / output quality ada di Prompt Enhancer (kanan).
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section title="1) Gender">
          <div className="grid grid-cols-2 gap-2">
            <Pill active={value.gender === 'male'} onClick={() => setGender('male')}>👔 Pria</Pill>
            <Pill active={value.gender === 'female'} onClick={() => setGender('female')}>👚 Wanita</Pill>
          </div>
        </Section>

        <Section title="2) Outfit">
          {value.gender === 'male' ? (
            <select
              value={value.maleOutfit}
              onChange={(e) => onChange({ ...value, maleOutfit: e.target.value as any })}
              className="w-full rounded bg-dark-bg border border-dark-border p-3 text-sm"
            >
              <option value="original">Original</option>
              <option value="shirt">Kemeja Putih</option>
              <option value="shirt-tie">Kemeja + Dasi</option>
              <option value="shirt-suit">Kemeja + Jas</option>
              <option value="shirt-tie-suit">Kemeja + Dasi + Jas</option>
            </select>
          ) : (
            <select
              value={value.femaleOutfit}
              onChange={(e) => onChange({ ...value, femaleOutfit: e.target.value as any })}
              className="w-full rounded bg-dark-bg border border-dark-border p-3 text-sm"
            >
              <option value="original">Original</option>
              <option value="blouse">Blouse</option>
              <option value="blouse-blazer">Blouse + Blazer</option>
              <option value="hijab-blouse">Hijab + Blouse</option>
              <option value="hijab-blazer">Hijab + Blazer</option>
            </select>
          )}
          <div className="text-[11px] text-gray-500 mt-1">Catatan: outfit hanya instruksi prompt (bukan replace baju pixel).</div>
        </Section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Section title="3) Retouch">
          <div className="grid grid-cols-3 gap-2">
            <Pill active={value.retouch === 'none'} onClick={() => setRetouch('none')}>None</Pill>
            <Pill active={value.retouch === 'natural'} onClick={() => setRetouch('natural')}>Natural</Pill>
            <Pill active={value.retouch === 'clean'} onClick={() => setRetouch('clean')}>Clean</Pill>
          </div>
        </Section>

        <Section title="4) Head crop">
          <div className="grid grid-cols-3 gap-2">
            <Pill active={value.headCrop === 'loose'} onClick={() => setHeadCrop('loose')}>Loose</Pill>
            <Pill active={value.headCrop === 'standard'} onClick={() => setHeadCrop('standard')}>Standard</Pill>
            <Pill active={value.headCrop === 'tight'} onClick={() => setHeadCrop('tight')}>Tight</Pill>
          </div>
        </Section>

        <Section title="5) Background color">
          <div className="grid grid-cols-4 gap-2 mb-2">
            <Pill active={value.bgColor.toLowerCase() === '#ffffff'} onClick={() => setBg('#ffffff')}>White</Pill>
            <Pill active={value.bgColor.toLowerCase() === '#3b82f6'} onClick={() => setBg('#3b82f6')}>Blue</Pill>
            <Pill active={value.bgColor.toLowerCase() === '#ef4444'} onClick={() => setBg('#ef4444')}>Red</Pill>
            <Pill active={value.bgColor.toLowerCase() === '#9ca3af'} onClick={() => setBg('#9ca3af')}>Gray</Pill>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value.bgColor}
              onChange={(e) => setBg(e.target.value)}
              className="h-10 w-12 rounded border border-dark-border bg-dark-bg"
              title="Custom color"
            />
            <div className="text-xs text-gray-400">{value.bgColor}</div>
          </div>
        </Section>
      </div>
    </div>
  );
}
