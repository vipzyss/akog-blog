/**
 * 估算中英文混合文本的阅读时间
 * 中文阅读速度 ~250 字/分钟，英文 ~150 词/分钟
 */
export function estimateReadingTime(text: string): number {
  if (!text) return 1;

  // 去 HTML 标签
  const plain = text.replace(/<[^>]*>/g, '');

  // 中文字符
  const cnChars = (plain.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;

  // 英文单词 (非中日韩字符)
  const enText = plain.replace(/[\u4e00-\u9fff\u3400-\u4dbf\s]/g, ' ').trim();
  const enWords = enText ? enText.split(/\s+/).length : 0;

  // 总阅读时间 (分钟)
  const cnMinutes = cnChars / 250;
  const enMinutes = enWords / 150;

  const total = cnMinutes + enMinutes;
  return Math.max(1, Math.ceil(total));
}

/** 格式化阅读时间字符串 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return '不到 1 分钟';
  return `约 ${minutes} 分钟`;
}
