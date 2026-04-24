const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `你是一个内容提炼专家。用户会给你一段文章或文字，你需要提炼核心要点，以严格的JSON格式返回，不要有任何多余文字。

返回格式：
{
  "title": "核心标题（≤12字，有冲击力）",
  "points": [
    {
      "label": "核心词（2-4字，有冲击力）",
      "short": "一句话补充（5-10字）",
      "desc": "详细解释（15-30字）",
      "formatted": "精炼格式（3-5字事件：3-5字感悟，共10-16字）"
    }
  ]
}

规则：
- 若原文有明确维度（如"三维度"、"三个要点"），严格对应生成，不增不减
- 若原文无明确分类，自然分3~5个主题点
- 只返回JSON，不要任何其他文字
- 确保所有字段都有值`;

const NATURE_PROMPT = `你是一个内容对比提炼专家。用户会给你一段文章或话题，你需要提炼出两组对比内容以及共同点，以严格的JSON格式返回。

返回格式：
{
  "title": "对比主题标题（≤14字，有冲击力）",
  "leftTitle": "A方标签（3-8字，如"穷人在想"）",
  "rightTitle": "B方标签（3-8字，如"富人在研究"）",
  "leftItems": ["关键词1","关键词2",...],
  "rightItems": ["关键词1","关键词2",...],
  "commonItems": ["双方都有的关键词1","关键词2",...]
}

规则：
- leftItems：A方特有的关键词，4-8个，每个2-5字
- rightItems：B方特有的关键词，4-8个，每个2-5字
- commonItems：A和B共同拥有或都会经历的概念，2-5个，每个2-5字（如"健康","时间","家庭"等）
- 三组内容之间不能重复
- 只返回JSON，不要任何其他文字`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AI_API_TOKEN = Deno.env.get("ENTER_AI_API_TOKEN");
    if (!AI_API_TOKEN) {
      return new Response(JSON.stringify({ error: "AI 服务未配置，请联系管理员" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text, type } = await req.json();
    if (!text || text.length < 10) {
      return new Response(JSON.stringify({ error: "内容太短，请输入更多文字" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = type === "nature" ? NATURE_PROMPT : SYSTEM_PROMPT;
    const maxTokens = type === "nature" ? 600 : 1200;

    const response = await fetch("https://enter.pro/code/api/v1/ai/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "z-ai/glm-5",
        messages: [
          { role: "user", content: `${systemPrompt}\n\n以下是用户输入内容：\n${text}` },
        ],
        stream: false,
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      let errMsg = `AI 服务错误 (${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) errMsg = errJson.error.message;
      } catch { /* use default */ }
      return new Response(JSON.stringify({ error: errMsg }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawContent: string = data.content?.[0]?.text ?? "";
    if (!rawContent) {
      return new Response(JSON.stringify({ error: "AI 返回内容为空，请重试" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ content: rawContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message ?? "未知错误" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
