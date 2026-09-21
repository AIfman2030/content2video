import { COVER_H, COVER_W, type CoverOpts, registerCover } from './registry';

const font = '"Noto Sans SC","PingFang SC",sans-serif';

function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, start: number): number {
  let size = start;
  while (size > 52) {
    ctx.font = `1000 ${size}px ${font}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function drawCognitionAvatar(ctx: CanvasRenderingContext2D) {
  const cx = COVER_W / 2, cy = 1120, r = 190;
  const bg = ctx.createRadialGradient(cx - 20, cy - 35, 20, cx, cy, r);
  bg.addColorStop(0, '#383838'); bg.addColorStop(.68, '#171717'); bg.addColorStop(1, '#050505');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#777'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(cx, cy, r - 25, .45, Math.PI * 1.75); ctx.stroke();
  ctx.strokeStyle = '#f2f2f2'; ctx.fillStyle = '#f2f2f2'; ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, cy - 55, 65, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx - 22, cy - 66, 7, 0, Math.PI * 2); ctx.arc(cx + 22, cy - 66, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx - 22, cy - 28); ctx.lineTo(cx + 22, cy - 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy + 12); ctx.lineTo(cx, cy + 155); ctx.moveTo(cx, cy + 65); ctx.lineTo(cx - 105, cy + 120); ctx.moveTo(cx, cy + 65); ctx.lineTo(cx + 105, cy + 120); ctx.stroke();
  ctx.strokeStyle = '#df2531'; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(cx - 54, cy - 100); ctx.lineTo(cx - 13, cy - 91); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 82, cy - 143); ctx.lineTo(cx + 119, cy - 175); ctx.moveTo(cx + 107, cy - 126); ctx.lineTo(cx + 151, cy - 129); ctx.moveTo(cx + 76, cy - 174); ctx.lineTo(cx + 76, cy - 214); ctx.stroke();
}

function drawStickmanCover(ctx: CanvasRenderingContext2D, opts: CoverOpts) {
  const top = (opts.coverTitle || opts.title.slice(0, 4) || '认知破局').replace(/\s/g, '').slice(0, 4);
  const subLines = (opts.coverSubtitle || '看清本质\n认知破局').split('\n').map(line => line.trim()).filter(Boolean).slice(0, 2);

  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, COVER_W, COVER_H);

  const titleSize = fitFont(ctx, top, COVER_W - 70, 212);
  ctx.font = `1000 ${titleSize}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = 15; ctx.strokeStyle = '#8f1119'; ctx.strokeText(top, COVER_W / 2 + 4, 220 + 4);
  ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.strokeText(top, COVER_W / 2, 220);
  ctx.fillStyle = '#ffffff'; ctx.fillText(top, COVER_W / 2, 220);

  const lineY = 405;
  const lineGradient = ctx.createLinearGradient(0, lineY, COVER_W, lineY);
  lineGradient.addColorStop(0, 'rgba(255,255,255,.82)'); lineGradient.addColorStop(.5, '#ffffff'); lineGradient.addColorStop(1, 'rgba(255,255,255,.82)');
  ctx.fillStyle = lineGradient;
  ctx.beginPath(); ctx.moveTo(0, lineY - 2); ctx.lineTo(COVER_W * .43, lineY - 3); ctx.lineTo(COVER_W / 2, lineY - 8); ctx.lineTo(COVER_W * .57, lineY - 3); ctx.lineTo(COVER_W, lineY - 2); ctx.lineTo(COVER_W, lineY + 2); ctx.lineTo(COVER_W * .57, lineY + 3); ctx.lineTo(COVER_W / 2, lineY + 8); ctx.lineTo(COVER_W * .43, lineY + 3); ctx.lineTo(0, lineY + 2); ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#fff'; ctx.font = `1000 118px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const lines = subLines.length ? subLines : ['看清本质', '认知破局'];
  lines.forEach((line, index) => {
    const size = fitFont(ctx, line, COVER_W - 180, 118);
    ctx.font = `1000 ${size}px ${font}`; ctx.fillText(line, COVER_W / 2, 575 + index * 145);
  });

  drawCognitionAvatar(ctx);
}

registerCover('stickman', drawStickmanCover);
