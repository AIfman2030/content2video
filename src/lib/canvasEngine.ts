// Main canvas engine — split into focused sub-modules to keep files manageable.
import type { GeneratedContent, StyleType, ChineseOptions, AIOptions, NatureContent, SubtitleOptions, CityOptions, MangaContent, MangaOptions, AItechOptions, NatureOptions, TitleOptions } from '../types/video';
import { getThemeConfig } from './themes';
import { loadShapeImage } from './shapes';
import { CHINESE_SHAPES, CITY_SHAPES, AI_SHAPES } from './themes';

import { CW, CH, seededRandom, T, totalDuration, aiTechPhases } from './engine/helpers';
import { initChineseEffects } from './engine/chinese';
import { initCityEffects } from './engine/city';
import { initAIEffects } from './engine/aitech';
import { drawTitle } from './engine/title';
import { drawCards } from './engine/cards';
import { drawOutro, drawOverlays } from './engine/outro';
import { drawNatureScene, natureTotalMs } from './engine/nature-scene';
import { cityTotalMs } from './engine/cards-city';
import {
  drawSubtitle, subtitleTotalMs,
  initSubtitleParticles, type SubParticle,
} from './engine/subtitle';
import {
  drawTranslation, TR_TOTAL_MS,
  initTrParticles, type TrParticle,
} from './engine/translation';
import { drawMangaScene, mangaTotalMs } from './engine/manga';

// ── Image proxy: fetch via Supabase edge function → Blob URL (always origin-clean) ──
const SUPABASE_URL = "https://spb-t4ngxi6xsx650369.supabase.opentrust.net";
const SUPABASE_ANON_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi10NG5neGk2eHN4NjUwMzY5IiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzY5MjgzNDAsImV4cCI6MjA5MjUwNDM0MH0.EHz1XRSbWC1AktqItCyzJ5uK5bTPVGEpsots4QJMHyI";

