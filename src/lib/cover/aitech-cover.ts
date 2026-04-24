import { COVER_W, COVER_H, CoverOpts, hex2rgbaCover, drawRoundRect, registerCover } from './registry';

const W = COVER_W, H = COVER_H;

function drawAIBg(ctx: CanvasRenderingContext2D, accent: string, accent2: string) {
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#080c14'); bg.addColorStop(0.5, '#0f172a'); bg.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // grid dots
  ctx.save(); ctx.fillStyle = hex2rgbaCover(accent, 0.12);
  for (let x = 0; x < W; x += 72) for (let y = 0; y < H; y += 72) {
    ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // corner glows
  const cg1 = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.7);
  cg1.addColorStop(0, hex2rgbaCover(accent, 0.15)); cg1.addColorStop(1, 'transparent');
  ctx.fillStyle = cg1; ctx.fillRect(0, 0, W, H);
  const cg2 = ctx.createRadialGradient(W, H, 0, W, H, W * 0.7);
  cg2.addColorStop(0, hex2rgbaCover(accent2, 0.12)); cg2.addColorStop(1, 'transparent');
  ctx.fillStyle = cg2; ctx.fillRect(0, 0, W, H);
}

function polyPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, sides: number) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}

function drawPolygonIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, accent: string, accent2: string, sides: number) {
  ctx.save();
  // Outer pulsing ring
  ctx.strokeStyle = hex2rgbaCover(accent2, 0.3); ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
  ctx.beginPath(); ctx.arc(cx, cy, r + 40, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  // Main polygon fill
  const gf = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  gf.addColorStop(0, hex2rgbaCover(accent, 0.25)); gf.addColorStop(1, hex2rgbaCover(accent2, 0.08));
  ctx.fillStyle = gf;
  polyPath(ctx, cx, cy, r, sides); ctx.fill();
  // Stroke
  ctx.strokeStyle = hex2rgbaCover(accent, 0.8); ctx.lineWidth = 3;
  polyPath(ctx, cx, cy, r, sides); ctx.stroke();
  // Inner glow
  ctx.shadowColor = accent; ctx.shadowBlur = 40;
  ctx.strokeStyle = hex2rgbaCover(accent, 0.5); ctx.lineWidth = 1.5;
  polyPath(ctx, cx, cy, r * 0.6, sides); ctx.stroke(); ctx.shadowBlur = 0;
  // Center dot
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawAIItems(ctx: CanvasRenderingContext2D, items: string[], accent: string, accent2: string, startY: number) {
  const cols = [hex2rgbaCover(accent, 0.85), hex2rgbaCover(accent2, 0.85)];
  items.slice(0, 6).forEach((item, i) => {
    const y = startY + i * 88;
    ctx.save();
    ctx.fillStyle = hex2rgbaCover(i % 2 === 0 ? accent : accent2, 0.1);
    drawRoundRect(ctx, 60, y - 26, W - 120, 62, 8); ctx.fill();
    ctx.strokeStyle = hex2rgbaCover(i % 2 === 0 ? accent : accent2, 0.4); ctx.lineWidth = 1;
    drawRoundRect(ctx, 60, y - 26, W - 120, 62, 8); ctx.stroke();
    // Index number
    ctx.fillStyle = cols[i % 2]; ctx.font = `700 28px monospace`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`0${i + 1}`, 82, y + 5);
    ctx.strokeStyle = hex2rgbaCover(i % 2 === 0 ? accent : accent2, 0.4); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(120, y - 12); ctx.lineTo(120, y + 22); ctx.stroke();
    ctx.font = `600 36px "Noto Sans SC", sans-serif`; ctx.fillStyle = '#e8e8f0';
    ctx.fillText(item, 136, y + 5);
    ctx.restore();
  });
}

function drawAITech(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  const { title, subtitle, items = [], accent, accent2, coverIndex } = opts;
  const sides = [3, 4, 5, 6, 8][coverIndex % 5];
  drawAIBg(ctx, accent, accent2);
  // Top label
  ctx.save(); ctx.fillStyle = hex2rgbaCover(accent, 0.12); ctx.fillRect(0, 0, W, 100);
  ctx.font = `400 30px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = hex2rgbaCover(accent, 0.9); ctx.fillText('AI · INSIGHT · CARD', W / 2, 50);
  ctx.restore();
  drawPolygonIcon(ctx, W / 2, 440, 185, accent, accent2, sides);
  const glow = ctx.createRadialGradient(W / 2, 440, 0, W / 2, 440, 280);
  glow.addColorStop(0, hex2rgbaCover(accent, 0.2)); glow.addColorStop(1, 'transparent');
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = glow; ctx.fillRect(0, 180, W, 520); ctx.restore();
  // Title
  ctx.save(); ctx.font = `900 78px "Noto Sans SC", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = accent; ctx.shadowBlur = 32; ctx.fillStyle = '#fff'; ctx.fillText(title, W / 2, 760);
  ctx.shadowBlur = 0; ctx.restore();
  if (subtitle) {
    ctx.save(); ctx.font = `400 34px "Noto Sans SC", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = hex2rgbaCover(accent2, 0.9); ctx.fillText(subtitle, W / 2, 830); ctx.restore();
  }
  const dg = ctx.createLinearGradient(60, 0, W - 60, 0);
  dg.addColorStop(0, 'transparent'); dg.addColorStop(0.3, hex2rgbaCover(accent, 0.9));
  dg.addColorStop(0.7, hex2rgbaCover(accent2, 0.9)); dg.addColorStop(1, 'transparent');
  ctx.save(); ctx.strokeStyle = dg; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(60, 870); ctx.lineTo(W - 60, 870); ctx.stroke(); ctx.restore();
  if (items.length > 0) drawAIItems(ctx, items, accent, accent2, 940);
  ctx.save(); ctx.globalAlpha = 0.2; ctx.font = `300 26px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = accent2; ctx.fillText('CLICK TO WATCH FULL VIDEO', W / 2, H - 60); ctx.restore();
}

registerCover('aitech', drawAITech);
