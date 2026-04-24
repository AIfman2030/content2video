import { COVER_W, COVER_H, ICON_CX, ICON_CY, ICON_R, CoverOpts,
  hex2rgbaCover, neonGrad, drawRainbowBorder, registerCover } from './registry';

const W = COVER_W, H = COVER_H;

// Per-index color palettes (neon complementary pairs)
const PALETTES: [string, string][] = [
  ['#aa00ff','#00ffcc'],['#ff0088','#00ccff'],['#ffcc00','#0088ff'],
  ['#00ff88','#cc00ff'],['#ff4400','#00bbff'],['#ff00cc','#88ff00'],
  ['#0044ff','#ff8800'],['#00ffee','#ff0055'],['#88ff44','#ff44aa'],
  ['#ff6600','#4466ff'],['#cc88ff','#00ffaa'],['#ff2244','#44ffcc'],
  ['#ffaa00','#aa00ff'],['#00ffff','#ff0044'],['#ff88cc','#44ff44'],
  ['#4400ff','#ffcc44'],['#ff4488','#44ffaa'],['#aaff00','#ff00cc'],
  ['#00bbff','#ff6644'],['#ff0066','#66ff00'],['#8888ff','#ffaa00'],
  ['#44ff88','#ff4400'],['#ffcc88','#0044cc'],['#ff00aa','#aaff44'],
];

function drawBg(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  // Subtle dot grid
  ctx.save(); ctx.fillStyle = 'rgba(80,80,120,0.18)';
  for (let x = 36; x < W; x += 72) for (let y = 36; y < H; y += 72) {
    ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function polyPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, sides: number) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) ctx.moveTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r);
    else ctx.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r);
  }
  ctx.closePath();
}

function drawPolygonIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, c1: string, c2: string, sides: number) {
  ctx.save();
  // Outer dashed ring
  ctx.setLineDash([8, 12]);
  ctx.strokeStyle = hex2rgbaCover(c2, 0.5); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, r + r*0.15, 0, Math.PI*2); ctx.stroke();
  ctx.setLineDash([]);
  // Fill gradient
  const gf = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  gf.addColorStop(0, hex2rgbaCover(c1, 0.18)); gf.addColorStop(1, hex2rgbaCover(c2, 0.04));
  ctx.fillStyle = gf; polyPath(ctx, cx, cy, r, sides); ctx.fill();
  // Main stroke
  ctx.shadowColor = c1; ctx.shadowBlur = 30;
  ctx.strokeStyle = neonGrad(ctx, cx-r, cy, cx+r, cy, c1, c2); ctx.lineWidth = 7;
  polyPath(ctx, cx, cy, r, sides); ctx.stroke();
  // Inner polygon
  ctx.shadowColor = c2; ctx.shadowBlur = 20;
  ctx.strokeStyle = neonGrad(ctx, cx, cy-r, cx, cy+r, c2, c1); ctx.lineWidth = 3;
  polyPath(ctx, cx, cy, r*0.55, sides); ctx.stroke();
  // Spoke lines from center to vertices
  ctx.shadowBlur = 14; ctx.lineWidth = 2;
  for (let i = 0; i < sides; i++) {
    const a = (i/sides)*Math.PI*2 - Math.PI/2;
    ctx.strokeStyle = neonGrad(ctx, cx, cy, cx+Math.cos(a)*r*0.55, cy+Math.sin(a)*r*0.55, c1, c2);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx+Math.cos(a)*r*0.55, cy+Math.sin(a)*r*0.55); ctx.stroke();
  }
  // Center dot
  ctx.shadowColor = c1; ctx.shadowBlur = 20;
  ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(cx, cy, r*0.06, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0; ctx.restore();
}

function drawAITech(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  const { coverIndex } = opts;
  const [c1, c2] = PALETTES[coverIndex % PALETTES.length];
  const sides = [3, 4, 5, 6, 8, 10, 6, 4, 5, 3, 8, 6, 4, 5, 6, 3, 8, 5, 4, 6, 5, 8, 3, 6][coverIndex % 24];
  drawBg(ctx);
  drawRainbowBorder(ctx, W, H);
  drawPolygonIcon(ctx, ICON_CX, ICON_CY, ICON_R, c1, c2, sides);
}

registerCover('aitech', drawAITech);
