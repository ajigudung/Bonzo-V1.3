type PasFotoPresetSize = '2x3' | '3x4' | '4x6';

interface PasFotoEnhanceOptions {
  size?: PasFotoPresetSize;
}

export function enhancePasFotoPrompt(
  basePrompt: string,
  options?: PasFotoEnhanceOptions
): string {
  let enhanced = basePrompt;

  // ===== PRESET UKURAN RESMI INDONESIA =====
  if (options?.size) {
    const sizeRule = {
      '2x3': 'Final print size 2x3 cm. Head height approx 75–80% of frame.',
      '3x4': 'Final print size 3x4 cm. Head height approx 70–75% of frame.',
      '4x6': 'Final print size 4x6 cm. Head height approx 65–70% of frame.',
    }[options.size];

    enhanced += `
[INDONESIAN PHOTO SIZE PRESET]
• ${sizeRule}
• Maintain proportional scaling, no face distortion
`;
  }

  // ===== AUTO FACE CROP + SHOULDER ALIGNMENT =====
  enhanced += `
[AUTO FACE CROP & ALIGNMENT]
• Automatically detect face bounding box
• Crop symmetrically left/right
• Align shoulders horizontally
• Center head vertically
• Ensure full head, hair, and chin visible
• No tilt, no rotation
`;

  // ===== BACKGROUND COMPLIANCE CHECK =====
  enhanced += `
[BACKGROUND COMPLIANCE RULE]
• Background must be flat, solid, uniform color
• No gradients, no texture, no shadows
• No halo around hair
• Ensure clear separation between subject and background
• Suitable for official ID, passport, and government documents
`;

  return enhanced;
}
