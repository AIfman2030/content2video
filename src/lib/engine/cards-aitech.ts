/**
 * cards-aitech.ts — AI Tech style 4-phase animation (v3)
 *
 * Phase 1  (T.cardBase + n×900ms):       Keywords appear radially, scan line from center, border draws L→R
 * Phase 1b (+n×650ms):                   Short sentences appear one by one at keyword positions
 * Phase 2  (+600ms burst):               Shatter / flash / wipe transition
 * Phase 3  (+n×800ms):                   Keyword boxed list (left) + desc typewriter (right)
 * Phase 4  (+grid appear + hold + explode): Grid finale
 */
import type { GeneratedContent, PolyShape, AItechOptions } from '../../types/video';
import {
  CW, CH, clamp, easeOutBack, easeOutCubic, lerp, hex2rgba,
  wrapText, T, AT, aiTechPhases,
} from './helpers';

const CX = CW / 2, CY = CH / 2;
const RADIAL_R  = 380;   // distance center → label anchor
const NODE_R    = RADIAL_R - 32;  // distance center → circle node
const INNER_R   = 165;  // inner edge of connector line

// ── Resolved options ───────────────────────────────────────────────────────────
function resolveOpts(o?: AItechOptions, accent = '#a855f7') {
  return {
    centerPattern:  o?.centerPattern      ?? 'random',
    radialFsz:      o?.radialFontSize     ?? 50,
    radialClr:      o?.radialColor        || '#ffffff',
    radialNumClr:   o?.radialNumberColor  || accent,
    burstFx:        o?.burstTransition    ?? 'shatter',
    kwBoxFsz:       o?.kwBoxFontSize      ?? 62,
    kwBoxClr:       o?.kwBoxColor         || '#ffffff',
    kwBoxBorderClr: o?.kwBoxBorderColor   || accent,
    kwBoxBW:        o?.kwBoxBorderWidth   ?? 3,
    kwBoxBR:        o?.kwBoxBorderRadius  ?? 16,
    kwBoxBgA:       o?.kwBoxBgAlpha       ?? 0,
    descFsz:        o?.descFontSize       ?? 42,
    descClr:        o?.descColor          || 'rgba(220,220,220,0.92)',
    descEnter:      o?.descEnterEffect    ?? 'typewriter',
    gridEnter:      o?.gridCellEnterEffect ?? 'zoomIn',
    gridExplode:    o?.gridExplosionStyle  ?? 'burst',
    gridKwFsz:      o?.gridKeywordFontSize ?? 72,
    gridShortFsz:   o?.gridShortFontSize   ?? 38,
    gridKwClr:      o?.gridKeywordColor    || '#ffffff',
    gridShortClr:   o?.gridShortColor      || 'rgba(200,200,200,0.9)',
    gridBorderClr:  o?.gridBorderColor     || accent,
    gridNumClr:     o?.gridNumColor        || accent,
  };
}

// ── Seeded pseudo-random ───────────────────────────────────────────────────────
function sf(seed: number) {
  return (((Math.sin(seed * 0.9999) * 43758.5) % 1) + 1) % 1;
}

// ── Radial keyword positions ───────────────────────────────────────────────────
function labelPos(i: number, n: number) {
  const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
  return {
    cx: CX + Math.cos(angle) * RADIAL_R,
    cy: CY + Math.sin(angle) * RADIAL_R,
    nx: CX + Math.cos(angle) * NODE_R,
    ny: CY + Math.sin(angle) * NODE_R,
    angle,
  };
}

// ── Grid auto-sizing ──────────────────────────────────────────────────────────
function autoCols(n: number) {
  if (n <= 3) return n;
  if (n === 4) return 2;
  if (n <= 6) return 3;
  if (n <= 8) return 4;
  if (n === 9) return 3;
  if (n <= 10) return 5;
  return 4;
}

interface GridCell { cx: number; cy: number; w: number; h: number; }

function computeGrid(n: number): GridCell[] {
  const cols = autoCols(n);
  const rows = Math.ceil(n / cols);
  const PX   = 28, PY = 28;
  const GT   = 160, NH = 40;
  const cellW = Math.floor((CW - PX * (cols + 1)) / cols);
  const cellH = Math.floor((CH - GT - PY * (rows + 1) - NH * rows - 60) / rows);
  return Array.from({ length: n }, (_, i) => ({
    cx: PX + (i % cols) * (cellW + PX) + cellW / 2,
    cy: GT + NH + PY + Math.floor(i / cols) * (cellH + PY + NH) + cellH / 2,
    w: cellW, h: cellH,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// CENTER PATTERNS (14 total)
// ═══════════════════════════════════════════════════════════════════════════════

const ALL_PATTERNS = ['arc', 'rings', 'spiral', 'neuron', 'dna', 'atom', 'compass', 'radar', 'hexgrid', 'sunburst', 'vortex', 'crystal', 'eye', 'infinity'];

function pickPattern(n: number, opt: string): string {
  if (opt !== 'random') return opt;
  return ALL_PATTERNS[n % ALL_PATTERNS.length];
}

type DC = CanvasRenderingContext2D;
type PFn = (ctx: DC, t: number, cx: number, cy: number, r: number, a: string, a2: string, al: number) => void;

const pat_arc: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al;
  const rot = t * 0.00025, rot2 = -t * 0.0004;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  ctx.shadowColor = a; ctx.shadowBlur = 32; ctx.strokeStyle = a; ctx.lineWidth = r * 0.28; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.75, 0.3, Math.PI * 2 - 0.3); ctx.stroke();
  ctx.shadowBlur = 0; ctx.restore();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot2);
  ctx.shadowColor = a2; ctx.shadowBlur = 22; ctx.strokeStyle = a2; ctx.lineWidth = r * 0.18; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.44, 0.6, Math.PI * 2 - 0.6); ctx.stroke();
  ctx.shadowBlur = 0; ctx.restore();
  ctx.save(); ctx.translate(cx, cy); ctx.shadowColor = a; ctx.shadowBlur = 28 + 12 * Math.sin(t * 0.005);
  ctx.fillStyle = a; ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.restore(); ctx.restore();
};

