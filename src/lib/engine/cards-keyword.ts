/**
 * cards-keyword.ts — 6 keyword arrangement layouts
 *
 * Design rules:
 *  - content.title  = center/theme word (displayed large at canvas center)
 *  - content.points = all surrounding keywords
 *  - No title header at top (except card layout which draws its own)
 *  - Collision-aware placement (no overlapping words)
 */

import type { GeneratedContent, KeywordOptions, KeywordCenterAnim } from '../../types/video';
import {
  CW, CH, clamp, lerp, easeOutCubic, easeOutBack,
  KW_START_DELAY, KW_CENTER_DUR,
} from './helpers';

type DC = CanvasRenderingContext2D;
const CX = CW / 2, CY = CH / 2;

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
    stagger:      o.staggerMs        ?? 280,
    gridLine:     o.gridLineColor    || ac,
    cardBorder:   o.cardBorderColor  || ac,
    centerAnim:   (o.centerEnterAnim ?? 'scale') as KeywordCenterAnim,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BOUNDING-BOX COLLISION DETECTION
// ─────────────────────────────────────────────────────────────────────────────

/** Approximate text width for Chinese / mixed strings */
function tw(text: string, fsz: number): number {
  return text.length * fsz * 0.95;
}
function th(fsz: number): number {
  return fsz * 1.3;
}

interface Rect { x1: number; y1: number; x2: number; y2: number }

function overlaps(a: Rect, b: Rect, pad = 14): boolean {
  return !(a.x2 + pad < b.x1 - pad || b.x2 + pad < a.x1 - pad ||
           a.y2 + pad < b.y1 - pad || b.y2 + pad < a.y1 - pad);
}

