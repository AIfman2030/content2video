/**
 * subtitle-cover.ts — Cinematic "Camera Aperture" cover for the film-subtitle style.
 * Pure geometry, no text — uses accent colors with film-inspired decorations.
 */
import {
  COVER_W, COVER_H, CoverOpts, hex2rgbaCover, seededRandCover, registerCover,
} from './registry';

const W = COVER_W, H = COVER_H;

// ── Helpers ───────────────────────────────────────────────────────────────────
type DC = CanvasRenderingContext2D;

function rr(ctx: DC, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Background ────────────────────────────────────────────────────────────────
function drawBg(ctx: DC, accent: string) {
  // Deep dark base
  ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H);

  // Subtle radial gradient from accent at center
  const bg = ctx.createRadialGradient(W / 2, H * 0.48, 0, W / 2, H * 0.48, H * 0.72);
  bg.addColorStop(0,   hex2rgbaCover(accent, 0.06));
  bg.addColorStop(0.5, 'rgba(8,5,18,0.85)');
  bg.addColorStop(1,   'rgba(0,0,0,1)');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Subtle scan-line overlay
  for (let y = 0; y < H; y += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, y, W, 1);
  }
}

// ── Letterbox bars ────────────────────────────────────────────────────────────
function drawLetterbox(ctx: DC) {
  const barH = Math.round(H * 0.062);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, barH);
  ctx.fillRect(0, H - barH, W, barH);
}

// ── Film sprocket holes along left + right edge ───────────────────────────────
function drawSprockets(ctx: DC, accent: string, side: 'left' | 'right') {
  const hW = 34, hH = 22, hR = 5;
  const margin = 24;
  const x = side === 'left' ? margin : W - margin - hW;
  const spacing = 52;
  const count = Math.floor((H - 80) / spacing);
  const startY = 40 + (H - 80 - (count - 1) * spacing) / 2;

  ctx.save();
  for (let i = 0; i < count; i++) {
    const y = startY + i * spacing;
    ctx.strokeStyle = hex2rgbaCover(accent, 0.22);
    ctx.lineWidth = 1.5;
    rr(ctx, x, y - hH / 2, hW, hH, hR); ctx.stroke();
    // Inner filled with very faint accent
    ctx.fillStyle = hex2rgbaCover(accent, 0.05);
    rr(ctx, x, y - hH / 2, hW, hH, hR); ctx.fill();
  }
  ctx.restore();
}

