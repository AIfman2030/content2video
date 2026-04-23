import type { GeneratedContent, ThemeConfig, StyleType, ChineseOptions } from '../types/video';
import { getThemeConfig } from './themes';
import { loadShapeImage } from './shapes';
import { CHINESE_SHAPES, CITY_SHAPES, AI_SHAPES } from './themes';

export const CW = 1080;
export const CH = 1920;

interface Particle {
  x: number; y: number;
  r: number; vx: number; vy: number;
  alpha: number; pulseOffset: number;
}

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function hex2rgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * CW,
    y: Math.random() * CH,
    r: 2 + Math.random() * 5,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    alpha: 0.2 + Math.random() * 0.6,
    pulseOffset: Math.random() * Math.PI * 2,
  }));
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split('');
  const lines: string[] = [];
  let line = '';
  for (const char of words) {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines.push(line);
      line = char;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function getTotalDuration(content: GeneratedContent): number {
  return 600 + content.title.length * 90 + 1800 + content.points.length * 2400 + 2500;
}

function getTitleMoveDuration(content: GeneratedContent): number {
  return 600 + content.title.length * 90 + 600; // typewriter end + move
}

// ─── Background ────────────────────────────────────────────────────────────────
function drawBackground(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  theme: ThemeConfig,
  particles: Particle[],
) {
  const alpha = Math.min(elapsed / 600, 1);

  // Main gradient
  const grad = ctx.createLinearGradient(0, 0, 0, CH);
  grad.addColorStop(0, theme.bg[0]);
  grad.addColorStop(0.5, theme.bg[1]);
  grad.addColorStop(1, theme.bg[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  // Radial glow
  ctx.save();
  ctx.globalAlpha = alpha * 0.35;
  const glow = ctx.createRadialGradient(CW / 2, CH * 0.45, 0, CW / 2, CH * 0.45, 700);
  glow.addColorStop(0, hex2rgba(theme.accent, 0.3));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  // Perspective grid (bottom half)
  ctx.save();
  for (let y = CH * 0.55; y < CH; y += 70) {
    const t = (y - CH * 0.55) / (CH * 0.45);
    ctx.globalAlpha = alpha * t * 0.2;
    ctx.strokeStyle = theme.gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CW, y);
    ctx.stroke();
  }
  // Vertical perspective lines
  for (let i = 0; i <= 8; i++) {
    const x = (i / 8) * CW;
    ctx.globalAlpha = alpha * 0.1;
    ctx.beginPath();
    ctx.moveTo(CW / 2, CH * 0.55);
    ctx.lineTo(x, CH);
    ctx.stroke();
  }
  ctx.restore();

  // Floating particles
  ctx.save();
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = CW;
    if (p.x > CW) p.x = 0;
    if (p.y < 0) p.y = CH;
    if (p.y > CH) p.y = 0;
    const pulse = 1 + 0.4 * Math.sin(elapsed / 900 + p.pulseOffset);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
    ctx.fillStyle = hex2rgba(theme.particle, p.alpha * alpha);
    ctx.fill();
  });
  ctx.restore();
}

// ─── Shape Decoration ──────────────────────────────────────────────────────────
function drawShapeDecoration(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  shapeImg: HTMLImageElement,
  theme: ThemeConfig,
  style: StyleType,
) {
  const alpha = Math.min(elapsed / 800, 1);
  const size = style === 'city' ? 900 : 520;
  const x = (CW - size) / 2;
  const y = CH * 0.55;

  ctx.save();
  ctx.globalAlpha = style === 'city' ? alpha * 0.55 : alpha * 0.25;

  if (style === 'aitech') {
    // Wave animation for AI tech
    const wave = Math.sin(elapsed / 600) * 10;
    ctx.drawImage(shapeImg, x, y + wave, size, size);
    // Second copy with offset
    ctx.globalAlpha = alpha * 0.12;
    ctx.drawImage(shapeImg, x + 30, y - wave + 20, size, size);
  } else {
    ctx.drawImage(shapeImg, x, y, size, size);
  }
  ctx.restore();
}

