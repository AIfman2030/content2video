import { DEFAULT_WARNING_OPTIONS, type GeneratedContent, type WarningOptions } from '../../types/video';
import { CH, CW, clamp, easeOutCubic, lerp, wrapText } from './helpers';
import { parseWarningTitle } from '../warningTitle';

const FONT = '"Noto Sans SC", "PingFang SC", sans-serif';
const INTRO_MS = 2700;
const SCENE_MS = 3000;
const OUTRO_MS = 600;

const INTRO_DROP_START = 420;
const INTRO_DROP_LAND = 1080;
const INTRO_TOP_FLY_START = 1720;
const INTRO_TOP_FLY_END = 2200;
const INTRO_BOTTOM_FLY_START = 2020;
const INTRO_BOTTOM_FLY_END = 2550;

const SMOKE_PUFFS = Array.from({ length: 76 }, (_, index) => {
  const seed = Math.sin((index + 1) * 91.37) * 43758.5453;
  const random = seed - Math.floor(seed);
  const side = index % 2 === 0 ? -1 : 1;
  return {
    x: side * (18 + random * 430),
    y: -28 + ((index * 37) % 72),
    driftX: side * (150 + ((index * 29) % 260)),
    driftY: 55 + ((index * 43) % 180),
    size: 24 + ((index * 17) % 54),
    alpha: 0.4 + ((index * 13) % 30) / 100,
  };
});

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

function drawPinnedTitle(
  ctx: CanvasRenderingContext2D,
  content: GeneratedContent,
  options: WarningOptions,
  y: number,
  alpha = 1,
) {
  const { top, bottom } = warningTitles(content, options);
  const layout = pinnedTitleLayout(ctx, top, bottom, options);
  const maxWidth = 1500;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 20;
  ctx.shadowColor = options.titleTopColor;
  ctx.font = `900 ${layout.topSize}px ${FONT}`;
  ctx.fillStyle = textFill(ctx, options.titleTopColor, options.titleTopColorEnd, maxWidth);
  ctx.fillText(top, layout.topX, y);
  ctx.shadowColor = options.titleBottomColor;
  ctx.font = `900 ${layout.bottomSize}px ${FONT}`;
  ctx.fillStyle = textFill(ctx, options.titleBottomColor, options.titleBottomColorEnd, maxWidth);
  ctx.fillText(bottom, layout.bottomX, y);
  ctx.restore();
}

function pinnedTitleLayout(ctx: CanvasRenderingContext2D, top: string, bottom: string, options: WarningOptions) {
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
  ctx.restore();
  const topX = (CW - topWidth - gap - bottomWidth) / 2;
  return { topSize, bottomSize, topWidth, bottomWidth, topX, bottomX: topX + topWidth + gap };
}

