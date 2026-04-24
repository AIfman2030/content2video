import { CW, CH, clamp, hex2rgba } from './helpers';

interface InkBlob { x: number; y: number; r: number; phase: number; speed: number; opacity: number; }
interface BrushStroke { pts: [number, number][]; width: number; phase: number; }

export function initChineseEffects(rand: () => number) {
  const inkBlobs: InkBlob[] = Array.from({ length: 8 }, () => ({
    x: rand() * CW, y: rand() * CH,
    r: 200 + rand() * 400,
    phase: rand() * Math.PI * 2,
    speed: 0.0003 + rand() * 0.0005,
    opacity: 0.04 + rand() * 0.08,
  }));
  const brushStrokes: BrushStroke[] = Array.from({ length: 12 }, () => {
    const sx = rand() * CW, sy = rand() * CH;
    const len = 150 + rand() * 300;
    const angle = rand() * Math.PI;
    const pts: [number, number][] = Array.from({ length: 5 }, (_, i) => [
      sx + Math.cos(angle + (rand() - 0.5) * 0.5) * len * (i / 4),
      sy + Math.sin(angle + (rand() - 0.5) * 0.5) * len * (i / 4),
    ]);
    return { pts, width: 2 + rand() * 6, phase: rand() * Math.PI * 2 };
  });
  const particles = Array.from({ length: 60 }, () => ({
    x: rand() * CW, y: rand() * CH,
    vx: (rand() - 0.5) * 0.5, vy: -0.2 - rand() * 0.5,
    r: 1 + rand() * 3, alpha: 0.2 + rand() * 0.5,
    phase: rand() * Math.PI * 2,
  }));
  return { inkBlobs, brushStrokes, particles };
}

export type ChineseEffects = ReturnType<typeof initChineseEffects>;

export function drawChineseBg(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  accent: string,
  effects: ChineseEffects,
) {
  const { inkBlobs, brushStrokes, particles } = effects;
  const bloom = Math.min(elapsed / 1000, 1);

  const grad = ctx.createLinearGradient(0, 0, 0, CH);
  grad.addColorStop(0, '#06060f');
  grad.addColorStop(0.4, '#0d0d1a');
  grad.addColorStop(1, '#120814');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  ctx.save();
  inkBlobs.forEach(b => {
    const ox = Math.sin(elapsed * b.speed + b.phase) * 80;
    const oy = Math.cos(elapsed * b.speed * 0.7 + b.phase) * 60;
    const g = ctx.createRadialGradient(b.x + ox, b.y + oy, 0, b.x + ox, b.y + oy, b.r);
    g.addColorStop(0, hex2rgba(accent, b.opacity * bloom * 2));
    g.addColorStop(0.5, hex2rgba(accent, b.opacity * bloom * 0.5));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CW, CH);
  });
  ctx.restore();

  ctx.save();
  const pulse = 0.8 + 0.2 * Math.sin(elapsed * 0.001);
  const cg = ctx.createRadialGradient(CW / 2, CH * 0.38, 0, CW / 2, CH * 0.38, 500 * pulse);
  cg.addColorStop(0, hex2rgba(accent, 0.18 * bloom));
  cg.addColorStop(0.6, hex2rgba(accent, 0.04 * bloom));
  cg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cg;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  ctx.save();
  brushStrokes.forEach(s => {
    const t = clamp((elapsed - 600) / 1200, 0, 1);
    const wave = 0.3 + 0.3 * Math.sin(elapsed * 0.0008 + s.phase);
    ctx.globalAlpha = t * wave * 0.35;
    ctx.strokeStyle = hex2rgba(accent, 1);
    ctx.lineWidth = s.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    s.pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.stroke();
  });
  ctx.restore();

  ctx.save();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + elapsed * 0.0002;
    const len = 400 + 100 * Math.sin(elapsed * 0.001 + i);
    const lineGrad = ctx.createLinearGradient(
      CW / 2, CH * 0.38,
      CW / 2 + Math.cos(angle) * len, CH * 0.38 + Math.sin(angle) * len,
    );
    lineGrad.addColorStop(0, hex2rgba(accent, 0.12 * bloom));
    lineGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(CW / 2, CH * 0.38);
    ctx.lineTo(CW / 2 + Math.cos(angle) * len, CH * 0.38 + Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  particles.forEach(p => {
    p.x += p.vx + Math.sin(elapsed * 0.001 + p.phase) * 0.3;
    p.y += p.vy;
    if (p.y < -10) p.y = CH + 10;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * (1 + 0.3 * Math.sin(elapsed * 0.002 + p.phase)), 0, Math.PI * 2);
    ctx.fillStyle = hex2rgba(accent, p.alpha * bloom);
    ctx.fill();
  });
  ctx.restore();

  ctx.save();
  for (let i = 0; i < 3; i++) {
    const y = CH * (0.35 + i * 0.22) + Math.sin(elapsed * 0.0005 + i * 2) * 20;
    ctx.strokeStyle = hex2rgba(accent, 0.06 * bloom);
    ctx.lineWidth = 40 + 20 * i;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CW, y);
    ctx.stroke();
  }
  ctx.restore();
}
