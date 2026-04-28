/**
 * City (十二生肖) — one card at a time, alternating layout.
 * 10 geometric patterns cycle through cards (idx % 10).
 */
import type { GeneratedContent } from '../../types/video';
import { CH, clamp, easeOutCubic, easeOutBack, wrapText, T } from './helpers';

// ── Timing ───────────────────────────────────────────────────────────────────
const CITY_CARD_DUR  = 4400;
const CITY_ENTER_DUR = 700;
const CITY_EXIT_DUR  = 650;

// ── Pattern layer config ─────────────────────────────────────────────────────
const LAYER_SIZES  = [440, 296, 166, 84] as const;
const LAYER_WIDTHS = [4,   3.5, 2.5, 2 ] as const;
const LAYER_DELAYS = [0,   300, 600, 900] as const;
const LAYER_ENTER  = 520;

export function cityTotalMs(n: number): number {
  return T.cardBase + n * CITY_CARD_DUR + T.outroDur;
}

// ── 10 pattern renderers (called with ctx already translated to center) ──────
type DrawFn = (ctx: CanvasRenderingContext2D, sz: number, li: number, rot: number) => void;

function polygon(ctx: CanvasRenderingContext2D, r: number, sides: number, start = -Math.PI / 2) {
  ctx.beginPath();
  for (let s = 0; s < sides; s++) {
    const a = start + (s * Math.PI * 2) / sides;
    if (s === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else         ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath(); ctx.stroke();
}

function star(ctx: CanvasRenderingContext2D, outer: number, inner: number, pts: number, start = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const a = start + (i * Math.PI) / pts;
    const r = i % 2 === 0 ? outer : inner;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else         ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath(); ctx.stroke();
}

const PATTERNS: DrawFn[] = [
  // 0 — nested squares
  (ctx, sz) => ctx.strokeRect(-sz / 2, -sz / 2, sz, sz),

  // 1 — concentric circles
  (ctx, sz) => { ctx.beginPath(); ctx.arc(0, 0, sz / 2, 0, Math.PI * 2); ctx.stroke(); },

  // 2 — concentric hexagons
  (ctx, sz, li) => polygon(ctx, sz / 2, 6, (Math.PI / 6) * li),

  // 3 — nested equilateral triangles (alternating up/down)
  (ctx, sz, li) => polygon(ctx, sz / 2, 3, -Math.PI / 2 + li * (Math.PI / 3)),

  // 4 — nested 5-pointed stars
  (ctx, sz) => star(ctx, sz / 2, sz * 0.21, 5),

  // 5 — rotated diamonds (each layer rotates a bit more)
  (ctx, sz, li) => {
    ctx.save(); ctx.rotate(Math.PI / 4 + li * (Math.PI / 8));
    ctx.strokeRect(-sz / 2, -sz / 2, sz, sz); ctx.restore();
  },

  // 6 — dashed concentric rings (alternating dash patterns)
  (ctx, sz, li) => {
    ctx.save();
    ctx.setLineDash(li % 2 === 0 ? [10, 7] : [4, 11]);
    ctx.beginPath(); ctx.arc(0, 0, sz / 2, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  },

  // 7 — nested cross / plus shapes
  (ctx, sz) => {
    const arm = sz * 0.28;
    ctx.strokeRect(-sz / 2, -arm / 2, sz, arm); // horizontal bar
    ctx.strokeRect(-arm / 2, -sz / 2, arm, sz); // vertical bar
  },

  // 8 — concentric octagons
  (ctx, sz, li) => polygon(ctx, sz / 2, 8, (Math.PI / 8) * li),

  // 9 — nested pentagons (each slightly rotated)
  (ctx, sz, li) => polygon(ctx, sz / 2, 5, -Math.PI / 2 + li * (Math.PI / 5)),
];

// ── Pattern name labels (shown as small badge on decoration) ─────────────────
const PATTERN_LABELS = [
  '方形', '圆环', '六边', '三角', '星形',
  '菱形', '虚环', '十字', '八边', '五边',
];

// ── Main exports ─────────────────────────────────────────────────────────────
export function drawCityCards(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  _accent: string,
  _accent2: string,
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
    drawCard(ctx, te, alpha, i, content, elapsed);
  }
}

// ── Single card renderer ──────────────────────────────────────────────────────
function drawCard(
  ctx: CanvasRenderingContext2D,
  te: number,
  alpha: number,
  idx: number,
  content: GeneratedContent,
  elapsed: number,
): void {
  const point     = content.points[idx];
  const isFlipped = idx % 2 === 1;
  const TEXT_X    = isFlipped ? 1050 : 108;
  const MAX_TW    = 810;
  const SQ_CX     = isFlipped ? 480 : 1440;
  const SQ_CY     = CH / 2;
  const pattern   = PATTERNS[idx % 10];
  const patLabel  = PATTERN_LABELS[idx % 10];
  const cardRot   = idx * 0.16;

  ctx.save();
  ctx.globalAlpha = alpha;

  // ── Divider ────────────────────────────────────────────────────────────────
  {
    const dg = ctx.createLinearGradient(960, 70, 960, CH - 70);
    dg.addColorStop(0,    'rgba(0,0,0,0)');
    dg.addColorStop(0.25, 'rgba(255,136,0,0.32)');
    dg.addColorStop(0.75, 'rgba(255,136,0,0.32)');
    dg.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.strokeStyle = dg; ctx.lineWidth = 1; ctx.setLineDash([4, 10]);
    ctx.beginPath(); ctx.moveTo(960, 70); ctx.lineTo(960, CH - 70); ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── Geometric pattern layers (outside → inside) ───────────────────────────
  // ── Geometric pattern layers — ORANGE / RED contrast colors ─────────────
  const COLORS: string[] = [
    '#ff8800',                    // layer 0 → orange
    '#e52222',                    // layer 1 → red
    'rgba(255,200,100,0.88)',     // layer 2 → warm light orange
    'rgba(229,34,34,0.50)',       // layer 3 → dim red
  ];

  LAYER_SIZES.forEach((sz, li) => {
    const sqTe = te - LAYER_DELAYS[li];
    if (sqTe <= 0) return;
    const sqT   = clamp(sqTe / LAYER_ENTER, 0, 1);
    const sqA   = easeOutCubic(sqT);
    const scale = sqT >= 1
      ? 1 + 0.013 * Math.sin(elapsed * 0.0014 + li * 1.5)
      : easeOutBack(Math.min(sqT, 0.999));

    ctx.save();
    ctx.globalAlpha *= sqA;
    ctx.translate(SQ_CX, SQ_CY);
    ctx.rotate(li % 2 === 0 ? cardRot * 0.4 : -cardRot * 0.28);
    ctx.scale(scale, scale);
    ctx.shadowColor = COLORS[li]; ctx.shadowBlur = li === 1 ? 28 : 20;
    ctx.strokeStyle = COLORS[li]; ctx.lineWidth = LAYER_WIDTHS[li];
    pattern(ctx, sz, li, cardRot);
    ctx.shadowBlur = 0;
    ctx.restore();
  });

  // Pattern name badge (small, bottom of decoration zone)
  {
    const badgeT = clamp((te - LAYER_DELAYS[3] - LAYER_ENTER) / 400, 0, 1);
    if (badgeT > 0) {
      ctx.save(); ctx.globalAlpha *= badgeT;
      ctx.font = `600 44px "Noto Sans SC", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,136,0,0.70)';
      ctx.fillText(patLabel, SQ_CX, SQ_CY + 268);
      ctx.restore();
    }
  }

  // ── Text ───────────────────────────────────────────────────────────────────
  const fullLabel = `${idx + 1}. ${point.label}`;
  const CHAR_MS   = 48;
  const typeStart = CITY_ENTER_DUR;
  const visChars  = Math.min(Math.floor(Math.max(0, te - typeStart) / CHAR_MS), fullLabel.length);
  const visText   = fullLabel.slice(0, visChars);
  const typeDone  = visChars >= fullLabel.length;

  const labelY = CH * 0.38;
  const shortY = CH * 0.58;
  const descY  = CH * 0.74;

  // Label — typewriter, large, ORANGE
  ctx.font = `900 176px "Noto Sans SC", "PingFang SC", sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 28;
  ctx.fillStyle = '#ff8800';
  ctx.fillText(visText, TEXT_X, labelY);

  // Cursor
  if (!typeDone && Math.floor(elapsed / 500) % 2 === 0) {
    const tw = ctx.measureText(visText).width;
    ctx.shadowBlur = 0; ctx.font = `300 176px monospace`;
    ctx.fillText('|', TEXT_X + tw + 6, labelY);
  }
  ctx.shadowBlur = 0;

  // Progressive underline
  if (visChars > 2) {
    const fullW = Math.min(ctx.measureText(fullLabel).width, MAX_TW);
    const lineA = clamp((visChars - 2) / Math.max(1, fullLabel.length - 2), 0, 1);
    const lg    = ctx.createLinearGradient(TEXT_X, 0, TEXT_X + fullW, 0);
    lg.addColorStop(0, 'rgba(255,136,0,0.9)');
    lg.addColorStop(0.75, 'rgba(255,136,0,0.55)');
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = lg; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(TEXT_X, labelY + 106); ctx.lineTo(TEXT_X + fullW * lineA, labelY + 106);
    ctx.stroke();
  }

  // Short
  const shortDelay = typeStart + fullLabel.length * CHAR_MS + 200;
  const shortAlpha = clamp((te - shortDelay) / 480, 0, 1);
  if (shortAlpha > 0 && point.short) {
    ctx.save(); ctx.globalAlpha *= shortAlpha;
    ctx.font = `500 104px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.shadowColor = 'rgba(255,255,255,0.2)'; ctx.shadowBlur = 6;
    let short = point.short;
    while (short.length > 4 && ctx.measureText(short).width > MAX_TW)
      short = short.slice(0, -1);
    if (short.length < point.short.length) short += '…';
    ctx.fillText(short, TEXT_X, shortY);
    ctx.shadowBlur = 0; ctx.restore();
  }

  // Desc
  const descDelay  = shortDelay + 500;
  const descAlpha  = clamp((te - descDelay) / 480, 0, 1);
  if (descAlpha > 0 && point.desc) {
    ctx.save(); ctx.globalAlpha *= descAlpha;
    ctx.font = `400 64px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const descLines = wrapText(ctx, point.desc, MAX_TW).slice(0, 2);
    descLines.forEach((line, li) => ctx.fillText(line, TEXT_X, descY + li * 80));
    ctx.restore();
  }

  ctx.restore();
}
