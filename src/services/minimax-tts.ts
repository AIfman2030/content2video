// minimax-tts.ts — MiniMax TTS via Supabase Edge Function
// Calls already-deployed edge functions on the app-c3k52olzg7b5 Supabase instance

const SUPABASE_FN_BASE = 'https://backend.appmiaoda.com/projects/supabase320737353209528320/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMDk1ODk2OTQ0LCJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwic3ViIjoiYW5vbiJ9.5w8tDI6LD3u_Yb5xAyg9Xl_LhE7hBdpBbQjF4krC234';
const TTS_FUNCTION_URL = `${SUPABASE_FN_BASE}/tts-minimax`;
const CLONE_FUNCTION_URL = `${SUPABASE_FN_BASE}/voice-enrollment`;

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
  const res = await fetch(CLONE_FUNCTION_URL, {
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
