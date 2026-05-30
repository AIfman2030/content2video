import type { GeneratedContent, PolyShape, AItechOptions } from '../../types/video';
import {
  CW, CH, clamp, easeOutBack, easeOutCubic, easeInOutQuad, lerp, hex2rgba,
  wrapText, T, AT, aiTechPhases, drawPolygon, drawStar,
} from './helpers';

const POLY_SIDES: Record<PolyShape, number> = {
  triangle: 3, quad: 4, pentagon: 5, hexagon: 6, octagon: 8, star5: 5, decagon: 10,
};
const CX = CW / 2, CY = CH / 2;
const CARD_RADIUS = 370;

// ── Resolved option helpers ────────────────────────────────────────────────────
function resolveOpts(o?: AItechOptions, accent?: string) {
  return {
    labelFsz:         o?.labelFontSize      ?? 70,
    labelClr:         o?.labelColor         || '#ffe655',
    shortFsz:         o?.shortFontSize      ?? 48,
    shortClr:         o?.shortColor         || 'rgba(255,255,255,0.98)',
    descFsz:          o?.descFontSize       ?? 42,
    descClr:          o?.descColor          || 'rgba(255,168,48,0.97)',
    slideEffect:      o?.slideEffect        ?? 'slide',
    leftKwFsz:        o?.leftKeywordFontSize ?? 34,
    leftKwClr:        o?.leftKeywordColor   || (accent ?? '#a855f7'),
    descEnter:        o?.descEnterEffect    ?? 'typewriter',
    gridEnter:        o?.gridCellEnterEffect ?? 'zoomIn',
    gridExplode:      o?.gridExplosionStyle  ?? 'burst',
    gridKwFsz:        o?.gridKeywordFontSize ?? 80,
    gridShortFsz:     o?.gridShortFontSize   ?? 42,
    gridKwClr:        o?.gridKeywordColor    || o?.labelColor  || '#ffe655',
    gridShortClr:     o?.gridShortColor      || o?.shortColor  || 'rgba(255,255,255,0.95)',
  };
}

function getScale(n: number) {
  if (n <= 5) return 1;
  if (n <= 7) return 0.82;
  return 0.68;
}

// ── Card radial positions ─────────────────────────────────────────────────────
function cardPos(i: number, n: number) {
  const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
  return {
    cx: CX + Math.cos(angle) * CARD_RADIUS,
    cy: CY + Math.sin(angle) * CARD_RADIUS,
    angle,
  };
}

// ── Left-column label positions (phase 3 target) ─────────────────────────────
const LEFT_COL_X  = 160;   // center x of left labels
const LEFT_COL_W  = 280;   // pill width
const LEFT_COL_H  = 60;    // pill height
const LEFT_TOP_Y  = 180;
const LEFT_STEP   = (CH - LEFT_TOP_Y - 80) / 9;  // max 9 items spacing

function leftLabelPos(i: number, n: number) {
  const step = Math.min(LEFT_STEP, (CH - LEFT_TOP_Y - 80) / Math.max(n - 1, 1));
  return {
    x: LEFT_COL_X,
    y: LEFT_TOP_Y + i * step,
  };
}

// ── Right-side desc positions (phase 4) ──────────────────────────────────────
const DESC_COL_X = 520;    // start x of desc text

function descPos(i: number, n: number) {
  const lp = leftLabelPos(i, n);
  return { x: DESC_COL_X, y: lp.y };
}

// ── Grid layout (phase 5) ─────────────────────────────────────────────────────
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
  const PAD  = 32;
  const GRID_TOP = 150;
  const cellW = Math.floor((CW - PAD * (cols + 1)) / cols);
  const cellH = Math.floor((CH - GRID_TOP - 60 - PAD * (rows + 1)) / rows);
  return Array.from({ length: n }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      cx: PAD + col * (cellW + PAD) + cellW / 2,
      cy: GRID_TOP + PAD + row * (cellH + PAD) + cellH / 2,
      w:  cellW,
      h:  cellH,
    };
  });
}

