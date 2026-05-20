// tts.ts — TTS via Supabase Edge Function → Alibaba Bailian DashScope CosyVoice
// Browser POSTs to Edge Function (CORS OK), Edge Function calls Bailian (no CORS issue server-side).
// API key is stored in localStorage and sent to Edge Function at call time.

const SUPABASE_URL = 'https://spb-t4ngxi6xsx650369.supabase.opentrust.net';
const SUPABASE_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi10NG5neGk2eHN4NjUwMzY5IiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzY5MjgzNDAsImV4cCI6MjA5MjUwNDM0MH0.EHz1XRSbWC1AktqItCyzJ5uK5bTPVGEpsots4QJMHyI';
const TTS_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/manga-tts`;

// ── Alibaba Bailian API key storage ──────────────────────────────────────────
const BAILIAN_LS_KEY = 'bailian_api_key';

export function getStoredBailianKey(): string {
  try { return localStorage.getItem(BAILIAN_LS_KEY) ?? ''; }
  catch { return ''; }
}

export function setStoredBailianKey(key: string) {
  try { localStorage.setItem(BAILIAN_LS_KEY, key); }
  catch { /* ignore */ }
}

// ── CosyVoice voices (Alibaba Bailian / DashScope) ───────────────────────────
export const TTS_VOICES = [
  {
    id: 'longxiaochun',
    label: '龙小淳（女·温暖亲切）',
    previewRate: 0.95,
    previewPitch: 1.1,
  },
  {
    id: 'longwan',
    label: '龙婉（女·温柔知性）',
    previewRate: 0.9,
    previewPitch: 1.15,
  },
  {
    id: 'longcheng',
    label: '龙橙（男·磁性低沉）',
    previewRate: 1.0,
    previewPitch: 0.7,
  },
  {
    id: 'longshu',
    label: '龙书（男·沉稳播报）',
    previewRate: 0.88,
    previewPitch: 0.65,
  },
  {
    id: 'longfei',
    label: '龙飞（男·活泼热情）',
    previewRate: 1.1,
    previewPitch: 0.85,
  },
] as const;

export type TtsVoice = (typeof TTS_VOICES)[number];
export type TtsVoiceId = TtsVoice['id'];
export const DEFAULT_TTS_VOICE: TtsVoiceId = 'longxiaochun';

export function getVoiceConfig(voiceId: string): TtsVoice {
  return (TTS_VOICES.find(v => v.id === voiceId) ?? TTS_VOICES[0]) as TtsVoice;
}

export interface SynthesizeOptions {
  rate?: number;   // speed multiplier 0.5 ~ 2.0, default 1.0
}

/**
 * Synthesize text via Edge Function → Bailian DashScope CosyVoice.
 * Returns raw MP3 bytes as ArrayBuffer. Rejects on error.
 */
export async function synthesize(
  text: string,
  voiceId: string = DEFAULT_TTS_VOICE,
  options: SynthesizeOptions = {},
): Promise<ArrayBuffer> {
  const apiKey = getStoredBailianKey();
  // API key is optional — Edge Function falls back to Google TTS if not provided

  const res = await fetch(TTS_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      text,
      voiceId,
      apiKey,
      rate: options.rate ?? 1.0,
    }),
  });

  const contentType = res.headers.get('Content-Type') ?? '';
  if (!res.ok || contentType.includes('application/json')) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json() as Record<string, string>;
      msg = err.error ?? err.message ?? err.msg ?? msg;
    } catch { /* ignore */ }
    throw new Error(String(msg).slice(0, 120));
  }

  return res.arrayBuffer();
}
