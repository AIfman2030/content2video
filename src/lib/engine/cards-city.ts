// Adaptive knowledge-animation engine. All input points are preserved and paged.
import type { GeneratedContent, ContentPoint, CityOptions } from '../../types/video';
import { CW, CH, T, clamp, easeOutBack, easeOutCubic, lerp, roundRect, wrapText } from './helpers';

export const KNOWLEDGE_OUTRO_MS = 3800;
const REVEAL_GAP = 720;
const PAGE_HOLD = 1900;
const PAGE_TRANSITION = 620;
const PANORAMA_STAGGER = 150;
const PANORAMA_HOLD = 1800;
const FONT = '"Noto Sans SC", "PingFang SC", sans-serif';
const COLORS = ['#f6d365', '#ff7b93', '#67e8a5', '#78a9ff', '#c58aff', '#ff9f67'];
const MAIN_SAFE_TOP = 205;
const MAIN_SAFE_BOTTOM = 815;
const DETAIL_TOP = 850;

type Layout =
  | 'star' | 'ladder' | 'matrix' | 'orbit' | 'split' | 'statement'
  | 'timeline' | 'mindmap' | 'compare' | 'flow' | 'flip' | 'converge';
type KnowledgeRelation = 'sequence' | 'contrast' | 'causal' | 'hierarchy' | 'parallel';
interface KnowledgePage { start: number; points: ContentPoint[]; layout: Layout; duration: number }

function hashText(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function detectKnowledgeRelation(content: GeneratedContent, points = content.points): KnowledgeRelation {
  const text = `${content.title} ${points.map(p => `${p.label} ${p.short} ${p.desc}`).join(' ')}`;
  const score = (terms: string[]) => terms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0);
  const scores: Array<[KnowledgeRelation, number]> = [
    ['sequence', score(['时间', '阶段', '步骤', '首先', '然后', '最后', '起源', '演变', '过去', '现在', '未来'])],
    ['contrast', score(['对比', '区别', '相反', '正反', '优劣', '传统', '现代', '不同', '而是', 'VS'])],
    ['causal', score(['原因', '结果', '导致', '因此', '所以', '从而', '影响', '路径', '流程'])],
    ['hierarchy', score(['层级', '层次', '基础', '进阶', '核心', '上层', '底层', '递进', '体系'])],
  ];
  const best = scores.sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : 'parallel';
}

function overviewLayoutFor(content: GeneratedContent, animationSeed: number): Layout {
  const relation = detectKnowledgeRelation(content);
  if (relation === 'sequence') return 'timeline';
  if (relation === 'contrast') return 'compare';
  if (relation === 'causal') return 'flow';
  if (relation === 'hierarchy') return animationSeed % 2 ? 'mindmap' : 'ladder';
  return animationSeed % 2 ? 'converge' : 'mindmap';
}

function layoutCandidates(relation: KnowledgeRelation): Layout[] {
  if (relation === 'sequence') return ['timeline', 'flow', 'ladder', 'flip'];
  if (relation === 'contrast') return ['compare', 'split', 'statement', 'flip'];
  if (relation === 'causal') return ['flow', 'mindmap', 'timeline', 'converge'];
  if (relation === 'hierarchy') return ['ladder', 'mindmap', 'converge', 'matrix'];
  return ['flip', 'matrix', 'star', 'orbit', 'converge', 'statement'];
}

export function buildKnowledgePages(content: GeneratedContent, animationSeed = 1): KnowledgePage[] {
  const overviewLayout = overviewLayoutFor(content, animationSeed);
  const pages: KnowledgePage[] = [];
  const pageCount = Math.max(1, Math.ceil(content.points.length / 6));
  const baseSize = Math.floor(content.points.length / pageCount);
  const remainder = content.points.length % pageCount;
  let cursor = 0;
  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    // Distribute the remainder to the first pages so page sizes differ by at
    // most one: 10→5+5, 11→6+5, 16→6+5+5.
    const count = baseSize + (pageIndex < remainder ? 1 : 0);
    const points = content.points.slice(cursor, cursor + count);
    const candidates = layoutCandidates(detectKnowledgeRelation(content, points));
    const basis = hashText(`${content.title}|${points.map(p => p.label).join('|')}|${animationSeed}|${pages.length}`);
    let layout = candidates[basis % candidates.length];
    const previous = pages.at(-1)?.layout;
    for (let offset = 1; (layout === overviewLayout || layout === previous) && offset < candidates.length; offset++) {
      layout = candidates[(basis + offset) % candidates.length];
    }
    pages.push({ start: cursor, points, layout, duration: points.length * REVEAL_GAP + PAGE_HOLD + PAGE_TRANSITION });
    cursor += count;
  }
  return pages;
}

function panoramaDuration(n: number) {
  return Math.max(3200, n * PANORAMA_STAGGER + PANORAMA_HOLD);
}