const pat_rings: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al;
  const rings = [
    { rad: r * 0.95, speed: 0.0003, clr: a, lw: 3, dash: [8, 12] },
    { rad: r * 0.68, speed: -0.0005, clr: a2, lw: 4, dash: [12, 8] },
    { rad: r * 0.42, speed: 0.0008, clr: a, lw: 6, dash: [4, 6] },
  ];
  for (const ring of rings) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * ring.speed);
    ctx.shadowColor = ring.clr; ctx.shadowBlur = 18; ctx.strokeStyle = ring.clr; ctx.lineWidth = ring.lw; ctx.setLineDash(ring.dash);
    ctx.beginPath(); ctx.arc(0, 0, ring.rad, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]); ctx.shadowBlur = 0; ctx.restore();
  }
  ctx.save(); ctx.translate(cx, cy); ctx.shadowColor = a; ctx.shadowBlur = 24 + 10 * Math.sin(t * 0.004);
  ctx.fillStyle = a; ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
  ctx.restore();
};

const pat_spiral: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al;
  const baseRot = t * 0.0006;
  for (let arm = 0; arm < 2; arm++) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(baseRot + arm * Math.PI);
    ctx.shadowColor = arm === 0 ? a : a2; ctx.shadowBlur = 20; ctx.strokeStyle = arm === 0 ? a : a2; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let s = 0; s <= 120; s++) {
      const tt = s / 120;
      const ro = r * 0.1 + r * 0.82 * tt;
      const an = tt * Math.PI * 5;
      if (s === 0) ctx.moveTo(Math.cos(an) * ro, Math.sin(an) * ro);
      else ctx.lineTo(Math.cos(an) * ro, Math.sin(an) * ro);
    }
    ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();
  }
  ctx.save(); ctx.translate(cx, cy); ctx.shadowColor = a; ctx.shadowBlur = 28 + 10 * Math.sin(t * 0.004);
  ctx.fillStyle = a; ctx.beginPath(); ctx.arc(0, 0, r * 0.1, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
  ctx.restore();
};

const pat_neuron: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al;
  const ROT = t * 0.0004;
  for (let i = 0; i < 6; i++) {
    const an = (i / 6) * Math.PI * 2 + ROT;
    const clr = i % 2 === 0 ? a : a2;
    const cpX = Math.cos(an + 0.4) * r * 0.55, cpY = Math.sin(an + 0.4) * r * 0.55;
    const eX = Math.cos(an) * r * 0.85, eY = Math.sin(an) * r * 0.85;
    ctx.save(); ctx.translate(cx, cy); ctx.shadowColor = clr; ctx.shadowBlur = 16; ctx.strokeStyle = clr; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(cpX, cpY, eX, eY); ctx.stroke();
    ctx.fillStyle = clr; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(eX, eY, 8, 0, Math.PI * 2); ctx.fill();
    const pt = (t * 0.001 + i / 6) % 1;
    const px = cpX * 2 * pt * (1 - pt) + eX * pt * pt;
    const py = cpY * 2 * pt * (1 - pt) + eY * pt * pt;
    ctx.shadowBlur = 22; ctx.globalAlpha = al * (1 - Math.abs(pt - 0.5) * 2);
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
  }
  ctx.save(); ctx.translate(cx, cy); ctx.shadowColor = a; ctx.shadowBlur = 30 + 14 * Math.sin(t * 0.005);
  ctx.fillStyle = a; ctx.beginPath(); ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
  ctx.restore();
};

/** DNA double helix */
const pat_dna: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy);
  const ROT = t * 0.0008;
  const STEPS = 80;
  for (let strand = 0; strand < 2; strand++) {
    const clr = strand === 0 ? a : a2;
    ctx.shadowColor = clr; ctx.shadowBlur = 18; ctx.strokeStyle = clr; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let s = 0; s <= STEPS; s++) {
      const tt = s / STEPS;
      const angle = tt * Math.PI * 4 + ROT + strand * Math.PI;
      const x = Math.cos(angle) * r * 0.7;
      const y = (tt - 0.5) * r * 1.8;
      if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.shadowBlur = 0;
  }
  // Rungs
  for (let s = 0; s <= 14; s++) {
    const tt = s / 14;
    const angle = tt * Math.PI * 4 + ROT;
    const x1 = Math.cos(angle) * r * 0.7, y = (tt - 0.5) * r * 1.8;
    const x2 = Math.cos(angle + Math.PI) * r * 0.7;
    ctx.globalAlpha = al * 0.5; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
  }
  ctx.restore();
};

/** Atom electron orbits */
const pat_atom: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al;
  const ORBITS = [
    { tilt: 0, speed: 0.0015, clr: a },
    { tilt: Math.PI / 3, speed: -0.001, clr: a2 },
    { tilt: Math.PI * 2 / 3, speed: 0.0012, clr: a },
  ];
  for (const orb of ORBITS) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(orb.tilt);
    ctx.shadowColor = orb.clr; ctx.shadowBlur = 14; ctx.strokeStyle = orb.clr; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 0.38, 0, 0, Math.PI * 2); ctx.stroke();
    const ea = t * orb.speed;
    const ex = Math.cos(ea) * r * 0.9, ey = Math.sin(ea) * r * 0.38;
    ctx.shadowBlur = 22; ctx.fillStyle = orb.clr; ctx.beginPath(); ctx.arc(ex, ey, 8, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
  }
  ctx.save(); ctx.translate(cx, cy); ctx.shadowColor = a; ctx.shadowBlur = 32 + 12 * Math.sin(t * 0.005);
  ctx.fillStyle = a; ctx.beginPath(); ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
  ctx.restore();
};

/** Compass rose */
const pat_compass: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy);
  const ROT = t * 0.0003;
  // Outer ring
  ctx.shadowColor = a; ctx.shadowBlur = 14; ctx.strokeStyle = a; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
  // 8 direction arrows
  for (let i = 0; i < 8; i++) {
    const an = (i / 8) * Math.PI * 2 + ROT;
    const isPrimary = i % 2 === 0;
    const len = isPrimary ? r * 0.75 : r * 0.5;
    const clr = isPrimary ? a : a2;
    const tipX = Math.cos(an) * len, tipY = Math.sin(an) * len;
    ctx.save();
    ctx.shadowColor = clr; ctx.shadowBlur = isPrimary ? 20 : 10; ctx.strokeStyle = clr; ctx.lineWidth = isPrimary ? 3 : 1.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(tipX, tipY); ctx.stroke();
    // Arrowhead
    if (isPrimary) {
      const ah = 0.35;
      const ax1 = Math.cos(an - ah) * (len * 0.75), ay1 = Math.sin(an - ah) * (len * 0.75);
      const ax2 = Math.cos(an + ah) * (len * 0.75), ay2 = Math.sin(an + ah) * (len * 0.75);
      ctx.fillStyle = clr; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(ax1, ay1); ctx.lineTo(ax2, ay2); ctx.closePath(); ctx.fill();
    }
    ctx.shadowBlur = 0; ctx.restore();
  }
  // Center dot
  ctx.shadowColor = a; ctx.shadowBlur = 28; ctx.fillStyle = a; ctx.beginPath(); ctx.arc(0, 0, r * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.restore();
};

