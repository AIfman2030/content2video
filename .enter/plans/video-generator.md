# Plan: Manga Subtitle Style — Audio Narration Feature

## Context
User wants AI-voiced audio commentary synced to each manga subtitle segment,
and the final recorded MP4 must contain both video and audio.

**Why browser SpeechSynthesis won't work**: outputs to OS audio device,
cannot be routed through AudioContext, so MediaRecorder cannot capture it.

**Solution**: Microsoft Edge TTS (free, no API key needed, neural voices) via
a Supabase Edge Function WebSocket proxy. Frontend decodes the returned MP3
bytes via AudioContext, schedules playback per-segment, and mixes the audio
stream into MediaRecorder alongside the canvas video stream.

---

## TTS Technology: Microsoft Edge TTS

- Free, no API key required
- WebSocket endpoint (same one Edge browser uses for Read Aloud)
- Returns MP3 audio data in binary WebSocket frames
- Chinese voices (user-selectable):
  - zh-CN-XiaoxiaoNeural — 晓晓（女，温暖自然）← default
  - zh-CN-YunxiNeural    — 云希（男，开朗活泼）
  - zh-CN-XiaoyiNeural   — 晓伊（女，活泼）
  - zh-CN-YunjianNeural  — 云健（男，有力）

---

## Recording Architecture

  User clicks 录制
    → (if ttsEnabled) fetch all TTS audio via Edge Function (one per segment)
    → decode each ArrayBuffer via audioCtx.decodeAudioData()
    → create AudioContext + createMediaStreamDestination()
    → schedule AudioBufferSourceNodes staggered by slideDurationMs
    → combinedStream = canvas.captureStream(30) + audioDest.stream
    → MediaRecorder records combinedStream
    → webmToMp4() (existing) → download

---

## Files to Create / Modify

### 1. NEW: supabase/functions/manga-tts/index.ts
Edge Function that:
- Accepts POST { text, voice? }
- Opens WebSocket to Edge TTS service
- Sends SSML synthesis request
- Collects all binary audio frames, concatenates to ArrayBuffer
- Returns MP3 bytes with Content-Type: audio/mpeg
- Always returns HTTP 200; errors return JSON { error: string }

### 2. NEW: src/services/tts.ts
- Exports TTS_VOICES array (id + label for UI)
- Exports synthesize(text, voice) -> Promise<ArrayBuffer>
  - Calls supabase.functions.invoke('manga-tts', { body: { text, voice } })
  - Returns raw audio ArrayBuffer (data is Blob from Supabase SDK)

### 3. MODIFY: src/components/VideoGenerator.tsx
New props: ttsEnabled?: boolean, ttsVoice?: string

New state: ttsPhase: 'idle' | 'generating' | 'recording'

handleRecord() changes:
  - If ttsEnabled && isManga:
      - Show "正在生成语音 (0/N)" progress UI
      - Call synthesize() for each segment sequentially (to avoid rate limiting)
      - Decode each to AudioBuffer via audioCtx.decodeAudioData()
      - Create AudioContext + createMediaStreamDestination()
      - Schedule each AudioBufferSourceNode at i * slideDurationMs / 1000 seconds
      - combinedStream = new MediaStream([...canvas.captureStream(30).getTracks(),
                                          ...audioDest.stream.getTracks()])
      - Start MediaRecorder with combinedStream
  - Else (no TTS): existing flow unchanged (canvas.captureStream only)

### 4. MODIFY: src/types/video.ts
Add to MangaOptions interface:
  ttsEnabled?: boolean;
  ttsVoice?: string;
Update DEFAULT_MANGA_OPTIONS: ttsEnabled: false, ttsVoice: 'zh-CN-XiaoxiaoNeural'

### 5. MODIFY: src/components/StyleConfigPanel.tsx
In manga options section, add:
- Switch row: "配音朗读" (ttsEnabled toggle)
- When enabled: voice select dropdown (晓晓/云希/晓伊/云健)
- Caption: "录制时自动合成语音并混入视频"

### 6. MODIFY: src/pages/Index.tsx
Pass ttsEnabled and ttsVoice from mangaOptions to VideoGenerator props.
Add ttsEnabled/ttsVoice to the VideoGenerator props interface pass-through.

---

## Files NOT changed
- src/lib/engine/manga.ts
- src/lib/canvasEngine.ts
- src/services/ark.ts
- src/components/MangaContentEditor.tsx

---

## Verification
1. Select manga style, enable 配音朗读, choose a voice
2. Generate manga content, open VideoGenerator
3. Click 录制 → see "正在生成语音 (1/N)..." progress
4. Recording starts automatically after TTS is ready
5. Download MP4 → each segment has spoken audio in sync with the slide
