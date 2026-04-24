import { COVER_W, COVER_H, CoverOpts, hex2rgbaCover, drawRoundRect, registerCover } from './registry';

const W = COVER_W, H = COVER_H;

function drawBg(ctx: CanvasRenderingContext2D, accent: string) {
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0a0a14'); bg.addColorStop(0.5, '#12121f'); bg.addColorStop(1, '#0a0a14');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // subtle diagonal lines pattern
  ctx.save(); ctx.globalAlpha = 0.04; ctx.strokeStyle = accent; ctx.lineWidth = 1;
  for (let i = -H; i < W + H; i += 48) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
  }
  ctx.restore();
  // top glow
  const tg = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, W * 0.9);
  tg.addColorStop(0, hex2rgbaCover(accent, 0.18)); tg.addColorStop(1, 'transparent');
  ctx.fillStyle = tg; ctx.fillRect(0, 0, W, H * 0.5);
}

function drawDragon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string) {
  // Stylized circular dragon / coin motif
  ctx.save();
  ctx.strokeStyle = col; ctx.lineWidth = 4;
  // outer ring
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2); ctx.stroke();
  // inner circle
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2); ctx.stroke();
  // radial lines (8 directions like bagua)
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.26, cy + Math.sin(a) * r * 0.26);
    ctx.lineTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82);
    ctx.stroke();
  }
  // decorative arcs between spokes
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a1 = (i / 8) * Math.PI * 2, a2 = ((i + 0.5) / 8) * Math.PI * 2;
    const mx = cx + Math.cos((a1 + a2) / 2) * r * 0.58;
    const my = cy + Math.sin((a1 + a2) / 2) * r * 0.58;
    ctx.beginPath(); ctx.arc(mx, my, r * 0.12, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = hex2rgbaCover(col, 0.1);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawTopBanner(ctx: CanvasRenderingContext2D, accent: string) {
  ctx.save(); ctx.globalAlpha = 0.7;
  ctx.fillStyle = hex2rgbaCover(accent, 0.15);
  ctx.fillRect(0, 0, W, 110);
  ctx.strokeStyle = hex2rgbaCover(accent, 0.4);
  ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 110); ctx.lineTo(W, 110); ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.font = `400 32px "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = hex2rgbaCover(accent, 0.9); ctx.fillText('知 识 点 总 结', W / 2, 55);
  ctx.restore();
}

function drawItems(ctx: CanvasRenderingContext2D, items: string[], accent: string, startY: number) {
  items.slice(0, 6).forEach((item, i) => {
    const y = startY + i * 90;
    ctx.save();
    ctx.fillStyle = hex2rgbaCover(accent, 0.12);
    drawRoundRect(ctx, 80, y - 28, W - 160, 64, 12); ctx.fill();
    ctx.strokeStyle = hex2rgbaCover(accent, 0.35);
    ctx.lineWidth = 1; drawRoundRect(ctx, 80, y - 28, W - 160, 64, 12); ctx.stroke();
    // bullet
    ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(120, y + 4, 8, 0, Math.PI * 2); ctx.fill();
    ctx.font = `600 38px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f0f0f0'; ctx.fillText(item, 148, y + 4);
    ctx.restore();
  });
}

function drawChinese(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  const { title, items = [], accent, accent2, coverIndex } = opts;
  drawBg(ctx, accent);
  drawTopBanner(ctx, accent);
  // Large decorative icon
  const iconY = 480;
  drawDragon(ctx, W / 2, iconY, 200, accent);
  // Accent circle glow behind icon
  const glow = ctx.createRadialGradient(W / 2, iconY, 0, W / 2, iconY, 260);
  glow.addColorStop(0, hex2rgbaCover(accent, 0.22)); glow.addColorStop(1, 'transparent');
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = glow; ctx.fillRect(0, 200, W, 560); ctx.restore();
  // Title
  ctx.save();
  ctx.font = `900 86px "Noto Sans SC", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = accent; ctx.shadowBlur = 28; ctx.fillStyle = '#fff'; ctx.fillText(title, W / 2, 780);
  ctx.shadowBlur = 0; ctx.restore();
  // Divider
  const dg = ctx.createLinearGradient(80, 0, W - 80, 0);
  dg.addColorStop(0, 'transparent'); dg.addColorStop(0.4, hex2rgbaCover(accent, 0.8));
  dg.addColorStop(0.6, hex2rgbaCover(accent2, 0.8)); dg.addColorStop(1, 'transparent');
  ctx.save(); ctx.strokeStyle = dg; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(80, 850); ctx.lineTo(W - 80, 850); ctx.stroke(); ctx.restore();
  // Items
  if (items.length > 0) drawItems(ctx, items, accent, 920);
  // Bottom watermark
  ctx.save(); ctx.globalAlpha = 0.25; ctx.font = `300 28px "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = accent;
  ctx.fillText('点击查看完整视频', W / 2, H - 60); ctx.restore();
}

registerCover('chinese', drawChinese);
