import type { NatureContent, NatureOptions } from '../../types/video';
import { CW, CH, clamp, lerp, easeOutCubic, easeOutBack, hex2rgba, seededRandom } from './helpers';
import { SPOT_PAIRS } from './nature-spots';

// ── Timing ────────────────────────────────────────────────────────────────────
const N_BG_END    = 700;
const N_TITLE_END = 1400;
const N_CIRCLE_END = 2100;
const N_BADGE_END  = 2700;
const N_SPOT_END   = 3200;
const N_WORD_BASE  = 3200;
const N_WORD_SLOT  = 1200;   // 1.2 s between each word group (user request)
const N_HOLD       = 2500;

// ── High-contrast vivid colour pairs (override dull theme colours) ─────────────
const CONTRAST_PAIRS: [string, string][] = [
  ['#ff2200', '#00ccff'],
  ['#ffcc00', '#8800ff'],
  ['#00ff88', '#ff0088'],
  ['#ff6600', '#0055ff'],
  ['#ff00dd', '#00ffaa'],
  ['#ffee00', '#0044ff'],
  ['#ff4444', '#44ffcc'],
  ['#cc00ff', '#ffcc00'],
];

// Circle layout (separated to allow center zone)
const LCX = 430, RCX = 1490, CCY = 560, CR = 300;
const GOLD = '#fbbf24';

export function natureTotalMs(nLeft: number, nRight: number, nCommon = 0): number {
  const N = Math.max(nLeft, nRight);
  // common items appear after all left/right, offset by one extra slot
  const commonDelay = N * N_WORD_SLOT + N_WORD_SLOT;
  return N_WORD_BASE + commonDelay + nCommon * N_WORD_SLOT + N_HOLD;
}

// ── Concentric ring slots within a given circle ───────────────────────────────
type WP = { angle: number; radius: number };

function buildSlots(rand: () => number): WP[] {
  const r1 = Array.from({ length: 5 }, (_, i) => ({ angle: (i / 5)  * Math.PI * 2, radius: 120 }));
  const r2 = Array.from({ length: 7 }, (_, i) => ({ angle: (i / 7 + 0.07) * Math.PI * 2, radius: 190 }));
  const r3 = Array.from({ length: 6 }, (_, i) => ({ angle: (i / 6 + 0.04) * Math.PI * 2, radius: 255 }));
  const all = [...r1, ...r2, ...r3];
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  return all;
}

// Positions in the center gap zone (x≈730-1190, vertically centered)
function buildCenterSlots(): { x: number; y: number }[] {
  const cx = CW / 2, cy = CCY;
  const cols = [cx - 80, cx + 80];
  const ys = [cy - 160, cy - 60, cy + 40, cy + 140, cy + 240];
  const all: { x: number; y: number }[] = [];
  for (let i = 0; i < 5; i++) all.push({ x: cols[i % 2], y: ys[i] });
  return all;
}

const wordFsz = (w: string, base = 46) => {
  if (w.length <= 2) return base;
  if (w.length <= 3) return Math.round(base * 0.87);
  if (w.length <= 4) return Math.round(base * 0.74);
  return Math.round(base * 0.61);
};

