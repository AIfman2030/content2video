// tts.ts — Edge TTS via Supabase Edge Function (server-side WebSocket proxy)
// The browser makes a plain HTTP POST; the Edge Function opens the WebSocket
// to speech.platform.bing.com on the server side, avoiding browser CSP blocks.

const TTS_FUNCTION_URL =
  'https://spb-t4ngxi6xsx650369.supabase.opentrust.net/functions/v1/manga-tts';

export const TTS_VOICES = [
  { id: 'zh-CN-XiaoxiaoNeural', label: '晓晓（女·温暖）' },
  { id: 'zh-CN-YunxiNeural',    label: '云希（男·活泼）' },
  { id: 'zh-CN-XiaoyiNeural',   label: '晓伊（女·少女）' },
  { id: 'zh-CN-YunjianNeural',  label: '云健（男·有力）' },
  { id: 'zh-CN-XiaohanNeural',  label: '晓涵（女·沉稳）' },
] as const;

export type TtsVoiceId = (typeof TTS_VOICES)[number]['id'];
export const DEFAULT_TTS_VOICE: TtsVoiceId = 'zh-CN-XiaoxiaoNeural';

/**
 * Synthesize text via the manga-tts Edge Function.
 * Returns raw MP3 bytes as ArrayBuffer. Rejects on error.
 */
export async function synthesize(
  text: string,
  voice: string = DEFAULT_TTS_VOICE,
  rate = '+0%',
  pitch = '+0Hz',
): Promise<ArrayBuffer> {
  const res = await fetch(TTS_FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, rate, pitch }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(msg.slice(0, 120));
  }

  const contentType = res.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    // Edge Function returned an error in JSON format
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? 'TTS failed');
  }

  return res.arrayBuffer();
}
