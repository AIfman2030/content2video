import type {
  GeneratedContent, StyleType, PolyShape, ChineseOptions, CityOptions, AItechOptions,
  ChineseCardLineConfig, ChineseLineEnterAnim, ChineseLineExitAnim, KeywordOptions,
} from '../../types/video';
import { CW, CH, clamp, easeOutBack, easeOutCubic, lerp, hex2rgba, roundRect, T, PAGE_HOLD, PAGE_TRANS } from './helpers';
import { drawCityCards } from './cards-city';
import { drawAITechCards } from './cards-aitech';
import { drawChineseCards } from './cards-chinese';
import { drawKeywordCards } from './cards-keyword';

// ── Card geometry helpers ──────────────────────────────────────────────────────
function cardHeight(numLines: number): number {
  if (numLines <= 1) return 190;
  if (numLines === 2) return 228;
  return 268;
}

function effectiveFontFamily(ff: string): string {
  if (!ff) return '"Noto Sans SC", sans-serif';
  return `"${ff}", sans-serif`;
}

// ── Resolve per-line text content ─────────────────────────────────────────────
function lineText(cfg: ChineseCardLineConfig, point: GeneratedContent['points'][number]): string {
  if (cfg.field === 'static') return cfg.staticText || '';
  if (cfg.field === 'label')  return point.label   || '';
  if (cfg.field === 'short')  return point.short   || '';
  return point.desc || '';
}

// ── Per-line enter/exit animation ─────────────────────────────────────────────
interface LineAnimState {
  alpha: number;
  dx: number;
  dy: number;
  scaleX: number;
  scaleY: number;
  angle: number;  // radians
}

const ENTER_DUR = 480;  // ms for enter animation
const LINE_STAGGER = 90; // ms stagger between lines

function computeEnterState(
  te: number,          // ms elapsed since THIS LINE's anim start (can be negative)
  anim: ChineseLineEnterAnim,
  text: string,
  elapsed: number,
  lineIdx: number,
): LineAnimState & { clipChars: number } {
  const raw = clamp(te / ENTER_DUR, 0, 1);
  const t = easeOutCubic(raw);
  const tBack = easeOutBack(Math.min(raw, 0.999));

  let alpha = t, dx = 0, dy = 0, scaleX = 1, scaleY = 1, angle = 0, clipChars = text.length;

  switch (anim) {
    case 'fadeIn':
      alpha = t;
      break;
    case 'slideUp':
      dy = lerp(72, 0, t);
      alpha = clamp(te / 240, 0, 1);
      break;
    case 'slideDown':
      dy = lerp(-72, 0, t);
      alpha = clamp(te / 240, 0, 1);
      break;
    case 'slideLeft':
      dx = lerp(160, 0, t);
      alpha = clamp(te / 240, 0, 1);
      break;
    case 'slideRight':
      dx = lerp(-160, 0, t);
      alpha = clamp(te / 240, 0, 1);
      break;
    case 'zoomIn':
      scaleX = lerp(0.2, 1, tBack);
      scaleY = lerp(0.2, 1, tBack);
      alpha = clamp(te / 200, 0, 1);
      break;
    case 'bounceIn': {
      // overshoot: 0 → 1.25 → 0.95 → 1
      const s = raw < 0.6
        ? lerp(0, 1.25, raw / 0.6)
        : raw < 0.8
          ? lerp(1.25, 0.92, (raw - 0.6) / 0.2)
          : lerp(0.92, 1, (raw - 0.8) / 0.2);
      scaleX = s; scaleY = s;
      alpha = clamp(te / 180, 0, 1);
      break;
    }
    case 'rotateIn':
      angle = lerp(-0.5, 0, t);
      scaleX = lerp(0.3, 1, tBack);
      scaleY = lerp(0.3, 1, tBack);
      alpha = clamp(te / 220, 0, 1);
      break;
    case 'flipH':
      scaleX = raw < 0.5 ? lerp(1, 0, raw * 2) : lerp(0, 1, (raw - 0.5) * 2);
      alpha = raw < 0.5 ? 0 : clamp((raw - 0.5) * 4, 0, 1);
      break;
    case 'typewriter':
      clipChars = Math.floor(raw * text.length);
      alpha = 1;
      break;
    case 'glitch': {
      const g = raw < 0.7 ? Math.sin(elapsed * 0.08 + lineIdx * 3.7) * (1 - raw) * 14 : 0;
      dx = g; dy = g * 0.4;
      alpha = clamp(te / 150, 0, 1);
      break;
    }
    case 'wave':
      // Wave is handled per-character in drawLine, just set alpha here
      alpha = clamp(te / 220, 0, 1);
      break;
  }

  return { alpha, dx, dy, scaleX, scaleY, angle, clipChars };
}

