/**
 * cards-aitech.ts — AI Tech style 4-phase animation (v4)
 *
 * Phase 1  (T.cardBase + n×900ms):          Keywords appear radially — label+short in same box,
 *                                            scan line from center, border draws L→R
 * Phase 2  (+600ms burst):                  TEXT-SHATTER transition (characters fly apart)
 * Phase 3  (+n×800ms):                      Keyword boxed list (left) + desc typewriter (right)
 * Phase 4  (+grid stagger + hold + explode): Grid finale — text-burst outro
 */
import type { GeneratedContent, PolyShape, AItechOptions } from '../../types/video';
import {
  CW, CH, clamp, easeOutBack, easeOutCubic, lerp, hex2rgba,
  wrapText, T, AT, aiTechPhases,
} from './helpers';

const CX = CW / 2, CY = CH / 2;
const RADIAL_R = 380;   // distance center → label anchor
const NODE_R   = 348;   // distance center → circle node
const INNER_R  = 165;   // inner edge of connector line
const MAX_BOX_W = 530;  // max radial label box width

// ── Resolved options ───────────────────────────────────────────────────────────
function resolveOpts(o?: AItechOptions, accent = '#a855f7') {
  return {
    centerPattern:   o?.centerPattern        ?? 'random',
    radialFsz:       o?.radialFontSize        ?? 52,
    radialClr:       o?.radialColor           || '#ffffff',
    radialNumClr:    o?.radialNumberColor     || accent,
    radialShortFsz:  o?.radialShortFontSize   ?? 34,
    radialShortClr:  o?.radialShortColor      || 'rgba(200,220,255,0.85)',
    burstFx:         o?.burstTransition       ?? 'shatter',
    kwBoxFsz:        o?.kwBoxFontSize         ?? 62,
    kwBoxClr:        o?.kwBoxColor            || '#ffffff',
    kwBoxBorderClr:  o?.kwBoxBorderColor      || accent,
    kwBoxBW:         o?.kwBoxBorderWidth      ?? 3,
    kwBoxBR:         o?.kwBoxBorderRadius     ?? 16,
    kwBoxBgA:        o?.kwBoxBgAlpha          ?? 0,
    descFsz:         o?.descFontSize          ?? 42,
    descClr:         o?.descColor             || 'rgba(220,220,220,0.92)',
    descEnter:       o?.descEnterEffect       ?? 'typewriter',
    gridEnter:       o?.gridCellEnterEffect   ?? 'zoomIn',
    gridExplode:     o?.gridExplosionStyle    ?? 'burst',
    gridKwFsz:       o?.gridKeywordFontSize   ?? 72,
    gridShortFsz:    o?.gridShortFontSize     ?? 38,
    gridKwClr:       o?.gridKeywordColor      || '#ffffff',
    gridShortClr:    o?.gridShortColor        || 'rgba(200,200,200,0.9)',
    gridBorderClr:   o?.gridBorderColor       || accent,
    gridNumClr:      o?.gridNumColor          || accent,
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
    cx:    CX + Math.cos(angle) * RADIAL_R,
    cy:    CY + Math.sin(angle) * RADIAL_R,
    nx:    CX + Math.cos(angle) * NODE_R,
    ny:    CY + Math.sin(angle) * NODE_R,
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
  const cols  = autoCols(n);
  const rows  = Math.ceil(n / cols);
  const PX    = 28, PY = 28;
  const GT    = 160, NH = 40;
  const cellW = Math.floor((CW - PX * (cols + 1)) / cols);
  const cellH = Math.floor((CH - GT - PY * (rows + 1) - NH * rows - 60) / rows);
  return Array.from({ length: n }, (_, i) => ({
    cx: PX + (i % cols) * (cellW + PX) + cellW / 2,
    cy: GT + NH + PY + Math.floor(i / cols) * (cellH + PY + NH) + cellH / 2,
    w: cellW, h: cellH,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// CENTER PATTERNS (14 types)
// ═══════════════════════════════════════════════════════════════════════════════

const ALL_PATTERNS = [
  'arc', 'rings', 'spiral', 'neuron',
  'dna', 'atom', 'compass', 'radar',
  'hexgrid', 'sunburst', 'vortex', 'crystal', 'eye', 'infinity',
];

function pickPattern(n: number, opt: string): string {
  return opt !== 'random' ? opt : ALL_PATTERNS[n % ALL_PATTERNS.length];
}

type DC = CanvasRenderingContext2D;
type PFn = (ctx: DC, t: number, cx: number, cy: number, r: number, a: string, a2: string, al: number) => void;

const pat_arc: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al;
  const rot = t * 0.00025, rot2 = -t * 0.0004;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  ctx.shadowColor = a; ctx.shadowBlur = 32; ctx.strokeStyle = a; ctx.lineWidth = r * 0.28; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.75, 0.3, Math.PI * 2 - 0.3); ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot2);
  ctx.shadowColor = a2; ctx.shadowBlur = 22; ctx.strokeStyle = a2; ctx.lineWidth = r * 0.18; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.44, 0.6, Math.PI * 2 - 0.6); ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();
  ctx.save(); ctx.translate(cx, cy); ctx.shadowColor = a; ctx.shadowBlur = 28 + 12 * Math.sin(t * 0.005);
  ctx.fillStyle = a; ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
  ctx.restore();
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
    ctx.beginPath(); ctx.arc(0, 0, ring.rad, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.shadowBlur = 0; ctx.restore();
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
      const tt = s / 120, ro = r * 0.1 + r * 0.82 * tt, an = tt * Math.PI * 5;
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
    const an = (i / 6) * Math.PI * 2 + ROT, clr = i % 2 === 0 ? a : a2;
    const cpX = Math.cos(an + 0.4) * r * 0.55, cpY = Math.sin(an + 0.4) * r * 0.55;
    const eX  = Math.cos(an) * r * 0.85, eY = Math.sin(an) * r * 0.85;
    ctx.save(); ctx.translate(cx, cy); ctx.shadowColor = clr; ctx.shadowBlur = 16; ctx.strokeStyle = clr; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(cpX, cpY, eX, eY); ctx.stroke();
    ctx.fillStyle = clr; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(eX, eY, 8, 0, Math.PI * 2); ctx.fill();
    const pt = (t * 0.001 + i / 6) % 1, px = cpX * 2 * pt * (1 - pt) + eX * pt * pt, py = cpY * 2 * pt * (1 - pt) + eY * pt * pt;
    ctx.shadowBlur = 22; ctx.globalAlpha = al * (1 - Math.abs(pt - 0.5) * 2);
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
  }
  ctx.save(); ctx.translate(cx, cy); ctx.shadowColor = a; ctx.shadowBlur = 30 + 14 * Math.sin(t * 0.005);
  ctx.fillStyle = a; ctx.beginPath(); ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
  ctx.restore();
};

const pat_dna: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy);
  const ROT = t * 0.0008, STEPS = 80;
  for (let strand = 0; strand < 2; strand++) {
    const clr = strand === 0 ? a : a2;
    ctx.shadowColor = clr; ctx.shadowBlur = 18; ctx.strokeStyle = clr; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let s = 0; s <= STEPS; s++) {
      const tt = s / STEPS, angle = tt * Math.PI * 4 + ROT + strand * Math.PI;
      const x = Math.cos(angle) * r * 0.7, y = (tt - 0.5) * r * 1.8;
      if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.shadowBlur = 0;
  }
  for (let s = 0; s <= 14; s++) {
    const tt = s / 14, angle = tt * Math.PI * 4 + ROT;
    const x1 = Math.cos(angle) * r * 0.7, y = (tt - 0.5) * r * 1.8, x2 = Math.cos(angle + Math.PI) * r * 0.7;
    ctx.globalAlpha = al * 0.5; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
  }
  ctx.restore();
};

