const CORS = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const ARK_TTS_URL = "https://ark.cn-beijing.volces.com/api/v3/audio/speech";
const ARK_TTS_MODEL = "doubao-tts";
const VOICE_MAP: Record<string, string> = {
  "xiao_xiao": "zh_female_wanwanxiaohe_moon_bigtts",
  "yun_xi":    "zh_male_M392_conversation_wvae_bigtts",
  "xiao_yi":   "zh_female_qingxin_moon_bigtts",
  "yun_jian":  "zh_male_guonan_moon_bigtts",
  "xiao_han":  "zh_female_cangjingkong_moon_bigtts",
};
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, {status: 204, headers: CORS});
  let text = "", voiceId = "xiao_xiao", apiKey = "";
  try {
    const b = await req.json();
    text = String(b.text ?? "").trim();
    voiceId = String(b.voiceId ?? b.voice ?? "xiao_xiao");
    apiKey = String(b.apiKey ?? "");
  } catch {
    return new Response(JSON.stringify({error:"invalid json"}), {status:400, headers:{...CORS,"Content-Type":"application/json"}});
  }
  if (!text) return new Response(JSON.stringify({error:"empty text"}), {status:400, headers:{...CORS,"Content-Type":"application/json"}});
  if (!apiKey) return new Response(JSON.stringify({error:"missing apiKey"}), {status:400, headers:{...CORS,"Content-Type":"application/json"}});
  const arkVoice = VOICE_MAP[voiceId] ?? VOICE_MAP["xiao_xiao"];
  const res = await fetch(ARK_TTS_URL, {
    method: "POST",
    headers: {"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
    body: JSON.stringify({model: ARK_TTS_MODEL, input: text, voice: arkVoice, response_format: "mp3"}),
  });
  const ct = res.headers.get("Content-Type") ?? "";
  if (!res.ok || ct.includes("application/json")) {
    let msg = `HTTP ${res.status}`;
    try { const e = await res.json(); msg = e?.error?.message ?? e?.message ?? msg; } catch (_) { /* ignore */ }
    return new Response(JSON.stringify({error: msg}), {status: 500, headers:{...CORS,"Content-Type":"application/json"}});
  }
  const mp3 = await res.arrayBuffer();
  return new Response(mp3, {headers:{...CORS,"Content-Type":"audio/mpeg","Cache-Control":"no-store"}});
});
