import type { ContentPoint, GeneratedContent } from '../../types/video';
import { CH, CW, T, clamp, easeOutBack, easeOutCubic, lerp, roundRect, wrapText } from './helpers';
import { KNOWLEDGE_OUTRO_MS } from './cards-city';

const FONT = '"Noto Sans SC", "PingFang SC", sans-serif';
const SCENE_MS = 5200;
const ENTER_MS = 520;
const EXIT_MS = 420;
const LEFT_X = 96;
const LEFT_W = 900;
const GRAPHIC_CX = 1450;
const GRAPHIC_CY = 555;
const GRAPHIC_SCALE = 0.72;

type GraphicKind =
  | 'orbit'
  | 'flow'
  | 'growth'
  | 'compare'
  | 'network'
  | 'layers'
  | 'target'
  | 'shield'
  | 'hourglass'
  | 'funnel'
  | 'code'
  | 'dialogue';

export function semanticTotalMs(pointCount: number): number {
  return T.cardBase + Math.max(1, pointCount) * SCENE_MS + KNOWLEDGE_OUTRO_MS;
}

function graphicKind(point: ContentPoint): GraphicKind {
  const text = `${point.label} ${point.short} ${point.desc}`;
  if (/(循环|复盘|迭代|周期|持续)/.test(text)) return 'orbit';
  if (/(安全|风险|保护|隐私|权限|防止|控制)/.test(text)) return 'shield';
  if (/(时间|等待|时长|速度|快速|节省)/.test(text)) return 'hourglass';
  if (/(筛选|过滤|聚焦|提炼|收敛|挑选)/.test(text)) return 'funnel';
  if (/(代码|编程|提示词|插件|工具|API|安装)/i.test(text)) return 'code';
  if (/(沟通|表达|对话|语音|配音|输入|输出)/.test(text)) return 'dialogue';
  if (/(步骤|流程|先|然后|最后|安装|输入|输出)/.test(text)) return 'flow';
  if (/(提升|增长|效率|进阶|升级|积累)/.test(text)) return 'growth';
  if (/(对比|选择|区别|权衡|优劣|还是)/.test(text)) return 'compare';
  if (/(连接|协作|智能体|系统|团队|网络)/.test(text)) return 'network';
  if (/(层|基础|结构|框架|模型|金字塔)/.test(text)) return 'layers';
  const fallbackKinds: GraphicKind[] = ['target', 'layers', 'network', 'dialogue', 'compare', 'growth'];
  const hash = [...text].reduce((value, char) => ((value * 31) + char.charCodeAt(0)) >>> 0, 7);
  return fallbackKinds[hash % fallbackKinds.length];
}

function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  preferred: number,
  min: number,
  weight = 800,
): number {
  let size = preferred;
  while (size > min) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function reveal(ctx: CanvasRenderingContext2D, delay: number, elapsed: number, offset = 34): number {
  const progress = easeOutCubic(clamp((elapsed - delay) / 460, 0, 1));
  ctx.globalAlpha *= progress;
  ctx.translate(0, (1 - progress) * offset);
  return progress;
}

function drawTextBlock(
  ctx: CanvasRenderingContext2D,
  point: ContentPoint,
  index: number,
  local: number,
  accent: string,
) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  ctx.save();
  reveal(ctx, 80, local, 18);
  ctx.fillStyle = accent;
  ctx.font = `500 72px ${FONT}`;
  ctx.fillText(`${index + 1}.`, LEFT_X, 288);
  const labelX = LEFT_X + 126;
  const labelSize = fitFont(ctx, point.label, LEFT_W - 126, 104, 58, 900);
  ctx.font = `900 ${labelSize}px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(point.label, labelX, 288);
  ctx.restore();

  ctx.save();
  reveal(ctx, 520, local);
  const shortSize = fitFont(ctx, point.short, LEFT_W, 64, 38, 700);
  ctx.font = `700 ${shortSize}px ${FONT}`;
  ctx.fillStyle = '#ff941a';
  ctx.fillText(point.short, LEFT_X, 535);
  ctx.restore();

  ctx.save();
  reveal(ctx, 1380, local);
  ctx.font = `500 37px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  const sourceLines = point.desc.split(/\n+/).map(line => line.trim()).filter(Boolean);
  const lines = sourceLines.flatMap(line => wrapText(ctx, line, LEFT_W)).slice(0, 5);
  const startY = 720 - Math.max(0, lines.length - 2) * 12;
  lines.forEach((line, lineIndex) => ctx.fillText(line, LEFT_X, startY + lineIndex * 58));
  ctx.restore();

  ctx.restore();
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, progress: number) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(lerp(x1, x2, progress), lerp(y1, y2, progress));
  ctx.stroke();
}

