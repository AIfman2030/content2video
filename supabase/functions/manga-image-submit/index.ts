// manga-image-generate — Calls Doubao Seedream 4.5 via Ark API (Bearer token, synchronous).
// Returns the generated image URL directly. No polling needed.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const json = (body: unknown) =>
    new Response(JSON.stringify(body), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    const API_KEY = Deno.env.get("ARK_API_KEY");
    if (!API_KEY) {
      return json({ success: false, message: "ARK_API_KEY 未配置" });
    }

    const { prompt } = await req.json();
    if (!prompt?.trim()) {
      return json({ success: false, message: "prompt is required" });
    }

    console.log("[ark] generating image, prompt:", prompt.trim().slice(0, 100));

    const body = JSON.stringify({
      model: "doubao-seedream-4-5-251128",
      prompt: prompt.trim(),
      sequential_image_generation: "disabled",
      response_format: "url",
      size: "2K",
      stream: false,
      watermark: false,
    });

    const resp = await fetch("https://ark.cn-beijing.volces.com/api/v3/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body,
    });

    const rawText = await resp.text();
    console.log("[ark] HTTP status:", resp.status, "| response:", rawText.slice(0, 400));

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawText);
    } catch {
      return json({ success: false, message: `Non-JSON response (${resp.status}): ${rawText.slice(0, 300)}` });
    }

    if (!resp.ok || data.error) {
      const errMsg = (data.error as Record<string, unknown>)?.message ?? data.message ?? `HTTP ${resp.status}`;
      return json({ success: false, message: String(errMsg) });
    }

    // OpenAI-compatible format: { data: [{ url: "..." }] }
    const url = (data.data as Array<Record<string, unknown>>)?.[0]?.url as string | undefined;
    if (!url) {
      return json({ success: false, message: "No image URL in response: " + rawText.slice(0, 200) });
    }

    console.log("[ark] success, url:", url.slice(0, 80));
    return json({ success: true, imageUrl: url });

  } catch (e) {
    console.error("[ark] exception:", String(e));
    return json({ success: false, message: String(e) });
  }
});