const pat_atom: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al;
  const ORBITS = [
    { tilt: 0, speed: 0.0015, clr: a }, { tilt: Math.PI / 3, speed: -0.001, clr: a2 },
    { tilt: Math.PI * 2 / 3, speed: 0.0012, clr: a },
  ];
  for (const orb of ORBITS) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(orb.tilt);
    ctx.shadowColor = orb.clr; ctx.shadowBlur = 14; ctx.strokeStyle = orb.clr; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 0.38, 0, 0, Math.PI * 2); ctx.stroke();
    const ea = t * orb.speed, ex = Math.cos(ea) * r * 0.9, ey = Math.sin(ea) * r * 0.38;
    ctx.shadowBlur = 22; ctx.fillStyle = orb.clr; ctx.beginPath(); ctx.arc(ex, ey, 8, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
  }
  ctx.save(); ctx.translate(cx, cy); ctx.shadowColor = a; ctx.shadowBlur = 32 + 12 * Math.sin(t * 0.005);
  ctx.fillStyle = a; ctx.beginPath(); ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
  ctx.restore();
};

const pat_compass: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy);
  const ROT = t * 0.0003;
  ctx.shadowColor = a; ctx.shadowBlur = 14; ctx.strokeStyle = a; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
  for (let i = 0; i < 8; i++) {
    const an = (i / 8) * Math.PI * 2 + ROT, isPrimary = i % 2 === 0;
    const len = isPrimary ? r * 0.75 : r * 0.5, clr = isPrimary ? a : a2;
    const tipX = Math.cos(an) * len, tipY = Math.sin(an) * len;
    ctx.save(); ctx.shadowColor = clr; ctx.shadowBlur = isPrimary ? 20 : 10; ctx.strokeStyle = clr; ctx.lineWidth = isPrimary ? 3 : 1.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(tipX, tipY); ctx.stroke();
    if (isPrimary) {
      const ah = 0.35;
      ctx.fillStyle = clr; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.moveTo(tipX, tipY);
      ctx.lineTo(Math.cos(an - ah) * len * 0.75, Math.sin(an - ah) * len * 0.75);
      ctx.lineTo(Math.cos(an + ah) * len * 0.75, Math.sin(an + ah) * len * 0.75);
      ctx.closePath(); ctx.fill();
    }
    ctx.shadowBlur = 0; ctx.restore();
  }
  ctx.shadowColor = a; ctx.shadowBlur = 28; ctx.fillStyle = a; ctx.beginPath(); ctx.arc(0, 0, r * 0.1, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.restore();
};

