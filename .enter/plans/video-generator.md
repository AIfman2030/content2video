# Chinese Title Entrance Animation — "dropsFromSky" + Config

## Context
User wants the Chinese-style title entrance to be configurable. The new default animation should be "从天而降" (drops from sky): the title falls from off-screen, slams into the screen center with a big font + impact effects, then quickly flies up to the header position. The current typewriter animation should remain available as an option.

## Key findings from codebase
- `src/lib/engine/title.ts`: `drawTitle(ctx, elapsed, content, accent, accent2, style)` — handles all styles
  - Non-aitech: typewriter (chars appear via `visibleChars`), then lerp from centerY (CH*0.38) → headerY=78, font 108→72
  - `chineseOptions` is NOT currently passed to drawTitle (only `style` is passed)
- `src/lib/canvasEngine.ts` line 183: `drawTitle(ctx, elapsed, content, accent, accent2, style)` — needs 1 new arg
- `src/types/video.ts`: `ChineseOptions` has `titleFontSize?` (for cards), NOT for the title.ts font
- `src/lib/engine/helpers.ts`: has `easeOutBack`, `easeOutCubic`, `lerp`, `clamp` — reuse these

## Changes (4 files)

### 1. `src/types/video.ts`
Add to `ChineseOptions`:
```typescript
titleEntranceAnim?: 'dropsFromSky' | 'typewriter';  // default 'dropsFromSky'
```

### 2. `src/lib/engine/title.ts`
Add `chineseOptions?: ChineseOptions` as last parameter to `drawTitle`.

**New `dropsFromSky` branch** (only when `style === 'chinese'` and `titleEntranceAnim !== 'typewriter'`):

| Phase | te range | titleY | fontSize | Effect |
|-------|----------|--------|----------|--------|
| Drop  | 0 → 500ms | -300 → CH*0.48 via easeOutBack | 180 | — |
| Impact hold | 500 → 900ms | CH*0.48 | 180 | screen flash, expanding rings, glow |
| Fly up | 900 → 1500ms | CH*0.48 → 78 via t⁴ (fast end) | 180 → 72 | — |

- **Screen flash**: full-width semi-transparent accent overlay, alpha = `max(0, 1 - impactT*3) * 0.35`
- **Expanding rings**: 3 rings, `radius = impactT * 700`, `alpha = (1-impactT) * 0.7`
- During drop/impact: show full title text immediately (no typewriter) at CW/2 centered
- `easeInQuart` for fly-up: `t * t * t * t` (inline, no helper change)
- `easeOutBack` already in helpers.ts for drop landing bounce

### 3. `src/lib/canvasEngine.ts`
Line 183 — add `chineseOptions` to `drawTitle` call:
```typescript
drawTitle(ctx, elapsed, content, accent, accent2, style, chineseOptions);
```

### 4. `src/components/StyleConfigPanel.tsx`
In `ChinesePanel`, add at the top of the "主题 · 布局" section:

```tsx
<PillSelect
  label="标题入场动画"
  value={options.titleEntranceAnim ?? 'dropsFromSky'}
  onChange={v => upd({ titleEntranceAnim: v as 'dropsFromSky' | 'typewriter' })}
  options={[
    { value: 'dropsFromSky', label: '从天而降' },
    { value: 'typewriter',   label: '打字机' },
  ]}
/>
```

## Verification
- Open Chinese style → see title slam down from top, sit at center momentarily, fly up
- Change selector to "打字机" → original typewriter animation
- Change back to "从天而降" → new animation resumes
- Impact flash and rings visible during ~500-900ms after title entrance
