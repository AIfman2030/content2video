/**
 * cards-aitech.ts — AI Tech style 4-phase animation
 *
 * Phase 1 (T.cardBase + n×900ms):   Keywords appear radially as plain numbered labels
 *                                    with relay laser; dynamic center pattern
 * Phase 2 (+600ms burst):            Shatter / flash / wipe transition
 * Phase 3 (+n×800ms):               Keyword boxed list (left) + desc typewriter (right)
 * Phase 4 (+grid appear + hold + explode): Grid finale
 */
import type { GeneratedContent, PolyShape, AItechOptions } from '../../types/video';
import {
  CW, CH, clamp, easeOutBack, easeOutCubic, easeInOutQuad, lerp, hex2rgba,
  wrapText, T, AT, aiTechPhases,
} from './helpers';

const CX = CW / 2, CY = CH / 2;
const RADIAL_R = 370;   // distance from center to keyword label

// ── Resolved option helpers ────────────────────────────────────────────────────
function resolveOpts(o?: AItechOptions, accent = '#a855f7') {
  return {
    centerPattern:  o?.centerPattern   ?? 'random',
    radialFsz:      o?.radialFontSize  ?? 52,
    radialClr:      o?.radialColor     || '#ffffff',
    radialNumClr:   o?.radialNumberColor || accent,
    burstFx:        o?.burstTransition ?? 'shatter',
    kwBoxFsz:       o?.kwBoxFontSize   ?? 62,
    kwBoxClr:       o?.kwBoxColor      || '#ffffff',
    kwBoxBorderClr: o?.kwBoxBorderColor || accent,
    kwBoxBW:        o?.kwBoxBorderWidth ?? 3,
    kwBoxBR:        o?.kwBoxBorderRadius ?? 16,
    kwBoxBgA:       o?.kwBoxBgAlpha    ?? 0,
    descFsz:        o?.descFontSize    ?? 42,
    descClr:        o?.descColor       || 'rgba(220,220,220,0.92)',
    descEnter:      o?.descEnterEffect ?? 'typewriter',
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

// ── Pseudo-random seeded helpers ───────────────────────────────────────────────
function seededFrac(seed: number): number {
  return (((Math.sin(seed * 0.9999) * 43758.5) % 1) + 1) % 1;
}

// ── Radial keyword label positions ────────────────────────────────────────────
function labelPos(i: number, n: number) {
  const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
  return {
    cx: CX + Math.cos(angle) * RADIAL_R,
    cy: CY + Math.sin(angle) * RADIAL_R,
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
  const PAD_X   = 28;
  const PAD_Y   = 28;
  const GRID_TOP = 160;           // leave room for title above
  const NUM_H    = 40;            // space for seq number above each cell
  const totalW   = CW - PAD_X * (cols + 1);
  const cellW    = Math.floor(totalW / cols);
  const totalH   = CH - GRID_TOP - PAD_Y * (rows + 1) - NUM_H * rows - 60;
  const cellH    = Math.floor(totalH / rows);

  return Array.from({ length: n }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      cx: PAD_X + col * (cellW + PAD_X) + cellW / 2,
      cy: GRID_TOP + NUM_H + PAD_Y + row * (cellH + PAD_Y + NUM_H) + cellH / 2,
      w: cellW,
      h: cellH,
    };
  });
}

function gridNumY(cell: GridCell) {
  return cell.cy - cell.h / 2 - 20;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CENTER PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

function pickPattern(n: number, opt: string): string {
  if (opt !== 'random') return opt;
  const patterns = ['arc', 'rings', 'spiral', 'neuron'];
  return patterns[n % patterns.length];
}

/** Organic arc / C-shape (matches reference image 2) */
function drawPatternArc(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  cx: number, cy: number,
  r: number,
  accent: string, accent2: string,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const rot  = elapsed * 0.00025;
  const rot2 = -elapsed * 0.0004;

  // Outer C-arc (270°)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.shadowColor = accent;
  ctx.shadowBlur  = 32;
  ctx.strokeStyle = accent;
  ctx.lineWidth   = r * 0.28;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.75, 0.3, Math.PI * 2 - 0.3);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Inner counter-rotating arc
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot2);
  ctx.shadowColor = accent2;
  ctx.shadowBlur  = 22;
  ctx.strokeStyle = accent2;
  ctx.lineWidth   = r * 0.18;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.44, 0.6, Math.PI * 2 - 0.6);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Center glowing dot
  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowColor = accent;
  ctx.shadowBlur  = 28 + 12 * Math.sin(elapsed * 0.005);
  ctx.fillStyle   = accent;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  ctx.restore();
}

