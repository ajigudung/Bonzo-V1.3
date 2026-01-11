export type LightingMode = 'light' | 'dark';
export type SceneMode = 'clean' | 'crowded';
export interface CreativeDirection {
  key: string;
  name: string;
  text: string;
  recommendedScene?: SceneMode;
}

export interface EffectPack {
  key: string;
  name: string;
  text: string;
}

export const BASE_PRODUCT_PROMPT = `Use the uploaded product photo as the ONLY reference. Keep the product identity EXACT: same shape, proportions, label/logo placement, colors, materials, text, and fine details. Do not modify the product design.

Create a photorealistic commercial product photo with natural shadows and realistic reflections. The product must be perfectly sharp and clean. Background and props must NOT cover or distort any part of the product.

Strict negatives: no extra objects attached to the product, no fake brand marks, no new text, no watermark, no frame, no collage borders, no distorted edges. No corner haze, no white vignette, no light leaks, no glow in corners, no fog, no halos.

CAMERA/QUALITY: modern high-resolution product photography, crisp detail, clean tones.`;

export const LIGHTING_TEXT: Record<LightingMode, string> = {
  light:
    'High-key soft studio light, even exposure, clean whites, gentle shadow falloff, fresh and airy look.',
  dark:
    'Low-key cinematic lighting, controlled specular highlights, deep shadows, premium dramatic contrast, no haze.',
};

export const SCENE_TEXT: Record<SceneMode, string> = {
  clean:
    'Indoor studio setup. Minimal props. Seamless background or subtle smooth gradient (no corner glow). E-commerce ready.',
  crowded:
    'Outdoor/lifestyle context with heavy background bokeh. The product is the hero in sharp focus. No readable signage or text. No faces.',
};

export const VARIATION_SUFFIX = [
  'VARIATION A: safest commercial look, minimal styling, clean hero composition.',
  'VARIATION B: slightly more stylized lighting accents and modern props, still realistic.',
  'VARIATION C: alternate angle and surface (matte vs glossy), subtle color grade shift.',
  'VARIATION D: bold youthful concept (still photorealistic), strong mood, product unchanged.',
];

