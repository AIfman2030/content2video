// manga-image-generate — Calls Doubao Seedream 4.5 via Ark API (Bearer token, synchronous).
// Returns the generated image URL directly. AbortController prevents Supabase timeout errors.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const API_KEY = Deno.env.get("ARK_API_KEY");
    console.log("[ark] ARK_API_KEY present:", !!API_KEY);

    if (!API_KEY) {
      return ok({ success: false, message: "ARK_API_KEY 未配置" });
    }

    let reqBody: { prompt?: string };
    try {
      reqBody = await req.json();
    } catch {
      return ok({ success: false, message: "Invalid JSON body" });
    }

    const prompt = reqBody.prompt?.trim();
    if (!prompt) {
      return ok({ success: false, message: "prompt is required" });
    }

    console.log("[ark] prompt:", prompt.slice(0, 120));

    // AbortController: cancel after 55s to ensure we return before Supabase 60s limit
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);

    let rawText = "";
    let httpStatus = 0;

    try {
      const resp = await fetch(
        "https://ark.cn-beijing.volces.com/api/v3/images/generations",
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            model: "doubao-seedream-4-5-251128",
            prompt,
            sequential_image_generation: "disabled",
            response_format: "url",
            size: "2k",
            stream: false,
            watermark: false,
          }),
        },
      );
      httpStatus = resp.status;
      rawText = await resp.text();
    } catch (fetchErr: unknown) {
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      if (msg.includes("aborted") || msg.includes("AbortError")) {
        console.error("[ark] fetch timed out after 55s");
        return ok({ success: false, message: "图片生成超时，请重试" });
      }
      console.error("[ark] fetch error:", msg);
      return ok({ success: false, message: `网络错误: ${msg}` });
    } finally {
      clearTimeout(timeout);
    }

    console.log("[ark] HTTP:", httpStatus, "| body:", rawText.slice(0, 400));

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawText);
    } catch {
      return ok({ success: false, message: `Non-JSON (HTTP ${httpStatus}): ${rawText.slice(0, 200)}` });
    }

    // Check for API-level error
    if (data.error) {
      const err = data.error as Record<string, unknown>;
      return ok({ success: false, message: `API错误 [${err.code}]: ${err.message}` });
    }
    if (httpStatus >= 400) {
      return ok({ success: false, message: `HTTP ${httpStatus}: ${rawText.slice(0, 200)}` });
    }

    // OpenAI-compatible: { data: [{ url }] }
    const url = (data.data as Array<Record<string, unknown>>)?.[0]?.url as string | undefined;
    if (!url) {
      return ok({ success: false, message: "响应中无图片URL: " + rawText.slice(0, 200) });
    }

    console.log("[ark] ✓ url:", url.slice(0, 100));
    return ok({ success: true, imageUrl: url });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[ark] top-level exception:", msg);
    return ok({ success: false, message: msg });
  }
});