/** Radar scanning beam */
const pat_radar: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy);
  const scanAngle = (t * 0.0025) % (Math.PI * 2);
  // Outer circle
  ctx.shadowColor = a2; ctx.shadowBlur = 12; ctx.strokeStyle = a2; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  // Inner circles
  for (const fr of [0.55, 0.28]) {
    ctx.shadowBlur = 8; ctx.strokeStyle = a2; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, 0, r * fr, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.shadowBlur = 0;
  // Sweep sector gradient
  const SECTOR = Math.PI / 3;
  ctx.save();
  ctx.rotate(scanAngle);
  const grad = ctx.createLinearGradient(0, 0, r * 0.9, 0);
  grad.addColorStop(0, hex2rgba(a, 0));
  grad.addColorStop(0.7, hex2rgba(a, 0.35));
  grad.addColorStop(1, hex2rgba(a, 0.65));
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.arc(0, 0, r * 0.92, -SECTOR * 0.1, 0);
  ctx.closePath(); ctx.fill();
  // Bright sweep line
  ctx.shadowColor = a; ctx.shadowBlur = 28; ctx.strokeStyle = a; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 0.92, 0); ctx.stroke();
  ctx.shadowBlur = 0; ctx.restore();
  // Random blips
  for (let b = 0; b < 5; b++) {
    const bAngle = sf(b * 17.3) * Math.PI * 2;
    const bR     = (sf(b * 29.1) * 0.65 + 0.2) * r;
    const bx     = Math.cos(bAngle) * bR, by = Math.sin(bAngle) * bR;
    const diff   = ((scanAngle - bAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const blipA  = diff < 1.5 ? Math.max(0, 1 - diff / 1.5) : 0;
    if (blipA > 0.05) {
      ctx.save(); ctx.globalAlpha = al * blipA;
      ctx.shadowColor = a; ctx.shadowBlur = 20; ctx.fillStyle = a;
      ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
    }
  }
  // Center
  ctx.shadowColor = a; ctx.shadowBlur = 24; ctx.fillStyle = a; ctx.beginPath(); ctx.arc(0, 0, r * 0.1, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.restore();
};

/** Hexagonal grid */
const pat_hexgrid: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy);
  const ROT = t * 0.0004;
  const HEX_R = r * 0.32;
  const positions = [
    { ox: 0, oy: 0 },
    { ox: HEX_R * 1.73, oy: 0 },
    { ox: -HEX_R * 1.73, oy: 0 },
    { ox: HEX_R * 0.87, oy: -HEX_R * 1.5 },
    { ox: -HEX_R * 0.87, oy: -HEX_R * 1.5 },
    { ox: HEX_R * 0.87, oy: HEX_R * 1.5 },
    { ox: -HEX_R * 0.87, oy: HEX_R * 1.5 },
  ];
  positions.forEach((pos, pi) => {
    const pulse = 1 + 0.08 * Math.sin(t * 0.004 + pi * 0.8);
    const clr = pi === 0 ? a : pi % 2 === 0 ? a2 : a;
    const bAl = pi === 0 ? 1 : 0.55;
    ctx.save();
    ctx.translate(pos.ox, pos.oy); ctx.rotate(ROT);
    ctx.shadowColor = clr; ctx.shadowBlur = pi === 0 ? 24 : 12;
    ctx.strokeStyle = clr; ctx.lineWidth = pi === 0 ? 3 : 1.8; ctx.globalAlpha = al * bAl;
    ctx.beginPath();
    for (let vi = 0; vi <= 6; vi++) {
      const va = (vi / 6) * Math.PI * 2;
      const vx = Math.cos(va) * HEX_R * pulse, vy = Math.sin(va) * HEX_R * pulse;
      if (vi === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
    }
    ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();
  });
  ctx.restore();
};

/** Sunburst rays */
const pat_sunburst: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy);
  const ROT = t * 0.0006;
  const RAYS = 16;
  for (let i = 0; i < RAYS; i++) {
    const an = (i / RAYS) * Math.PI * 2 + ROT;
    const isPrimary = i % 2 === 0;
    const len = isPrimary ? r * 0.92 : r * 0.62;
    const lw  = isPrimary ? 3 : 1.5;
    const al2 = isPrimary ? 1 : 0.55;
    const clr = isPrimary ? a : a2;
    ctx.save(); ctx.globalAlpha = al * al2;
    ctx.shadowColor = clr; ctx.shadowBlur = isPrimary ? 20 : 8; ctx.strokeStyle = clr; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(an) * len, Math.sin(an) * len); ctx.stroke();
    ctx.shadowBlur = 0; ctx.restore();
  }
  // Bright center
  ctx.shadowColor = a; ctx.shadowBlur = 38 + 16 * Math.sin(t * 0.005); ctx.fillStyle = a;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.restore();
};

/** Vortex / spiral funnel */
const pat_vortex: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy);
  const ROT = t * 0.0018;
  const RINGS = 5;
  for (let ri = 0; ri < RINGS; ri++) {
    const ringFrac = (ri + 1) / RINGS;
    const ringR = r * ringFrac * 0.9;
    const clr = ri % 2 === 0 ? a : a2;
    const startAngle = ROT * (1 + ri * 0.4);
    ctx.save(); ctx.shadowColor = clr; ctx.shadowBlur = 14; ctx.strokeStyle = clr; ctx.lineWidth = 2.5 - ri * 0.3;
    ctx.beginPath();
    for (let s = 0; s <= 60; s++) {
      const tt = s / 60;
      const angle = tt * Math.PI * 2 + startAngle;
      const pr = ringR * (0.6 + 0.4 * tt);
      if (s === 0) ctx.moveTo(Math.cos(angle) * pr, Math.sin(angle) * pr);
      else ctx.lineTo(Math.cos(angle) * pr, Math.sin(angle) * pr);
    }
    ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();
  }
  ctx.shadowColor = a; ctx.shadowBlur = 30; ctx.fillStyle = a; ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.restore();
};