export const CREATIVE_DIRECTIONS: CreativeDirection[] = [
  {
    key: 'genz_pop_minimal',
    name: 'Gen‑Z Pop Minimal',
    text: 'Gen-Z pop color palette, clean modern ad aesthetic, bright but tasteful, minimal geometric props, crisp shadows.',
    recommendedScene: 'clean',
  },
  {
    key: 'kpop_glossy',
    name: 'K‑Pop Glossy Commercial',
    text: 'K-pop glossy commercial vibe, polished highlights, smooth background, premium clean styling, subtle sparkle bokeh far behind.',
    recommendedScene: 'clean',
  },
  {
    key: 'y2k_flash',
    name: 'Y2K Flash Studio',
    text: 'Y2K flash vibe, slightly punchy exposure, glossy acrylic blocks, playful but premium styling, crisp reflections.',
    recommendedScene: 'clean',
  },
  {
    key: 'tech_minimal',
    name: 'Tech Minimal (Apple-like)',
    text: 'Ultra-clean tech ad, cool whites, glass/acrylic props, precise reflections, minimal clutter, premium modern look.',
    recommendedScene: 'clean',
  },
  {
    key: 'scandi_soft',
    name: 'Scandinavian Soft Minimal',
    text: 'Scandinavian minimal studio, warm neutral tones, soft daylight feel, natural wood + linen props, calm aesthetic.',
    recommendedScene: 'clean',
  },
  {
    key: 'luxury_black',
    name: 'Luxury Black Premium',
    text: 'Luxury black studio, controlled specular highlights, glossy reflection base, spotlight falloff, high-end premium look.',
    recommendedScene: 'clean',
  },
  {
    key: 'chrome_glass',
    name: 'Chrome & Glass Futurism',
    text: 'Futuristic studio with chrome accents and glass prisms, subtle iridescent reflections, sleek high-tech styling.',
    recommendedScene: 'clean',
  },
  {
    key: 'holo_foil',
    name: 'Holographic Foil Accent',
    text: 'Holographic foil background accent (out of focus), modern youth aesthetic, clean product hero shot, no text.',
    recommendedScene: 'clean',
  },
  {
    key: 'pastel_kawaii',
    name: 'Pastel Kawaii Studio',
    text: 'Pastel kawaii studio, soft rounded props, candy colors, gentle lighting, cute modern minimal set.',
    recommendedScene: 'clean',
  },
  {
    key: 'editorial_fashion',
    name: 'Editorial Fashion Product',
    text: 'Editorial fashion campaign style, tasteful shadows, textured backdrop (smooth), modern magazine vibe, product hero.',
  },
  {
    key: 'film_clean',
    name: 'Clean Film Look',
    text: '35mm film-inspired look, subtle grain, gentle highlight rolloff, realistic tone mapping, still crisp product edges.',
  },
  {
    key: 'neon_tube_accent',
    name: 'Neon Tube Accent (Studio)',
    text: 'Single neon tube accent light (subtle), modern youth mood, controlled highlights, product remains natural and sharp.',
    recommendedScene: 'clean',
  },
  {
    key: 'floating_hero',
    name: 'Floating Hero Shot',
    text: 'Floating product hero shot with realistic shadow underneath, clean studio background, premium ad style.',
    recommendedScene: 'clean',
  },
  {
    key: 'night_market',
    name: 'Night Market Neon Bokeh',
    text: 'Night market vibe with colorful neon bokeh lights, urban youth energy, product sharp in foreground, cinematic mood.',
    recommendedScene: 'crowded',
  },
  {
    key: 'streetwear_campaign',
    name: 'Streetwear Campaign',
    text: 'Streetwear campaign look, concrete textures, cool tone, shallow depth of field, background crowd as soft silhouettes only.',
    recommendedScene: 'crowded',
  },
  {
    key: 'cafe_morning',
    name: 'Café Morning Lifestyle',
    text: 'Morning café scene, warm window light, soft bokeh, cozy aesthetic, product on table, natural lifestyle vibe.',
    recommendedScene: 'crowded',
  },
  {
    key: 'rooftop_golden',
    name: 'Rooftop Golden Hour',
    text: 'Rooftop golden-hour party vibe, warm bokeh lights, modern youth mood, product hero shot, no faces, no text.',
    recommendedScene: 'crowded',
  },
  {
    key: 'festival_lights',
    name: 'Festival Color Lights',
    text: 'Music festival ambiance, colorful light bokeh, energetic vibe, product sharp, background very soft and abstract.',
    recommendedScene: 'crowded',
  },
  {
    key: 'city_crosswalk_night',
    name: 'City Crosswalk Night',
    text: 'Urban city night scene, wet pavement reflections, neon signage bokeh (unreadable), moody cinematic lighting.',
    recommendedScene: 'crowded',
  },
  {
    key: 'beach_golden',
    name: 'Beach Golden Hour',
    text: 'Beach sunset lifestyle scene, warm glow, soft bokeh, airy youth vibe, product in focus, natural shadows.',
    recommendedScene: 'crowded',
  },
  {
    key: 'rainy_reflection',
    name: 'Rainy Street Reflection',
    text: 'Rainy street mood, subtle raindrop bokeh, reflections on ground, dramatic but realistic, product remains clean and dry.',
    recommendedScene: 'crowded',
  },
  {
    key: 'skate_park',
    name: 'Skate Park Urban',
    text: 'Skate park background, gritty textures, energetic youth vibe, shallow depth of field, product sharp and premium.',
    recommendedScene: 'crowded',
  },
  {
    key: 'gym_energy',
    name: 'Gym / Sport Energy',
    text: 'Sporty lifestyle setting, dynamic bokeh highlights, clean modern tones, product hero on bench/locker, no logos.',
    recommendedScene: 'crowded',
  },
  {
    key: 'cozy_room',
    name: 'Cozy Bedroom Aesthetic',
    text: 'Cozy bedroom aesthetic, warm fairy-light bokeh, soft textiles, modern youth vibe, product in sharp focus.',
    recommendedScene: 'crowded',
  },
  {
    key: 'outdoor_greenery',
    name: 'Outdoor Greenery Tabletop',
    text: 'Outdoor tabletop scene, natural daylight, greenery bokeh, simple lifestyle vibe, product remains the hero.',
    recommendedScene: 'crowded',
  },
  {
    key: 'cyberpunk_night',
    name: 'Cyberpunk Street Night',
    text: 'Cyberpunk-inspired city night bokeh, teal/magenta accents, rain reflections, dramatic rim light, still photorealistic.',
    recommendedScene: 'crowded',
  },
  {
    key: 'food_truck',
    name: 'Food Truck Street',
    text: 'Food truck street ambiance, warm bokeh lights, friendly youth vibe, product foreground sharp, background soft.',
    recommendedScene: 'crowded',
  },
  {
    key: 'modern_mall',
    name: 'Modern Mall Interior',
    text: 'Modern mall interior, bright clean lighting, shallow depth of field, stylish lifestyle vibe, product hero shot.',
    recommendedScene: 'crowded',
  },
];

