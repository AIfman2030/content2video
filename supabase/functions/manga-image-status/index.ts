const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_SPBT4NGXI6XSX650369");
    if (!AI_API_TOKEN) {
      return new Response(
        JSON.stringify({ success: false, message: "AI service is not configured", code: "configuration_error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { task_id } = await req.json();
    if (!task_id) {
      return new Response(
        JSON.stringify({ success: false, message: "task_id is required", code: "invalid_request_error" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ENTER_API_BASE_URL = "https://spb-t4ngxi6xsx650369.supabase.opentrust.net";
    const response = await fetch(`${ENTER_API_BASE_URL}/code/api/v1/ai/tasks/${task_id}`, {
      headers: { Authorization: `Bearer ${AI_API_TOKEN}` },
    });

    const data = await response.json().catch(() => ({}));
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : "Internal error",
        code: "internal_error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