function makeRect(cx: number, cy: number, w: number, h: number): Rect {
  return { x1: cx - w / 2, y1: cy - h / 2, x2: cx + w / 2, y2: cy + h / 2 };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLOUD LAYOUT – PLACEMENT CACHE (deterministic, collision-free)
// ─────────────────────────────────────────────────────────────────────────────

interface PlacedKw { x: number; y: number; fsz: number }

const CLOUD_CACHE = new Map<string, PlacedKw[]>();

function computeCloud(
  centerWord: string, keywords: string[], centerFsz: number, kwFsz: number,
): PlacedKw[] {
  const key = `${centerWord}|${keywords.join('|')}|${centerFsz}|${kwFsz}`;
  const cached = CLOUD_CACHE.get(key);
  if (cached) return cached;

  const placed: Rect[] = [];

  // Reserve center-word bounding box
  const cw2 = tw(centerWord, centerFsz), ch2 = th(centerFsz);
  placed.push(makeRect(CX, CY, cw2 + 36, ch2 + 20));

  const result: PlacedKw[] = [];
  const XSCALE = 1.55;         // stretch horizontally to use full 1920 width
  const PAD_L  = 60, PAD_R = 60, PAD_T = 55, PAD_B = 55;

  for (let i = 0; i < keywords.length; i++) {
    const kw   = keywords[i];
    // Keyword size decreases with index (inner = larger, outer = smaller)
    const fszScale = i < 7 ? 1.00 : i < 15 ? 0.78 : 0.60;
    const fsz  = Math.round(kwFsz * fszScale);
    const w    = tw(kw, fsz);
    const h    = th(fsz);

    // Spread preferred angles evenly (with a slight seed offset for organic look)
    const prefAngle = (i / keywords.length) * Math.PI * 2 - Math.PI / 2 + (sf(i * 2.7 + 1) - 0.5) * 0.6;

    let found = false;
    const STEP_R = 40;
    const STEP_A = Math.PI / 12;  // 15° per angular step

    outer:
    for (let r = 190; r <= 680; r += STEP_R) {
      // Alternate CW / CCW per keyword for organic scatter
      for (let step = 0; step < 24; step++) {
        const da    = step * STEP_A * (i % 2 === 0 ? 1 : -1);
        const angle = prefAngle + da;
        const kx    = CX + Math.cos(angle) * r * XSCALE;
        const ky    = CY + Math.sin(angle) * r;

        // Canvas bounds check (full canvas, no header zone)
        if (kx - w / 2 < PAD_L || kx + w / 2 > CW - PAD_R) continue;
        if (ky - h / 2 < PAD_T || ky + h / 2 > CH - PAD_B) continue;

        const rect = makeRect(kx, ky, w + 10, h + 6);
        if (!placed.some(p => overlaps(p, rect))) {
          placed.push(rect);
          result.push({ x: kx, y: ky, fsz });
          found = true;
          break outer;
        }
      }
    }

    if (!found) {
      // Absolute fallback: just beyond canvas right, won't be visible
      result.push({ x: CW + 200, y: CY, fsz });
    }
  }

  CLOUD_CACHE.set(key, result);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// RADIAL LAYOUT – PLACEMENT CACHE (collision-aware)
// ─────────────────────────────────────────────────────────────────────────────

const RADIAL_CACHE = new Map<string, PlacedKw[]>();

function computeRadial(
  centerWord: string, keywords: string[], centerFsz: number, kwFsz: number,
): PlacedKw[] {
  const key = `R|${centerWord}|${keywords.join('|')}|${centerFsz}|${kwFsz}`;
  const cached = RADIAL_CACHE.get(key);
  if (cached) return cached;

  const placed: Rect[] = [];
  const cw2 = tw(centerWord, centerFsz);
  placed.push(makeRect(CX, CY, cw2 + 36, th(centerFsz) + 20));

  const result: PlacedKw[] = [];
  const XSCALE = 1.45;
  const rings = [240, 420, 580];

  // Pre-assign each keyword to a ring based on index proportions
  const r1 = Math.min(8,  Math.ceil(keywords.length * 0.30));
  const r2 = Math.min(13, Math.ceil(keywords.length * 0.43));
  const assignments = keywords.map((_, i) =>
    i < r1 ? 0 : i < r1 + r2 ? 1 : 2
  );

  for (let i = 0; i < keywords.length; i++) {
    const kw    = keywords[i];
    const ring  = rings[assignments[i]];
    const fsz   = Math.round(kwFsz * (assignments[i] === 0 ? 1.0 : assignments[i] === 1 ? 0.80 : 0.62));
    const w     = tw(kw, fsz);
    const h     = th(fsz);
    const count = assignments.filter(a => a === assignments[i]).length;
    const idxInRing = assignments.slice(0, i).filter(a => a === assignments[i]).length;

    const baseAngle = (idxInRing / count) * Math.PI * 2 - Math.PI / 2;
    const STEP_A = Math.PI / 10;

    let found = false;
    outer:
    for (let extraR = 0; extraR <= 160; extraR += 40) {
      for (let step = 0; step < 20; step++) {
        const da    = step * STEP_A * (i % 2 === 0 ? 1 : -1);
        const angle = baseAngle + da;
        const kx    = CX + Math.cos(angle) * (ring + extraR) * XSCALE;
        const ky    = CY + Math.sin(angle) * (ring + extraR);

        if (kx - w / 2 < 50 || kx + w / 2 > CW - 50) continue;
        if (ky - h / 2 < 50 || ky + h / 2 > CH - 50) continue;

        const rect = makeRect(kx, ky, w + 10, h + 6);
        if (!placed.some(p => overlaps(p, rect))) {
          placed.push(rect);
          result.push({ x: kx, y: ky, fsz });
          found = true;
          break outer;
        }
      }
    }

    if (!found) result.push({ x: CW + 200, y: CY, fsz });
  }

  RADIAL_CACHE.set(key, result);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// CENTER WORD ANIMATIONS (7 effects)
// ─────────────────────────────────────────────────────────────────────────────

const GLITCH_CHARS = '▓░█■□◆◇▲△▼▽◉○●◎';

function drawCenterWord(
  ctx: DC, elapsed: number, text: string, p0: number, r: ReturnType<typeof ro>,
  cy: number = CY,
) {
  const t = clamp((elapsed - p0) / KW_CENTER_DUR, 0, 1);
  if (t <= 0) return;

  ctx.save();
  ctx.font = `800 ${r.centerFsz}px ${r.ff}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = r.centerColor;
  ctx.shadowColor = r.accent;

  switch (r.centerAnim) {

    // ── 1. SCALE (default, easeOutBack) ────────────────────────────────────
    case 'scale': {
      const sc = easeOutBack(Math.min(t, 0.999));
      ctx.globalAlpha = clamp(t * 2, 0, 1);
      ctx.shadowBlur = 55;
      ctx.translate(CX, cy); ctx.scale(sc, sc);
      ctx.fillText(text, 0, 0);
      break;
    }

    // ── 2. TYPEWRITER ──────────────────────────────────────────────────────
    case 'typewriter': {
      const visible = Math.ceil(t * text.length);
      const shown   = text.slice(0, visible);
      const cursor  = visible < text.length && Math.floor((elapsed - p0) / 300) % 2 === 0 ? '|' : '';
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 40;
      ctx.fillText(shown + cursor, CX, cy);
      break;
    }

    // ── 3. FLY DOWN (drops from sky with bounce) ───────────────────────────
    case 'flydown': {
      const eased = easeOutBack(Math.min(t, 0.999));
      const startY = cy - CH * 0.75;
      const ky     = lerp(startY, cy, eased);
      ctx.globalAlpha = clamp(t * 3, 0, 1);
      ctx.shadowBlur = 50;
      ctx.fillText(text, CX, ky);
      break;
    }

    // ── 4. GLITCH (scramble → solidify) ───────────────────────────────────
    case 'glitch': {
      if (t > 0.75) {
        // Solid phase
        const fadeIn = clamp((t - 0.75) / 0.25, 0, 1);
        ctx.globalAlpha = fadeIn;
        ctx.shadowBlur = 50;
        ctx.fillText(text, CX, cy);
      } else {
        // Glitch phase: draw scrambled chars with offset copies
        const solidChars = Math.floor(t / 0.75 * text.length);
        let display = '';
        for (let i = 0; i < text.length; i++) {
          if (i < solidChars) {
            display += text[i];
          } else {
            // Pseudo-random per frame using elapsed
            const seed = (elapsed * 0.013 + i * 7.3) % 1;
            display += seed > 0.5 ? GLITCH_CHARS[Math.floor(seed * GLITCH_CHARS.length)] : text[i];
          }
        }
        // RGB-split shadow for glitch aesthetic
        ctx.globalAlpha = 0.85;
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ff0044'; ctx.fillText(display, CX - 4, cy - 2);
        ctx.fillStyle = '#00ffcc'; ctx.fillText(display, CX + 4, cy + 2);
        ctx.fillStyle = r.centerColor; ctx.fillText(display, CX, cy);
      }
      break;
    }

    // ── 5. EXPLODE (chars fly in from scattered positions) ─────────────────
    case 'explode': {
      const eased = easeOutCubic(Math.min(t, 1));
      // Measure each char width (approximate)
      const charW    = r.centerFsz * 0.92;
      const totalW   = text.length * charW;
      const startX   = CX - totalW / 2 + charW / 2;
      ctx.shadowBlur = 40;
      ctx.globalAlpha = clamp(t * 2, 0, 1);
      for (let i = 0; i < text.length; i++) {
        const finalX = startX + i * charW;
        const angle  = sf(i * 4.1 + 1) * Math.PI * 2;
        const dist   = 500 + sf(i * 2.3 + 2) * 400;
        const ox     = Math.cos(angle) * dist;
        const oy     = Math.sin(angle) * dist;
        ctx.fillText(text[i], lerp(finalX + ox, finalX, eased), lerp(cy + oy, cy, eased));
      }
      break;
    }

    // ── 6. BLUR (sharpens from blurry) ────────────────────────────────────
    case 'blur': {
      const blurPx = Math.round((1 - easeOutCubic(t)) * 28);
      ctx.globalAlpha = clamp(t * 1.5, 0, 1);
      ctx.filter    = blurPx > 0 ? `blur(${blurPx}px)` : 'none';
      ctx.shadowBlur = 50;
      ctx.fillText(text, CX, cy);
      ctx.filter = 'none';
      break;
    }

    // ── 7. WAVE (chars appear in a sine wave, settle to baseline) ──────────
    case 'wave': {
      const charW    = r.centerFsz * 0.92;
      const totalW   = text.length * charW;
      const startX   = CX - totalW / 2 + charW / 2;
      ctx.shadowBlur = 45;
      for (let i = 0; i < text.length; i++) {
        // Each char appears with a delay proportional to position
        const charT = clamp((t - i * 0.12) / 0.55, 0, 1);
        if (charT <= 0) continue;
        const waveOffset = Math.sin(i * 0.8 - elapsed * 0.006) * (1 - charT) * 50;
        const sc         = easeOutBack(Math.min(charT, 0.999));
        ctx.globalAlpha  = charT;
        ctx.save();
        ctx.translate(startX + i * charW, cy + waveOffset);
        ctx.scale(sc, sc);
        ctx.fillText(text[i], 0, 0);
        ctx.restore();
      }
      break;
    }

    default: {
      const sc = easeOutBack(Math.min(t, 0.999));
      ctx.globalAlpha = clamp(t * 2, 0, 1);
      ctx.shadowBlur = 55;
      ctx.translate(CX, cy); ctx.scale(sc, sc);
      ctx.fillText(text, 0, 0);
    }
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT 1: CLOUD
// ─────────────────────────────────────────────────────────────────────────────

function drawCloud(
  ctx: DC, elapsed: number, content: GeneratedContent,
  r: ReturnType<typeof ro>, p0: number,
) {
  const centerWord = content.title;
  const kws = content.points.map(p => p.label).filter(Boolean);

  // Pre-compute collision-free positions
  const positions = computeCloud(centerWord, kws, r.centerFsz, r.kwFsz);

  // Surrounding keywords
  const kwStart = p0 + KW_CENTER_DUR;
  for (let i = 0; i < kws.length; i++) {
    const te = elapsed - (kwStart + i * r.stagger);
    if (te <= 0) continue;
    const alpha = clamp(te / 450, 0, 1);
    const pos   = positions[i];
    if (!pos || pos.x > CW) continue;

    // Depth fade: outer keywords slightly more transparent
    const depth = 0.55 + 0.45 * (1 - i / Math.max(kws.length, 1) * 0.55);

    ctx.save();
    ctx.globalAlpha = alpha * depth;
    ctx.font = `${r.fw} ${pos.fsz}px ${r.ff}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = r.kwColor;
    ctx.fillText(kws[i], pos.x, pos.y);
    ctx.restore();
  }

  // Center word drawn LAST so it's always on top
  drawCenterWord(ctx, elapsed, centerWord, p0, r);
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT 2: GRID
// ─────────────────────────────────────────────────────────────────────────────

function drawGrid(
  ctx: DC, elapsed: number, content: GeneratedContent,
  r: ReturnType<typeof ro>, p0: number,
) {
  const centerWord = content.title;
  const kws = content.points.map(p => p.label).filter(Boolean);
  const COLS = 8, ROWS = 6;
  const cellW = CW / COLS, cellH = CH / ROWS;

  // Center 2×2 block (cols 3-4, rows 2-3)
  const cC1 = 3, cC2 = 4, cR1 = 2, cR2 = 3;
  const centX = (cC1 + cC2 + 1) / 2 * cellW;
  const centY = (cR1 + cR2 + 1) / 2 * cellH;

  // All cells except center block
  const cells: { cx: number; cy: number }[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (row >= cR1 && row <= cR2 && col >= cC1 && col <= cC2) continue;
      cells.push({ cx: (col + 0.5) * cellW, cy: (row + 0.5) * cellH });
    }
  }

  // Grid lines
  const lineA = clamp((elapsed - p0) / 500, 0, 1) * 0.13;
  if (lineA > 0.01) {
    ctx.save(); ctx.globalAlpha = lineA;
    ctx.strokeStyle = r.gridLine; ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * cellW, 0); ctx.lineTo(c * cellW, CH); ctx.stroke();
    }
    for (let row = 1; row < ROWS; row++) {
      ctx.beginPath(); ctx.moveTo(0, row * cellH); ctx.lineTo(CW, row * cellH); ctx.stroke();
    }
    ctx.restore();
  }

  // Center glow
  const hlA = clamp((elapsed - p0) / 600, 0, 1) * 0.20;
  if (hlA > 0.01) {
    ctx.save(); ctx.globalAlpha = hlA;
    const g = ctx.createRadialGradient(centX, centY, 0, centX, centY, cellW * 2);
    g.addColorStop(0, r.accent); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cC1 * cellW, cR1 * cellH, 2 * cellW, 2 * cellH);
    ctx.restore();
  }

  // Center word
  const cT = clamp((elapsed - p0) / KW_CENTER_DUR, 0, 1);
  if (cT > 0) {
    const sc = easeOutBack(Math.min(cT, 0.999));
    // Fit center word inside 2×2 cell area
    const maxFsz = Math.min(r.centerFsz, Math.floor(cellH * 0.75));
    ctx.save();
    ctx.globalAlpha = clamp(cT * 2, 0, 1);
    ctx.translate(centX, centY); ctx.scale(sc, sc);
    ctx.font = `800 ${maxFsz}px ${r.ff}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = r.centerColor;
    ctx.shadowColor = r.accent; ctx.shadowBlur = 40;
    ctx.fillText(centerWord, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Surrounding keywords: cap to cells, fit text in cell
  const kwStart = p0 + KW_CENTER_DUR;
  const cellFsz = Math.min(r.kwFsz, Math.floor(cellH * 0.55));
  for (let i = 0; i < Math.min(kws.length, cells.length); i++) {
    const te = elapsed - (kwStart + i * r.stagger);
    if (te <= 0) continue;
    const alpha = clamp(te / 380, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${r.fw} ${cellFsz}px ${r.ff}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = r.kwColor;
    ctx.fillText(kws[i], cells[i].cx, cells[i].cy);
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT 3: RADIAL (concentric rings, collision-free)
// ─────────────────────────────────────────────────────────────────────────────

function drawRadial(
  ctx: DC, elapsed: number, content: GeneratedContent,
  r: ReturnType<typeof ro>, p0: number,
) {
  const centerWord = content.title;
  const kws = content.points.map(p => p.label).filter(Boolean);
  const positions = computeRadial(centerWord, kws, r.centerFsz, r.kwFsz);

  // Dashed ring arcs
  const ringA = clamp((elapsed - p0 - 200) / 600, 0, 1);
  if (ringA > 0.01) {
    ctx.save(); ctx.globalAlpha = ringA * 0.25;
    ctx.strokeStyle = r.accent; ctx.lineWidth = 1.5; ctx.setLineDash([7, 15]);
    [240, 420, 580].forEach(rr => {
      ctx.beginPath(); ctx.ellipse(CX, CY, rr * 1.45, rr, 0, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.setLineDash([]); ctx.restore();
  }

  // Keywords
  const kwStart = p0 + KW_CENTER_DUR;
  for (let i = 0; i < kws.length; i++) {
    const te = elapsed - (kwStart + i * r.stagger);
    if (te <= 0) continue;
    const alpha = clamp(te / 400, 0, 1);
    const pos   = positions[i];
    if (!pos || pos.x > CW) continue;

    const slideT = easeOutCubic(clamp(te / 500, 0, 1));

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${r.fw} ${pos.fsz}px ${r.ff}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = r.kwColor;
    ctx.shadowColor = r.accent; ctx.shadowBlur = 8;
    ctx.fillText(kws[i], CX + (pos.x - CX) * slideT, CY + (pos.y - CY) * slideT);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  drawCenterWord(ctx, elapsed, centerWord, p0, r);
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT 4: ORBIT (elliptical atom-style, reuses radial positions with tilt)
// ─────────────────────────────────────────────────────────────────────────────

function drawOrbit(
  ctx: DC, elapsed: number, content: GeneratedContent,
  r: ReturnType<typeof ro>, p0: number,
) {
  const centerWord = content.title;
  const kws = content.points.map(p => p.label).filter(Boolean);

  const orbits = [
    { a: 400, b: 155, rot: -0.32, count: Math.min(8,  Math.ceil(kws.length * 0.30)) },
    { a: 450, b: 195, rot:  0.22, count: Math.min(10, Math.ceil(kws.length * 0.40)) },
    { a: 500, b: 118, rot: -0.58, count: 0 },
  ];
  orbits[2].count = kws.length - orbits[0].count - orbits[1].count;

  // Reserve placed rects for overlap avoidance
  const placed: Rect[] = [];
  placed.push(makeRect(CX, CY, tw(centerWord, r.centerFsz) + 40, th(r.centerFsz) + 24));

  // Pre-compute orbital positions with overlap check
  const orbitPos: { x: number; y: number; fsz: number }[] = [];
  let kwIdx = 0;
  for (const orb of orbits) {
    const fszScale = orb === orbits[0] ? 1.0 : orb === orbits[1] ? 0.80 : 0.62;
    for (let j = 0; j < orb.count && kwIdx < kws.length; j++, kwIdx++) {
      const kw    = kws[kwIdx];
      const fsz   = Math.round(r.kwFsz * fszScale);
      const w     = tw(kw, fsz), h = th(fsz);
      const baseAngle = (j / Math.max(orb.count, 1)) * Math.PI * 2 - Math.PI / 2;
      let placed_pos: { x: number; y: number } | null = null;

      for (let step = 0; step < 20; step++) {
        const angle = baseAngle + step * (Math.PI / 10) * (j % 2 === 0 ? 1 : -1);
        const ex    = Math.cos(angle) * orb.a;
        const ey    = Math.sin(angle) * orb.b;
        const kx    = CX + ex * Math.cos(orb.rot) - ey * Math.sin(orb.rot);
        const ky    = CY + ex * Math.sin(orb.rot) + ey * Math.cos(orb.rot);
        if (kx - w / 2 < 50 || kx + w / 2 > CW - 50 || ky - h / 2 < 50 || ky + h / 2 > CH - 50) continue;
        const rect = makeRect(kx, ky, w + 10, h + 6);
        if (!placed.some(p => overlaps(p, rect))) {
          placed.push(rect);
          placed_pos = { x: kx, y: ky };
          break;
        }
      }
      orbitPos.push(placed_pos ? { ...placed_pos, fsz } : { x: CW + 200, y: CY, fsz });
    }
  }

  // Orbit ellipses
  const orbA = clamp((elapsed - p0 - 200) / 700, 0, 1);
  if (orbA > 0.01) {
    ctx.save(); ctx.globalAlpha = orbA * 0.28;
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

  // Keywords
  const kwStart = p0 + KW_CENTER_DUR;
  for (let i = 0; i < orbitPos.length; i++) {
    const te  = elapsed - (kwStart + i * r.stagger);
    if (te <= 0) continue;
    const pos = orbitPos[i];
    if (!pos || pos.x > CW) continue;
    const alpha  = clamp(te / 400, 0, 1);
    const slideT = easeOutCubic(clamp(te / 500, 0, 1));

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${r.fw} ${pos.fsz}px ${r.ff}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = r.kwColor;
    ctx.shadowColor = r.accent; ctx.shadowBlur = 10;
    ctx.fillText(kws[i], CX + (pos.x - CX) * slideT, CY + (pos.y - CY) * slideT);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  drawCenterWord(ctx, elapsed, centerWord, p0, r);
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT 5: CARD (numbered bordered cards, title header shown)
// ─────────────────────────────────────────────────────────────────────────────

function drawCard(
  ctx: DC, elapsed: number, content: GeneratedContent,
  r: ReturnType<typeof ro>, p0: number,
) {
  const pts  = content.points.filter(p => p.label);
  const COLS = Math.min(4, pts.length);
  const ROWS = Math.ceil(pts.length / COLS);
  const MARGIN = 52, GAP = 24, HEADER_H = 148;
  const cardW  = (CW - MARGIN * 2 - GAP * (COLS - 1)) / COLS;
  const cardH  = Math.min(280, (CH - MARGIN - HEADER_H - GAP * (ROWS - 1)) / ROWS);
  const bc     = r.cardBorder;

  // Title header (card layout is the only layout that shows title at top)
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
    const hw    = cardW / 2, hh = cardH / 2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx + hw, cy + hh);
    ctx.scale(sc, sc);

    const bg = ctx.createLinearGradient(-hw, -hh, -hw, hh);
    bg.addColorStop(0, 'rgba(8,8,16,0.92)'); bg.addColorStop(1, 'rgba(4,4,10,0.78)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(-hw, -hh, cardW, cardH, 14); ctx.fill();

    ctx.shadowColor = bc; ctx.shadowBlur = 20;
    ctx.strokeStyle = bc; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-hw, -hh, cardW, cardH, 14); ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.font = `700 26px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = bc;
    ctx.fillText(String(i + 1).padStart(2, '0'), 0, -hh + 22);

    // Keyword only — no short description
    ctx.font = `800 ${Math.min(r.kwFsz + 10, 72)}px ${r.ff}`;
    ctx.fillStyle = r.kwColor;
    ctx.shadowColor = bc; ctx.shadowBlur = 18;
    ctx.fillText(pts[i].label, 0, 8);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT 6: FLOW (cascading columns, collision-checked row heights)
// ─────────────────────────────────────────────────────────────────────────────

function drawFlow(
  ctx: DC, elapsed: number, content: GeneratedContent,
  r: ReturnType<typeof ro>, p0: number,
) {
  const centerWord = content.title;
  const kws  = content.points.map(p => p.label).filter(Boolean);
  const COLS = 7;
  const colW = CW / COLS;

  // Font size per keyword: decrease slightly with row number
  const LINE_H = Math.max(r.kwFsz * 1.55, 75);
  const TOP_Y  = 55;

  // Assign keywords to columns
  const colItems: string[][] = Array.from({ length: COLS }, () => []);
  kws.forEach((kw, i) => colItems[i % COLS].push(kw));

  // Column dividers
  const divA = clamp((elapsed - p0) / 400, 0, 1) * 0.08;
  if (divA > 0.01) {
    ctx.save(); ctx.globalAlpha = divA;
    ctx.strokeStyle = r.accent; ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * colW, TOP_Y); ctx.lineTo(c * colW, CH - 40); ctx.stroke();
    }
    ctx.restore();
  }

  // Ghost center word (large, semi-transparent behind columns)
  const cT = clamp((elapsed - p0) / KW_CENTER_DUR, 0, 1);
  if (cT > 0) {
    const sc = easeOutBack(Math.min(cT, 0.999));
    ctx.save();
    ctx.globalAlpha = clamp(cT * 2, 0, 1) * 0.18;
    ctx.translate(CX, CY); ctx.scale(sc * 1.5, sc * 1.5);
    ctx.font = `800 ${r.centerFsz}px ${r.ff}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = r.centerColor;
    ctx.shadowColor = r.accent; ctx.shadowBlur = 80;
    ctx.fillText(centerWord, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Keywords cascade
  const kwStart = p0 + KW_CENTER_DUR * 0.4;
  for (let col = 0; col < COLS; col++) {
    const colX = (col + 0.5) * colW;
    for (let row = 0; row < colItems[col].length; row++) {
      const globalIdx = col + row * COLS;
      const te    = elapsed - (kwStart + globalIdx * r.stagger * 0.75);
      if (te <= 0) continue;
      const alpha = clamp(te / 450, 0, 1);
      const dropT = easeOutCubic(clamp(te / 520, 0, 1));
      const baseY = TOP_Y + LINE_H * 0.5 + row * LINE_H;
      const ky    = baseY - (1 - dropT) * 55;
      const depth = Math.max(0.38, 1 - row * 0.055);

      ctx.save();
      ctx.globalAlpha = alpha * depth;
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
  if (!content.title && !content.points.length) return;
  const r  = ro(opts, accent);
  const p0 = KW_START_DELAY; // start immediately (no title header wait)
  if (elapsed < p0) return;

  void accent2; // reserved

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
