/**
 * City (十二生肖) style — one card at a time, alternating left/right layout.
 * Odd  cards (0,2,4…): text on LEFT,  nested squares on RIGHT
 * Even cards (1,3,5…): nested squares on LEFT, text on RIGHT
 */
import type { GeneratedContent } from '../../types/video';
import {
  CW, CH, clamp, easeOutCubic, easeOutBack, hex2rgba, wrapText, T,
} from './helpers';

// ── Per-card timing ──────────────────────────────────────────────────────────
const CITY_CARD_DUR  = 4400;   // total ms per card slot
const CITY_ENTER_DUR = 700;    // fade-in
const CITY_EXIT_DUR  = 650;    // fade-out

// ── Square sizes / timings (outside → inside) ────────────────────────────────
const SQ_SIZES  = [440, 296, 166, 84] as const;
const SQ_WIDTHS = [4,   3.5, 2.5, 2 ] as const;
const SQ_DELAYS = [0,   300, 600, 900] as const;  // ms stagger
const SQ_ENTER  = 520;                             // ms each square takes to enter

export function cityTotalMs(n: number): number {
  return T.cardBase + n * CITY_CARD_DUR + T.outroDur;
}

export function drawCityCards(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  _shapeImg: HTMLImageElement,
  _coverIndex = 0,
): void {
  if (elapsed < T.cardBase) return;

  const n           = content.points.length;
  const cardElapsed = elapsed - T.cardBase;

  for (let i = 0; i < n; i++) {
    const te = cardElapsed - i * CITY_CARD_DUR;
    if (te < 0 || te > CITY_CARD_DUR + CITY_ENTER_DUR) continue;

    const inA  = easeOutCubic(clamp(te / CITY_ENTER_DUR, 0, 1));
    const outA = 1 - easeOutCubic(
      clamp((te - (CITY_CARD_DUR - CITY_EXIT_DUR)) / CITY_EXIT_DUR, 0, 1),
    );
    const alpha = inA * outA;
    if (alpha < 0.01) continue;

    drawCard(ctx, te, alpha, i, content, accent, accent2, elapsed);
  }
}

