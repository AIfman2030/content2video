import { COVER_W, COVER_H, type CoverOpts, drawRoundRect, registerCover } from './registry';
import { loadShapeImage } from '../shapes';
import { pickKnowledgeShapeByTitle } from '../themes';

const W = COVER_W;
const H = COVER_H;
const FONT = '"Noto Sans SC", "PingFang SC", sans-serif';

const TOPIC_META: Record<string, { label: string; accent: string }> = {
  network:   { label: '知识科普', accent: '#2563eb' },
  target:    { label: '目标方法', accent: '#dc2626' },
  prism:     { label: '逻辑拆解', accent: '#7c3aed' },
  spiral:    { label: '学习成长', accent: '#16a34a' },
  vortex:    { label: '心理认知', accent: '#db2777' },
  star8:     { label: '历史文化', accent: '#b45309' },
  atom:      { label: '科学原理', accent: '#0891b2' },
  helix:     { label: '生命健康', accent: '#059669' },
  hex:       { label: '数字科技', accent: '#4f46e5' },
  crystal:   { label: '商业财经', accent: '#c2410c' },
  pentagon:  { label: '职场管理', accent: '#475569' },
  snowflake: { label: '自然地理', accent: '#0284c7' },
};

function splitTitle(ctx: CanvasRenderingContext2D, title: string, maxWidth: number): string[] {
  const clean = title.replace(/\s+/g, ' ').trim() || '值得分享的知识';
  const lines: string[] = [];
  let line = '';
  for (const char of clean) {
    const next = line + char;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = char;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fitTitle(ctx: CanvasRenderingContext2D, title: string): { lines: string[]; size: number } {
  for (let size = 104; size >= 68; size -= 4) {
    ctx.font = `900 ${size}px ${FONT}`;
    const lines = splitTitle(ctx, title, W - 144);
    if (lines.length <= 3) return { lines, size };
  }
  ctx.font = `900 64px ${FONT}`;
  const lines = splitTitle(ctx, title, W - 144);
  if (lines.length > 3) lines[2] = `${lines.slice(2).join('').slice(0, 12)}…`;
  return { lines: lines.slice(0, 3), size: 64 };
}

function drawBackground(ctx: CanvasRenderingContext2D, accent: string) {
  ctx.fillStyle = '#f4f0e8';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 18, H);

  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = '#172033';
  ctx.lineWidth = 1;
  for (let x = 72; x < W; x += 72) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 72; y < H; y += 72) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

async function drawKnowledgeCover(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  const shapeId = pickKnowledgeShapeByTitle(opts.title, opts.items ?? [], opts.coverIndex);
  const meta = TOPIC_META[shapeId] ?? TOPIC_META.network;
  drawBackground(ctx, meta.accent);

  // Brand masthead
  ctx.fillStyle = '#172033';
  ctx.font = `800 34px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('AIFMAN · 知识动画', 72, 82);
  ctx.textAlign = 'right';
  ctx.font = `600 25px ${FONT}`;
  ctx.fillStyle = '#64748b';
  ctx.fillText('KNOWLEDGE NOTE', W - 72, 82);
  ctx.strokeStyle = '#172033';
  ctx.globalAlpha = 0.22;
  ctx.beginPath(); ctx.moveTo(72, 126); ctx.lineTo(W - 72, 126); ctx.stroke();
  ctx.globalAlpha = 1;

  // Topic badge
  ctx.font = `700 28px ${FONT}`;
  const badgeW = ctx.measureText(meta.label).width + 54;
  ctx.fillStyle = meta.accent;
  drawRoundRect(ctx, 72, 180, badgeW, 58, 29); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(meta.label, 72 + badgeW / 2, 209);

  // Strong editorial title
  const { lines, size } = fitTitle(ctx, opts.title);
  const lineHeight = size * 1.22;
  ctx.font = `900 ${size}px ${FONT}`;
  ctx.fillStyle = '#101827';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  lines.forEach((line, index) => ctx.fillText(line, 72, 292 + index * lineHeight));

  const titleBottom = 292 + lines.length * lineHeight;
  ctx.fillStyle = meta.accent;
  ctx.fillRect(72, titleBottom + 26, 132, 10);
  ctx.fillStyle = '#667085';
  ctx.font = `500 30px ${FONT}`;
  ctx.fillText('用动画，把复杂知识讲清楚', 72, titleBottom + 64);

  // Topic illustration: supporting element, not the visual hierarchy.
  const cardX = 470;
  const cardY = 870;
  const cardSize = 500;
  ctx.fillStyle = '#172033';
  drawRoundRect(ctx, cardX, cardY, cardSize, cardSize, 44); ctx.fill();
  ctx.fillStyle = meta.accent;
  ctx.fillRect(cardX, cardY, cardSize, 18);

  try {
    const image = await loadShapeImage('city', shapeId, '#ffffff', 2.8);
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.drawImage(image, cardX + 90, cardY + 90, 320, 320);
    ctx.restore();
  } catch { /* Text hierarchy remains usable if the icon fails. */ }

  // Issue marker balances the illustration and gives the cover a repeatable series identity.
  ctx.fillStyle = '#172033';
  ctx.font = `900 112px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('01', 72, 1120);
  ctx.font = `700 25px ${FONT}`;
  ctx.fillStyle = '#64748b';
  ctx.fillText('KNOWLEDGE', 78, 1162);
  ctx.fillText('SHARING', 78, 1196);

  ctx.strokeStyle = '#172033';
  ctx.globalAlpha = 0.22;
  ctx.beginPath(); ctx.moveTo(72, H - 72); ctx.lineTo(W - 72, H - 72); ctx.stroke();
  ctx.globalAlpha = 1;
}

registerCover('city', drawKnowledgeCover);
