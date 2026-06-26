/**
 * manga-tts: TTS synthesis with multiple Bailian/DashScope API attempts.
 * Tries in order:
 *   1. DashScope CosyVoice via compatible-mode/v1/audio/speech (OpenAI-compatible)
 *   2. DashScope SamBERT via api/v1/services/aigc/text2audio/call (confirmed HTTP REST)
 *   3. Google Translate TTS (free, always works, single zh-CN voice fallback)
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  // Expose custom headers so browser JS can read them via res.headers.get()
  "Access-Control-Expose-Headers": "X-Tts-Source, X-Tts-Errors",
};

const SAMBERT_VOICE_MAP: Record<string, string> = {
  "longxiaochun": "sambert-zhimi-v2",      // 甜美女声
  "longwan":      "sambert-zhijia-v1",     // 知性女声
  "longcheng":    "sambert-zhizhen-v1",    // 成熟男声
  "longshu":      "sambert-zhichu-v1",     // 磁性男声
  "longfei":      "sambert-zhixiang-v1",   // 阳光男声
};

/** 1. Bailian DashScope CosyVoice via OpenAI-compatible HTTP */
async function cosyVoiceTTS(text: string, voice: string, apiKey: string, speed: number): Promise<ArrayBuffer> {
  const res = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "cosyvoice-v1",
      input: text,
      voice,
      response_format: "mp3",
      speed: Math.max(0.5, Math.min(2.0, speed)),
    }),
  });

  const ct = res.headers.get("Content-Type") ?? "";
  if (!res.ok || ct.includes("application/json")) {
    const txt = await res.text().catch(() => "");
    let msg = `cosyvoice HTTP ${res.status}`;
    try { const e = JSON.parse(txt); msg = e?.error?.message ?? e?.message ?? e?.error ?? msg; } catch (_) {/**/}
    throw new Error(`${msg} | ${txt.slice(0, 100)}`);
  }
  return res.arrayBuffer();
}

/** 2. DashScope SamBERT HTTP REST API — synchronous, returns base64 or URL */
async function sambertTTS(text: string, voice: string, apiKey: string): Promise<ArrayBuffer> {
  const sambertVoice = SAMBERT_VOICE_MAP[voice] ?? "sambert-zhichu-v1";

  const res = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text2audio/call", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: sambertVoice,
      input: { text },
      parameters: {
        text_type: "PlainText",
        format: "mp3",
        sample_rate: 16000,
      },
    }),
  });

  const json = await res.json() as {
    output?: { audio?: string; audio_address?: string };
    code?: string;
    message?: string;
    status_code?: number;
  };

  if (!res.ok || json.code || json.status_code) {
    throw new Error(`sambert ${res.status} [${json.code ?? json.status_code}] ${json.message ?? ""} voice=${sambertVoice}`);
  }

  const output = json.output ?? {};
  const audioB64 = output.audio ?? "";
  const audioUrl = output.audio_address ?? "";

  if (audioB64) {
    const binary = Uint8Array.from(atob(audioB64), c => c.charCodeAt(0));
    if (binary.byteLength < 100) throw new Error(`sambert audio too small (${binary.byteLength})`);
    return binary.buffer;
  }
  if (audioUrl.startsWith("http")) {
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) throw new Error(`sambert URL HTTP ${audioRes.status}`);
    return audioRes.arrayBuffer();
  }
  throw new Error(`sambert no audio field: ${JSON.stringify(output).slice(0, 150)}`);
}

/** 3. Google Translate TTS — free, single zh-CN voice, always available */
async function googleTTS(text: string): Promise<ArrayBuffer> {
  const chunks: string[] = [];
  let rem = text;
  while (rem.length > 0) { chunks.push(rem.slice(0, 200)); rem = rem.slice(200); }
  const buffers: ArrayBuffer[] = [];
  for (const chunk of chunks) {
    const url = "https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=zh-CN&client=gtx&ttsspeed=1&q=" + encodeURIComponent(chunk);
    const r = await fetch(url, { headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
      "Referer": "https://translate.google.com/",
    }});
    if (!r.ok) throw new Error(`google HTTP ${r.status}`);
    buffers.push(await r.arrayBuffer());
  }
  const total = buffers.reduce((s, b) => s + b.byteLength, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const b of buffers) { out.set(new Uint8Array(b), off); off += b.byteLength; }
  return out.buffer;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  let text = "", voiceId = "longxiaochun", apiKey = "", rate = 1.0;
  try {
    const b = await req.json();
    text    = String(b.text    ?? "").trim();
    voiceId = String(b.voiceId ?? b.voice ?? "longxiaochun");
    apiKey  = String(b.apiKey  ?? "");
    rate    = Number(b.rate    ?? 1.0);
    if (isNaN(rate)) rate = 1.0;
  } catch (_) {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
  if (!text) return new Response(JSON.stringify({ error: "empty text" }), {
    status: 400, headers: { ...CORS, "Content-Type": "application/json" },
  });

  const errors: string[] = [];

  if (apiKey) {
    // — Attempt 1: CosyVoice
    try {
      const mp3 = await cosyVoiceTTS(text, voiceId, apiKey, rate);
      return new Response(mp3, { headers: { ...CORS, "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-Tts-Source": `cosyvoice:${voiceId}` }});
    } catch (e) { errors.push(`cosyvoice: ${(e as Error).message}`); }

    // — Attempt 2: SamBERT
    try {
      const mp3 = await sambertTTS(text, voiceId, apiKey);
      const sv = SAMBERT_VOICE_MAP[voiceId] ?? voiceId;
      return new Response(mp3, { headers: { ...CORS, "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-Tts-Source": `sambert:${sv}` }});
    } catch (e) { errors.push(`sambert: ${(e as Error).message}`); }
  }

  // — Fallback: Google
  try {
    const mp3 = await googleTTS(text);
    return new Response(mp3, { headers: {
      ...CORS, "Content-Type": "audio/mpeg", "Cache-Control": "no-store",
      "X-Tts-Source": "google-fallback",
      "X-Tts-Errors": errors.join(" || ").slice(0, 500),
    }});
  } catch (e) {
    return new Response(JSON.stringify({ error: `all TTS failed: ${[...errors, String(e)].join("; ")}` }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
