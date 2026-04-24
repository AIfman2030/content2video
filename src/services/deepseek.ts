import type { GeneratedContent, NatureContent } from '../types/video';
import { supabase } from '../integrations/supabase/client';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseJsonFromAI(raw: string): unknown {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
  return JSON.parse(jsonStr);
}

async function callAI(text: string, type: 'general' | 'nature'): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-extract-1876af', {
    body: { text, type },
  });
  if (error) throw new Error(error.message || '网络错误，请重试');
  if (data?.error) throw new Error(data.error);
  if (!data?.content) throw new Error('AI 返回内容为空，请重试');
  return data.content as string;
}

// ── Kept for backward compatibility (no longer needed with Enter Cloud AI) ───
export function getStoredApiKey(): string { return 'enter-cloud'; }
export function setStoredApiKey(_key: string) { /* no-op */ }

// ── Main exports ──────────────────────────────────────────────────────────────

export async function extractContent(text: string): Promise<GeneratedContent> {
  if (text.length < 20) throw new Error('内容太短，请输入至少20个字符');
  if (text.length > 8000) throw new Error('内容过长，请控制在8000字以内');

  const raw = await callAI(text, 'general');

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

  const raw = await callAI(text, 'nature');

  let parsed: NatureContent;
  try { parsed = parseJsonFromAI(raw) as NatureContent; }
  catch { throw new Error('AI 返回格式错误，请重试'); }

  if (!parsed.title || !Array.isArray(parsed.leftItems) || !Array.isArray(parsed.rightItems)) {
    throw new Error('AI 返回数据不完整，请重试');
  }
  return parsed;
}
