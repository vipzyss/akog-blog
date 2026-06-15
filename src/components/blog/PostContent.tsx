'use client';

import { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import FileShareBlock from './FileShareBlock';

interface PostContentProps {
  content: string;
}

/** 提取文件分享块并生成渲染节点 */
function renderWithFileShare(html: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /<div\s+data-file-share\s+data-url="([^"]*)"\s+data-code="([^"]*)"\s+data-name="([^"]*)"\s*><\/div>/g;
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = regex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      const raw = html.slice(lastIndex, match.index);
      if (raw.trim()) {
        parts.push(
          <div
            key={`html-${keyIndex++}`}
            className="prose-custom"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(raw) }}
          />
        );
      }
    }

    parts.push(
      <FileShareBlock key={`share-${keyIndex++}`} url={match[1]} code={match[2]} name={match[3] || '网盘链接'} />
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < html.length) {
    const remaining = html.slice(lastIndex);
    if (remaining.trim()) {
      parts.push(
        <div key={`html-${keyIndex}`} className="prose-custom" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(remaining) }} />
      );
    }
  }

  return parts;
}

export default function PostContent({ content }: PostContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sanitizedHtml = useMemo(() => DOMPurify.sanitize(content), [content]);
  const hasFileShare = content.includes('data-file-share');

  // 渲染后给标题设置 ID，供 TOC 跳转
  useEffect(() => {
    if (!containerRef.current) return;
    const headings = containerRef.current.querySelectorAll('h1, h2, h3');
    headings.forEach((h, i) => {
      if (!h.id) h.id = `heading-${i}`;
    });
  }, [content]);

  // 代码语法高亮
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
  }, [content]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="glass-heavy rounded-2xl p-6 md:p-10"
    >
      {hasFileShare ? (
        renderWithFileShare(sanitizedHtml)
      ) : (
        <div className="prose-custom" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
      )}
    </motion.div>
  );
}