const pat_radar: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy);
  const scanAngle = (t * 0.0025) % (Math.PI * 2);
  ctx.shadowColor = a2; ctx.shadowBlur = 12; ctx.strokeStyle = a2; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  for (const fr of [0.55, 0.28]) {
    ctx.shadowBlur = 8; ctx.strokeStyle = a2; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, 0, r * fr, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.save(); ctx.rotate(scanAngle);
  const SECTOR = Math.PI / 3;
  const grad = ctx.createLinearGradient(0, 0, r * 0.9, 0);
  grad.addColorStop(0, hex2rgba(a, 0)); grad.addColorStop(0.7, hex2rgba(a, 0.35)); grad.addColorStop(1, hex2rgba(a, 0.65));
  ctx.fillStyle = grad; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * 0.92, -SECTOR * 0.1, 0); ctx.closePath(); ctx.fill();
  ctx.shadowColor = a; ctx.shadowBlur = 28; ctx.strokeStyle = a; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 0.92, 0); ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();
  for (let b = 0; b < 5; b++) {
    const bAngle = sf(b * 17.3) * Math.PI * 2, bR = (sf(b * 29.1) * 0.65 + 0.2) * r;
    const bx = Math.cos(bAngle) * bR, by = Math.sin(bAngle) * bR;
    const diff = ((scanAngle - bAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const blipA = diff < 1.5 ? Math.max(0, 1 - diff / 1.5) : 0;
    if (blipA > 0.05) {
      ctx.save(); ctx.globalAlpha = al * blipA;
      ctx.shadowColor = a; ctx.shadowBlur = 20; ctx.fillStyle = a;
      ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
    }
  }
  ctx.shadowColor = a; ctx.shadowBlur = 24; ctx.fillStyle = a; ctx.beginPath(); ctx.arc(0, 0, r * 0.1, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.restore();
};

const pat_hexgrid: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy);
  const ROT = t * 0.0004, HEX_R = r * 0.32;
  const positions = [
    { ox: 0, oy: 0 }, { ox: HEX_R * 1.73, oy: 0 }, { ox: -HEX_R * 1.73, oy: 0 },
    { ox: HEX_R * 0.87, oy: -HEX_R * 1.5 }, { ox: -HEX_R * 0.87, oy: -HEX_R * 1.5 },
    { ox: HEX_R * 0.87, oy: HEX_R * 1.5 }, { ox: -HEX_R * 0.87, oy: HEX_R * 1.5 },
  ];
  positions.forEach((pos, pi) => {
    const pulse = 1 + 0.08 * Math.sin(t * 0.004 + pi * 0.8), clr = pi === 0 ? a : pi % 2 === 0 ? a2 : a;
    ctx.save(); ctx.translate(pos.ox, pos.oy); ctx.rotate(ROT);
    ctx.shadowColor = clr; ctx.shadowBlur = pi === 0 ? 24 : 12; ctx.strokeStyle = clr; ctx.lineWidth = pi === 0 ? 3 : 1.8; ctx.globalAlpha = al * (pi === 0 ? 1 : 0.55);
    ctx.beginPath();
    for (let vi = 0; vi <= 6; vi++) {
      const va = (vi / 6) * Math.PI * 2, vx = Math.cos(va) * HEX_R * pulse, vy = Math.sin(va) * HEX_R * pulse;
      if (vi === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
    }
    ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();
  });
  ctx.restore();
};

const pat_sunburst: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy);
  const ROT = t * 0.0006, RAYS = 16;
  for (let i = 0; i < RAYS; i++) {
    const an = (i / RAYS) * Math.PI * 2 + ROT, isPrimary = i % 2 === 0;
    const len = isPrimary ? r * 0.92 : r * 0.62, clr = isPrimary ? a : a2;
    ctx.save(); ctx.globalAlpha = al * (isPrimary ? 1 : 0.55);
    ctx.shadowColor = clr; ctx.shadowBlur = isPrimary ? 20 : 8; ctx.strokeStyle = clr; ctx.lineWidth = isPrimary ? 3 : 1.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(an) * len, Math.sin(an) * len); ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();
  }
  ctx.shadowColor = a; ctx.shadowBlur = 38 + 16 * Math.sin(t * 0.005); ctx.fillStyle = a;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.restore();
};

const pat_vortex: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy);
  const ROT = t * 0.0018, RINGS = 5;
  for (let ri = 0; ri < RINGS; ri++) {
    const ringFrac = (ri + 1) / RINGS, ringR = r * ringFrac * 0.9, clr = ri % 2 === 0 ? a : a2;
    const startAngle = ROT * (1 + ri * 0.4);
    ctx.save(); ctx.shadowColor = clr; ctx.shadowBlur = 14; ctx.strokeStyle = clr; ctx.lineWidth = 2.5 - ri * 0.3;
    ctx.beginPath();
    for (let s = 0; s <= 60; s++) {
      const tt = s / 60, angle = tt * Math.PI * 2 + startAngle, pr = ringR * (0.6 + 0.4 * tt);
      if (s === 0) ctx.moveTo(Math.cos(angle) * pr, Math.sin(angle) * pr);
      else ctx.lineTo(Math.cos(angle) * pr, Math.sin(angle) * pr);
    }
    ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();
  }
  ctx.shadowColor = a; ctx.shadowBlur = 30; ctx.fillStyle = a; ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.restore();
};

