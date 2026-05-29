# Plan: Unified Title System — All 4 Canvas Styles

## Context
Replace the per-style title rendering logic with a single configurable `TitleOptions` system.
Reference image: two-line title (small line 1 fades in with scene, big line 2 crashes from sky with white smoke explosion), subtitle text below, then the whole title flies to top-center.

---

## 1. New Types — `src/types/video.ts`

```typescript
export type TitleLineEnterAnim = 'withScene' | 'dropsFromSky' | 'slideUp' | 'fadeIn' | 'typewriter';

export interface TitleLineConfig {
  text: string;       // '' = auto-split from content.title by line index
  fontSize: number;
  fontFamily: string; // '' = "Noto Sans SC"
  fontWeight: 400 | 700 | 900;
  color: string;      // '' = '#ffffff'
  colorEnd: string;   // '' = solid (no gradient); non-empty = horizontal gradient
  enterAnim: TitleLineEnterAnim;
}

export interface TitleOptions {
  lines: TitleLineConfig[];     // 1-3 items
  subtitleText: string;         // custom small text below title; '' = hidden
  subtitleColor: string;        // default 'rgba(180,200,255,0.75)'
  subtitleFontSize: number;     // default 40
  headerFontSize: number;       // font size after fly-up settle (default 60)
}

export const DEFAULT_TITLE_LINE_1: TitleLineConfig = {
  text: '', fontSize: 88, fontFamily: '', fontWeight: 700,
  color: '#ffffff', colorEnd: '', enterAnim: 'withScene',
};
export const DEFAULT_TITLE_LINE_2: TitleLineConfig = {
  text: '', fontSize: 172, fontFamily: '', fontWeight: 900,
  color: '#ffffff', colorEnd: '#3b9ef5', enterAnim: 'dropsFromSky',
};
export const DEFAULT_TITLE_OPTIONS: TitleOptions = {
  lines: [DEFAULT_TITLE_LINE_1, DEFAULT_TITLE_LINE_2],
  subtitleText: '',
  subtitleColor: 'rgba(180,200,255,0.75)',
  subtitleFontSize: 40,
  headerFontSize: 60,
};
```

---

## 2. Rewrite `src/lib/engine/title.ts`

### Timing constants (absolute ms from elapsed=0)
```
T_L1_START    =    0   // line 1 (withScene) begins fading in
T_L2_START    =  700   // line 2 (dropsFromSky) begins crash
T_L2_LAND     = 1200   // line 2 hits position → smoke burst triggers
T_SUB_IN      = 1300   // subtitle fades in
T_FLY_START   = 1800   // title begins flying to header
T_FLY_END     = 2400   // title settled at header, subtitle fully gone
```
`T.cardBase = 2800` (unchanged — cards still start at 2800ms)

### Auto-split logic
```typescript
function resolveLineText(cfg: TitleLineConfig, i: number, title: string): string {
  if (cfg.text) return cfg.text;
  const mid = Math.ceil(title.length / 2);
  if (i === 0) return title.slice(0, mid);
  if (i === 1) return title.slice(mid);
  return title; // line 3: full title (unusual case)
}
```

### Animation per line
Each line has a `t0` (enter start time):
- `withScene` → `t0 = T_L1_START = 0`
- `dropsFromSky` → `t0 = T_L2_START = 700`, crash from Y=-300 to centerY
- `fadeIn` → staggered by line index × 300ms after T_L1_START
- `slideUp` → staggered similarly
- `typewriter` → staggered similarly

### Smoke particle burst (white)
Pre-generate 42 smoke particles when module loads (seeded). On each frame during smoke phase (T_L2_LAND → T_L2_LAND+900ms), render them:
```typescript
interface SmokeP { x0: number; y0: number; vx: number; vy: number; size: number; baseAlpha: number; }

// Generated at module level (seeded deterministic):
const SMOKE_PARTICLES: SmokeP[] = Array.from({length: 42}, (_, i) => {
  const seed = i * 2.3;
  const a = ((Math.sin(seed) * 0.5 + 0.5) * Math.PI); // upper semicircle
  const speed = 3 + (Math.cos(seed * 1.7) * 0.5 + 0.5) * 8;
  return { x0: (Math.sin(seed*3)*0.5+0.5-0.5)*400, y0: 0,
           vx: Math.cos(a)*speed, vy: -Math.abs(Math.sin(a)*speed)*1.8,
           size: 6 + (Math.sin(seed*2)*0.5+0.5)*20, baseAlpha: 0.35 + (Math.cos(seed)*0.5+0.5)*0.55 };
});

function drawSmoke(ctx, cx, cy, smokeT) { // smokeT: 0→1
  for (const p of SMOKE_PARTICLES) {
    const t = smokeT;
    const px = cx + p.x0 + p.vx * t * 120;
    const py = cy + p.y0 + p.vy * t * 120 + 200 * t*t; // gravity
    const alpha = p.baseAlpha * (1 - t*t);
    const r = p.size * (1 + t * 2);
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.shadowColor = 'rgba(255,255,255,0.6)'; ctx.shadowBlur = r * 0.8;
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}
```

### Gradient text utility
```typescript
function applyTextGradient(ctx, cfg, x, y, width) {
  if (cfg.colorEnd && cfg.colorEnd !== cfg.color) {
    const g = ctx.createLinearGradient(x - width/2, y, x + width/2, y);
    g.addColorStop(0, cfg.color || '#fff');
    g.addColorStop(1, cfg.colorEnd);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = cfg.color || '#fff';
  }
}
```