// ── Laser beam (relay: prev → cur) ───────────────────────────────────────────
function drawLaser(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number,
  x1: number, y1: number,
  t: number,
  accent: string,
) {
  if (t <= 0 || t >= 1) return;
  // Tip travels from source to dest
  const tipT   = clamp(t * 1.4, 0, 1);
  const tailT  = clamp(t * 1.4 - 0.3, 0, 1);
  const tipX   = lerp(x0, x1, easeOutCubic(tipT));
  const tipY   = lerp(y0, y1, easeOutCubic(tipT));
  const tailX  = lerp(x0, x1, easeOutCubic(tailT));
  const tailY  = lerp(y0, y1, easeOutCubic(tailT));

  const dist = Math.hypot(x1 - x0, y1 - y0);
  if (dist < 1) return;

  ctx.save();

  // Core beam
  const grad = ctx.createLinearGradient(tailX, tailY, tipX, tipY);
  grad.addColorStop(0, hex2rgba(accent, 0));
  grad.addColorStop(0.4, hex2rgba(accent, 0.6));
  grad.addColorStop(0.85, hex2rgba(accent, 1));
  grad.addColorStop(1, '#ffffff');

  ctx.shadowColor = accent;
  ctx.shadowBlur  = 30;
  ctx.strokeStyle = grad;
  ctx.lineWidth   = 3;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  // Glow halo
  ctx.globalAlpha = 0.35;
  ctx.lineWidth   = 12;
  ctx.shadowBlur  = 50;
  ctx.strokeStyle = accent;
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  // Tip flare
  const flare = (1 - tipT) > 0.05 ? 0 : clamp((t - 0.7) / 0.3, 0, 1);
  if (flare > 0) {
    ctx.globalAlpha = flare;
    ctx.shadowBlur  = 60;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(tipX, tipY, 12 * flare, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Center polygon ────────────────────────────────────────────────────────────
function drawCenterPoly(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  accent: string,
  accent2: string,
  polyShape: PolyShape,
  polyR: number,
  alpha: number,
) {
  const sides = polyShape === 'star5' ? 5 : POLY_SIDES[polyShape] ?? 6;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = accent;
  ctx.shadowBlur  = 30;
  ctx.strokeStyle = accent;
  ctx.lineWidth   = 4;
  if (polyShape === 'star5') drawStar(ctx, CX, CY, polyR, polyR * 0.45, 5);
  else drawPolygon(ctx, CX, CY, polyR, sides);
  ctx.stroke();
  ctx.shadowBlur  = 18;
  ctx.lineWidth   = 2;
  ctx.strokeStyle = accent2;
  if (polyShape === 'star5') drawStar(ctx, CX, CY, polyR * 0.62, polyR * 0.28, 5);
  else drawPolygon(ctx, CX, CY, polyR * 0.62, sides);
  ctx.stroke();
  ctx.shadowBlur  = 20;
  ctx.fillStyle   = accent;
  ctx.beginPath();
  ctx.arc(CX, CY, 12 + 4 * Math.sin(elapsed * 0.004), 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Phase 1+2: single card in radial position ─────────────────────────────────
function drawRadialCard(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  i: number,
  n: number,
  point: GeneratedContent['points'][number],
  cardEnterT: number,    // 0→1 card body scale-in
  alpha: number,
  showShort: boolean,
  shortAlpha: number,
  accent: string,
  accent2: string,
  scale: number,
  r: ReturnType<typeof resolveOpts>,
) {
  const { cx, cy } = cardPos(i, n);
  const slideR  = (1 - easeOutBack(Math.min(cardEnterT, 0.999))) * 60;
  const { angle } = cardPos(i, n);
  const dcx     = cx + Math.cos(angle) * slideR;
  const dcy     = cy + Math.sin(angle) * slideR;
  const eased   = easeOutBack(Math.min(cardEnterT, 0.999));

  const CARD_W  = Math.round(340 * scale);
  const lFsz    = Math.round(r.labelFsz * scale);
  const sFsz    = Math.round(r.shortFsz * scale);
  const PAD_Y   = Math.round(18 * scale);
  const LABEL_GAP = Math.round(12 * scale);
  const cr      = Math.round(14 * scale);

  ctx.font = `700 ${sFsz}px "Noto Sans SC", sans-serif`;
  const shortLines = point.short
    ? wrapText(ctx, point.short, CARD_W - Math.round(20 * scale)).slice(0, 2)
    : [];
  const shortLineH  = sFsz + Math.round(8 * scale);
  const shortBlockH = shortLines.length > 0
    ? shortLines.length * shortLineH - (shortLineH - sFsz) : 0;
  const CARD_H  = lFsz + (showShort && shortLines.length > 0 ? LABEL_GAP + shortBlockH : 0) + PAD_Y * 2;

  const cx0     = dcx - CARD_W / 2;
  const cy0     = dcy - CARD_H / 2;
  const labelY  = cy0 + PAD_Y + lFsz / 2;
  const shortY  = labelY + lFsz / 2 + LABEL_GAP + sFsz / 2;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Card scale-in
  ctx.save();
  ctx.translate(dcx, dcy);
  ctx.scale(eased, eased);
  ctx.translate(-dcx, -dcy);

  const cardBg = ctx.createLinearGradient(cx0, cy0, cx0, cy0 + CARD_H);
  cardBg.addColorStop(0, hex2rgba(accent, 0.22));
  cardBg.addColorStop(1, hex2rgba(accent, 0.08));
  ctx.fillStyle = cardBg;
  ctx.beginPath();
  ctx.roundRect(cx0, cy0, CARD_W, CARD_H, cr);
  ctx.fill();

  ctx.shadowColor = accent;
  ctx.shadowBlur  = 20;
  const bord = ctx.createLinearGradient(cx0, cy0, cx0 + CARD_W, cy0);
  bord.addColorStop(0, hex2rgba(accent, 0.95));
  bord.addColorStop(1, hex2rgba(accent2, 0.55));
  ctx.strokeStyle = bord;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.roundRect(cx0, cy0, CARD_W, CARD_H, cr);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore(); // scale-in

  // Label
  ctx.shadowColor = r.labelClr;
  ctx.shadowBlur  = 28;
  ctx.font        = `900 ${lFsz}px "Noto Sans SC", sans-serif`;
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle   = r.labelClr;
  ctx.fillText(point.label, dcx, labelY);
  ctx.shadowBlur  = 0;

  // Short (when visible)
  if (showShort && shortLines.length > 0) {
    ctx.save();
    ctx.globalAlpha *= shortAlpha;
    ctx.shadowColor  = accent2;
    ctx.shadowBlur   = 20;
    ctx.font         = `700 ${sFsz}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle    = r.shortClr;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    shortLines.forEach((line, li) => ctx.fillText(line, dcx, shortY + li * shortLineH));
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Connector line from polygon
  if (eased > 0.3) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.45;
    const gl = ctx.createLinearGradient(CX, CY, cx, cy);
    gl.addColorStop(0, hex2rgba(accent, 0.8));
    gl.addColorStop(1, hex2rgba(accent2, 0.2));
    ctx.strokeStyle = gl;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([5, 8]);
    ctx.beginPath();
    ctx.moveTo(CX + Math.cos(angle) * Math.round(145 * scale), CY + Math.sin(angle) * Math.round(145 * scale));
    ctx.lineTo(dcx - Math.cos(angle) * CARD_W / 2, dcy - Math.sin(angle) * CARD_H / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Sequence badge
  ctx.font        = `600 ${Math.round(16 * scale)}px monospace`;
  ctx.textAlign   = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle   = hex2rgba(accent, 0.72);
  ctx.fillText(`${String(i + 1).padStart(2, '0')}`, cx0 + CARD_W - 8, cy0 + 6);

  ctx.restore(); // globalAlpha
}

// ── Phase 3: sliding card (lerp from radial to left-label position) ───────────
function drawSlidingCard(
  ctx: CanvasRenderingContext2D,
  i: number,
  n: number,
  label: string,
  slideT: number,     // 0→1 progress
  accent: string,
  r: ReturnType<typeof resolveOpts>,
) {
  const { cx: srcCX, cy: srcCY } = cardPos(i, n);
  const { x: dstX, y: dstY }    = leftLabelPos(i, n);

  const t = easeInOutQuad(clamp(slideT, 0, 1));
  const cx = lerp(srcCX, dstX, t);
  const cy = lerp(srcCY, dstY, t);

  // During transition: draw as morphing from card → label pill
  const cardAlpha = 1 - easeOutCubic(t);
  const labelAlpha = easeOutCubic(t);

  // Fading card ghost
  if (cardAlpha > 0.02) {
    ctx.save();
    ctx.globalAlpha = cardAlpha * 0.9;
    ctx.font = `900 ${r.labelFsz}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = r.labelClr;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 20 * cardAlpha;
    ctx.fillText(label, cx, cy);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Emerging label pill
  if (labelAlpha > 0.05) {
    drawLeftLabel(ctx, i, n, label, labelAlpha, accent, r);
  }
}

// ── Phase 3 settled: left label pill ─────────────────────────────────────────
function drawLeftLabel(
  ctx: CanvasRenderingContext2D,
  i: number,
  n: number,
  label: string,
  alpha: number,
  accent: string,
  r: ReturnType<typeof resolveOpts>,
  highlighted = false,
) {
  const { x, y } = leftLabelPos(i, n);
  const fsz = r.leftKwFsz;
  const clr = r.leftKwClr;
  const pillW = LEFT_COL_W;
  const pillH = LEFT_COL_H;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Left accent bar
  ctx.fillStyle  = clr;
  ctx.shadowColor = clr;
  ctx.shadowBlur  = highlighted ? 22 : 8;
  ctx.beginPath();
  ctx.roundRect(x - pillW / 2, y - pillH / 2, 6, pillH, 3);
  ctx.fill();

  // Semi-transparent pill background
  ctx.shadowBlur = 0;
  ctx.fillStyle  = hex2rgba(accent, 0.08);
  ctx.beginPath();
  ctx.roundRect(x - pillW / 2 + 10, y - pillH / 2, pillW - 10, pillH, [0, 8, 8, 0]);
  ctx.fill();

  // Keyword text
  ctx.font         = `700 ${fsz}px "Noto Sans SC", sans-serif`;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = clr;
  ctx.shadowColor  = clr;
  ctx.shadowBlur   = highlighted ? 18 : 6;
  ctx.fillText(label, x - pillW / 2 + 22, y);
  ctx.shadowBlur = 0;

  ctx.restore();
}

// ── Phase 4: desc text on right side ─────────────────────────────────────────
function drawDescItem(
  ctx: CanvasRenderingContext2D,
  i: number,
  n: number,
  desc: string,
  elapsed: number,     // elapsed since this desc started appearing
  accent: string,
  r: ReturnType<typeof resolveOpts>,
) {
  const { x: dx, y: dy } = descPos(i, n);
  const fsz    = r.descFsz;
  const clr    = r.descClr;
  const maxW   = CW - dx - 80;

  ctx.font = `500 ${fsz}px "Noto Sans SC", sans-serif`;
  const lines  = wrapText(ctx, desc, maxW).slice(0, 4);
  const lineH  = fsz + 10;

  let alpha = 1;
  let offsetX = 0;
  let clipChars = desc.length;

  switch (r.descEnter) {
    case 'fadeIn':
      alpha = easeOutCubic(clamp(elapsed / 500, 0, 1));
      break;
    case 'slideRight':
      alpha   = clamp(elapsed / 400, 0, 1);
      offsetX = lerp(80, 0, easeOutCubic(clamp(elapsed / 500, 0, 1)));
      break;
    case 'typewriter':
    default: {
      const CHAR_MS = 40;
      clipChars = Math.min(Math.floor(elapsed / CHAR_MS), desc.length);
      break;
    }
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font        = `500 ${fsz}px "Noto Sans SC", sans-serif`;
  ctx.textAlign   = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle   = clr;
  ctx.shadowColor = accent;
  ctx.shadowBlur  = 8;

  let charCount = 0;
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const lineY = dy + li * lineH - ((lines.length - 1) * lineH) / 2;
    const tx    = dx + offsetX;

    if (r.descEnter === 'typewriter') {
      const toShow = Math.max(0, Math.min(line.length, clipChars - charCount));
      if (toShow === 0) break;
      ctx.fillText(line.slice(0, toShow), tx, lineY);
      charCount += line.length;
      // Blinking cursor on last active line
      if (toShow === line.length && charCount <= clipChars && li === lines.length - 1) {
        const tw = ctx.measureText(line).width;
        if (Math.floor(elapsed / 500) % 2 === 0) {
          ctx.fillStyle = r.leftKwClr;
          ctx.fillText('|', tx + tw + 4, lineY);
          ctx.fillStyle = clr;
        }
      }
    } else {
      ctx.fillText(line, tx, lineY);
    }
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Phase 5: grid cell ────────────────────────────────────────────────────────
function drawGridCell(
  ctx: CanvasRenderingContext2D,
  cell: GridCell,
  point: GeneratedContent['points'][number],
  enterT: number,     // 0→1 cell appear
  explodeT: number,   // 0→1 explosion
  elapsed: number,
  accent: string,
  accent2: string,
  r: ReturnType<typeof resolveOpts>,
  seed: number,
) {
  const { cx, cy, w, h } = cell;
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;

  // Explosion transform
  let tx = 0, ty = 0, rot = 0, exAlpha = 1;
  if (explodeT > 0) {
    // Use seed-based direction
    const et = easeOutCubic(explodeT);
    const sin = (v: number) => Math.sin(v * 0.9999);
    const angle = ((sin(seed * 127.1 + 1.3) * 43758.5) % 1 + 1) % 1 * Math.PI * 2;
    const dist  = 300 + (((sin(seed * 311.7 + 2.1) * 43758.5) % 1 + 1) % 1) * 400;
    switch (r.gridExplode) {
      case 'scatter':
        tx  = Math.cos(angle) * dist * et;
        ty  = Math.sin(angle) * dist * et;
        rot = angle * et * 0.5;
        break;
      case 'implode':
        tx  = (CX - cx) * et * 0.8;
        ty  = (CY - cy) * et * 0.8;
        rot = et * 2;
        break;
      case 'burst':
      default:
        tx  = Math.cos(angle) * dist * et;
        ty  = Math.sin(angle) * dist * et - 120 * et;
        rot = (angle > Math.PI ? 1 : -1) * et * 1.5;
    }
    exAlpha = 1 - explodeT * explodeT;
    if (exAlpha <= 0.01) return;
  }

  // Enter transform
  let scaleE = 1, enterAlpha = 1;
  switch (r.gridEnter) {
    case 'zoomIn':
      scaleE     = lerp(0.1, 1, easeOutBack(Math.min(enterT, 0.999)));
      enterAlpha = clamp(enterT * 3, 0, 1);
      break;
    case 'flipIn':
      scaleE     = Math.abs(Math.sin(enterT * Math.PI / 2));
      enterAlpha = clamp(enterT * 2, 0, 1);
      break;
    case 'slideUp':
      ty        += lerp(80, 0, easeOutCubic(enterT));
      enterAlpha = clamp(enterT * 2, 0, 1);
      break;
    case 'fadeIn':
    default:
      enterAlpha = easeOutCubic(enterT);
  }

  ctx.save();
  ctx.globalAlpha = Math.min(enterAlpha, exAlpha);
  ctx.translate(cx + tx, cy + ty);
  ctx.rotate(rot);
  ctx.scale(scaleE, scaleE);

  // Cell background
  const bg = ctx.createLinearGradient(-w / 2, -h / 2, -w / 2, h / 2);
  bg.addColorStop(0, hex2rgba(accent, 0.25));
  bg.addColorStop(1, hex2rgba(accent, 0.08));
  ctx.fillStyle = bg;
  ctx.shadowColor = accent;
  ctx.shadowBlur  = 18;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 16);
  ctx.fill();

  ctx.strokeStyle = hex2rgba(accent, 0.8);
  ctx.lineWidth   = 2;
  ctx.shadowBlur  = 12;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 16);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Keyword
  const kwFsz = Math.min(r.gridKwFsz, h * 0.38);
  ctx.font         = `900 ${kwFsz}px "Noto Sans SC", sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = r.gridKwClr;
  ctx.shadowColor  = r.gridKwClr;
  ctx.shadowBlur   = 20 + 8 * Math.sin(elapsed * 0.003 + seed);
  ctx.fillText(point.label, 0, -h * 0.12);
  ctx.shadowBlur = 0;

  // Short sentence
  if (point.short) {
    const sFsz = Math.min(r.gridShortFsz, h * 0.22);
    ctx.font        = `600 ${sFsz}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle   = r.gridShortClr;
    ctx.shadowColor = accent2;
    ctx.shadowBlur  = 10;
    const maxW  = w - 32;
    const lines = wrapText(ctx, point.short, maxW).slice(0, 2);
    const lineH = sFsz + 6;
    lines.forEach((line, li) => {
      ctx.fillText(line, 0, h * 0.18 + li * lineH);
    });
    ctx.shadowBlur = 0;
  }

  // Sequence number
  ctx.font        = `500 ${Math.round(Math.min(18, h * 0.1))}px monospace`;
  ctx.textAlign   = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle   = hex2rgba(accent, 0.65);
  ctx.fillText(`${String(r.gridKwFsz > 0 ? 1 : 0).padStart(0) || ''}${point.label.slice(0, 1)}`, w / 2 - 10, -h / 2 + 8);

  ctx.restore();
}

// ── Main entry ────────────────────────────────────────────────────────────────
export function drawAITechCards(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  polyShape: PolyShape,
  aitechOpts?: AItechOptions,
): void {
  const n       = content.points.length;
  if (n === 0) return;
  const displayN = Math.min(n, 12);
  const scale   = getScale(displayN);
  const r       = resolveOpts(aitechOpts, accent);
  const POLY_R  = Math.round(145 * scale);

  const { p1Start, p2Start, p3Start, p4Start, p5Start } = aiTechPhases(displayN);
  const LASER_DUR = 320;

  // ─────────────────────────────────────────────────────────────────────────────
  // Decide which phase we're in
  // ─────────────────────────────────────────────────────────────────────────────
  const isPhase5 = elapsed >= p5Start;
  const isPhase4 = !isPhase5 && elapsed >= p4Start;
  const isPhase3 = !isPhase4 && !isPhase5 && elapsed >= p3Start;
  const isPhase2 = !isPhase3 && !isPhase4 && !isPhase5 && elapsed >= p2Start;
  const isPhase1 = !isPhase2 && !isPhase3 && !isPhase4 && !isPhase5;

  // ─────────────────────────────────────────────────────────────────────────────
  // Background rings (faint, present during phases 1-3)
  // ─────────────────────────────────────────────────────────────────────────────
  if (elapsed > 200 && !isPhase4 && !isPhase5) {
    const ringFade = isPhase3
      ? Math.max(0, 1 - (elapsed - p3Start) / AT.slideDur)
      : 1;
    const bgA = clamp((elapsed - 200) / 800, 0, 1) * 0.4 * ringFade;
    for (let ring = 1; ring <= 3; ring++) {
      const rad   = CARD_RADIUS * (0.55 + ring * 0.18);
      const pulse = 1 + 0.025 * Math.sin(elapsed * 0.0008 + ring);
      ctx.save();
      ctx.globalAlpha = bgA * (0.35 - ring * 0.05);
      ctx.strokeStyle = ring % 2 === 0 ? accent : accent2;
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([4, 10]);
      ctx.beginPath();
      ctx.arc(CX, CY, rad * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 5: Grid outro
  // ─────────────────────────────────────────────────────────────────────────────
  if (isPhase5) {
    const cells     = computeGrid(displayN);
    const STAGGER   = 80;
    const allIn     = STAGGER * (displayN - 1) + 400;
    const holdStart = p5Start + allIn + 200;
    const explStart = holdStart + AT.gridHold;

    // Phase 5 header title
    const titleAlpha = clamp((elapsed - p5Start) / 500, 0, 1);
    if (titleAlpha > 0) {
      ctx.save();
      ctx.globalAlpha  = titleAlpha;
      ctx.font         = `700 54px "Noto Sans SC", sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = '#ffffff';
      ctx.shadowColor  = accent;
      ctx.shadowBlur   = 28;
      ctx.fillText(content.title, CX, 80);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    for (let i = 0; i < displayN; i++) {
      const cellStart = p5Start + i * STAGGER;
      const te        = elapsed - cellStart;
      if (te <= 0) continue;
      const enterT   = clamp(te / 400, 0, 1);
      const explodeT = elapsed >= explStart
        ? clamp((elapsed - explStart) / AT.explodeDur, 0, 1)
        : 0;

      drawGridCell(ctx, cells[i], content.points[i], enterT, explodeT, elapsed,
        accent, accent2, r, i * 1234.5);
    }
    return;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 4: Desc on right side
  // ─────────────────────────────────────────────────────────────────────────────
  if (isPhase4) {
    // Draw left labels (settled)
    for (let i = 0; i < displayN; i++) {
      drawLeftLabel(ctx, i, displayN, content.points[i].label, 1, accent, r);
    }

    // Right divider line
    const divX  = DESC_COL_X - 30;
    const divAl = clamp((elapsed - p4Start) / 300, 0, 1);
    if (divAl > 0) {
      ctx.save();
      ctx.globalAlpha = divAl * 0.4;
      ctx.strokeStyle = accent;
      ctx.lineWidth   = 1;
      ctx.shadowColor = accent;
      ctx.shadowBlur  = 8;
      ctx.beginPath();
      ctx.moveTo(divX, LEFT_TOP_Y - 20);
      ctx.lineTo(divX, CH - 60);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Each desc item
    for (let i = 0; i < displayN; i++) {
      const descStart = p4Start + i * AT.descSlot;
      const te = elapsed - descStart;
      if (te <= 0) continue;
      const point = content.points[i];
      if (!point.desc) continue;

      // Highlight paired left label
      drawLeftLabel(ctx, i, displayN, point.label, 1, accent, r, true);

      drawDescItem(ctx, i, displayN, point.desc, te, accent, r);
    }

    return;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 3: Slide to left
  // ─────────────────────────────────────────────────────────────────────────────
  if (isPhase3) {
    const slideProgress = clamp((elapsed - p3Start) / AT.slideDur, 0, 1);

    for (let i = 0; i < displayN; i++) {
      drawSlidingCard(ctx, i, displayN, content.points[i].label, slideProgress, accent, r);
    }

    // Fading polygon during slide
    const polyAlpha = 1 - easeOutCubic(slideProgress);
    if (polyAlpha > 0.02) {
      drawCenterPoly(ctx, elapsed, accent, accent2, polyShape, POLY_R, polyAlpha);
    }
    return;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 1 & 2: Radial cards with laser
  // ─────────────────────────────────────────────────────────────────────────────

  // Center polygon (fades in over first 600ms of phase 1)
  const polyAlpha = clamp((elapsed - p1Start) / 600, 0, 1);
  if (polyAlpha > 0) {
    drawCenterPoly(ctx, elapsed, accent, accent2, polyShape, POLY_R, polyAlpha);
  }

  // Laser relay: compute prev/cur positions
  for (let phase = 0; phase <= 1; phase++) {
    const phaseStart = phase === 0 ? p1Start : p2Start;
    const slot       = phase === 0 ? AT.keywordSlot : AT.shortSlot;
    const inPhase    = phase === 0 ? isPhase1 : isPhase2;

    if (!inPhase && !(phase === 0 && isPhase2)) continue;  // also show phase1 cards during phase2

    for (let i = 0; i < displayN; i++) {
      const cardStart   = phaseStart + i * slot;
      const te          = elapsed - cardStart;
      if (te <= 0) continue;

      // Laser: from prev card (or center for first) to this card
      if (phase === 0) {
        // Phase1 laser
        const laserT = clamp(te / LASER_DUR, 0, 1);
        if (laserT < 1) {
          const prevI   = i === 0 ? -1 : i - 1;
          const src     = prevI < 0 ? { cx: CX, cy: CY } : (() => { const p = cardPos(prevI, displayN); return { cx: p.cx, cy: p.cy }; })();
          const dst     = cardPos(i, displayN);
          drawLaser(ctx, src.cx, src.cy, dst.cx, dst.cy, laserT, accent);
        }
      } else if (inPhase) {
        // Phase2 laser: from prev card to this card
        const laserT = clamp(te / LASER_DUR, 0, 1);
        if (laserT < 1) {
          const prevI  = i === 0 ? displayN - 1 : i - 1;
          const src    = cardPos(prevI, displayN);
          const dst    = cardPos(i, displayN);
          drawLaser(ctx, src.cx, src.cy, dst.cx, dst.cy, laserT, accent);
        }
      }
    }
  }

  // Draw all currently visible cards
  for (let i = 0; i < displayN; i++) {
    // Phase 1 card appear timing
    const kStart     = p1Start + i * AT.keywordSlot;
    const kTe        = elapsed - kStart;
    if (kTe <= 0) continue;

    const cardEnterT  = clamp(kTe / 500, 0, 1);
    const alpha       = clamp(kTe / 350, 0, 1);

    // Phase 2: short sentence
    const shStart     = p2Start + i * AT.shortSlot;
    const shTe        = elapsed - shStart;
    const showShort   = shTe > 0;
    const shortAlpha  = showShort ? clamp(shTe / 400, 0, 1) : 0;

    drawRadialCard(
      ctx, elapsed, i, displayN,
      content.points[i],
      cardEnterT, alpha,
      showShort, shortAlpha,
      accent, accent2, scale, r,
    );
  }
}
