// tts.ts — Microsoft Edge TTS via Supabase Edge Function
// Free, no API key needed, high-quality Chinese neural voices.
import { supabase } from '../integrations/supabase/client';

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
 * Synthesize text via Edge TTS and return raw MP3 bytes as ArrayBuffer.
 * Throws on error.
 */
export async function synthesize(text: string, voice: string = DEFAULT_TTS_VOICE): Promise<ArrayBuffer> {
  const { data, error } = await supabase.functions.invoke('manga-tts', {
    body: { text, voice },
  });

  if (error) throw new Error(`TTS invoke error: ${error.message}`);

  // Supabase SDK returns Blob for non-JSON content-types (audio/mpeg)
  if (data instanceof Blob) return data.arrayBuffer();

  // Fallback: might be ArrayBuffer directly
  if (data instanceof ArrayBuffer) return data;

  throw new Error(`TTS: unexpected response type (${typeof data})`);
}
