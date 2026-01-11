// Output framing controls.
// Important: This is intentionally minimal so it does NOT alter the user's carefully designed prompt.

export type AspectRatioOption =
  | 'original'
  | '1:1'
  | '3:4'
  | '4:3'
  | '4:5'
  | '5:4'
  | '4:6'
  | '6:4'
  | '9:16'
  | '16:9';

export type CropMode = 'fit' | 'fill';

export interface PromptTuning {
  aspectRatio: AspectRatioOption;
  cropMode: CropMode;
}

export const defaultPromptTuning: PromptTuning = {
  aspectRatio: 'original',
  cropMode: 'fit',
};

export const ASPECT_RATIO_OPTIONS: { label: string; value: AspectRatioOption }[] = [
  { label: 'Original', value: 'original' },
  { label: '1 : 1', value: '1:1' },
  { label: '3 : 4', value: '3:4' },
  { label: '4 : 3', value: '4:3' },
  { label: '4 : 5', value: '4:5' },
  { label: '5 : 4', value: '5:4' },
  { label: '4 : 6', value: '4:6' },
  { label: '6 : 4', value: '6:4' },
  { label: '9 : 16', value: '9:16' },
  { label: '16 : 9', value: '16:9' },
];

export const CROP_OPTIONS: { label: string; value: CropMode }[] = [
  { label: 'Fit (contain)', value: 'fit' },
  { label: 'Fill (crop)', value: 'fill' },
];

/**
 * Keep prompt add-on *minimal* to avoid changing the meaning of the user's prompt.
 * Aspect ratio/crop are also enforced client-side in the export pipeline.
 */
export function buildPromptTuningText(tuning: PromptTuning): string {
  // Default = do not modify prompt at all.
  if (tuning.aspectRatio === 'original' && tuning.cropMode === 'fit') return '';

  const lines: string[] = [];
  if (tuning.aspectRatio !== 'original') lines.push(`Aspect ratio: ${tuning.aspectRatio}.`);
  if (tuning.cropMode === 'fill') lines.push('Cropping: fill the frame (crop if needed).');
  else lines.push('Cropping: fit/contain (avoid cropping if possible).');

  if (!lines.length) return '';
  return `[OUTPUT FRAMING]\n${lines.join('\n')}`;
}
