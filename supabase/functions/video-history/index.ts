// Edge Function: video-history
// Manages saving, listing, and deleting generated video history
//
// Routes (via ?action= query param):
//   POST  ?action=save     — Body: { title, style, sourceText, coverIndex, content, nature, options, coverUrl?, videoUrl?, durationMs? }
//   GET   ?action=list     — Query: ?style=&limit=&offset=
//   GET   ?action=get&id=  — Get single record by id
//   DELETE ?action=delete&id=

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      return jsonResponse({ error: "服务端未配置" }, 503);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "list";

    // ── SAVE ────────────────────────────────────────────────────────────────
    if (action === "save" && req.method === "POST") {
      const body = await req.json();
      const { title, style, sourceText, coverIndex,
              content, nature, options,
              coverUrl, videoUrl, durationMs } = body;

      if (!title || !style || !sourceText) {
        return jsonResponse({ error: "缺少必填字段" }, 400);
      }
      if (!['chinese','city','aitech','nature'].includes(style)) {
        return jsonResponse({ error: "无效的风格类型" }, 400);
      }

      const { data, error } = await supabase
        .from("video_history")
        .insert({
          title,
          style,
          source_text: sourceText,
          cover_index: coverIndex ?? 0,
          content: content ?? null,
          nature: nature ?? null,
          options: options ?? null,
          cover_url: coverUrl ?? null,
          video_url: videoUrl ?? null,
          duration_ms: durationMs ?? null,
        })
        .select()
        .single();

      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ data });
    }

    // ── LIST ────────────────────────────────────────────────────────────────
    if (action === "list" && req.method === "GET") {
      const styleFilter = url.searchParams.get("style");
      const limit  = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);
      const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

      let query = supabase
        .from("video_history")
        .select("id, created_at, title, style, cover_index, cover_url, video_url, duration_ms")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (styleFilter) query = query.eq("style", styleFilter);

      const { data, error } = await query;
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ data: data ?? [] });
    }

    // ── GET single ─────────────────────────────────────────────────────────
    if (action === "get" && req.method === "GET") {
      const id = url.searchParams.get("id");
      if (!id) return jsonResponse({ error: "缺少 id 参数" }, 400);

      const { data, error } = await supabase
        .from("video_history")
        .select("*")
        .eq("id", id)
        .single();

      if (error) return jsonResponse({ error: error.message }, 404);
      return jsonResponse({ data });
    }

    // ── DELETE ─────────────────────────────────────────────────────────────
    if (action === "delete" && req.method === "DELETE") {
      const id = url.searchParams.get("id");
      if (!id) return jsonResponse({ error: "缺少 id 参数" }, 400);

      const { error } = await supabase
        .from("video_history")
        .delete()
        .eq("id", id);

      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "未知操作" }, 400);
  } catch (err) {
    return jsonResponse({ error: (err as Error).message ?? "未知错误" }, 500);
  }
});
