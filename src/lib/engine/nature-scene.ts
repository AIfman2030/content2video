import type { NatureContent } from '../../types/video';
import { CW, CH, clamp, lerp, easeOutCubic, easeOutBack, hex2rgba, seededRandom } from './helpers';
import { SPOT_PAIRS } from './nature-spots';

// ── Timing constants for nature style ────────────────────────────────────────
const N_BG_END    = 700;
const N_TITLE_END = 1400;
const N_CIRCLE_END = 2100;
const N_BADGE_END  = 2700;
const N_SPOT_END   = 3200;
const N_WORD_BASE  = 3200;
const N_WORD_SLOT  = 550;
const N_HOLD       = 2500;

export function natureTotalMs(n: number): number {
  return N_WORD_BASE + n * N_WORD_SLOT + N_HOLD;
}

// ── Pre-compute word positions (concentric rings) ────────────────────────────
type WordPos = { angle: number; radius: number };

function buildWordSlots(rand: () => number): WordPos[] {
  const ring1 = Array.from({ length: 5  }, (_, i) => ({ angle: (i / 5)  * Math.PI * 2, radius: 145 }));
  const ring2 = Array.from({ length: 7  }, (_, i) => ({ angle: (i / 7 + 0.07) * Math.PI * 2, radius: 205 }));
  const ring3 = Array.from({ length: 8  }, (_, i) => ({ angle: (i / 8 + 0.04) * Math.PI * 2, radius: 268 }));
  const all = [...ring1, ...ring2, ...ring3];
  // Fisher-Yates shuffle with seeded random
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

function wordFontSize(word: string): number {
  return word.length <= 2 ? 50 : word.length <= 3 ? 44 : word.length <= 4 ? 38 : 32;
}

// ── Draw a circle with ink-stroke reveal ────────────────────────────────────
function drawCircle(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number,
  progress: number, accent: string,
) {
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 22;
  ctx.strokeStyle = hex2rgba(accent, 0.55);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(progress, 1));
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Inner glow ring
  ctx.strokeStyle = hex2rgba(accent, 0.12);
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(progress, 1));
  ctx.stroke();
  ctx.restore();
}