export function cityTotalMs(n: number, content?: GeneratedContent, animationSeed = 1): number {
  const safeContent = content ?? { title: '', points: Array.from({ length: n }, () => ({ label: '', short: '', desc: '', formatted: '' })) };
  const pageMs = buildKnowledgePages(safeContent, animationSeed).reduce((sum, page) => sum + page.duration, 0);
  return T.cardBase + panoramaDuration(n) + pageMs + KNOWLEDGE_OUTRO_MS;
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, preferred: number, min = 22, weight = 800) {
  let size = preferred;
  while (size > min) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function drawGrid(ctx: CanvasRenderingContext2D, alpha: number, hue: string) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.045;
  ctx.strokeStyle = hue;
  ctx.lineWidth = 1;
  for (let x = 90; x < CW; x += 105) { ctx.beginPath(); ctx.moveTo(x, 150); ctx.lineTo(x, CH); ctx.stroke(); }
  for (let y = 180; y < CH; y += 105) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke(); }
  ctx.restore();
}

function positions(layout: Layout, count: number): Array<{ x: number; y: number }> {
  if (layout === 'star') {
    const rx = count <= 5 ? 500 : 590;
    const ry = 190;
    return Array.from({ length: count }, (_, i) => {
      const a = -Math.PI / 2 + (i / count) * Math.PI * 2;
      return { x: CW / 2 + Math.cos(a) * rx, y: 510 + Math.sin(a) * ry };
    });
  }
  if (layout === 'orbit') {
    const rx = count <= 4 ? 470 : 620;
    const ry = count <= 4 ? 220 : 245;
    return Array.from({ length: count }, (_, i) => {
      const a = -Math.PI / 2 + (i / count) * Math.PI * 2;
      return { x: CW / 2 + Math.cos(a) * rx, y: 500 + Math.sin(a) * Math.min(ry, 190) };
    });
  }
  if (layout === 'matrix') {
    const cols = count <= 4 ? 2 : 3;
    const rows = Math.ceil(count / cols);
    return Array.from({ length: count }, (_, i) => ({
      x: CW / 2 + (i % cols - (cols - 1) / 2) * 520,
      y: 330 + Math.floor(i / cols) * (rows > 2 ? 175 : 235),
    }));
  }
  if (layout === 'split') {
    return Array.from({ length: count }, (_, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      // Keep every row inside the main safe area, including the alternating
      // label box above/below each node. The previous 300px first row placed
      // the upper label at ~212px, so its border was clipped by the 205px
      // title safety boundary.
      return { x: CW / 2 + side * (330 + Math.floor(i / 2) * 125), y: 350 + Math.floor(i / 2) * 165 };
    });
  }
  const ys = [560, 360, 650, 430, 670, 340];
  return Array.from({ length: count }, (_, i) => ({
    x: count <= 1 ? CW / 2 : lerp(210, CW - 210, i / (count - 1)),
    y: ys[i % ys.length],
  }));
}

function effectTransform(effect: number, progress: number, index: number) {
  const eased = easeOutBack(Math.min(progress, 0.999));
  switch (effect % 5) {
    case 0: return { x: 0, y: (1 - easeOutCubic(progress)) * -180, scale: eased, rotation: 0 };
    case 1: return { x: (index % 2 ? 1 : -1) * (1 - easeOutCubic(progress)) * 260, y: 0, scale: eased, rotation: 0 };
    case 2: return { x: 0, y: 0, scale: eased, rotation: (1 - progress) * Math.PI * 1.5 };
    case 3: return { x: 0, y: (1 - progress) * 90, scale: 0.45 + eased * 0.55, rotation: 0 };
    default: return { x: Math.sin(index * 9.7) * (1 - progress) * 80, y: 0, scale: eased, rotation: 0 };
  }
}