/** Crystal facets */
const pat_crystal: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy);
  const ROT = t * 0.0005;
  const FACETS = 6;
  for (let f = 0; f < FACETS; f++) {
    const an = (f / FACETS) * Math.PI * 2 + ROT;
    const an2 = ((f + 1) / FACETS) * Math.PI * 2 + ROT;
    const midAn = (an + an2) / 2;
    const p1x = Math.cos(an) * r * 0.82, p1y = Math.sin(an) * r * 0.82;
    const p2x = Math.cos(an2) * r * 0.82, p2y = Math.sin(an2) * r * 0.82;
    const pmx = Math.cos(midAn) * r * 0.38, pmy = Math.sin(midAn) * r * 0.38;
    const pulse = 0.65 + 0.35 * Math.sin(t * 0.003 + f);
    const clr = f % 2 === 0 ? a : a2;
    ctx.save(); ctx.shadowColor = clr; ctx.shadowBlur = 16; ctx.strokeStyle = clr; ctx.lineWidth = 2;
    ctx.globalAlpha = al * pulse;
    // Outer edge
    ctx.beginPath(); ctx.moveTo(p1x, p1y); ctx.lineTo(p2x, p2y); ctx.stroke();
    // Spokes to inner point
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(p1x, p1y); ctx.lineTo(pmx, pmy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p2x, p2y); ctx.lineTo(pmx, pmy); ctx.stroke();
    ctx.shadowBlur = 0; ctx.restore();
  }
  // Glint at center
  const glint = 1 + 0.5 * Math.sin(t * 0.007);
  ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 28 * glint; ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.08 * glint, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.restore();
};

/** Eye / iris */
const pat_eye: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy);
  const BLINK = Math.max(0.2, Math.abs(Math.sin(t * 0.0006)));
  // Eyelid shape
  const EW = r * 1.4, EH = r * 0.6 * BLINK;
  ctx.shadowColor = a; ctx.shadowBlur = 20; ctx.strokeStyle = a; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-EW / 2, 0);
  ctx.quadraticCurveTo(0, -EH, EW / 2, 0);
  ctx.quadraticCurveTo(0, EH, -EW / 2, 0);
  ctx.stroke(); ctx.shadowBlur = 0;
  // Iris
  const irisR = r * 0.32 * BLINK;
  if (irisR > 4) {
    ctx.shadowColor = a2; ctx.shadowBlur = 24; ctx.strokeStyle = a2; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, irisR, 0, Math.PI * 2); ctx.stroke();
    // Iris segments
    const ROT = t * 0.001;
    for (let i = 0; i < 8; i++) {
      const an = (i / 8) * Math.PI * 2 + ROT;
      ctx.strokeStyle = a2; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Math.cos(an) * irisR * 0.3, Math.sin(an) * irisR * 0.3);
      ctx.lineTo(Math.cos(an) * irisR * 0.95, Math.sin(an) * irisR * 0.95); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // Pupil
    ctx.shadowColor = a; ctx.shadowBlur = 18; ctx.fillStyle = a;
    ctx.beginPath(); ctx.arc(0, 0, irisR * 0.32, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  }
  ctx.restore();
};

/** Infinity symbol / ∞ with pulse */
const pat_infinity: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy);
  const rx = r * 0.48, ry = r * 0.26;
  const travel = (t * 0.0015) % 1;
  // Draw two lobes
  for (let lobe = 0; lobe < 2; lobe++) {
    const ox = lobe === 0 ? -rx * 0.55 : rx * 0.55;
    const clr = lobe === 0 ? a : a2;
    ctx.shadowColor = clr; ctx.shadowBlur = 20; ctx.strokeStyle = clr; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(ox, 0, rx * 0.55, ry, 0, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
  }
  // Travelling pulse dot along path
  const steps = 200;
  let px = 0, py = 0;
  for (let s = 0; s <= steps; s++) {
    const tt = (s / steps + travel) % 1;
    const an = tt * Math.PI * 2;
    const lobe = an < Math.PI ? 0 : 1;
    const ox = lobe === 0 ? -rx * 0.55 : rx * 0.55;
    const la = lobe === 0 ? an : an - Math.PI;
    if (s === Math.floor(travel * steps)) {
      px = ox + Math.cos(la) * rx * 0.55;
      py = Math.sin(la) * ry;
    }
  }
  ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 28; ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.restore();
};

function drawCenterPattern(
  ctx: DC, elapsed: number, cx: number, cy: number, r: number,
  accent: string, accent2: string, patternName: string, alpha: number,
) {
  const fn: Record<string, PFn> = {
    arc: pat_arc, rings: pat_rings, spiral: pat_spiral, neuron: pat_neuron,
    dna: pat_dna, atom: pat_atom, compass: pat_compass, radar: pat_radar,
    hexgrid: pat_hexgrid, sunburst: pat_sunburst, vortex: pat_vortex,
    crystal: pat_crystal, eye: pat_eye, infinity: pat_infinity,
  };
  (fn[patternName] ?? pat_arc)(ctx, elapsed, cx, cy, r, accent, accent2, alpha);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCAN LINE FROM CENTER (replaces relay laser)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Draws a scanning line from center that sweeps to the keyword's angle.
 * sweepT 0→1: line sweeps from prevAngle to targetAngle
 * Once t>=1 the permanent dashed connector takes over.
 */
function drawScanLine(
  ctx: DC,
  elapsed: number,
  prevAngle: number,
  targetAngle: number,
  sweepT: number,       // 0→1
  innerR: number,
  outerR: number,
  accent: string,
) {
  if (sweepT <= 0) return;
  const SWEEP_DUR = 0.45;  // first 45% is sweep, then lock
  let currentAngle: number;
  let alpha = 1;

  if (sweepT < SWEEP_DUR) {
    const t = sweepT / SWEEP_DUR;
    currentAngle = lerp(prevAngle, targetAngle, easeOutCubic(t));
    alpha = sweepT / SWEEP_DUR;
  } else {
    currentAngle = targetAngle;
    // Fade out the scan line after locking (connector takes over)
    alpha = Math.max(0, 1 - (sweepT - SWEEP_DUR) / (1 - SWEEP_DUR) * 1.2);
  }

  if (alpha <= 0.01) return;

  const tipX = CX + Math.cos(currentAngle) * outerR;
  const tipY = CY + Math.sin(currentAngle) * outerR;
  const baseX = CX + Math.cos(currentAngle) * innerR;
  const baseY = CY + Math.sin(currentAngle) * innerR;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Glow sector trail
  ctx.save();
  ctx.translate(CX, CY);
  const trailAngle = Math.PI / 10;
  const trailGrad = ctx.createLinearGradient(0, 0, Math.cos(currentAngle - CX/CX) * outerR, 0);
  trailGrad.addColorStop(0, hex2rgba(accent, 0));
  trailGrad.addColorStop(1, hex2rgba(accent, 0.25 * alpha));
  ctx.fillStyle = trailGrad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, outerR, currentAngle - trailAngle * 0.7, currentAngle, false);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Main beam line
  const grad = ctx.createLinearGradient(baseX, baseY, tipX, tipY);
  grad.addColorStop(0, hex2rgba(accent, 0.2));
  grad.addColorStop(0.6, hex2rgba(accent, 0.8));
  grad.addColorStop(1, '#ffffff');
  ctx.shadowColor = accent; ctx.shadowBlur = 26;
  ctx.strokeStyle = grad; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(baseX, baseY); ctx.lineTo(tipX, tipY); ctx.stroke();

  // Arrowhead at tip
  const AH = 18;
  const aBack = currentAngle + Math.PI;
  const a1 = aBack - 0.4, a2 = aBack + 0.4;
  ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX + Math.cos(a1) * AH, tipY + Math.sin(a1) * AH);
  ctx.lineTo(tipX + Math.cos(a2) * AH, tipY + Math.sin(a2) * AH);
  ctx.closePath(); ctx.fill();

  ctx.shadowBlur = 0;
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 1: RADIAL KEYWORD LABELS with border L→R
// ═══════════════════════════════════════════════════════════════════════════════