// ── Horizontal scan lines (cinematic) ────────────────────────────────────────
function drawCinemaLines(ctx: DC, accent: string) {
  const lines = 8;
  const topBar = Math.round(H * 0.062);
  const botBar = H - topBar;
  const usableH = botBar - topBar;
  ctx.save();
  for (let i = 0; i < lines; i++) {
    const y = topBar + ((i + 0.5) / lines) * usableH;
    const alpha = 0.025 + 0.015 * Math.sin(i * 1.3);
    ctx.strokeStyle = hex2rgbaCover(accent, alpha);
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();
}

// ── Light beam from upper-right ──────────────────────────────────────────────
function drawLightBeam(ctx: DC, accent: string) {
  ctx.save();
  const g = ctx.createLinearGradient(W, 0, W / 2, H * 0.7);
  g.addColorStop(0, hex2rgbaCover(accent, 0.14));
  g.addColorStop(0.5, hex2rgbaCover(accent, 0.03));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(W * 0.55, H * 0.75);
  ctx.lineTo(W * 0.72, H * 0.75);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ── Camera aperture iris (6 blades) ──────────────────────────────────────────
function drawAperture(ctx: DC, cx: number, cy: number, R: number, accent: string, accent2: string, seed: number) {
  const rand = seededRandCover(seed);

  // Outer decorative rings
  const rings = [
    { r: R * 1.35, lw: 1.5, dash: [10, 12], a: 0.20 },
    { r: R * 1.10, lw: 2,   dash: [5, 8],   a: 0.28 },
    { r: R * 0.88, lw: 1,   dash: [2, 6],   a: 0.18 },
  ];
  ctx.save();
  rings.forEach(ring => {
    ctx.strokeStyle = hex2rgbaCover(accent, ring.a);
    ctx.lineWidth = ring.lw;
    ctx.setLineDash(ring.dash);
    ctx.beginPath(); ctx.arc(cx, cy, ring.r, 0, Math.PI * 2); ctx.stroke();
  });
  ctx.setLineDash([]); ctx.restore();

  // 6 aperture blades
  const BLADES = 6;
  const baseRot = Math.PI / 12;
  ctx.save();
  ctx.translate(cx, cy);
  for (let b = 0; b < BLADES; b++) {
    const startAngle = baseRot + (b / BLADES) * Math.PI * 2;
    const endAngle   = startAngle + (Math.PI / BLADES) * 1.25;

    ctx.beginPath();
    ctx.arc(0, 0, R, startAngle, endAngle);
    ctx.arc(0, 0, R * 0.28, endAngle, startAngle, true);
    ctx.closePath();

    const bladeGrad = ctx.createLinearGradient(
      Math.cos(startAngle) * R * 0.5, Math.sin(startAngle) * R * 0.5,
      Math.cos(endAngle)   * R * 0.5, Math.sin(endAngle)   * R * 0.5,
    );
    bladeGrad.addColorStop(0, hex2rgbaCover(accent,  0.55 + rand() * 0.15));
    bladeGrad.addColorStop(1, hex2rgbaCover(accent2, 0.25 + rand() * 0.12));
    ctx.fillStyle = bladeGrad;
    ctx.shadowColor = accent; ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Blade edge highlight
    ctx.strokeStyle = hex2rgbaCover(accent, 0.75);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, R, startAngle, endAngle);
    ctx.stroke();
  }
  ctx.restore();

  // Inner glow circle
  ctx.save();
  const innerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.32);
  innerGlow.addColorStop(0, hex2rgbaCover(accent, 0.95));
  innerGlow.addColorStop(0.5, hex2rgbaCover(accent, 0.55));
  innerGlow.addColorStop(1, hex2rgbaCover(accent, 0));
  ctx.fillStyle = innerGlow; ctx.shadowColor = accent; ctx.shadowBlur = 50;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.32, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.restore();

  // Pupil (dark center)
  ctx.save();
  ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.92;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  // Glinting ring on pupil
  ctx.strokeStyle = hex2rgbaCover(accent, 0.7); ctx.lineWidth = 2;
  ctx.shadowColor = accent; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.15, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Cross-hair lines (faint)
  ctx.save();
  ctx.strokeStyle = hex2rgbaCover(accent, 0.15); ctx.lineWidth = 1;
  ctx.setLineDash([3, 12]);
  ctx.beginPath(); ctx.moveTo(cx - R * 1.5, cy); ctx.lineTo(cx + R * 1.5, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - R * 1.5); ctx.lineTo(cx, cy + R * 1.5); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ── Corner tick marks ─────────────────────────────────────────────────────────
function drawCornerTicks(ctx: DC, accent: string) {
  const m = 60, len = 36, lw = 2.5;
  const corners = [
    [[m, m], [m + len, m], [m, m + len]],
    [[W - m, m], [W - m - len, m], [W - m, m + len]],
    [[m, H - m], [m + len, H - m], [m, H - m - len]],
    [[W - m, H - m], [W - m - len, H - m], [W - m, H - m - len]],
  ] as [number, number][][];

  ctx.save();
  ctx.strokeStyle = hex2rgbaCover(accent, 0.45);
  ctx.lineWidth = lw;
  ctx.shadowColor = accent; ctx.shadowBlur = 8;
  for (const [[ox, oy], [hx, hy], [vx, vy]] of corners) {
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(ox, oy); ctx.lineTo(vx, vy); ctx.stroke();
  }
  ctx.shadowBlur = 0; ctx.restore();
}

// ── Floating geometric particles ─────────────────────────────────────────────
function drawParticles(ctx: DC, accent: string, accent2: string, seed: number) {
  const rand = seededRandCover(seed + 999);
  ctx.save();
  for (let i = 0; i < 22; i++) {
    const px = rand() * W, py = rand() * H;
    const pr = 1.5 + rand() * 3.5;
    const pa = 0.06 + rand() * 0.16;
    const clr = rand() > 0.5 ? accent : accent2;
    ctx.fillStyle = hex2rgbaCover(clr, pa);
    ctx.shadowColor = clr; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0; ctx.restore();
}

// ── Main draw function ────────────────────────────────────────────────────────
async function drawSubtitleCover(
  ctx: DC,
  opts: CoverOpts,
) {
  const { accent, accent2, coverIndex } = opts;

  drawBg(ctx, accent);
  drawLightBeam(ctx, accent);
  drawCinemaLines(ctx, accent);

  // Film sprocket holes on both sides
  drawSprockets(ctx, accent, 'left');
  drawSprockets(ctx, accent, 'right');

  // Central aperture iris
  const apertureR = Math.round(W * 0.30);
  const apertureCX = W / 2;
  const apertureCY = Math.round(H * 0.47);
  drawAperture(ctx, apertureCX, apertureCY, apertureR, accent, accent2, coverIndex * 91);

  // Corner tick marks (like camera viewfinder)
  drawCornerTicks(ctx, accent);

  // Floating particles for depth
  drawParticles(ctx, accent, accent2, coverIndex * 7);

  // Letterbox bars on top of everything
  drawLetterbox(ctx);
}

registerCover('subtitle', drawSubtitleCover);
