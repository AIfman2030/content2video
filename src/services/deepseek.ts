import type { GeneratedContent, NatureContent } from '../types/video';

const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const LS_KEY = 'deepseek_api_key';

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
  "leftTitle": "A方标签（3-8字，如'穷人在想'）",
  "rightTitle": "B方标签（3-8字，如'富人在研究'）",
  "leftItems": ["关键词1","关键词2"],
  "rightItems": ["关键词1","关键词2"],
  "commonItems": ["双方都有的关键词1","关键词2"]
}

规则：
- leftItems：A方特有的关键词，4-8个，每个2-5字
- rightItems：B方特有的关键词，4-8个，每个2-5字
- commonItems：A和B共同拥有或都会经历的概念，2-5个，每个2-5字（如"健康","时间","家庭"等）
- 三组内容之间不能重复
- 只返回JSON，不要任何其他文字`;

export function getStoredApiKey(): string {
  try { return localStorage.getItem(LS_KEY) ?? ''; }
  catch { return ''; }
}

export function setStoredApiKey(key: string) {
  try { localStorage.setItem(LS_KEY, key); }
  catch { /* ignore */ }
}

function parseJsonFromAI(raw: string): unknown {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  const jsonStr = match ? match[1].trim() : raw.trim();
  return JSON.parse(jsonStr);
}

async function callDeepSeek(systemPrompt: string, userText: string, maxTokens: number): Promise<string> {
  const apiKey = getStoredApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      temperature: 0.3,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `API 错误 (${res.status})`);
  }
  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('AI 返回内容为空，请重试');
  return content;
}

export async function extractContent(text: string): Promise<GeneratedContent> {
  if (text.length < 20) throw new Error('内容太短，请输入至少20个字符');
  if (text.length > 8000) throw new Error('内容过长，请控制在8000字以内');

  const raw = await callDeepSeek(SYSTEM_PROMPT, text, 1200);

  let parsed: GeneratedContent;
  try { parsed = parseJsonFromAI(raw) as GeneratedContent; }
  catch { throw new Error('AI 返回格式错误，请重试'); }

  if (!parsed.title || !Array.isArray(parsed.points) || parsed.points.length === 0) {
    throw new Error('AI 返回数据不完整，请重试');
  }
  return parsed;
}

export async function extractNatureContent(text: string): Promise<NatureContent> {
  if (text.length < 10) throw new Error('内容太短');

  const raw = await callDeepSeek(NATURE_PROMPT, text, 600);

  let parsed: NatureContent;
  try { parsed = parseJsonFromAI(raw) as NatureContent; }
  catch { throw new Error('AI 返回格式错误，请重试'); }

  if (!parsed.title || !Array.isArray(parsed.leftItems) || !Array.isArray(parsed.rightItems)) {
    throw new Error('AI 返回数据不完整，请重试');
  }
  return parsed;
}
