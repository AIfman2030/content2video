# 漫画字幕 TTS 升级：阿里百炼 CosyVoice + 完整音色配置

## 背景

技能路径 `~/.qclaw/skills/tts-aifman/` 不存在，基于用户需求直接实现：
- 切换 TTS 服务商：ByteDance Ark → 阿里百炼 DashScope CosyVoice
- 阿里百炼 API Key 在 UI 界面配置（不写入代码）
- 预设音色列表 + 支持自定义音色 ID
- 语速（语速倍率）可调
- 音量可调（FFmpeg 混流时应用）

---

## API 技术方案

### 阿里百炼 TTS（DashScope OpenAI 兼容接口）

```
POST https://dashscope.aliyuncs.com/compatible-mode/v1/audio/speech
Authorization: Bearer {API_KEY}
Content-Type: application/json

Body:
{
  "model": "cosyvoice-v1",
  "input": "文字内容",
  "voice": "longxiaochun",
  "response_format": "mp3",
  "speed": 1.0          // 0.5 ~ 2.0
}
```

- **HTTP REST**，无 WebSocket（从 Edge Function 调用无 CORS 问题）
- 返回直接二进制 MP3 数据（同 OpenAI TTS 格式）
- 保留 Google TTS 作为 fallback（API Key 无效时）

### CosyVoice 预设音色（`cosyvoice-v1`）

| ID | 说明 |
|---|---|
| `longxiaochun` | 龙小淳（女·温暖亲切） |
| `longwan` | 龙婉（女·温柔知性） |
| `longcheng` | 龙橙（男·磁性低沉） |
| `longshu` | 龙书（男·沉稳播报） |
| `longfei` | 龙飞（男·活泼热情） |

用户还可以手动输入任意音色 ID（如 `longxiaobai` 等）

---

## 文件变更清单

### 1. `src/types/video.ts`
- 在 `MangaOptions` 中新增字段：
  - `ttsRate: number` — 语速，默认 `1.0`，范围 `0.5 ~ 2.0`
  - `ttsVolume: number` — 音量，默认 `80`，范围 `0 ~ 100`
  - `ttsCustomVoice: string` — 自定义音色 ID，非空时覆盖 `ttsVoice`
- 更新 `DEFAULT_MANGA_OPTIONS` 补充三个默认值

### 2. `src/services/tts.ts`
- 新增 Bailian Key 存储（`bailian_api_key` key in localStorage）：
  - `getStoredBailianKey() / setStoredBailianKey()`
- 替换 `TTS_VOICES` 为 5 个 CosyVoice 音色
- 更新 `DEFAULT_TTS_VOICE = 'longxiaochun'`
- `synthesize()` 新增可选参数 `{ rate?: number }` 并透传到 Edge Function

### 3. `supabase/functions/manga-tts/index.ts`
- 替换 `arkTTS()` 为 `bailianTTS(text, voice, apiKey, rate)`
- 调用 `https://dashscope.aliyuncs.com/compatible-mode/v1/audio/speech`
- 接收新参数 `rate`，映射到请求体 `speed`
- 保留 `googleTTS()` fallback

### 4. `src/components/StyleConfigPanel.tsx` — `MangaPanel` 组件
新增控件（在"配音朗读"开关打开后显示）：

**新增 API Key 输入框**（顶部）
- `<input type="password">` 输入框，保存到 `bailian_api_key` localStorage
- 提示文字："阿里百炼 API Key（不提交代码）"

**预设音色列表**（现有 UI 复用，更新音色数据）

**自定义音色 ID 输入框**（音色列表下方）
- placeholder: "自定义音色 ID（如 longxiaobai）"
- 非空时覆盖预设音色选择

**语速滑块**
- 使用已有 `NumericSlider` 组件
- 范围：0.5 ~ 2.0，步长 0.1，单位 "x"，默认 1.0

**音量滑块**
- 使用已有 `NumericSlider` 组件
- 范围：0 ~ 100，步长 5，单位 "%"，默认 80

### 5. `src/components/VideoGenerator.tsx`
- 读取 `opts.ttsRate / ttsVolume / ttsCustomVoice`
- 实际音色 = `ttsCustomVoice.trim() || ttsVoice`
- `synthesize(text, voice, { rate: ttsRate })` 传递语速
- `webmToMp4WithAudio(..., volume)` 传递音量

### 6. `src/lib/mp4Converter.ts`
- `webmToMp4WithAudio()` 新增可选参数 `volume = 80`（0~100）
- 在 FFmpeg 滤镜中追加 `volume=X.XX` 效果（单/多段均适用）

---

## 验证点

1. 配置 Bailian API Key → 开启配音 → 选/自定义音色 → 试听有效
2. 调整语速（0.5x / 2.0x）→ 录制后视频语速正确
3. 调整音量（低/高）→ 录制后视频音量变化
4. API Key 未配置 → fallback Google TTS 无声
5. 自定义音色 ID 非空 → 覆盖预设选择
6. 页面刷新后 API Key 自动恢复