const pat_crystal: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy);
  const ROT = t * 0.0005, FACETS = 6;
  for (let f = 0; f < FACETS; f++) {
    const an = (f / FACETS) * Math.PI * 2 + ROT, an2 = ((f + 1) / FACETS) * Math.PI * 2 + ROT, midAn = (an + an2) / 2;
    const p1x = Math.cos(an) * r * 0.82, p1y = Math.sin(an) * r * 0.82;
    const p2x = Math.cos(an2) * r * 0.82, p2y = Math.sin(an2) * r * 0.82;
    const pmx = Math.cos(midAn) * r * 0.38, pmy = Math.sin(midAn) * r * 0.38;
    const pulse = 0.65 + 0.35 * Math.sin(t * 0.003 + f), clr = f % 2 === 0 ? a : a2;
    ctx.save(); ctx.shadowColor = clr; ctx.shadowBlur = 16; ctx.strokeStyle = clr; ctx.lineWidth = 2; ctx.globalAlpha = al * pulse;
    ctx.beginPath(); ctx.moveTo(p1x, p1y); ctx.lineTo(p2x, p2y); ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(p1x, p1y); ctx.lineTo(pmx, pmy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p2x, p2y); ctx.lineTo(pmx, pmy); ctx.stroke();
    ctx.shadowBlur = 0; ctx.restore();
  }
  const glint = 1 + 0.5 * Math.sin(t * 0.007);
  ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 28 * glint; ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.08 * glint, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.restore();
};

const pat_eye: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy);
  const BLINK = Math.max(0.2, Math.abs(Math.sin(t * 0.0006)));
  const EW = r * 1.4, EH = r * 0.6 * BLINK;
  ctx.shadowColor = a; ctx.shadowBlur = 20; ctx.strokeStyle = a; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-EW / 2, 0); ctx.quadraticCurveTo(0, -EH, EW / 2, 0); ctx.quadraticCurveTo(0, EH, -EW / 2, 0); ctx.stroke(); ctx.shadowBlur = 0;
  const irisR = r * 0.32 * BLINK;
  if (irisR > 4) {
    ctx.shadowColor = a2; ctx.shadowBlur = 24; ctx.strokeStyle = a2; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, irisR, 0, Math.PI * 2); ctx.stroke();
    const ROT = t * 0.001;
    for (let i = 0; i < 8; i++) {
      const an = (i / 8) * Math.PI * 2 + ROT; ctx.strokeStyle = a2; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Math.cos(an) * irisR * 0.3, Math.sin(an) * irisR * 0.3);
      ctx.lineTo(Math.cos(an) * irisR * 0.95, Math.sin(an) * irisR * 0.95); ctx.stroke();
    }
    ctx.shadowBlur = 0; ctx.shadowColor = a; ctx.shadowBlur = 18; ctx.fillStyle = a;
    ctx.beginPath(); ctx.arc(0, 0, irisR * 0.32, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  }
  ctx.restore();
};