export const EFFECT_PACKS: EffectPack[] = [
  {
    key: 'prism_accent',
    name: 'Prism Accent',
    text: 'Add subtle prism refraction highlights in the background only (not on product edges), no light leaks.',
  },
  {
    key: 'gel_accent',
    name: 'Gel Accent Light',
    text: 'Use a very subtle colored gel accent (teal/pink) on background only, product color must stay accurate.',
  },
  {
    key: 'glossy_base',
    name: 'Glossy Reflection Base',
    text: 'Place the product on a glossy acrylic reflection base with controlled reflections.',
  },
  {
    key: 'matte_premium',
    name: 'Matte Premium Surface',
    text: 'Use a matte premium surface (stone/ceramic) with soft natural shadows.',
  },
  {
    key: 'micro_sparkle',
    name: 'Micro Sparkle Bokeh',
    text: 'Add tiny sparkle bokeh far in the background, very subtle, no haze.',
  },
  {
    key: 'acrylic_blocks',
    name: 'Geometric Acrylic Blocks',
    text: 'Add minimal acrylic geometric blocks as props, modern youth style, do not cover the product.',
  },
];

export interface BuildProductPromptInput {
  lighting: LightingMode;
  scene: SceneMode;
  creative: CreativeDirection;
  effects: EffectPack[];
  tuningText?: string;
  variationIndex?: number;
}

export function buildProductPrompt(input: BuildProductPromptInput): string {
  const parts: string[] = [];
  parts.push(BASE_PRODUCT_PROMPT);
  parts.push(`LIGHTING MODE: ${input.lighting === 'light' ? 'Light' : 'Dark'}`);
  parts.push(`SCENE MODE: ${input.scene === 'clean' ? 'Clean studio' : 'Crowded outdoor/lifestyle'}`);
  parts.push(`\n${LIGHTING_TEXT[input.lighting]}`);
  parts.push(`\n${SCENE_TEXT[input.scene]}`);
  parts.push(`\nCREATIVE DIRECTION:\n${input.creative.text}`);
  if (input.effects.length) {
    parts.push(`\nEFFECTS:\n${input.effects.map((e) => `- ${e.text}`).join('\n')}`);
  }
  if (input.tuningText?.trim()) {
    parts.push(`\nPROMPT ENHANCER:\n${input.tuningText.trim()}`);
  }
  const idx = input.variationIndex ?? 0;
  const suffix = VARIATION_SUFFIX[idx] ?? VARIATION_SUFFIX[0];
  parts.push(`\n\n[VARIATION]\n${suffix}`);
  return parts.join('\n');
}

export function pickCreatives(scene: SceneMode, count: number, rng: () => number): CreativeDirection[] {
  const preferred = CREATIVE_DIRECTIONS.filter((c) => !c.recommendedScene || c.recommendedScene === scene);
  const pool = preferred.length >= count ? preferred : CREATIVE_DIRECTIONS;
  const picked: CreativeDirection[] = [];
  const used = new Set<string>();
  while (picked.length < count && used.size < pool.length) {
    const item = pool[Math.floor(rng() * pool.length)];
    if (!used.has(item.key)) {
      used.add(item.key);
      picked.push(item);
    }
  }
  // Fallback if pool is too small
  while (picked.length < count) {
    picked.push(pool[picked.length % pool.length]);
  }
  return picked;
}

export function pickEffectPacks(count: number, rng: () => number): EffectPack[] {
  if (count <= 0) return [];
  const picked: EffectPack[] = [];
  const used = new Set<string>();
  while (picked.length < count && used.size < EFFECT_PACKS.length) {
    const item = EFFECT_PACKS[Math.floor(rng() * EFFECT_PACKS.length)];
    if (!used.has(item.key)) {
      used.add(item.key);
      picked.push(item);
    }
  }
  return picked;
}
