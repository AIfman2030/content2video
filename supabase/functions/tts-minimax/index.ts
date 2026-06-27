import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function streamAudioToStorage(audioUrl: string, bucket: string) {
  try {
    const res = await fetch(audioUrl);
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const contentType = res.headers.get("content-type") ?? "audio/mpeg";
    const ext = contentType.split("/")[1]?.split(";")[0] ?? "mp3";
    const filePath = `tts/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, res.body!, { contentType, upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return { success: true, publicUrl: data.publicUrl };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  let text: string;
  let voiceId: string;
  let model: string;
  let speed: number | undefined;

  try {
    const body = await req.json();
    text = body.text;
    if (!text) throw new Error("Missing text");
    voiceId = body.voice_id ?? "Chinese (Mandarin)_Warm_Male";
    model = body.model ?? "speech-02-turbo";
    speed = body.speed;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const voiceSetting: Record<string, unknown> = { voice_id: voiceId, vol: 1 };
  if (speed !== undefined) voiceSetting.speed = speed;

  const upstream = await fetch(
    "https://app-c3k52olzg7b5-api-DLEO7Bj0lORa-gateway.appmiaoda.com/v1/t2a_v2",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        text,
        stream: false,
        output_format: "url",
        voice_setting: voiceSetting,
        audio_setting: { format: "mp3", sample_rate: 32000, bitrate: 128000 },
      }),
    }
  );

  if (upstream.status === 429 || upstream.status === 402) {
    const errText = await upstream.text();
    return new Response(errText, {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!upstream.ok) {
    return new Response(
      JSON.stringify({ error: `Upstream error: ${upstream.status}` }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const result = await upstream.json();
  if (result.base_resp?.status_code !== 0) {
    return new Response(
      JSON.stringify({ error: `TTS error ${result.base_resp?.status_code}: ${result.base_resp?.status_msg}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const rawAudioUrl = result.data?.audio;
  let audioUrl = rawAudioUrl;

  if (rawAudioUrl) {
    const stored = await streamAudioToStorage(rawAudioUrl, "generated-media");
    if (stored.success) audioUrl = stored.publicUrl;
  }

  return new Response(
    JSON.stringify({
      audioUrl,
      audioLength: result.extra_info?.audio_length ?? 0,
      usageCharacters: result.extra_info?.usage_characters ?? 0,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
