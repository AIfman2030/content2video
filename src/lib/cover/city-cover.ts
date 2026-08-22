import { COVER_W, COVER_H, type CoverOpts, drawRoundRect, registerCover } from './registry';

const W = COVER_W;
const H = COVER_H;
const FONT = '"Noto Sans SC", "PingFang SC", sans-serif';
const HERO_IMAGE_URL = '/assets/cover-ai-basics-hero-v1.png';
const BG = '#030b16';
const PRIMARY = '#ffd21a';
const TEXT = '#ffffff';

function cleanText(value: string): string {
  return value.replace(/^[\d一二三四五六七八九十]+[.、：:\s-]*/, '').replace(/\s+/g, ' ').trim();
}

function tokenizeTitle(title: string): string[] {
  return title.match(/[A-Za-z][A-Za-z0-9+#.]*(?:\s+[A-Za-z][A-Za-z0-9+#.]*)*|\d+|[\u3400-\u9fff]|[^\s]/g) ?? [title];
}

function splitTitleIntoTwoLines(ctx: CanvasRenderingContext2D, title: string): [string, string] {
  const clean = cleanText(title) || '把复杂知识讲清楚';
  let tokens = tokenizeTitle(clean);
  if (tokens.length < 2) tokens = Array.from(clean);
  if (tokens.length < 2) return [clean, ''];

  let best: [string, string] = [tokens[0], tokens.slice(1).join('')];
  let bestScore = Number.POSITIVE_INFINITY;
  for (let index = 1; index < tokens.length; index += 1) {
    const first = tokens.slice(0, index).join('');
    const second = tokens.slice(index).join('');
    const firstWidth = ctx.measureText(first).width;
    const secondWidth = ctx.measureText(second).width;
    const widthPenalty = Math.max(firstWidth, secondWidth);
    const balancePenalty = Math.abs(firstWidth - secondWidth) * 0.42;
    const score = widthPenalty + balancePenalty;
    if (score < bestScore) {
      best = [first, second];
      bestScore = score;
    }
  }
  return best;
}

function fitTitle(ctx: CanvasRenderingContext2D, title: string): { lines: [string, string]; size: number } {
  for (let size = 124; size >= 74; size -= 4) {
    ctx.font = `900 ${size}px ${FONT}`;
    const lines = splitTitleIntoTwoLines(ctx, title);
    if (lines.every(line => ctx.measureText(line).width <= 930)) return { lines, size };
  }
  ctx.font = `900 70px ${FONT}`;
  return { lines: splitTitleIntoTwoLines(ctx, title), size: 70 };
}

function loadHeroImage(): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = HERO_IMAGE_URL;
  });
}

function drawImageCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = W / H;
  let sourceX = 0;
  let sourceY = 0;
  let sourceW = image.naturalWidth;
  let sourceH = image.naturalHeight;
  if (sourceRatio > targetRatio) {
    sourceW = sourceH * targetRatio;
    sourceX = (image.naturalWidth - sourceW) / 2;
  } else {
    sourceH = sourceW / targetRatio;
    sourceY = (image.naturalHeight - sourceH) / 2;
  }
  ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, 0, 0, W, H);
}

function drawBackground(ctx: CanvasRenderingContext2D, image: HTMLImageElement | null) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  if (image) drawImageCover(ctx, image);

  const titleShade = ctx.createLinearGradient(0, 0, 0, 470);
  titleShade.addColorStop(0, 'rgba(2,8,17,0.66)');
  titleShade.addColorStop(0.7, 'rgba(2,8,17,0.24)');
  titleShade.addColorStop(1, 'rgba(2,8,17,0)');
  ctx.fillStyle = titleShade;
  ctx.fillRect(0, 0, W, 470);

  ctx.strokeStyle = 'rgba(255,210,26,0.72)';
  ctx.lineWidth = 4;
  drawRoundRect(ctx, 24, 24, W - 48, H - 48, 42);
  ctx.stroke();
}

function drawTitle(ctx: CanvasRenderingContext2D, title: string) {
  const { lines, size } = fitTitle(ctx, title);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `900 ${size}px ${FONT}`;

  ctx.fillStyle = PRIMARY;
  ctx.fillText(lines[0], W / 2, 70);

  const dividerY = 220;
  ctx.strokeStyle = PRIMARY;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(150, dividerY);
  ctx.lineTo(W - 150, dividerY);
  ctx.stroke();

  ctx.fillStyle = TEXT;
  ctx.fillText(lines[1], W / 2, 252);
  ctx.restore();
}

async function drawKnowledgeCover(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  const heroImage = await loadHeroImage();
  drawBackground(ctx, heroImage);
  drawTitle(ctx, opts.title);
}

registerCover('city', drawKnowledgeCover);
