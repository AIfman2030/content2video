# AItech Style — Deep Redesign (Reference-Matching)

## Context
User wants AItech style to match 4 reference screenshots closely:
1. **Title**: one or more lines can have a colored border box around them (green box effect)
2. **Radial (Phase 1)**: keywords as plain numbered text labels (`01关键词`) around a dynamic center pattern (arc/ring/spiral, configurable+random); no card boxes
3. **Flip-burst transition**: screen shatters between radial → desc
4. **Desc Phase (Phase 3)**: left = keyword in big bordered box (`01关键词` together), right = description text (typewriter/fade)
5. **Grid Phase (Phase 4/5)**: sequence num **above** cell, cell = keyword bold + dashed separator + short phrase, glowing border; auto-layout 4/6/8/9/10/12

Previous 5-phase structure is simplified to 4 phases:
- **Phase 1** (T.cardBase + n×900ms): numbered plain-text keywords appear radially one by one with laser
- **Phase 2** (burst transition, 600ms): flip/shatter screen transition
- **Phase 3** (n×800ms): keyword+desc list with bordered boxes, sequential typewriter
- **Phase 4** (grid appear 1500ms + hold 1200ms + explode 800ms): grid finale

---

## Files to Modify

| File | Change |
|---|---|
| `src/types/video.ts` | Add `borderEnabled/borderColor/borderPadX/borderPadY` to `TitleLineConfig`; expand `AItechOptions` |
| `src/lib/engine/title.ts` | Handle border box rendering per line |
| `src/lib/engine/cards-aitech.ts` | Full rewrite to 4-phase system |
| `src/lib/engine/helpers.ts` | Update `AT` constants and `aiTechPhases()` |
| `src/components/StyleConfigPanel.tsx` | Title line border controls; AItech panel updates |

---

## 1. `src/types/video.ts`

### TitleLineConfig — add border fields
```typescript
export interface TitleLineConfig {
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 400 | 700 | 900;
  color: string;
  colorEnd: string;
  enterAnim: TitleLineEnterAnim;
  // NEW: optional bordered box (like green box in reference image 1)
  borderEnabled?: boolean;    // show a rounded-rect border around this line
  borderColor?: string;       // '' = use accent color
  borderBgAlpha?: number;     // 0–1, fill opacity inside border (default 0.85)
  borderPadX?: number;        // horizontal padding inside border (default 48)
  borderPadY?: number;        // vertical padding inside border (default 22)
  borderRadius?: number;      // corner radius (default 20)
}
```

### AItechOptions — add new fields
```typescript
export interface AItechOptions {
  // existing
  polyShape: PolyShape;
  accentColor: string;
  glowIntensity: 'off' | 'subtle' | 'normal' | 'strong';
  // Phase 1: center pattern
  centerPattern?: 'random' | 'arc' | 'rings' | 'spiral' | 'neuron'; // default 'random'
  // Phase 1: radial labels
  radialFontSize?: number;         // default 52
  radialColor?: string;            // '' = '#ffffff'
  radialNumberColor?: string;      // '' = accent
  // Phase 3: keyword box style
  kwBoxFontSize?: number;          // default 62
  kwBoxColor?: string;             // '' = '#ffffff'
  kwBoxBorderColor?: string;       // '' = accent
  kwBoxBorderWidth?: number;       // default 3
  kwBoxBorderRadius?: number;      // default 16
  kwBoxBgAlpha?: number;           // default 0 (transparent bg)
  // Phase 3: desc style
  descFontSize?: number;           // default 42
  descColor?: string;              // '' = 'rgba(220,220,220,0.92)'
  descEnterEffect?: 'typewriter' | 'fadeIn' | 'slideRight';
  // Phase 4: grid
  gridCellEnterEffect?: 'zoomIn' | 'flipIn' | 'slideUp' | 'fadeIn';
  gridExplosionStyle?: 'burst' | 'scatter' | 'implode';
  gridKeywordFontSize?: number;    // default 72
  gridShortFontSize?: number;      // default 38
  gridKeywordColor?: string;       // '' = '#ffffff'
  gridShortColor?: string;         // '' = 'rgba(200,200,200,0.9)'
  gridBorderColor?: string;        // '' = accent
  gridNumColor?: string;           // '' = accent
  // Transition
  burstTransition?: 'shatter' | 'flash' | 'wipe';  // default 'shatter'
}
```