function drawBurst(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, color: string, seed: number) {
  if (t <= 0 || t >= 1) return;
  ctx.save();
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2 + seed * 0.31;
    const d = easeOutCubic(t) * (65 + i % 5 * 13);
    ctx.globalAlpha = (1 - t) * 0.9;
    ctx.fillStyle = i % 4 ? color : '#fff';
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, Math.max(1, 7 * (1 - t)), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = (1 - t) * 0.6;
  ctx.strokeStyle = color; ctx.lineWidth = 5 * (1 - t);
  ctx.beginPath(); ctx.arc(x, y, t * 105, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawLabelBox(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, alpha: number) {
  const size = fitFont(ctx, text || '知识点', 280, 48, 28);
  ctx.font = `800 ${size}px ${FONT}`;
  const width = Math.min(320, ctx.measureText(text || '知识点').width + 44);
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(7,10,18,0.9)'; roundRect(ctx, x - width / 2, y - size / 2 - 15, width, size + 30, 12); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 3; roundRect(ctx, x - width / 2, y - size / 2 - 15, width, size + 30, 12); ctx.stroke();
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
  ctx.fillText(text || '知识点', x, y); ctx.restore();
}

function drawGenericPage(ctx: CanvasRenderingContext2D, page: KnowledgePage, elapsed: number, seed: number, alpha: number) {
  const pos = positions(page.layout, page.points.length);
  if (page.layout === 'orbit') {
    ctx.save(); ctx.globalAlpha = alpha * clamp(elapsed / 700, 0, 1); ctx.strokeStyle = 'rgba(120,169,255,0.28)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(CW / 2, 535, page.points.length <= 4 ? 470 : 620, page.points.length <= 4 ? 220 : 245, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  const path = page.layout === 'star' && pos.length === 5 ? [0, 2, 4, 1, 3, 0] : pos.map((_, i) => i);
  if (page.layout === 'orbit' && pos.length > 2) path.push(0);
  for (let i = 1; i < path.length; i++) {
    const from = pos[path[i - 1]], to = pos[path[i]];
    const p = easeOutCubic(clamp((elapsed - i * REVEAL_GAP + 180) / 520, 0, 1));
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = COLORS[(page.start + i) % COLORS.length]; ctx.lineWidth = 5; ctx.shadowBlur = 5; ctx.shadowColor = ctx.strokeStyle;
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(lerp(from.x, to.x, p), lerp(from.y, to.y, p)); ctx.stroke(); ctx.restore();
  }
  page.points.forEach((point, i) => {
    const te = elapsed - i * REVEAL_GAP;
    const progress = clamp(te / 560, 0, 1);
    if (progress <= 0) return;
    const color = COLORS[(page.start + i) % COLORS.length];
    const tr = effectTransform(seed + i, progress, i);
    drawBurst(ctx, pos[i].x, pos[i].y, clamp(te / 760, 0, 1), color, seed + i);
    ctx.save(); ctx.globalAlpha = alpha * clamp(progress * 1.8, 0, 1); ctx.translate(pos[i].x + tr.x, pos[i].y + tr.y); ctx.rotate(tr.rotation); ctx.scale(tr.scale, tr.scale);
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(0, 0, 29, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#070a12'; ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    if (page.layout === 'star' || page.layout === 'orbit') {
      const dx = pos[i].x - CW / 2, dy = pos[i].y - 510;
      const length = Math.max(1, Math.hypot(dx, dy));
      drawLabelBox(ctx, point.label, pos[i].x + dx / length * 76, pos[i].y + dy / length * 62, color, alpha * clamp(progress * 1.5, 0, 1));
    } else {
      const labelY = pos[i].y + (i % 2 ? -88 : 88);
      drawLabelBox(ctx, point.label, pos[i].x, labelY, color, alpha * clamp(progress * 1.5, 0, 1));
    }
  });
}

function drawMatrixPage(ctx: CanvasRenderingContext2D, page: KnowledgePage, elapsed: number, seed: number, alpha: number) {
  const cols = page.points.length <= 4 ? 2 : 3;
  const rows = Math.ceil(page.points.length / cols);
  const cardW = cols === 2 ? 650 : 480;
  const cardH = rows > 2 ? 155 : 205;
  const gapX = 38, gapY = 32;
  const totalW = cols * cardW + (cols - 1) * gapX;
  const totalH = rows * cardH + (rows - 1) * gapY;
  page.points.forEach((point, i) => {
    const p = clamp((elapsed - i * REVEAL_GAP) / 520, 0, 1);
    if (p <= 0) return;
    const col = i % cols, row = Math.floor(i / cols);
    const x = (CW - totalW) / 2 + col * (cardW + gapX);
    const y = MAIN_SAFE_TOP + (MAIN_SAFE_BOTTOM - MAIN_SAFE_TOP - totalH) / 2 + row * (cardH + gapY);
    const color = COLORS[(page.start + i) % COLORS.length];
    const tr = effectTransform(seed + i, p, i);
    ctx.save(); ctx.globalAlpha = alpha * p; ctx.translate(x + cardW / 2 + tr.x, y + cardH / 2 + tr.y); ctx.scale(tr.scale, tr.scale); ctx.translate(-cardW / 2, -cardH / 2);
    ctx.fillStyle = `${color}16`; ctx.strokeStyle = `${color}cc`; ctx.lineWidth = 3; roundRect(ctx, 0, 0, cardW, cardH, 20); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color; ctx.font = `900 27px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(String(page.start + i + 1).padStart(2, '0'), 30, cardH / 2);
    ctx.fillStyle = '#fff'; ctx.font = `800 ${fitFont(ctx, point.label, cardW - 150, 42, 25)}px ${FONT}`; ctx.fillText(point.label, 105, cardH * 0.38);
    const short = point.short || point.desc; ctx.fillStyle = 'rgba(255,255,255,0.62)'; ctx.font = `500 ${fitFont(ctx, short, cardW - 150, 28, 20, 500)}px ${FONT}`; ctx.fillText(short, 105, cardH * 0.68); ctx.restore();
  });
}

function drawSplitPage(ctx: CanvasRenderingContext2D, page: KnowledgePage, elapsed: number, seed: number, alpha: number) {
  const count = page.points.length;
  const rowH = Math.min(112, 520 / Math.max(1, count));
  const top = (MAIN_SAFE_TOP + MAIN_SAFE_BOTTOM - rowH * count) / 2;
  page.points.forEach((point, i) => {
    const p = clamp((elapsed - i * REVEAL_GAP) / 520, 0, 1);
    if (p <= 0) return;
    const y = top + i * rowH + rowH / 2;
    const color = COLORS[(page.start + i) % COLORS.length];
    const tr = effectTransform(seed + i, p, i);
    ctx.save(); ctx.globalAlpha = alpha * p; ctx.translate(tr.x, tr.y);
    const pillW = 420; ctx.fillStyle = `${color}1f`; ctx.strokeStyle = color; ctx.lineWidth = 2.5; roundRect(ctx, 230, y - 36, pillW, 72, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `850 ${fitFont(ctx, point.label, pillW - 40, 40, 25)}px ${FONT}`; ctx.fillText(point.label, 230 + pillW / 2, y);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = `500 44px ${FONT}`; ctx.fillText('→', 760, y);
    const short = point.short || point.desc; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = `650 ${fitFont(ctx, short, 780, 42, 25, 650)}px ${FONT}`; ctx.fillText(short, 850, y); ctx.restore();
  });
}

function drawTimelinePage(ctx: CanvasRenderingContext2D, page: KnowledgePage, elapsed: number, seed: number, alpha: number) {
  const count = page.points.length;
  const left = 230, right = CW - 230, axisY = 510;
  const lineP = easeOutCubic(clamp(elapsed / Math.max(700, count * 180), 0, 1));
  ctx.save(); ctx.globalAlpha = alpha * 0.7; ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(left, axisY); ctx.lineTo(lerp(left, right, lineP), axisY); ctx.stroke(); ctx.restore();
  page.points.forEach((point, i) => {
    const te = elapsed - i * REVEAL_GAP;
    const p = clamp(te / 520, 0, 1);
    if (p <= 0) return;
    const x = count === 1 ? CW / 2 : lerp(left, right, i / (count - 1));
    const above = i % 2 === 0;
    const color = COLORS[(page.start + i) % COLORS.length];
    const cardY = above ? 285 : 625;
    const tr = effectTransform(seed + i, p, i);
    ctx.save(); ctx.globalAlpha = alpha * p; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, axisY); ctx.lineTo(x, above ? cardY + 78 : cardY - 78); ctx.stroke();
    ctx.translate(tr.x, tr.y); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, axisY, 18, 0, Math.PI * 2); ctx.fill();
    const cardW = Math.min(285, count <= 4 ? 330 : 275), cardH = 132;
    ctx.fillStyle = 'rgba(9,12,18,0.96)'; ctx.strokeStyle = `${color}cc`; roundRect(ctx, x - cardW / 2, cardY - cardH / 2, cardW, cardH, 14); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.font = `850 ${fitFont(ctx, point.label, cardW - 34, 37, 23)}px ${FONT}`; ctx.fillText(point.label, x, cardY - 22);
    const short = point.short || point.desc; ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.font = `550 ${fitFont(ctx, short, cardW - 34, 25, 18, 550)}px ${FONT}`; ctx.fillText(short, x, cardY + 27); ctx.restore();
  });
}

function drawMindmapPage(ctx: CanvasRenderingContext2D, page: KnowledgePage, elapsed: number, seed: number, alpha: number, title: string) {
  const rootX = 390, rootY = 510;
  const rootP = easeOutBack(Math.min(clamp(elapsed / 520, 0, 1), 0.999));
  ctx.save(); ctx.globalAlpha = alpha * clamp(rootP, 0, 1); ctx.translate(rootX, rootY); ctx.scale(rootP, rootP);
  ctx.fillStyle = 'rgba(246,211,101,0.16)'; ctx.strokeStyle = COLORS[0]; ctx.lineWidth = 4; roundRect(ctx, -190, -62, 380, 124, 24); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `850 ${fitFont(ctx, title, 330, 42, 25)}px ${FONT}`; ctx.fillText(title, 0, 0); ctx.restore();
  const branchX = 900, leafX = 1450;
  page.points.forEach((point, i) => {
    const te = elapsed - i * REVEAL_GAP;
    const p = clamp(te / 560, 0, 1);
    if (p <= 0) return;
    const y = lerp(275, 745, page.points.length === 1 ? 0.5 : i / (page.points.length - 1));
    const color = COLORS[(page.start + i) % COLORS.length];
    const elbowY = rootY + (y - rootY) * 0.45;
    ctx.save(); ctx.globalAlpha = alpha * p; ctx.strokeStyle = `${color}aa`; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(rootX + 190, rootY); ctx.bezierCurveTo(branchX - 210, rootY, branchX - 230, elbowY, branchX, y); ctx.lineTo(lerp(branchX, leafX - 210, p), y); ctx.stroke();
    const tr = effectTransform(seed + i, p, i); ctx.translate(tr.x, tr.y);
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(branchX, y, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `${color}18`; ctx.strokeStyle = color; ctx.lineWidth = 2.5; roundRect(ctx, leafX - 210, y - 42, 420, 84, 15); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.font = `800 ${fitFont(ctx, point.label, 370, 36, 23)}px ${FONT}`; ctx.fillText(point.label, leafX, y - 15);
    const short = point.short || point.desc; ctx.fillStyle = 'rgba(255,255,255,0.58)'; ctx.font = `500 ${fitFont(ctx, short, 370, 23, 17, 500)}px ${FONT}`; ctx.fillText(short, leafX, y + 22); ctx.restore();
  });
}

function drawComparePage(ctx: CanvasRenderingContext2D, page: KnowledgePage, elapsed: number, seed: number, alpha: number) {
  const midpoint = Math.ceil(page.points.length / 2);
  const sides = [page.points.slice(0, midpoint), page.points.slice(midpoint)];
  ctx.save(); ctx.globalAlpha = alpha * clamp(elapsed / 500, 0, 1); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(CW / 2, 245); ctx.lineTo(CW / 2, 780); ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `800 32px ${FONT}`; ctx.fillStyle = COLORS[0]; ctx.fillText('视角 A', CW * 0.27, 245); ctx.fillStyle = COLORS[3]; ctx.fillText('视角 B', CW * 0.73, 245); ctx.restore();
  sides.forEach((items, side) => items.forEach((point, localIndex) => {
    const i = side === 0 ? localIndex : midpoint + localIndex;
    const p = clamp((elapsed - i * REVEAL_GAP) / 520, 0, 1);
    if (p <= 0) return;
    const x = side === 0 ? 520 : 1400;
    const y = 350 + localIndex * (380 / Math.max(1, items.length - 1));
    const color = COLORS[(page.start + i) % COLORS.length];
    const slideX = (1 - easeOutCubic(p)) * (side === 0 ? -180 : 180);
    ctx.save(); ctx.globalAlpha = alpha * p; ctx.translate(slideX, 0);
    ctx.fillStyle = `${color}16`; ctx.strokeStyle = `${color}b8`; ctx.lineWidth = 3; roundRect(ctx, x - 310, y - 68, 620, 136, 18); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.font = `850 ${fitFont(ctx, point.label, 540, 41, 24)}px ${FONT}`; ctx.fillText(point.label, x, y - 22);
    const short = point.short || point.desc; ctx.fillStyle = '#fff'; ctx.font = `550 ${fitFont(ctx, short, 540, 28, 19, 550)}px ${FONT}`; ctx.fillText(short, x, y + 28); ctx.restore();
  }));
}

function drawFlowPage(ctx: CanvasRenderingContext2D, page: KnowledgePage, elapsed: number, seed: number, alpha: number) {
  const cols = Math.min(3, page.points.length);
  const rows = Math.ceil(page.points.length / cols);
  const cellW = 470, cellH = rows === 1 ? 180 : 150, gapX = 90, gapY = 115;
  const totalW = cols * cellW + (cols - 1) * gapX;
  const totalH = rows * cellH + (rows - 1) * gapY;
  const startX = (CW - totalW) / 2, startY = (MAIN_SAFE_TOP + MAIN_SAFE_BOTTOM - totalH) / 2;
  const loc = page.points.map((_, i) => {
    const row = Math.floor(i / cols), rawCol = i % cols, col = row % 2 === 0 ? rawCol : cols - 1 - rawCol;
    return { x: startX + col * (cellW + gapX), y: startY + row * (cellH + gapY) };
  });
  for (let i = 1; i < loc.length; i++) {
    const p = easeOutCubic(clamp((elapsed - i * REVEAL_GAP + 250) / 520, 0, 1));
    const from = { x: loc[i - 1].x + cellW / 2, y: loc[i - 1].y + cellH / 2 };
    const to = { x: loc[i].x + cellW / 2, y: loc[i].y + cellH / 2 };
    ctx.save(); ctx.globalAlpha = alpha * p; ctx.strokeStyle = COLORS[(page.start + i) % COLORS.length]; ctx.lineWidth = 5; ctx.setLineDash([12, 10]);
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(lerp(from.x, to.x, p), lerp(from.y, to.y, p)); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  }
  page.points.forEach((point, i) => {
    const p = clamp((elapsed - i * REVEAL_GAP) / 520, 0, 1);
    if (p <= 0) return;
    const { x, y } = loc[i], color = COLORS[(page.start + i) % COLORS.length];
    const tr = effectTransform(seed + i, p, i);
    ctx.save(); ctx.globalAlpha = alpha * p; ctx.translate(x + cellW / 2 + tr.x, y + cellH / 2 + tr.y); ctx.scale(tr.scale, tr.scale); ctx.translate(-cellW / 2, -cellH / 2);
    ctx.fillStyle = 'rgba(8,12,18,0.96)'; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(cellW - 45, 0); ctx.lineTo(cellW, cellH / 2); ctx.lineTo(cellW - 45, cellH); ctx.lineTo(24, cellH); ctx.lineTo(0, cellH / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `900 25px ${FONT}`; ctx.fillText(String(page.start + i + 1).padStart(2, '0'), 44, cellH / 2);
    ctx.fillStyle = '#fff'; ctx.font = `800 ${fitFont(ctx, point.label, cellW - 150, 38, 23)}px ${FONT}`; ctx.fillText(point.label, 120, cellH * 0.4);
    const short = point.short || point.desc; ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = `500 ${fitFont(ctx, short, cellW - 150, 24, 17, 500)}px ${FONT}`; ctx.fillText(short, 120, cellH * 0.68); ctx.restore();
  });
}

function drawFlipPage(ctx: CanvasRenderingContext2D, page: KnowledgePage, elapsed: number, seed: number, alpha: number) {
  const cols = page.points.length <= 4 ? 2 : 3, rows = Math.ceil(page.points.length / cols);
  const cardW = cols === 2 ? 620 : 470, cardH = rows > 2 ? 160 : 210, gapX = 48, gapY = 34;
  const totalW = cols * cardW + (cols - 1) * gapX, totalH = rows * cardH + (rows - 1) * gapY;
  page.points.forEach((point, i) => {
    const p = clamp((elapsed - i * REVEAL_GAP) / 650, 0, 1);
    if (p <= 0) return;
    const x = (CW - totalW) / 2 + i % cols * (cardW + gapX), y = (MAIN_SAFE_TOP + MAIN_SAFE_BOTTOM - totalH) / 2 + Math.floor(i / cols) * (cardH + gapY);
    const color = COLORS[(page.start + i) % COLORS.length];
    const flip = p < 0.5 ? 1 - p * 2 : (p - 0.5) * 2;
    const showingBack = p >= 0.5;
    ctx.save(); ctx.globalAlpha = alpha * clamp(p * 2, 0, 1); ctx.translate(x + cardW / 2, y + cardH / 2); ctx.scale(Math.max(0.06, flip), 1); ctx.translate(-cardW / 2, -cardH / 2);
    ctx.fillStyle = showingBack ? `${color}1c` : 'rgba(255,255,255,0.05)'; ctx.strokeStyle = color; ctx.lineWidth = 3; roundRect(ctx, 0, 0, cardW, cardH, 22); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = showingBack ? color : '#fff'; ctx.font = `850 ${fitFont(ctx, point.label, cardW - 70, showingBack ? 40 : 52, 25)}px ${FONT}`; ctx.fillText(point.label, cardW / 2, showingBack ? cardH * 0.38 : cardH / 2);
    if (showingBack) { const short = point.short || point.desc; ctx.fillStyle = '#fff'; ctx.font = `550 ${fitFont(ctx, short, cardW - 70, 27, 18, 550)}px ${FONT}`; ctx.fillText(short, cardW / 2, cardH * 0.68); }
    ctx.restore();
  });
}

function drawConvergePage(ctx: CanvasRenderingContext2D, page: KnowledgePage, elapsed: number, seed: number, alpha: number, title: string) {
  const count = page.points.length, cx = CW / 2, cy = 510, rx = count <= 4 ? 560 : 650, ry = 235;
  const centerP = easeOutBack(Math.min(clamp((elapsed - count * REVEAL_GAP + 260) / 650, 0, 1), 0.999));
  page.points.forEach((point, i) => {
    const p = clamp((elapsed - i * REVEAL_GAP) / 540, 0, 1);
    if (p <= 0) return;
    const a = -Math.PI / 2 + i / count * Math.PI * 2;
    const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
    const color = COLORS[(page.start + i) % COLORS.length];
    ctx.save(); ctx.globalAlpha = alpha * p; ctx.strokeStyle = `${color}99`; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(cx + Math.cos(a) * 180, cy + Math.sin(a) * 80, lerp(x, cx, p), lerp(y, cy, p)); ctx.stroke();
    const settleX = lerp(cx, x, easeOutCubic(p)), settleY = lerp(cy, y, easeOutCubic(p));
    ctx.fillStyle = 'rgba(8,12,18,0.96)'; ctx.strokeStyle = color; ctx.lineWidth = 3; roundRect(ctx, settleX - 145, settleY - 42, 290, 84, 42); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `800 ${fitFont(ctx, point.label, 250, 34, 21)}px ${FONT}`; ctx.fillText(point.label, settleX, settleY); ctx.restore();
  });
  if (centerP > 0) {
    ctx.save(); ctx.globalAlpha = alpha * clamp(centerP, 0, 1); ctx.translate(cx, cy); ctx.scale(centerP, centerP);
    const grad = ctx.createRadialGradient(0, 0, 20, 0, 0, 170); grad.addColorStop(0, 'rgba(246,211,101,0.28)'); grad.addColorStop(1, 'rgba(246,211,101,0.05)'); ctx.fillStyle = grad; ctx.strokeStyle = COLORS[0]; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, 145, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `900 ${fitFont(ctx, title, 230, 39, 23)}px ${FONT}`; ctx.fillText(title, 0, 0); ctx.restore();
  }
}

function drawLadderPage(ctx: CanvasRenderingContext2D, page: KnowledgePage, elapsed: number, seed: number, alpha: number) {
  const count = page.points.length;
  page.points.forEach((point, i) => {
    const te = elapsed - i * REVEAL_GAP;
    const p = clamp(te / 560, 0, 1);
    if (p <= 0) return;
    const color = COLORS[(page.start + i) % COLORS.length];
    const y = 255 + i * (470 / Math.max(1, count - 1));
    const width = 360 + i * (620 / Math.max(1, count - 1));
    const h = count > 4 ? 92 : 118;
    const tr = effectTransform(seed + i, p, i);
    ctx.save(); ctx.globalAlpha = alpha * clamp(p * 1.8, 0, 1); ctx.translate(CW / 2 + tr.x, y + tr.y); ctx.scale(tr.scale, tr.scale);
    const grad = ctx.createLinearGradient(-width / 2, 0, width / 2, 0); grad.addColorStop(0, `${color}28`); grad.addColorStop(1, `${color}dd`);
    ctx.fillStyle = grad; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-width / 2 + 42, -h / 2); ctx.lineTo(width / 2 - 42, -h / 2); ctx.lineTo(width / 2, h / 2); ctx.lineTo(-width / 2, h / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `800 ${fitFont(ctx, point.label, width - 80, 48, 28)}px ${FONT}`; ctx.fillText(point.label, 0, 0); ctx.restore();
  });
}

function drawStatementPage(ctx: CanvasRenderingContext2D, page: KnowledgePage, elapsed: number, seed: number, alpha: number) {
  const preferredLabelSize = page.points.length > 4 ? 68 : 92;
  page.points.forEach((point, i) => {
    const te = elapsed - i * REVEAL_GAP;
    const p = clamp(te / 520, 0, 1);
    if (p <= 0) return;
    const y = 270 + i * (450 / Math.max(1, page.points.length - 1));
    const color = COLORS[(page.start + i) % COLORS.length];
    const tr = effectTransform(seed + i, p, i);
    ctx.save(); ctx.globalAlpha = alpha * p; ctx.translate(tr.x, tr.y);
    ctx.font = `900 ${fitFont(ctx, point.label, 300, preferredLabelSize, 44)}px ${FONT}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(point.label, 720, y);
    ctx.font = `500 48px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.fillText('⟶', 840, y);
    const text = point.short || point.desc; ctx.font = `600 ${fitFont(ctx, text, 760, 50, 28, 600)}px ${FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(text, 940, y); ctx.restore();
  });
}

function drawExplanation(ctx: CanvasRenderingContext2D, point: ContentPoint, absoluteIndex: number, elapsed: number, alpha: number) {
  const color = COLORS[absoluteIndex % COLORS.length];
  const short = (point.short || '').trim();
  const desc = point.desc && point.desc !== point.short ? point.desc.trim() : '';
  const combined = [short, desc].filter(Boolean).join('  ');
  if (!combined) return;
  const boxY = DETAIL_TOP;
  ctx.save(); ctx.globalAlpha = alpha * easeOutCubic(clamp((elapsed - 160) / 380, 0, 1));
  ctx.fillStyle = 'rgba(7,10,18,0.92)'; roundRect(ctx, 145, boxY, CW - 290, 150, 20); ctx.fill(); ctx.fillStyle = color; roundRect(ctx, 145, boxY, 12, 150, 6); ctx.fill();
  let size = 38; let lines: string[] = [];
  do { ctx.font = `600 ${size}px ${FONT}`; lines = wrapText(ctx, combined, CW - 430); if (lines.length <= 3) break; size -= 2; } while (size > 16);
  const visible = Math.floor(clamp((elapsed - 360) / 24, 0, combined.length));
  const visibleText = combined.slice(0, visible); ctx.font = `600 ${size}px ${FONT}`; lines = wrapText(ctx, visibleText, CW - 430);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; lines.forEach((line, i) => ctx.fillText(line, 205, boxY + 20 + i * (size + 8)));
  ctx.restore();
}

function drawPanorama(ctx: CanvasRenderingContext2D, content: GeneratedContent, elapsed: number, seed: number) {
  const count = content.points.length;
  ctx.save();
  ctx.fillStyle = 'rgba(3,6,12,0.42)'; ctx.fillRect(0, 145, CW, CH - 145);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.font = `700 34px ${FONT}`;
  ctx.fillText(`主题全貌 · ${count} 个核心观点`, CW / 2, 190);

  if (count <= 6) {
    const layout = overviewLayoutFor(content, seed);
    const overviewPage: KnowledgePage = { start: 0, points: content.points, layout, duration: panoramaDuration(count) };
    const fastElapsed = elapsed * (REVEAL_GAP / PANORAMA_STAGGER);
    ctx.save();
    ctx.beginPath(); ctx.rect(70, MAIN_SAFE_TOP, CW - 140, MAIN_SAFE_BOTTOM - MAIN_SAFE_TOP); ctx.clip();
    if (layout === 'timeline') drawTimelinePage(ctx, overviewPage, fastElapsed, seed + 31, 1);
    else if (layout === 'compare') drawComparePage(ctx, overviewPage, fastElapsed, seed + 31, 1);
    else if (layout === 'flow') drawFlowPage(ctx, overviewPage, fastElapsed, seed + 31, 1);
    else if (layout === 'mindmap') drawMindmapPage(ctx, overviewPage, fastElapsed, seed + 31, 1, content.title);
    else if (layout === 'ladder') drawLadderPage(ctx, overviewPage, fastElapsed, seed + 31, 1);
    else if (layout === 'converge') drawConvergePage(ctx, overviewPage, fastElapsed, seed + 31, 1, content.title);
    else drawGenericPage(ctx, overviewPage, fastElapsed, seed + 31, 1);
    ctx.restore();
  } else {
    const cols = count <= 10 ? 5 : 4;
    const rows = Math.ceil(count / cols);
    const cardW = cols === 5 ? 320 : 380;
    const cardH = rows <= 2 ? 170 : 116;
    const gapX = 28, gapY = 35;
    const totalW = cols * cardW + (cols - 1) * gapX;
    const totalH = rows * cardH + (rows - 1) * gapY;
    content.points.forEach((point, i) => {
      const te = elapsed - i * PANORAMA_STAGGER;
      const p = easeOutBack(Math.min(clamp(te / 430, 0, 1), 0.999));
      if (p <= 0) return;
      const col = i % cols, row = Math.floor(i / cols);
      const x = (CW - totalW) / 2 + col * (cardW + gapX);
      const y = MAIN_SAFE_TOP + (MAIN_SAFE_BOTTOM - MAIN_SAFE_TOP - totalH) / 2 + row * (cardH + gapY);
      const color = COLORS[i % COLORS.length];
      ctx.save(); ctx.globalAlpha = clamp(p, 0, 1); ctx.translate(x + cardW / 2, y + cardH / 2); ctx.scale(p, p); ctx.translate(-(x + cardW / 2), -(y + cardH / 2));
      ctx.fillStyle = `${color}18`; ctx.strokeStyle = color; ctx.lineWidth = 2.5; roundRect(ctx, x, y, cardW, cardH, 18); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color; ctx.font = `800 24px ${FONT}`; ctx.textAlign = 'left'; ctx.fillText(String(i + 1).padStart(2, '0'), x + 22, y + cardH / 2);
      ctx.fillStyle = '#fff'; ctx.font = `800 ${fitFont(ctx, point.label, cardW - 105, 32, 19)}px ${FONT}`; ctx.fillText(point.label, x + 82, y + cardH / 2); ctx.restore();
    });
  }
  ctx.restore();
}

export function drawCityCards(
  ctx: CanvasRenderingContext2D, elapsed: number, content: GeneratedContent,
  accent: string, _accent2: string, _shapeImg: HTMLImageElement,
  _coverIndex: number, cityOptions?: CityOptions,
) {
  if (elapsed < T.cardBase || content.points.length === 0) return;
  const seed = cityOptions?.animationSeed ?? 1;
  const pages = buildKnowledgePages(content, seed);
  let local = elapsed - T.cardBase;
  const panoramaMs = panoramaDuration(content.points.length);
  if (local < panoramaMs) {
    drawPanorama(ctx, content, local, seed);
    return;
  }
  local -= panoramaMs;
  let page: KnowledgePage | undefined;
  for (const candidate of pages) {
    if (local < candidate.duration) { page = candidate; break; }
    local -= candidate.duration;
  }
  if (!page) return;

  drawGrid(ctx, easeOutCubic(clamp(local / 700, 0, 1)), accent);
  const exitStart = page.duration - PAGE_TRANSITION;
  const pageAlpha = local > exitStart ? 1 - easeOutCubic(clamp((local - exitStart) / PAGE_TRANSITION, 0, 1)) : 1;
  const variantSeed = hashText(`${content.title}|${seed}|${page.start}`);
  // Hard clipping is a final safety net: no layout may paint into the title or
  // explanation regions, even during overshooting entrance animations.
  ctx.save();
  ctx.beginPath();
  ctx.rect(70, MAIN_SAFE_TOP, CW - 140, MAIN_SAFE_BOTTOM - MAIN_SAFE_TOP);
  ctx.clip();
  if (page.layout === 'ladder') drawLadderPage(ctx, page, local, variantSeed, pageAlpha);
  else if (page.layout === 'matrix') drawMatrixPage(ctx, page, local, variantSeed, pageAlpha);
  else if (page.layout === 'split') drawSplitPage(ctx, page, local, variantSeed, pageAlpha);
  else if (page.layout === 'statement') drawStatementPage(ctx, page, local, variantSeed, pageAlpha);
  else if (page.layout === 'timeline') drawTimelinePage(ctx, page, local, variantSeed, pageAlpha);
  else if (page.layout === 'mindmap') drawMindmapPage(ctx, page, local, variantSeed, pageAlpha, content.title);
  else if (page.layout === 'compare') drawComparePage(ctx, page, local, variantSeed, pageAlpha);
  else if (page.layout === 'flow') drawFlowPage(ctx, page, local, variantSeed, pageAlpha);
  else if (page.layout === 'flip') drawFlipPage(ctx, page, local, variantSeed, pageAlpha);
  else if (page.layout === 'converge') drawConvergePage(ctx, page, local, variantSeed, pageAlpha, content.title);
  else drawGenericPage(ctx, page, local, variantSeed, pageAlpha);
  ctx.restore();

  const current = Math.min(page.points.length - 1, Math.max(0, Math.floor(local / REVEAL_GAP)));
  drawExplanation(ctx, page.points[current], page.start + current, local - current * REVEAL_GAP, pageAlpha);
  ctx.save(); ctx.globalAlpha = pageAlpha; ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.font = `700 23px ${FONT}`; ctx.textAlign = 'right';
  ctx.fillText(`${String(page.start + current + 1).padStart(2, '0')} / ${String(content.points.length).padStart(2, '0')}`, CW - 90, CH - 42); ctx.restore();
}