/** Concentric dashed rings */
function drawPatternRings(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  cx: number, cy: number,
  r: number,
  accent: string, accent2: string,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const rings = [
    { rad: r * 0.95, speed: 0.0003, clr: accent, lw: 3, dash: [8, 12] },
    { rad: r * 0.68, speed: -0.0005, clr: accent2, lw: 4, dash: [12, 8] },
    { rad: r * 0.42, speed: 0.0008, clr: accent, lw: 6, dash: [4, 6] },
  ];

  for (const ring of rings) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(elapsed * ring.speed);
    ctx.shadowColor = ring.clr;
    ctx.shadowBlur  = 18;
    ctx.strokeStyle = ring.clr;
    ctx.lineWidth   = ring.lw;
    ctx.setLineDash(ring.dash);
    ctx.beginPath();
    ctx.arc(0, 0, ring.rad, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowColor = accent;
  ctx.shadowBlur  = 24 + 10 * Math.sin(elapsed * 0.004);
  ctx.fillStyle   = accent;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
  ctx.restore();
}

/** Dual spiral arms */
function drawPatternSpiral(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  cx: number, cy: number,
  r: number,
  accent: string, accent2: string,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const baseRot = elapsed * 0.0006;

  for (let arm = 0; arm < 2; arm++) {
    const armRot = baseRot + arm * Math.PI;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(armRot);
    ctx.shadowColor = arm === 0 ? accent : accent2;
    ctx.shadowBlur  = 20;
    ctx.strokeStyle = arm === 0 ? accent : accent2;
    ctx.lineWidth   = 4;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    const STEPS = 120;
    for (let s = 0; s <= STEPS; s++) {
      const t  = s / STEPS;
      const ro = r * 0.1 + (r * 0.82) * t;
      const a  = t * Math.PI * 5;
      const x  = Math.cos(a) * ro;
      const y  = Math.sin(a) * ro;
      if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowColor = accent;
  ctx.shadowBlur  = 28 + 10 * Math.sin(elapsed * 0.004);
  ctx.fillStyle   = accent;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
  ctx.restore();
}

/** Neuron / nerve-cell pattern */
function drawPatternNeuron(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  cx: number, cy: number,
  r: number,
  accent: string, accent2: string,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const ROT = elapsed * 0.0004;
  const ARMS = 6;

  for (let i = 0; i < ARMS; i++) {
    const a = (i / ARMS) * Math.PI * 2 + ROT;
    const clr = i % 2 === 0 ? accent : accent2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.shadowColor = clr;
    ctx.shadowBlur  = 16;
    ctx.strokeStyle = clr;
    ctx.lineWidth   = 2.5;

    // Curved arm using quadratic bezier
    const cpX = Math.cos(a + 0.4) * r * 0.55;
    const cpY = Math.sin(a + 0.4) * r * 0.55;
    const endX = Math.cos(a) * r * 0.85;
    const endY = Math.sin(a) * r * 0.85;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(cpX, cpY, endX, endY);
    ctx.stroke();

    // Node at end
    ctx.shadowBlur = 18;
    ctx.fillStyle  = clr;
    ctx.beginPath();
    ctx.arc(endX, endY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Pulse dot travelling along arm
    const pt = (elapsed * 0.001 + i / ARMS) % 1;
    const px = cpX * 2 * pt * (1 - pt) + endX * pt * pt;
    const py = cpY * 2 * pt * (1 - pt) + endY * pt * pt;
    ctx.shadowBlur = 22;
    ctx.globalAlpha = alpha * (1 - Math.abs(pt - 0.5) * 2);
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Center nucleus
  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowColor = accent;
  ctx.shadowBlur  = 30 + 14 * Math.sin(elapsed * 0.005);
  ctx.fillStyle   = accent;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
  ctx.restore();
}

function drawCenterPattern(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  cx: number, cy: number,
  r: number,
  accent: string, accent2: string,
  patternName: string,
  alpha: number,
) {
  switch (patternName) {
    case 'arc':    drawPatternArc(ctx, elapsed, cx, cy, r, accent, accent2, alpha); break;
    case 'rings':  drawPatternRings(ctx, elapsed, cx, cy, r, accent, accent2, alpha); break;
    case 'spiral': drawPatternSpiral(ctx, elapsed, cx, cy, r, accent, accent2, alpha); break;
    case 'neuron': drawPatternNeuron(ctx, elapsed, cx, cy, r, accent, accent2, alpha); break;
    default:       drawPatternArc(ctx, elapsed, cx, cy, r, accent, accent2, alpha);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 1: RADIAL KEYWORD LABELS + LASER
// ═══════════════════════════════════════════════════════════════════════════════

function drawLaser(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number,
  x1: number, y1: number,
  t: number,
  accent: string,
) {
  if (t <= 0 || t >= 1) return;
  const tipT  = clamp(t * 1.4, 0, 1);
  const tailT = clamp(t * 1.4 - 0.3, 0, 1);
  const tipX  = lerp(x0, x1, easeOutCubic(tipT));
  const tipY  = lerp(y0, y1, easeOutCubic(tipT));
  const tailX = lerp(x0, x1, easeOutCubic(tailT));
  const tailY = lerp(y0, y1, easeOutCubic(tailT));

  ctx.save();
  const grad  = ctx.createLinearGradient(tailX, tailY, tipX, tipY);
  grad.addColorStop(0, hex2rgba(accent, 0));
  grad.addColorStop(0.5, hex2rgba(accent, 0.7));
  grad.addColorStop(1, '#ffffff');
  ctx.shadowColor = accent;
  ctx.shadowBlur  = 28;
  ctx.strokeStyle = grad;
  ctx.lineWidth   = 3;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  ctx.globalAlpha = 0.3;
  ctx.lineWidth   = 12;
  ctx.strokeStyle = accent;
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawRadialLabel(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  i: number,
  n: number,
  label: string,
  enterT: number,
  alpha: number,
  accent: string,
  r: ReturnType<typeof resolveOpts>,
) {
  const { cx, cy, angle } = labelPos(i, n);
  const eased = easeOutBack(Math.min(enterT, 0.999));

  // Text: "01关键词"
  const numStr = String(i + 1).padStart(2, '0');
  const fsz    = r.radialFsz;
  const ff     = `"Noto Sans SC", sans-serif`;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Connector line from center edge to label node
  const innerR = 160;
  const nodeX  = CX + Math.cos(angle) * (RADIAL_R - 28);
  const nodeY  = CY + Math.sin(angle) * (RADIAL_R - 28);
  const lineX0 = CX + Math.cos(angle) * innerR;
  const lineY0 = CY + Math.sin(angle) * innerR;

  if (alpha > 0.2) {
    ctx.save();
    ctx.globalAlpha  = alpha * 0.5;
    ctx.strokeStyle  = accent;
    ctx.lineWidth    = 1.5;
    ctx.shadowColor  = accent;
    ctx.shadowBlur   = 6;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.moveTo(lineX0, lineY0);
    ctx.lineTo(nodeX, nodeY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Small circle node
    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur  = 14;
    ctx.fillStyle   = accent;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(nodeX, nodeY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Slide-in from outside edge
  const slideOff = (1 - eased) * 55;
  const tx = cx + Math.cos(angle) * slideOff;
  const ty = cy + Math.sin(angle) * slideOff;

  ctx.textAlign    = Math.cos(angle) > 0.1 ? 'left' : Math.cos(angle) < -0.1 ? 'right' : 'center';
  ctx.textBaseline = 'middle';

  // Number in accent color
  ctx.font         = `700 ${fsz}px ${ff}`;
  ctx.shadowColor  = r.radialNumClr;
  ctx.shadowBlur   = 18;
  ctx.fillStyle    = r.radialNumClr;
  ctx.fillText(numStr, tx, ty);

  const numW = ctx.measureText(numStr).width;
  const gap  = 4;

  // Label in white — same font
  ctx.font      = `700 ${fsz}px ${ff}`;
  ctx.fillStyle = r.radialClr;
  ctx.shadowColor = r.radialClr;
  ctx.shadowBlur  = 12;

  const textOffset = ctx.textAlign === 'left' ? numW + gap
    : ctx.textAlign === 'right' ? -(ctx.measureText(label).width + gap)
    : 0;
  ctx.fillText(label, tx + textOffset, ty);
  ctx.shadowBlur = 0;

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2: BURST / SHATTER TRANSITION
// ═══════════════════════════════════════════════════════════════════════════════

function drawBurstTransition(
  ctx: CanvasRenderingContext2D,
  burstT: number,
  accent: string,
  burstFx: string,
) {
  if (burstT <= 0 || burstT >= 1) return;

  switch (burstFx) {
    case 'flash': {
      const al = Math.max(0, 1 - burstT * 2.5);
      ctx.save();
      ctx.globalAlpha = al;
      ctx.fillStyle   = '#ffffff';
      ctx.fillRect(0, 0, CW, CH);
      ctx.restore();
      break;
    }

    case 'wipe': {
      // Radial wipe from center
      const r = burstT * Math.hypot(CW, CH) * 0.7;
      ctx.save();
      ctx.globalAlpha = 1 - burstT;
      ctx.fillStyle   = accent;
      ctx.beginPath();
      ctx.arc(CX, CY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'shatter':
    default: {
      // 20 shards fly outward
      const SHARDS = 20;
      const eased  = easeOutCubic(burstT);
      const fadeA  = 1 - burstT * burstT;

      ctx.save();
      for (let s = 0; s < SHARDS; s++) {
        const seed  = s * 1234.5;
        const angle = seededFrac(seed * 1.1) * Math.PI * 2;
        const dist  = 180 + seededFrac(seed * 2.3) * 500;
        const rot   = (seededFrac(seed * 3.7) - 0.5) * eased * 1.8;
        const w     = 80 + seededFrac(seed * 4.1) * 200;
        const h     = 40 + seededFrac(seed * 5.3) * 100;
        const ox    = CX + seededFrac(seed * 6.1) * CW - CW / 2;
        const oy    = CY + seededFrac(seed * 7.2) * CH - CH / 2;
        const dx    = Math.cos(angle) * dist * eased;
        const dy    = Math.sin(angle) * dist * eased;

        ctx.save();
        ctx.globalAlpha = fadeA * 0.85;
        ctx.translate(ox + dx, oy + dy);
        ctx.rotate(rot);
        ctx.fillStyle   = hex2rgba(accent, 0.6 + seededFrac(seed * 8.3) * 0.4);
        ctx.shadowColor = accent;
        ctx.shadowBlur  = 18;
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, 6);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
      ctx.restore();
      break;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3: KEYWORD BORDERED BOX + DESC
// ═══════════════════════════════════════════════════════════════════════════════

const KW_BOX_X    = 60;       // left edge of keyword box
const KW_BOX_W    = 490;      // keyword box width
const KW_TOP_Y    = 100;      // first item top edge
const DESC_COL_X  = KW_BOX_X + KW_BOX_W + 48;  // desc text start x
const DESC_COL_W  = CW - DESC_COL_X - 60;       // desc text max width

function itemRowY(i: number, n: number): number {
  const AVAILABLE = CH - KW_TOP_Y - 80;
  const step = Math.min(100, AVAILABLE / Math.max(n, 1));
  return KW_TOP_Y + i * step + step * 0.5;
}

function drawKwBox(
  ctx: CanvasRenderingContext2D,
  i: number,
  n: number,
  label: string,
  enterT: number,
  highlightT: number,  // 0→1 for pulsing when paired desc is active
  accent: string,
  r: ReturnType<typeof resolveOpts>,
) {
  const rowY = itemRowY(i, n);
  const fsz  = r.kwBoxFsz;
  const numStr = String(i + 1).padStart(2, '0');
  const fullText = numStr + label;
  const ff   = `"Noto Sans SC", sans-serif`;

  ctx.font = `700 ${fsz}px ${ff}`;
  const textW = ctx.measureText(fullText).width;
  const PAD_X = 24;
  const PAD_Y = 14;
  const boxW  = Math.min(KW_BOX_W, textW + PAD_X * 2);
  const boxH  = fsz + PAD_Y * 2;
  const bx    = KW_BOX_X;
  const by    = rowY - boxH / 2;
  const br    = r.kwBoxBR;
  const bc    = r.kwBoxBorderClr;

  const eased = easeOutBack(Math.min(enterT, 0.999));
  const alpha = clamp(enterT * 2, 0, 1);

  ctx.save();
  ctx.globalAlpha = alpha;

  // Box background
  if (r.kwBoxBgA > 0.01) {
    ctx.fillStyle = hex2rgba(bc, r.kwBoxBgA);
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW * eased, boxH, br);
    ctx.fill();
  }

  // Border with glow (draw-from-left animation via clip)
  ctx.save();
  ctx.beginPath();
  ctx.rect(bx - 4, by - 4, (boxW + 8) * eased, boxH + 8);
  ctx.clip();
  ctx.shadowColor = bc;
  ctx.shadowBlur  = 18 + highlightT * 20;
  ctx.strokeStyle = bc;
  ctx.lineWidth   = r.kwBoxBW;
  ctx.beginPath();
  ctx.roundRect(bx, by, boxW, boxH, br);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Number in accent
  if (eased > 0.3) {
    ctx.save();
    ctx.globalAlpha = alpha * clamp((eased - 0.3) / 0.7, 0, 1);
    ctx.font         = `700 ${fsz}px ${ff}`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = r.kwBoxBorderClr;
    ctx.shadowColor  = bc;
    ctx.shadowBlur   = 14 + highlightT * 10;
    ctx.fillText(numStr, bx + PAD_X, rowY);
    const numW = ctx.measureText(numStr).width;
    // Label in white
    ctx.fillStyle  = r.kwBoxClr;
    ctx.shadowColor = r.kwBoxClr;
    ctx.shadowBlur  = 8;
    ctx.fillText(label, bx + PAD_X + numW + 4, rowY);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  ctx.restore();
}

function drawDescItem(
  ctx: CanvasRenderingContext2D,
  i: number,
  n: number,
  desc: string,
  te: number,
  accent: string,
  r: ReturnType<typeof resolveOpts>,
) {
  const rowY  = itemRowY(i, n);
  const fsz   = r.descFsz;
  const maxW  = DESC_COL_W;

  ctx.font = `400 ${fsz}px "Noto Sans SC", sans-serif`;
  const lines = wrapText(ctx, desc, maxW).slice(0, 3);
  const lineH = fsz + 8;

  let alpha = 1;
  let offsetX = 0;
  let clipChars = desc.length;

  switch (r.descEnter) {
    case 'fadeIn':
      alpha = easeOutCubic(clamp(te / 500, 0, 1));
      break;
    case 'slideRight':
      alpha   = clamp(te / 400, 0, 1);
      offsetX = lerp(60, 0, easeOutCubic(clamp(te / 500, 0, 1)));
      break;
    case 'typewriter':
    default:
      clipChars = Math.min(Math.floor(te / 38), desc.length);
      break;
  }

  ctx.save();
  ctx.globalAlpha  = alpha;
  ctx.font         = `400 ${fsz}px "Noto Sans SC", sans-serif`;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = r.descClr;
  ctx.shadowColor  = accent;
  ctx.shadowBlur   = 6;

  let charCount = 0;
  const totalLines = lines.length;
  const blockH = totalLines * lineH;
  const startY = rowY - blockH / 2 + lineH / 2;

  for (let li = 0; li < lines.length; li++) {
    const line   = lines[li];
    const lineY  = startY + li * lineH;
    const tx     = DESC_COL_X + offsetX;

    if (r.descEnter === 'typewriter') {
      const toShow = Math.max(0, Math.min(line.length, clipChars - charCount));
      if (toShow === 0) break;
      ctx.fillText(line.slice(0, toShow), tx, lineY);
      charCount += line.length;
    } else {
      ctx.fillText(line, tx, lineY);
    }
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 4: GRID FINALE
// ═══════════════════════════════════════════════════════════════════════════════

function drawGridCell(
  ctx: CanvasRenderingContext2D,
  cell: GridCell,
  point: GeneratedContent['points'][number],
  index: number,
  enterT: number,
  explodeT: number,
  elapsed: number,
  accent: string,
  r: ReturnType<typeof resolveOpts>,
  seed: number,
) {
  const { cx, cy, w, h } = cell;

  // Explosion
  let tx = 0, ty = 0, rot = 0, exAlpha = 1;
  if (explodeT > 0) {
    const et    = easeOutCubic(explodeT);
    const angle = seededFrac(seed * 127.1) * Math.PI * 2;
    const dist  = 280 + seededFrac(seed * 311.7) * 500;
    switch (r.gridExplode) {
      case 'scatter':
        tx = Math.cos(angle) * dist * et; ty = Math.sin(angle) * dist * et; rot = angle * et * 0.5; break;
      case 'implode':
        tx = (CX - cx) * et * 0.8; ty = (CY - cy) * et * 0.8; rot = et * 2; break;
      case 'burst':
      default:
        tx = Math.cos(angle) * dist * et; ty = Math.sin(angle) * dist * et - 100 * et; rot = (angle > Math.PI ? 1 : -1) * et * 1.5;
    }
    exAlpha = Math.max(0, 1 - explodeT * explodeT);
    if (exAlpha <= 0.01) return;
  }

  // Enter
  let scaleE = 1, entAlpha = 1;
  switch (r.gridEnter) {
    case 'zoomIn':   scaleE = lerp(0.1, 1, easeOutBack(Math.min(enterT, 0.999))); entAlpha = clamp(enterT * 3, 0, 1); break;
    case 'flipIn':   scaleE = Math.abs(Math.sin(enterT * Math.PI / 2)); entAlpha = clamp(enterT * 2, 0, 1); break;
    case 'slideUp':  ty += lerp(70, 0, easeOutCubic(enterT)); entAlpha = clamp(enterT * 2, 0, 1); break;
    case 'fadeIn':
    default:         entAlpha = easeOutCubic(enterT);
  }

  const drawAlpha = Math.min(entAlpha, exAlpha);
  if (drawAlpha <= 0.01) return;

  const numStr = String(index + 1).padStart(2, '0');

  ctx.save();
  ctx.globalAlpha = drawAlpha;
  ctx.translate(cx + tx, cy + ty);
  ctx.rotate(rot);
  ctx.scale(scaleE, scaleE);

  // Sequence number ABOVE cell
  const numFsz  = Math.min(32, h * 0.18);
  ctx.font         = `700 ${numFsz}px "Noto Sans SC", monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = r.gridNumClr;
  ctx.shadowColor  = r.gridNumClr;
  ctx.shadowBlur   = 12;
  ctx.fillText(numStr, 0, -h / 2 - numFsz * 0.7);
  ctx.shadowBlur = 0;

  // Cell background
  const bg = ctx.createLinearGradient(-w / 2, -h / 2, -w / 2, h / 2);
  bg.addColorStop(0, hex2rgba(r.gridBorderClr, 0.18));
  bg.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle   = bg;
  ctx.shadowColor = r.gridBorderClr;
  ctx.shadowBlur  = 20 + 8 * Math.sin(elapsed * 0.003 + seed);
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = r.gridBorderClr;
  ctx.lineWidth   = 2.5;
  ctx.shadowBlur  = 16;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 12);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Keyword
  const kwFsz = Math.min(r.gridKwFsz, h * 0.36);
  ctx.font         = `900 ${kwFsz}px "Noto Sans SC", sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = r.gridKwClr;
  ctx.shadowColor  = r.gridKwClr;
  ctx.shadowBlur   = 14;
  ctx.fillText(point.label, 0, -h * 0.1);
  ctx.shadowBlur = 0;

  // Dashed separator
  if (point.short) {
    const sepY = h * 0.18;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = r.gridBorderClr;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 16, sepY);
    ctx.lineTo(w / 2 - 16, sepY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Short phrase
    const sFsz  = Math.min(r.gridShortFsz, h * 0.22);
    ctx.font        = `600 ${sFsz}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle   = r.gridShortClr;
    ctx.shadowColor = r.gridBorderClr;
    ctx.shadowBlur  = 8;
    const maxW  = w - 24;
    const sl    = wrapText(ctx, point.short, maxW).slice(0, 2);
    const slH   = sFsz + 5;
    sl.forEach((line, li) => ctx.fillText(line, 0, h * 0.35 + li * slH));
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ENTRY
// ═══════════════════════════════════════════════════════════════════════════════

export function drawAITechCards(
  ctx: CanvasRenderingContext2D,
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

  const { p1Start, p2Start, p3Start, p4Start } = aiTechPhases(displayN);
  const LASER_DUR = 300;

  // Determine phase
  const inP4     = elapsed >= p4Start;
  const inP3     = !inP4 && elapsed >= p3Start;
  const inBurst  = !inP3 && !inP4 && elapsed >= p2Start;
  const inP1     = !inBurst && !inP3 && !inP4;

  // ── PHASE 4: Grid ────────────────────────────────────────────────────────────
  if (inP4) {
    const cells   = computeGrid(displayN);
    const STAGGER = AT.gridStagger;
    const allInMs = STAGGER * (displayN - 1) + 400;
    const holdEnd = p4Start + allInMs + 200 + AT.gridHold;
    const exStart = holdEnd;

    // Grid title header
    const hdrAlpha = clamp((elapsed - p4Start) / 400, 0, 1);
    if (hdrAlpha > 0) {
      ctx.save();
      ctx.globalAlpha  = hdrAlpha;
      ctx.font         = `700 52px "Noto Sans SC", sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = '#ffffff';
      ctx.shadowColor  = accent;
      ctx.shadowBlur   = 26;
      ctx.fillText(content.title, CX, 90);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    for (let i = 0; i < displayN; i++) {
      const cStart   = p4Start + i * STAGGER;
      const te       = elapsed - cStart;
      if (te <= 0) continue;
      const enterT   = clamp(te / 400, 0, 1);
      const explodeT = elapsed >= exStart ? clamp((elapsed - exStart) / AT.explodeDur, 0, 1) : 0;
      drawGridCell(ctx, cells[i], content.points[i], i, enterT, explodeT, elapsed, accent, r, i * 1234.5);
    }
    return;
  }

  // ── BURST TRANSITION ─────────────────────────────────────────────────────────
  if (inBurst) {
    const burstT = clamp((elapsed - p2Start) / AT.burstDur, 0, 1);
    // Draw fading-out radial scene underneath
    const radialFade = 1 - easeOutCubic(burstT);
    if (radialFade > 0.02) {
      ctx.save();
      ctx.globalAlpha = radialFade;
      // Re-draw all settled labels faintly
      for (let i = 0; i < displayN; i++) {
        drawRadialLabel(ctx, elapsed, i, displayN, content.points[i].label, 1, 0.6, accent, r);
      }
      drawCenterPattern(ctx, elapsed, CX, CY, PAT_R, accent, accent2, pattern, 1);
      ctx.restore();
    }
    drawBurstTransition(ctx, burstT, accent, r.burstFx);
    return;
  }

  // ── PHASE 3: Keyword box + desc ──────────────────────────────────────────────
  if (inP3) {
    // Vertical divider between boxes and desc
    const divAlpha = clamp((elapsed - p3Start) / 350, 0, 1);
    if (divAlpha > 0) {
      ctx.save();
      ctx.globalAlpha  = divAlpha * 0.4;
      ctx.strokeStyle  = accent;
      ctx.lineWidth    = 1;
      ctx.shadowColor  = accent;
      ctx.shadowBlur   = 8;
      ctx.setLineDash([4, 10]);
      ctx.beginPath();
      ctx.moveTo(DESC_COL_X - 24, KW_TOP_Y - 10);
      ctx.lineTo(DESC_COL_X - 24, CH - 50);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    for (let i = 0; i < displayN; i++) {
      const itemStart = p3Start + i * AT.descSlot;
      const te        = elapsed - itemStart;

      // Left box always shows once it's been entered
      const boxEnterT  = te > 0 ? clamp(te / 450, 0, 1) : 0;
      const boxAlpha   = te > 0 ? clamp(te / 300, 0, 1) : 0;
      const prevItem   = i > 0 ? elapsed - (p3Start + (i - 1) * AT.descSlot) : -1;
      const isActive   = te >= 0 && (i === displayN - 1 || elapsed < p3Start + (i + 1) * AT.descSlot + 200);
      const highlightT = isActive ? clamp((te > 0 ? te : 0) / 300, 0, 1) : 0;

      if (boxAlpha > 0) {
        drawKwBox(ctx, i, displayN, content.points[i].label, boxEnterT, highlightT, accent, r);
      }

      // Right desc text
      if (te > 0 && content.points[i].desc) {
        drawDescItem(ctx, i, displayN, content.points[i].desc!, te, accent, r);
      }
    }
    return;
  }

  // ── PHASE 1: Radial labels + laser + center pattern ──────────────────────────

  // Faint background rings
  const ringFade = clamp((elapsed - p1Start) / 600, 0, 1) * 0.35;
  if (ringFade > 0) {
    for (let ring = 1; ring <= 3; ring++) {
      const rad   = RADIAL_R * (0.55 + ring * 0.16);
      const pulse = 1 + 0.02 * Math.sin(elapsed * 0.0008 + ring);
      ctx.save();
      ctx.globalAlpha = ringFade * (0.3 - ring * 0.04);
      ctx.strokeStyle = ring % 2 === 0 ? accent : accent2;
      ctx.lineWidth   = 1.2;
      ctx.setLineDash([4, 10]);
      ctx.beginPath();
      ctx.arc(CX, CY, rad * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  // Center pattern
  const patAlpha = clamp((elapsed - p1Start) / 600, 0, 1);
  if (patAlpha > 0) {
    drawCenterPattern(ctx, elapsed, CX, CY, PAT_R, accent, accent2, pattern, patAlpha);
  }

  // Laser + labels
  for (let i = 0; i < displayN; i++) {
    const kStart = p1Start + i * AT.keywordSlot;
    const te     = elapsed - kStart;
    if (te <= 0) continue;

    const enterT  = clamp(te / 500, 0, 1);
    const alpha   = clamp(te / 350, 0, 1);

    // Laser from prev node (or center) to this node
    const laserT = clamp(te / LASER_DUR, 0, 1);
    if (laserT < 1) {
      const prev     = i === 0 ? { cx: CX, cy: CY } : labelPos(i - 1, displayN);
      const cur      = labelPos(i, displayN);
      drawLaser(ctx, prev.cx, prev.cy, cur.cx, cur.cy, laserT, accent);
    }

    drawRadialLabel(ctx, elapsed, i, displayN, content.points[i].label, enterT, alpha, accent, r);
  }
}
