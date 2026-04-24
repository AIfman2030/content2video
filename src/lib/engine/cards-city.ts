import type { GeneratedContent } from '../../types/video';
import { CW, CH, clamp, lerp, easeOutCubic, hex2rgba, T } from './helpers';
import { CITY_LANDMARKS_A } from '../cover/city-landmarks-a';
import { CITY_LANDMARKS_B } from '../cover/city-landmarks-b';

const ALL_CITY = [...CITY_LANDMARKS_A, ...CITY_LANDMARKS_B];

// Layout constants
const LEFT_W  = 420;          // left panel width
const ICON_CX = LEFT_W / 2;  // 210
const ICON_CY = CH / 2;      // 540
const ICON_R  = 170;          // landmark drawing radius

// Right panel
const RIGHT_X    = LEFT_W + 40;
const RIGHT_W    = CW - RIGHT_X - 40;
const ITEM_BASE_H = 108;
const ITEM_GAP    = 18;
const START_Y     = 140;
const AVAIL_H     = CH - START_Y - 60;

export function drawCityCards(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  _shapeImg: HTMLImageElement,  // kept for API compat, not used
  coverIndex = 0,
): void {
  if (elapsed < T.cardBase) return;

  const cardElapsed = elapsed - T.cardBase;
  const n = content.points.length;

  // Auto-scale: fit all items in available height
  const rawTotalH = n * ITEM_BASE_H + (n - 1) * ITEM_GAP;
  const scale = rawTotalH > AVAIL_H ? AVAIL_H / rawTotalH : 1;
  const itemH   = ITEM_BASE_H * scale;
  const itemGap = ITEM_GAP * scale;
  const fsMain  = Math.round(38 * scale);
  const fsDesc  = Math.round(26 * scale);
  const barW    = Math.round(6 * scale);

  // ── Left panel ──────────────────────────────────────────────────────────────
  const panelA = clamp(cardElapsed / 600, 0, 1);
  ctx.save();
  ctx.globalAlpha = easeOutCubic(panelA);

  // Panel bg gradient
  const pbg = ctx.createLinearGradient(0, 0, LEFT_W, CH);
  pbg.addColorStop(0, hex2rgba(accent, 0.18));
  pbg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = pbg; ctx.fillRect(0, 0, LEFT_W, CH);

  // Vertical divider
  const vg = ctx.createLinearGradient(0, 0, 0, CH);
  vg.addColorStop(0, 'transparent');
  vg.addColorStop(0.3, accent);
  vg.addColorStop(0.7, accent2);
  vg.addColorStop(1, 'transparent');
  ctx.strokeStyle = vg; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(LEFT_W, 0); ctx.lineTo(LEFT_W, CH); ctx.stroke();

  // Bottom neon glow
  const bg = ctx.createRadialGradient(ICON_CX, CH, 0, ICON_CX, CH, LEFT_W * 1.2);
  bg.addColorStop(0, hex2rgba(accent, 0.35)); bg.addColorStop(1, 'transparent');
  ctx.fillStyle = bg; ctx.fillRect(0, CH * 0.5, LEFT_W, CH * 0.5);

  // City landmark icon
  const landmarkFn = ALL_CITY[coverIndex % ALL_CITY.length];
  if (landmarkFn) {
    ctx.save(); landmarkFn(ctx, ICON_CX, ICON_CY, ICON_R); ctx.restore();
  }

  ctx.restore();

  // ── Right panel items ────────────────────────────────────────────────────────
  for (let i = 0; i < n; i++) {
    const te = cardElapsed - i * T.cardSlot;
    if (te <= 0) continue;

    const prog    = clamp(te / 600, 0, 1);
    const enterP  = easeOutCubic(prog);
    const slideY  = lerp(40, 0, enterP);
    const itemY   = START_Y + i * (itemH + itemGap) + slideY;

    ctx.save();
    ctx.globalAlpha = clamp(te / 300, 0, 1);

    const point = content.points[i];

    // Left accent bar
    ctx.fillStyle = accent;
    ctx.fillRect(RIGHT_X, itemY + itemH * 0.1, barW, itemH * 0.8);

    // Number circle
    const nR = Math.round(26 * scale);
    const nX = RIGHT_X + barW + 16 + nR;
    const nY = itemY + itemH / 2;
    ctx.beginPath(); ctx.arc(nX, nY, nR, 0, Math.PI * 2);
    ctx.fillStyle = hex2rgba(accent, 0.25); ctx.fill();
    ctx.strokeStyle = accent; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = `700 ${Math.round(22 * scale)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = accent; ctx.fillText(`${i + 1}`, nX, nY);

    // Label
    const txtX = nX + nR + 16;
    ctx.shadowColor = hex2rgba(accent, 0.7); ctx.shadowBlur = 14;
    ctx.font = `700 ${fsMain}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(point.label, txtX, itemY + itemH * 0.32);
    ctx.shadowBlur = 0;

    // Description
    if (point.short) {
      ctx.font = `400 ${fsDesc}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      const maxW = RIGHT_W - (txtX - RIGHT_X) - 30;
      const short = point.short.length > 24 ? point.short.slice(0, 24) + '…' : point.short;
      ctx.fillText(short, txtX, itemY + itemH * 0.68);
    }

    // Separator line
    const sepA = clamp((te - 400) / 300, 0, 1);
    if (sepA > 0 && i < n - 1) {
      ctx.globalAlpha *= sepA * 0.3;
      ctx.strokeStyle = hex2rgba(accent2, 0.5); ctx.lineWidth = 1;
      ctx.setLineDash([6, 8]);
      ctx.beginPath(); ctx.moveTo(RIGHT_X, itemY + itemH + itemGap * 0.5); ctx.lineTo(CW - 40, itemY + itemH + itemGap * 0.5); ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }
}
