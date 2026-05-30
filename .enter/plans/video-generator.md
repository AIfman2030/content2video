# AI 科技风格大幅升级计划

## Context
用户要求将 AI 科技风格重构为 5 个连续动画阶段，参考答案确认：
- 激光：接力式（从上一张卡片位置移向下一张）
- 左侧布局：仅小关键词标签（无卡片外框）
- 宫格数量：按内容数量自动决定（n 个内容 = n 格）
- 右侧说明出现：逐条依次出现（打字机/淡入），每条配对左侧关键词

---

## 五阶段动画设计

```
Phase 1  T.cardBase → +n×KEYWORD_SLOT
         关键词逐个出现，每次出现伴随激光接力

Phase 2  → +n×SHORT_SLOT
         所有关键词可见基础上，短句逐个出现，激光接力

Phase 3  → +SLIDE_DUR (~700ms)
         原始卡片整体滑向左侧 → 变身为小关键词标签列

Phase 4  → +n×DESC_SLOT
         右侧对应位置逐条出现说明文字（打字机/淡入）

Phase 5  → +GRID_APPEAR + GRID_HOLD + EXPLOSION (~3500ms)
         宫格收尾：关键词+短句按 n 格排列 → 爆炸消失
```

**Timing constants（新增到 helpers.ts）**:
```ts
AITECH_KEYWORD_SLOT = 1100   // ms
AITECH_SHORT_SLOT   =  900
AITECH_SLIDE_DUR    =  700
AITECH_DESC_SLOT    =  800
AITECH_GRID_APPEAR  = 1000   // stagger per cell: 80ms
AITECH_GRID_HOLD    = 1500
AITECH_EXPLODE_DUR  = 1000
```

n 项内容总时长 ≈ `T.cardBase + n×1100 + n×900 + 700 + n×800 + 3500`

---

## Phase 1 — 关键词阶段

每张卡片 (`KEYWORD_SLOT=1100ms` 间隔) 依次出现：
- 卡片 i 出现时：激光束从卡片 i-1 坐标飞向卡片 i 坐标（接力）
- 激光视觉：一条细亮线（宽 3px，accent 颜色），持续 300ms，有拖尾消散
- 卡片样式：圆角矩形，半透明背景，label 字段大字 + 上方序号

### 激光参数
```ts
const laserDur = 320;  // ms
// 从 prevCX,prevCY 到 curCX,curCY
// 用 lerp(t) 画扫线，t=0→1 过 laserDur
// t>0.5 时目标位置出现卡片 flash
```

---

## Phase 2 — 短句阶段

Phase2Start = `T.cardBase + n × KEYWORD_SLOT`

- 所有关键词卡片保持可见（不消失）
- 逐个在对应卡片上补充 short 文字（滑入或淡入）
- 激光同样接力

---

## Phase 3 — 滑向左侧

Phase3Start = Phase2Start + `n × SHORT_SLOT`

动画 (~700ms)：
- 所有卡片同时飞向目标位置（左侧标签列）
- 目标格式：紧凑的竖向小标签
  - 左侧 x = 120px（标签左边缘）
  - 每个标签高 = 64px，y 均匀分布
  - 标签宽 = 300px（可配置 `leftColumnWidth`）
  - 仅显示 label 文字（no card frame，背景只剩细左边框竖线 + 半透明 pill）
- 使用 `easeOutCubic` 插值
- 滑动时可加 motion blur（globalAlpha 残影）

---

## Phase 4 — 描述展开

Phase4Start = Phase3Start + `SLIDE_DUR`

- 右侧 desc 区域：`x = 460px ... x = CW-80px`
- 每条 desc 在 `DESC_SLOT` 间隔后出现，y 对齐对应左侧标签
- 出现效果（可配置 `descEnterEffect`）：
  - `typewriter`：逐字打出，CHAR_MS=40ms
  - `fadeIn`：easeOutCubic α 淡入
  - `slideRight`：从右侧 +60px 滑入
- desc 文字颜色、字号已有 `descColor`/`descFontSize`

---

## Phase 5 — 宫格 + 爆炸收尾

Phase5Start = Phase4Start + `n × DESC_SLOT`

### 宫格计算（自动）
```ts
function autoCols(n: number) {
  if (n <= 4) return 2;       // 2×2 / 1×n
  if (n === 5) return 3;      // 3+2 bento
  if (n <= 6) return 3;       // 3×2
  if (n <= 8) return 4;       // 4×2
  if (n === 9) return 3;      // 3×3
  if (n <= 10) return 5;      // 5×2
  return 4;                    // 4×3 (12)
}
```

### 宫格布局
- 顶部：标题（从顶部 header 下移到居中大字，或保持顶部 header）
- 网格区域：`y=220px → CH-80px`，自动计算 cellW/cellH
- 每格内容：keyword (大字) + short (小字)
- 每格以 `gridCellEnterEffect`（zoomIn/flipIn/slideUp/fadeIn）stagger 出现（80ms 间距）
- 保持 `GRID_HOLD` ms