/** Compute the text group layout (number left of label, no overlap) */
function measureTextGroup(
  ctx: DC, numStr: string, label: string, fsz: number,
): { numW: number; labelW: number; totalW: number } {
  ctx.font = `700 ${fsz}px "Noto Sans SC", sans-serif`;
  const numW   = ctx.measureText(numStr).width;
  const labelW = ctx.measureText(label).width;
  return { numW, labelW, totalW: numW + 6 + labelW };
}

function drawRadialLabel(
  ctx: DC,
  elapsed: number,
  i: number,
  n: number,
  label: string,
  enterT: number,
  alpha: number,
  borderProgress: number,   // 0→1 left-to-right border draw
  accent: string,
  r: ReturnType<typeof resolveOpts>,
) {
  const { cx, cy, nx, ny, angle } = labelPos(i, n);
  const eased = easeOutBack(Math.min(enterT, 0.999));
  const fsz   = r.radialFsz;
  const ff    = `"Noto Sans SC", sans-serif`;
  const numStr = String(i + 1).padStart(2, '0');

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `700 ${fsz}px ${ff}`;

  const { numW, labelW, totalW } = measureTextGroup(ctx, numStr, label, fsz);
  const PAD_X = 16, PAD_Y = 10;
  const boxH  = fsz + PAD_Y * 2;

  // Slide-in offset (comes from outside, moves to settled cx/cy)
  const slideOff = (1 - eased) * 60;
  const tx = cx + Math.cos(angle) * slideOff;
  const ty = cy + Math.sin(angle) * slideOff;

  // Determine side: right (>0.15), left (<-0.15), center
  const cosA = Math.cos(angle);
  const isRight  = cosA > 0.15;
  const isLeft   = cosA < -0.15;
  const isCenter = !isRight && !isLeft;

  // Compute group anchor such that text never overlaps
  // Group: [numStr][GAP][label] drawn left-to-right regardless of side
  let groupStartX: number;
  if (isRight) {
    // node is at left edge, text grows right
    groupStartX = tx + 14;
  } else if (isLeft) {
    // node is at right edge, text grows left (reversed)
    groupStartX = tx - 14 - totalW;
  } else {
    // top/bottom: center the group on tx
    groupStartX = tx - totalW / 2;
  }

  const textY = ty;
  const BOX_BORDER_R = 10;

  // ── Border box (draws from left to right) ──────────────────────────────────
  if (borderProgress > 0.02 && eased > 0.4) {
    const bx  = groupStartX - PAD_X;
    const by  = textY - fsz / 2 - PAD_Y;
    const bw  = totalW + PAD_X * 2;
    const clipW = bw * borderProgress;

    ctx.save();
    ctx.beginPath();
    ctx.rect(bx - 2, by - 2, clipW + 4, boxH + 4);
    ctx.clip();
    ctx.shadowColor  = accent;
    ctx.shadowBlur   = 14;
    ctx.strokeStyle  = accent;
    ctx.lineWidth    = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, boxH, BOX_BORDER_R);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Number (accent color) ──────────────────────────────────────────────────
  ctx.font         = `700 ${fsz}px ${ff}`;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = r.radialNumClr;
  ctx.shadowColor  = r.radialNumClr;
  ctx.shadowBlur   = 18;
  ctx.fillText(numStr, groupStartX, textY);

  // ── Label (white) ──────────────────────────────────────────────────────────
  ctx.fillStyle   = r.radialClr;
  ctx.shadowColor = r.radialClr;
  ctx.shadowBlur  = 10;
  ctx.fillText(label, groupStartX + numW + 6, textY);
  ctx.shadowBlur = 0;

  ctx.restore();
}

