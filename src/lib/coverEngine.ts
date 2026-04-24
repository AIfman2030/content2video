/**
 * coverEngine.ts
 * Dispatches to the registered cover draw function for a given style.
 * Import side-effect files to populate COVER_REGISTRY.
 */
import './cover/chinese-cover';
import './cover/city-cover';
import './cover/aitech-cover';
import './cover/nature-cover';

import { COVER_REGISTRY, COVER_W, COVER_H, CoverOpts } from './cover/registry';
import type { StyleType, GeneratedContent, NatureContent, ChineseOptions } from '../types/video';
import { getThemeConfig } from './themes';

export { COVER_W, COVER_H };

export interface DrawCoverParams {
  canvas: HTMLCanvasElement;
  style: StyleType;
  content: GeneratedContent | null;
  natureContent: NatureContent | null;
  coverIndex: number;
  chineseOptions?: ChineseOptions;
}

export async function drawCover(params: DrawCoverParams): Promise<void> {
  const { canvas, style, content, natureContent, coverIndex, chineseOptions } = params;

  canvas.width  = COVER_W;
  canvas.height = COVER_H;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, COVER_W, COVER_H);

  const theme = getThemeConfig(style, chineseOptions);

  // Build opts from whichever content model is active
  const opts: CoverOpts = {
    title:   (style === 'nature' ? natureContent?.title : content?.title) ?? '精彩内容',
    subtitle: style === 'nature'
      ? (natureContent?.leftTitle && natureContent?.rightTitle
          ? `${natureContent.leftTitle} vs ${natureContent.rightTitle}`
          : undefined)
      : undefined,
    items:       style === 'nature'
      ? (natureContent?.leftItems ?? [])
      : (content?.points.map(p => p.label) ?? []),
    commonItems: style === 'nature' ? (natureContent?.commonItems ?? []) : [],
    accent:     theme.accent,
    accent2:    theme.accent2,
    coverIndex,
  };

  const fn = COVER_REGISTRY[style];
  if (!fn) {
    // Fallback: plain gradient with title
    const bg = ctx.createLinearGradient(0, 0, COVER_W, COVER_H);
    bg.addColorStop(0, '#0a0a14'); bg.addColorStop(1, '#12121f');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, COVER_W, COVER_H);
    ctx.font = `900 80px "Noto Sans SC", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.accent; ctx.fillText(opts.title, COVER_W / 2, COVER_H / 2);
    return;
  }

  await fn(ctx, opts);
}
