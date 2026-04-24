# Plan: Differentiated Animations + MP4 Export + City Recording Fix

## Clarified Scope
- **中国风**: UNCHANGED
- **城市地标**: New layout — left city-icon + right text, slide-up animation
- **AI科技**: Radial polygon layout, configurable shape, one item per edge sequential
- **Bug fix**: City recording shows only title (cards missing)
- **MP4 export**: Convert recorded WebM → MP4 using FFmpeg.wasm in browser

---

## Bug 1: City Recording (cards don't appear)

**Root cause**: `handleRecord` calls a new `createAnimEngine` (async, loads SVG). No `.catch()`, so if it fails or is slow, canvas freezes on the title frame from preview.

**Fix**: Add `restart(onComplete?: () => void)` to `AnimEngine`. Reuses already-loaded engine, resets from t=0, no async needed.

---

## Change 1: City Cards — Left Icon + Right Text

**Layout** (keeps 2-col × 3-row grid, card 915 × 268px):
- Left panel (280px): draws `shapeImg` (city skyline SVG) centered at ~200×200px
  - Semi-dark background: `rgba(accent, 0.1)`
  - Neon bottom glow line at panel bottom
- Vertical separator: 2px accent gradient line
- Right panel (635px): number badge (top-left) + label (68px) + short (34px) + desc (26px)
- Animation: slide up from bottom (`offsetY = (1-eased)*120`), fade in

Need: pass `shapeImg: HTMLImageElement` as new param to `drawCards`.

---

## Change 2: AI Tech — Radial Polygon Layout

**Central polygon** (drawn even before cards appear):
- Position: canvas center (960, 540), radius 130px
- Shape: user-configurable (triangle/quad/pentagon/hexagon/octagon/star5/decagon)
- Slowly rotates, pulses with glow

**Content items** (N items at equal angles from top):
- Radius from center: 370px
- Card size: 460 × 130px (compact pill)
- Line from polygon edge → card near-edge (glowing, extends over 400ms)
- Card fades + scales in after line completes
- Sequential: item i starts at `T.cardBase + i * T.cardSlot`

**User-configurable polygon**: selector in ContentForm (aitech only), 7 options.

---

## Change 3: MP4 Export via FFmpeg.wasm

**Flow**:
1. Record canvas → WebM blob (as before)
2. On recording complete: enter `'converting'` state  
3. Load FFmpeg.wasm core from CDN (cached after first load)
4. `ffmpeg.exec(['-i', 'input.webm', '-c:v', 'copy', 'output.mp4'])` — fast re-mux, no re-encode
5. Output MP4 blob → download as `.mp4`

**State machine**: `idle → recording → converting → done`

**New file**: `src/lib/mp4Converter.ts` (~55 lines) — handles FFmpeg load + conversion

---

## Implementation Files

### New dependencies to install:
- `@ffmpeg/ffmpeg@0.12.10`
- `@ffmpeg/util@0.12.2`

### 1. `src/types/video.ts` (+12 lines)
```ts
export type PolyShape = 'triangle' | 'quad' | 'pentagon' | 'hexagon' | 'octagon' | 'star5' | 'decagon';
export interface AIOptions { polyShape: PolyShape; }
// Add to GeneratorConfig: aiOptions?: AIOptions;
```

### 2. `src/lib/engine/helpers.ts` (~82 lines, +15 lines)
```ts
export function drawPolygon(ctx, cx, cy, r, sides, rotation): void
export function drawStar(ctx, cx, cy, outerR, innerR, points): void
```

### 3. `src/lib/canvasEngine.ts` (~120 lines)
- `AnimEngine` interface: add `restart(onComplete?: () => void): void`
- `createAnimEngine` params: add `aiOptions?: AIOptions`
- Pass `shapeImg` + `aiOptions?.polyShape` to `drawCards`

### 4. `src/lib/engine/cards.ts` (rewrite, ~40 lines)
Dispatcher: Chinese → existing logic, City → `drawCityCards`, AITech → `drawAITechCards`

**Signature update**:
```ts
export function drawCards(ctx, elapsed, content, accent, accent2, style, shapeImg, polyShape?)
```

### 5. `src/lib/engine/cards-city.ts` (NEW, ~110 lines)
City left-icon + right-text layout. 2-col × 3-row. Uses `shapeImg` for icon panel.

### 6. `src/lib/engine/cards-aitech.ts` (NEW, ~210 lines)
Radial polygon layout. `drawPolygon`/`drawStar` from helpers. Sequential card appearance.

### 7. `src/lib/mp4Converter.ts` (NEW, ~55 lines)
```ts
// Singleton FFmpeg instance (loaded once, cached)
let ffmpegInstance: FFmpeg | null = null;

export async function webmToMp4(webmBlob: Blob, onProgress?: (p:number)=>void): Promise<Blob>
// - loads FFmpeg from CDN if not cached
// - writes input.webm, runs -c:v copy remux, reads output.mp4
// - returns mp4 Blob
```

### 8. `src/components/ContentForm.tsx` (~279 lines)
- Add `aiOptions` state, `onGenerate` 4th param
- Add AI shape selector section (aitech only):
  7 buttons: 三角形/四边形/五边形/六边形/八边形/五角星/十边形

### 9. `src/pages/Index.tsx` (~235 lines)
- Thread `aiOptions` through `handleGenerate` → config → `<VideoGenerator>`

### 10. `src/components/VideoGenerator.tsx` (~285 lines)
- Add `aiOptions?: AIOptions` prop
- State: `'idle' | 'recording' | 'converting' | 'done'`
- **Recording fix**: replace 2nd `createAnimEngine` with `engine.restart(() => {...})`
- After recording: call `webmToMp4(blob)`, show "转换中…" spinner
- Download as `.mp4`; file name: `${title}.mp4`

---

## Verification
1. Chinese: cards unchanged ✓
2. City: left city-skyline icon + right text, slide up ✓
3. City recording: cards appear (engine.restart fix) ✓
4. AI: radial polygon + sequential cards ✓
5. AI: polygon selector in ContentForm ✓
6. Download is `.mp4` (not `.webm`) ✓
7. All files ≤ 280 lines ✓