function drawLandingSmoke(ctx: CanvasRenderingContext2D, y: number, progress: number) {
  if (progress <= 0 || progress >= 1) return;
  const eased = easeOutCubic(progress);
  ctx.save();
  for (const puff of SMOKE_PUFFS) {
    const x = CW / 2 + puff.x + puff.driftX * eased;
    const py = y + puff.y - puff.driftY * eased;
    const radius = puff.size * (0.7 + eased * 1.9);
    const alpha = puff.alpha * (1 - progress) * (1 - progress * 0.35);
    const haze = ctx.createRadialGradient(x, py, 0, x, py, radius);
    haze.addColorStop(0, `rgba(255,255,255,${alpha})`);
    haze.addColorStop(0.55, `rgba(238,241,245,${alpha * 0.65})`);
    haze.addColorStop(1, 'rgba(220,225,232,0)');
    ctx.fillStyle = haze;
    ctx.beginPath();
    ctx.arc(x, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawImpactExplosion(ctx: CanvasRenderingContext2D, y: number, progress: number) {
  if (progress <= 0 || progress >= 1) return;
  const burst = easeOutCubic(progress);
  const fade = 1 - progress;
  ctx.save();
  const flash = ctx.createRadialGradient(CW / 2, y, 0, CW / 2, y, 420 * burst);
  flash.addColorStop(0, `rgba(255,255,255,${0.72 * fade})`);
  flash.addColorStop(0.18, `rgba(255,239,181,${0.48 * fade})`);
  flash.addColorStop(1, 'rgba(244,220,112,0)');
  ctx.fillStyle = flash;
  ctx.fillRect(CW / 2 - 520, y - 360, 1040, 720);

  for (let ring = 0; ring < 3; ring += 1) {
    const ringT = clamp(progress - ring * 0.09, 0, 1);
    if (!ringT) continue;
    ctx.globalAlpha = (1 - ringT) * 0.75;
    ctx.strokeStyle = ring === 0 ? '#ffffff' : '#f4dc70';
    ctx.lineWidth = Math.max(2, 12 * (1 - ringT));
    ctx.beginPath();
    ctx.ellipse(CW / 2, y + 28, 650 * ringT, 120 * ringT, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.lineCap = 'round';
  for (let index = 0; index < 28; index += 1) {
    const angle = -Math.PI * 0.92 + (index / 27) * Math.PI * 0.84;
    const inner = 110 + (index % 4) * 18;
    const outer = inner + burst * (190 + (index % 7) * 34);
    ctx.globalAlpha = fade * (0.48 + (index % 3) * 0.17);
    ctx.strokeStyle = index % 3 === 0 ? '#ffffff' : '#f4dc70';
    ctx.lineWidth = index % 4 === 0 ? 7 : 3;
    ctx.beginPath();
    ctx.moveTo(CW / 2 + Math.cos(angle) * inner, y + Math.sin(angle) * inner * 0.35);
    ctx.lineTo(CW / 2 + Math.cos(angle) * outer, y + Math.sin(angle) * outer * 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawIntroTitleLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  preferredSize: number,
  color: string,
  colorEnd: string,
  alpha = 1,
  scaleY = 1,
) {
  const maxWidth = 1500;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(CW / 2, y);
  ctx.scale(1, scaleY);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 24;
  ctx.shadowColor = color;
  ctx.font = `900 ${fitFont(ctx, text, maxWidth, preferredSize, 46, 900)}px ${FONT}`;
  ctx.fillStyle = textFill(ctx, color, colorEnd, maxWidth);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawIntro(ctx: CanvasRenderingContext2D, elapsed: number, content: GeneratedContent, options: WarningOptions) {
  const { top, bottom } = warningTitles(content, options);
  const topFly = easeOutCubic(clamp((elapsed - INTRO_TOP_FLY_START) / (INTRO_TOP_FLY_END - INTRO_TOP_FLY_START), 0, 1));
  const bottomFly = easeOutCubic(clamp((elapsed - INTRO_BOTTOM_FLY_START) / (INTRO_BOTTOM_FLY_END - INTRO_BOTTOM_FLY_START), 0, 1));
  const drop = easeOutCubic(clamp((elapsed - INTRO_DROP_START) / (INTRO_DROP_LAND - INTRO_DROP_START), 0, 1));
  const impactElapsed = elapsed - INTRO_DROP_LAND;
  const impact = clamp(impactElapsed / 190, 0, 1);
  const settle = clamp((impactElapsed - 190) / 260, 0, 1);
  const bounceOffset = impactElapsed >= 0 && impactElapsed < 450
    ? -Math.sin((impactElapsed / 450) * Math.PI) * 18 * (1 - impactElapsed / 450)
    : 0;
  const shake = impactElapsed >= 0 && impactElapsed < 260
    ? Math.sin(impactElapsed * 0.12) * 7 * (1 - impactElapsed / 260)
    : 0;
  const bottomY = elapsed < INTRO_DROP_START
    ? -260
    : lerp(-260, 610, drop) + bounceOffset;
  const squash = impactElapsed >= 0 && impactElapsed < 450
    ? lerp(0.8, 1, settle) + Math.sin(impact * Math.PI) * 0.08
    : 1;
  const layout = pinnedTitleLayout(ctx, top, bottom, options);
  const topIntroSize = Math.max(options.titleTopFontSize, 154);
  const bottomIntroSize = Math.max(options.titleBottomFontSize, 126);
  const topSize = lerp(topIntroSize, layout.topSize, topFly);
  const bottomSize = lerp(bottomIntroSize, layout.bottomSize, bottomFly);
  const topX = lerp(CW / 2, layout.topX + layout.topWidth / 2, topFly);
  const topY = lerp(370, 105, topFly);
  const movingBottomY = lerp(bottomY, 105, bottomFly);
  const bottomX = lerp(CW / 2, layout.bottomX + layout.bottomWidth / 2, bottomFly);

  drawImpactExplosion(ctx, 645, clamp(impactElapsed / 620, 0, 1));
  drawLandingSmoke(ctx, 660, clamp(impactElapsed / 1050, 0, 1));

  ctx.save();
  ctx.translate(shake, impactElapsed >= 0 ? Math.abs(shake) * 0.25 : 0);
  ctx.translate(topX - CW / 2, 0);
  drawIntroTitleLine(ctx, top, topY, topSize, options.titleTopColor, options.titleTopColorEnd);
  ctx.restore();
  ctx.save();
  ctx.translate(bottomX - CW / 2 + shake, impactElapsed >= 0 ? Math.abs(shake) * 0.25 : 0);
  drawIntroTitleLine(ctx, bottom, movingBottomY, bottomSize, options.titleBottomColor, options.titleBottomColorEnd, drop, bottomFly > 0 ? 1 : squash);
  ctx.restore();
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
