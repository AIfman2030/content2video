// ── Translation style engine ─────────────────────────────────────────────────
// Layout: warm wine-red bg · Chinese sentence · English translation · 收到扣1 · 再来 ending
import type { GeneratedContent } from '../../types/video';
import { CW, CH, clamp, easeOutCubic, wrapText } from './helpers';

// ── Timing constants (ms) ────────────────────────────────────────────────────
const BADGE_IN    = 200;
const PREFIX_IN   = 800;
const CHINESE_IN  = 1400;
const ENGLISH_IN  = 3600;
const OK_IN       = 5600;
const MAIN_FADE   = 7800;   // main content starts fading out
const END_BG      = 8300;   // black overlay
const END_RE      = 8800;   // "再" char pops in
const END_LAI     = 9100;   // "来" char pops in
const END_LINE    = 9600;   // divider line grows
const FINAL_FADE  = 12500;
export const TR_TOTAL_MS = 14000;

// ── Floating 收到/扣1 particle ───────────────────────────────────────────────
export interface TrParticle {
  x: number; y: number;
  size: number; baseAlpha: number;
  vy: number;
  text: string;
  delay: number;
  phaseOffset: number;
}

const FLOAT_TEXTS = ['收到', 'OK', '收到', 'OK', '收到', 'OK', '好的', '收到', 'OK', '收', '到', '扣', 'OK', '收到', 'OK', '好'];

export function initTrParticles(rand: () => number): TrParticle[] {
  return FLOAT_TEXTS.map((text) => ({
    x: 80 + rand() * (CW - 160),
    y: 80 + rand() * (CH - 300),
    size: 24 + rand() * 44,
    baseAlpha: 0.18 + rand() * 0.32,
    vy: 0.25 + rand() * 0.55,
    text,
    delay: rand() * 2200,
    phaseOffset: rand() * Math.PI * 2,
  }));
}

// ── Background ───────────────────────────────────────────────────────────────
function drawBg(ctx: CanvasRenderingContext2D, alpha: number) {
  ctx.save();
  // Main warm radial gradient — glowing center-left
  const bg = ctx.createRadialGradient(680, 480, 40, 680, 480, 1060);
  bg.addColorStop(0,   '#8c2222');
  bg.addColorStop(0.3, '#631414');
  bg.addColorStop(0.7, '#3b0c0c');
  bg.addColorStop(1,   '#190404');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CW, CH);
  // Second subtle highlight — right-side warm bloom
  const bloom = ctx.createRadialGradient(1400, 300, 0, 1400, 300, 520);
  bloom.addColorStop(0, 'rgba(120,40,40,0.35)');
  bloom.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, CW, CH);
  // Vignette
  const vig = ctx.createRadialGradient(CW/2, CH/2, 260, CW/2, CH/2, 860);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();
}

// ── Account badge (top-left) ─────────────────────────────────────────────────
function drawBadge(ctx: CanvasRenderingContext2D, alpha: number) {
  ctx.save(); ctx.globalAlpha = alpha;

  const bx = 52, by = 38, bw = 186, bh = 72;

  // Badge background
  ctx.fillStyle = 'rgba(0,0,0,0.40)';
  ctx.strokeStyle = 'rgba(200,70,70,0.75)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.fill(); ctx.stroke();

  // Left red accent stripe
  ctx.fillStyle = '#c83030';
  ctx.beginPath(); ctx.roundRect(bx, by, 4, bh, [6, 0, 0, 6]); ctx.fill();

  // Main account name
  ctx.font = '700 28px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(220,80,80,0.5)'; ctx.shadowBlur = 8;
  ctx.fillStyle = 'rgba(255,238,218,0.96)';
  ctx.fillText('小福分享舍', bx + 16, by + bh / 2 - 8);
  ctx.shadowBlur = 0;

  // Sub-label
  ctx.font = '400 18px "Noto Sans SC", sans-serif';
  ctx.fillStyle = 'rgba(255,200,160,0.65)';
  ctx.fillText('- Xiao Fu Share -', bx + 16, by + bh / 2 + 18);

  ctx.restore();
}

