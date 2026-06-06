# 关键词排列风格 — Implementation Plan

## Context
Add a new "关键词排列" (keyword layout) style to the video generator.  
The title animates first, then a central keyword appears at canvas center, followed by surrounding keywords appearing one by one.  
6 layout variants with full typography customization.

---

## Architecture

### Content Structure
Reuse existing `GeneratedContent`:
- `content.title` = full title text
- `content.points[0].label` = **center keyword** (2-4 chars, extracted from title, e.g. "坚持", "希望")
- `content.points[1..n].label` = surrounding keywords (1-6 chars each, 16-30 total)

This reuses all existing infrastructure (ContentEditor, StudioCanvas, extractContent flow).

---

## Files to Create

### `src/lib/engine/cards-keyword.ts`
Main render engine. Entry: `drawKeywordCards(ctx, elapsed, content, accent, accent2, opts)`.
6 layout sub-functions + shared animation helpers.
Timing: `T.cardBase + 800 (title hold) + 600 (center word) + n×200 (stagger) + 2500 (hold)`.

**6 Layouts:**

1. **`grid`** (表格网格 — image 1 reference)  
   Equal cell grid covering canvas. Title in center 2×2 merged cells. Thin-line grid borders.  
   Keywords fill each cell, centered. Cells reveal top-left → right → down.

2. **`cloud`** (词云散布 — image 2 reference)  
   Center word at canvas center (large). Other keywords scatter with:  
   - Pre-computed positions (collision-avoided) around center  
   - Varying font size (larger near center, smaller far out)  
   - Keywords fly in from their final positions (scale 0 → 1 with slight random offset)

3. **`card`** (编号卡片 — image 3 reference)  
   2–3 rows × 3–4 cols of numbered rounded-rect cards. Black bg + green/accent border glow.  
   Card: seq number top, large keyword middle, thin divider, short desc bottom.  
   Stagger: left→right, row by row.

4. **`radial`** (同心圆排列)  
   Center word at canvas center. Keywords on 3 concentric rings (r=240, 380, 500).  
   8/12/remaining per ring. Appear clockwise per ring. Ring circles drawn as dashed arcs.

5. **`orbit`** (椭圆轨道)  
   Center word at center. 3 elliptical orbits (perspective-projected, tilted ~20°).  
   Keywords distributed across orbits. Orbit ring drawn with dashed stroke.  
   Keywords appear as "electrons" landing at position (zoom in from center).

6. **`flow`** (数字雨瀑布)  
   Canvas divided into ~8 vertical columns. Keywords fall down each column sequentially.  
   Each column: keywords stack up from bottom, slight random horizontal nudge.  
   Center word appears last at canvas center with big scale-in entrance.

### `src/lib/cover/keyword-cover.ts`
Cover generator: dark bg + center keyword large text + floating mini keywords in background + subtle geometric pattern.
`registerCover('keyword', drawKeywordCover)`.

---

## Files to Modify

### `src/types/video.ts`
```typescript
// Add 'keyword' to StyleType
export type StyleType = 'chinese' | 'city' | 'aitech' | 'nature' | 'subtitle' | 'translation' | 'manga' | 'keyword';

export interface KeywordOptions {
  layout: 'grid' | 'cloud' | 'card' | 'radial' | 'orbit' | 'flow';
  accentColor: string;               // main accent color
  bgColor?: string;                  // '' = auto dark (#050508)
  centerFontSize: number;            // center keyword size, default 120
  centerColor?: string;              // '' = accent
  keywordFontSize: number;           // base surrounding keyword size, default 52
  keywordColor?: string;             // '' = '#ffffff'
  fontFamily?: string;               // '' = "Noto Sans SC"
  fontWeight?: 400 | 600 | 800;     // default 700
  staggerMs: number;                 // ms between keyword appearances, default 200
  gridLineColor?: string;            // for grid layout
  cardBorderColor?: string;          // for card layout
}

export const DEFAULT_KEYWORD_OPTIONS: KeywordOptions = {
  layout: 'cloud',
  accentColor: '#00d4ff',
  centerFontSize: 120,
  keywordFontSize: 52,
  staggerMs: 200,
  fontWeight: 700,
};
```

