// tts.ts — TTS via ByteDance Ark HTTP API (same domain as image generation, no WebSocket)
// Uses the user's stored Ark API key — same key as image generation.

import { getStoredArkKey } from './ark';

const ARK_TTS_URL = 'https://ark.cn-beijing.volces.com/api/v3/audio/speech';
const ARK_TTS_MODEL = 'doubao-tts';

export const TTS_VOICES = [
  {
    id: 'xiao_xiao',
    label: '晓晓（女·温暖）',
    arkVoice: 'zh_female_wanwanxiaohe_moon_bigtts',
    previewRate: 0.95,
    previewPitch: 1.1,
  },
  {
    id: 'yun_xi',
    label: '云希（男·活泼）',
    arkVoice: 'zh_male_M392_conversation_wvae_bigtts',
    previewRate: 1.1,
    previewPitch: 0.7,
  },
  {
    id: 'xiao_yi',
    label: '晓伊（女·少女）',
    arkVoice: 'zh_female_qingxin_moon_bigtts',
    previewRate: 1.05,
    previewPitch: 1.35,
  },
  {
    id: 'yun_jian',
    label: '云健（男·有力）',
    arkVoice: 'zh_male_guonan_moon_bigtts',
    previewRate: 0.88,
    previewPitch: 0.6,
  },
  {
    id: 'xiao_han',
    label: '晓涵（女·沉稳）',
    arkVoice: 'zh_female_cangjingkong_moon_bigtts',
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
 * Synthesize text via ByteDance Ark HTTP TTS API.
 * Uses the same API key as image generation — no WebSocket, pure HTTP.
 * Returns raw MP3 bytes as ArrayBuffer. Rejects on error.
 */
export async function synthesize(
  text: string,
  voiceId: string = DEFAULT_TTS_VOICE,
): Promise<ArrayBuffer> {
  const apiKey = getStoredArkKey();
  if (!apiKey) throw new Error('未配置 API Key，请先在设置中配置 Ark API Key');

  const voice = getVoiceConfig(voiceId);

  const res = await fetch(ARK_TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: ARK_TTS_MODEL,
      input: text,
      voice: voice.arkVoice,
      response_format: 'mp3',
    }),
  });

  // If API returns JSON it's an error response
  const contentType = res.headers.get('Content-Type') ?? '';
  if (!res.ok || contentType.includes('application/json')) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      msg = err?.error?.message ?? err?.message ?? err?.error ?? msg;
    } catch { /* ignore */ }
    throw new Error(String(msg).slice(0, 120));
  }

  return res.arrayBuffer();
}
