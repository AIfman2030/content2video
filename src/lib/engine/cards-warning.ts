import { DEFAULT_WARNING_OPTIONS, type GeneratedContent, type WarningOptions } from '../../types/video';
import { CH, CW, clamp, easeOutCubic, lerp, wrapText } from './helpers';
import { parseWarningTitle } from '../warningTitle';

const FONT = '"Noto Sans SC", "PingFang SC", sans-serif';
const INTRO_MS = 2700;
const SCENE_MS = 3000;
const OUTRO_MS = 600;

export function warningTotalMs(pointCount: number): number {
  return INTRO_MS + Math.max(1, pointCount) * SCENE_MS + OUTRO_MS;
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, preferred: number, min: number, weight: number) {
  let size = preferred;
  while (size > min) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function textFill(ctx: CanvasRenderingContext2D, start: string, end: string, maxWidth: number) {
  if (!end) return start;
  const gradient = ctx.createLinearGradient(CW / 2 - maxWidth / 2, 0, CW / 2 + maxWidth / 2, 0);
  gradient.addColorStop(0, start);
  gradient.addColorStop(1, end);
  return gradient;
}

function warningTitles(content: GeneratedContent, options: WarningOptions) {
  const parsed = parseWarningTitle(content.title);
  return {
    top: options.titleTopText.trim() || parsed.kicker,
    bottom: options.titleBottomText.trim() || parsed.headline,
  };
}

function drawBackground(ctx: CanvasRenderingContext2D, elapsed: number) {
  ctx.fillStyle = '#050504';
  ctx.fillRect(0, 0, CW, CH);
  const glow = ctx.createRadialGradient(CW / 2, CH / 2, 70, CW / 2, CH / 2, 980);
  glow.addColorStop(0, 'rgba(0,0,0,0.98)');
  glow.addColorStop(0.42, 'rgba(11,10,4,0.95)');
  glow.addColorStop(1, 'rgba(103,92,29,0.48)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CW, CH);

  ctx.save();
  ctx.translate(CW / 2, CH / 2);
  ctx.strokeStyle = 'rgba(244,220,112,0.095)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 42; i += 1) {
    const angle = i * Math.PI * 2 / 42 + Math.sin(elapsed / 3500) * 0.018;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * 1050, Math.sin(angle) * 650);
    ctx.stroke();
  }
  ctx.restore();
}

