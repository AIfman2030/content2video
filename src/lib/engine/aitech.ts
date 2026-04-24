import { CW, CH, hex2rgba } from './helpers';

const MATRIX_CHARS = '01アイウエオカキクケコサシスセソタチツテト⋮∑∂≈∫∞≡∇∮';

interface MatrixCol { x: number; y: number; speed: number; chars: string[]; len: number; alpha: number; }
interface CircuitNode { x: number; y: number; }
interface CircuitPath { nodes: CircuitNode[]; progress: number; speed: number; phase: number; }
interface HexCell { x: number; y: number; phase: number; }
interface DataStream { x: number; y: number; speed: number; chars: string; alpha: number; }

export function initAIEffects(rand: () => number) {
  const matrixCols: MatrixCol[] = Array.from({ length: 32 }, (_, i) => ({
    x: (i / 32) * CW + rand() * (CW / 32),
    y: rand() * CH,
    speed: 2 + rand() * 5,
    len: 8 + rand() * 20,
    alpha: 0.15 + rand() * 0.4,
    chars: Array.from({ length: 25 }, () => MATRIX_CHARS[Math.floor(rand() * MATRIX_CHARS.length)]),
  }));

  const hexCells: HexCell[] = [];
  const hexSize = 55;
  for (let row = 0; row < 14; row++) {
    for (let col = 0; col < 10; col++) {
      hexCells.push({
        x: col * hexSize * 1.8 + (row % 2) * hexSize * 0.9 + 40,
        y: row * hexSize * 1.55 + 200,
        phase: rand() * Math.PI * 2,
      });
    }
  }

  const circuitPaths: CircuitPath[] = Array.from({ length: 20 }, () => {
    const startX = rand() * CW, startY = rand() * CH;
    const numNodes = 3 + Math.floor(rand() * 5);
    const nodes: CircuitNode[] = [{ x: startX, y: startY }];
    for (let i = 1; i < numNodes; i++) {
      const last = nodes[i - 1];
      if (rand() > 0.5) nodes.push({ x: last.x + (rand() - 0.5) * 300, y: last.y });
      else nodes.push({ x: last.x, y: last.y + (rand() - 0.5) * 300 });
    }
    return { nodes, progress: 0, speed: 0.0003 + rand() * 0.0006, phase: rand() * Math.PI * 2 };
  });

  const dataStreams: DataStream[] = Array.from({ length: 12 }, () => ({
    x: rand() * CW, y: rand() * CH,
    speed: 1 + rand() * 2,
    chars: Array.from({ length: 8 }, () => '0123456789ABCDEF'[Math.floor(rand() * 16)]).join(''),
    alpha: 0.15 + rand() * 0.3,
  }));

  const particles = Array.from({ length: 60 }, () => ({
    x: rand() * CW, y: rand() * CH,
    vx: (rand() - 0.5) * 0.6, vy: (rand() - 0.5) * 0.6,
    r: 1 + rand() * 3, alpha: 0.3 + rand() * 0.5, phase: rand() * Math.PI * 2,
  }));
  return { matrixCols, hexCells, circuitPaths, dataStreams, particles };
}

export type AIEffects = ReturnType<typeof initAIEffects>;

