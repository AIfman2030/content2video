# 十二生肖风格优化

## 改动1：封面图案与文案主题呼应

**Problem**: `chinese-cover.ts` 用 `coverIndex % shapes.length` 无脑循环，与内容无关。

**Solution**: 在 `themes.ts` 新增 `pickChineseShapeByTitle(title, items, coverIndex)` — 关键词映射表（20条），命中则返回相应shape，未命中回退到 `coverIndex % shapes.length`。

关键词映射示意（完整约20条）：
- 情感/爱情/恋爱 → `lotus`
- 婚姻/夫妻/结婚 → `peony`  
- 工作/职场/事业 → `mountain`
- 钱/财/投资/理财 → `coin`
- 健康/养生/运动 → `taichi`
- 朋友/社交/人际 → `crane`
- 学习/读书/教育 → `bamboo`
- 孩子/亲子/家庭 → `pine`
- 成功/梦想/奋斗 → `starburst`
- 传统/文化/国学 → `dragon`
- 喜庆/节日/春节 → `lantern`
- 命运/禅/冥想 → `taichi`
- 女性/闺蜜 → `lotus`
- 运气/福气/招财 → `fu`
- 情绪/焦虑/内耗 → `taichi`
- ...

**Files**: `src/lib/themes.ts` 新增函数; `src/lib/cover/chinese-cover.ts` 使用该函数; `src/lib/canvasEngine.ts` 在加载shape时也使用该函数（动画中的shape同样内容相关）

---

## 改动2：动画布局 — 左文字右图案

**Problem**: 当前用2列×3行卡片网格，视觉杂乱。

**Solution**: 新建 `src/lib/engine/cards-chinese.ts`，每次只显示一个内容点的完整幻灯片，参考图布局：

```
┌─────────────────────────────────────────────┐
│  [title dim gray - top center]               │
│                                              │
│  ▏                           ┌─────────┐   │
│  1. 标签文字                  │         │   │
│     (大号 accent 色)         │ 动态图案 │   │
│                               │         │   │
│  短句内容                     │ (旋转/  │   │
│                               │  发光)  │   │
│  详细描述...                  │         │   │
│                               └─────────┘   │
│                  ● ○ ○ ○ ○ ○               │
└─────────────────────────────────────────────┘
```

- 左文字区: x从130开始，最大宽度1000px (约52%画面)
- 右图案: 中心 cx=1450, cy=540, 半径R=250
- 每帧一个内容点
- 入场: 文字从左滑入 + 淡入；图案从中心放大
- 退场: 文字淡出；只在切换到下一帧时触发
- 底部圆点导航指示器
- 图案装饰: 外发光环 + 旋转虚线圈 + shapeImg缓慢旋转

**Timing**:
- `CHINESE_SLIDE_DUR = 2400ms` per slide
- 在 `helpers.ts` 新增 `chineseSlideDuration(pts)` = `T.cardBase + pts * CHINESE_SLIDE_DUR + T.cardReadDelay + T.outroDur`
- `canvasEngine.ts` 对 Chinese 样式使用此新函数

**Files modified**:
1. `src/lib/themes.ts` — 新增 `pickChineseShapeByTitle`
2. `src/lib/cover/chinese-cover.ts` — 使用关键词picker
3. `src/lib/engine/cards-chinese.ts` (新建) — 左右布局
4. `src/lib/engine/cards.ts` — Chinese style → 调用 `drawChineseCards`
5. `src/lib/engine/helpers.ts` — 新增 `CHINESE_SLIDE_DUR` 和 `chineseSlideDuration`
6. `src/lib/canvasEngine.ts` — shape选择 + duration计算
