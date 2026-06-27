// minimax-tts.ts — MiniMax TTS via Supabase Edge Function
// Calls tts-minimax edge function which proxies to MiniMax API

const SUPABASE_URL = 'https://spb-t4ngxi6xsx650369.supabase.opentrust.net';
const SUPABASE_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi10NG5neGk2eHN4NjUwMzY5IiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzY5MjgzNDAsImV4cCI6MjA5MjUwNDM0MH0.EHz1XRSbWC1AktqItCyzJ5uK5bTPVGEpsots4QJMHyI';
const TTS_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/tts-minimax`;

export interface MinimaxTtsResult {
  audioUrl: string;
  audioLength: number;  // seconds
  usageCharacters: number;
}

/**
 * Synthesize text via MiniMax TTS (through Supabase Edge Function).
 * voiceId: MiniMax voice_id (use "Chinese (Mandarin)_Warm_Male" for default, or cloned voice id)
 */
export async function minimaxTts(
  text: string,
  voiceId: string = 'Chinese (Mandarin)_Warm_Male',
  speed?: number,
): Promise<MinimaxTtsResult> {
  const res = await fetch(TTS_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      text,
      voice_id: voiceId,
      model: 'speech-02-turbo',
      speed: speed ?? 1.0,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `MiniMax TTS failed: ${res.status}`);
  }

  return res.json();
}

// ── Voice Clone ──────────────────────────────────────────────────────────────
export interface ClonedVoice {
  id: string;      // MiniMax voice_id
  name: string;
  createdAt: number;
}

export interface VoiceCloneRequest {
  audioUrl: string;
  voiceName: string;
}

/**
 * Clone a voice via MiniMax voice_clone API (through Supabase Edge Function).
 * audioUrl must be a publicly accessible URL to the audio sample.
 */
export async function cloneVoice(req: VoiceCloneRequest): Promise<ClonedVoice> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/voice-enrollment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Voice clone failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    id: data.voiceId,
    name: data.voiceName || req.voiceName,
    createdAt: Date.now(),
  };
}

const CLONED_VOICES_LS_KEY = 'minimax_cloned_voices';

export function getStoredClonedVoices(): ClonedVoice[] {
  try {
    const raw = localStorage.getItem(CLONED_VOICES_LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addStoredClonedVoice(voice: ClonedVoice) {
  const voices = getStoredClonedVoices();
  const idx = voices.findIndex(v => v.id === voice.id);
  if (idx >= 0) voices[idx] = voice;
  else voices.push(voice);
  localStorage.setItem(CLONED_VOICES_LS_KEY, JSON.stringify(voices));
}