async function loadCanvasImage(imageUrl: string): Promise<HTMLImageElement> {
  const empty = new Image();
  if (!imageUrl) return empty;
  try {
    const proxyUrl = `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    const resp = await fetch(proxyUrl, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!resp.ok) return empty;
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    return await new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(empty);
      img.src = blobUrl; // Blob URLs are always origin-clean — no crossOrigin needed
    });
  } catch {
    return empty;
  }
}

export { CW, CH };

export interface AnimEngine {
  start: () => void;
  stop: () => void;
  restart: (onComplete?: () => void) => void;
  seekTo: (ms: number) => void;
  getElapsed: () => number;
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
  subtitleOptions?: SubtitleOptions,
  accentOverride?: string,
  cityOptions?: CityOptions,
  mangaContent?: MangaContent,
  mangaOptions?: MangaOptions,
  aitechOptions?: AItechOptions,
  natureOptions?: NatureOptions,
  titleOptions?: TitleOptions,
): Promise<AnimEngine> {
  const theme = getThemeConfig(style, chineseOptions);
  // Allow per-style accent override (affects BG, title, overlays, shape decoration)
  const accent  = accentOverride ?? theme.accent;
  const accent2 = theme.accent2;
  const isNature      = style === 'nature';
  const isSubtitle    = style === 'subtitle';
  const isTranslation = style === 'translation';
  const isManga       = style === 'manga';

  const rand = seededRandom(coverIndex * 31 + content.points.length * 17 + 7);

  // Shape image not needed for nature, subtitle, translation, or manga styles
  let shapeImg: HTMLImageElement | null = null;
  if (!isNature && !isSubtitle && !isTranslation && !isManga) {
    const shapeList = style === 'chinese' ? CHINESE_SHAPES
      : style === 'city' ? CITY_SHAPES : AI_SHAPES;
    const shapeId = shapeList[coverIndex % shapeList.length]?.id ?? shapeList[0].id;
    const shapeColor = style === 'city' ? '#f5d87a' : accent;
    const lineWidth = style === 'chinese' ? (chineseOptions?.lineWidth ?? 2) : 1.5;
    shapeImg = await loadShapeImage(style, shapeId, shapeColor, lineWidth);
  }

  // Manga: pre-load all images via proxy → Blob URLs (origin-clean for canvas)
  let mangaImages: HTMLImageElement[] = [];
  if (isManga && mangaContent) {
    mangaImages = await Promise.all(
      mangaContent.segments.map(s => loadCanvasImage(s.imageUrl ?? ''))
    );
  }

  const chineseEffects = style === 'chinese'  ? initChineseEffects(rand) : null;
  const cityEffects    = style === 'city'      ? initCityEffects(rand)    : null;
  const aiEffects      = style === 'aitech'    ? initAIEffects(rand)      : null;
  const subtitlePs: SubParticle[] | null = isSubtitle
    ? initSubtitleParticles(rand) : null;
  const trPs: TrParticle[] | null = isTranslation
    ? initTrParticles(rand) : null;

  const slideDurMs = mangaOptions?.slideDurationMs ?? 4000;

  const ctx = canvas.getContext('2d')!;
  const total = isManga
    ? mangaTotalMs(mangaContent?.segments.length ?? 0, slideDurMs)
    : isNature
      ? natureTotalMs(
          natureContent?.leftItems.length ?? 0,
          natureContent?.rightItems.length ?? 0,
          natureContent?.commonItems?.length ?? 0,
        )
      : isSubtitle
        ? subtitleTotalMs(content, subtitleOptions)
        : isTranslation
          ? TR_TOTAL_MS
          : style === 'city'
            ? cityTotalMs(content.points.length)
            : style === 'aitech'
              ? aiTechPhases(content.points.length).total
              : totalDuration(content.points.length);

  let rafId = 0, startTime = 0, running = false;
  let lastElapsed = 0;
  let completionCallback = onComplete;

  function render(elapsed: number) {
    ctx.clearRect(0, 0, CW, CH);

    // ── Manga: fully self-contained pipeline ──
    if (isManga && mangaContent && mangaOptions) {
      drawMangaScene(ctx, elapsed, mangaContent, mangaOptions, mangaImages);
      return;
    }

    // ── Subtitle: fully self-contained pipeline ──
    if (isSubtitle && subtitlePs) {
      drawSubtitle(ctx, elapsed, content, subtitlePs, subtitleOptions);
      return;
    }

    // ── Translation: fully self-contained pipeline ──
    if (isTranslation && trPs) {
      drawTranslation(ctx, elapsed, content, trPs);
      return;
    }

    if (isNature && natureContent) {
      drawNatureScene(ctx, elapsed, natureContent, accent, accent2, coverIndex, natureOptions);
      // Nature title is handled by unified drawTitle
      const natureTitleContent: GeneratedContent = { title: natureContent.title, points: [] };
      drawTitle(ctx, elapsed, natureTitleContent, accent, accent2, 'nature', titleOptions);
      return;
    }

    if (style === 'chinese' && chineseEffects) {
      // Static black background (user request: no animated bg)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CW, CH);
    } else if (style === 'city' && cityEffects) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CW, CH);
    } else if (style === 'aitech' && aiEffects) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CW, CH);
    }

    // Shape decoration removed — background is plain black
    drawTitle(ctx, elapsed, content, accent, accent2, style, titleOptions);
    drawCards(ctx, elapsed, content, accent, accent2, style, shapeImg!, aitechOptions?.polyShape ?? aiOptions?.polyShape, coverIndex, chineseOptions, cityOptions, aitechOptions);

    const outroStart = (style === 'city'
      ? cityTotalMs(content.points.length)
      : totalDuration(content.points.length)) - T.outroDur;
    // aitech has its own phase-5 outro built into drawAITechCards
    if (style !== 'aitech' && elapsed > outroStart) {
      drawOutro(ctx, elapsed - outroStart, content, accent, accent2, style);
    }

    drawOverlays(ctx, elapsed, accent, style);
  }

  function tick(now: number) {
    if (!running) return;
    const elapsed = now - startTime;
    lastElapsed = elapsed;
    render(elapsed);
    if (elapsed < total) {
      rafId = requestAnimationFrame(tick);
    } else {
      running = false;
      lastElapsed = total;
      render(total);
      completionCallback?.();
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
      startTime = performance.now() - lastElapsed;
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
      lastElapsed = 0;
      running = true;
      startTime = performance.now();
      rafId = requestAnimationFrame(tick);
    },
    seekTo(ms: number) {
      running = false;
      cancelAnimationFrame(rafId);
      const clamped = Math.max(0, Math.min(ms, total));
      lastElapsed = clamped;
      render(clamped);
    },
    getElapsed: () => lastElapsed,
    isRunning: () => running,
    getTotalMs: () => total,
  };
}
