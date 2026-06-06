/**
 * cards-keyword.ts
 * 6 keyword arrangement layout variants:
 *   cloud  — word cloud scatter with varying sizes (default)
 *   grid   — equal-cell grid, title in center
 *   radial — concentric rings around center word
 *   orbit  — elliptical atom-style orbits
 *   card   — numbered bordered cards
 *   flow   — cascading columns (digital rain)
 */

import type { GeneratedContent, KeywordOptions } from '../../types/video';
import {
  CW, CH, clamp, lerp, easeOutCubic, easeOutBack, hex2rgba, T,
  KW_TITLE_HOLD, KW_CENTER_DUR,
} from './helpers';

type DC = CanvasRenderingContext2D;

// ── Seeded pseudo-random ──────────────────────────────────────────────────────
function sf(seed: number): number {
  return (((Math.sin(seed * 0.9999) * 43758.5) % 1) + 1) % 1;
}

// ── Options resolver ──────────────────────────────────────────────────────────
function ro(opts: KeywordOptions | undefined, accent: string) {
  const o = opts ?? {} as KeywordOptions;
  const ac = o.accentColor || accent;
  return {
    layout:       o.layout           ?? 'cloud',
    accent:       ac,
    centerFsz:    o.centerFontSize   ?? 120,
    centerColor:  o.centerColor      || ac,
    kwFsz:        o.keywordFontSize  ?? 48,
    kwColor:      o.keywordColor     ?? '#ffffff',
    ff:           o.fontFamily       ? `"${o.fontFamily}", sans-serif` : '"Noto Sans SC", sans-serif',
    fw:           o.fontWeight       ?? 700,
    stagger:      o.staggerMs        ?? 180,
    gridLine:     o.gridLineColor    || ac,
    cardBorder:   o.cardBorderColor  || ac,
  };
}