---

## 2. `src/lib/engine/helpers.ts`

Update `AT` constants and `aiTechPhases()`:
```typescript
export const AT = {
  keywordSlot: 900,    // ms per keyword in radial phase
  burstDur: 600,       // flip/shatter transition
  descSlot: 800,       // ms per desc item
  gridStagger: 90,     // ms stagger between grid cells
  gridHold: 1200,      // hold after all cells appear
  explodeDur: 900,     // explosion outro
};

export function aiTechPhases(n: number) {
  const p1Start = T.cardBase;
  const p2Start = p1Start + n * AT.keywordSlot;           // burst transition
  const p3Start = p2Start + AT.burstDur;                  // desc phase
  const p4Start = p3Start + n * AT.descSlot + 400;        // grid phase
  const total   = p4Start + n * AT.gridStagger + 400 + AT.gridHold + AT.explodeDur + 200;
  return { p1Start, p2Start, p3Start, p4Start, total };
}
```

---

## 3. `src/lib/engine/title.ts`

In the `drawOneLine()` function (or equivalent), after computing text width, if `cfg.borderEnabled`:
```typescript
// Draw border box BEHIND the text
const boxW = textW + (cfg.borderPadX ?? 48) * 2;
const boxH = cfg.fontSize + (cfg.borderPadY ?? 22) * 2;
const bx   = cx - boxW / 2;
const by   = lineY - cfg.fontSize / 2 - (cfg.borderPadY ?? 22);
const br   = cfg.borderRadius ?? 20;
const bc   = cfg.borderColor || accent;

// Fill (semi-transparent bg)
if ((cfg.borderBgAlpha ?? 0) > 0) {
  ctx.fillStyle = hex2rgba(bc, cfg.borderBgAlpha ?? 0.85);
  ctx.beginPath(); ctx.roundRect(bx, by, boxW, boxH, br); ctx.fill();
}
// Stroke with glow
ctx.shadowColor = bc;
ctx.shadowBlur  = 28;
ctx.strokeStyle = bc;
ctx.lineWidth   = 4;
ctx.beginPath(); ctx.roundRect(bx, by, boxW, boxH, br); ctx.stroke();
ctx.shadowBlur  = 0;
```
This must happen before the text fill, so text renders on top of the border.

---

## 4. `src/lib/engine/cards-aitech.ts` — Full Rewrite

### Center Patterns (5 types)
```typescript
function drawCenterPattern(ctx, elapsed, cx, cy, r, accent, accent2, pattern, alpha)
```
- **`arc`**: Two overlapping C-shaped arcs (like reference image 2), thick stroke, gradient fill sim, rotating slowly
- **`rings`**: 3 concentric rings with dashed gap, counter-rotating, pulsing
- **`spiral`**: 2 spiral arms, rotating
- **`neuron`**: central circle + 6 radiating curved lines (like nerve endings)
- **`random`**: seeded from content length → picks one of the above

### Phase 1: Radial plain-text keywords with laser
Layout: `cardPos(i, n)` unchanged (radius=370).
Each keyword label:
```
ctx.font = `700 ${r.radialFsz}px "Noto Sans SC", sans-serif`;
// Draw: small filled circle node at the connector endpoint
// connector: thin dashed line from poly edge to node
// Text: `${String(i+1).padStart(2,'0')}${point.label}` — number in accent, label in radialColor
// OR: draw number in accent, then label in white (two-pass fillText at offset positions)
```

### Phase 2: Burst/shatter transition
`burstT = clamp((elapsed - p2Start) / AT.burstDur, 0, 1)`

