// characterPrompts.ts — Image prompts for 3 manga character sub-styles
import type { MangaImageStyle } from '@/types/video';

export interface CharacterPromptConfig {
  prefix: string;        // prepended to every scene prompt
  suffix: string;        // appended to every scene prompt  
  negativePrompt: string;
  styleDesc: string;     // human-readable description for UI
}

const CHARACTER_PROMPTS: Record<MangaImageStyle, CharacterPromptConfig> = {
  default: {
    prefix: 'Anime illustration, manga style, vibrant colors, dynamic composition. ',
    suffix: ', high quality anime art, soft cel shading, detailed background, 4k',
    negativePrompt: 'ugly, deformed, low quality, watermark, text',
    styleDesc: '漫画风格',
  },
  cat3d: {
    prefix: 'A cute 3D Pixar-style cat in a grey business suit, expressive face, cinematic lighting, ',
    suffix: ',Pixar style, C4D render, soft volumetric light, warm color palette, high detail, 8k',
    negativePrompt: 'ugly, deformed, ugly cat, scary, dark, low quality, watermark, watermark text, lowres',
    styleDesc: '3D猫咪',
  },
  zen: {
    prefix: 'A wise Chinese zen master in traditional robes, ink wash painting style, misty mountains, contemplative atmosphere, ',
    suffix: ',Chinese ink painting, zen aesthetic, ethereal mist, poetic, high detail',
    negativePrompt: 'ugly, deformed, cartoon, western, low quality, watermark, text',
    styleDesc: '玄学禅师',
  },
  elite: {
    prefix: 'A confident young man in a sharp tailored suit, film noir lighting, urban cityscape at night, ',
    suffix: ',cinematic lighting, film grain, shallow depth of field, professional photography, 8k',
    negativePrompt: 'ugly, deformed, cartoon, casual, low quality, watermark, text',
    styleDesc: '都市精英',
  },
};

export function getCharacterPromptConfig(style: MangaImageStyle): CharacterPromptConfig {
  return CHARACTER_PROMPTS[style] || CHARACTER_PROMPTS.default;
}

export function buildCharacterImagePrompt(scene: string, style: MangaImageStyle): string {
  const config = getCharacterPromptConfig(style);
  return `${config.prefix}${scene}${config.suffix}`;
}

export function getCharacterNegativePrompt(style: MangaImageStyle): string {
  return getCharacterPromptConfig(style).negativePrompt;
}
