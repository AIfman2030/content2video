# 网页生成器 · 实现计划

## 背景
构建一个"内容转动画视频"工具：用户粘贴文章 → DeepSeek AI 提炼要点 → 在 Canvas 上播放 9:16 竖屏动画 → 可录制下载为 .webm 视频。

---

## 文件结构

```
src/
├── pages/Index.tsx              ← 主页（3步流程）
├── types/video.ts               ← 共享类型定义
├── services/deepseek.ts         ← DeepSeek API 调用
├── components/
│   ├── StyleSelector.tsx        ← 步骤1：选风格
│   ├── ContentForm.tsx          ← 步骤2：输入文本+封面选择+高级选项
│   ├── CoverPicker.tsx          ← 24种封面选择器（按主题）
│   ├── ApiKeyInput.tsx          ← API Key 输入（localStorage 持久化）
│   └── VideoGenerator.tsx       ← 步骤3：Canvas 动画 + 录制引擎
└── lib/
    ├── themes.ts                ← 三主题配色/形状数据
    └── canvasEngine.ts          ← Canvas 动画时间轴引擎（纯函数）
```

---

## 关键设计决策

### API Key 方案
`VITE_*` 环境变量在 Enter 平台不支持，改为：
- 页面右上角「设置」图标 → 弹窗输入 DeepSeek API Key
- 存储到 `localStorage`
- 无 Key 时点击生成按钮给出明确提示

### Canvas 规格
- 实际分辨率：`1080 × 1920`（9:16）
- 预览 CSS 缩放：`340 × 604`，`transform: scale(340/1080)` + `transform-origin: top left`
- 外层容器固定 `340px × 604px` overflow hidden

---

## 三主题配置（`src/lib/themes.ts`）

### 中国风
- 背景渐变：`#0a0a14` → `#12121f` → `#1a1a2e`
- 强调色：朱红 `#e74c3c`，副色金 `#f5d87a`
- 24 种封面形状（SVG path，白色描边/无填充）分5组
- 5种配色方案（ink / cinnabar / jade / gold / porcelain）
- 高级选项：边框粗细 / 线条粗细（1-4px）
- 动画方式：网格卡片 / 单卡片

### 城市地标
- 背景渐变：`#0d1b2a` → `#1a2a4a` → `#0f1c30`
- 强调色：金黄 `#f5d87a`
- 24个城市天际线剪影（SVG，夜景风格）

### AI 科技
- 背景渐变：`#080c14` → `#0f172a` → `#1e1b4b`
- 强调色：紫色 `#a855f7`，副色青色 `#06b6d4`
- 24 种 AI logo 剪影（SVG 象征图形）
- 波浪式动感动画

---

## Canvas 动画时间轴（`src/lib/canvasEngine.ts`）

```
Phase 0  0~600ms         背景就绪：渐变 + 粒子 + 网格 + 光晕 fadeIn
Phase 1  600ms~titleEnd  标题打字机（每字 90ms）+ 光标闪烁
Phase 2  titleEnd~+600ms 标题上移（center → top 100px）+ 60px→40px 缩小
Phase 3  titleEnd+800ms  卡片依次入场（每张 400ms 动画，间隔 2400ms）
Phase 4  contentEnd      结尾页（遮罩 + 标题重现 + 品牌水印）

总时长 = 600 + titleLen×90 + 1800 + pts.length×2400 + 2500 ms
```

每帧用 `requestAnimationFrame` + `performance.now()` 驱动，`cancelAnimationFrame` 清理。

### 背景层（每帧重绘）
- `createLinearGradient` 3色渐变
- 中心 `createRadialGradient` 光晕（主题色 20% opacity）
- 粒子数组：30个，随机位置，带脉冲缩放（sin wave）
- 透视网格：横线间隔 80px，alpha 随 y 递减

### 标题渲染
- 打字机：slice(0, charCount)，60px，fontWeight 900，居中
- 光标：`|` 字符，500ms 闪烁
- 上移：`easeOutCubic` 曲线

### 卡片渲染（每张）
- 入场：从 x=1080 滑入，opacity 0→1，400ms
- 玻璃背景：`rgba(255,255,255,0.05)` fillRect
- 边框：主题色 1px strokeRect（圆角用 path）
- 左竖线：4px，主题色
- 序号圆：radius 40，主题色填充，白色数字 36px
- 小标题：38px bold 主题色
- 说明文字：26px，`rgba(255,255,255,0.7)`，自动换行（每行~22字）
- 装饰：右侧脉冲圆 + 旋转三角

### 结尾页
- `rgba(主题色, 0.15)` 遮罩 fadeIn
- 标题 52px 居中
- `— 小福AI自由 —` 24px，50% white
- `@小福AI自由` 右下角，主题色 25% opacity，20px

---

## 视频录制（VideoGenerator.tsx）

```ts
const stream = canvas.captureStream(30);
const recorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp9'  // fallback: 'video/webm'
});
// 100ms 间隔收集 chunks
// 动画结束后 recorder.stop()
// ondataavailable → blob → URL.createObjectURL → <a> download
```

---

## UI 流程

### 步骤1：StyleSelector
- 三张卡片：中国风 / 城市地标 / AI科技
- 预览色块 + 描述文字
- 选中态高亮

### 步骤2：ContentForm
- Textarea（20-8000字，实时字数统计）
- CoverPicker（4-6列网格，SVG 预览，随机按钮）
- 高级选项折叠（仅中国风：配色方案 + 边框/线条粗细）
- 「生成并录制视频 →」按钮（带 loading 状态）

### 步骤3：VideoGenerator 全屏遮罩
- 左侧：340×604 canvas 预览区
- 右侧：操作按钮
  - 「预览动画」（重新播放）
  - 「录制视频」→ 录制中显示进度条 → 「下载视频」
  - 「重新生成」返回步骤2
- 右上角 ✕ 返回首页

---

## DeepSeek 服务（`src/services/deepseek.ts`）

```ts
// POST https://api.deepseek.com/v1/chat/completions
// model: "deepseek-chat", temperature: 0.3, max_tokens: 1024
// System prompt: 返回严格 JSON { title, points[{label,short,desc,formatted}] }
// 错误处理：对应需求文档第六节所有场景
```

---

## 修改的文件
- `src/pages/Index.tsx` — 重写为3步流程入口
- `src/index.css` — 添加动画 keyframes（打字机光标、脉冲、滑入）
- `src/tailwind.config.ts` — 无需改动
- 新增：上述所有组件/服务/lib文件

---

## 验证
1. 输入少于20字 → 显示错误提示
2. 无 API Key → 跳转设置提示
3. 正常输入 → 打字机动画 → 标题上移 → 卡片依次入场 → 结尾水印
4. 点击「录制视频」→ 动画重播 → 自动下载 .webm
5. 三套主题各自验证配色/形状正确
