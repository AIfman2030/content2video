import type { GeneratedContent, StyleType, ChineseOptions } from '../types/video';
import { getThemeConfig } from './themes';
import { loadShapeImage } from './shapes';
import { CHINESE_SHAPES, CITY_SHAPES, AI_SHAPES } from './themes';

export const CW = 1080;
export const CH = 1920;

// ─── Math Helpers ──────────────────────────────────────────────────────────────
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function hex2rgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}
function hex2rgba(hex: string, a: number) {
  const [r, g, b] = hex2rgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const char of text) {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) { lines.push(line); line = char; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// ─── Timing ────────────────────────────────────────────────────────────────────
const T = {
  bgBloom: 0,
  themeEffect: 200,
  titleEntrance: 800,
  titleSettle: 2000,
  cardBase: 2800,
  cardSlot: 2200,  // ms per card
  cardReadDelay: 400, // extra after last card
  outroStart: 0,  // computed dynamically
  outroDur: 3000,
};

function totalDuration(pts: number) {
  return T.cardBase + pts * T.cardSlot + T.cardReadDelay + T.outroDur;
}

// ─── ──────────────────────────────────────────────────────────────────────────
//                    CHINESE THEME EFFECTS
// ─── ──────────────────────────────────────────────────────────────────────────

interface InkBlob { x: number; y: number; r: number; phase: number; speed: number; opacity: number; }
interface BrushStroke { pts: [number, number][]; width: number; phase: number; }

function initChineseEffects(rand: () => number) {
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

type ChineseEffects = ReturnType<typeof initChineseEffects>;

function drawChineseBg(ctx: CanvasRenderingContext2D, elapsed: number, accent: string, effects: ChineseEffects) {
  const { inkBlobs, brushStrokes, particles } = effects;
  const bloom = Math.min(elapsed / 1000, 1);

  // Base gradient
  const grad = ctx.createLinearGradient(0, 0, 0, CH);
  grad.addColorStop(0, '#06060f');
  grad.addColorStop(0.4, '#0d0d1a');
  grad.addColorStop(1, '#120814');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  // Ink wash blobs (slowly drifting radial gradients)
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

  // Central red glow pulse
  ctx.save();
  const pulse = 0.8 + 0.2 * Math.sin(elapsed * 0.001);
  const cg = ctx.createRadialGradient(CW / 2, CH * 0.38, 0, CW / 2, CH * 0.38, 500 * pulse);
  cg.addColorStop(0, hex2rgba(accent, 0.18 * bloom));
  cg.addColorStop(0.6, hex2rgba(accent, 0.04 * bloom));
  cg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cg;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  // Brush stroke decorations
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

  // Gold streak lines radiating from center
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

  // Floating ash particles
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

  // Horizontal ink bands
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

// ─── ──────────────────────────────────────────────────────────────────────────
//                    CITY THEME EFFECTS
// ─── ──────────────────────────────────────────────────────────────────────────

interface RainDrop { x: number; y: number; len: number; speed: number; alpha: number; }
interface Building { x: number; y: number; w: number; h: number; windows: { x: number; y: number; lit: boolean; phase: number }[]; }
interface SearchLight { x: number; angle: number; speed: number; alpha: number; }

function initCityEffects(rand: () => number) {
  const rain: RainDrop[] = Array.from({ length: 200 }, () => ({
    x: rand() * CW, y: rand() * CH,
    len: 30 + rand() * 60, speed: 12 + rand() * 10,
    alpha: 0.1 + rand() * 0.3,
  }));
  const numBuildings = 18;
  const buildings: Building[] = Array.from({ length: numBuildings }, (_, i) => {
    const w = 40 + rand() * 70;
    const h = 200 + rand() * 600;
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

type CityEffects = ReturnType<typeof initCityEffects>;

function drawCityBg(ctx: CanvasRenderingContext2D, elapsed: number, accent: string, effects: CityEffects) {
  const { rain, buildings, searchLights, particles } = effects;
  const bloom = Math.min(elapsed / 800, 1);

  // Night sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, CH);
  grad.addColorStop(0, '#020810');
  grad.addColorStop(0.5, '#071228');
  grad.addColorStop(0.75, '#0c1a38');
  grad.addColorStop(1, '#020810');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  // Star field
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

  // Search lights
  ctx.save();
  searchLights.forEach(sl => {
    sl.angle += Math.sin(elapsed * sl.speed) * 0.01;
    const sx = sl.x;
    const sy = CH;
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

  // Building silhouettes
  ctx.save();
  const buildReveal = Math.min(elapsed / 600, 1);
  buildings.forEach(b => {
    ctx.fillStyle = `rgba(3,12,28,${buildReveal})`;
    ctx.fillRect(b.x, b.y, b.w, b.h + 10);
    // Window lights
    b.windows.forEach(w => {
      if (!w.lit) return;
      const flicker = 0.6 + 0.4 * Math.sin(elapsed * 0.002 + w.phase);
      ctx.fillStyle = hex2rgba(accent, flicker * 0.5 * buildReveal);
      ctx.fillRect(w.x, w.y, 8, 10);
    });
  });
  // Ground reflection
  const reflGrad = ctx.createLinearGradient(0, CH * 0.85, 0, CH);
  reflGrad.addColorStop(0, 'rgba(0,0,0,0)');
  reflGrad.addColorStop(1, hex2rgba(accent, 0.08 * bloom));
  ctx.fillStyle = reflGrad;
  ctx.fillRect(0, CH * 0.85, CW, CH * 0.15);
  ctx.restore();

  // Rain streaks
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

  // Glowing horizon line
  ctx.save();
  const horizY = CH * 0.62;
  const hg = ctx.createLinearGradient(0, horizY - 2, 0, horizY + 2);
  hg.addColorStop(0, 'rgba(0,0,0,0)');
  hg.addColorStop(0.5, hex2rgba(accent, 0.6 * bloom));
  hg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hg;
  ctx.fillRect(0, horizY - 2, CW, 4);
  ctx.restore();

  // Floating particles (city dust/fireflies)
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

// ─── ──────────────────────────────────────────────────────────────────────────
//                    AI TECH EFFECTS
// ─── ──────────────────────────────────────────────────────────────────────────

const MATRIX_CHARS = '01アイウエオカキクケコサシスセソタチツテト⋮∑∂≈∫∞≡∇∮';

interface MatrixCol { x: number; y: number; speed: number; chars: string[]; len: number; alpha: number; }
interface CircuitNode { x: number; y: number; }
interface CircuitPath { nodes: CircuitNode[]; progress: number; speed: number; phase: number; }
interface HexCell { x: number; y: number; phase: number; }
interface DataStream { x: number; y: number; speed: number; chars: string; alpha: number; }

function initAIEffects(rand: () => number) {
  const matrixCols: MatrixCol[] = Array.from({ length: 32 }, (_, i) => ({
    x: (i / 32) * CW + rand() * (CW / 32),
    y: rand() * CH,
    speed: 2 + rand() * 5,
    len: 8 + rand() * 20,
    alpha: 0.15 + rand() * 0.4,
    chars: Array.from({ length: 25 }, () => MATRIX_CHARS[Math.floor(rand() * MATRIX_CHARS.length)]),
  }));

  // Hexagonal grid cells
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

  // Circuit paths
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

  // Data streams
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

type AIEffects = ReturnType<typeof initAIEffects>;

function drawAIBg(ctx: CanvasRenderingContext2D, elapsed: number, accent: string, accent2: string, effects: AIEffects) {
  const { matrixCols, hexCells, circuitPaths, dataStreams, particles } = effects;
  const bloom = Math.min(elapsed / 800, 1);

  // Deep space gradient
  const grad = ctx.createLinearGradient(0, 0, 0, CH);
  grad.addColorStop(0, '#030308');
  grad.addColorStop(0.4, '#080c18');
  grad.addColorStop(1, '#100828');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  // Hexagonal grid
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
    // Occasional filled hex
    if (Math.sin(h.phase * 3.7) > 0.8) {
      ctx.fillStyle = hex2rgba(accent2, 0.04 * bloom * glow);
      ctx.fill();
    }
  });
  ctx.restore();

  // Circuit paths
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
    // Nodes
    cp.nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = hex2rgba(accent2, 0.5 * bloom);
      ctx.fill();
    });
    ctx.setLineDash([]);
  });
  ctx.restore();

  // Matrix rain
  ctx.save();
  ctx.font = '22px monospace';
  matrixCols.forEach(col => {
    col.y += col.speed;
    if (col.y > CH + col.len * 28) col.y = -100;
    // Shuffle chars occasionally
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

  // Data streams
  ctx.save();
  ctx.font = '18px monospace';
  dataStreams.forEach(ds => {
    ds.y += ds.speed;
    if (ds.y > CH) ds.y = -50;
    ctx.fillStyle = hex2rgba(accent2, ds.alpha * bloom);
    ctx.fillText(ds.chars, ds.x, ds.y);
  });
  ctx.restore();

  // Central glow
  ctx.save();
  const pulse = 0.85 + 0.15 * Math.sin(elapsed * 0.0015);
  const cg = ctx.createRadialGradient(CW / 2, CH * 0.35, 0, CW / 2, CH * 0.35, 600 * pulse);
  cg.addColorStop(0, hex2rgba(accent, 0.25 * bloom));
  cg.addColorStop(0.5, hex2rgba(accent, 0.06 * bloom));
  cg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cg;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  // Scan line sweep
  const scanY = (elapsed * 0.3) % CH;
  ctx.save();
  const sg = ctx.createLinearGradient(0, scanY - 3, 0, scanY + 3);
  sg.addColorStop(0, 'rgba(0,0,0,0)');
  sg.addColorStop(0.5, hex2rgba(accent, 0.35 * bloom));
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(0, scanY - 3, CW, 6);
  ctx.restore();

  // Floating nodes
  ctx.save();
  particles.forEach(p => {
    p.x += p.vx + Math.sin(elapsed * 0.001 + p.phase) * 0.3;
    p.y += p.vy + Math.cos(elapsed * 0.001 + p.phase) * 0.3;
    if (p.x < 0) p.x = CW; if (p.x > CW) p.x = 0;
    if (p.y < 0) p.y = CH; if (p.y > CH) p.y = 0;
    // Node + connection to nearest
    const blink = 0.5 + 0.5 * Math.sin(elapsed * 0.002 + p.phase);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = hex2rgba(accent, p.alpha * bloom * blink);
    ctx.fill();
  });
  ctx.restore();
}

// ─── ──────────────────────────────────────────────────────────────────────────
//                    TITLE RENDERING
// ─── ──────────────────────────────────────────────────────────────────────────

function drawTitle(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  style: StyleType,
) {
  if (elapsed < T.titleEntrance) return;
  const te = elapsed - T.titleEntrance;

  // Typewriter: each char takes 80ms
  const CHAR_MS = 80;
  const typeEnd = content.title.length * CHAR_MS + 400;
  const visibleChars = Math.min(Math.floor(te / CHAR_MS), content.title.length);
  const visibleText = content.title.slice(0, visibleChars);

  // Position: center → header
  const settleStart = T.titleSettle - T.titleEntrance;
  const settleT = clamp((te - typeEnd - 200) / 600, 0, 1);
  const eased = easeOutCubic(settleT);
  const centerY = CH * 0.38;
  const headerY = 200;
  const titleY = lerp(centerY, headerY, eased);
  const fontSize = lerp(86, 60, eased);

  ctx.save();

  // Theme-specific title entrance effect
  if (style === 'chinese') {
    // Red seal circle expands behind title
    if (te < 600) {
      const circleT = easeOutCubic(clamp(te / 400, 0, 1));
      ctx.beginPath();
      ctx.arc(CW / 2, centerY, 250 * circleT, 0, Math.PI * 2);
      ctx.fillStyle = hex2rgba(accent, 0.12 * circleT);
      ctx.fill();
      ctx.strokeStyle = hex2rgba(accent, 0.4 * circleT);
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  } else if (style === 'city') {
    // Spotlight beam scans down, "finding" title
    if (te < 800) {
      const beamY = lerp(-200, centerY, easeOutCubic(clamp(te / 600, 0, 1)));
      const bg2 = ctx.createRadialGradient(CW / 2, beamY, 0, CW / 2, beamY, 350);
      bg2.addColorStop(0, hex2rgba(accent, 0.2));
      bg2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg2;
      ctx.fillRect(0, 0, CW, CH);
    }
  } else {
    // AI: glitch flash
    if (te < 300 && Math.sin(te * 0.08) > 0.3) {
      ctx.fillStyle = hex2rgba(accent, 0.08);
      ctx.fillRect(0, 0, CW, CH);
      // Horizontal glitch bars
      for (let gi = 0; gi < 4; gi++) {
        const gy = centerY - 80 + gi * 40;
        ctx.fillStyle = hex2rgba(accent2, 0.15);
        ctx.fillRect(0, gy, CW, 8);
        ctx.fillStyle = hex2rgba(accent, 0.1);
        ctx.fillRect(Math.random() * 200, gy + 4, CW * 0.7, 4);
      }
    }
  }

  // Title glow shadow
  ctx.shadowColor = hex2rgba(accent, 0.9);
  ctx.shadowBlur = 40 + 20 * Math.sin(elapsed * 0.002);

  // Main title text
  ctx.font = `900 ${fontSize.toFixed(0)}px "Noto Sans SC", "PingFang SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // For AI: glitch offset on individual chars during entrance
  if (style === 'aitech' && settleT < 0.5) {
    const cx = CW / 2 - ctx.measureText(visibleText).width / 2;
    for (let ci = 0; ci < visibleChars; ci++) {
      const char = content.title[ci];
      const glitch = ci === visibleChars - 1 ? (Math.random() - 0.5) * 8 : 0;
      ctx.fillStyle = ci % 3 === 0 ? accent2 : '#ffffff';
      ctx.fillText(char, cx + ctx.measureText(content.title.slice(0, ci)).width + glitch, titleY + glitch * 0.5);
    }
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillText(visibleText, CW / 2, titleY);
  }

  // Cursor
  if (te < typeEnd + 500 && Math.floor(elapsed / 500) % 2 === 0) {
    ctx.shadowBlur = 0;
    ctx.font = `300 ${fontSize.toFixed(0)}px monospace`;
    const tw = ctx.measureText(visibleText).width;
    ctx.fillStyle = accent;
    ctx.fillText('|', CW / 2 + tw / 2 + 10, titleY);
  }

  ctx.shadowBlur = 0;

  // Decorative underline (after settle)
  if (eased > 0.3) {
    const lineAlpha = clamp((eased - 0.3) / 0.7, 0, 1);
    const lineY = titleY + fontSize * 0.6;
    const lineLen = 280 * lineAlpha;
    const lg = ctx.createLinearGradient(CW / 2 - lineLen, lineY, CW / 2 + lineLen, lineY);
    lg.addColorStop(0, 'rgba(0,0,0,0)');
    lg.addColorStop(0.3, hex2rgba(accent, lineAlpha));
    lg.addColorStop(0.7, hex2rgba(accent, lineAlpha));
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = lg;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(CW / 2 - lineLen, lineY);
    ctx.lineTo(CW / 2 + lineLen, lineY);
    ctx.stroke();
    // Diamond accents
    [-lineLen - 12, lineLen + 12].forEach(dx => {
      ctx.save();
      ctx.translate(CW / 2 + dx, lineY);
      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = hex2rgba(accent2, lineAlpha * 0.8);
      ctx.lineWidth = 2;
      ctx.strokeRect(-6, -6, 12, 12);
      ctx.restore();
    });
  }

  // Subtitle tag (after settle)
  if (eased > 0.7) {
    const tagAlpha = clamp((eased - 0.7) / 0.3, 0, 1);
    const tagY = titleY - fontSize * 0.8;
    ctx.font = `400 24px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = hex2rgba(accent, tagAlpha * 0.7);
    ctx.fillText(style === 'chinese' ? '✦ 核心解析 ✦' : style === 'city' ? '▸ INSIGHT REPORT' : '> SYSTEM ANALYSIS', CW / 2, tagY);
  }

  ctx.restore();
}

// ─── ──────────────────────────────────────────────────────────────────────────
//                    CONTENT CARDS
// ─── ──────────────────────────────────────────────────────────────────────────

function drawCards(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  style: StyleType,
) {
  if (elapsed < T.cardBase) return;
  const cardElapsed = elapsed - T.cardBase;

  const cardW = CW - 100;
  const cardH = 230;
  const startY = 320;
  const gap = 252;

  content.points.forEach((point, i) => {
    const cardStart = i * T.cardSlot;
    const te = cardElapsed - cardStart;
    if (te <= 0) return;

    const enterT = clamp(te / 500, 0, 1);
    const eased = easeOutBack(Math.min(enterT, 0.999));
    const cardY = startY + i * gap;
    const cardX = 50;

    ctx.save();
    ctx.globalAlpha = clamp(te / 300, 0, 1);

    // Theme-specific entrance
    let offsetX = 0, offsetY = 0, scaleX = 1, scaleY = 1;
    if (style === 'chinese') {
      offsetX = (1 - eased) * 120;
    } else if (style === 'city') {
      offsetY = (1 - eased) * 80;
    } else {
      // AI: scale + slight glitch
      scaleX = 0.9 + eased * 0.1;
      scaleY = 0.9 + eased * 0.1;
    }

    ctx.translate(cardX + offsetX + cardW / 2, cardY + offsetY + cardH / 2);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-cardW / 2, -cardH / 2);

    // --- Card background ---
    roundRect(ctx, 0, 0, cardW, cardH, 18);

    if (style === 'chinese') {
      // Paper texture gradient
      const bg = ctx.createLinearGradient(0, 0, cardW, cardH);
      bg.addColorStop(0, 'rgba(255,255,255,0.07)');
      bg.addColorStop(1, hex2rgba(accent, 0.08));
      ctx.fillStyle = bg;
    } else if (style === 'city') {
      // Neon glass
      const bg = ctx.createLinearGradient(0, 0, 0, cardH);
      bg.addColorStop(0, hex2rgba(accent, 0.08));
      bg.addColorStop(1, 'rgba(0,0,0,0.2)');
      ctx.fillStyle = bg;
    } else {
      // AI terminal
      ctx.fillStyle = 'rgba(10,20,40,0.7)';
    }
    ctx.fill();

    // Border
    roundRect(ctx, 0, 0, cardW, cardH, 18);
    const borderGrad = ctx.createLinearGradient(0, 0, cardW, cardH);
    borderGrad.addColorStop(0, hex2rgba(accent, 0.7));
    borderGrad.addColorStop(1, hex2rgba(accent2, 0.3));
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- Left decoration ---
    if (style === 'chinese') {
      // Animated brush stroke bar
      const barH = cardH - 40;
      const drawH = barH * eased;
      ctx.fillStyle = accent;
      roundRect(ctx, 0, 20, 6, drawH, 3);
      ctx.fill();
      // Small circle at bottom of bar
      ctx.beginPath();
      ctx.arc(3, 20 + drawH, 8, 0, Math.PI * 2);
      ctx.fillStyle = hex2rgba(accent, 0.5);
      ctx.fill();
    } else if (style === 'city') {
      // Neon line that "lights up"
      const neonGrad = ctx.createLinearGradient(3, 20, 3, cardH - 20);
      neonGrad.addColorStop(0, 'transparent');
      neonGrad.addColorStop(0.5 * eased, accent);
      neonGrad.addColorStop(eased, hex2rgba(accent, 0.3));
      neonGrad.addColorStop(1, 'transparent');
      ctx.strokeStyle = neonGrad;
      ctx.lineWidth = 4;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(3, 20);
      ctx.lineTo(3, cardH - 20);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // AI: Circuit-trace left bar
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.lineDashOffset = -(elapsed * 0.05);
      ctx.beginPath();
      ctx.moveTo(3, 20);
      ctx.lineTo(3, cardH - 20);
      ctx.stroke();
      ctx.setLineDash([]);
      // Corner nodes
      [20, cardH - 20].forEach(ny => {
        ctx.beginPath();
        ctx.arc(3, ny, 5, 0, Math.PI * 2);
        ctx.fillStyle = accent2;
        ctx.shadowColor = accent2;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    }

    // --- Number badge ---
    const badgeX = 55, badgeY = cardH / 2;
    const badgeR = 40;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
    const badgeBg = ctx.createRadialGradient(badgeX, badgeY - 10, 0, badgeX, badgeY, badgeR);
    badgeBg.addColorStop(0, hex2rgba(accent, 0.35));
    badgeBg.addColorStop(1, hex2rgba(accent, 0.1));
    ctx.fillStyle = badgeBg;
    ctx.fill();
    ctx.strokeStyle = hex2rgba(accent, 0.8);
    ctx.lineWidth = 2;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.font = `800 40px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${i + 1}`, badgeX, badgeY);

    // --- Content text ---
    const textX = 115;
    const textAvailW = cardW - textX - 80;

    // Label (large + glowing)
    ctx.shadowColor = hex2rgba(accent, 0.7);
    ctx.shadowBlur = 20;
    ctx.font = `800 52px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = accent;
    ctx.fillText(point.label, textX, cardY - cardY + 72); // relative to card

    ctx.shadowBlur = 0;

    // Short text
    ctx.font = `400 28px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(point.short || '', textX, 118);

    // Desc (wrapped)
    ctx.font = `400 24px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    const descLines = wrapText(ctx, point.desc || '', textAvailW);
    descLines.slice(0, 2).forEach((line, li) => ctx.fillText(line, textX, 158 + li * 30));

    // --- Right decoration ---
    const rdX = cardW - 55, rdY = cardH / 2;
    const pulseR = 30 + 8 * Math.sin(elapsed * 0.003 + i * 1.3);
    ctx.beginPath();
    ctx.arc(rdX, rdY, pulseR, 0, Math.PI * 2);
    ctx.strokeStyle = hex2rgba(accent2, 0.5);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Rotating symbol
    ctx.save();
    ctx.translate(rdX, rdY);
    ctx.rotate((elapsed * 0.001 + i) % (Math.PI * 2));
    ctx.strokeStyle = hex2rgba(accent, 0.6);
    ctx.lineWidth = 2;
    if (style === 'chinese') {
      // Diamond
      ctx.beginPath();
      ctx.moveTo(0, -18); ctx.lineTo(16, 0); ctx.lineTo(0, 18); ctx.lineTo(-16, 0); ctx.closePath();
      ctx.stroke();
    } else if (style === 'city') {
      // Star of David-ish
      for (let tri = 0; tri < 2; tri++) {
        ctx.beginPath();
        for (let v = 0; v < 3; v++) {
          const a = (v / 3) * Math.PI * 2 + tri * (Math.PI / 3);
          if (v === 0) ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 16); else ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16);
        }
        ctx.closePath();
        ctx.stroke();
      }
    } else {
      // Hexagon
      ctx.beginPath();
      for (let v = 0; v < 6; v++) {
        const a = (v / 6) * Math.PI * 2;
        if (v === 0) ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18); else ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 18);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();

    // Top-right corner accent
    if (eased > 0.6) {
      const ca = clamp((eased - 0.6) / 0.4, 0, 1);
      ctx.strokeStyle = hex2rgba(accent, ca * 0.6);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cardW - 30, 8); ctx.lineTo(cardW - 8, 8); ctx.lineTo(cardW - 8, 30);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(30, cardH - 8); ctx.lineTo(8, cardH - 8); ctx.lineTo(8, cardH - 30);
      ctx.stroke();
    }

    ctx.restore();
  });
}

// ─── ──────────────────────────────────────────────────────────────────────────
//                    OUTRO
// ─── ──────────────────────────────────────────────────────────────────────────

function drawOutro(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  style: StyleType,
) {
  const t = clamp(elapsed / 800, 0, 1);
  const eased = easeInOutQuad(t);

  // Dark overlay
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${eased * 0.6})`;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  // Accent overlay
  ctx.save();
  ctx.fillStyle = hex2rgba(accent, eased * 0.08);
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  if (elapsed < 200) return;
  const contentT = clamp((elapsed - 200) / 800, 0, 1);
  const contentEased = easeOutCubic(contentT);

  // Title reappear
  ctx.save();
  ctx.globalAlpha = contentEased;
  ctx.shadowColor = hex2rgba(accent, 0.9);
  ctx.shadowBlur = 50;
  ctx.font = `900 72px "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(content.title, CW / 2, CH / 2 - 90);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Theme seal / badge
  ctx.save();
  ctx.globalAlpha = contentEased;
  const sealY = CH / 2;

  if (style === 'chinese') {
    // Red seal stamp with bounce
    const bounceT = clamp((elapsed - 500) / 400, 0, 1);
    const bounceS = easeOutBack(bounceT);
    ctx.save();
    ctx.translate(CW / 2, sealY);
    ctx.scale(bounceS, bounceS);
    ctx.beginPath();
    ctx.arc(0, 0, 70, 0, Math.PI * 2);
    ctx.fillStyle = hex2rgba(accent, 0.9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = `700 28px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('印', 0, 0);
    // Shine effect
    const shineT = clamp((elapsed - 700) / 300, 0, 1);
    if (shineT < 1) {
      const sg = ctx.createLinearGradient(-80, -80, 80, 80);
      sg.addColorStop(0, 'rgba(255,255,255,0)');
      sg.addColorStop(0.5, `rgba(255,255,255,${(1 - shineT) * 0.6})`);
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(0, 0, 70, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (style === 'city') {
    // Skyline silhouette banner
    ctx.strokeStyle = hex2rgba(accent, 0.8);
    ctx.lineWidth = 2;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 15;
    const skyPoints = [0.1, 0.3, 0.5, 0.4, 0.7, 0.9, 0.6, 0.5, 0.8, 1.0, 0.7, 0.5, 0.4, 0.6, 0.3, 0.5, 0.2, 0.4];
    const skyW = 500, skyH = 80;
    ctx.beginPath();
    skyPoints.forEach((h, idx) => {
      const sx = CW / 2 - skyW / 2 + idx * (skyW / skyPoints.length);
      const sy = sealY + 30 - h * skyH;
      if (idx === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    });
    ctx.lineTo(CW / 2 + skyW / 2, sealY + 30);
    ctx.lineTo(CW / 2 - skyW / 2, sealY + 30);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = hex2rgba(accent, 0.1);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    // AI: hexagonal "complete" badge
    const bounceT = clamp((elapsed - 400) / 400, 0, 1);
    const bounceS = easeOutBack(bounceT);
    ctx.save();
    ctx.translate(CW / 2, sealY);
    ctx.scale(bounceS, bounceS);
    ctx.beginPath();
    for (let v = 0; v < 6; v++) {
      const a = (v / 6) * Math.PI * 2 - Math.PI / 6;
      if (v === 0) ctx.moveTo(Math.cos(a) * 70, Math.sin(a) * 70); else ctx.lineTo(Math.cos(a) * 70, Math.sin(a) * 70);
    }
    ctx.closePath();
    ctx.fillStyle = hex2rgba(accent, 0.2);
    ctx.fill();
    ctx.strokeStyle = hex2rgba(accent, 0.9);
    ctx.lineWidth = 3;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.font = `600 22px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = accent2;
    ctx.fillText('✓ DONE', 0, 0);
    ctx.restore();
  }
  ctx.restore();

  // Tagline
  if (elapsed > 600) {
    const tagT = clamp((elapsed - 600) / 600, 0, 1);
    ctx.save();
    ctx.globalAlpha = easeOutCubic(tagT);
    ctx.font = `300 30px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText('— 小福AI自由 —', CW / 2, CH / 2 + 100);
    ctx.restore();
  }

  // Points summary (bottom)
  if (elapsed > 900) {
    const sumT = clamp((elapsed - 900) / 600, 0, 1);
    ctx.save();
    ctx.globalAlpha = easeOutCubic(sumT) * 0.7;
    content.points.forEach((p, i) => {
      const sx = CW / 2 - (content.points.length * 100) / 2 + i * 100 + 50;
      const sy = CH / 2 + 200;
      ctx.beginPath();
      ctx.arc(sx, sy, 30, 0, Math.PI * 2);
      ctx.fillStyle = hex2rgba(accent, 0.25);
      ctx.fill();
      ctx.strokeStyle = hex2rgba(accent, 0.6);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = `700 22px "Noto Sans SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(`${i + 1}`, sx, sy);
    });
    ctx.restore();
  }
}

// ─── ──────────────────────────────────────────────────────────────────────────
//                    WATERMARK + FRAME OVERLAYS
// ─── ──────────────────────────────────────────────────────────────────────────

function drawOverlays(ctx: CanvasRenderingContext2D, elapsed: number, accent: string, style: StyleType) {
  // Vignette
  ctx.save();
  const vg = ctx.createRadialGradient(CW / 2, CH / 2, CH * 0.3, CW / 2, CH / 2, CH * 0.8);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  // AI scan line CRT overlay
  if (style === 'aitech') {
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let sy = 0; sy < CH; sy += 4) {
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fillRect(0, sy, CW, 2);
    }
    ctx.restore();
  }

  // Watermark
  ctx.save();
  ctx.font = `400 22px "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = hex2rgba(accent, 0.28);
  ctx.fillText('@小福AI自由', CW - 40, CH - 50);
  ctx.restore();

  // Top progress bar
  const prog = Math.min(elapsed / 3000, 1);
  ctx.save();
  ctx.fillStyle = hex2rgba(accent, 0.15);
  ctx.fillRect(0, 0, CW * prog, 4);
  ctx.restore();
}

// ─── ──────────────────────────────────────────────────────────────────────────
//                    SHAPE DECORATION
// ─── ──────────────────────────────────────────────────────────────────────────

function drawShapeDecoration(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  img: HTMLImageElement,
  accent: string,
  style: StyleType,
) {
  const bloom = Math.min(elapsed / 1200, 1);
  ctx.save();

  if (style === 'city') {
    // City skyline — large, bottom portion
    const sz = 800;
    const x = (CW - sz) / 2;
    const y = CH * 0.58;
    ctx.globalAlpha = bloom * 0.55;
    ctx.drawImage(img, x, y, sz, sz);
  } else if (style === 'aitech') {
    // AI shape — centered, pulsing + secondary ghost
    const wave = Math.sin(elapsed * 0.001) * 15;
    const sz = 480;
    const x = (CW - sz) / 2;
    const y = CH * 0.56 + wave;
    ctx.globalAlpha = bloom * 0.22;
    ctx.drawImage(img, x, y, sz, sz);
    // Ghost layer slightly bigger
    ctx.globalAlpha = bloom * 0.08;
    ctx.drawImage(img, x - 20, y + 10, sz + 40, sz + 40);
  } else {
    // Chinese — bottom third, gentle float
    const wave = Math.sin(elapsed * 0.0008) * 8;
    const sz = 500;
    const x = (CW - sz) / 2;
    const y = CH * 0.57 + wave;
    ctx.globalAlpha = bloom * 0.28;
    ctx.drawImage(img, x, y, sz, sz);
    // Mirrored ghosted reflection
    ctx.save();
    ctx.translate(CW / 2, y + sz / 2);
    ctx.scale(1, -0.3);
    ctx.globalAlpha = bloom * 0.06;
    ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz);
    ctx.restore();
  }
  ctx.restore();
}

// ─── ──────────────────────────────────────────────────────────────────────────
//                    PUBLIC ENGINE
// ─── ──────────────────────────────────────────────────────────────────────────

export interface AnimEngine {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
  getTotalMs: () => number;
}

export async function createAnimEngine(
  canvas: HTMLCanvasElement,
  content: GeneratedContent,
  style: StyleType,
  coverIndex: number,
  chineseOptions?: ChineseOptions,
  onComplete?: () => void,
): Promise<AnimEngine> {
  const theme = getThemeConfig(style, chineseOptions);

  // Deterministic init
  const rand = seededRandom(coverIndex * 31 + content.points.length * 17 + 7);

  const shapeList = style === 'chinese' ? CHINESE_SHAPES
    : style === 'city' ? CITY_SHAPES : AI_SHAPES;
  const shapeId = shapeList[coverIndex % shapeList.length]?.id ?? shapeList[0].id;

  const shapeColor = style === 'city' ? '#f5d87a'
    : style === 'aitech' ? theme.accent : theme.accent;
  const lineWidth = style === 'chinese' ? (chineseOptions?.lineWidth ?? 2) : 1.5;

  const shapeImg = await loadShapeImage(style, shapeId, shapeColor, lineWidth);

  // Theme-specific effect data (initialized once)
  const chineseEffects = style === 'chinese' ? initChineseEffects(rand) : null;
  const cityEffects = style === 'city' ? initCityEffects(rand) : null;
  const aiEffects = style === 'aitech' ? initAIEffects(rand) : null;

  const ctx = canvas.getContext('2d')!;
  const total = totalDuration(content.points.length);
  let rafId = 0, startTime = 0, running = false;

  function render(elapsed: number) {
    ctx.clearRect(0, 0, CW, CH);

    // Background
    if (style === 'chinese' && chineseEffects) {
      drawChineseBg(ctx, elapsed, theme.accent, chineseEffects);
    } else if (style === 'city' && cityEffects) {
      drawCityBg(ctx, elapsed, theme.accent, cityEffects);
    } else if (style === 'aitech' && aiEffects) {
      drawAIBg(ctx, elapsed, theme.accent, theme.accent2, aiEffects);
    }

    // Shape decoration
    drawShapeDecoration(ctx, elapsed, shapeImg, theme.accent, style);

    // Title
    drawTitle(ctx, elapsed, content, theme.accent, theme.accent2, style);

    // Cards
    drawCards(ctx, elapsed, content, theme.accent, theme.accent2, style);

    // Outro
    const outroStart = T.cardBase + content.points.length * T.cardSlot + T.cardReadDelay;
    if (elapsed > outroStart) {
      drawOutro(ctx, elapsed - outroStart, content, theme.accent, theme.accent2, style);
    }

    // Frame overlays
    drawOverlays(ctx, elapsed, theme.accent, style);
  }

  function tick(now: number) {
    if (!running) return;
    const elapsed = now - startTime;
    render(elapsed);
    if (elapsed < total) {
      rafId = requestAnimationFrame(tick);
    } else {
      running = false;
      render(total);
      onComplete?.();
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
      startTime = performance.now();
      rafId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
    isRunning: () => running,
    getTotalMs: () => total,
  };
}