function computeExitState(exitT: number, anim: ChineseLineExitAnim, lineIdx: number): LineAnimState {
  const t = easeOutCubic(exitT);
  let alpha = 1 - exitT, dx = 0, dy = 0, scaleX = 1, scaleY = 1;
  const angle = 0;  // no exit anim currently modifies rotation

  switch (anim) {
    case 'fadeOut':
      alpha = 1 - exitT;
      break;
    case 'slideUp':
      dy = -t * 80;
      alpha = 1 - exitT;
      break;
    case 'slideDown':
      dy = t * 80;
      alpha = 1 - exitT;
      break;
    case 'slideLeft':
      dx = -t * 140;
      alpha = 1 - exitT;
      break;
    case 'slideRight':
      dx = t * 140;
      alpha = 1 - exitT;
      break;
    case 'zoomOut':
      scaleX = lerp(1, 0.1, t);
      scaleY = lerp(1, 0.1, t);
      alpha = 1 - exitT;
      break;
    case 'dissolve':
      alpha = 1 - exitT;
      dx = Math.sin(exitT * Math.PI * 3 + lineIdx * 1.4) * exitT * 20;
      dy = Math.cos(exitT * Math.PI * 2 + lineIdx) * exitT * 10;
      break;
  }

  return { alpha, dx, dy, scaleX, scaleY, angle };
}

