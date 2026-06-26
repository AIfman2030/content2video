// ── Translation style engine ─────────────────────────────────────────────────
// Layout: warm wine-red bg · "To Everybody" · Chinese sentence · English translation · 收到OK
import type { GeneratedContent } from '../../types/video';
import { CW, CH, clamp, wrapText } from './helpers';

// ── Timing constants (ms) ────────────────────────────────────────────────────
const FADE_IN   = 300;   // brief global fade-in (background only)
export const TR_TOTAL_MS = 6000; // total duration, no fade-out ending

// ── Floating 收到/OK particle ────────────────────────────────────────────────
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

// ── "To Everybody：" prefix ──────────────────────────────────────────────────
function drawPrefix(ctx: CanvasRenderingContext2D, alpha: number, y: number) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.font = 'italic bold 78px Georgia, "Noto Serif SC", serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(255,180,120,0.40)'; ctx.shadowBlur = 22;
  ctx.fillStyle = 'rgba(255,248,236,0.90)';
  ctx.fillText(' To Everybody：', 90, y);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Chinese main sentence ─────────────────────────────────────────────────────
function drawChineseText(ctx: CanvasRenderingContext2D, alpha: number, text: string) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.font = `900 96px "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(255,240,200,0.65)'; ctx.shadowBlur = 32;
  ctx.fillStyle = 'rgba(255,246,224,0.98)';
  const lines = wrapText(ctx, text, 1060);
  const lineH = 128;
  const totalH = lines.length * lineH;
  const startY = CH * 0.44 - totalH / 2 + lineH / 2;
  lines.forEach((line, i) => ctx.fillText(line, CW / 2, startY + i * lineH));
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── English translation ───────────────────────────────────────────────────────
function drawEnglishText(ctx: CanvasRenderingContext2D, alpha: number, text: string) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.font = `italic 400 58px Georgia, "Times New Roman", serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(255,200,150,0.30)'; ctx.shadowBlur = 12;
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  const lines = wrapText(ctx, text, 1060);
  const lineH = 80;
  const startY = CH * 0.655;
  lines.forEach((line, i) => ctx.fillText(line, CW / 2, startY + i * lineH));
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── 收到，OK + floating particles ────────────────────────────────────────────
function drawOK(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  alpha: number,
  particles: TrParticle[],
) {
  // Floating background copies
  particles.forEach(p => {
    const pt = elapsed - p.delay;
    if (pt <= 0 || pt > 5500) return;
    const fadeIn  = clamp(pt / 500, 0, 1);
    const fadeOut = 1 - clamp((pt - 4800) / 700, 0, 1);
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

  // Main centered "收到，OK"
  ctx.save(); ctx.globalAlpha = alpha;
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

// ── Simple fade-to-black ending ──────────────────────────────────────────────
// (removed — no ending per user request)

// ── Main draw function ────────────────────────────────────────────────────────
export function drawTranslation(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  particles: TrParticle[],
) {
  const chineseText = content.title;
  const englishText = content.points[0]?.desc ?? '';

  // Background fades in quickly, content appears together with it
  const bgAlpha = clamp(elapsed / FADE_IN, 0, 1);
  drawBg(ctx, bgAlpha);

  if (bgAlpha > 0.01) {
    // Compute Chinese text block top to position prefix 15px above it
    ctx.font = `900 96px "Noto Sans SC", sans-serif`;
    const cnLines    = wrapText(ctx, chineseText, 1060);
    const cnTotalH   = cnLines.length * 128;
    const cnBlockTop = CH * 0.44 - cnTotalH / 2;
    const prefixFsz  = 78;
    const prefixY    = cnBlockTop - 15 - prefixFsz / 2;

    drawPrefix(ctx, bgAlpha, prefixY);
    drawChineseText(ctx, bgAlpha, chineseText);
    drawEnglishText(ctx, bgAlpha, englishText);
    drawOK(ctx, elapsed, bgAlpha, particles);
  }
}