For **`shatter`** (default): 
- Divide canvas into ~16 irregular cells
- Each cell shifts outward + rotates based on distance from center
- Alpha fades to 0 then new scene fades in

Implementation approach (overlay only — cannot clip previous frame in canvas):
- Draw 16 rectangles (trapezoids) flying outward with rotation, filled with accent color
- These mask the old scene
- Behind them (or after they disappear), new scene content starts appearing
- Use `ctx.save(); ctx.translate; ctx.rotate; ctx.fillRect; ctx.restore();` per shard

For **`flash`**: White flash (simple, 2 frames white)

For **`wipe`**: Radial wipe from center

### Phase 3: Keyword+Desc list (matching reference image 3)

**Left side — keyword bordered box:**
```
LEFT_BOX_X = 60          // left edge of box
LEFT_BOX_W = 460         // box width (wider than before, shows "01关键词" together)
LEFT_TOP_Y = 100         // first item top
```
Each item row height = auto-fit based on n. Max 8 items visible at once.
If n > 8 → scroll/page behavior (show 8 at a time, items above slide up when new one enters).

Box style:
- Dark/transparent background + colored border (like image 3 green box)
- "01关键词" format: number in accent bold + label text in white
- Font: larger than previous pill (kwBoxFontSize, default 58)
- Appear: slide in from left + border draws from left to right

**Right side — desc text:**
```
DESC_X = 560        // start x
DESC_W = CW - DESC_X - 60
```
- Plain text, gray/white
- Appear: typewriter effect (paired timing with left box appearance)

### Phase 4: Grid (matching reference image 4)

**Grid layout:** `autoCols(n)` unchanged.
**Cell structure:**
```
┌──────────────────┐
│ (number above)   │  ← seq number drawn ABOVE cell (not inside)
│╔═══════════════╗ │
│║   关键词       ║ │  ← bold, large
│║  ─ ─ ─ ─ ─   ║ │  ← dashed separator line
│║  短语内容      ║ │  ← short phrase, smaller
│╚═══════════════╝ │
└──────────────────┘
```
Sequence number: centered above cell, in accent color bold (`01`, `02`...)
Cell border: glowing accent (2-3px), roundRect(16px)
Separator: `ctx.setLineDash([4,4])`, horizontal at 55% height of cell

---

## 5. `src/components/StyleConfigPanel.tsx`

### TitleLineEditor — add border controls
When expanded, show:
- `[checkbox] 显示边框` → `borderEnabled`
- `边框颜色` → `borderColor` (OptionalColorPicker, placeholder=主色)
- `背景不透明度` → `borderBgAlpha` (NumericSlider 0-100, divided by 100)
- `内边距 X/Y` → `borderPadX`, `borderPadY` (NumericSlider)

### AItechPanel — new sections
- **中心图案** section: PillSelect `centerPattern` (随机/弧形/同心环/螺旋/神经元)
- **关键词标签** section: `radialFontSize`, `radialColor`, `radialNumberColor`
- **关键词框** section (Phase 3): `kwBoxFontSize`, `kwBoxBorderColor`, `kwBoxBorderWidth`, `kwBoxBgAlpha`
- **说明文字** section: `descFontSize`, `descColor`, `descEnterEffect`
- **宫格** section: unchanged from before + add `gridBorderColor`, `gridNumColor`
- **过渡效果** section: `burstTransition`

Remove old sections that no longer apply: `leftKeywordFontSize/Color` (replaced by `kwBox*`), `slideEffect`.

---

## Verification
1. Select AItech style → play animation
2. Verify phase 1: numbered plain text labels appear one by one with laser
3. Verify burst transition: flash/shatter occurs at transition point
4. Verify phase 3: left bordered boxes appear sequentially, right desc typewriters in
5. Verify phase 4: grid appears with numbers above cells, dashed separator inside
6. In StyleConfigPanel → change `borderEnabled` on title line → see green box appear
7. Change `centerPattern` → see different center logo
8. Lint: zero errors
