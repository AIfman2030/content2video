// manga.ts — Canvas rendering engine for the manga subtitle video style.
// Full-screen image + Ken-Burns effect + subtitle + disclaimer.
import { CW, CH, clamp, lerp, easeOutCubic } from './helpers';
import type { MangaContent, MangaOptions } from '../../types/video';

const TRANS_DUR  = 500;  // cross-fade between images (ms)
const ENTER_DUR  = 400;  // subtitle slide-in (ms)
const EXIT_DUR   = 300;  // subtitle fade-out (ms)
const OUTRO_DUR  = 600;  // final black fade-out (ms)

export function mangaTotalMs(n: number, slideDurMs: number): number {
  return n * slideDurMs + OUTRO_DUR;
}

// ── Draw one image covering the full canvas (Ken-Burns) ───────────────────────
function drawImageKenBurns(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  progress: number,   // 0..1 within this slide
  panDir: number,     // +1 or -1 horizontal pan direction
  alpha = 1,
) {
  // Guard: skip images that failed to load
  if (!img || !img.naturalWidth || !img.naturalHeight) return;

  ctx.save();
  ctx.globalAlpha = alpha;

  const scale = lerp(1.0, 1.08, easeOutCubic(progress));
  const panX   = lerp(0, panDir * 40, progress); // max 40px pan

  // Cover fill
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = CW / CH;

  let drawW: number, drawH: number;
  if (imgAspect > canvasAspect) {
    drawH = CH * scale;
    drawW = drawH * imgAspect;
  } else {
    drawW = CW * scale;
    drawH = drawW / imgAspect;
  }

  const x = (CW - drawW) / 2 + panX;
  const y = (CH - drawH) / 2;

  ctx.drawImage(img, x, y, drawW, drawH);
  ctx.restore();
}

// ── Draw subtitle at bottom ───────────────────────────────────────────────────
function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  segElapsed: number,
  slideDurMs: number,
  fontSize: number,
) {
  // Fade/slide in
  const enterT = clamp(segElapsed / ENTER_DUR, 0, 1);
  const enterEased = easeOutCubic(enterT);

  // Fade out near end
  const exitStart = slideDurMs - EXIT_DUR - TRANS_DUR;
  const exitT = clamp((segElapsed - exitStart) / EXIT_DUR, 0, 1);
  const alpha = enterEased * (1 - exitT);

  if (alpha <= 0) return;

  const slideY = lerp(30, 0, enterEased);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(0, slideY);

  ctx.font = `900 ${fontSize}px "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  const y = CH - 80;
  const x = CW / 2;

  // Black stroke for legibility
  ctx.lineWidth = Math.round(fontSize * 0.14);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.strokeText(text, x, y);

  // White fill
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x, y);

  ctx.restore();
}

// ── Draw disclaimer top-left ──────────────────────────────────────────────────
function drawDisclaimer(
  ctx: CanvasRenderingContext2D,
  text: string,
) {
  if (!text) return;
  ctx.save();
  ctx.font = '400 28px "Noto Sans SC", "PingFang SC", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Shadow for readability
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 6;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(text, 60, 48);
  ctx.restore();
}

// ── Main draw function ────────────────────────────────────────────────────────
export function drawMangaScene(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  mangaContent: MangaContent,
  mangaOptions: MangaOptions,
  images: HTMLImageElement[],
) {
  const { segments, disclaimer } = mangaContent;
  const { slideDurationMs, subtitleFontSize } = mangaOptions;
  const n = segments.length;
  const total = mangaTotalMs(n, slideDurationMs);

  // ── Black base ────────────────────────────────────────────────────────────
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CW, CH);

  // ── Determine current slide ───────────────────────────────────────────────
  const clampedElapsed = Math.min(elapsed, total);
  const segIdx = Math.min(Math.floor(clampedElapsed / slideDurationMs), n - 1);
  const segElapsed = clampedElapsed - segIdx * slideDurationMs;
  const segProgress = clamp(segElapsed / slideDurationMs, 0, 1);

  const panDir = segIdx % 2 === 0 ? 1 : -1;

  // ── Current image ─────────────────────────────────────────────────────────
  const img = images[segIdx];
  if (img) {
    drawImageKenBurns(ctx, img, segProgress, panDir, 1);
  }

  // ── Cross-fade to next image ──────────────────────────────────────────────
  const transStart = slideDurationMs - TRANS_DUR;
  if (segElapsed > transStart && segIdx < n - 1) {
    const nextImg = images[segIdx + 1];
    if (nextImg) {
      const transT = (segElapsed - transStart) / TRANS_DUR;
      const nextAlpha = easeOutCubic(clamp(transT, 0, 1));
      const nextPanDir = (segIdx + 1) % 2 === 0 ? 1 : -1;
      // next image progress starts at 0 when it becomes current
      drawImageKenBurns(ctx, nextImg, clamp(transT * 0.05, 0, 1), nextPanDir, nextAlpha);
    }
  }

  // ── Dark gradient at bottom for text legibility ───────────────────────────
  const grad = ctx.createLinearGradient(0, CH * 0.60, 0, CH);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  // ── Subtitle ──────────────────────────────────────────────────────────────
  const seg = segments[segIdx];
  if (seg?.text) {
    drawSubtitle(ctx, seg.text, segElapsed, slideDurationMs, subtitleFontSize);
  }

  // ── Disclaimer ────────────────────────────────────────────────────────────
  drawDisclaimer(ctx, disclaimer);

  // ── Final fade-out to black ───────────────────────────────────────────────
  const outroStart = total - OUTRO_DUR;
  if (elapsed > outroStart) {
    const outroT = clamp((elapsed - outroStart) / OUTRO_DUR, 0, 1);
    ctx.fillStyle = `rgba(0,0,0,${easeOutCubic(outroT)})`;
    ctx.fillRect(0, 0, CW, CH);
  }
}