export function drawAIBg(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  accent: string,
  accent2: string,
  effects: AIEffects,
) {
  const { matrixCols, hexCells, circuitPaths, dataStreams, particles } = effects;
  const bloom = Math.min(elapsed / 800, 1);

  const grad = ctx.createLinearGradient(0, 0, 0, CH);
  grad.addColorStop(0, '#030308');
  grad.addColorStop(0.4, '#080c18');
  grad.addColorStop(1, '#100828');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  ctx.save();
  hexCells.forEach(h => {
    const glow = 0.3 + 0.7 * Math.abs(Math.sin(elapsed * 0.001 + h.phase));
    const size = 50;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
      const x = h.x + size * Math.cos(angle);
      const y = h.y + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = hex2rgba(accent, glow * 0.12 * bloom);
    ctx.lineWidth = 1;
    ctx.stroke();
    if (Math.sin(h.phase * 3.7) > 0.8) {
      ctx.fillStyle = hex2rgba(accent2, 0.04 * bloom * glow);
      ctx.fill();
    }
  });
  ctx.restore();

  ctx.save();
  circuitPaths.forEach(cp => {
    cp.progress = (cp.progress + cp.speed) % 1.5;
    const alpha = 0.2 + 0.2 * Math.sin(elapsed * 0.0008 + cp.phase);
    ctx.strokeStyle = hex2rgba(accent, alpha * bloom);
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([8, 4]);
    ctx.lineDashOffset = -elapsed * 0.05;
    ctx.beginPath();
    cp.nodes.forEach((n, i) => i === 0 ? ctx.moveTo(n.x, n.y) : ctx.lineTo(n.x, n.y));
    ctx.stroke();
    cp.nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = hex2rgba(accent2, 0.5 * bloom);
      ctx.fill();
    });
    ctx.setLineDash([]);
  });
  ctx.restore();

  ctx.save();
  ctx.font = '22px monospace';
  matrixCols.forEach(col => {
    col.y += col.speed;
    if (col.y > CH + col.len * 28) col.y = -100;
    if (Math.random() < 0.01) {
      const idx = Math.floor(Math.random() * col.chars.length);
      col.chars[idx] = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
    }
    for (let i = 0; i < col.len; i++) {
      const fy = col.y - i * 28;
      if (fy < 0 || fy > CH) continue;
      const fade = (col.len - i) / col.len;
      const isHead = i === 0;
      ctx.fillStyle = isHead
        ? `rgba(255,255,255,${col.alpha * bloom})`
        : hex2rgba(i < 2 ? accent2 : accent, fade * col.alpha * bloom * 0.7);
      ctx.fillText(col.chars[i % col.chars.length], col.x, fy);
    }
  });
  ctx.restore();

  ctx.save();
  ctx.font = '18px monospace';
  dataStreams.forEach(ds => {
    ds.y += ds.speed;
    if (ds.y > CH) ds.y = -50;
    ctx.fillStyle = hex2rgba(accent2, ds.alpha * bloom);
    ctx.fillText(ds.chars, ds.x, ds.y);
  });
  ctx.restore();

  ctx.save();
  const pulse = 0.85 + 0.15 * Math.sin(elapsed * 0.0015);
  const cg = ctx.createRadialGradient(CW / 2, CH * 0.35, 0, CW / 2, CH * 0.35, 600 * pulse);
  cg.addColorStop(0, hex2rgba(accent, 0.25 * bloom));
  cg.addColorStop(0.5, hex2rgba(accent, 0.06 * bloom));
  cg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cg;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  const scanY = (elapsed * 0.3) % CH;
  ctx.save();
  const sg = ctx.createLinearGradient(0, scanY - 3, 0, scanY + 3);
  sg.addColorStop(0, 'rgba(0,0,0,0)');
  sg.addColorStop(0.5, hex2rgba(accent, 0.35 * bloom));
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(0, scanY - 3, CW, 6);
  ctx.restore();

  ctx.save();
  particles.forEach(p => {
    p.x += p.vx + Math.sin(elapsed * 0.001 + p.phase) * 0.3;
    p.y += p.vy + Math.cos(elapsed * 0.001 + p.phase) * 0.3;
    if (p.x < 0) p.x = CW; if (p.x > CW) p.x = 0;
    if (p.y < 0) p.y = CH; if (p.y > CH) p.y = 0;
    const blink = 0.5 + 0.5 * Math.sin(elapsed * 0.002 + p.phase);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = hex2rgba(accent, p.alpha * bloom * blink);
    ctx.fill();
  });
  ctx.restore();
}
