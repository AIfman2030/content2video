# Plan: Chinese Style Full Customization

## Context
The Chinese style is too rigid: fixed 2-col × 3-row layout, always 3 text lines per card (label/short/desc), limited shape variety (~25), and only one card entrance animation. Users want full control over layout, per-line content/font/color/animation.

---

## What Changes

### 1. New Types — `src/types/video.ts`

Add new types and extend `ChineseOptions`:

```ts
export type ChineseLineAnim =
  | 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight'
  | 'zoomIn' | 'bounceIn' | 'rotateIn' | 'flipH' | 'typewriter'
  | 'glitch' | 'wave';

export type ChineseLineExitAnim =
  | 'fadeOut' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight'
  | 'zoomOut' | 'dissolve';

export interface ChineseCardLineConfig {
  field: 'label' | 'short' | 'desc' | 'static'; // content source
  staticText?: string;                            // used when field='static'
  fontSize: number;
  fontFamily: string;          // '' = "Noto Sans SC"
  color: string;               // '' = auto from theme
  fontWeight: 400 | 600 | 800;
  enterAnim: ChineseLineAnim;
  exitAnim: ChineseLineExitAnim;
}

// ChineseOptions additions:
//   cardCols: 1 | 2          (default 2)
//   cardRows: 1 | 2 | 3      (default 3)
//   cardLines: ChineseCardLineConfig[]  (1–3 items, default 3 lines)
```

**Default `cardLines` (3 lines, preserving existing behavior):**
```ts
[
  { field: 'label', fontSize: 68, fontFamily: '', color: '', fontWeight: 800, enterAnim: 'slideLeft',  exitAnim: 'fadeOut' },
  { field: 'short', fontSize: 36, fontFamily: '', color: '', fontWeight: 600, enterAnim: 'slideUp',    exitAnim: 'fadeOut' },
  { field: 'desc',  fontSize: 32, fontFamily: '', color: '', fontWeight: 400, enterAnim: 'fadeIn',     exitAnim: 'dissolve' },
]
```

---

### 2. More Shapes — `src/lib/shapes/chinese.ts` + `src/lib/themes.ts`

Add 20 new SVG shape generators to `CHINESE_SVGS`. Categories:

| Group | New shapes |
|-------|-----------|
| 自然 | `plum` 梅花 · `pine` 松竹 · `wave` 水波 · `peony` 牡丹 |
| 纹样 | `fenix` 凤凰纹 · `fish` 鱼纹 · `spiral` 螺旋纹 · `hexflower` 六角花 |
| 文字 | `fu` 福字 · `shou` 寿字 · `xi` 喜字 |
| 器物 | `fan` 折扇 · `vase` 花瓶 · `seal` 印章框 · `crown` 皇冠 |
| 几何 | `ring3` 三环 · `starburst` 放射星 · `maze` 迷宫格 · `diamond4` 四钻 · `lotus8` 八瓣莲 |

Add all new IDs to `CHINESE_SHAPES` in `themes.ts`.

---

### 3. Card Engine Rewrite — `src/lib/engine/cards.ts`

#### Layout
```ts
const cols = chineseOptions?.cardCols ?? 2;
const rows = chineseOptions?.cardRows ?? 3;
const PAGE_SIZE = cols * rows;
const cardW = (CW - MARGIN*2 - GAP*(cols-1)) / cols;
const cardH = computeCardH(lines.length);  // taller for 1 line, shorter for 3
```

#### Per-line animation system

Each line has its own `te` offset (staggered by 80ms per line per card). The animation is applied in `ctx.save/translate/restore` scope:

```ts
function applyLineEnterAnim(
  ctx, text, x, y, te, anim: ChineseLineAnim, fsz, elapsed
): void
```

**12 enter animations:**
- `fadeIn` — alpha 0→1
- `slideUp` — translate Y from +60 to 0, fade in
- `slideDown` — translate Y from -60 to 0, fade in
- `slideLeft` — translate X from +120 to 0, fade in
- `slideRight` — translate X from -120 to 0, fade in
- `zoomIn` — scale 0.3→1, fade in (easeOutBack)
- `bounceIn` — scale 1.3→0.9→1 (springy overshoot)
- `rotateIn` — rotate -30°→0°, scale 0→1, fade in
- `flipH` — scaleX 0→1 with perspective-like squash
- `typewriter` — clip text to `Math.floor(t * text.length)` chars
- `glitch` — 3 random X/Y jitter frames, then settle at position
- `wave` — each character rendered at sinusoidal Y offset with phase per char

**7 exit animations:**
Applied when `outA < 1` (page transition). Use `exitT = 1 - outA`.
- `fadeOut` — alpha × outA
- `slideUp` — translate Y × -exitT * 80
- `slideDown` — translate Y × exitT * 80
- `slideLeft` — translate X × -exitT * 120
- `slideRight` — translate X × exitT * 120
- `zoomOut` — scale lerp(1, 0.2, exitT)
- `dissolve` — alpha drops but also slight scatter (random small offsets)

#### Card height computation
```ts
function computeCardH(numLines: number): number {
  if (numLines === 1) return 180;
  if (numLines === 2) return 220;
  return 268;  // existing default
}
```

---

### 4. Config UI — `src/components/StyleConfigPanel.tsx`

#### ChinesePanel additions (below existing controls):

**Layout section:**
```
[行数]  ○1  ○2  ●3
[列数]  ○1  ●2
```

**卡片文字行** section — show 1-3 accordion-style collapsible rows:
- Tab switcher: 行1 / 行2 / 行3 (+ add/remove buttons for 1-3 lines)
- For each line:
  - 内容来源: pill select `标题词 / 副标题 / 描述 / 自定义`
  - 自定义文字 (text input, visible when field='static')
  - 字号 (NumericSlider 16-100px)
  - 字体 (select: Noto/微软雅黑/楷体/STSong/sans-serif)
  - 颜色 (OptionalColorPicker)
  - 字重 (pill: 细/中/粗)
  - 入场动画 (pill grid 4×3 = 12 options)
  - 退场动画 (pill grid 4×2 = 7 options)

---

## Files Modified

| File | Change |
|------|--------|
| `src/types/video.ts` | Add `ChineseCardLineConfig`, `ChineseLineAnim`, `ChineseLineExitAnim`; extend `ChineseOptions` |
| `src/lib/engine/cards.ts` | Full rewrite of Chinese card path with configurable layout + per-line anim system |
| `src/lib/shapes/chinese.ts` | Add 20 new SVG shape generators |
| `src/lib/themes.ts` | Add new shape IDs to `CHINESE_SHAPES` |
| `src/components/StyleConfigPanel.tsx` | Extend `ChinesePanel` with layout + per-line config UI |

`src/lib/engine/helpers.ts` — no changes needed (reuse `clamp`, `easeOutBack`, `lerp`, `hex2rgba`, `roundRect`).

---

## Backward Compatibility

`ChineseOptions.cardLines` defaults to `undefined`, and the engine falls back to the existing 3-line behavior when `undefined`. Existing saved configs continue working without migration.

---

## Verification

1. Switch to Chinese style → open StyleConfigPanel → verify new sections appear
2. Change rows to 1, cols to 1 → canvas shows 1 card per page full-width
3. Add a line, set it to `static` → verify custom text appears on canvas
4. Cycle through all 12 enter animations → each should be visually distinct
5. Change to page 2+ → verify exit animations fire during transition
6. CoverPicker → scroll to see all 45 shapes
