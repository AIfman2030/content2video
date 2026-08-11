import type { GeneratedContent } from '../types/video';

export interface KnowledgeQualityIssue {
  pointIndex?: number;
  message: string;
}

export function validateKnowledgeContent(content: GeneratedContent): KnowledgeQualityIssue[] {
  const issues: KnowledgeQualityIssue[] = [];
  if (!content.title.trim()) issues.push({ message: '视频标题不能为空' });
  if (content.title.trim().length > 24) issues.push({ message: '视频标题超过24字，请拆成更短的知识钩子' });
  if (content.points.length === 0) issues.push({ message: '至少需要1条知识内容' });
  if (content.points.length > 16) issues.push({ message: '最多支持16条内容，请拆分为上下集' });

  content.points.forEach((point, index) => {
    const number = index + 1;
    if (!point.label.trim()) issues.push({ pointIndex: index, message: `第${number}条缺少关键词` });
    if (!point.short.trim() && !point.desc.trim()) issues.push({ pointIndex: index, message: `第${number}条缺少讲解内容` });
    if (point.label.trim().length > 18) issues.push({ pointIndex: index, message: `第${number}条关键词超过18字，会影响可读性` });
    if (point.short.trim().length > 34) issues.push({ pointIndex: index, message: `第${number}条短句超过34字，请拆到详细说明` });
    if (point.desc.trim().length > 96) issues.push({ pointIndex: index, message: `第${number}条说明超过96字，请自动分页或精简` });
    if (point.mediaUrl && !/^(https?:\/\/|data:image\/)/.test(point.mediaUrl)) {
      issues.push({ pointIndex: index, message: `第${number}条截图地址无效，请使用HTTPS地址或图片数据` });
    }
    if (point.source && !point.verifiedAt) issues.push({ pointIndex: index, message: `第${number}条已有来源，但缺少核验日期` });
    if (point.verifiedAt && !point.source) issues.push({ pointIndex: index, message: `第${number}条已有核验日期，但缺少来源` });
    if (point.verifiedAt && !/^\d{4}-\d{2}-\d{2}$/.test(point.verifiedAt)) {
      issues.push({ pointIndex: index, message: `第${number}条核验日期应为YYYY-MM-DD` });
    }
  });
  return issues;
}
