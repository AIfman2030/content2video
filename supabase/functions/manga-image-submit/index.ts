const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubmitRequest {
  prompt: string;
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_SPBT4NGXI6XSX650369");
    if (!AI_API_TOKEN) {
      return jsonResponse(500, { success: false, message: "AI service is not configured", code: "configuration_error" });
    }

    const body: SubmitRequest = await req.json();
    if (!body.prompt?.trim()) {
      return jsonResponse(400, { success: false, message: "prompt is required", code: "invalid_request_error" });
    }

    const requestBody = {
      model: "doubao/seedream-4.5",
      prompt: body.prompt.trim(),
      type: "txt_2_img",
      image_option: { ratio: "16:9", resolution: "2k", format: "jpg" },
    };

    const ENTER_API_BASE_URL = "https://spb-t4ngxi6xsx650369.supabase.opentrust.net";
    const response = await fetch(`${ENTER_API_BASE_URL}/code/api/v1/ai/images`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_TOKEN}`,
        "Content-Type": "application/json",
        "X-Async": "true",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.error?.message || data.message || "Image generation failed";
      return jsonResponse(response.status, { success: false, message, code: data.error?.type || "api_error" });
    }

    return jsonResponse(200, { success: true, task_id: data.task_id, status: data.status });
  } catch (error) {
    return jsonResponse(500, {
      success: false,
      message: error instanceof Error ? error.message : "Internal error",
      code: "internal_error",
    });
  }
});
