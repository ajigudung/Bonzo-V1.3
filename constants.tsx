
import { EnhancementPreset } from './types';

export const PRESETS: EnhancementPreset[] = [
  {
    id: 'hd-restore',
    label: 'Studio HDR',
    icon: 'fa-wand-magic-sparkles',
    prompt: 'Enhance this image to look professional, high definition, sharp details, studio lighting, perfectly balanced exposure, and vibrant but natural colors.',
    description: 'Professional color correction and sharpening'
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    icon: 'fa-film',
    prompt: 'Transform this photo into a cinematic still from a high-budget movie. Soft bokeh, dramatic lighting, anamorphic feel, moody color grading.',
    description: 'High-end movie aesthetic'
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    icon: 'fa-microchip',
    prompt: 'Apply a cyberpunk aesthetic. Neon pink and blue lighting, rainy atmosphere, holographic elements, high contrast nighttime city feel.',
    description: 'Neon-infused futuristic style'
  },
  {
    id: 'portrait-pro',
    label: 'Portrait Pro',
    icon: 'fa-user-tie',
    prompt: 'Optimize this as a high-end portrait. Smooth skin textures, sharp eye details, soft blurred background, professional portrait studio lighting.',
    description: 'Perfect for headshots and profiles'
  },
  {
    id: 'old-photo',
    label: 'Colorize',
    icon: 'fa-palette',
    prompt: 'Fully restore and colorize this photo. Remove artifacts, noise, and scratches. Apply natural, historically accurate colors to everything.',
    description: 'Bring history back to life'
  },
  {
    id: 'anime',
    label: 'Anime Style',
    icon: 'fa-mask',
    prompt: 'Redraw this image in a high-quality Studio Ghibli anime style. Painterly backgrounds, expressive characters, whimsical lighting.',
    description: 'Artistic animated transformation'
  }
];
