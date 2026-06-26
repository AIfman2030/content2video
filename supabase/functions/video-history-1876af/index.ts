import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const headers = { ...corsHeaders, "Content-Type": "application/json" };

    // ── SAVE ────────────────────────────────────────────────────────────
    if (req.method === "POST" && action === "save") {
      const body = await req.json();
      const row = {
        title: body.title,
        style: body.style,
        source_text: body.sourceText,
        cover_index: body.coverIndex ?? 0,
        content: body.content ?? null,
        nature: body.nature ?? null,
        options: body.options ?? null,
        cover_url: body.coverUrl ?? null,
        video_url: body.videoUrl ?? null,
        duration_ms: body.durationMs ?? null,
      };
      const { data, error } = await supabase
        .from("video_history")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers });
    }

    // ── LIST ────────────────────────────────────────────────────────────
    if (req.method === "GET" && action === "list") {
      const style = url.searchParams.get("style");
      const limit = parseInt(url.searchParams.get("limit") || "20", 10);
      const offset = parseInt(url.searchParams.get("offset") || "0", 10);

      let query = supabase
        .from("video_history")
        .select(
          "id,created_at,title,style,cover_index,cover_url,video_url,duration_ms"
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (style) query = query.eq("style", style);
      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers });
    }

    // ── GET ─────────────────────────────────────────────────────────────
    if (req.method === "GET" && action === "get") {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(JSON.stringify({ error: "缺少 id" }), {
          status: 400,
          headers,
        });
      }
      const { data, error } = await supabase
        .from("video_history")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers });
    }

    // ── DELETE ───────────────────────────────────────────────────────────
    if (req.method === "DELETE" && action === "delete") {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(JSON.stringify({ error: "缺少 id" }), {
          status: 400,
          headers,
        });
      }
      const { error } = await supabase
        .from("video_history")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(
      JSON.stringify({ error: "不支持的操作" }),
      { status: 400, headers }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "未知错误" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
