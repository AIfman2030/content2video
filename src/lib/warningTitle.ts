export function parseWarningTitle(title: string): { kicker: string; headline: string; display: string } {
  const clean = title.replace(/\s+/g, ' ').trim() || '困住普通人的四大陷阱';
  const parts = clean.split(/[｜|丨\n]/).map(part => part.trim()).filter(Boolean);
  const chars = Array.from(clean.replace(/[｜|丨]/g, ''));
  const kicker = Array.from(parts[0] ?? '').length === 4
    ? parts[0]
    : chars.slice(0, 4).join('');
  const suppliedHeadline = parts.length > 1 ? parts.slice(1).join('') : chars.slice(4).join('');
  const headlineChars = Array.from(suppliedHeadline);
  const headline = headlineChars.length >= 5
    ? headlineChars.slice(0, 8).join('')
    : `${suppliedHeadline}值得牢记`.slice(0, 8);
  return { kicker, headline, display: `${kicker} ${headline}`.trim() };
}