/** Draw the permanent dashed connector + node dot after scan settles */
function drawConnector(
  ctx: DC, i: number, n: number, alpha: number, accent: string,
) {
  if (alpha <= 0.05) return;
  const { nx, ny, angle } = labelPos(i, n);
  const lineX0 = CX + Math.cos(angle) * INNER_R;
  const lineY0 = CY + Math.sin(angle) * INNER_R;

  ctx.save();
  ctx.globalAlpha = alpha * 0.55;
  ctx.strokeStyle = accent; ctx.lineWidth = 1.5; ctx.shadowColor = accent; ctx.shadowBlur = 6;
  ctx.setLineDash([4, 8]);
  ctx.beginPath(); ctx.moveTo(lineX0, lineY0); ctx.lineTo(nx, ny); ctx.stroke();
  ctx.setLineDash([]); ctx.shadowBlur = 0;
  ctx.globalAlpha = alpha;
  ctx.shadowColor = accent; ctx.shadowBlur = 14; ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(nx, ny, 7, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 1b: SHORT SENTENCES AT KEYWORD POSITIONS
// ═══════════════════════════════════════════════════════════════════════════════

function drawShortAtKeyword(
  ctx: DC,
  i: number,
  n: number,
  short: string,
  enterT: number,
  alpha: number,
  accent: string,
  r: ReturnType<typeof resolveOpts>,
) {
  const { cx, cy, angle } = labelPos(i, n);
  const fsz = r.radialFsz * 0.72;
  const ff  = `"Noto Sans SC", sans-serif`;

  // Position: slightly offset from keyword (below for most, above for top labels)
  const sinA = Math.sin(angle);
  const offsetY = sinA < -0.3 ? -(r.radialFsz + fsz) : r.radialFsz + 8;

  const eased = easeOutCubic(Math.min(enterT, 1));
  ctx.save();
  ctx.globalAlpha = alpha * eased;
  ctx.font        = `600 ${fsz}px ${ff}`;
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle   = hex2rgba(accent, 0.95);
  ctx.shadowColor = accent;
  ctx.shadowBlur  = 16;
  ctx.fillText(short, cx, cy + offsetY);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2: BURST TRANSITION
// ═══════════════════════════════════════════════════════════════════════════════

function drawBurstTransition(ctx: DC, burstT: number, accent: string, burstFx: string) {
  if (burstT <= 0 || burstT >= 1) return;
  switch (burstFx) {
    case 'flash': {
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - burstT * 2.5); ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CW, CH); ctx.restore(); break;
    }
    case 'wipe': {
      ctx.save(); ctx.globalAlpha = 1 - burstT;
      const rw = burstT * Math.hypot(CW, CH) * 0.7;
      ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(CX, CY, rw, 0, Math.PI * 2); ctx.fill(); ctx.restore(); break;
    }
    case 'shatter':
    default: {
      const eased = easeOutCubic(burstT), fadeA = 1 - burstT * burstT;
      ctx.save();
      for (let s = 0; s < 20; s++) {
        const seed = s * 1234.5;
        const angle = sf(seed * 1.1) * Math.PI * 2;
        const dist  = 180 + sf(seed * 2.3) * 500;
        const rot   = (sf(seed * 3.7) - 0.5) * eased * 1.8;
        const w = 80 + sf(seed * 4.1) * 200, h = 40 + sf(seed * 5.3) * 100;
        const ox = CX + sf(seed * 6.1) * CW - CW / 2, oy = CY + sf(seed * 7.2) * CH - CH / 2;
        ctx.save();
        ctx.globalAlpha = fadeA * 0.85;
        ctx.translate(ox + Math.cos(angle) * dist * eased, oy + Math.sin(angle) * dist * eased);
        ctx.rotate(rot);
        ctx.fillStyle = hex2rgba(accent, 0.6 + sf(seed * 8.3) * 0.4); ctx.shadowColor = accent; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 6); ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
      }
      ctx.restore(); break;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3: KEYWORD BOX + DESC
// ═══════════════════════════════════════════════════════════════════════════════

const KW_BOX_X   = 60;
const KW_BOX_W   = 490;
const KW_TOP_Y   = 100;
const DESC_COL_X = KW_BOX_X + KW_BOX_W + 48;
const DESC_COL_W = CW - DESC_COL_X - 60;

function itemRowY(i: number, n: number): number {
  const AVAIL = CH - KW_TOP_Y - 80;
  const step  = Math.min(100, AVAIL / Math.max(n, 1));
  return KW_TOP_Y + i * step + step * 0.5;
}

function drawKwBox(
  ctx: DC, i: number, n: number, label: string,
  enterT: number, highlightT: number, accent: string, r: ReturnType<typeof resolveOpts>,
) {
  const rowY  = itemRowY(i, n);
  const fsz   = r.kwBoxFsz;
  const numStr = String(i + 1).padStart(2, '0');
  const ff    = `"Noto Sans SC", sans-serif`;

  ctx.font = `700 ${fsz}px ${ff}`;
  const numW  = ctx.measureText(numStr).width;
  const labW  = ctx.measureText(label).width;
  const PAD_X = 24, PAD_Y = 14;
  const textW = numW + 6 + labW;
  const boxW  = Math.min(KW_BOX_W, textW + PAD_X * 2);
  const boxH  = fsz + PAD_Y * 2;
  const bx    = KW_BOX_X, by = rowY - boxH / 2;
  const bc    = r.kwBoxBorderClr;
  const eased = easeOutBack(Math.min(enterT, 0.999));
  const alpha = clamp(enterT * 2, 0, 1);

  ctx.save(); ctx.globalAlpha = alpha;
  if (r.kwBoxBgA > 0.01) {
    ctx.fillStyle = hex2rgba(bc, r.kwBoxBgA);
    ctx.beginPath(); ctx.roundRect(bx, by, boxW * eased, boxH, r.kwBoxBR); ctx.fill();
  }
  // Border draws from left
  ctx.save();
  ctx.beginPath(); ctx.rect(bx - 4, by - 4, (boxW + 8) * eased, boxH + 8); ctx.clip();
  ctx.shadowColor = bc; ctx.shadowBlur = 18 + highlightT * 20; ctx.strokeStyle = bc; ctx.lineWidth = r.kwBoxBW;
  ctx.beginPath(); ctx.roundRect(bx, by, boxW, boxH, r.kwBoxBR); ctx.stroke();
  ctx.shadowBlur = 0; ctx.restore();

  if (eased > 0.3) {
    ctx.globalAlpha = alpha * clamp((eased - 0.3) / 0.7, 0, 1);
    ctx.font = `700 ${fsz}px ${ff}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = bc; ctx.shadowColor = bc; ctx.shadowBlur = 14 + highlightT * 10;
    ctx.fillText(numStr, bx + PAD_X, rowY);
    ctx.fillStyle = r.kwBoxClr; ctx.shadowColor = r.kwBoxClr; ctx.shadowBlur = 8;
    ctx.fillText(label, bx + PAD_X + numW + 6, rowY);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

function drawDescItem(
  ctx: DC, i: number, n: number, desc: string, te: number,
  accent: string, r: ReturnType<typeof resolveOpts>,
) {
  const rowY  = itemRowY(i, n);
  const fsz   = r.descFsz;
  ctx.font = `400 ${fsz}px "Noto Sans SC", sans-serif`;
  const lines = wrapText(ctx, desc, DESC_COL_W).slice(0, 3);
  const lineH = fsz + 8;
  let alpha = 1, offsetX = 0, clipChars = desc.length;
  switch (r.descEnter) {
    case 'fadeIn':     alpha = easeOutCubic(clamp(te / 500, 0, 1)); break;
    case 'slideRight': alpha = clamp(te / 400, 0, 1); offsetX = lerp(60, 0, easeOutCubic(clamp(te / 500, 0, 1))); break;
    default:           clipChars = Math.min(Math.floor(te / 38), desc.length);
  }
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.font = `400 ${fsz}px "Noto Sans SC", sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = r.descClr; ctx.shadowColor = accent; ctx.shadowBlur = 6;
  let charCount = 0;
  const startY = rowY - ((lines.length - 1) * lineH) / 2;
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li], lineY = startY + li * lineH;
    if (r.descEnter === 'typewriter') {
      const toShow = Math.max(0, Math.min(line.length, clipChars - charCount));
      if (toShow === 0) break;
      ctx.fillText(line.slice(0, toShow), DESC_COL_X + offsetX, lineY);
      charCount += line.length;
    } else {
      ctx.fillText(line, DESC_COL_X + offsetX, lineY);
    }
  }
  ctx.shadowBlur = 0; ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 4: GRID
// ═══════════════════════════════════════════════════════════════════════════════

function drawGridCell(
  ctx: DC, cell: GridCell, point: GeneratedContent['points'][number], index: number,
  enterT: number, explodeT: number, elapsed: number, accent: string,
  r: ReturnType<typeof resolveOpts>, seed: number,
) {
  const { cx, cy, w, h } = cell;
  let tx = 0, ty = 0, rot = 0, exAlpha = 1;
  if (explodeT > 0) {
    const et = easeOutCubic(explodeT);
    const angle = sf(seed * 127.1) * Math.PI * 2;
    const dist  = 280 + sf(seed * 311.7) * 500;
    switch (r.gridExplode) {
      case 'scatter':  tx = Math.cos(angle) * dist * et; ty = Math.sin(angle) * dist * et; rot = angle * et * 0.5; break;
      case 'implode':  tx = (CX - cx) * et * 0.8; ty = (CY - cy) * et * 0.8; rot = et * 2; break;
      default:         tx = Math.cos(angle) * dist * et; ty = Math.sin(angle) * dist * et - 100 * et; rot = (angle > Math.PI ? 1 : -1) * et * 1.5;
    }
    exAlpha = Math.max(0, 1 - explodeT * explodeT);
    if (exAlpha <= 0.01) return;
  }
  let scaleE = 1, entAlpha = 1;
  switch (r.gridEnter) {
    case 'zoomIn':  scaleE = lerp(0.1, 1, easeOutBack(Math.min(enterT, 0.999))); entAlpha = clamp(enterT * 3, 0, 1); break;
    case 'flipIn':  scaleE = Math.abs(Math.sin(enterT * Math.PI / 2)); entAlpha = clamp(enterT * 2, 0, 1); break;
    case 'slideUp': ty += lerp(70, 0, easeOutCubic(enterT)); entAlpha = clamp(enterT * 2, 0, 1); break;
    default:        entAlpha = easeOutCubic(enterT);
  }
  if (Math.min(entAlpha, exAlpha) <= 0.01) return;
  ctx.save(); ctx.globalAlpha = Math.min(entAlpha, exAlpha);
  ctx.translate(cx + tx, cy + ty); ctx.rotate(rot); ctx.scale(scaleE, scaleE);

  // Seq number ABOVE cell
  const numFsz = Math.min(32, h * 0.18);
  ctx.font = `700 ${numFsz}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = r.gridNumClr; ctx.shadowColor = r.gridNumClr; ctx.shadowBlur = 12;
  ctx.fillText(String(index + 1).padStart(2, '0'), 0, -h / 2 - numFsz * 0.7); ctx.shadowBlur = 0;

  // Cell BG + border
  const bg = ctx.createLinearGradient(-w / 2, -h / 2, -w / 2, h / 2);
  bg.addColorStop(0, hex2rgba(r.gridBorderClr, 0.18)); bg.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = bg; ctx.shadowColor = r.gridBorderClr; ctx.shadowBlur = 20 + 8 * Math.sin(elapsed * 0.003 + seed);
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 12); ctx.fill();
  ctx.strokeStyle = r.gridBorderClr; ctx.lineWidth = 2.5; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 12); ctx.stroke(); ctx.shadowBlur = 0;

  // Keyword
  const kwFsz = Math.min(r.gridKwFsz, h * 0.36);
  ctx.font = `900 ${kwFsz}px "Noto Sans SC", sans-serif`; ctx.fillStyle = r.gridKwClr;
  ctx.shadowColor = r.gridKwClr; ctx.shadowBlur = 14;
  ctx.fillText(point.label, 0, -h * 0.1); ctx.shadowBlur = 0;

  if (point.short) {
    const sepY = h * 0.18;
    ctx.save(); ctx.globalAlpha = 0.55; ctx.strokeStyle = r.gridBorderClr; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(-w / 2 + 16, sepY); ctx.lineTo(w / 2 - 16, sepY); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    const sFsz = Math.min(r.gridShortFsz, h * 0.22);
    ctx.font = `600 ${sFsz}px "Noto Sans SC", sans-serif`; ctx.fillStyle = r.gridShortClr; ctx.shadowColor = r.gridBorderClr; ctx.shadowBlur = 8;
    wrapText(ctx, point.short, w - 24).slice(0, 2).forEach((line, li) => ctx.fillText(line, 0, h * 0.35 + li * (sFsz + 5)));
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ENTRY
// ═══════════════════════════════════════════════════════════════════════════════

export function drawAITechCards(
  ctx: DC,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  _polyShape: PolyShape,
  aitechOpts?: AItechOptions,
): void {
  const n        = content.points.length;
  if (n === 0) return;
  const displayN = Math.min(n, 12);
  const r        = resolveOpts(aitechOpts, accent);
  const PAT_R    = 155;
  const pattern  = pickPattern(displayN, r.centerPattern);

  const { p1Start, p1bStart, p2Start, p3Start, p4Start } = aiTechPhases(displayN);
  const SCAN_DUR = 400;  // ms for scan line to sweep to target

  // Phase detection
  const inP4    = elapsed >= p4Start;
  const inP3    = !inP4 && elapsed >= p3Start;
  const inBurst = !inP3 && !inP4 && elapsed >= p2Start;
  const inP1b   = !inBurst && !inP3 && !inP4 && elapsed >= p1bStart;
  const inP1    = !inP1b && !inBurst && !inP3 && !inP4;

  // ── PHASE 4: Grid ────────────────────────────────────────────────────────────
  if (inP4) {
    const cells   = computeGrid(displayN);
    const allInMs = AT.gridStagger * (displayN - 1) + 400;
    const exStart = p4Start + allInMs + 200 + AT.gridHold;

    const hdrAlpha = clamp((elapsed - p4Start) / 400, 0, 1);
    if (hdrAlpha > 0) {
      ctx.save(); ctx.globalAlpha = hdrAlpha;
      ctx.font = `700 52px "Noto Sans SC", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff'; ctx.shadowColor = accent; ctx.shadowBlur = 26;
      ctx.fillText(content.title, CX, 90); ctx.shadowBlur = 0; ctx.restore();
    }
    for (let i = 0; i < displayN; i++) {
      const te = elapsed - (p4Start + i * AT.gridStagger);
      if (te <= 0) continue;
      const explodeT = elapsed >= exStart ? clamp((elapsed - exStart) / AT.explodeDur, 0, 1) : 0;
      drawGridCell(ctx, cells[i], content.points[i], i, clamp(te / 400, 0, 1), explodeT, elapsed, accent, r, i * 1234.5);
    }
    return;
  }

  // ── BURST TRANSITION ─────────────────────────────────────────────────────────
  if (inBurst) {
    const burstT = clamp((elapsed - p2Start) / AT.burstDur, 0, 1);
    const radialFade = 1 - easeOutCubic(burstT);
    if (radialFade > 0.02) {
      ctx.save(); ctx.globalAlpha = radialFade;
      for (let i = 0; i < displayN; i++) {
        drawConnector(ctx, i, displayN, 0.8, accent);
        drawRadialLabel(ctx, elapsed, i, displayN, content.points[i].label, 1, 0.7, 1, accent, r);
      }
      drawCenterPattern(ctx, elapsed, CX, CY, PAT_R, accent, accent2, pattern, 1);
      ctx.restore();
    }
    drawBurstTransition(ctx, burstT, accent, r.burstFx);
    return;
  }

  // ── PHASE 3: Keyword box + desc ──────────────────────────────────────────────
  if (inP3) {
    const divAlpha = clamp((elapsed - p3Start) / 350, 0, 1);
    if (divAlpha > 0) {
      ctx.save(); ctx.globalAlpha = divAlpha * 0.4;
      ctx.strokeStyle = accent; ctx.lineWidth = 1; ctx.shadowColor = accent; ctx.shadowBlur = 8; ctx.setLineDash([4, 10]);
      ctx.beginPath(); ctx.moveTo(DESC_COL_X - 24, KW_TOP_Y - 10); ctx.lineTo(DESC_COL_X - 24, CH - 50); ctx.stroke();
      ctx.setLineDash([]); ctx.shadowBlur = 0; ctx.restore();
    }
    for (let i = 0; i < displayN; i++) {
      const te        = elapsed - (p3Start + i * AT.descSlot);
      const boxEnterT = te > 0 ? clamp(te / 450, 0, 1) : 0;
      const boxAlpha  = te > 0 ? clamp(te / 300, 0, 1) : 0;
      const isActive  = te >= 0 && (i === displayN - 1 || elapsed < p3Start + (i + 1) * AT.descSlot + 200);
      if (boxAlpha > 0)
        drawKwBox(ctx, i, displayN, content.points[i].label, boxEnterT, isActive ? clamp((te > 0 ? te : 0) / 300, 0, 1) : 0, accent, r);
      if (te > 0 && content.points[i].desc)
        drawDescItem(ctx, i, displayN, content.points[i].desc!, te, accent, r);
    }
    return;
  }

  // ── PHASE 1b: Short sentences after all keywords ──────────────────────────────
  if (inP1b) {
    // Faint background rings
    const ringFade = 0.35;
    for (let ring = 1; ring <= 3; ring++) {
      ctx.save(); ctx.globalAlpha = ringFade * (0.3 - ring * 0.04);
      ctx.strokeStyle = ring % 2 === 0 ? accent : accent2; ctx.lineWidth = 1.2; ctx.setLineDash([4, 10]);
      ctx.beginPath(); ctx.arc(CX, CY, RADIAL_R * (0.55 + ring * 0.16), 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }
    // Center pattern
    drawCenterPattern(ctx, elapsed, CX, CY, PAT_R, accent, accent2, pattern, 1);
    // All settled keyword labels + connectors
    for (let i = 0; i < displayN; i++) {
      drawConnector(ctx, i, displayN, 1, accent);
      drawRadialLabel(ctx, elapsed, i, displayN, content.points[i].label, 1, 1, 1, accent, r);
    }
    // Short sentences appear one by one
    for (let i = 0; i < displayN; i++) {
      const sStart = p1bStart + i * AT.shortSlot;
      const te = elapsed - sStart;
      if (te <= 0) continue;
      const enterT = clamp(te / 400, 0, 1);
      const alpha  = clamp(te / 250, 0, 1);
      const point  = content.points[i];
      if (point.short) {
        drawShortAtKeyword(ctx, i, displayN, point.short, enterT, alpha, accent, r);
      }
    }
    return;
  }

  // ── PHASE 1: Radial keywords with scan line ───────────────────────────────────

  // Background rings
  const ringFade = clamp((elapsed - p1Start) / 600, 0, 1) * 0.35;
  if (ringFade > 0) {
    for (let ring = 1; ring <= 3; ring++) {
      ctx.save(); ctx.globalAlpha = ringFade * (0.3 - ring * 0.04);
      ctx.strokeStyle = ring % 2 === 0 ? accent : accent2; ctx.lineWidth = 1.2; ctx.setLineDash([4, 10]);
      ctx.beginPath(); ctx.arc(CX, CY, RADIAL_R * (0.55 + ring * 0.16) * (1 + 0.02 * Math.sin(elapsed * 0.0008 + ring)), 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }
  }

  // Center pattern
  const patAlpha = clamp((elapsed - p1Start) / 600, 0, 1);
  if (patAlpha > 0) drawCenterPattern(ctx, elapsed, CX, CY, PAT_R, accent, accent2, pattern, patAlpha);

  // Keywords + scan lines
  for (let i = 0; i < displayN; i++) {
    const kStart = p1Start + i * AT.keywordSlot;
    const te     = elapsed - kStart;
    if (te <= 0) continue;

    const enterT   = clamp(te / 500, 0, 1);
    const alpha    = clamp(te / 350, 0, 1);
    const borderP  = clamp((te - 300) / 500, 0, 1);   // border starts 300ms after keyword begins

    // Connector (fades in after scan)
    const connAlpha = clamp((te - 350) / 400, 0, 1);
    drawConnector(ctx, i, displayN, connAlpha, accent);

    // Scan line from center
    const prevAngle = i === 0 ? labelPos(0, displayN).angle - Math.PI * 0.6 : labelPos(i - 1, displayN).angle;
    const curAngle  = labelPos(i, displayN).angle;
    const sweepT    = clamp(te / SCAN_DUR, 0, 1);
    drawScanLine(ctx, elapsed, prevAngle, curAngle, sweepT, INNER_R, NODE_R + 25, accent);

    drawRadialLabel(ctx, elapsed, i, displayN, content.points[i].label, enterT, alpha, borderP, accent, r);
  }
}