// ── Draw single text line with all transforms ─────────────────────────────────
function drawLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  cfg: ChineseCardLineConfig,
  color: string,
  te: number,
  outA: number,  // 0..1 page opacity (exit)
  elapsed: number,
  lineIdx: number,
  cardI: number,
) {
  const enter = computeEnterState(te, cfg.enterAnim, text, elapsed, lineIdx);

  // Compute exit contribution
  const exitT = 1 - outA;
  const exit = exitT > 0.01 ? computeExitState(clamp(exitT, 0, 1), cfg.exitAnim, lineIdx) : null;

  const finalAlpha = enter.alpha * (exit ? exit.alpha : 1);
  if (finalAlpha <= 0.01) return;

  const dx = enter.dx + (exit?.dx ?? 0);
  const dy = enter.dy + (exit?.dy ?? 0);
  const scaleX = enter.scaleX * (exit?.scaleX ?? 1);
  const scaleY = enter.scaleY * (exit?.scaleY ?? 1);
  const angle  = enter.angle  + (exit?.angle  ?? 0);

  const ff = effectiveFontFamily(cfg.fontFamily);
  const fsz = cfg.fontSize;

  ctx.save();
  ctx.globalAlpha = finalAlpha;
  ctx.translate(x + dx, y + dy);
  if (angle !== 0) ctx.rotate(angle);
  if (scaleX !== 1 || scaleY !== 1) ctx.scale(scaleX, scaleY);

  ctx.font = `${cfg.fontWeight} ${fsz}px ${ff}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  if (cfg.enterAnim === 'wave' && te > 0 && enter.alpha > 0) {
    // per-character wave rendering
    const chars = text.split('');
    let cx = 0;
    for (let ci = 0; ci < chars.length; ci++) {
      const phase = (elapsed * 0.005 + ci * 0.4 + cardI * 0.9) % (Math.PI * 2);
      const waveY = Math.sin(phase) * 8 * clamp(te / ENTER_DUR, 0, 1);
      ctx.fillText(chars[ci], cx, waveY);
      cx += ctx.measureText(chars[ci]).width;
    }
  } else if (cfg.enterAnim === 'typewriter') {
    ctx.fillText(text.slice(0, enter.clipChars), 0, 0);
  } else {
    ctx.fillText(text, 0, 0);
  }

  ctx.restore();
}

// ── Resolve effective card lines config ───────────────────────────────────────
function resolveLines(opts?: ChineseOptions): ChineseCardLineConfig[] {
  if (opts?.cardLines && opts.cardLines.length > 0) return opts.cardLines;
  // Legacy fallback
  return [
    {
      field: 'label', staticText: '',
      fontSize: opts?.titleFontSize ?? 68, fontFamily: '',
      color: opts?.titleColor ?? '', fontWeight: 800,
      enterAnim: 'slideLeft', exitAnim: 'fadeOut',
    },
    {
      field: 'short', staticText: '',
      fontSize: opts?.shortFontSize ?? 36, fontFamily: '',
      color: opts?.shortColor ?? '', fontWeight: 600,
      enterAnim: 'slideUp', exitAnim: 'fadeOut',
    },
    {
      field: 'desc', staticText: '',
      fontSize: opts?.descFontSize ?? 32, fontFamily: '',
      color: opts?.descColor ?? '', fontWeight: 400,
      enterAnim: 'fadeIn', exitAnim: 'dissolve',
    },
  ] as ChineseCardLineConfig[];
}

function resolveLineColor(cfg: ChineseCardLineConfig, idx: number, accent: string, accent2: string): string {
  if (cfg.color) return cfg.color;
  if (idx === 0) return accent;
  if (idx === 1) return accent2;
  return 'rgba(255,255,255,0.92)';
}

// ── Main drawCards function ───────────────────────────────────────────────────
export function drawCards(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  style: StyleType,
  shapeImg: HTMLImageElement,
  polyShape?: PolyShape,
  coverIndex = 0,
  chineseOptions?: ChineseOptions,
  cityOptions?: CityOptions,
  aitechOptions?: AItechOptions,
  keywordOptions?: KeywordOptions,
  knowledgeImages?: HTMLImageElement[],
) {
  if (style === 'city')    { drawCityCards(ctx, elapsed, content, accent, accent2, shapeImg, coverIndex, cityOptions, knowledgeImages); return; }
  if (style === 'aitech')  { drawAITechCards(ctx, elapsed, content, accent, accent2, polyShape ?? 'hexagon', aitechOptions); return; }
  if (style === 'chinese') { drawChineseCards(ctx, elapsed, content, accent, accent2, shapeImg!, coverIndex, chineseOptions); return; }
  if (style === 'keyword') { drawKeywordCards(ctx, elapsed, content, accent, accent2, keywordOptions); return; }
  if (elapsed < T.cardBase) return;

  const lines     = resolveLines(chineseOptions);
  const numLines  = lines.length;
  const cols      = chineseOptions?.cardCols ?? 2;
  const rows      = chineseOptions?.cardRows ?? 3;
  const PAGE_SIZE = cols * rows;

  const MARGIN = 30, GAP = 28;
  const cardW  = (CW - MARGIN * 2 - GAP * (cols - 1)) / cols;
  const cardH  = cardHeight(numLines);
  const rowGap = 24;
  const startY = 150;

  const n           = content.points.length;
  const pageSlot    = PAGE_SIZE * T.cardSlot;
  const pageTotal   = pageSlot + PAGE_HOLD;
  const pageElapsed = elapsed - T.cardBase;
  const numPages    = Math.ceil(n / PAGE_SIZE);
  const curPage     = Math.min(Math.floor(pageElapsed / pageTotal), numPages - 1);
  const withinPage  = pageElapsed - curPage * pageTotal;
  const outA        = curPage < numPages - 1 ? clamp(1 - (withinPage - pageSlot) / PAGE_TRANS, 0, 1) : 1;

  const startCard = curPage * PAGE_SIZE;
  const endCard   = Math.min(startCard + PAGE_SIZE, n);

  for (let i = startCard; i < endCard; i++) {
    const localI = i - startCard;
    // Card entrance timing: staggered by localI
    const cardTe   = withinPage - localI * T.cardSlot;
    if (cardTe <= 0) continue;

    const enterT = clamp(cardTe / 500, 0, 1);
    const eased  = easeOutBack(Math.min(enterT, 0.999));
    const colIdx = localI % cols;
    const rowIdx = Math.floor(localI / cols);
    const cardX  = MARGIN + colIdx * (cardW + GAP);
    const cardY  = startY + rowIdx * (cardH + rowGap);

    ctx.save();
    ctx.globalAlpha = clamp(cardTe / 300, 0, 1) * outA;

    // Card slide-in from right
    const slideX = (1 - eased) * 100;
    ctx.translate(cardX + slideX, cardY);

    // ── Card background ───────────────────────────────────────────────────────
    roundRect(ctx, 0, 0, cardW, cardH, 18);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
    roundRect(ctx, 0, 0, cardW, cardH, 18);
    ctx.strokeStyle = hex2rgba(accent, 0.65); ctx.lineWidth = 2; ctx.stroke();

    // ── Ink-drip left bar ─────────────────────────────────────────────────────
    ctx.fillStyle = accent;
    roundRect(ctx, 0, 18, 6, (cardH - 36) * eased, 3); ctx.fill();
    ctx.beginPath(); ctx.arc(3, 18 + (cardH - 36) * eased, 8, 0, Math.PI * 2);
    ctx.fillStyle = hex2rgba(accent, 0.5); ctx.fill();

    // ── Number badge ──────────────────────────────────────────────────────────
    const badgeX = 55, badgeY = cardH / 2;
    ctx.beginPath(); ctx.arc(badgeX, badgeY, 50, 0, Math.PI * 2);
    ctx.fillStyle = hex2rgba(accent, 0.22); ctx.fill();
    ctx.strokeStyle = hex2rgba(accent, 0.8); ctx.lineWidth = 2;
    ctx.shadowColor = accent; ctx.shadowBlur = 15; ctx.stroke(); ctx.shadowBlur = 0;
    ctx.font = `800 52px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.fillText(`${i + 1}`, badgeX, badgeY);

    // ── Text lines ────────────────────────────────────────────────────────────
    const textX   = 128;
    const point   = content.points[i];

    // Distribute lines vertically within card
    const totalTextH = lines.reduce((sum, ln) => sum + ln.fontSize + 12, 0) - 12;
    const textTopY   = cardH / 2 - totalTextH / 2;
    let curY = textTopY;

    for (let li = 0; li < lines.length; li++) {
      const cfg    = lines[li];
      const fsz    = cfg.fontSize;
      const color  = resolveLineColor(cfg, li, accent, accent2);
      const text   = lineText(cfg, point);
      const lineY  = curY + fsz / 2;

      // Line's own enter timing: staggered by li within the card
      const lineTe = cardTe - li * LINE_STAGGER;

      // Glow on first line only
      if (li === 0) { ctx.shadowColor = hex2rgba(accent, 0.7); ctx.shadowBlur = 18; }
      else          { ctx.shadowBlur = 0; }

      drawLine(ctx, text, textX, lineY, cfg, color, lineTe, outA, elapsed, li, i);

      ctx.shadowBlur = 0;
      curY += fsz + 12;
    }

    // ── Corner decoration (if card has entered enough) ────────────────────────
    if (eased > 0.6) {
      const ca = clamp((eased - 0.6) / 0.4, 0, 1);
      ctx.strokeStyle = hex2rgba(accent, ca * 0.55); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cardW - 28, 8); ctx.lineTo(cardW - 8, 8); ctx.lineTo(cardW - 8, 28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(28, cardH - 8); ctx.lineTo(8, cardH - 8); ctx.lineTo(8, cardH - 28); ctx.stroke();
    }

    ctx.restore();
  }

  // ── Page indicator dots ───────────────────────────────────────────────────
  if (numPages > 1) {
    const dotR = 8, dotGap = 24, dotY = CH - 28;
    const dotX0 = (CW - numPages * (dotR * 2 + dotGap) + dotGap) / 2;
    for (let p = 0; p < numPages; p++) {
      ctx.save();
      ctx.globalAlpha = p === curPage ? 0.9 : 0.3;
      ctx.fillStyle = p === curPage ? accent : accent2;
      ctx.shadowColor = accent; ctx.shadowBlur = p === curPage ? 10 : 0;
      ctx.beginPath(); ctx.arc(dotX0 + p * (dotR * 2 + dotGap) + dotR, dotY, dotR * (p === curPage ? 1 : 0.7), 0, Math.PI * 2);
      ctx.fill(); ctx.restore();
    }
  }
}
