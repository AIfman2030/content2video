# Phase 1: Studio Layout + Real-time Preview + Timeline Scrubber

## Context
Currently the app uses a 3-step sequential flow (style → form → video overlay). The user wants a Studio layout where config and live canvas preview coexist side-by-side, with a timeline scrubber to seek any frame instantly.

---

## Layout

```
┌─────────────── header ──────────────────────────────────────┐
│ [logo] 小福·视频生成器                      [API Key] [录制] │
├─────────────────────────────────────────────────────────────┤
│  LEFT PANEL (360px, scrollable)  │  RIGHT PANEL (flex-1)    │
│                                  │                           │
│  ① 风格选择 (compact 2-col grid)  │  ┌── canvas 9:16 ──┐    │
│  ② 内容配置 (ContentForm)         │  │  animation       │    │
│     · 文字输入                    │  │  (live preview)  │    │
│     · 封面/高级选项               │  └──────────────────┘    │
│  ③ [生成] button                  │                           │
│                                  │  [◀] [▶/⏸] [▶▶] 0:03   │
│                                  │  ═══════●══════ 0:14      │
│                                  │  [⏺ 录制视频]             │
└──────────────────────────────────┴───────────────────────────┘
```

Mobile (<768px): canvas top, config panel below (scrollable).

---

## Files to Change

### 1. `src/lib/canvasEngine.ts`
- Add `seekTo(ms: number): void` to `AnimEngine` interface
  - Implementation: `stop(); render(ms); running=false;`
- Update `restart(from?: number, cb?)`:
  - `startTime = performance.now() - (from ?? 0)` — lets playback resume from any point

### 2. NEW `src/components/StudioCanvas.tsx`
Self-contained canvas preview component (manages its own engine instance):
- Props: `content, style, coverIndex, chineseOptions, aiOptions, natureContent, accent`
- Internal: `canvasRef`, `engineRef`, `isReady`, `playing`, `currentMs`, `totalMs`
- Re-creates engine via `createAnimEngine` whenever `content` changes (using `useEffect([content])`)
- Canvas always in DOM (no visibility toggle)
- Timeline RAF: `requestAnimationFrame` loop that reads `elapsed = now - startTime` to update `currentMs` slider WITHOUT driving animation (engine drives itself)
- `seekTo(ms)`: engine.seekTo(ms); setCurrentMs(ms); setPlaying(false)
- Play/Pause: toggle `playing` state → engine.start() / engine.stop()
- Auto-play when engine ready

Timeline controls:
```tsx
<input type="range" min={0} max={totalMs} step={100} value={currentMs}
  onChange={e => seekTo(Number(e.target.value))} />
<span>{fmt(currentMs)} / {fmt(totalMs)}</span>
```

### 3. `src/pages/Index.tsx`
Replace 3-step flow with Studio layout:
- Remove `step` state, `Step` type, stepper indicator
- Keep: `style`, `content`, `natureContent`, `config`, `isLoading`, `error`, `apiKeyOpen`
- Layout: `flex h-screen` with:
  - `<aside>` (360px, overflow-y-auto): StyleSelector + ContentForm + generate button
  - `<main>` (flex-1): StudioCanvas + record button
- `handleGenerate` → same AI logic, just sets content/config (no `setStep('video')`)
- "录制视频" button in header or right panel bottom → opens `VideoGenerator` overlay
- VideoGenerator keeps working as-is (receives `content, style, ...config`)

### 4. `src/components/StyleSelector.tsx`
Add compact mode for left panel:
- New prop: `compact?: boolean`
- When compact: render as 2-column grid with smaller cards (no tag badge, smaller padding)

### 5. `src/components/VideoGenerator.tsx`
No changes needed — still used as a full-screen overlay for recording.

---

## Key Technical Details

### seekTo + currentMs tracking
The engine loop calls `tick()` → `render(elapsed)` → `rAF`. To track current position for the slider:
- StudioCanvas starts its own `syncRaf` loop alongside the engine
- `syncRaf` just reads `engine.getElapsed()` (new getter) and calls `setCurrentMs`
- Engine needs `getElapsed(): number` → `running ? performance.now() - startTime : lastElapsed`

### Canvas Sizing
Right panel canvas maintains 9:16 ratio:
```tsx
// CSS: height fills available space, width computed from aspect ratio
<div style={{ aspectRatio: '9/16', height: '100%', maxHeight: 'calc(100vh - 120px)' }}>
  <canvas ... style={{ width: '100%', height: '100%' }} />
</div>
```

### Mobile Responsive
```css
/* < 768px: stack vertically */
@media (max-width: 767px) {
  aside: width 100%, height auto
  main: canvas compact (max-h 50vh)
}
```

---

## Verification
1. Studio layout renders: left config + right canvas on desktop
2. Selecting a style updates the accent color across both panels
3. Generating content → canvas auto-plays the animation
4. Timeline scrubber drag → animation pauses, frame updates live
5. Play button → resumes from scrubber position
6. "录制视频" → opens VideoGenerator overlay (existing flow)
7. Mobile: stacked layout, canvas visible above config
