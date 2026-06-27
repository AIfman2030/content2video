/**
 * voice-enrollment edge function
 * 接受音频 URL，下载文件后以 multipart/form-data 发送给 MiniMax 声音复刻 API
 * POST body: { audioUrl: string, voiceName: string }
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY = "https://app-c3k52olzg7b5-api-DLEO7Bj0lORa-gateway.appmiaoda.com";

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "服务器配置错误：缺少 API Key" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let audioUrl: string;
  let voiceName: string;

  try {
    const body = await req.json();
    audioUrl = body.audioUrl;
    voiceName = (body.voiceName ?? "我的音色").slice(0, 16);
    if (!audioUrl) throw new Error("缺少 audioUrl");
  } catch {
    return new Response(
      JSON.stringify({ error: "请求参数无效" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Step 1：下载用户音频文件二进制
  let audioBytes: Uint8Array;
  let mimeType = "audio/mpeg";
  let fileExt = "mp3";
  try {
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) throw new Error(`下载音频失败：${audioRes.status}`);
    const ct = audioRes.headers.get("content-type") ?? "audio/mpeg";
    mimeType = ct.split(";")[0].trim();
    if (mimeType.includes("webm")) { fileExt = "webm"; mimeType = "audio/webm"; }
    else if (mimeType.includes("wav")) { fileExt = "wav"; mimeType = "audio/wav"; }
    else if (mimeType.includes("m4a") || mimeType.includes("mp4")) { fileExt = "m4a"; mimeType = "audio/mp4"; }
    else { fileExt = "mp3"; mimeType = "audio/mpeg"; }
    const ab = await audioRes.arrayBuffer();
    audioBytes = new Uint8Array(ab);
  } catch (e) {
    return new Response(
      JSON.stringify({ error: `音频下载失败：${(e as Error).message}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Step 2：以 multipart/form-data 调用 MiniMax voice_clone API
  try {
    const formData = new FormData();
    const audioFile = new File([audioBytes], `voice_sample.${fileExt}`, { type: mimeType });
    formData.append("audio_file", audioFile);
    formData.append("voice_name", voiceName);

    const cloneResp = await fetch(`${GATEWAY}/v1/voice_clone`, {
      method: "POST",
      headers: {
        // 不设 Content-Type，让浏览器/Deno 自动附加 multipart boundary
        "X-Gateway-Authorization": `Bearer ${apiKey}`,
      },
      body: formData,
    });

    const respText = await cloneResp.text();
    console.log("voice_clone raw response:", cloneResp.status, respText.slice(0, 500));

    if (!cloneResp.ok) {
      return new Response(
        JSON.stringify({ error: `声音复刻失败（HTTP ${cloneResp.status}）：${respText.slice(0, 300)}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: Record<string, unknown>;
    try { result = JSON.parse(respText); } catch {
      return new Response(
        JSON.stringify({ error: `响应解析失败：${respText.slice(0, 200)}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // MiniMax voice_clone 成功时 base_resp.status_code === 0
    const baseResp = result.base_resp as { status_code?: number; status_msg?: string } | undefined;
    if (baseResp?.status_code !== 0) {
      return new Response(
        JSON.stringify({
          error: `声音复刻失败：${baseResp?.status_msg ?? "未知错误"}（code ${baseResp?.status_code}）`,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // voice_id 可能在顶层或 data 下
    const voiceId = (result.voice_id ?? (result.data as Record<string, unknown>)?.voice_id) as string | undefined;
    if (!voiceId) {
      return new Response(
        JSON.stringify({ error: "声音复刻成功但未返回 voice_id，原始响应：" + respText.slice(0, 200) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ voiceId, voiceName }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: `声音复刻请求异常：${(e as Error).message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