const pat_infinity: PFn = (ctx, t, cx, cy, r, a, a2, al) => {
  ctx.save(); ctx.globalAlpha = al; ctx.translate(cx, cy);
  const rx = r * 0.48, ry = r * 0.26, travel = (t * 0.0015) % 1;
  for (let lobe = 0; lobe < 2; lobe++) {
    const ox = lobe === 0 ? -rx * 0.55 : rx * 0.55, clr = lobe === 0 ? a : a2;
    ctx.shadowColor = clr; ctx.shadowBlur = 20; ctx.strokeStyle = clr; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(ox, 0, rx * 0.55, ry, 0, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
  }
  const steps = 200; let px = 0, py = 0;
  for (let s = 0; s <= steps; s++) {
    const tt = (s / steps + travel) % 1, an = tt * Math.PI * 2, lobe = an < Math.PI ? 0 : 1;
    const ox = lobe === 0 ? -rx * 0.55 : rx * 0.55, la = lobe === 0 ? an : an - Math.PI;
    if (s === Math.floor(travel * steps)) { px = ox + Math.cos(la) * rx * 0.55; py = Math.sin(la) * ry; }
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
// TEXT-BURST EXPLOSION (characters fly apart)
// ═══════════════════════════════════════════════════════════════════════════════

interface BurstEntry { text: string; cx: number; cy: number; fsz: number; color: string; seed: number; }

/**
 * Draws characters from each entry flying outward — the "text shatter" effect.
 * burstT 0→1: characters accelerate outward
 */
function drawTextBurst(
  ctx: DC, entries: BurstEntry[], burstT: number, accent: string,
) {
  if (burstT <= 0) return;
  const et     = easeOutCubic(Math.min(burstT, 1));
  const fadeA  = Math.max(0, 1 - burstT * burstT * 1.2);
  if (fadeA <= 0.01) return;

  ctx.save();
  const ff = `"Noto Sans SC", sans-serif`;
  for (const entry of entries) {
    ctx.font = `900 ${entry.fsz}px ${ff}`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';

    const chars  = [...entry.text];
    const widths = chars.map(c => ctx.measureText(c).width);
    const totalW = widths.reduce((a, b) => a + b, 0);
    let charX = entry.cx - totalW / 2;

    chars.forEach((ch, ci) => {
      const cw     = widths[ci];
      const charCX = charX + cw / 2;
      charX       += cw;

      const cseed = entry.seed + ci * 137.5;
      // Radial outward angle with large random spread = text shatters in all directions
      const explosionAngle = Math.atan2(charCX - CX, entry.cy - CY) +
        (sf(cseed) - 0.5) * Math.PI * 2.2;
      const dist = (100 + sf(cseed * 2.3) * 800) * et;
      const rot  = (sf(cseed * 3.7) - 0.5) * et * Math.PI * 3;
      const tx   = charCX + Math.cos(explosionAngle) * dist;
      const ty   = entry.cy + Math.sin(explosionAngle) * dist;
      // Scale chars down as they fly
      const scale = 1 + et * sf(cseed * 9.1) * 0.4;
      const charA = fadeA * (0.65 + sf(cseed * 5.1) * 0.35);
      if (charA <= 0.01) return;

      ctx.save();
      ctx.globalAlpha = charA;
      ctx.translate(tx, ty);
      ctx.rotate(rot);
      ctx.scale(scale, scale);
      ctx.fillStyle   = entry.color;
      ctx.shadowColor = accent;
      ctx.shadowBlur  = 14;
      ctx.fillText(ch, -cw / 2, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
    });
  }
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCAN LINE FROM CENTER
// ═══════════════════════════════════════════════════════════════════════════════

function drawScanLine(
  ctx: DC,
  prevAngle: number,
  targetAngle: number,
  sweepT: number,
  innerR: number,
  outerR: number,
  accent: string,
) {
  if (sweepT <= 0) return;
  const SWEEP_DUR = 0.45;
  let currentAngle: number, beamAlpha: number;

  if (sweepT < SWEEP_DUR) {
    currentAngle = lerp(prevAngle, targetAngle, easeOutCubic(sweepT / SWEEP_DUR));
    beamAlpha    = sweepT / SWEEP_DUR;
  } else {
    currentAngle = targetAngle;
    beamAlpha    = Math.max(0, 1 - (sweepT - SWEEP_DUR) / (1 - SWEEP_DUR) * 1.3);
  }
  if (beamAlpha <= 0.01) return;

  const tipX = CX + Math.cos(currentAngle) * outerR, tipY = CY + Math.sin(currentAngle) * outerR;
  const basX = CX + Math.cos(currentAngle) * innerR, basY = CY + Math.sin(currentAngle) * innerR;

  ctx.save(); ctx.globalAlpha = beamAlpha;

  // Sweep trail
  ctx.save(); ctx.translate(CX, CY);
  const trailSector = Math.PI / 10;
  const sgrad = ctx.createLinearGradient(0, 0, outerR, 0);
  sgrad.addColorStop(0, hex2rgba(accent, 0)); sgrad.addColorStop(1, hex2rgba(accent, 0.22 * beamAlpha));
  ctx.fillStyle = sgrad;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, outerR, currentAngle - trailSector, currentAngle, false); ctx.closePath(); ctx.fill();
  ctx.restore();

  // Main beam
  const bgrad = ctx.createLinearGradient(basX, basY, tipX, tipY);
  bgrad.addColorStop(0, hex2rgba(accent, 0.2)); bgrad.addColorStop(0.6, hex2rgba(accent, 0.85)); bgrad.addColorStop(1, '#ffffff');
  ctx.shadowColor = accent; ctx.shadowBlur = 28; ctx.strokeStyle = bgrad; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(basX, basY); ctx.lineTo(tipX, tipY); ctx.stroke();

  // Arrowhead
  const AH = 18, aBack = currentAngle + Math.PI;
  ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX + Math.cos(aBack - 0.4) * AH, tipY + Math.sin(aBack - 0.4) * AH);
  ctx.lineTo(tipX + Math.cos(aBack + 0.4) * AH, tipY + Math.sin(aBack + 0.4) * AH);
  ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0; ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 1: RADIAL LABEL BOX (keyword label + short sentence, same box)
// ═══════════════════════════════════════════════════════════════════════════════

interface LabelBoxLayout {
  bx: number; by: number; bw: number; bh: number;
  labelLineW: number; numW: number; labelFsz: number; shortFsz: number;
  shortLines: string[]; PAD_X: number; PAD_Y: number; SEP: number;
}

function measureLabelBox(
  ctx: DC, numStr: string, label: string, short: string,
  labelFsz: number, shortFsz: number,
  angle: number,
): LabelBoxLayout {
  const ff       = `"Noto Sans SC", sans-serif`;
  const PAD_X = 20, PAD_Y = 16, SEP = 10;

  ctx.font = `700 ${labelFsz}px ${ff}`;
  const numW    = ctx.measureText(numStr).width;
  const labelW  = ctx.measureText(label).width;
  const labelLineW = numW + 6 + labelW;

  ctx.font = `600 ${shortFsz}px ${ff}`;
  const maxShortW = MAX_BOX_W - PAD_X * 2;
  const shortLines = short ? wrapText(ctx, short, maxShortW) : [];
  const shortMaxW  = shortLines.reduce((mx, ln) => Math.max(mx, ctx.measureText(ln).width), 0);

  const innerW = Math.min(MAX_BOX_W - PAD_X * 2, Math.max(labelLineW, shortMaxW));
  const bw = innerW + PAD_X * 2;
  const bh = PAD_Y + labelFsz +
    (shortLines.length > 0 ? SEP + 1 + SEP + shortLines.length * (shortFsz + 4) - 4 : 0) +
    PAD_Y;

  // Anchor on inner edge (closest to center) at NODE_R + 14
  const cosA = Math.cos(angle), sinA = Math.sin(angle);
  const anchorX = CX + cosA * (NODE_R + 14), anchorY = CY + sinA * (NODE_R + 14);

  let bx: number, by: number;
  if (cosA > 0.15) {        bx = anchorX;         by = anchorY - bh / 2; }   // right
  else if (cosA < -0.15) {  bx = anchorX - bw;    by = anchorY - bh / 2; }   // left
  else if (sinA < 0)  {     bx = anchorX - bw / 2; by = anchorY - bh; }      // top
  else                {     bx = anchorX - bw / 2; by = anchorY; }            // bottom

  return { bx, by, bw, bh, labelLineW, numW, labelFsz, shortFsz, shortLines, PAD_X, PAD_Y, SEP };
}

function drawRadialLabel(
  ctx: DC,
  i: number,
  n: number,
  label: string,
  short: string,
  enterT: number,
  alpha: number,
  borderProgress: number,
  accent: string,
  r: ReturnType<typeof resolveOpts>,
): LabelBoxLayout {
  const { angle } = labelPos(i, n);
  const eased     = easeOutBack(Math.min(enterT, 0.999));
  const numStr    = String(i + 1).padStart(2, '0');
  const ff        = `"Noto Sans SC", sans-serif`;

  const L = measureLabelBox(ctx, numStr, label, short, r.radialFsz, r.radialShortFsz, angle);
  const { bx, by, bw, bh, numW, PAD_X, PAD_Y, SEP, shortLines } = L;

  // Slide-in offset
  const slideOff = (1 - eased) * 65;
  const sbx = bx + Math.cos(angle) * slideOff;
  const sby = by + Math.sin(angle) * slideOff;

  ctx.save(); ctx.globalAlpha = alpha;

  // Border draws left → right (clip to partial width)
  if (borderProgress > 0.02 && eased > 0.4) {
    ctx.save();
    ctx.beginPath(); ctx.rect(sbx - 2, sby - 2, (bw + 4) * borderProgress, bh + 4); ctx.clip();
    ctx.shadowColor = accent; ctx.shadowBlur = 16;
    ctx.strokeStyle = accent; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(sbx, sby, bw, bh, 10); ctx.stroke();
    ctx.shadowBlur = 0; ctx.restore();
  }

  if (eased > 0.3) {
    const textA = clamp((eased - 0.3) / 0.7, 0, 1);
    ctx.globalAlpha = alpha * textA;

    // Number in accent color
    ctx.font = `700 ${r.radialFsz}px ${ff}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = r.radialNumClr; ctx.shadowColor = r.radialNumClr; ctx.shadowBlur = 16;
    ctx.fillText(numStr, sbx + PAD_X, sby + PAD_Y);

    // Label
    ctx.fillStyle = r.radialClr; ctx.shadowColor = r.radialClr; ctx.shadowBlur = 8;
    ctx.fillText(label, sbx + PAD_X + numW + 6, sby + PAD_Y);
    ctx.shadowBlur = 0;

    // Short sentence
    if (shortLines.length > 0) {
      const sepY = sby + PAD_Y + r.radialFsz + SEP;
      ctx.save(); ctx.globalAlpha = alpha * textA * 0.4;
      ctx.strokeStyle = accent; ctx.lineWidth = 1; ctx.setLineDash([3, 6]);
      ctx.beginPath(); ctx.moveTo(sbx + PAD_X, sepY); ctx.lineTo(sbx + bw - PAD_X, sepY); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();

      ctx.font = `600 ${r.radialShortFsz}px ${ff}`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillStyle = r.radialShortClr; ctx.shadowColor = accent; ctx.shadowBlur = 8;
      shortLines.forEach((line, li) => ctx.fillText(line, sbx + PAD_X, sepY + SEP + li * (r.radialShortFsz + 4)));
      ctx.shadowBlur = 0;
    }
  }
  ctx.restore();
  return { ...L, bx: sbx, by: sby };
}

/** Draw dashed connector + node dot */
function drawConnector(ctx: DC, i: number, n: number, alpha: number, accent: string) {
  if (alpha <= 0.05) return;
  const { nx, ny, angle } = labelPos(i, n);
  const lx0 = CX + Math.cos(angle) * INNER_R, ly0 = CY + Math.sin(angle) * INNER_R;
  ctx.save();
  ctx.globalAlpha = alpha * 0.55;
  ctx.strokeStyle = accent; ctx.lineWidth = 1.5; ctx.shadowColor = accent; ctx.shadowBlur = 6;
  ctx.setLineDash([4, 8]);
  ctx.beginPath(); ctx.moveTo(lx0, ly0); ctx.lineTo(nx, ny); ctx.stroke();
  ctx.setLineDash([]); ctx.shadowBlur = 0; ctx.globalAlpha = alpha;
  ctx.shadowColor = accent; ctx.shadowBlur = 14; ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(nx, ny, 7, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2: BURST TRANSITION (text shatter)
// ═══════════════════════════════════════════════════════════════════════════════

function drawBurstTransition(
  ctx: DC, burstT: number, accent: string, burstFx: string,
  textEntries: BurstEntry[],
) {
  if (burstT <= 0 || burstT >= 1) return;

  switch (burstFx) {
    case 'flash': {
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - burstT * 2.5);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, CW, CH); ctx.restore();
      break;
    }
    case 'wipe': {
      ctx.save(); ctx.globalAlpha = 1 - burstT;
      ctx.fillStyle = accent;
      ctx.beginPath(); ctx.arc(CX, CY, burstT * Math.hypot(CW, CH) * 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      break;
    }
    case 'shatter':
    default: {
      // Text characters shatter outward
      drawTextBurst(ctx, textEntries, burstT, accent);
      // White flash overlay
      const flashA = Math.max(0, 0.6 - burstT * 1.8);
      if (flashA > 0) {
        ctx.save(); ctx.globalAlpha = flashA;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, CW, CH);
        ctx.restore();
      }
      break;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3: KEYWORD BOX + DESC
// ═══════════════════════════════════════════════════════════════════════════════

const KW_BOX_X  = 60, KW_BOX_W = 490, KW_TOP_Y = 100;
const DESC_COL_X = KW_BOX_X + KW_BOX_W + 48;
const DESC_COL_W = CW - DESC_COL_X - 60;

function itemRowY(i: number, n: number) {
  const AVAIL = CH - KW_TOP_Y - 80;
  return KW_TOP_Y + (i + 0.5) * Math.min(100, AVAIL / Math.max(n, 1));
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
  const numW = ctx.measureText(numStr).width, labW = ctx.measureText(label).width;
  const PAD_X = 24, PAD_Y = 14;
  const boxW  = Math.min(KW_BOX_W, numW + 6 + labW + PAD_X * 2);
  const boxH  = fsz + PAD_Y * 2;
  const bx = KW_BOX_X, by = rowY - boxH / 2, bc = r.kwBoxBorderClr;
  const eased = easeOutBack(Math.min(enterT, 0.999));
  const alpha = clamp(enterT * 2, 0, 1);

  ctx.save(); ctx.globalAlpha = alpha;
  if (r.kwBoxBgA > 0.01) {
    ctx.fillStyle = hex2rgba(bc, r.kwBoxBgA);
    ctx.beginPath(); ctx.roundRect(bx, by, boxW * eased, boxH, r.kwBoxBR); ctx.fill();
  }
  // Border draws left → right
  ctx.save(); ctx.beginPath(); ctx.rect(bx - 4, by - 4, (boxW + 8) * eased, boxH + 8); ctx.clip();
  ctx.shadowColor = bc; ctx.shadowBlur = 18 + highlightT * 20; ctx.strokeStyle = bc; ctx.lineWidth = r.kwBoxBW;
  ctx.beginPath(); ctx.roundRect(bx, by, boxW, boxH, r.kwBoxBR); ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();

  if (eased > 0.3) {
    ctx.globalAlpha = alpha * clamp((eased - 0.3) / 0.7, 0, 1);
    ctx.font = `700 ${fsz}px ${ff}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = bc; ctx.shadowColor = bc; ctx.shadowBlur = 14 + highlightT * 10;
    ctx.fillText(numStr, bx + PAD_X, rowY);
    ctx.fillStyle = r.kwBoxClr; ctx.shadowColor = r.kwBoxClr; ctx.shadowBlur = 8;
    ctx.fillText(label, bx + PAD_X + numW + 6, rowY); ctx.shadowBlur = 0;
  }
  ctx.restore();
}

function drawDescItem(
  ctx: DC, i: number, n: number, desc: string, te: number, accent: string, r: ReturnType<typeof resolveOpts>,
) {
  const rowY = itemRowY(i, n);
  const fsz  = r.descFsz;
  ctx.font = `400 ${fsz}px "Noto Sans SC", sans-serif`;
  const lines = wrapText(ctx, desc, DESC_COL_W).slice(0, 3);
  const lineH = fsz + 8;
  let alpha = 1, offsetX = 0;
  switch (r.descEnter) {
    case 'fadeIn':     alpha = easeOutCubic(clamp(te / 500, 0, 1)); break;
    case 'slideRight': alpha = clamp(te / 400, 0, 1); offsetX = lerp(60, 0, easeOutCubic(clamp(te / 500, 0, 1))); break;
  }
  const clipChars = r.descEnter === 'typewriter' ? Math.min(Math.floor(te / 38), desc.length) : desc.length;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.font = `400 ${fsz}px "Noto Sans SC", sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = r.descClr; ctx.shadowColor = accent; ctx.shadowBlur = 6;
  const startY = rowY - ((lines.length - 1) * lineH) / 2;
  let charCount = 0;
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
// PHASE 4: GRID (with text-burst explosion)
// ═══════════════════════════════════════════════════════════════════════════════

function drawGridCell(
  ctx: DC, cell: GridCell, point: GeneratedContent['points'][number], index: number,
  enterT: number, explodeT: number, elapsed: number, accent: string,
  r: ReturnType<typeof resolveOpts>, seed: number,
) {
  const { cx, cy, w, h } = cell;

  // ── Normal enter animation ────────────────────────────────────────────────
  let entAlpha = 1;
  if (explodeT <= 0) {
    switch (r.gridEnter) {
      case 'zoomIn':  entAlpha = clamp(enterT * 3, 0, 1); break;
      case 'flipIn':  entAlpha = clamp(enterT * 2, 0, 1); break;
      case 'slideUp': entAlpha = clamp(enterT * 2, 0, 1); break;
      default:        entAlpha = easeOutCubic(enterT);
    }
    let scaleE = 1, slideOffY = 0;
    switch (r.gridEnter) {
      case 'zoomIn':  scaleE = lerp(0.1, 1, easeOutBack(Math.min(enterT, 0.999))); break;
      case 'flipIn':  scaleE = Math.abs(Math.sin(enterT * Math.PI / 2)); break;
      case 'slideUp': slideOffY = lerp(70, 0, easeOutCubic(enterT)); break;
    }

    ctx.save(); ctx.globalAlpha = entAlpha;
    ctx.translate(cx, cy + slideOffY); ctx.scale(scaleE, scaleE);

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

    // Keyword text
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
    return;
  }

  // ── Explosion: characters fly apart ──────────────────────────────────────
  const kwFsz = Math.min(r.gridKwFsz, h * 0.36);
  drawTextBurst(ctx, [{
    text:  point.label,
    cx,
    cy:    cy - h * 0.1,
    fsz:   kwFsz,
    color: r.gridKwClr,
    seed,
  }], explodeT, accent);
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
  const SCAN_DUR = 400;

  const { p1Start, p2Start, p3Start, p4Start } = aiTechPhases(displayN);

  const inP4    = elapsed >= p4Start;
  const inP3    = !inP4 && elapsed >= p3Start;
  const inBurst = !inP3 && !inP4 && elapsed >= p2Start;
  const inP1    = !inBurst && !inP3 && !inP4;

  // ── PHASE 4: Grid ────────────────────────────────────────────────────────
  if (inP4) {
    const cells    = computeGrid(displayN);
    const allInMs  = AT.gridStagger * (displayN - 1) + 400;
    const exStart  = p4Start + allInMs + 200 + AT.gridHold;

    const hdrAlpha = clamp((elapsed - p4Start) / 400, 0, 1);
    if (hdrAlpha > 0) {
      ctx.save(); ctx.globalAlpha = hdrAlpha;
      ctx.font = `700 52px "Noto Sans SC", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff'; ctx.shadowColor = accent; ctx.shadowBlur = 26;
      ctx.fillText(content.title, CX, 90); ctx.shadowBlur = 0; ctx.restore();
    }
    for (let i = 0; i < displayN; i++) {
      const te      = elapsed - (p4Start + i * AT.gridStagger);
      if (te <= 0) continue;
      const explodeT = elapsed >= exStart ? clamp((elapsed - exStart) / AT.explodeDur, 0, 1) : 0;
      drawGridCell(ctx, cells[i], content.points[i], i, clamp(te / 400, 0, 1), explodeT, elapsed, accent, r, i * 1234.5);
    }
    return;
  }

  // ── BURST TRANSITION ─────────────────────────────────────────────────────
  if (inBurst) {
    const burstT = clamp((elapsed - p2Start) / AT.burstDur, 0, 1);

    // Build text burst entries from all visible keyword labels
    const burstEntries: BurstEntry[] = content.points.slice(0, displayN).map((pt, i) => {
      const { cx, cy } = labelPos(i, displayN);
      return { text: pt.label, cx, cy, fsz: r.radialFsz, color: r.radialClr, seed: i * 77.3 };
    });

    // Faded radial background
    const radialFade = 1 - easeOutCubic(burstT);
    if (radialFade > 0.02) {
      ctx.save(); ctx.globalAlpha = radialFade;
      for (let i = 0; i < displayN; i++) {
        drawConnector(ctx, i, displayN, 0.7, accent);
        drawRadialLabel(ctx, i, displayN, content.points[i].label, content.points[i].short ?? '', 1, 0.6, 1, accent, r);
      }
      drawCenterPattern(ctx, elapsed, CX, CY, PAT_R, accent, accent2, pattern, 1);
      ctx.restore();
    }

    drawBurstTransition(ctx, burstT, accent, r.burstFx, burstEntries);
    return;
  }

  // ── PHASE 3: Keyword boxes + desc ────────────────────────────────────────
  if (inP3) {
    const divAlpha = clamp((elapsed - p3Start) / 350, 0, 1);
    if (divAlpha > 0) {
      ctx.save(); ctx.globalAlpha = divAlpha * 0.4;
      ctx.strokeStyle = accent; ctx.lineWidth = 1; ctx.shadowColor = accent; ctx.shadowBlur = 8; ctx.setLineDash([4, 10]);
      ctx.beginPath(); ctx.moveTo(DESC_COL_X - 24, KW_TOP_Y - 10); ctx.lineTo(DESC_COL_X - 24, CH - 50); ctx.stroke();
      ctx.setLineDash([]); ctx.shadowBlur = 0; ctx.restore();
    }
    for (let i = 0; i < displayN; i++) {
      const te       = elapsed - (p3Start + i * AT.descSlot);
      const boxEnter = te > 0 ? clamp(te / 450, 0, 1) : 0;
      const boxAlpha = te > 0 ? clamp(te / 300, 0, 1) : 0;
      const isActive = te >= 0 && (i === displayN - 1 || elapsed < p3Start + (i + 1) * AT.descSlot + 200);
      if (boxAlpha > 0)
        drawKwBox(ctx, i, displayN, content.points[i].label, boxEnter, isActive ? clamp((te > 0 ? te : 0) / 300, 0, 1) : 0, accent, r);
      if (te > 0 && content.points[i].desc)
        drawDescItem(ctx, i, displayN, content.points[i].desc!, te, accent, r);
    }
    return;
  }

  // ── PHASE 1: Radial keywords (label + short in same box) ─────────────────
  if (!inP1) return;

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

  // Keywords one by one with scan line + box
  for (let i = 0; i < displayN; i++) {
    const kStart  = p1Start + i * AT.keywordSlot;
    const te      = elapsed - kStart;
    if (te <= 0) continue;

    const enterT  = clamp(te / 500, 0, 1);
    const alpha   = clamp(te / 350, 0, 1);
    const borderP = clamp((te - 300) / 500, 0, 1);   // border animates 300ms after label

    drawConnector(ctx, i, displayN, clamp((te - 350) / 400, 0, 1), accent);

    // Scan line sweeps from prev keyword angle to current
    const prevAngle = i === 0
      ? labelPos(0, displayN).angle - Math.PI * 0.6
      : labelPos(i - 1, displayN).angle;
    const sweepT = clamp(te / SCAN_DUR, 0, 1);
    drawScanLine(ctx, prevAngle, labelPos(i, displayN).angle, sweepT, INNER_R, NODE_R + 25, accent);

    drawRadialLabel(ctx, i, displayN, content.points[i].label, content.points[i].short ?? '', enterT, alpha, borderP, accent, r);
  }
}
