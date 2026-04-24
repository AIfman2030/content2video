# Plan: Add 山川河海 (Nature Comparison) Style

## Overview
A 4th video style with a unique two-circle comparison layout:
- Two large circles side by side (canvas 1920×1080)
- Each circle has a Chinese scenic spot silhouette in the center
- Comparison words fill each circle, appearing pairwise (left[i] + right[i] simultaneously)
- Background: ink-wash with distant mountain mist

---

## Content Data Model

### New type: `NatureContent`
```ts
export interface NatureContent {
  title: string;          // "穷人和富人的区别是什么"
  leftTitle: string;      // "穷人在想"
  rightTitle: string;     // "富人在研究什么"
  leftItems: string[];    // up to 12 short keywords
  rightItems: string[];   // up to 12 short keywords
}
```

### New AI prompt
`extractNatureContent(text)` in `deepseek.ts` uses a different system prompt asking for comparison format: `{ title, leftTitle, rightTitle, leftItems[≤10], rightItems[≤10] }`.

---

## Canvas Layout (1920×1080)

```
[                   标题文字                     ]   y=40-110
[  "左侧标题"  ]          [  "右侧标题"  ]         y=110-185
[                                                ]
[    LEFT CIRCLE (r=340)  |  RIGHT CIRCLE (r=340) ]  center y=560
[  lcx=480, lcy=560       |  rcx=1440, rcy=560   ]
[  scenic spot + words    |  scenic spot + words  ]
```

### Animation sequence
- t=0-600: ink-wash BG fade in, faint mist mountain silhouette at bottom
- t=600-1200: title brushstroke reveal
- t=1200-1800: circle outlines draw (ink stroke, simultaneous left+right)
- t=1800-2400: header badges ("左标题" + "右标题") slide in
- t=2400-3000: scenic spot silhouettes fade into circle centers
- t=3000+: words appear pairwise every 500ms (left[i] + right[i] simultaneously)
  - Word anim: scale 0→1.05→1, fade 0→1, slight upward drift
- After all words: gentle floating on all words
- Final hold: ~2s

**Total**: 3000 + N_pairs * 500 + 2000ms (N_pairs ≤ 10)

---

## Word Placement (No Overlap)

Pre-computed concentric ring positions (seeded random to shuffle):
- Ring 1 (r=145): 5 slots at 0°, 72°, 144°, 216°, 288° 
- Ring 2 (r=205): 7 slots at 25°, 76.4°, 127.8°, 179.2°, 230.6°, 282°, 333.4°
- Ring 3 (r=268): 8 slots at 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°
Total: 20 slots, enough for ≤ 12 words per circle.

Font size: 36-52px (larger for shorter words, smaller for longer).

---

## Scenic Spot Pairs (6 pairs selectable via CoverPicker)

| Index | Left | Right |
|-------|------|-------|
| 0 | 黄山 | 西湖 |
| 1 | 泰山 | 九寨沟 |
| 2 | 张家界 | 桂林 |
| 3 | 峨眉山 | 三峡 |
| 4 | 长城 | 雪山 |
| 5 | 武夷山 | 青海湖 |

Each is drawn as simple canvas-path silhouettes (mountain peaks, karst pillars, water, pagoda outlines etc.) inside the circle center (radius ~90px). Defined in `nature-spots.ts`.

---

## Files to Create / Modify

### 1. `src/types/video.ts` (+14 lines)
- Add `NatureContent` interface
- Add `'nature'` to `StyleType`
- Add `natureContent?: NatureContent` to `GeneratorConfig`

### 2. `src/services/deepseek.ts` (+38 lines, total ~127)
Add:
```ts
const NATURE_PROMPT = `...JSON { title, leftTitle, rightTitle, leftItems[], rightItems[] }...`;
export async function extractNatureContent(text): Promise<NatureContent>
```

### 3. `src/lib/themes.ts` (+30 lines, total ~181)
- Add nature theme to `getThemeConfig` (dark ink BG, mountain green accent)
- Add `NATURE_PAIRS: ShapeItem[]` (6 entries, one per pair, label="黄山|西湖" etc.)
- Update `getShapeList` for nature

### 4. `src/lib/engine/nature-spots.ts` (NEW, ~190 lines)
Canvas drawing functions for 12 scenic spots:
```ts
export type SpotDrawFn = (ctx, cx, cy, r, color) => void;
export const SPOT_DRAW_FNS: { left: SpotDrawFn, right: SpotDrawFn }[] = [ ...6 pairs... ]
```
Each function: ~12 lines of canvas paths (peaks, curves, tree outlines, water lines).

### 5. `src/lib/engine/nature-scene.ts` (NEW, ~250 lines)
Main nature animation: circle drawing, word layout, scenic spot rendering, word animation.
```ts
export function drawNatureScene(
  ctx, elapsed, natureContent, accent, accent2, coverIndex, rand
): void
```

### 6. `src/lib/canvasEngine.ts` (+15 lines, total ~129)
- Add `natureContent?: NatureContent` to `createAnimEngine` params
- For `style === 'nature'`: skip `drawTitle`/`drawCards`/`drawOutro`, call `drawNatureScene` instead
- Nature total duration: `3000 + leftItems.length * 500 + 2000`

### 7. `src/components/StyleSelector.tsx` (+9 lines, total ~91)
Add nature style entry:
```ts
{ key: 'nature', name: '山川河海', desc: '天地自然 · 对比之道', tag: '6处名山胜水', 
  bg: 'linear-gradient(135deg,#0a1a0f,#1a3020)', accent: '#4ade80' }
```

### 8. `src/components/CoverPicker.tsx` (modify, ~140 lines)
- Update `ACCENT_BY_STYLE` to include nature
- For `style === 'nature'`: show 6 pair buttons with text ("黄山 | 西湖") instead of SVG thumbnails
- `getShapeList('nature')` returns 6 items with labels like "黄山 | 西湖"

### 9. `src/components/ContentForm.tsx` (minor, +2 lines)
- No AI shape selector for nature (style-specific options are minimal)
- The ContentForm already handles unknown styles gracefully

### 10. `src/pages/Index.tsx` (~260 lines)
- Add `natureContent: NatureContent | null` state
- In `handleGenerate`: if `style === 'nature'`, call `extractNatureContent`, set both states
- Update `BG_BY_STYLE`, `ACCENT_BY_STYLE` for nature
- Pass `natureContent` to VideoGenerator
- Video step condition: `step === 'video' && (content || natureContent) && config`

### 11. `src/components/VideoGenerator.tsx` (+10 lines, total ~286)
- Add `natureContent?: NatureContent` prop
- Pass to `createAnimEngine`
- For nature style, `content` can be a minimal `{ title: '', points: [] }`

---

## Verification
1. Nature style appears in StyleSelector
2. CoverPicker shows 6 pair options for nature
3. Extracting content with nature style uses comparison prompt
4. Two circles appear with scenic spots in center
5. Words appear pairwise (left+right simultaneously, no overlap)
6. Total animation length ~8-10s for typical content
7. All new files ≤ 280 lines