const CX = CW / 2, CY = CH / 2;

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function drawCenterWord(
  ctx: DC, elapsed: number, word: string, p0: number, r: ReturnType<typeof ro>,
) {
  const t = clamp((elapsed - p0) / KW_CENTER_DUR, 0, 1);
  if (t <= 0) return;
  const sc = easeOutBack(Math.min(t, 0.999));
  ctx.save();
  ctx.globalAlpha = clamp(t * 2, 0, 1);
  ctx.translate(CX, CY);
  ctx.scale(sc, sc);
  ctx.font = `800 ${r.centerFsz}px ${r.ff}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = r.centerColor;
  ctx.shadowColor = r.accent;
  ctx.shadowBlur = 55;
  ctx.fillText(word, 0, 0);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT 1: CLOUD
// ─────────────────────────────────────────────────────────────────────────────

function cloudPos(i: number, baseFsz: number): { x: number; y: number; fsz: number } {
  // 3 rings, widened horizontally to fill 1920×1080
  const rings = [
    { r: 210, xScale: 1.55, cap: 8,  fszScale: 0.92 },
    { r: 380, xScale: 1.60, cap: 14, fszScale: 0.70 },
    { r: 530, xScale: 1.55, cap: 22, fszScale: 0.55 },
  ];
  let rem = i;
  for (const ring of rings) {
    if (rem < ring.cap) {
      const base  = (rem / ring.cap) * Math.PI * 2 - Math.PI / 2;
      const aOff  = (sf(i * 2.3 + 2) - 0.5) * 0.35;
      const rOff  = (sf(i * 3.7 + 1) - 0.5) * 65;
      const r     = ring.r + rOff;
      const angle = base + aOff;
      return {
        x: CX + Math.cos(angle) * r * ring.xScale,
        y: CY + Math.sin(angle) * r,
        fsz: Math.round(baseFsz * ring.fszScale),
      };
    }
    rem -= ring.cap;
  }
  // Overflow: outer arc
  const angle = (i / 44) * Math.PI * 2;
  return {
    x: CX + Math.cos(angle) * 750,
    y: CY + Math.sin(angle) * 490,
    fsz: Math.round(baseFsz * 0.48),
  };
}

function drawCloud(
  ctx: DC, elapsed: number, content: GeneratedContent,
  r: ReturnType<typeof ro>, p0: number,
) {
  const kws = content.points.slice(1).map(p => p.label).filter(Boolean);
  drawCenterWord(ctx, elapsed, content.points[0]?.label ?? '', p0, r);

  const kwStart = p0 + KW_CENTER_DUR;
  for (let i = 0; i < kws.length; i++) {
    const te = elapsed - (kwStart + i * r.stagger);
    if (te <= 0) continue;
    const alpha = clamp(te / 400, 0, 1);
    const pos   = cloudPos(i, r.kwFsz);
    // Depth: keywords further out are slightly transparent
    const depth = 0.6 + 0.4 * (1 - i / Math.max(kws.length, 1) * 0.6);
    ctx.save();
    ctx.globalAlpha = alpha * depth;
    ctx.font = `${r.fw} ${pos.fsz}px ${r.ff}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = r.kwColor;
    ctx.fillText(kws[i], pos.x, pos.y);
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT 2: GRID
// ─────────────────────────────────────────────────────────────────────────────

function drawGrid(
  ctx: DC, elapsed: number, content: GeneratedContent,
  r: ReturnType<typeof ro>, p0: number,
) {
  const kws = content.points.slice(1).map(p => p.label).filter(Boolean);
  const COLS = 8, ROWS = 6;
  const TOP_Y = 90;
  const cellW = CW / COLS;
  const cellH = (CH - TOP_Y) / ROWS;

  // Center 2×2 cells (cols 3-4, rows 2-3)
  const cC1 = 3, cC2 = 4, cR1 = 2, cR2 = 3;
  const centX = (cC1 + cC2 + 1) / 2 * cellW;
  const centY = TOP_Y + (cR1 + cR2 + 1) / 2 * cellH;

  // All cells except center block
  const cells: { cx: number; cy: number }[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (row >= cR1 && row <= cR2 && col >= cC1 && col <= cC2) continue;
      cells.push({ cx: (col + 0.5) * cellW, cy: TOP_Y + (row + 0.5) * cellH });
    }
  }

  // Grid lines
  const lineA = clamp((elapsed - p0) / 500, 0, 1) * 0.14;
  if (lineA > 0.01) {
    ctx.save(); ctx.globalAlpha = lineA;
    ctx.strokeStyle = r.gridLine; ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * cellW, TOP_Y); ctx.lineTo(c * cellW, CH); ctx.stroke();
    }
    for (let row = 0; row <= ROWS; row++) {
      ctx.beginPath(); ctx.moveTo(0, TOP_Y + row * cellH); ctx.lineTo(CW, TOP_Y + row * cellH); ctx.stroke();
    }
    ctx.restore();
  }

  // Center accent glow
  const hlA = clamp((elapsed - p0) / 600, 0, 1) * 0.22;
  if (hlA > 0.01) {
    ctx.save(); ctx.globalAlpha = hlA;
    const g = ctx.createRadialGradient(centX, centY, 0, centX, centY, cellW * 2);
    g.addColorStop(0, r.accent); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cC1 * cellW, TOP_Y + cR1 * cellH, 2 * cellW, 2 * cellH);
    ctx.restore();
  }

  // Center word — show full title in grid center
  const cT = clamp((elapsed - p0) / KW_CENTER_DUR, 0, 1);
  if (cT > 0) {
    const sc = easeOutBack(Math.min(cT, 0.999));
    ctx.save();
    ctx.globalAlpha = clamp(cT * 2, 0, 1);
    ctx.translate(centX, centY);
    ctx.scale(sc, sc);
    ctx.shadowColor = r.accent; ctx.shadowBlur = 40;
    // Try to fit the center keyword first; fall back to wrapping the title
    const word = content.points[0]?.label ?? content.title;
    ctx.font = `800 ${r.centerFsz}px ${r.ff}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = r.centerColor;
    ctx.fillText(word, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Surrounding keywords
  const kwStart = p0 + KW_CENTER_DUR;
  for (let i = 0; i < Math.min(kws.length, cells.length); i++) {
    const te = elapsed - (kwStart + i * r.stagger);
    if (te <= 0) continue;
    const alpha = clamp(te / 350, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${r.fw} ${r.kwFsz}px ${r.ff}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = r.kwColor;
    ctx.fillText(kws[i], cells[i].cx, cells[i].cy);
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT 3: RADIAL (concentric rings)
// ─────────────────────────────────────────────────────────────────────────────

function drawRadial(
  ctx: DC, elapsed: number, content: GeneratedContent,
  r: ReturnType<typeof ro>, p0: number,
) {
  const kws = content.points.slice(1).map(p => p.label).filter(Boolean);
  const n   = kws.length;
  const ring1 = Math.min(8,  Math.ceil(n * 0.28));
  const ring2 = Math.min(14, Math.ceil(n * 0.44));
  const ring3 = n - ring1 - ring2;

  const rings = [
    { r: 230, count: ring1 },
    { r: 400, count: ring2 },
    { r: 550, count: ring3 },
  ];

  // Dashed ring arcs
  const ringA = clamp((elapsed - p0 - 150) / 600, 0, 1);
  if (ringA > 0.01) {
    ctx.save(); ctx.globalAlpha = ringA * 0.28;
    ctx.strokeStyle = r.accent; ctx.lineWidth = 1.5; ctx.setLineDash([6, 14]);
    for (const ring of rings) {
      if (ring.count <= 0) continue;
      ctx.beginPath(); ctx.arc(CX, CY, ring.r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.restore();
  }

  drawCenterWord(ctx, elapsed, content.points[0]?.label ?? '', p0, r);

  const kwStart = p0 + KW_CENTER_DUR;
  let kwIdx = 0;
  for (const ring of rings) {
    for (let j = 0; j < ring.count && kwIdx < kws.length; j++, kwIdx++) {
      const te = elapsed - (kwStart + kwIdx * r.stagger);
      if (te <= 0) continue;
      const alpha  = clamp(te / 350, 0, 1);
      const angle  = (j / ring.count) * Math.PI * 2 - Math.PI / 2;
      const kx     = CX + Math.cos(angle) * ring.r * 1.45; // widen x
      const ky     = CY + Math.sin(angle) * ring.r;
      const slideT = easeOutCubic(clamp(te / 450, 0, 1));

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `${r.fw} ${r.kwFsz}px ${r.ff}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = r.kwColor;
      ctx.shadowColor = r.accent; ctx.shadowBlur = 8;
      ctx.fillText(kws[kwIdx], CX + (kx - CX) * slideT, CY + (ky - CY) * slideT);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT 4: ORBIT (elliptical atom-style)
// ─────────────────────────────────────────────────────────────────────────────

function drawOrbit(
  ctx: DC, elapsed: number, content: GeneratedContent,
  r: ReturnType<typeof ro>, p0: number,
) {
  const kws = content.points.slice(1).map(p => p.label).filter(Boolean);
  const n   = kws.length;

  const orbits = [
    { a: 400, b: 155, rot: -0.32, count: Math.min(8,  Math.ceil(n * 0.30)) },
    { a: 450, b: 195, rot:  0.22, count: Math.min(10, Math.ceil(n * 0.40)) },
    { a: 500, b: 118, rot: -0.58, count: 0 },
  ];
  orbits[2].count = n - orbits[0].count - orbits[1].count;

  // Orbit ellipses
  const orbA = clamp((elapsed - p0 - 200) / 700, 0, 1);
  if (orbA > 0.01) {
    ctx.save(); ctx.globalAlpha = orbA * 0.32;
    ctx.strokeStyle = r.accent; ctx.lineWidth = 1.5; ctx.setLineDash([8, 16]);
    for (const orb of orbits) {
      if (orb.count <= 0) continue;
      ctx.save();
      ctx.translate(CX, CY); ctx.rotate(orb.rot);
      ctx.beginPath(); ctx.ellipse(0, 0, orb.a, orb.b, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    ctx.setLineDash([]); ctx.restore();
  }

  drawCenterWord(ctx, elapsed, content.points[0]?.label ?? '', p0, r);

  const kwStart = p0 + KW_CENTER_DUR;
  let kwIdx = 0;
  for (const orb of orbits) {
    for (let j = 0; j < orb.count && kwIdx < kws.length; j++, kwIdx++) {
      const te = elapsed - (kwStart + kwIdx * r.stagger);
      if (te <= 0) continue;
      const alpha = clamp(te / 350, 0, 1);
      const angle = (j / orb.count) * Math.PI * 2 - Math.PI / 2;
      const ex    = Math.cos(angle) * orb.a;
      const ey    = Math.sin(angle) * orb.b;
      // Apply tilt rotation
      const kx = CX + ex * Math.cos(orb.rot) - ey * Math.sin(orb.rot);
      const ky = CY + ex * Math.sin(orb.rot) + ey * Math.cos(orb.rot);
      const st = easeOutCubic(clamp(te / 500, 0, 1));

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `${r.fw} ${r.kwFsz}px ${r.ff}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = r.kwColor;
      ctx.shadowColor = r.accent; ctx.shadowBlur = 10;
      ctx.fillText(kws[kwIdx], CX + (kx - CX) * st, CY + (ky - CY) * st);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT 5: CARD (numbered bordered cards)
// ─────────────────────────────────────────────────────────────────────────────

function drawCard(
  ctx: DC, elapsed: number, content: GeneratedContent,
  r: ReturnType<typeof ro>, p0: number,
) {
  const pts = content.points.slice(1).filter(p => p.label);
  const COLS   = Math.min(4, pts.length);
  const ROWS   = Math.ceil(pts.length / COLS);
  const MARGIN = 52, GAP = 24, HEADER_H = 148;
  const cardW  = (CW - MARGIN * 2 - GAP * (COLS - 1)) / COLS;
  const cardH  = Math.min(280, (CH - MARGIN - HEADER_H - GAP * (ROWS - 1)) / ROWS);
  const bc     = r.cardBorder;

  // Title header
  const titleA = clamp((elapsed - p0) / 450, 0, 1);
  if (titleA > 0) {
    ctx.save(); ctx.globalAlpha = titleA;
    ctx.font = `800 62px ${r.ff}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = r.centerColor;
    ctx.shadowColor = r.accent; ctx.shadowBlur = 28;
    ctx.fillText(content.title, CX, 74);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Cards stagger in
  const kwStart = p0 + KW_CENTER_DUR * 0.5;
  for (let i = 0; i < pts.length; i++) {
    const te    = elapsed - (kwStart + i * r.stagger);
    if (te <= 0) continue;
    const alpha = clamp(te / 300, 0, 1);
    const sc    = lerp(0.82, 1, easeOutBack(Math.min(clamp(te / 420, 0, 1), 0.999)));
    const col   = i % COLS, row = Math.floor(i / COLS);
    const cx    = MARGIN + col * (cardW + GAP);
    const cy    = HEADER_H + row * (cardH + GAP);
    const hw = cardW / 2, hh = cardH / 2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx + hw, cy + hh);
    ctx.scale(sc, sc);

    // Card BG gradient
    const bg = ctx.createLinearGradient(-hw, -hh, -hw, hh);
    bg.addColorStop(0, 'rgba(8,8,16,0.92)');
    bg.addColorStop(1, 'rgba(4,4,10,0.78)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(-hw, -hh, cardW, cardH, 14); ctx.fill();

    // Glowing border
    ctx.shadowColor = bc; ctx.shadowBlur = 20;
    ctx.strokeStyle = bc; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-hw, -hh, cardW, cardH, 14); ctx.stroke();
    ctx.shadowBlur = 0;

    // Sequence number
    ctx.font = `700 26px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = bc;
    ctx.fillText(String(i + 1).padStart(2, '0'), 0, -hh + 22);

    // Keyword
    const hasShort = Boolean(pts[i].short);
    ctx.font = `800 ${Math.min(r.kwFsz + 10, 72)}px ${r.ff}`;
    ctx.fillStyle = r.kwColor;
    ctx.shadowColor = bc; ctx.shadowBlur = 18;
    ctx.fillText(pts[i].label, 0, hasShort ? -6 : 8);
    ctx.shadowBlur = 0;

    // Divider + short description
    if (hasShort) {
      ctx.strokeStyle = hex2rgba(bc, 0.45); ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 7]);
      ctx.beginPath(); ctx.moveTo(-hw + 26, 20); ctx.lineTo(hw - 26, 20); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `400 ${Math.round(r.kwFsz * 0.58)}px ${r.ff}`;
      ctx.fillStyle = hex2rgba(r.kwColor, 0.65);
      ctx.fillText(pts[i].short, 0, 42);
    }
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT 6: FLOW (digital rain columns)
// ─────────────────────────────────────────────────────────────────────────────

function drawFlow(
  ctx: DC, elapsed: number, content: GeneratedContent,
  r: ReturnType<typeof ro>, p0: number,
) {
  const kws  = content.points.slice(1).map(p => p.label).filter(Boolean);
  const COLS = 7;
  const colW = CW / COLS;
  const LINE_H = 86;
  const TOP_Y  = 118;

  // Assign keywords to columns (round-robin)
  const colItems: string[][] = Array.from({ length: COLS }, () => []);
  kws.forEach((kw, i) => colItems[i % COLS].push(kw));

  // Thin column dividers
  const divA = clamp((elapsed - p0) / 400, 0, 1) * 0.1;
  if (divA > 0.01) {
    ctx.save(); ctx.globalAlpha = divA;
    ctx.strokeStyle = r.accent; ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * colW, 80); ctx.lineTo(c * colW, CH - 40); ctx.stroke();
    }
    ctx.restore();
  }

  // Center word appears first (as a large splash above columns)
  const cT = clamp((elapsed - p0) / KW_CENTER_DUR, 0, 1);
  if (cT > 0) {
    const sc = easeOutBack(Math.min(cT, 0.999));
    ctx.save();
    ctx.globalAlpha = clamp(cT * 2, 0, 1) * 0.22; // ghost beneath columns
    ctx.translate(CX, CY); ctx.scale(sc * 1.5, sc * 1.5);
    ctx.font = `800 ${r.centerFsz}px ${r.ff}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = r.centerColor;
    ctx.shadowColor = r.accent; ctx.shadowBlur = 80;
    ctx.fillText(content.points[0]?.label ?? '', 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Keywords cascade down columns
  const kwStart = p0 + KW_CENTER_DUR * 0.4;
  for (let col = 0; col < COLS; col++) {
    const colX = (col + 0.5) * colW;
    for (let row = 0; row < colItems[col].length; row++) {
      const globalIdx = col + row * COLS;
      const te    = elapsed - (kwStart + globalIdx * r.stagger * 0.75);
      if (te <= 0) continue;
      const alpha = clamp(te / 400, 0, 1);
      const dropT = easeOutCubic(clamp(te / 500, 0, 1));
      const baseY = TOP_Y + row * LINE_H;
      const ky    = baseY - (1 - dropT) * 55;
      // Fade older rows slightly
      const depthA = Math.max(0.4, 1 - row * 0.06);
      ctx.save();
      ctx.globalAlpha = alpha * depthA;
      ctx.font = `${r.fw} ${r.kwFsz}px ${r.ff}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = r.kwColor;
      ctx.fillText(colItems[col][row], colX, ky);
      ctx.restore();
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY
// ─────────────────────────────────────────────────────────────────────────────

export function drawKeywordCards(
  ctx: DC,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  opts?: KeywordOptions,
): void {
  if (!content.points.length) return;
  const r  = ro(opts, accent);
  const p0 = T.cardBase + KW_TITLE_HOLD;
  if (elapsed < p0) return;

  void accent2; // reserved for future use

  switch (r.layout) {
    case 'cloud':  drawCloud(ctx, elapsed, content, r, p0);  break;
    case 'grid':   drawGrid(ctx, elapsed, content, r, p0);   break;
    case 'radial': drawRadial(ctx, elapsed, content, r, p0); break;
    case 'orbit':  drawOrbit(ctx, elapsed, content, r, p0);  break;
    case 'card':   drawCard(ctx, elapsed, content, r, p0);   break;
    case 'flow':   drawFlow(ctx, elapsed, content, r, p0);   break;
    default:       drawCloud(ctx, elapsed, content, r, p0);  break;
  }
}
