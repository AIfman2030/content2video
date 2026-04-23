import type { GeneratedContent } from '../types/video';

const DEEPSEEK_API_KEY = 'sk-03b7389365fc45aa9964e9378d3c45b9';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

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

export async function extractContent(text: string): Promise<GeneratedContent> {
  if (text.length < 20) {
    throw new Error('内容太短，请输入至少20个字符');
  }
  if (text.length > 8000) {
    throw new Error('内容过长，请控制在8000字以内');
  }

  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API 未配置，请联系站长');
  }

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        temperature: 0.3,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
      }),
    });
  } catch {
    throw new Error('网络错误，请重试');
  }

  if (!response.ok) {
    throw new Error(`DeepSeek API 错误: ${response.status}`);
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error('AI返回内容为空');
  }

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) ||
    rawContent.match(/(\{[\s\S]*\})/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawContent.trim();

  let parsed: GeneratedContent;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('AI返回格式错误，请重试');
  }

  if (!parsed.title || !Array.isArray(parsed.points) || parsed.points.length === 0) {
    throw new Error('AI返回数据格式不符合要求，请重试');
  }

  return parsed;
}