// ─── Title (typewriter) ────────────────────────────────────────────────────────
function drawTitle(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  theme: ThemeConfig,
) {
  const titleLen = content.title.length;
  const typewriterEnd = 600 + titleLen * 90;
  const moveDuration = 600; // ms to move from center to top

  // How many chars to show
  const rawChars = elapsed < 600 ? 0 : Math.floor((elapsed - 600) / 90);
  const visibleChars = Math.min(rawChars, titleLen);
  const visibleText = content.title.slice(0, visibleChars);

  // Position: center → top 160px
  let titleY: number;
  let fontSize: number;

  if (elapsed < typewriterEnd) {
    // Typewriter phase: centered
    titleY = CH * 0.42;
    fontSize = 72;
  } else {
    // Move phase
    const t = clamp((elapsed - typewriterEnd) / moveDuration, 0, 1);
    const eased = easeOutCubic(t);
    titleY = CH * 0.42 + eased * (160 - CH * 0.42);
    fontSize = 72 + eased * (44 - 72);
  }

  ctx.save();

  // Shadow glow
  ctx.shadowColor = hex2rgba(theme.accent, 0.8);
  ctx.shadowBlur = 30;

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${fontSize.toFixed(0)}px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(visibleText, CW / 2, titleY);

  // Cursor blink
  if (elapsed < typewriterEnd + 300 && Math.floor(elapsed / 500) % 2 === 0) {
    const textW = ctx.measureText(visibleText).width;
    ctx.fillStyle = theme.accent;
    ctx.fillText('|', CW / 2 + textW / 2 + 8, titleY);
  }

  ctx.shadowBlur = 0;

  // Decorative line under title (after move)
  if (elapsed > typewriterEnd + moveDuration) {
    const lineAlpha = clamp((elapsed - typewriterEnd - moveDuration) / 400, 0, 1);
    ctx.globalAlpha = lineAlpha;
    const lineY = titleY + fontSize * 0.65;
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 3;
    const lineLen = 200 * lineAlpha;
    ctx.beginPath();
    ctx.moveTo(CW / 2 - lineLen, lineY);
    ctx.lineTo(CW / 2 + lineLen, lineY);
    ctx.stroke();
    // Dots
    ctx.fillStyle = theme.accent2;
    [-220, 220].forEach(offset => {
      ctx.beginPath();
      ctx.arc(CW / 2 + offset * lineAlpha, lineY, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.restore();
}

// ─── Content Cards ─────────────────────────────────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawCards(
  ctx: CanvasRenderingContext2D,
  cardElapsed: number,
  points: GeneratedContent['points'],
  theme: ThemeConfig,
) {
  const cardW = CW - 120;
  const cardH = 240;
  const cardX = 60;
  const startY = 400;
  const gap = 260;

  points.forEach((point, i) => {
    const cardStart = i * 2400;
    const t = clamp((cardElapsed - cardStart) / 400, 0, 1);
    if (t <= 0) return;

    const eased = easeOutCubic(t);
    const cardY = startY + i * gap;
    const offsetX = (1 - eased) * 200; // slide from right

    ctx.save();
    ctx.globalAlpha = eased;
    ctx.translate(offsetX, 0);

    // Glass background
    roundRect(ctx, cardX, cardY, cardW, cardH, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.strokeStyle = hex2rgba(theme.accent, 0.5);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Left color bar
    ctx.fillStyle = theme.accent;
    roundRect(ctx, cardX, cardY + 20, 6, cardH - 40, 3);
    ctx.fill();

    // Number circle
    const circleX = cardX + 70;
    const circleY = cardY + cardH / 2;
    ctx.beginPath();
    ctx.arc(circleX, circleY, 44, 0, Math.PI * 2);
    ctx.fillStyle = hex2rgba(theme.accent, 0.2);
    ctx.fill();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = theme.accent;
    ctx.font = `700 42px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${i + 1}`, circleX, circleY);

    // Label
    const textX = cardX + 135;
    ctx.textAlign = 'left';
    ctx.font = `800 48px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = theme.accent;
    ctx.shadowColor = hex2rgba(theme.accent, 0.6);
    ctx.shadowBlur = 15;
    ctx.fillText(point.label, textX, cardY + 72);
    ctx.shadowBlur = 0;

    // Short desc
    ctx.font = `400 30px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText(point.short || '', textX, cardY + 122);

    // Long desc (wrapped)
    ctx.font = `400 26px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    const descLines = wrapText(ctx, point.desc || '', cardW - 160);
    descLines.slice(0, 2).forEach((line, li) => {
      ctx.fillText(line, textX, cardY + 162 + li * 32);
    });

    // Decorative pulse circle (right side)
    const pulseR = 28 + 8 * Math.sin(Date.now() / 500 + i);
    ctx.beginPath();
    ctx.arc(cardX + cardW - 70, cardY + cardH / 2, pulseR, 0, Math.PI * 2);
    ctx.strokeStyle = hex2rgba(theme.accent2, 0.4);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Rotating triangle
    ctx.save();
    ctx.translate(cardX + cardW - 70, cardY + cardH / 2);
    const rot = (Date.now() / 2000 + i) % (Math.PI * 2);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(16, 12);
    ctx.lineTo(-16, 12);
    ctx.closePath();
    ctx.strokeStyle = hex2rgba(theme.accent2, 0.5);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Entry decoration lines (top-left corner of card)
    if (t > 0.5) {
      const lineT = clamp((t - 0.5) / 0.5, 0, 1);
      ctx.strokeStyle = hex2rgba(theme.accent, 0.6);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cardX + 20, cardY + 12);
      ctx.lineTo(cardX + 20 + 60 * lineT, cardY + 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cardX + 20, cardY + 12);
      ctx.lineTo(cardX + 20, cardY + 12 + 40 * lineT);
      ctx.stroke();
    }

    ctx.restore();
  });
}

// ─── Outro ─────────────────────────────────────────────────────────────────────
function drawOutro(
  ctx: CanvasRenderingContext2D,
  outroElapsed: number,
  content: GeneratedContent,
  theme: ThemeConfig,
) {
  // Overlay
  const overlayAlpha = clamp(outroElapsed / 800, 0, 0.65);
  ctx.fillStyle = hex2rgba(theme.accent, overlayAlpha * 0.15);
  ctx.fillRect(0, 0, CW, CH);

  // Re-show title
  const titleAlpha = clamp((outroElapsed - 300) / 600, 0, 1);
  if (titleAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = titleAlpha;
    ctx.shadowColor = hex2rgba(theme.accent, 0.8);
    ctx.shadowBlur = 40;
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 64px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(content.title, CW / 2, CH / 2 - 60);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = `300 28px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('— 小福AI自由 —', CW / 2, CH / 2 + 30);
    ctx.restore();
  }
}

// ─── Watermark ─────────────────────────────────────────────────────────────────
function drawWatermark(ctx: CanvasRenderingContext2D, theme: ThemeConfig) {
  ctx.save();
  ctx.fillStyle = hex2rgba(theme.accent, 0.25);
  ctx.font = `400 22px "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('@小福AI自由', CW - 40, CH - 50);
  ctx.restore();
}

// ─── Public Engine ─────────────────────────────────────────────────────────────
export interface AnimEngine {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
  getTotalMs: () => number;
}

export async function createAnimEngine(
  canvas: HTMLCanvasElement,
  content: GeneratedContent,
  style: StyleType,
  coverIndex: number,
  chineseOptions?: ChineseOptions,
  onComplete?: () => void,
): Promise<AnimEngine> {
  const theme = getThemeConfig(style, chineseOptions);
  const particles = createParticles(40);

  // Determine shape id
  const shapeList = style === 'chinese' ? CHINESE_SHAPES
    : style === 'city' ? CITY_SHAPES : AI_SHAPES;
  const shapeId = shapeList[coverIndex % shapeList.length]?.id ?? shapeList[0].id;

  // Color for shape
  const shapeColor = style === 'chinese'
    ? (chineseOptions?.colorScheme === 'ink' ? '#c0c0c0' : theme.accent)
    : style === 'city' ? '#f5d87a' : theme.accent;

  const lineWidth = style === 'chinese' ? (chineseOptions?.lineWidth ?? 1.5) : 1.5;

  // Preload shape image
  const shapeImg = await loadShapeImage(style, shapeId, shapeColor, lineWidth);

  const ctx = canvas.getContext('2d')!;
  let rafId = 0;
  let startTime = 0;
  let running = false;
  const total = getTotalDuration(content);

  function render(elapsed: number) {
    ctx.clearRect(0, 0, CW, CH);

    // Background (always)
    drawBackground(ctx, elapsed, theme, particles);

    // Shape decoration
    drawShapeDecoration(ctx, elapsed, shapeImg, theme, style);

    // Title
    if (elapsed > 300) {
      drawTitle(ctx, elapsed, content, theme);
    }

    // Cards
    const titleMoveEnd = getTitleMoveDuration(content) + 200;
    if (elapsed > titleMoveEnd) {
      drawCards(ctx, elapsed - titleMoveEnd, content.points, theme);
    }

    // Outro
    const cardsDone = titleMoveEnd + content.points.length * 2400 + 200;
    if (elapsed > cardsDone) {
      drawOutro(ctx, elapsed - cardsDone, content, theme);
    }

    // Watermark
    drawWatermark(ctx, theme);
  }

  function tick(now: number) {
    if (!running) return;
    const elapsed = now - startTime;
    render(elapsed);
    if (elapsed < total) {
      rafId = requestAnimationFrame(tick);
    } else {
      running = false;
      render(total);
      onComplete?.();
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
      startTime = performance.now();
      rafId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
    isRunning: () => running,
    getTotalMs: () => total,
  };
}