// ── Decorative prefix "小福悟语：" ────────────────────────────────────────────
function drawPrefix(ctx: CanvasRenderingContext2D, elapsed: number, alpha: number) {
  const te = elapsed - PREFIX_IN;
  if (te <= 0) return;
  const a  = easeOutCubic(clamp(te / 700, 0, 1)) * alpha;
  const dx = (1 - easeOutCubic(clamp(te / 700, 0, 1))) * -70;
  ctx.save(); ctx.globalAlpha = a;
  ctx.font = 'italic bold 78px Georgia, "Noto Serif SC", serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(255,180,120,0.40)'; ctx.shadowBlur = 22;
  ctx.fillStyle = 'rgba(255,248,236,0.90)';
  ctx.fillText(' To Everybody：', 90 + dx, CH * 0.27);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Chinese main sentence ─────────────────────────────────────────────────────
function drawChineseText(ctx: CanvasRenderingContext2D, elapsed: number, alpha: number, text: string) {
  const te = elapsed - CHINESE_IN;
  if (te <= 0) return;
  const ea  = easeOutCubic(clamp(te / 900, 0, 1));
  const a   = clamp(te / 700, 0, 1) * alpha;
  const yOff = (1 - ea) * 50;
  ctx.save(); ctx.globalAlpha = a;
  ctx.font = `900 96px "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(255,240,200,0.65)'; ctx.shadowBlur = 32;
  ctx.fillStyle = 'rgba(255,246,224,0.98)';
  const lines = wrapText(ctx, text, 1060);
  const lineH = 128;
  const totalH = lines.length * lineH;
  const startY = CH * 0.44 - totalH / 2 + lineH / 2 + yOff;
  lines.forEach((line, i) => ctx.fillText(line, CW / 2, startY + i * lineH));
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── English translation ───────────────────────────────────────────────────────
function drawEnglishText(ctx: CanvasRenderingContext2D, elapsed: number, alpha: number, text: string) {
  const te = elapsed - ENGLISH_IN;
  if (te <= 0) return;
  const a  = easeOutCubic(clamp(te / 800, 0, 1)) * alpha;
  const yOff = (1 - easeOutCubic(clamp(te / 800, 0, 1))) * 30;
  ctx.save(); ctx.globalAlpha = a;
  ctx.font = `italic 400 58px Georgia, "Times New Roman", serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(255,200,150,0.30)'; ctx.shadowBlur = 12;
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  const lines = wrapText(ctx, text, 1060);
  const lineH = 80;
  const startY = CH * 0.655 + yOff;
  lines.forEach((line, i) => ctx.fillText(line, CW / 2, startY + i * lineH));
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── 收到，ok + floating particles ───────────────────────────────────────────
function drawOK(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  alpha: number,
  particles: TrParticle[],
) {
  const te = elapsed - OK_IN;
  if (te <= 0) return;
  const mainA = easeOutCubic(clamp(te / 700, 0, 1)) * alpha;

  // Floating background copies
  particles.forEach(p => {
    const pt = te - p.delay;
    if (pt <= 0 || pt > 4000) return;
    const fadeIn  = clamp(pt / 500, 0, 1);
    const fadeOut = 1 - clamp((pt - 3200) / 800, 0, 1);
    const a = fadeIn * fadeOut * p.baseAlpha * alpha;
    const dy = (pt / 1000) * p.vy * -60;
    const wobble = Math.sin(pt * 0.002 + p.phaseOffset) * 6;
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = `600 ${Math.round(p.size)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe44d';
    ctx.fillText(p.text, p.x + wobble, p.y + dy);
    ctx.restore();
  });

  // Main centered text "收到回复：Yes"
  ctx.save(); ctx.globalAlpha = mainA;
  // Pill background
  ctx.font = `900 88px "Noto Sans SC", sans-serif`;
  const tw = ctx.measureText('收到，OK').width;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.roundRect(CW / 2 - tw / 2 - 24, CH * 0.862 - 54, tw + 48, 88, 12);
  ctx.fill();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 28;
  ctx.fillStyle = '#ffe44d';
  ctx.fillText('收到，OK', CW / 2, CH * 0.875);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Ending "再来" poster ──────────────────────────────────────────────────────
function drawEnding(ctx: CanvasRenderingContext2D, elapsed: number) {
  const bgTe = elapsed - END_BG;
  if (bgTe <= 0) return;

  // Black fade-over
  const bgA = easeOutCubic(clamp(bgTe / 600, 0, 1));
  ctx.fillStyle = `rgba(4,0,0,${bgA * 0.97})`;
  ctx.fillRect(0, 0, CW, CH);

  // "再" — left character
  const re = elapsed - END_RE;
  if (re > 0) {
    const ea = easeOutCubic(clamp(re / 700, 0, 1));
    const sc = 0.55 + ea * 0.45;
    ctx.save();
    ctx.translate(CW / 2 - 190, CH / 2 + 10);
    ctx.scale(sc, sc);
    ctx.font = `900 310px "Noto Serif SC", "Songti SC", serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#c83030'; ctx.shadowBlur = 50;
    ctx.fillStyle = '#7a1a1a';
    ctx.fillText('拜', 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // "来" — right character (200ms delay)
  const lai = elapsed - END_LAI;
  if (lai > 0) {
    const ea = easeOutCubic(clamp(lai / 700, 0, 1));
    const sc = 0.55 + ea * 0.45;
    ctx.save();
    ctx.translate(CW / 2 + 190, CH / 2 + 10);
    ctx.scale(sc, sc);
    ctx.font = `900 310px "Noto Serif SC", "Songti SC", serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#c83030'; ctx.shadowBlur = 50;
    ctx.fillStyle = '#7a1a1a';
    ctx.fillText('拜', 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Divider line
  const lineTe = elapsed - END_LINE;
  if (lineTe > 0) {
    const lineA = easeOutCubic(clamp(lineTe / 500, 0, 1));
    const lineH = 280 * lineA;
    ctx.save(); ctx.globalAlpha = lineA * 0.55;
    ctx.strokeStyle = '#c83030'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CW / 2, CH / 2 - 140);
    ctx.lineTo(CW / 2, CH / 2 - 140 + lineH);
    ctx.stroke();
    ctx.restore();
  }

  // "小福分享舍" badge persists on ending
  if (bgA > 0.5) {
    drawBadge(ctx, bgA);
  }

  // Final fade to black
  const finalTe = elapsed - FINAL_FADE;
  if (finalTe > 0) {
    const fa = clamp(finalTe / 1200, 0, 1);
    ctx.fillStyle = `rgba(0,0,0,${fa})`;
    ctx.fillRect(0, 0, CW, CH);
  }
}

// ── Main draw function ────────────────────────────────────────────────────────
export function drawTranslation(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  particles: TrParticle[],
) {
  const chineseText = content.title;
  const englishText = content.points[0]?.desc ?? '';

  // Background
  const bgAlpha = clamp(elapsed / 600, 0, 1);
  drawBg(ctx, bgAlpha);

  // Main content fades out as ending approaches
  const mainFade = clamp((elapsed - MAIN_FADE) / 600, 0, 1);
  const mainAlpha = (1 - mainFade) * bgAlpha;

  if (mainAlpha > 0.01) {
    drawBadge(ctx, mainAlpha);
    drawPrefix(ctx, elapsed, mainAlpha);
    drawChineseText(ctx, elapsed, mainAlpha, chineseText);
    drawEnglishText(ctx, elapsed, mainAlpha, englishText);
    drawOK(ctx, elapsed, mainAlpha, particles);
  }

  drawEnding(ctx, elapsed);
}
