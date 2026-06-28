// aigoblin.ts — AI Goblin style: 9:16 portrait, left character + right content split
import type { GeneratedContent, AIGoblinOptions } from '../../types/video';

export const GOBLIN_W = 1080;
export const GOBLIN_H = 1920;

const INTRO_DURATION  = 1500;   // character + title fade-in
const SEGMENT_DURATION = 4500;  // per content point
const OUTRO_DURATION  = 1800;   // final hold

export function goblinTotalMs(pointCount: number, _opts?: AIGoblinOptions): number {
  const pts = Math.max(1, pointCount);
  return INTRO_DURATION + pts * SEGMENT_DURATION + OUTRO_DURATION;
}

// ─── Easing ───────────────────────────────────────────────────────────────
function easeOutBack(t: number): number {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3); }
function easeInCubic(t: number): number { return t * t * t; }

// ─── Particles (gold dust, seeded per frame) ──────────────────────────────
interface Particle {
  baseX: number; baseY: number;
  ampX: number; ampY: number;
  size: number;
  speed: number;
  phase: number;
  alpha: number;
}
let _particles: Particle[] | null = null;
function ensureParticles(): Particle[] {
  if (_particles) return _particles;
  _particles = [];
  const count = 50;
  for (let i = 0; i < count; i++) {
    const seed = i * 7919 + 1;
    const pr = ((seed * 16807) % 2147483647) / 2147483647;
    _particles.push({
      baseX: ((seed * 6271) % GOBLIN_W + GOBLIN_W) % GOBLIN_W,
      baseY: ((seed * 7351) % GOBLIN_H + GOBLIN_H) % GOBLIN_H,
      ampX: 15 + pr * 70,
      ampY: 20 + pr * 90,
      size: 1 + pr * 3.5,
      speed: 0.25 + pr * 1.0,
      phase: pr * Math.PI * 2,
      alpha: 0.05 + pr * 0.12,
    });
  }
  return _particles;
}

// ─── Text draw with word-wrap ─────────────────────────────────────────────
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  // Split by characters for CJK, words for Latin
  const isCJK = /[\u4e00-\u9fff\u3400-\u4dbf\uff01-\uff5e\u3000-\u303f]/.test(text);
  const tokens = isCJK ? text.split('') : text.split(/(\s+)/);
  let line = '';
  let curY = y;
  for (const tok of tokens) {
    const test = line + tok;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, curY);
      line = tok;
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, curY);
}

