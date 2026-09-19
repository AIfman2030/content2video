import type { GeneratedContent } from '../types/video';

const tidy = (value: string) => value.replace(/\s+/g, '').replace(/[，、；]+$/g, '');

function labelFor(text: string): string {
  if (/考勤|下班/.test(text)) return '死盯时间';
  if (/卫生/.test(text)) return '大抓卫生';
  if (/着装/.test(text)) return '检查着装';
  if (/开会|纪律/.test(text)) return '严抓会纪';
  if (/日报|周报|月报/.test(text)) return '层层报表';
  if (/文档|格式|标点/.test(text)) return '抠字眼';
  if (/口号/.test(text)) return '只听口号';
  if (/99%|草包|三条/.test(text)) return '结论来了';
  if (/希望|领导/.test(text)) return '最后一问';
  return text.slice(0, 6);
}

/** Local, deterministic storyboard splitting: no LLM/image tokens are consumed. */
export function parseStickmanContent(input: string): GeneratedContent {
  const text = input.replace(/\r/g, '').trim();
  const first = tidy(text.split(/[，。！？!?]/)[0] || '观点观察');
  const title = first.length > 18 ? first.slice(0, 18) : first;
  const normalized = text
    .replace(/抓日报[、，]周报[、，]月报/g, '抓日报周报月报')
    .replace(/如果占了三条[，,]?/g, '如果占了三条，')
    .replace(/那他有99%的概率就是个草包/g, '99%的概率就是个草包');
  const clauses = normalized
    .split(/[，、。！？!?；;]+/)
    .map(tidy)
    .filter(Boolean)
    .filter((part, index) => index > 0 || part !== first);

  const points: GeneratedContent['points'] = [];
  for (let i = 0; i < clauses.length && points.length < 12; i++) {
    let clause = clauses[i]
      .replace(/^就看他上任后是不是/, '')
      .replace(/^是不是/, '')
      .replace(/^那他有/, '');
    if (!clause) continue;
    if (clause === '如果占了三条' && clauses[i + 1]?.includes('99%')) {
      clause = `${clause}，${clauses[++i]}`;
    }
    const narration = /^(如果|希望|99%)/.test(clause) ? clause : `他上任后${clause}`;
    points.push({
      label: labelFor(clause),
      short: clause.replace(/^抓/, '').slice(0, 16),
      desc: narration,
      formatted: narration,
    });
  }
  if (!points.length) {
    points.push({ label: '观点观察', short: title, desc: text, formatted: text });
  }
  return { title, points };
}
