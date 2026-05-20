// tts.ts — TTS via Supabase Edge Function → ByteDance Ark HTTP API
// Browser calls Edge Function (CORS OK), Edge Function calls Ark TTS (no CORS issue server-side).
// Uses user's stored Ark API key — same key as image generation.

import { getStoredArkKey } from './ark';

const SUPABASE_URL = 'https://spb-t4ngxi6xsx650369.supabase.opentrust.net';
const SUPABASE_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi10NG5neGk2eHN4NjUwMzY5IiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzY5MjgzNDAsImV4cCI6MjA5MjUwNDM0MH0.EHz1XRSbWC1AktqItCyzJ5uK5bTPVGEpsots4QJMHyI';
const TTS_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/manga-tts`;

export const TTS_VOICES = [
  {
    id: 'xiao_xiao',
    label: '晓晓（女·温暖）',
    previewRate: 0.95,
    previewPitch: 1.1,
  },
  {
    id: 'yun_xi',
    label: '云希（男·活泼）',
    previewRate: 1.1,
    previewPitch: 0.7,
  },
  {
    id: 'xiao_yi',
    label: '晓伊（女·少女）',
    previewRate: 1.05,
    previewPitch: 1.35,
  },
  {
    id: 'yun_jian',
    label: '云健（男·有力）',
    previewRate: 0.88,
    previewPitch: 0.6,
  },
  {
    id: 'xiao_han',
    label: '晓涵（女·沉稳）',
    previewRate: 0.85,
    previewPitch: 1.0,
  },
] as const;

export type TtsVoice = (typeof TTS_VOICES)[number];
export type TtsVoiceId = TtsVoice['id'];
export const DEFAULT_TTS_VOICE: TtsVoiceId = 'xiao_xiao';

export function getVoiceConfig(voiceId: string): TtsVoice {
  return (TTS_VOICES.find(v => v.id === voiceId) ?? TTS_VOICES[0]) as TtsVoice;
}

/**
 * Synthesize text via Edge Function → Ark TTS HTTP API.
 * Returns raw MP3 bytes as ArrayBuffer. Rejects on error.
 */
export async function synthesize(
  text: string,
  voiceId: string = DEFAULT_TTS_VOICE,
): Promise<ArrayBuffer> {
  const apiKey = getStoredArkKey();
  if (!apiKey) throw new Error('未配置即梦 API Key，请先在右上角设置中配置');

  const res = await fetch(TTS_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ text, voiceId, apiKey }),
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