function drawOrbit(ctx: CanvasRenderingContext2D, index: number, local: number) {
  const cx = 1490;
  const cy = 590;
  const motion = local / 1000;
  ctx.save();
  ctx.strokeStyle = 'rgba(244,220,112,0.52)';
  ctx.fillStyle = '#f4dc70';
  ctx.lineWidth = 2;
  const rings = index % 3 === 1 ? [62, 104, 148] : [112, 168];
  rings.forEach((radius, ringIndex) => {
    ctx.globalAlpha = 0.36 + ringIndex * 0.15;
    ctx.setLineDash(ringIndex === rings.length - 1 ? [8, 9] : []);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.setLineDash([]);
  const nodes = index % 3 === 0 ? 2 : index % 3 === 1 ? 1 : 3;
  for (let i = 0; i < nodes; i += 1) {
    const radius = rings[Math.min(i, rings.length - 1)];
    const angle = motion * (0.55 + i * 0.16) + i * 2.1;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    ctx.globalAlpha = 0.35 + i * 0.25;
    ctx.beginPath(); ctx.arc(x, y, 10 + i * 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowColor = '#f4dc70';
  ctx.shadowBlur = 28;
  ctx.beginPath(); ctx.arc(cx, cy, 25, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawTitleBlock(
  ctx: CanvasRenderingContext2D,
  content: GeneratedContent,
  options: WarningOptions,
  topY: number,
  bottomY: number,
  topSize: number,
  bottomSize: number,
  alpha = 1,
) {
  const { top, bottom } = warningTitles(content, options);
  const maxWidth = 1500;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 22;
  ctx.shadowColor = options.titleTopColor;
  ctx.font = `900 ${fitFont(ctx, top, maxWidth, topSize, 54, 900)}px ${FONT}`;
  ctx.fillStyle = textFill(ctx, options.titleTopColor, options.titleTopColorEnd, maxWidth);
  ctx.fillText(top, CW / 2, topY);
  ctx.shadowColor = options.titleBottomColor;
  ctx.font = `900 ${fitFont(ctx, bottom, maxWidth, bottomSize, 46, 900)}px ${FONT}`;
  ctx.fillStyle = textFill(ctx, options.titleBottomColor, options.titleBottomColorEnd, maxWidth);
  ctx.fillText(bottom, CW / 2, bottomY);
  ctx.restore();
}

function drawPinnedTitle(
  ctx: CanvasRenderingContext2D,
  content: GeneratedContent,
  options: WarningOptions,
  y: number,
  alpha = 1,
) {
  const { top, bottom } = warningTitles(content, options);
  const maxWidth = 1500;
  const gap = 34;
  let topSize = options.titleTopFontSize;
  let bottomSize = options.titleBottomFontSize;

  ctx.save();
  ctx.font = `900 ${topSize}px ${FONT}`;
  const initialTopWidth = ctx.measureText(top).width;
  ctx.font = `900 ${bottomSize}px ${FONT}`;
  const initialBottomWidth = ctx.measureText(bottom).width;
  const scale = Math.min(1, maxWidth / (initialTopWidth + gap + initialBottomWidth));
  topSize = Math.max(54, Math.round(topSize * scale));
  bottomSize = Math.max(46, Math.round(bottomSize * scale));

  ctx.font = `900 ${topSize}px ${FONT}`;
  const topWidth = ctx.measureText(top).width;
  ctx.font = `900 ${bottomSize}px ${FONT}`;
  const bottomWidth = ctx.measureText(bottom).width;
  const startX = (CW - topWidth - gap - bottomWidth) / 2;

  ctx.globalAlpha = alpha;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 20;
  ctx.shadowColor = options.titleTopColor;
  ctx.font = `900 ${topSize}px ${FONT}`;
  ctx.fillStyle = textFill(ctx, options.titleTopColor, options.titleTopColorEnd, maxWidth);
  ctx.fillText(top, startX, y);
  ctx.shadowColor = options.titleBottomColor;
  ctx.font = `900 ${bottomSize}px ${FONT}`;
  ctx.fillStyle = textFill(ctx, options.titleBottomColor, options.titleBottomColorEnd, maxWidth);
  ctx.fillText(bottom, startX + topWidth + gap, y);
  ctx.restore();
}

function drawIntro(ctx: CanvasRenderingContext2D, elapsed: number, content: GeneratedContent, options: WarningOptions) {
  const enter = easeOutCubic(clamp((elapsed - 250) / 700, 0, 1));
  const fly = easeOutCubic(clamp((elapsed - 1450) / 900, 0, 1));
  drawTitleBlock(
    ctx,
    content,
    options,
    lerp(420, 230, fly),
    lerp(585, 300, fly),
    lerp(Math.max(options.titleTopFontSize, 154), options.titleTopFontSize, fly),
    lerp(Math.max(options.titleBottomFontSize, 126), options.titleBottomFontSize, fly),
    enter * (1 - fly),
  );
  drawPinnedTitle(ctx, content, options, lerp(500, 105, fly), enter * fly);
}

function drawPage(ctx: CanvasRenderingContext2D, content: GeneratedContent, index: number, local: number, options: WarningOptions) {
  const point = content.points[index];
  const enter = easeOutCubic(clamp(local / 430, 0, 1));
  const exit = 1 - clamp((local - (SCENE_MS - 350)) / 350, 0, 1);
  ctx.save();
  ctx.globalAlpha = enter * exit;
  ctx.translate(lerp(-42, 0, enter), 0);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const label = `${index + 1}. ${point.label}`;
  ctx.font = `800 ${fitFont(ctx, label, 940, options.labelFontSize, 58, 800)}px ${FONT}`;
  ctx.fillStyle = '#f4dc70';
  ctx.shadowColor = 'rgba(244,220,112,0.52)';
  ctx.shadowBlur = 18;
  ctx.fillText(label, 300, 385);
  ctx.shadowBlur = 0;

  ctx.font = `700 ${fitFont(ctx, point.short, 940, options.shortFontSize, 42, 700)}px ${FONT}`;
  ctx.fillStyle = '#ff9d18';
  ctx.fillText(point.short, 300, 575);

  ctx.font = `500 ${options.descFontSize}px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  const lines = wrapText(ctx, point.desc, 940).slice(0, 2);
  lines.forEach((line, lineIndex) => ctx.fillText(line, 300, 720 + lineIndex * (options.descFontSize + 18)));
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = enter * exit;
  drawOrbit(ctx, index, local);
  ctx.restore();

  const dotY = 1040;
  const gap = 32;
  const startX = CW / 2 - (content.points.length - 1) * gap / 2;
  content.points.forEach((_, dotIndex) => {
    ctx.fillStyle = dotIndex === index ? '#f4dc70' : 'rgba(255,255,255,0.2)';
    ctx.beginPath(); ctx.arc(startX + dotIndex * gap, dotY, dotIndex === index ? 7 : 4, 0, Math.PI * 2); ctx.fill();
  });
}

export function drawWarningScene(ctx: CanvasRenderingContext2D, elapsed: number, content: GeneratedContent, warningOptions?: WarningOptions) {
  const options = { ...DEFAULT_WARNING_OPTIONS, ...warningOptions };
  drawBackground(ctx, elapsed);
  if (elapsed < INTRO_MS) {
    drawIntro(ctx, elapsed, content, options);
    return;
  }
  drawPinnedTitle(ctx, content, options, 105);
  const timeline = elapsed - INTRO_MS;
  const index = Math.min(content.points.length - 1, Math.floor(timeline / SCENE_MS));
  if (index >= 0 && content.points[index]) drawPage(ctx, content, index, timeline - index * SCENE_MS, options);
}
