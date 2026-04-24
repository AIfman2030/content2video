# Plan: 4 Fixes + Cover Generation Feature

---

## Fix 1: Nature — Left/Right Color Differentiation + Center Intersection

### Data change (`NatureContent`)
Add `commonItems?: string[]` — items appearing on BOTH sides.

### AI prompt update
Update `extractNatureContent` prompt: extract `leftItems` (A only), `rightItems` (B only), `commonItems` (shared concepts).

### Canvas layout change
Current: two separated circles, both same green accent.
New:
- **Left circle center**: `(430, 560)`, radius 300 — words in `accent` (#4ade80 green)
- **Right circle center**: `(1490, 560)`, radius 300 — words in `accent2` (#86efac light-green)
- **Center zone** (`x=730-1190`, `y=310-810`): `commonItems` words in golden/orange (#fbbf24) with its own `buildWordSlots` scaled to the center area
- Color coding is CLEARLY different: left=green, right=light-teal, center=gold

### Files:
- `src/types/video.ts` — add `commonItems?: string[]` to `NatureContent`
- `src/services/deepseek.ts` — update nature prompt
- `src/lib/engine/nature-scene.ts` — layout changes + third color + center zone words

---

## Fix 2: Remove Location Names from Canvas

In `nature-scene.ts`, delete the two `ctx.fillText(pair.leftName, ...)` / `ctx.fillText(pair.rightName, ...)` lines.

---

## Fix 3: 24 Nature Covers

Reuse the existing 12 spot drawing functions in 12 NEW pairings (cross-pairings) to create 24 total.

**24 pairs** = original 6 + 6 rotated + 6 cross + 6 diagonal:

| Idx | Left | Right | Idx | Left | Right |
|-----|------|-------|-----|------|-------|
| 0 | 黄山 | 西湖 | 12 | 黄山 | 泰山 |
| 1 | 泰山 | 九寨沟 | 13 | 西湖 | 九寨沟 |
| 2 | 张家界 | 桂林 | 14 | 张家界 | 峨眉山 |
| 3 | 峨眉山 | 三峡 | 15 | 桂林 | 三峡 |
| 4 | 长城 | 雪山 | 16 | 长城 | 武夷山 |
| 5 | 武夷山 | 青海湖 | 17 | 雪山 | 青海湖 |
| 6 | 黄山 | 张家界 | 18 | 黄山 | 峨眉山 |
| 7 | 西湖 | 桂林 | 19 | 西湖 | 三峡 |
| 8 | 泰山 | 峨眉山 | 20 | 泰山 | 张家界 |
| 9 | 九寨沟 | 三峡 | 21 | 九寨沟 | 桂林 |
| 10 | 长城 | 青海湖 | 22 | 长城 | 三峡 |
| 11 | 武夷山 | 雪山 | 23 | 武夷山 | 泰山 |

### Files:
- `src/lib/engine/nature-spots.ts` — expand SPOT_PAIRS from 6 to 24 entries
- `src/lib/themes.ts` — expand NATURE_PAIRS from 6 to 24 entries

---

## Fix 4: Cover Generation (9:16) — All Styles + Extensible Architecture

### Architecture Overview
```
src/lib/cover/
  registry.ts         (~30 lines) — maps StyleType → CoverDrawFn, easy to add new styles
  chinese-cover.ts    (~80 lines) — Chinese 9:16 cover drawing
  city-cover.ts       (~80 lines) — City 9:16 cover drawing
  aitech-cover.ts     (~80 lines) — AI Tech 9:16 cover drawing
  nature-cover.ts     (~80 lines) — Nature 9:16 cover drawing
src/lib/coverEngine.ts  (~60 lines) — async setup + dispatch
src/components/CoverPreview.tsx  (~120 lines) — canvas + action buttons
```

### Cover canvas spec (1080×1920 px, 9:16 portrait)
- Background: style-themed gradient (dark, rich)
- Top tag pill: style name (e.g., "AI 科技", small badge)
- Center (y=480-1440): large decorative shape/icon (the selected cover's SVG at ~600×600px) + glow
- Title: 2-3 lines, large font (centered, white, below the icon)
- Key points: 3 bullet lines (brief, from content.points[0..2].label)
- Bottom strip: style accent line + "MADE WITH ..." watermark

### CoverDrawFn type (extensible)
```ts
// src/lib/cover/registry.ts
export type CoverDrawFn = (
  ctx: CanvasRenderingContext2D,
  content: GeneratedContent,
  coverIndex: number,
  shapeImg: HTMLImageElement | null,
  theme: ThemeConfig,
  natureContent?: NatureContent,
) => void;

export const COVER_REGISTRY: Partial<Record<StyleType, CoverDrawFn>> = {};
// Each cover file self-registers:
// import { COVER_REGISTRY } from './registry';
// COVER_REGISTRY['chinese'] = drawChineseCover;
```

### `coverEngine.ts`
```ts
export async function renderCover(
  canvas: HTMLCanvasElement,
  content: GeneratedContent,
  style: StyleType,
  coverIndex: number,
  chineseOptions?: ChineseOptions,
  aiOptions?: AIOptions,
  natureContent?: NatureContent,
): Promise<void>
// Loads shape image, gets theme, calls registry[style]()
```

### CoverPreview.tsx
- Receives same props as VideoGenerator (content, style, coverIndex, ...)
- `useEffect` → `renderCover()` on a 1080×1920 canvas (CSS scaled to fit screen)
- Two buttons at bottom:
  - "下载封面 PNG" → `canvas.toDataURL('image/png')` → `<a download>`
  - "继续生成视频 →" → calls `onContinue()` callback
- Clean dark overlay with the canvas centered in portrait orientation

### VideoGenerator.tsx changes
- Initial state changed: `'cover' | 'idle' | 'recording' | 'converting' | 'done'`
- When state = `'cover'`: render `<CoverPreview>` with `onContinue={() => setRecordState('idle')}`
- When state = `'idle'|...'done'`: existing video UI (unchanged)

---

## File-by-file Summary

| File | Action | Est. Lines |
|------|--------|-----------|
| `src/types/video.ts` | + `commonItems?` | ~55 |
| `src/services/deepseek.ts` | update nature prompt | ~130 |
| `src/lib/engine/nature-scene.ts` | 3-zone layout, remove names | ~270 |
| `src/lib/engine/nature-spots.ts` | expand to 24 pairs | ~265 |
| `src/lib/themes.ts` | 24 nature pairs | ~215 |
| `src/lib/cover/registry.ts` | NEW | ~30 |
| `src/lib/cover/chinese-cover.ts` | NEW | ~80 |
| `src/lib/cover/city-cover.ts` | NEW | ~80 |
| `src/lib/cover/aitech-cover.ts` | NEW | ~80 |
| `src/lib/cover/nature-cover.ts` | NEW | ~80 |
| `src/lib/coverEngine.ts` | NEW | ~60 |
| `src/components/CoverPreview.tsx` | NEW | ~120 |
| `src/components/VideoGenerator.tsx` | add cover state | ~290 |

> `nature-scene.ts` may exceed 280 lines; will split into `nature-scene-words.ts` if needed.

---

## Verification
1. Nature left=green, right=teal, center=gold; all distinct and readable
2. No location names visible on canvas
3. 24 cover pairs available in nature cover picker
4. All 4 styles show cover preview (9:16 portrait) before video
5. "下载封面 PNG" downloads correctly
6. "继续生成视频" proceeds to existing animation
7. Adding new styles in future: create `src/lib/cover/newstyle-cover.ts` + register in `registry.ts`
