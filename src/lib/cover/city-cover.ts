import { COVER_W, COVER_H, ICON_CX, ICON_CY, ICON_R, CoverOpts,
  hex2rgbaCover, neonGrad, drawRainbowBorder, registerCover } from './registry';

const W = COVER_W, H = COVER_H;

// Per-index neon palettes for variety
const PALETTES: [string, string][] = [
  ['#f5d87a','#ff6b35'],['#00d4ff','#7700ff'],['#ff4466','#44ffaa'],
  ['#ffcc00','#0088ff'],['#00ff88','#cc00ff'],['#ff8844','#44aaff'],
  ['#ff0088','#00ffcc'],['#ffaa00','#6600ff'],['#44ff44','#ff4488'],
  ['#00ccff','#ff2244'],['#ff00cc','#88ff00'],['#ffcc44','#0044cc'],
  ['#f5d87a','#cc00ff'],['#00ffee','#ff0055'],['#88ff44','#ff44aa'],
  ['#4400ff','#ffcc44'],['#ff4488','#44ffaa'],['#aaff00','#ff00cc'],
  ['#00bbff','#ff6644'],['#ff0066','#66ff00'],['#8888ff','#ffaa00'],
  ['#44ff88','#ff4400'],['#ffcc88','#0044cc'],['#ff00aa','#aaff44'],
];

/** Extract a single display character from a title string.
 *  Prefers the first CJK character; falls back to the first character overall. */
function titleChar(title: string): string {
  if (!title) return '道';
  // Find the first CJK Unified Ideograph (U+4E00–U+9FFF) or CJK Extension
  const cjk = title.match(/[\u4e00-\u9fff\u3400-\u4dbf]/);
  if (cjk) return cjk[0];
  // Fallback: first character of the string
  return [...title][0] ?? '道';
}

function drawBg(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.5);
  g.addColorStop(0, 'rgba(10,5,20,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.5);
}

function drawZodiacIcon(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  char: string, c1: string, c2: string,
) {
  ctx.save();
  // Radial glow fill
  const gf = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  gf.addColorStop(0, hex2rgbaCover(c1, 0.28));
  gf.addColorStop(0.65, hex2rgbaCover(c2, 0.1));
  gf.addColorStop(1, 'transparent');
  ctx.fillStyle = gf; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

  // Outer glow ring
  ctx.shadowColor = c1; ctx.shadowBlur = 40;
  ctx.strokeStyle = neonGrad(ctx, cx - r, cy, cx + r, cy, c1, c2);
  ctx.lineWidth = 9;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

  // 8 decorative dots orbiting the ring
  ctx.shadowBlur = 14;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.fillStyle = i % 2 === 0 ? c1 : c2;
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * (r + 22), cy + Math.sin(a) * (r + 22), 11, 0, Math.PI * 2); ctx.fill();
  }

  // Inner ring
  ctx.shadowBlur = 0; ctx.strokeStyle = hex2rgbaCover(c2, 0.65); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.68, 0, Math.PI * 2); ctx.stroke();

  // Character — auto-scale font to always fit inside the circle
  const maxFsz = Math.round(r * 0.9);
  ctx.shadowColor = '#fff'; ctx.shadowBlur = 24;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';

  // Try max size, shrink if measured width exceeds diameter
  let fsz = maxFsz;
  ctx.font = `900 ${fsz}px "Noto Sans SC", sans-serif`;
  const measured = ctx.measureText(char).width;
  if (measured > r * 1.6) {
    fsz = Math.floor(maxFsz * (r * 1.6) / measured);
    ctx.font = `900 ${fsz}px "Noto Sans SC", sans-serif`;
  }
  ctx.fillText(char, cx, cy + r * 0.04);
  ctx.shadowBlur = 0; ctx.restore();
}

function drawCity(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  const { title, coverIndex } = opts;
  // Use the first CJK (or first) character from the configured title
  const char = titleChar(title);
  const [c1, c2] = PALETTES[coverIndex % PALETTES.length];
  drawBg(ctx);
  drawRainbowBorder(ctx, W, H);
  drawZodiacIcon(ctx, ICON_CX, ICON_CY, ICON_R, char, c1, c2);
}

registerCover('city', drawCity);