### Fly-up: merge all lines into header
During T_FLY_START → T_FLY_END, the multi-line display transitions to a single merged string at headerY:
```
merged = lines.map(resolveLineText).join('')
targetX = CW/2 (center)
targetY = 78  (header)
targetFontSize = titleOptions.headerFontSize (e.g. 60)
```
Each line's Y position lerps from its settled Y → headerY, its font size shrinks to `headerFontSize`. Alpha stays 1.

### Subtitle text
- Appears at T_SUB_IN with `fadeIn` (300ms)
- Positioned below the lowest line (typically below line 2)
- During T_FLY_START → T_FLY_START+400ms: explode-dissolve (translate out + shockwave + fade)

### `drawTitle` signature
```typescript
export function drawTitle(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  content: GeneratedContent,
  accent: string,
  accent2: string,
  style: StyleType,
  titleOptions?: TitleOptions,
)
```
The old `chineseOptions` param is removed — all configuration is now in `TitleOptions`.

---

## 3. `src/lib/engine/nature-scene.ts`

Remove lines that render the title (currently around line 149-150):
```typescript
// DELETE these lines:
ctx.font = `800 ${titleFsz}px ${ff}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
ctx.shadowColor = accent; ctx.shadowBlur = 20; ctx.fillStyle = titleCol; ctx.fillText(nc.title, CW / 2, 30);
```
The unified `drawTitle` will handle the nature title instead.

Also remove `titleFsz`, `titleCol` variables if no longer needed.

---

## 4. `src/lib/canvasEngine.ts`

1. Add `titleOptions?: TitleOptions` parameter to `createAnimEngine`
2. Import `TitleOptions`, `DEFAULT_TITLE_OPTIONS` from types
3. After `drawNatureScene(...)`, add: `drawTitle(ctx, elapsed, { title: natureContent.title, points: [] }, accent, accent2, 'nature', titleOptions)`
4. Change the existing `drawTitle` call to pass `titleOptions` instead of `chineseOptions`:
   ```typescript
   drawTitle(ctx, elapsed, content, accent, accent2, style, titleOptions);
   ```

---

## 5. `src/components/StyleConfigPanel.tsx`

### New Props
```typescript
titleOptions: TitleOptions;
onTitleOptionsChange: (v: TitleOptions) => void;
```

### New `TitlePanel` component
A shared panel shown for all 4 canvas styles (chinese, city, aitech, nature), with:

**Lines section** (1-3 configurable lines):
- "添加行 / 删除行" buttons
- Per line:
  - 自定义文字（空=自动拆分）: text input
  - 字号: NumericSlider 40-240
  - 字重: 细/中/粗 pills
  - 字体: dropdown (Noto/雅黑/楷体/宋体)
  - 颜色: OptionalColorPicker
  - 渐变结束色: OptionalColorPicker (label: "渐变色 →")
  - 入场动画: PillSelect [withScene/dropsFromSky/slideUp/fadeIn/typewriter]

**副标题 section**:
- 自定义小字: TextInput
- 颜色: OptionalColorPicker
- 字号: NumericSlider 20-80

**标题落版 section**:
- 落版字号 (headerFontSize): NumericSlider 36-100

### Where to show
In `StyleConfigPanel`'s main switch statement, ALL 4 styles (chinese, city, aitech, nature) render `<TitlePanel>` at the top (before style-specific settings).

---

## 6. Wire-up files

### `src/components/StudioCanvas.tsx`
Add `titleOptions?: TitleOptions` prop, pass to `createAnimEngine`.

### `src/components/VideoGenerator.tsx`
Add `titleOptions?: TitleOptions` prop, pass to `createAnimEngine`.

### `src/pages/Index.tsx`
```typescript
const [titleOptions, setTitleOptions] = useState<TitleOptions>(DEFAULT_TITLE_OPTIONS);
```
Pass `titleOptions` + `onTitleOptionsChange={setTitleOptions}` to `StyleConfigPanel`, `StudioCanvas`, `VideoGenerator`.

---

## 7. Backward compatibility

- `ChineseOptions.titleEntranceAnim` / `titleFontSize` / `titleColor` etc. are kept in the type for reading legacy state, but are **no longer used** in `title.ts` (superseded by `TitleOptions`).
- `NatureOptions.titleFontSize` / `titleColor` / `fontFamily` fields kept but ignored for title rendering.

---

## Files to modify (8 total)
1. `src/types/video.ts` — add TitleOptions types + defaults
2. `src/lib/engine/title.ts` — complete rewrite
3. `src/lib/engine/nature-scene.ts` — remove title rendering (2 lines)
4. `src/lib/canvasEngine.ts` — add titleOptions param, call drawTitle for nature too
5. `src/components/StyleConfigPanel.tsx` — add TitlePanel + Props
6. `src/components/StudioCanvas.tsx` — thread titleOptions through
7. `src/components/VideoGenerator.tsx` — thread titleOptions through
8. `src/pages/Index.tsx` — add titleOptions state + wire

---

## Verification
- Chinese style: default 2-line title, line 1 fades with black bg, line 2 crashes at ~700ms with white smoke + shockwave, subtitle text appears below, then all flies to header at ~1800ms, cards appear at 2800ms as before
- City / AItech / Nature: same title behavior
- Gradient: Line 2 default `colorEnd='#3b9ef5'` gives white→blue gradient visible during impact phase
- Config panel: TitlePanel appears at top for all 4 canvas styles
- Adding/removing lines (1-3 supported)
- `text=''` auto-splits: line[0]=first half, line[1]=second half of `content.title`