### 爆炸消失（`gridExplosionStyle`）
- `burst`：每格向随机方向飞出 + 旋转，持续 EXPLOSION_DUR
- `scatter`：从中心散开
- `implode`：向中心收缩消失

---

## 新增 AItechOptions 字段

```ts
// Phase 2→3 slide
slideEffect?: 'slide' | 'wipe' | 'scale';  // default 'slide'

// Phase 3 left column
leftKeywordFontSize?: number;   // default 34
leftKeywordColor?: string;      // default = accent

// Phase 4 desc
descEnterEffect?: 'typewriter' | 'fadeIn' | 'slideRight'; // default 'typewriter'
// descFontSize, descColor already exist

// Phase 5 grid
gridCellEnterEffect?: 'zoomIn' | 'flipIn' | 'slideUp' | 'fadeIn'; // default 'zoomIn'
gridExplosionStyle?: 'burst' | 'scatter' | 'implode'; // default 'burst'
gridKeywordFontSize?: number;   // default 80
gridShortFontSize?: number;     // default 42
gridKeywordColor?: string;      // default = labelColor (gold)
gridShortColor?: string;        // default = shortColor (white)
```

---

## Files to Modify

### 1. `src/types/video.ts`
- Add new optional fields to `AItechOptions` (listed above)

### 2. `src/lib/engine/helpers.ts`
- Add `aiTechTotalDuration(n: number): number` function
- Export `AITECH_KEYWORD_SLOT`, `AITECH_SHORT_SLOT`, `AITECH_SLIDE_DUR`, `AITECH_DESC_SLOT`

### 3. `src/lib/engine/cards-aitech.ts`
- **Complete rewrite** of `drawAITechCards()`
- 5 phase dispatch based on elapsed vs phase boundaries
- Laser beam helper: `drawLaser(ctx, x0,y0, x1,y1, progress, accent)`
- Grid layout helper: `autoCols(n)`, `computeGridCells(n, cols)`
- Left column layout: `computeLeftLabels(n)` → array of {x,y}
- Phase 3 slide tween: all cards lerp from radial positions to label positions
- Phase 5 explosion per-cell

### 4. `src/lib/canvasEngine.ts`
- Import `aiTechTotalDuration` from helpers
- In `render()`: use `aiTechTotalDuration` for aitech outro timing
- In `createAnimEngine`: use correct total ms for aitech

### 5. `src/components/StyleConfigPanel.tsx`
- Expand `AItechPanel` with new config sections:
  - **滑动效果** (slideEffect pill)
  - **左侧关键词** (leftKeywordFontSize slider + leftKeywordColor picker)
  - **说明文字出现效果** (descEnterEffect pill)
  - **宫格收尾** (gridCellEnterEffect pill + gridExplosionStyle pill)
  - **宫格字号/颜色** (gridKeywordFontSize, gridShortFontSize, gridKeywordColor, gridShortColor)

---

## Card Position Strategy

- Phase 1–2: Use the **existing radial layout** from current `cards-aitech.ts` (cards arranged in a circle around center polygon)
- Phase 3 target positions: left column, compact labels
- Phase 5: grid cells at center of screen

Existing radial math:
```ts
const angle = (i / displayN) * Math.PI * 2 - Math.PI / 2;
const cardCX = CX + Math.cos(angle) * CARD_RADIUS;
const cardCY = CY + Math.sin(angle) * CARD_RADIUS;
```
Reuse this for phases 1–2.

---

## Laser Implementation Detail

```ts
function drawLaser(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number,   // source (prev card center)
  x1: number, y1: number,   // dest (current card center)
  t: number,                // 0→1 progress
  accent: string,
) {
  // Leading tip moves: tip = lerp(src→dst, t*1.3).clamp(0,1)
  // Tail fades: tail = max(0, t*1.3 - 1) [no tail on first pass]
  // Draw from tail to tip using gradient strokeStyle
  // Glow: shadowBlur=20, shadowColor=accent
  // At t>0.7 draw secondary thinner fading trail
}
```

---

## Key Reuse
- `hex2rgba`, `clamp`, `lerp`, `easeOutCubic`, `easeOutBack` from `helpers.ts`
- `wrapText` from helpers
- `drawPolygon`, `drawStar` for center polygon
- Existing `initAIEffects` / `drawAIBg` — **unchanged** (background layer stays)
- Existing card geometry constants: `CARD_RADIUS=370`, `POLY_R`, scale formula

---

## Verification
1. Open aitech style with 6 content points
2. Observe: keywords 1→6 appear in radial layout with laser relay
3. Observe: short sentences appear on each card with laser
4. Observe: all cards slide to left column labels
5. Observe: right side descriptions appear one by one (typewriter)
6. Observe: 6-cell grid appears, then explosion outro
7. Toggle `descEnterEffect` in panel — verify change
8. Toggle `gridExplosionStyle` — verify burst/scatter/implode variations
