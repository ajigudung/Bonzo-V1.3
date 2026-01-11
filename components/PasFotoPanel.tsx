import React from 'react';

export type Gender = 'male' | 'female';

export type MaleOutfit =
  | 'original'
  | 'shirt'
  | 'shirt-tie'
  | 'shirt-suit'
  | 'shirt-tie-suit';

export type FemaleOutfit =
  | 'original'
  | 'blouse'
  | 'blouse-blazer'
  | 'hijab-blouse'
  | 'hijab-blazer';

export type RetouchLevel = 'none' | 'natural' | 'clean';
export type HeadCrop = 'standard' | 'tight' | 'loose';

export interface PasFotoSettings {
  gender: Gender;
  maleOutfit: MaleOutfit;
  femaleOutfit: FemaleOutfit;

  bgColor: string; // solid color
  retouch: RetouchLevel;
  headCrop: HeadCrop;
}

export const defaultPasFotoSettings: PasFotoSettings = {
  gender: 'male',
  maleOutfit: 'original',
  femaleOutfit: 'original',
  bgColor: '#3b82f6',
  retouch: 'natural',
  headCrop: 'standard',
};

function outfitPrompt(s: PasFotoSettings): string {
  if (s.gender === 'male') {
    switch (s.maleOutfit) {
      case 'shirt':
        return 'Wear a clean white formal shirt.';
      case 'shirt-tie':
        return 'Wear a white shirt with a dark neutral tie.';
      case 'shirt-suit':
        return 'Wear a white shirt with a formal dark suit jacket.';
      case 'shirt-tie-suit':
        return 'Wear a white shirt, dark tie, and formal suit jacket.';
      default:
        return 'Preserve original male clothing.';
    }
  }

  switch (s.femaleOutfit) {
    case 'blouse':
      return 'Wear a clean formal blouse suitable for ID photo.';
    case 'blouse-blazer':
      return 'Wear a formal blouse with blazer.';
    case 'hijab-blouse':
      return 'Wear a neat hijab with formal blouse.';
    case 'hijab-blazer':
      return 'Wear a neat hijab with formal blouse and blazer.';
    default:
      return 'Preserve original female clothing.';
  }
}

function retouchPrompt(r: RetouchLevel): string {
  switch (r) {
    case 'none':
      return 'No retouching at all.';
    case 'clean':
      return 'Clean but natural retouching: remove minor blemishes, reduce shine, keep skin texture (no beauty filter).';
    default:
      return 'Natural light retouching: subtle cleanup, keep identity and texture.';
  }
}

function headCropPrompt(c: HeadCrop): string {
  switch (c) {
    case 'tight':
      return 'Tighter crop: head height ~78–85% of frame. Keep hair and chin fully visible.';
    case 'loose':
      return 'Looser crop: head height ~62–70% of frame. Leave more shoulder space.';
    default:
      return 'Standard crop: head height ~70–80% of frame.';
  }
}

/**
 * Text addon to be appended when user selects "Pas Foto".
 * NOTE: aspect ratio is NOT declared here anymore; it is controlled by Prompt Enhancer.
 */
export function buildPasFotoPromptAddon(s: PasFotoSettings): string {
  return `PAS FOTO (INDONESIA ID PHOTO):
• Background: solid color ${s.bgColor}, evenly lit, no gradients, no corner glow, no vignette.
• Pose: frontal, neutral expression, eyes looking straight at camera.
• Lighting: soft studio lighting, even exposure, clean tones.
• Retouching: ${retouchPrompt(s.retouch)}
• Clothing: ${outfitPrompt(s)}
• Auto face crop rules:
  - ${headCropPrompt(s.headCrop)}
  - Eyes at ~55–60% from top
  - Do not crop hair or chin
  - Keep shoulders visible (ID photo look)`;
}

export interface PasFotoPanelProps {
  value: PasFotoSettings;
  onChange: (next: PasFotoSettings) => void;
}

/**
 * Legacy right-panel UI (not used in Ajigudung State).
 * We keep it for flexibility, but Pas Foto controls are now in the Canvas.
 */
export default function PasFotoPanel({ value, onChange }: PasFotoPanelProps) {
  return (
    <div className="p-3 border border-dark-border rounded bg-dark-card space-y-3">
      <div className="font-bold text-cyan-400">Pas Foto Settings</div>

      <div className="grid grid-cols-1 gap-3">
        <label className="text-sm">
          <div className="mb-1 text-gray-300">Gender</div>
          <select
            value={value.gender}
            onChange={(e) => onChange({ ...value, gender: e.target.value as any })}
            className="w-full rounded bg-dark-bg border border-dark-border p-2"
          >
            <option value="male">Pria</option>
            <option value="female">Wanita</option>
          </select>
        </label>

        {value.gender === 'male' && (
          <label className="text-sm">
            <div className="mb-1 text-gray-300">Outfit</div>
            <select
              value={value.maleOutfit}
              onChange={(e) => onChange({ ...value, maleOutfit: e.target.value as any })}
              className="w-full rounded bg-dark-bg border border-dark-border p-2"
            >
              <option value="original">Original</option>
              <option value="shirt">Kemeja Putih</option>
              <option value="shirt-tie">Kemeja + Dasi</option>
              <option value="shirt-suit">Kemeja + Jas</option>
              <option value="shirt-tie-suit">Kemeja + Dasi + Jas</option>
            </select>
          </label>
        )}

        {value.gender === 'female' && (
          <label className="text-sm">
            <div className="mb-1 text-gray-300">Outfit</div>
            <select
              value={value.femaleOutfit}
              onChange={(e) => onChange({ ...value, femaleOutfit: e.target.value as any })}
              className="w-full rounded bg-dark-bg border border-dark-border p-2"
            >
              <option value="original">Original</option>
              <option value="blouse">Blouse</option>
              <option value="blouse-blazer">Blouse + Blazer</option>
              <option value="hijab-blouse">Hijab + Blouse</option>
              <option value="hijab-blazer">Hijab + Blazer</option>
            </select>
          </label>
        )}

        <label className="text-sm">
          <div className="mb-1 text-gray-300">Retouch</div>
          <select
            value={value.retouch}
            onChange={(e) => onChange({ ...value, retouch: e.target.value as any })}
            className="w-full rounded bg-dark-bg border border-dark-border p-2"
          >
            <option value="none">None</option>
            <option value="natural">Natural</option>
            <option value="clean">Clean</option>
          </select>
        </label>

        <label className="text-sm">
          <div className="mb-1 text-gray-300">Head crop</div>
          <select
            value={value.headCrop}
            onChange={(e) => onChange({ ...value, headCrop: e.target.value as any })}
            className="w-full rounded bg-dark-bg border border-dark-border p-2"
          >
            <option value="standard">Standard</option>
            <option value="tight">Tight</option>
            <option value="loose">Loose</option>
          </select>
        </label>

        <label className="text-sm">
          <div className="mb-1 text-gray-300">Background color</div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value.bgColor}
              onChange={(e) => onChange({ ...value, bgColor: e.target.value })}
              className="h-10 w-12 rounded border border-dark-border bg-dark-bg"
            />
            <div className="text-xs text-gray-400">{value.bgColor}</div>
          </div>
        </label>
      </div>
    </div>
  );
}
