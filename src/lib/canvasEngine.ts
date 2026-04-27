// Main canvas engine — split into focused sub-modules to keep files manageable.
import type { GeneratedContent, StyleType, ChineseOptions, AIOptions, NatureContent } from '../types/video';
import { getThemeConfig } from './themes';
import { loadShapeImage } from './shapes';
import { CHINESE_SHAPES, CITY_SHAPES, AI_SHAPES } from './themes';

import { CW, CH, seededRandom, T, totalDuration } from './engine/helpers';
import { initChineseEffects, drawChineseBg } from './engine/chinese';
import { initCityEffects, drawCityBg } from './engine/city';
import { initAIEffects, drawAIBg } from './engine/aitech';
import { drawTitle } from './engine/title';
import { drawCards } from './engine/cards';
import { drawOutro, drawOverlays, drawShapeDecoration } from './engine/outro';
import { drawNatureScene, natureTotalMs } from './engine/nature-scene';
import { cityTotalMs } from './engine/cards-city';

export { CW, CH };

export interface AnimEngine {
  start: () => void;
  stop: () => void;
  restart: (onComplete?: () => void) => void;
  isRunning: () => boolean;
  getTotalMs: () => number;
}

export async function createAnimEngine(
  canvas: HTMLCanvasElement,
  content: GeneratedContent,
  style: StyleType,
  coverIndex: number,
  chineseOptions?: ChineseOptions,
  aiOptions?: AIOptions,
  natureContent?: NatureContent,
  onComplete?: () => void,
): Promise<AnimEngine> {
  const theme = getThemeConfig(style, chineseOptions);
  const isNature = style === 'nature';

  const rand = seededRandom(coverIndex * 31 + content.points.length * 17 + 7);

  // Shape image not needed for nature style
  let shapeImg: HTMLImageElement | null = null;
  if (!isNature) {
    const shapeList = style === 'chinese' ? CHINESE_SHAPES
      : style === 'city' ? CITY_SHAPES : AI_SHAPES;
    const shapeId = shapeList[coverIndex % shapeList.length]?.id ?? shapeList[0].id;
    const shapeColor = style === 'city' ? '#f5d87a' : theme.accent;
    const lineWidth = style === 'chinese' ? (chineseOptions?.lineWidth ?? 2) : 1.5;
    shapeImg = await loadShapeImage(style, shapeId, shapeColor, lineWidth);
  }

  const chineseEffects = style === 'chinese' ? initChineseEffects(rand) : null;
  const cityEffects    = style === 'city'    ? initCityEffects(rand)    : null;
  const aiEffects      = style === 'aitech'  ? initAIEffects(rand)      : null;

  const ctx = canvas.getContext('2d')!;
  const total = isNature
    ? natureTotalMs(
        natureContent?.leftItems.length ?? 0,
        natureContent?.rightItems.length ?? 0,
        natureContent?.commonItems?.length ?? 0,
      )
    : style === 'city'
      ? cityTotalMs(content.points.length)
      : totalDuration(content.points.length);

  let rafId = 0, startTime = 0, running = false;
  let completionCallback = onComplete;

  function render(elapsed: number) {
    ctx.clearRect(0, 0, CW, CH);

    if (isNature && natureContent) {
      drawNatureScene(ctx, elapsed, natureContent, theme.accent, theme.accent2, coverIndex);
      return;
    }

    if (style === 'chinese' && chineseEffects) {
      drawChineseBg(ctx, elapsed, theme.accent, chineseEffects);
    } else if (style === 'city' && cityEffects) {
      drawCityBg(ctx, elapsed, theme.accent, cityEffects);
    } else if (style === 'aitech' && aiEffects) {
      drawAIBg(ctx, elapsed, theme.accent, theme.accent2, aiEffects);
    }

    drawShapeDecoration(ctx, elapsed, shapeImg!, theme.accent, style);
    drawTitle(ctx, elapsed, content, theme.accent, theme.accent2, style);
    drawCards(ctx, elapsed, content, theme.accent, theme.accent2, style, shapeImg!, aiOptions?.polyShape, coverIndex);

    const outroStart = (style === 'city'
      ? cityTotalMs(content.points.length)
      : totalDuration(content.points.length)) - T.outroDur;
    if (elapsed > outroStart) {
      drawOutro(ctx, elapsed - outroStart, content, theme.accent, theme.accent2, style);
    }

    drawOverlays(ctx, elapsed, theme.accent, style);
  }

  function tick(now: number) {
    if (!running) return;
    const elapsed = now - startTime;
    render(elapsed);
    if (elapsed < total) {
      rafId = requestAnimationFrame(tick);
    } else {
      running = false;
      render(total);
      completionCallback?.();
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
      startTime = performance.now();
      rafId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
    restart(cb?: () => void) {
      running = false;
      cancelAnimationFrame(rafId);
      completionCallback = cb;
      running = true;
      startTime = performance.now();
      rafId = requestAnimationFrame(tick);
    },
    isRunning: () => running,
    getTotalMs: () => total,
  };
}