### `src/services/deepseek.ts`
Add `KEYWORD_PROMPT` + `extractKeywords(text)`:
```
Extract central topic word (2-4 chars) and 20-28 surrounding keywords (1-6 chars each).
Return GeneratedContent format: points[0].label = centerWord, points[1..n].label = keywords.
```

### `src/lib/engine/helpers.ts`
Add timing:
```typescript
export function keywordTotalMs(n: number) {
  return T.cardBase + 800 + 600 + n * 200 + 2500 + T.outroDur;
}
```

### `src/lib/engine/cards.ts`
Add early return for 'keyword':
```typescript
import { drawKeywordCards } from './cards-keyword';
if (style === 'keyword') { drawKeywordCards(ctx, elapsed, content, accent, accent2, keywordOptions); return; }
```
Note: need to thread `keywordOptions` through the `drawCards` signature.

### `src/lib/canvasEngine.ts`
- Add `KeywordOptions` to imports + `createAnimEngine` params
- Add `isKeyword` flag
- In `total` calc: use `keywordTotalMs(n)` for keyword style
- In `render()`: call `drawKeywordCards` directly (skip shapeImg loading for keyword)
- Skip `drawTitle` for 'keyword' (handled internally like aitech)

### `src/lib/coverEngine.ts`
Add `import './cover/keyword-cover';`

### `src/components/StyleSelector.tsx`
Add entry to `STYLES` array:
```typescript
{
  key: 'keyword',
  name: '关键词',
  desc: '主题发散 · 关键词排列',
  tag: '6种排列效果',
  bg: 'linear-gradient(135deg,#020812,#0a1f35)',
  accent: '#00d4ff',
}
```

### `src/components/StyleConfigPanel.tsx`
Add `KeywordPanel` component with:
- Layout selector (6 options with icon preview)
- Center keyword font size slider
- Surrounding keyword font size slider
- Accent color picker (center word color)
- Keyword color picker
- Font weight toggle
- Stagger speed slider
- BG color picker

Add to main `StyleConfigPanel` switch.
Add `keywordOptions`/`onKeywordOptionsChange` props.

### `src/pages/Index.tsx`
- Add `'keyword'` to `BG_BY_STYLE` and `ACCENT_BY_STYLE`
- Add `const [keywordOptions, setKeywordOptions] = useState<KeywordOptions>(DEFAULT_KEYWORD_OPTIONS);`
- In `handleGenerate`: if `style === 'keyword'` → call `extractKeywords(text)`
- Pass `keywordOptions` to `StyleConfigPanel` and `createAnimEngine`

---

## Animation Timing

```
0ms        → Title dropsFromSky (existing drawTitle)
2500ms     → Title header settled
2800ms     → T.cardBase  
3600ms     → (T.cardBase + 800) Center keyword appears (scale 0→1, 600ms)
4200ms     → Surrounding keywords appear one by one (200ms stagger)
4200+n×200 → All visible → hold 2500ms
+2500ms    → Outro fade
```

---

## Key Design Decisions

1. **Reuse `GeneratedContent`** — no new content state needed in Index.tsx (except `keywordOptions`)
2. **`drawTitle` skipped for keyword** — keyword style handles title display internally (same as aitech pattern)
3. **Pre-compute positions** for cloud/radial/orbit layouts before animation loop (stable positions)
4. **Collision avoidance** for cloud: simple grid-cell assignment + random nudge within cell
5. **All 6 layouts share** the same center-word-first entrance + staggered keyword entrance pattern

---

## Verification
- Select "关键词" style → input text → AI generates 20+ keywords → animation plays through all 6 layouts
- Center keyword appears first at canvas center
- Surrounding keywords appear one by one
- StyleConfigPanel shows all typography controls
- Layout switching updates canvas in real-time
