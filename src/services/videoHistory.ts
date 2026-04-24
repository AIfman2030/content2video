import { supabase } from '../integrations/supabase/client';
import type { StyleType, GeneratedContent, NatureContent, ChineseOptions, AIOptions } from '../types/video';

export interface VideoHistoryItem {
  id: string;
  created_at: string;
  title: string;
  style: StyleType;
  cover_index: number;
  cover_url: string | null;
  video_url: string | null;
  duration_ms: number | null;
}

export interface VideoHistoryRecord extends VideoHistoryItem {
  source_text: string;
  content: GeneratedContent | null;
  nature: NatureContent | null;
  options: { chineseOptions?: ChineseOptions; aiOptions?: AIOptions } | null;
}

export interface SaveVideoParams {
  title: string;
  style: StyleType;
  sourceText: string;
  coverIndex: number;
  content?: GeneratedContent | null;
  nature?: NatureContent | null;
  options?: { chineseOptions?: ChineseOptions; aiOptions?: AIOptions } | null;
  coverUrl?: string;
  videoUrl?: string;
  durationMs?: number;
}

async function callFn<T>(action: string, init: RequestInit = {}): Promise<T> {
  const path = `video-history?action=${action}${init.body ? '' : ''}`;
  const { data, error } = await supabase.functions.invoke<T & { error?: string }>(path, init);
  if (error) throw new Error(error.message);
  if ((data as unknown as { error?: string })?.error) throw new Error((data as unknown as { error: string }).error);
  return data as T;
}

export async function saveVideo(params: SaveVideoParams): Promise<VideoHistoryRecord> {
  const res = await callFn<{ data: VideoHistoryRecord }>('save', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return res.data;
}

export async function listVideoHistory(opts: { style?: StyleType; limit?: number; offset?: number } = {}): Promise<VideoHistoryItem[]> {
  const params = new URLSearchParams();
  if (opts.style)  params.set('style', opts.style);
  if (opts.limit)  params.set('limit', String(opts.limit));
  if (opts.offset) params.set('offset', String(opts.offset));
  const qs = params.toString();
  const action = qs ? `list&${qs}` : 'list';
  const res = await callFn<{ data: VideoHistoryItem[] }>(action, { method: 'GET' });
  return res.data;
}

export async function getVideoRecord(id: string): Promise<VideoHistoryRecord> {
  const res = await callFn<{ data: VideoHistoryRecord }>(`get&id=${encodeURIComponent(id)}`, { method: 'GET' });
  return res.data;
}

export async function deleteVideoRecord(id: string): Promise<void> {
  await callFn<{ success: boolean }>(`delete&id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}