function node(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, accent: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = '#081a2f';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(x, y, radius * 0.28, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function diamond(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, accent: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#081a2f';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.strokeRect(-size / 2, -size / 2, size, size);
  ctx.fillStyle = accent;
  ctx.fillRect(-size * 0.12, -size * 0.12, size * 0.24, size * 0.24);
  ctx.restore();
}

function drawGraphic(ctx: CanvasRenderingContext2D, point: ContentPoint, local: number, accent: string) {
  const enter = easeOutBack(Math.min(clamp((local - 780) / 680, 0, 1), 0.999));
  if (enter <= 0) return;
  const motion = Math.max(0, local - 1000) / 1000;
  const kind = graphicKind(point);

  ctx.save();
  ctx.translate(GRAPHIC_CX, GRAPHIC_CY);
  ctx.scale(enter * GRAPHIC_SCALE, enter * GRAPHIC_SCALE);
  ctx.translate(-GRAPHIC_CX, -GRAPHIC_CY);
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (kind === 'orbit') {
    ctx.save();
    ctx.translate(GRAPHIC_CX, GRAPHIC_CY);
    ctx.rotate(-0.22);
    ctx.globalAlpha = 0.42;
    ctx.beginPath(); ctx.ellipse(0, 0, 285, 150, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, 175, 88, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    diamond(ctx, GRAPHIC_CX, GRAPHIC_CY, 82, accent);
    for (let i = 0; i < 3; i++) {
      const angle = motion * (0.7 + i * 0.14) + i * Math.PI * 0.66;
      diamond(ctx, GRAPHIC_CX + Math.cos(angle) * (175 + i * 38), GRAPHIC_CY + Math.sin(angle) * (92 + i * 22), 28, accent, 0.9);
    }
  } else if (kind === 'target') {
    const sweep = (motion * 0.75) % 1;
    const half = 230;
    ctx.globalAlpha = 0.38;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      line(ctx, GRAPHIC_CX + sx * half, GRAPHIC_CY + sy * half, GRAPHIC_CX + sx * (half - 86), GRAPHIC_CY + sy * half, 1);
      line(ctx, GRAPHIC_CX + sx * half, GRAPHIC_CY + sy * half, GRAPHIC_CX + sx * half, GRAPHIC_CY + sy * (half - 86), 1);
    }
    ctx.globalAlpha = 1;
    diamond(ctx, GRAPHIC_CX, GRAPHIC_CY, 104, accent);
    const pointerX = lerp(GRAPHIC_CX - 190, GRAPHIC_CX, easeOutCubic(sweep));
    const pointerY = lerp(GRAPHIC_CY + 170, GRAPHIC_CY, easeOutCubic(sweep));
    ctx.beginPath(); ctx.moveTo(pointerX - 48, pointerY + 48); ctx.lineTo(pointerX, pointerY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pointerX - 25, pointerY - 5); ctx.lineTo(pointerX, pointerY); ctx.lineTo(pointerX + 5, pointerY + 25); ctx.stroke();
  } else if (kind === 'flow') {
    const points = [-250, -82, 86, 254].map(x => ({ x: GRAPHIC_CX + x, y: GRAPHIC_CY + Math.sin((x + 250) / 110 + motion) * 58 }));
    const progress = clamp((local - 1000) / 1250, 0, 1);
    for (let i = 0; i < points.length - 1; i++) {
      const segment = clamp(progress * 3 - i, 0, 1);
      line(ctx, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, segment);
    }
    points.forEach((p, i) => diamond(ctx, p.x, p.y, 48, accent, clamp(progress * 4 - i + 0.4, 0, 1)));
  } else if (kind === 'growth') {
    const heights = [120, 210, 315, 410];
    heights.forEach((height, i) => {
      const barProgress = easeOutCubic(clamp((local - 900 - i * 180) / 620, 0, 1));
      const h = height * barProgress;
      const x = GRAPHIC_CX - 260 + i * 150;
      ctx.globalAlpha = 0.45 + i * 0.14;
      ctx.fillRect(x, GRAPHIC_CY + 220 - h, 82, h);
    });
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.moveTo(GRAPHIC_CX - 250, GRAPHIC_CY + 85); ctx.lineTo(GRAPHIC_CX + 260, GRAPHIC_CY - 230); ctx.stroke();
  } else if (kind === 'compare') {
    const sway = Math.sin(motion * 2.3) * 0.04;
    ctx.save(); ctx.translate(GRAPHIC_CX, GRAPHIC_CY); ctx.rotate(sway); ctx.translate(-GRAPHIC_CX, -GRAPHIC_CY);
    line(ctx, GRAPHIC_CX - 245, GRAPHIC_CY - 35, GRAPHIC_CX + 245, GRAPHIC_CY - 35, 1);
    line(ctx, GRAPHIC_CX, GRAPHIC_CY - 35, GRAPHIC_CX, GRAPHIC_CY + 235, 1);
    for (const side of [-1, 1]) {
      const x = GRAPHIC_CX + side * 205;
      line(ctx, x, GRAPHIC_CY - 35, x, GRAPHIC_CY + 90, 1);
      ctx.globalAlpha = 0.45;
      ctx.beginPath(); ctx.arc(x, GRAPHIC_CY + 115, 92, 0, Math.PI); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  } else if (kind === 'network') {
    const points = Array.from({ length: 7 }, (_, i) => {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / 7 + motion * 0.08;
      return { x: GRAPHIC_CX + Math.cos(angle) * 240, y: GRAPHIC_CY + Math.sin(angle) * 210 };
    });
    points.forEach((p, i) => {
      line(ctx, GRAPHIC_CX, GRAPHIC_CY, p.x, p.y, clamp((local - 920 - i * 100) / 650, 0, 1));
      diamond(ctx, p.x, p.y, 38, accent);
    });
    diamond(ctx, GRAPHIC_CX, GRAPHIC_CY, 92, accent);
  } else if (kind === 'layers') {
    for (let i = 0; i < 4; i++) {
      const progress = easeOutBack(Math.min(clamp((local - 880 - i * 170) / 560, 0, 1), 0.999));
      const width = 490 - i * 76;
      const y = GRAPHIC_CY + 205 - i * 118;
      ctx.globalAlpha = 0.26 + i * 0.14;
      roundRect(ctx, GRAPHIC_CX - width / 2, y - 42 * progress, width, 84 * progress, 18);
      ctx.fill(); ctx.stroke();
    }
  } else if (kind === 'shield') {
    const pulse = 1 + Math.sin(motion * 2.4) * 0.025;
    ctx.save(); ctx.translate(GRAPHIC_CX, GRAPHIC_CY); ctx.scale(pulse, pulse); ctx.translate(-GRAPHIC_CX, -GRAPHIC_CY);
    ctx.beginPath();
    ctx.moveTo(GRAPHIC_CX, GRAPHIC_CY - 245);
    ctx.lineTo(GRAPHIC_CX + 205, GRAPHIC_CY - 155);
    ctx.lineTo(GRAPHIC_CX + 170, GRAPHIC_CY + 105);
    ctx.quadraticCurveTo(GRAPHIC_CX, GRAPHIC_CY + 280, GRAPHIC_CX, GRAPHIC_CY + 280);
    ctx.quadraticCurveTo(GRAPHIC_CX - 170, GRAPHIC_CY + 105, GRAPHIC_CX - 205, GRAPHIC_CY - 155);
    ctx.closePath(); ctx.globalAlpha = 0.24; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(GRAPHIC_CX - 95, GRAPHIC_CY + 5); ctx.lineTo(GRAPHIC_CX - 22, GRAPHIC_CY + 78); ctx.lineTo(GRAPHIC_CX + 120, GRAPHIC_CY - 82); ctx.stroke();
    ctx.restore();
  } else if (kind === 'hourglass') {
    const sand = (Math.sin(motion * 1.4) + 1) / 2;
    line(ctx, GRAPHIC_CX - 180, GRAPHIC_CY - 235, GRAPHIC_CX + 180, GRAPHIC_CY - 235, 1);
    line(ctx, GRAPHIC_CX - 180, GRAPHIC_CY + 235, GRAPHIC_CX + 180, GRAPHIC_CY + 235, 1);
    ctx.beginPath();
    ctx.moveTo(GRAPHIC_CX - 145, GRAPHIC_CY - 210); ctx.quadraticCurveTo(GRAPHIC_CX - 120, GRAPHIC_CY - 55, GRAPHIC_CX, GRAPHIC_CY);
    ctx.quadraticCurveTo(GRAPHIC_CX + 120, GRAPHIC_CY + 55, GRAPHIC_CX + 145, GRAPHIC_CY + 210);
    ctx.moveTo(GRAPHIC_CX + 145, GRAPHIC_CY - 210); ctx.quadraticCurveTo(GRAPHIC_CX + 120, GRAPHIC_CY - 55, GRAPHIC_CX, GRAPHIC_CY);
    ctx.quadraticCurveTo(GRAPHIC_CX - 120, GRAPHIC_CY + 55, GRAPHIC_CX - 145, GRAPHIC_CY + 210);
    ctx.stroke();
    ctx.globalAlpha = 0.52;
    ctx.beginPath(); ctx.moveTo(GRAPHIC_CX - 110, GRAPHIC_CY + 185); ctx.lineTo(GRAPHIC_CX + 110, GRAPHIC_CY + 185); ctx.lineTo(GRAPHIC_CX, GRAPHIC_CY + 20 + sand * 55); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1; line(ctx, GRAPHIC_CX, GRAPHIC_CY - 22, GRAPHIC_CX, GRAPHIC_CY + 110, sand);
  } else if (kind === 'funnel') {
    ctx.beginPath();
    ctx.moveTo(GRAPHIC_CX - 260, GRAPHIC_CY - 210); ctx.lineTo(GRAPHIC_CX + 260, GRAPHIC_CY - 210);
    ctx.lineTo(GRAPHIC_CX + 82, GRAPHIC_CY + 35); ctx.lineTo(GRAPHIC_CX + 82, GRAPHIC_CY + 215);
    ctx.lineTo(GRAPHIC_CX - 82, GRAPHIC_CY + 215); ctx.lineTo(GRAPHIC_CX - 82, GRAPHIC_CY + 35); ctx.closePath();
    ctx.globalAlpha = 0.18; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const drop = (motion * 80 + i * 71) % 300;
      diamond(ctx, GRAPHIC_CX - 205 + i * 82, GRAPHIC_CY - 265 + drop * 0.42, 22, accent, 0.72);
    }
  } else if (kind === 'code') {
    const cursor = clamp((local - 1150) / 1200, 0, 1);
    ctx.globalAlpha = 0.32;
    roundRect(ctx, GRAPHIC_CX - 265, GRAPHIC_CY - 205, 530, 410, 24); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.moveTo(GRAPHIC_CX - 115, GRAPHIC_CY - 90); ctx.lineTo(GRAPHIC_CX - 205, GRAPHIC_CY); ctx.lineTo(GRAPHIC_CX - 115, GRAPHIC_CY + 90); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(GRAPHIC_CX + 115, GRAPHIC_CY - 90); ctx.lineTo(GRAPHIC_CX + 205, GRAPHIC_CY); ctx.lineTo(GRAPHIC_CX + 115, GRAPHIC_CY + 90); ctx.stroke();
    line(ctx, GRAPHIC_CX + 55, GRAPHIC_CY - 135, GRAPHIC_CX - 55, GRAPHIC_CY + 135, cursor);
  } else if (kind === 'dialogue') {
    const float = Math.sin(motion * 2) * 10;
    ctx.globalAlpha = 0.28;
    roundRect(ctx, GRAPHIC_CX - 280, GRAPHIC_CY - 205 + float, 360, 210, 38); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(GRAPHIC_CX - 190, GRAPHIC_CY + 5 + float); ctx.lineTo(GRAPHIC_CX - 225, GRAPHIC_CY + 72 + float); ctx.lineTo(GRAPHIC_CX - 110, GRAPHIC_CY + 5 + float); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 0.48;
    roundRect(ctx, GRAPHIC_CX - 20, GRAPHIC_CY + 20 - float, 320, 190, 38); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(GRAPHIC_CX + 210, GRAPHIC_CY + 210 - float); ctx.lineTo(GRAPHIC_CX + 255, GRAPHIC_CY + 265 - float); ctx.lineTo(GRAPHIC_CX + 135, GRAPHIC_CY + 210 - float); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
    for (let i = 0; i < 3; i++) diamond(ctx, GRAPHIC_CX - 205 + i * 88, GRAPHIC_CY - 100 + float, 20, accent);
  }
  ctx.restore();
}

export function drawSemanticCards(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
) {
  if (elapsed < T.cardBase || content.points.length === 0) return;
  const timeline = elapsed - T.cardBase;
  const sceneIndex = Math.min(content.points.length - 1, Math.floor(timeline / SCENE_MS));
  const local = timeline - sceneIndex * SCENE_MS;
  const fadeIn = clamp(local / ENTER_MS, 0, 1);
  const fadeOut = 1 - clamp((local - (SCENE_MS - EXIT_MS)) / EXIT_MS, 0, 1);

  ctx.save();
  ctx.globalAlpha = Math.min(fadeIn, fadeOut);
  ctx.beginPath(); ctx.rect(60, 155, CW - 120, CH - 210); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(1060, 205); ctx.lineTo(1060, 925); ctx.stroke();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(64, 215); ctx.lineTo(64, 900); ctx.stroke();
  drawTextBlock(ctx, content.points[sceneIndex], sceneIndex, local, accent);
  drawGraphic(ctx, content.points[sceneIndex], local, accent);
  ctx.restore();
}