// ── Draw header badge ─────────────────────────────────────────────────────────
function drawBadge(
  ctx: CanvasRenderingContext2D, cx: number, cy: number,
  label: string, alpha: number, accent: string,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `700 38px "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tw = ctx.measureText(label).width;
  const pw = tw + 48, ph = 52, rx = 26;
  // Badge background
  ctx.beginPath();
  ctx.roundRect(cx - pw / 2, cy - ph / 2, pw, ph, rx);
  ctx.fillStyle = hex2rgba(accent, 0.18);
  ctx.fill();
  ctx.strokeStyle = hex2rgba(accent, 0.6);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Text
  ctx.shadowColor = accent;
  ctx.shadowBlur = 12;
  ctx.fillStyle = accent;
  ctx.fillText(label, cx, cy);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Draw individual word ──────────────────────────────────────────────────────
function drawWord(
  ctx: CanvasRenderingContext2D, text: string,
  x: number, y: number, progress: number, accent: string, float: number,
) {
  const sc = lerp(0.7, 1, easeOutBack(Math.min(progress, 0.999)));
  const al = clamp(progress * 2.5, 0, 1);
  ctx.save();
  ctx.globalAlpha = al;
  ctx.translate(x, y + float);
  ctx.scale(sc, sc);
  ctx.font = `700 ${wordFontSize(text)}px "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = accent;
  ctx.shadowBlur = 14;
  ctx.fillStyle = accent;
  ctx.fillText(text, 0, 0);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Main draw function ────────────────────────────────────────────────────────
export function drawNatureScene(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  nc: NatureContent,
  accent: string,
  accent2: string,
  coverIndex: number,
) {
  const rand = seededRandom(coverIndex * 37 + 11);
  const leftSlots  = buildWordSlots(rand);
  const rightSlots = buildWordSlots(rand);

  const LCX = 480, RCX = 1440, CCY = 560, CIRCLE_R = 340;
  const pair = SPOT_PAIRS[coverIndex % SPOT_PAIRS.length];
  const N = Math.max(nc.leftItems.length, nc.rightItems.length);

  // ── Background gradient ────────────────────────────────────────────────────
  ctx.save();
  const bgAlpha = clamp(elapsed / N_BG_END, 0, 1);
  const bg = ctx.createRadialGradient(CW / 2, CH / 2, 0, CW / 2, CH / 2, CW * 0.75);
  bg.addColorStop(0, `rgba(10,24,12,${bgAlpha})`);
  bg.addColorStop(1, `rgba(4,10,5,${bgAlpha})`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CW, CH);

  // Distant mountain silhouette (bottom mist)
  if (elapsed > N_BG_END * 0.5) {
    const ma = clamp((elapsed - N_BG_END * 0.5) / (N_BG_END * 0.5), 0, 1) * 0.18;
    ctx.fillStyle = hex2rgba(accent, ma);
    ctx.beginPath();
    ctx.moveTo(0, CH);
    [0.05, 0.15, 0.1, 0.2, 0.12, 0.18, 0.08, 0.14, 0.06].forEach((h, i) => {
      const bx = (i / 8) * CW;
      ctx.lineTo(bx + CW / 16, CH - h * CH * 0.4);
    });
    ctx.lineTo(CW, CH); ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // ── Title ─────────────────────────────────────────────────────────────────
  if (elapsed > N_BG_END) {
    const ta = easeOutCubic(clamp((elapsed - N_BG_END) / (N_TITLE_END - N_BG_END), 0, 1));
    ctx.save();
    ctx.globalAlpha = ta;
    ctx.font = `800 72px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = accent;
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(nc.title, CW / 2, 28);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Circles ───────────────────────────────────────────────────────────────
  if (elapsed > N_TITLE_END) {
    const cp = easeOutCubic(clamp((elapsed - N_TITLE_END) / (N_CIRCLE_END - N_TITLE_END), 0, 1));
    drawCircle(ctx, LCX, CCY, CIRCLE_R, cp, accent);
    drawCircle(ctx, RCX, CCY, CIRCLE_R, cp, accent2);
  }

  // ── Badges ────────────────────────────────────────────────────────────────
  if (elapsed > N_CIRCLE_END) {
    const ba = easeOutCubic(clamp((elapsed - N_CIRCLE_END) / (N_BADGE_END - N_CIRCLE_END), 0, 1));
    drawBadge(ctx, LCX, CCY - CIRCLE_R - 38, nc.leftTitle, ba, accent);
    drawBadge(ctx, RCX, CCY - CIRCLE_R - 38, nc.rightTitle, ba, accent2);
  }

  // ── Scenic spot silhouettes ───────────────────────────────────────────────
  if (elapsed > N_BADGE_END) {
    const sa = easeOutCubic(clamp((elapsed - N_BADGE_END) / (N_SPOT_END - N_BADGE_END), 0, 1));
    ctx.save();
    // Clip to circles
    ctx.beginPath(); ctx.arc(LCX, CCY, CIRCLE_R - 6, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = sa * 0.7;
    pair.left(ctx, LCX, CCY, 90, accent);
    ctx.restore();

    ctx.save();
    ctx.beginPath(); ctx.arc(RCX, CCY, CIRCLE_R - 6, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = sa * 0.7;
    pair.right(ctx, RCX, CCY, 90, accent2);
    ctx.restore();

    // Scenic spot names (small label below center)
    ctx.save(); ctx.globalAlpha = sa * 0.5;
    ctx.font = `400 24px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = accent; ctx.fillText(pair.leftName, LCX, CCY + CIRCLE_R * 0.72);
    ctx.fillStyle = accent2; ctx.fillText(pair.rightName, RCX, CCY + CIRCLE_R * 0.72);
    ctx.restore();
  }

  // ── Words ─────────────────────────────────────────────────────────────────
  if (elapsed > N_WORD_BASE) {
    const wordElapsed = elapsed - N_WORD_BASE;

    for (let i = 0; i < N; i++) {
      const te = wordElapsed - i * N_WORD_SLOT;
      if (te <= 0) continue;
      const prog = clamp(te / 400, 0, 1);
      const float = Math.sin(elapsed * 0.0008 + i * 1.2) * 3;

      const lSlot = leftSlots[i % leftSlots.length];
      const rSlot = rightSlots[i % rightSlots.length];

      if (i < nc.leftItems.length && lSlot) {
        const wx = LCX + Math.cos(lSlot.angle) * lSlot.radius;
        const wy = CCY + Math.sin(lSlot.angle) * lSlot.radius;
        drawWord(ctx, nc.leftItems[i], wx, wy, prog, accent, float);
      }
      if (i < nc.rightItems.length && rSlot) {
        const wx = RCX + Math.cos(rSlot.angle) * rSlot.radius;
        const wy = CCY + Math.sin(rSlot.angle) * rSlot.radius;
        drawWord(ctx, nc.rightItems[i], wx, wy, prog, accent2, -float);
      }
    }
  }

  // ── Center dividing line ──────────────────────────────────────────────────
  if (elapsed > N_CIRCLE_END) {
    const da = clamp((elapsed - N_CIRCLE_END) / 400, 0, 1) * 0.3;
    ctx.save(); ctx.globalAlpha = da;
    const dg = ctx.createLinearGradient(CW / 2, 120, CW / 2, CH - 80);
    dg.addColorStop(0, 'rgba(255,255,255,0)');
    dg.addColorStop(0.4, hex2rgba(accent, 0.5));
    dg.addColorStop(0.6, hex2rgba(accent2, 0.5));
    dg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = dg; ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(CW / 2, 120); ctx.lineTo(CW / 2, CH - 80);
    ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }
}
