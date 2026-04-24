# Plan: Differentiated Theme Animations + City Recording Bug Fix

## Context
Two issues to solve:
1. **All 3 themes use identical card layout** (rectangular box pop-in grid). The user wants:
   - **Chinese & City**: Left-panel graphic + right-panel text (split card), each with unique animation
   - **AI Tech**: Radial polygon layout — central configurable polygon, content items radiate outward one by one, each connected by a glowing line
2. **City style recording bug**: Cards don't appear when recording; only title shows. Root cause: `handleRecord` calls `createAnimEngine` (async due to `loadShapeImage`), but if city SVG fails to load or is slow, the recording captures a frozen title frame. Fix: add a `restart(cb?)` method to `AnimEngine` to reuse the existing loaded engine.

## Image References
- **Chinese/City refs**: Cards split into LEFT graphic (shape icon) + RIGHT text content. Clean, modern cards with a decorative divider between panels.
- **AI Tech ref**: Central polygon with radial spokes; each content item floats at the end of a spoke, appearing sequentially.

---

## File Changes

### 1. `src/types/video.ts` (+10 lines)
- Add `export type PolyShape = 'triangle' | 'quad' | 'pentagon' | 'hexagon' | 'octagon' | 'star5' | 'decagon'`
- Add `export interface AIOptions { polyShape: PolyShape }`
- Add `aiOptions?: AIOptions` to `GeneratorConfig`

### 2. `src/lib/engine/helpers.ts` (+15 lines, now ~82 lines)
Add two drawing utilities:
```ts
drawPolygon(ctx, cx, cy, r, sides, rotation=0)  // regular N-gon
drawStar(ctx, cx, cy, outerR, innerR, points)    // star shape
```

### 3. `src/lib/canvasEngine.ts` (modify, ~115 lines)
- Add `restart(onComplete?: () => void): void` to `AnimEngine` interface
- Implement `restart` inside the engine (reset startTime, update completion callback, restart RAF)
- Add `aiOptions?: AIOptions` param to `createAnimEngine`
- Pass `shapeImg` and `aiOptions?.polyShape` to `drawCards`

### 4. `src/lib/engine/cards.ts` (rewrite as thin dispatcher, ~30 lines)
```ts
import { drawCardsLeft } from './cards-left'  // chinese + city
import { drawCardsAITech } from './cards-aitech'

export function drawCards(..., shapeImg, polyShape?) {
  if (style === 'aitech') drawCardsAITech(...)
  else drawCardsLeft(...)  // chinese & city both use left+right split
}
```

### 5. `src/lib/engine/cards-left.ts` (NEW, ~120 lines)
Handles **Chinese** and **City** styles. Same left+right layout for both; only animation direction and colors differ.

**Layout** (per card, 1-column centered, 5 cards stacked):
- Card: `CW * 0.75` wide (~1440px), `cardH = 200px`, `startX = CW * 0.125`
- Left panel: `panelW = 320px` — draws `shapeImg` centered (at ~200×200px), semi-transparent themed background
  - Number badge: bottom-left of left panel
  - Vertical divider line (accent color, gradient) separating left and right
- Right panel: remaining width
  - Label (68px, accent), short text (34px, white/70), desc lines (26px, white/40)

**Animations** (per style):
- `chinese`: card slides in from LEFT (`offsetX = (1-eased) * 200`); left panel bg = `rgba(accent, 0.12)` ink wash
- `city`: card slides up from BOTTOM (`offsetY = (1-eased) * 100`); left panel bg = neon-dark gradient; left panel has scanline shimmer

**Layout note**: 5 rows, each `cardH + rowGap` apart:
- Row 0: y = 140
- Row 1: y = 366
- Row 2: y = 592
- Row 3: y = 818
- Row 4: y = 1044 (bottom edge 1044+200=1244 > 1080 — OK since cards clip at canvas edge)
- Actually with `cardH=200, rowGap=22`: last card bottom = 818+200 = 1018 ≤ 1080 ✓ (for 4 rows of 5 cards with 1 col)

Wait — previous layout was 2 columns. With a single column left+right split, 6 cards in a single column at 200px each + 22px gap = 6*200 + 5*22 = 1310px → too tall.
**Revised**: Keep 2 columns for Chinese/City too, but each card is left+right split.
- 2 cols × 3 rows, same positions as before: card W=915px
- Left panel: 320px, right panel: 595px
- Rows: y=160, y=454, y=748 (last row bottom=748+268=1016 ≤ 1080 ✓)

### 6. `src/lib/engine/cards-aitech.ts` (NEW, ~200 lines)
Handles **AI Tech** style exclusively.

**Layout**: Radial arrangement around canvas center (960, 540)
- Central polygon: R=130px, drawn procedurally using `drawPolygon` / `drawStar`
- Polygon side count: based on `polyShape` param (triangle=3, quad=4, pentagon=5, hexagon=6, octagon=8, star5=5, decagon=10)
- Content items always placed at N_items equally-spaced angles starting from top (-90°)
- Card center radius: 370px from canvas center
- Card size: 460px × 130px

**Sequencing**:
- `t < T.cardBase`: only polygon is drawn (pulsing, glowing, rotating slowly)
- At `T.cardBase + i*T.cardSlot`: item i animates in (line extends from polygon, card fades+scales in)

**Per card**:
- Background: dark semi-transparent pill shape
- Border: accent gradient
- Content: small number circle (30px) + label (52px) + short text (28px)
- Connecting line: from polygon center to card near-edge, drawn with glowing dash

**Polygon with `star5`**: uses `drawStar(ctx, 960, 540, 130, 60, 5)` (5-pointed star)

### 7. `src/components/ContentForm.tsx` (modify, ~279 lines)
- Import `AIOptions, PolyShape` types
- Add `aiOptions` state: `{ polyShape: 'hexagon' as PolyShape }`
- Add `onGenerate` 4th param: `aiOptions: AIOptions`
- Add "几何图形" selector panel (only shown when `style === 'aitech'`), similar to Chinese advanced options:
  - Inline (not collapsible): "AI 图形选项" label
  - 7 buttons: 三角形, 四边形, 五边形, 六边形, 八边形, 五角星, 十边形
  - Selected button highlighted with accent color

### 8. `src/pages/Index.tsx` (modify, ~230 lines)
- Import `AIOptions`
- Update `handleGenerate` signature to accept `aiOptions: AIOptions`
- Store `aiOptions` in config: `setConfig({ style, coverIndex, text, chineseOptions, aiOptions })`
- Pass `aiOptions={config.aiOptions}` to `<VideoGenerator>`

### 9. `src/components/VideoGenerator.tsx` (modify, ~280 lines)
- Add `aiOptions?: AIOptions` to `Props`
- Pass `aiOptions` to `createAnimEngine` calls
- **Fix recording bug**: Replace the second `createAnimEngine` call in `handleRecord` with:
  ```ts
  engine.restart(() => {
    setTimeout(() => recorder.stop(), 500);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
  });
  ```
  This reuses the already-loaded engine (no async shape-loading) and restarts from t=0.

---

## Verification
1. Chinese style: cards have left graphic panel + right text; slide in from left
2. City style: cards have left city-silhouette panel + right text; slide up from bottom  
3. AI style: central polygon + radial cards appear one by one
4. AI style recording: cards appear properly (bug fixed via engine.restart)
5. UI shows polygon selector for aitech style
6. All files stay under 280 lines
