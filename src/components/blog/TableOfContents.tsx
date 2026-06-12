'use client';

import { useState, useEffect } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TocProps {
  content: string;
}

export default function TableOfContents({ content }: TocProps) {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // 解析内容中的标题，与 PostContent 中 useEffect 设置的 ID 对应
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const headings = tempDiv.querySelectorAll('h1, h2, h3');
    const items: TocItem[] = [];
    headings.forEach((heading, index) => {
      items.push({
        id: `heading-${index}`,
        text: heading.textContent || '',
        level: heading.tagName === 'H1' ? 1 : heading.tagName === 'H2' ? 2 : 3,
      });
    });
    setToc(items);
  }, [content]);

  // 用 IntersectionObserver 监听真实的 DOM headings
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' },
    );

    // 等 PostContent 渲染完成后查找 headings
    const timer = setTimeout(() => {
      const headings = document.querySelectorAll('h1[id^="heading-"], h2[id^="heading-"], h3[id^="heading-"]');
      headings.forEach((h) => observer.observe(h));
    }, 300);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [content]);

  if (toc.length === 0) return null;

  return (
    <nav className="glass-heavy rounded-2xl p-6">
      <h3 className="mb-4 text-lg font-bold">📑 目录</h3>
      <ul className="space-y-2">
        {toc.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(item.id);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`block py-1 text-sm transition hover:text-accent ${
                item.level === 3 ? 'ml-4' : ''
              } ${
                activeId === item.id
                  ? 'font-semibold text-accent'
                  : 'text-gray-500'
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