// ── Draw circle with ink-stroke reveal ───────────────────────────────────────
function drawCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, p: number, col: string, bw = 2.5) {
  ctx.save();
  ctx.strokeStyle = hex2rgba(col, 0.55);
  ctx.lineWidth = bw;
  ctx.shadowColor = col; ctx.shadowBlur = 22;
  ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(p, 1)); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = hex2rgba(col, 0.12); ctx.lineWidth = bw * 7;
  ctx.beginPath(); ctx.arc(cx, cy, r + 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(p, 1)); ctx.stroke();
  ctx.restore();
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function drawBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, label: string, alpha: number, col: string, ff = '"Noto Sans SC", sans-serif') {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.font = `700 36px ${ff}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const tw = ctx.measureText(label).width;
  const pw = tw + 44, ph = 48;
  ctx.beginPath(); ctx.roundRect(cx - pw / 2, cy - ph / 2, pw, ph, 24);
  ctx.fillStyle = hex2rgba(col, 0.18); ctx.fill();
  ctx.strokeStyle = hex2rgba(col, 0.6); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.fillStyle = col; ctx.fillText(label, cx, cy);
  ctx.shadowBlur = 0; ctx.restore();
}

// ── Word ──────────────────────────────────────────────────────────────────────
function drawWord(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, prog: number, col: string, float: number, ff = '"Noto Sans SC", sans-serif', wordBase = 46) {
  const sc = lerp(0.7, 1, easeOutBack(Math.min(prog, 0.999)));
  const al = clamp(prog * 2.5, 0, 1);
  ctx.save(); ctx.globalAlpha = al; ctx.translate(x, y + float); ctx.scale(sc, sc);
  ctx.font = `700 ${wordFsz(text, wordBase)}px ${ff}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = col; ctx.shadowBlur = 14; ctx.fillStyle = col; ctx.fillText(text, 0, 0);
  ctx.shadowBlur = 0; ctx.restore();
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function drawNatureScene(
  ctx: CanvasRenderingContext2D, elapsed: number,
  nc: NatureContent, _accent: string, _accent2: string, coverIndex: number,
  opts?: NatureOptions,
) {
  // Color: user override → CONTRAST_PAIRS fallback
  const [pairA, pairA2] = CONTRAST_PAIRS[coverIndex % CONTRAST_PAIRS.length];
  const accent  = (opts?.leftColor  && opts.leftColor  !== '') ? opts.leftColor  : pairA;
  const accent2 = (opts?.rightColor && opts.rightColor !== '') ? opts.rightColor : pairA2;

  // Typography
  const ff       = opts?.fontFamily ? `"${opts.fontFamily}", sans-serif` : '"Noto Sans SC", sans-serif';
  const titleFsz = opts?.titleFontSize ?? 68;
  const titleCol = (opts?.titleColor && opts.titleColor !== '') ? opts.titleColor : '#fff';
  const wordBase = opts?.wordFontSize ?? 46;
  const bw       = opts?.borderWidth ?? 2.5;

  const rand = seededRandom(coverIndex * 37 + 11);
  const lSlots = buildSlots(rand);
  const rSlots = buildSlots(rand);
  const cSlots = buildCenterSlots();
  const pair = SPOT_PAIRS[coverIndex % SPOT_PAIRS.length];
  const NL = nc.leftItems.length, NR = nc.rightItems.length;
  const NC = nc.commonItems?.length ?? 0;
  const N = Math.max(NL, NR);

  // BG — static black (user request: no animated backgrounds)
  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CW, CH);
  // Mountain silhouette
  if (elapsed > N_BG_END * 0.5) {
    const ma = clamp((elapsed - N_BG_END * 0.5) / (N_BG_END * 0.5), 0, 1) * 0.15;
    ctx.fillStyle = hex2rgba(accent, ma);
    ctx.beginPath(); ctx.moveTo(0, CH);
    [0.05,0.14,0.1,0.18,0.12,0.19,0.08,0.15,0.06].forEach((h,i)=>ctx.lineTo((i/8)*CW+CW/16, CH-h*CH*0.4));
    ctx.lineTo(CW, CH); ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // Title
  if (elapsed > N_BG_END) {
    const ta = easeOutCubic(clamp((elapsed - N_BG_END) / (N_TITLE_END - N_BG_END), 0, 1));
    ctx.save(); ctx.globalAlpha = ta;
    ctx.font = `800 ${titleFsz}px ${ff}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.shadowColor = accent; ctx.shadowBlur = 20; ctx.fillStyle = titleCol; ctx.fillText(nc.title, CW / 2, 30);
    ctx.shadowBlur = 0; ctx.restore();
  }

  // Circles
  if (elapsed > N_TITLE_END) {
    const cp = easeOutCubic(clamp((elapsed - N_TITLE_END) / (N_CIRCLE_END - N_TITLE_END), 0, 1));
    drawCircle(ctx, LCX, CCY, CR, cp, accent, bw);
    drawCircle(ctx, RCX, CCY, CR, cp, accent2, bw);
  }

  // Badges
  if (elapsed > N_CIRCLE_END) {
    const ba = easeOutCubic(clamp((elapsed - N_CIRCLE_END) / (N_BADGE_END - N_CIRCLE_END), 0, 1));
    drawBadge(ctx, LCX, CCY - CR - 38, nc.leftTitle, ba, accent, ff);
    drawBadge(ctx, RCX, CCY - CR - 38, nc.rightTitle, ba, accent2, ff);
    // Common items badge
    if (NC > 0) drawBadge(ctx, CW / 2, CCY - CR - 38, '共同', ba, GOLD, ff);
  }

  // Scenic spots (no name labels)
  if (elapsed > N_BADGE_END) {
    const sa = easeOutCubic(clamp((elapsed - N_BADGE_END) / (N_SPOT_END - N_BADGE_END), 0, 1));
    ctx.save(); ctx.beginPath(); ctx.arc(LCX, CCY, CR - 6, 0, Math.PI * 2); ctx.clip();
    ctx.globalAlpha = sa * 0.7; pair.left(ctx, LCX, CCY, 85, accent); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.arc(RCX, CCY, CR - 6, 0, Math.PI * 2); ctx.clip();
    ctx.globalAlpha = sa * 0.7; pair.right(ctx, RCX, CCY, 85, accent2); ctx.restore();
  }

  // Words (sequential, L+R paired)
  if (elapsed > N_WORD_BASE) {
    const we = elapsed - N_WORD_BASE;
    for (let i = 0; i < N; i++) {
      const te = we - i * N_WORD_SLOT;
      if (te <= 0) continue;
      const prog = clamp(te / 400, 0, 1);
      const float = Math.sin(elapsed * 0.0008 + i * 1.2) * 3;
      if (i < NL && lSlots[i]) {
        const s = lSlots[i];
        drawWord(ctx, nc.leftItems[i], LCX + Math.cos(s.angle) * s.radius, CCY + Math.sin(s.angle) * s.radius, prog, accent, float, ff, wordBase);
      }
      if (i < NR && rSlots[i]) {
        const s = rSlots[i];
        drawWord(ctx, nc.rightItems[i], RCX + Math.cos(s.angle) * s.radius, CCY + Math.sin(s.angle) * s.radius, prog, accent2, -float, ff, wordBase);
      }
    }
    // Common items (center zone, slight delay after left/right)
    const commonBase = Math.max(NL, NR) * N_WORD_SLOT + N_WORD_SLOT;
    for (let i = 0; i < NC; i++) {
      const te = we - commonBase - i * N_WORD_SLOT;
      if (te <= 0) continue;
      const prog = clamp(te / 400, 0, 1);
      const cs = cSlots[i % cSlots.length];
      const float = Math.sin(elapsed * 0.0007 + i * 2.1) * 4;
      drawWord(ctx, nc.commonItems![i], cs.x, cs.y + float, prog, GOLD, 0, ff, wordBase);
    }
  }

  // Center dividing dashed line
  if (elapsed > N_CIRCLE_END) {
    const da = clamp((elapsed - N_CIRCLE_END) / 400, 0, 1) * 0.3;
    ctx.save(); ctx.globalAlpha = da;
    const dg = ctx.createLinearGradient(CW / 2, 120, CW / 2, CH - 80);
    dg.addColorStop(0, 'rgba(255,255,255,0)');
    dg.addColorStop(0.4, hex2rgba(accent, 0.5));
    dg.addColorStop(0.6, hex2rgba(GOLD, 0.6));
    dg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = dg; ctx.lineWidth = 1; ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(CW / 2, 120); ctx.lineTo(CW / 2, CH - 80);
    ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  }
}
