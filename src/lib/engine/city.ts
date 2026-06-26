import { CW, CH, hex2rgba } from './helpers';

interface RainDrop { x: number; y: number; len: number; speed: number; alpha: number; }
interface Building {
  x: number; y: number; w: number; h: number;
  windows: { x: number; y: number; lit: boolean; phase: number }[];
}
interface SearchLight { x: number; angle: number; speed: number; alpha: number; }

export function initCityEffects(rand: () => number) {
  const rain: RainDrop[] = Array.from({ length: 200 }, () => ({
    x: rand() * CW, y: rand() * CH,
    len: 30 + rand() * 60, speed: 12 + rand() * 10,
    alpha: 0.1 + rand() * 0.3,
  }));
  const numBuildings = 24;
  const buildings: Building[] = Array.from({ length: numBuildings }, (_, i) => {
    const w = 40 + rand() * 70;
    const h = 120 + rand() * 420;
    const x = (i / numBuildings) * CW + rand() * 20;
    const y = CH - h;
    const winCols = Math.max(1, Math.floor(w / 20));
    const winRows = Math.max(1, Math.floor(h / 25));
    const windows = Array.from({ length: winCols * winRows }, (_, wi) => ({
      x: x + (wi % winCols) * (w / winCols) + 4,
      y: y + Math.floor(wi / winCols) * 25 + 5,
      lit: rand() > 0.4,
      phase: rand() * Math.PI * 2,
    }));
    return { x, y, w, h, windows };
  });
  const searchLights: SearchLight[] = Array.from({ length: 3 }, (_, i) => ({
    x: CW * (0.2 + i * 0.3), angle: Math.PI * 1.4 + (rand() - 0.5) * 0.4,
    speed: 0.0003 + rand() * 0.0002, alpha: 0.08 + rand() * 0.06,
  }));
  const particles = Array.from({ length: 80 }, () => ({
    x: rand() * CW, y: rand() * CH,
    vx: (rand() - 0.5) * 0.3, vy: -0.1 - rand() * 0.3,
    r: 1 + rand() * 2, alpha: 0.3 + rand() * 0.5, phase: rand() * Math.PI * 2,
  }));
  return { rain, buildings, searchLights, particles };
}

export type CityEffects = ReturnType<typeof initCityEffects>;

export function drawCityBg(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  accent: string,
  effects: CityEffects,
) {
  const { rain, buildings, searchLights, particles } = effects;
  const bloom = Math.min(elapsed / 800, 1);

  const grad = ctx.createLinearGradient(0, 0, 0, CH);
  grad.addColorStop(0, '#020810');
  grad.addColorStop(0.5, '#071228');
  grad.addColorStop(0.75, '#0c1a38');
  grad.addColorStop(1, '#020810');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  ctx.save();
  for (let i = 0; i < 80; i++) {
    const sx = ((i * 137.5) % 1) * CW;
    const sy = ((i * 73.3) % 0.5) * CH;
    const blink = 0.3 + 0.7 * Math.abs(Math.sin(elapsed * 0.001 + i * 0.7));
    ctx.beginPath();
    ctx.arc(sx, sy, 1 + (i % 3) * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${blink * 0.7 * bloom})`;
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  searchLights.forEach(sl => {
    sl.angle += Math.sin(elapsed * sl.speed) * 0.01;
    const sx = sl.x, sy = CH;
    const ex = sx + Math.cos(sl.angle) * 2000;
    const ey = sy + Math.sin(sl.angle) * 2000;
    const lg = ctx.createLinearGradient(sx, sy, ex, ey);
    lg.addColorStop(0, hex2rgba(accent, sl.alpha * bloom * 0.9));
    lg.addColorStop(0.3, hex2rgba(accent, sl.alpha * bloom * 0.3));
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = lg;
    ctx.lineWidth = 80;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  });
  ctx.restore();

  ctx.save();
  const buildReveal = Math.min(elapsed / 600, 1);
  buildings.forEach(b => {
    ctx.fillStyle = `rgba(3,12,28,${buildReveal})`;
    ctx.fillRect(b.x, b.y, b.w, b.h + 10);
    b.windows.forEach(w => {
      if (!w.lit) return;
      const flicker = 0.6 + 0.4 * Math.sin(elapsed * 0.002 + w.phase);
      ctx.fillStyle = hex2rgba(accent, flicker * 0.5 * buildReveal);
      ctx.fillRect(w.x, w.y, 8, 10);
    });
  });
  const reflGrad = ctx.createLinearGradient(0, CH * 0.85, 0, CH);
  reflGrad.addColorStop(0, 'rgba(0,0,0,0)');
  reflGrad.addColorStop(1, hex2rgba(accent, 0.08 * bloom));
  ctx.fillStyle = reflGrad;
  ctx.fillRect(0, CH * 0.85, CW, CH * 0.15);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = hex2rgba(accent, 0.15);
  ctx.lineWidth = 1;
  rain.forEach(drop => {
    drop.y += drop.speed;
    if (drop.y > CH) { drop.y = -drop.len; drop.x = Math.random() * CW; }
    ctx.globalAlpha = drop.alpha * bloom;
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x - 2, drop.y + drop.len);
    ctx.stroke();
  });
  ctx.restore();

  ctx.save();
  const horizY = CH * 0.62;
  const hg = ctx.createLinearGradient(0, horizY - 2, 0, horizY + 2);
  hg.addColorStop(0, 'rgba(0,0,0,0)');
  hg.addColorStop(0.5, hex2rgba(accent, 0.6 * bloom));
  hg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hg;
  ctx.fillRect(0, horizY - 2, CW, 4);
  ctx.restore();

  ctx.save();
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.y < 0) p.y = CH;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = hex2rgba(accent, p.alpha * bloom * (0.5 + 0.5 * Math.sin(elapsed * 0.002 + p.phase)));
    ctx.fill();
  });
  ctx.restore();
}
