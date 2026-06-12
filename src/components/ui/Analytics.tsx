'use client';

import { useEffect, useState } from 'react';

/**
 * 简易页面访问统计（写入 localStorage）
 * 对于静态站点，使用 localStorage + 简单 API 方案
 */
export function usePageView() {
  useEffect(() => {
    try {
      const key = `viewed-${window.location.pathname}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1');
        // 调用 API 增加浏览量（对于文章页面）
        const slug = window.location.pathname.replace('/posts/', '');
        if (slug && slug.length > 0) {
          fetch(`/api/posts/view?slug=${encodeURIComponent(slug)}`, { method: 'POST' });
        }
      }
    } catch {}
  }, []);
}

export default function Analytics() {
  // 简单 analytics 组件，可扩展为 Umami / Vercel Analytics
  usePageView();
  return null;
}
