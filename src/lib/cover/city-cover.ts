import { COVER_W, COVER_H, CoverOpts, hex2rgbaCover, drawRoundRect, registerCover } from './registry';

const W = COVER_W, H = COVER_H;

function drawCityBg(ctx: CanvasRenderingContext2D, accent: string) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0d1b2a'); bg.addColorStop(0.6, '#0f1c30'); bg.addColorStop(1, '#080f1a');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // star particles
  ctx.save(); ctx.fillStyle = hex2rgbaCover(accent, 0.6);
  const stars = [[120,80],[340,160],[660,55],[820,120],[980,90],[200,220],[500,180],[750,210],[1010,250]];
  stars.forEach(([x,y]) => { ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill(); });
  ctx.restore();
}

function drawSkyline(ctx: CanvasRenderingContext2D, accent: string) {
  const base = H * 0.55;
  ctx.save(); ctx.fillStyle = hex2rgbaCover(accent, 0.08);
  // Buildings silhouette
  const blds: [number,number,number,number][] = [
    [40,120,base-120,base],[200,160,base-160,base],[320,90,base-90,base],
    [460,200,base-200,base],[560,110,base-110,base],[680,180,base-180,base],
    [800,95,base-95,base],[900,150,base-150,base],[980,80,base-80,base],[1040,130,base-130,base],
  ];
  blds.forEach(([x,w,y,by]) => { ctx.fillRect(x,y,w,by-y); });
  // Windows
  ctx.fillStyle = hex2rgbaCover(accent, 0.3);
  for (let x = 50; x < W - 40; x += 38) {
    for (let y = base - 200; y < base - 20; y += 28) {
      if (Math.random() > 0.5) ctx.fillRect(x + 4, y + 4, 16, 14);
    }
  }
  // Ground reflection
  const ref = ctx.createLinearGradient(0, base, 0, base + 200);
  ref.addColorStop(0, hex2rgbaCover(accent, 0.12)); ref.addColorStop(1, 'transparent');
  ctx.fillStyle = ref; ctx.fillRect(0, base, W, 200);
  ctx.restore();
}

function drawTopLabel(ctx: CanvasRenderingContext2D, accent: string) {
  ctx.save(); ctx.fillStyle = hex2rgbaCover(accent, 0.15); ctx.fillRect(0, 0, W, 100);
  ctx.strokeStyle = hex2rgbaCover(accent, 0.4); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 100); ctx.lineTo(W, 100); ctx.stroke();
  ctx.font = `400 30px "Noto Sans SC", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = hex2rgbaCover(accent, 0.9); ctx.fillText('城 市 地 标 · 知 识 卡', W / 2, 50);
  ctx.restore();
}

function drawCityIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, accent: string) {
  const r = 160;
  ctx.save();
  // Outer ring
  ctx.strokeStyle = hex2rgbaCover(accent, 0.6); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  // Glow fill
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, hex2rgbaCover(accent, 0.2)); g.addColorStop(1, 'transparent');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  // Central tower
  const tw = 28, th = 140;
  ctx.fillStyle = hex2rgbaCover(accent, 0.9);
  ctx.fillRect(cx - tw / 2, cy - th / 2, tw, th);
  ctx.fillRect(cx - tw * 1.8, cy + th * 0.25, tw * 3.6, th * 0.1);
  ctx.fillRect(cx - tw * 1.2, cy + th * 0.1, tw * 2.4, th * 0.12);
  // top spire
  ctx.beginPath(); ctx.moveTo(cx, cy - th / 2 - 40); ctx.lineTo(cx - 10, cy - th / 2); ctx.lineTo(cx + 10, cy - th / 2); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawCityItems(ctx: CanvasRenderingContext2D, items: string[], accent: string, startY: number) {
  items.slice(0, 5).forEach((item, i) => {
    const y = startY + i * 96;
    ctx.save();
    const bg = ctx.createLinearGradient(60, y - 30, W - 60, y - 30);
    bg.addColorStop(0, hex2rgbaCover(accent, 0.18)); bg.addColorStop(1, hex2rgbaCover(accent, 0.06));
    ctx.fillStyle = bg; drawRoundRect(ctx, 60, y - 30, W - 120, 70, 10); ctx.fill();
    ctx.strokeStyle = hex2rgbaCover(accent, 0.3); ctx.lineWidth = 1;
    drawRoundRect(ctx, 60, y - 30, W - 120, 70, 10); ctx.stroke();
    // Left accent bar
    ctx.fillStyle = accent; ctx.fillRect(60, y - 30, 6, 70);
    ctx.font = `600 38px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f0f0f0';
    ctx.fillText(item, 88, y + 5);
    ctx.restore();
  });
}

function drawCity(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  const { title, items = [], accent, accent2 } = opts;
  drawCityBg(ctx, accent);
  drawTopLabel(ctx, accent);
  drawSkyline(ctx, accent);
  drawCityIcon(ctx, W / 2, 430, accent);
  // glow behind icon
  const glow = ctx.createRadialGradient(W / 2, 430, 0, W / 2, 430, 220);
  glow.addColorStop(0, hex2rgbaCover(accent, 0.18)); glow.addColorStop(1, 'transparent');
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = glow; ctx.fillRect(0, 200, W, 500); ctx.restore();
  // Title
  ctx.save(); ctx.font = `900 82px "Noto Sans SC", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = accent; ctx.shadowBlur = 30; ctx.fillStyle = '#fff'; ctx.fillText(title, W / 2, 760);
  ctx.shadowBlur = 0; ctx.restore();
  // Divider line
  const dg = ctx.createLinearGradient(60, 0, W - 60, 0);
  dg.addColorStop(0, 'transparent'); dg.addColorStop(0.5, hex2rgbaCover(accent, 0.9)); dg.addColorStop(1, 'transparent');
  ctx.save(); ctx.strokeStyle = dg; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(60, 835); ctx.lineTo(W - 60, 835); ctx.stroke(); ctx.restore();
  if (items.length > 0) drawCityItems(ctx, items, accent, 920);
  ctx.save(); ctx.globalAlpha = 0.2; ctx.font = `300 26px "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = accent;
  ctx.fillText('点击查看完整视频', W / 2, H - 60); ctx.restore();
}

registerCover('city', drawCity);
