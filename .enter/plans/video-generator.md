# Plan: Differentiated Theme Animations + City Recording Fix

## Clarified Scope
- **中国风 (Chinese)**: UNCHANGED — keep existing card layout
- **城市地标 (City)**: New layout — left city-icon panel + right text content; slide-up animation
- **AI科技 (AITech)**: New layout — central configurable polygon + radial content items, one per edge, sequential appearance
- **Bug fix**: City style cards don't appear during recording

---

## Problem 1: City Recording Bug

**Root cause**: `handleRecord` calls `createAnimEngine` (async, loads SVG image). If loading takes time or fails, the recording captures a frozen title frame (from where preview was stopped). There's no `.catch()`, so failures are silent.

**Fix**: Add `restart(onComplete?: () => void): void` to `AnimEngine` interface. Restarts the existing engine from t=0 with a new completion callback — no async image loading needed.

---

## Problem 2: City Card Redesign (Left Icon + Right Text)

**New layout** (keeps 2-col × 3-row grid):
- Card: 915px wide × 268px tall
- **Left panel** (300px): draws the loaded `shapeImg` (city skyline SVG) centered, themed background
- **Vertical separator**: accent-colored gradient line
- **Right panel** (615px): label (68px, accent), short text (34px, white/70), desc (26px, white/40)
- **Animation**: slide up from bottom (`offsetY = (1-eased) * 120`), fade in
- Left panel background: `rgba(accent, 0.12)` dark, with subtle neon bottom glow

Need to pass `shapeImg: HTMLImageElement` into `drawCards` so city cards can render it.

---

## Problem 3: AI Tech Radial Layout

**New layout**: Completely different from grid — radial arrangement:
- Central polygon at canvas center (960, 540), radius 130px
- N content items placed at equal angles starting from top (-90°)  
- Each item: compact card (460 × 130px) at radius 370px from center
- Connecting line from polygon edge to each card (glowing, extends during animation)
- Items appear one by one (existing `T.cardSlot` timing preserved)

**Polygon shape** (user-configurable, defaults to hexagon):
- triangle (3), quad (4), pentagon (5), hexagon (6), octagon (8), star5 (5-pointed star), decagon (10)
- Shape is purely visual decoration — items always distributed by count
- Polygon pulses/rotates gently even before cards appear

**Card design** (compact):
- Semi-transparent pill/rect with accent border
- Small numbered circle (index), large label (52px), short text (26px)
- Right-side glow effect matching polygon style

---

## Implementation Files

### 1. `src/types/video.ts` (+10 lines)
```ts
export type PolyShape = 'triangle' | 'quad' | 'pentagon' | 'hexagon' | 'octagon' | 'star5' | 'decagon';
export interface AIOptions { polyShape: PolyShape; }
// Add to GeneratorConfig:
aiOptions?: AIOptions;
```

### 2. `src/lib/engine/helpers.ts` (~82 lines total, +15 lines)
Add polygon drawing utilities:
```ts
export function drawPolygon(ctx, cx, cy, r, sides, rotation = 0): void
export function drawStar(ctx, cx, cy, outerR, innerR, points): void
```

### 3. `src/lib/canvasEngine.ts` (~115 lines total)
- Add `restart(onComplete?: () => void): void` to `AnimEngine` interface + implementation
- Add `aiOptions?: AIOptions` parameter to `createAnimEngine`
- Pass `shapeImg` and `aiOptions?.polyShape` to `drawCards`

### 4. `src/lib/engine/cards.ts` (rewrite as thin dispatcher, ~40 lines)
- Keep Chinese drawing as-is (inline or import existing logic)
- New city drawing: import `drawCityCards`
- New AI drawing: import `drawAITechCards`

### 5. `src/lib/engine/cards-city.ts` (NEW, ~110 lines)
City left-icon + right-text cards. Uses `shapeImg` for icon panel.

### 6. `src/lib/engine/cards-aitech.ts` (NEW, ~210 lines)
AI radial polygon layout. Configurable polygon via `polyShape` param.

### 7. `src/components/ContentForm.tsx` (~279 lines total)
- Import `AIOptions, PolyShape`
- Add `aiOptions` state (default: `{ polyShape: 'hexagon' }`)
- Update `onGenerate` signature: add `aiOptions: AIOptions` as 4th param
- Add **AI图形选项** section (shown only for `aitech` style):
  - 7 shape buttons: 三角形/四边形/五边形/六边形/八边形/五角星/十边形
  - Styled same as Chinese color scheme buttons

### 8. `src/pages/Index.tsx` (~232 lines total)
- Import `AIOptions`
- `handleGenerate` accepts `aiOptions: AIOptions` 4th param
- Store in config; pass `aiOptions={config.aiOptions}` to `<VideoGenerator>`

### 9. `src/components/VideoGenerator.tsx` (~280 lines total)
- Add `aiOptions?: AIOptions` to `Props`
- **Fix recording bug**: Replace `createAnimEngine(...)` in `handleRecord` with:
  ```ts
  engine.restart(() => {
    setTimeout(() => { recorder.stop(); clearInterval(timer); }, 500);
  });
  ```
- Pass `aiOptions` to `createAnimEngine` (initial load in `useEffect`)

---

## Verification
1. Chinese style: cards unchanged, appear as before
2. City style: each card has left city-skyline icon + right text, slides up from bottom
3. City recording: cards appear properly (no more blank canvas freeze)
4. AI style: central polygon glows, then cards radiate outward one by one
5. AI style: polygon shape selector appears in ContentForm when `style='aitech'`
6. Selected polygon shape changes the central polygon in the animation
7. All new files stay under 280 lines