// ────────────────────────────────────────────────────────────────────────────
function drawCard(
  ctx: CanvasRenderingContext2D,
  te: number,
  alpha: number,
  idx: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  elapsed: number,
): void {
  const point     = content.points[idx];
  const isFlipped = idx % 2 === 1;   // alternate layout each card

  // Layout zones
  const TEXT_X  = isFlipped ? 1050 : 108;
  const MAX_TW  = 810;
  const SQ_CX   = isFlipped ? 480  : 1440;
  const SQ_CY   = CH / 2;

  ctx.save();
  ctx.globalAlpha = alpha;

  // ── Vertical divider ───────────────────────────────────────────────────────
  {
    const dg = ctx.createLinearGradient(960, 70, 960, CH - 70);
    dg.addColorStop(0,   'rgba(0,0,0,0)');
    dg.addColorStop(0.25, hex2rgba(accent, 0.28));
    dg.addColorStop(0.75, hex2rgba(accent, 0.28));
    dg.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.strokeStyle = dg; ctx.lineWidth = 1;
    ctx.setLineDash([4, 10]);
    ctx.beginPath(); ctx.moveTo(960, 70); ctx.lineTo(960, CH - 70); ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── Nested squares (outside → inside, staggered) ──────────────────────────
  const SQ_COLORS: string[] = [
    accent,
    accent2,
    'rgba(255,255,255,0.88)',
    hex2rgba(accent2, 0.55),
  ];
  const cardRot = idx * 0.16; // per-card rotation offset for variety

  SQ_SIZES.forEach((sz, si) => {
    const sqTe = te - SQ_DELAYS[si];
    if (sqTe <= 0) return;

    const sqT     = clamp(sqTe / SQ_ENTER, 0, 1);
    const sqAlpha = easeOutCubic(sqT);
    const sqScale = easeOutBack(Math.min(sqT, 0.999));
    // Breathe once fully visible
    const scale   = sqT >= 1
      ? 1 + 0.013 * Math.sin(elapsed * 0.0014 + si * 1.5)
      : sqScale;

    ctx.save();
    ctx.globalAlpha *= sqAlpha;
    ctx.translate(SQ_CX, SQ_CY);
    ctx.rotate(si % 2 === 0 ? cardRot * 0.4 : -cardRot * 0.28);
    ctx.scale(scale, scale);
    ctx.shadowColor = SQ_COLORS[si];
    ctx.shadowBlur  = si === 0 ? 22 : si === 1 ? 30 : 18;
    ctx.strokeStyle = SQ_COLORS[si];
    ctx.lineWidth   = SQ_WIDTHS[si];
    ctx.strokeRect(-sz / 2, -sz / 2, sz, sz);
    ctx.shadowBlur  = 0;
    ctx.restore();
  });

  // ── Text ──────────────────────────────────────────────────────────────────
  const fullLabel = `${idx + 1}. ${point.label}`;
  const CHAR_MS   = 48;
  const typeStart = CITY_ENTER_DUR;
  const typingTe  = Math.max(0, te - typeStart);
  const visChars  = Math.min(Math.floor(typingTe / CHAR_MS), fullLabel.length);
  const visText   = fullLabel.slice(0, visChars);
  const typeDone  = visChars >= fullLabel.length;

  const labelY = CH * 0.40;   // large label center y
  const shortY = CH * 0.545;  // short text
  const descY  = CH * 0.675;  // desc lines start center

  // Label — large, accent color, typewriter
  ctx.font = `900 88px "Noto Sans SC", "PingFang SC", sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.shadowColor = hex2rgba(accent, 0.85); ctx.shadowBlur = 28;
  ctx.fillStyle   = accent;
  ctx.fillText(visText, TEXT_X, labelY);

  // Cursor
  if (!typeDone && Math.floor(elapsed / 500) % 2 === 0) {
    const tw = ctx.measureText(visText).width;
    ctx.shadowBlur = 0;
    ctx.font = `300 88px monospace`;
    ctx.fillText('|', TEXT_X + tw + 6, labelY);
  }
  ctx.shadowBlur = 0;

  // Underline under label (draws progressively)
  if (visChars > 2) {
    ctx.font = `900 88px "Noto Sans SC", "PingFang SC", sans-serif`; // re-set for measure
    const fullW = Math.min(ctx.measureText(fullLabel).width, MAX_TW);
    const lineA = clamp((visChars - 2) / (fullLabel.length - 2), 0, 1);
    const lg    = ctx.createLinearGradient(TEXT_X, 0, TEXT_X + fullW * lineA, 0);
    lg.addColorStop(0, hex2rgba(accent, 0.9));
    lg.addColorStop(0.75, hex2rgba(accent, 0.55));
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = lg; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(TEXT_X, labelY + 56); ctx.lineTo(TEXT_X + fullW * lineA, labelY + 56);
    ctx.stroke();
  }

  // Short — fades in after label is typed
  const shortDelay = typeStart + fullLabel.length * CHAR_MS + 200;
  const shortAlpha = clamp((te - shortDelay) / 480, 0, 1);
  if (shortAlpha > 0 && point.short) {
    ctx.save(); ctx.globalAlpha *= shortAlpha;
    ctx.font = `500 52px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle   = 'rgba(255,255,255,0.96)';
    ctx.shadowColor = 'rgba(255,255,255,0.2)'; ctx.shadowBlur = 6;
    // Fit to max width
    let short = point.short;
    while (short.length > 4 && ctx.measureText(short).width > MAX_TW) short = short.slice(0, -1);
    if (short.length < point.short.length) short += '…';
    ctx.fillText(short, TEXT_X, shortY);
    ctx.shadowBlur = 0; ctx.restore();
  }

  // Desc — fades in 500ms after short
  const descDelay  = shortDelay + 500;
  const descAlpha  = clamp((te - descDelay) / 480, 0, 1);
  if (descAlpha > 0 && point.desc) {
    ctx.save(); ctx.globalAlpha *= descAlpha;
    ctx.font = `400 32px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.80)';
    const descLines = wrapText(ctx, point.desc, MAX_TW).slice(0, 2);
    descLines.forEach((line, li) => ctx.fillText(line, TEXT_X, descY + li * 44));
    ctx.restore();
  }

  ctx.restore();
}