// ─── Draw character silhouette (when no real image) ───────────────────────
function drawSilhouette(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.save();
  // Head
  const headR = size * 0.14;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy - headR * 1.1, headR, 0, Math.PI * 2);
  ctx.fill();
  // Body (wider for goblin silhouette)
  const bw = size * 0.32, bh = size * 0.38;
  ctx.fillRect(cx - bw * 0.5, cy, bw, bh);
  // Hood (pointed)
  ctx.beginPath();
  ctx.moveTo(cx - bw * 0.5, cy);
  ctx.lineTo(cx, cy - bw * 0.85);
  ctx.lineTo(cx + bw * 0.5, cy);
  ctx.closePath();
  ctx.fill();
  // Eye glow (red)
  const eyeR = headR * 0.28;
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(cx - eyeR * 1.5, cy - headR * 1.1, eyeR, 0, Math.PI * 2);
  ctx.arc(cx + eyeR * 1.5, cy - headR * 1.1, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─── Layout constants ─────────────────────────────────────────────────────
const LEFT_PANEL_X  = 60;   // left panel start
const LEFT_PANEL_W  = 420;  // left panel width (character area)
const RIGHT_PANEL_X = 510;  // right panel start (content area)
const RIGHT_PANEL_W = 510;  // right panel width
const DIVIDER_X     = 480;  // visual divider line

// ─── Main draw function ───────────────────────────────────────────────────
export function drawAIGoblin(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  opts: AIGoblinOptions,
  characterImg: HTMLImageElement,
) {
  const W = GOBLIN_W, H = GOBLIN_H;
  const accent = opts.primaryColor || '#f59e0b';

  // ── 1. Background ────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, opts.bgColor1 || '#0d0510');
  bg.addColorStop(0.4, '#120418');
  bg.addColorStop(1, opts.bgColor2 || '#080414');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Radial glow behind character area
  const glow = ctx.createRadialGradient(
    LEFT_PANEL_X + LEFT_PANEL_W * 0.5, H * 0.43, 0,
    LEFT_PANEL_X + LEFT_PANEL_W * 0.5, H * 0.43, LEFT_PANEL_W * 0.8,
  );
  glow.addColorStop(0, `${accent}0f`);
  glow.addColorStop(0.6, `${accent}04`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── 2. Floating gold dust ────────────────────────────────────────────
  const particles = ensureParticles();
  const tSec = elapsed * 0.001;
  for (const p of particles) {
    const px = p.baseX + Math.sin(tSec * p.speed + p.phase) * p.ampX;
    const py = p.baseY + Math.cos(tSec * 1.3) * p.ampY;
    const flicker = 0.4 + 0.6 * Math.sin(elapsed * 0.0015 + p.phase * 2.7);
    const alpha = 0.03 + flicker * 0.09;
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(245,158,11,${alpha.toFixed(3)})`;
    ctx.fill();
  }

  // ── 3. Visual divider ────────────────────────────────────────────────
  const dividerAlpha = easeInCubic(Math.min(1, elapsed / (INTRO_DURATION * 0.6)));
  ctx.save();
  ctx.globalAlpha = dividerAlpha;
  const divGrad = ctx.createLinearGradient(DIVIDER_X, H * 0.15, DIVIDER_X, H * 0.85);
  divGrad.addColorStop(0, 'rgba(255,255,255,0)');
  divGrad.addColorStop(0.3, `${accent}30`);
  divGrad.addColorStop(0.5, `${accent}18`);
  divGrad.addColorStop(0.7, `${accent}30`);
  divGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(DIVIDER_X, H * 0.15);
  ctx.lineTo(DIVIDER_X, H * 0.85);
  ctx.stroke();
  ctx.restore();

  // ── 4. Character (LEFT panel) ────────────────────────────────────────
  const charPhase = Math.min(1, elapsed / (INTRO_DURATION * 0.8));
  const charAlpha = easeInCubic(charPhase);
  const charScale = 0.88 + 0.12 * easeOutBack(charPhase);

  ctx.save();
  ctx.globalAlpha = charAlpha;

  const charCx = LEFT_PANEL_X + LEFT_PANEL_W * 0.5;
  const charCy = H * 0.43;
  const maxCharW = LEFT_PANEL_W * 1.05 * charScale;
  const maxCharH = H * 0.62 * charScale;

  if (characterImg && characterImg.complete && characterImg.naturalWidth > 0) {
    const imgRatio = characterImg.naturalWidth / characterImg.naturalHeight;
    let iw: number, ih: number;
    if (imgRatio > 1) {
      iw = Math.min(maxCharW, maxCharH * imgRatio);
      ih = iw / imgRatio;
    } else {
      ih = Math.min(maxCharH, maxCharW / imgRatio);
      iw = ih * imgRatio;
    }
    const ix = charCx - iw * 0.5;
    const iy = charCy - ih * 0.5;

    // Character glow shadow
    const chGlow = ctx.createRadialGradient(charCx, iy + ih * 0.6, 0, charCx, iy + ih * 0.65, iw * 0.7);
    chGlow.addColorStop(0, `${accent}18`);
    chGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = chGlow;
    ctx.fillRect(ix - 60, iy + ih * 0.4, iw + 120, ih * 0.6);

    ctx.drawImage(characterImg, ix, iy, iw, ih);
  } else {
    // Silhouette placeholder (larger, more dramatic)
    drawSilhouette(ctx, charCx, charCy, maxCharW * 0.85, accent + '18');
  }
  ctx.restore();

  // ── 5. Content (RIGHT panel) ─────────────────────────────────────────
  const points = content.points || [];
  if (points.length === 0) return;

  const contentStart = INTRO_DURATION;
  const contentTime  = Math.max(0, elapsed - contentStart);
  const activeIdx    = Math.min(points.length - 1, Math.floor(contentTime / SEGMENT_DURATION));
  const segProgress  = Math.min(1, (contentTime % SEGMENT_DURATION) / (SEGMENT_DURATION * 0.7));

  // Starting Y for content panel (higher to match reference)
  const panelTop = H * 0.16;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const isPast   = i < activeIdx;
    const isActive = i === activeIdx;

    if (!isPast && !isActive) continue;

    let alpha = 1;
    let slideUp = 0;

    if (isActive) {
      alpha = easeOutBack(Math.min(1, contentTime / SEGMENT_DURATION * 2.2));
      slideUp = (1 - easeOutCubic(Math.min(1, segProgress))) * 50;
    }

    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha);

    const ty = panelTop + slideUp;

    // Point number badge
    if (points.length > 1) {
      const badgeX = RIGHT_PANEL_X;
      const badgeY = ty - 16;
      ctx.fillStyle = `${accent}20`;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY - 14, 52, 28, 14);
      ctx.fill();
      ctx.strokeStyle = `${accent}40`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.font = `600 18px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = accent;
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}`, badgeX + 26, badgeY + 6);
    }

    // Keyword (accent-colored, like the reference orange highlights)
    const keyword = pt.label || content.title || '';
    const labelY = ty + (points.length > 1 ? 40 : 0);
    if (keyword) {
      ctx.font = `700 42px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`;
      ctx.fillStyle = accent;
      ctx.textAlign = 'left';
      ctx.fillText(keyword, RIGHT_PANEL_X, labelY + 42);
    }

    // Description / subtitle (white, smaller)
    const desc = pt.short || pt.desc || '';
    if (desc) {
      const descY = labelY + (keyword ? 70 : 40);
      ctx.font = `400 28px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.68)';
      drawWrappedText(ctx, desc, RIGHT_PANEL_X, descY, RIGHT_PANEL_W - 20, 44);
    }

    // Tags
    const tags: string[] = (pt as any).tags || opts.tags || [];
    if (tags.length > 0 && isActive && segProgress > 0.2) {
      const tagAlpha = Math.min(1, (segProgress - 0.2) * 5);
      ctx.globalAlpha = Math.min(1, alpha * tagAlpha);

      const tagBaseY = ty + 160;
      let tagRowY = tagBaseY;
      let tagX = RIGHT_PANEL_X + 4;
      const tagGap = 12;
      const tagMaxW = RIGHT_PANEL_W - 20;

      tags.slice(0, 6).forEach((tag, ti) => {
        ctx.font = `500 22px "PingFang SC", "Microsoft YaHei", sans-serif`;
        const tw = ctx.measureText(tag).width + 28;
        if (tagX + tw > RIGHT_PANEL_X + tagMaxW && ti > 0) {
          tagX = RIGHT_PANEL_X;
          tagRowY += 42;
        }
        // Pill background
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.beginPath();
        ctx.roundRect(tagX, tagRowY - 18, tw, 34, 17);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Tag text
        ctx.fillStyle = accent;
        ctx.textAlign = 'center';
        ctx.fillText(tag, tagX + tw * 0.5, tagRowY + 6);
        tagX += tw + tagGap;
      });
    }

    ctx.restore();
  }

  // ── 6. Bottom gradient vignette ──────────────────────────────────────
  const vignette = ctx.createLinearGradient(0, H * 0.85, 0, H);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // ── 7. Outro: final branding line ────────────────────────────────────
  const contentEnd = INTRO_DURATION + points.length * SEGMENT_DURATION;
  if (elapsed > contentEnd - 300) {
    const outroAlpha = Math.min(1, (elapsed - contentEnd + 300) / 700);
    ctx.save();
    ctx.globalAlpha = outroAlpha;
    ctx.font = `400 24px "PingFang SC", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.textAlign = 'center';
    ctx.fillText('AI × 内容创作 · AIfman', W * 0.5, H * 0.95);
    ctx.restore();
  }
}
