'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet } from '@/lib/api';
import ScrollReveal from '@/components/anime/ScrollReveal';

interface PostResult {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  categoryId: string;
  publishedAt: string | null;
  views: number;
}

interface SearchResponse {
  posts: PostResult[];
  pagination: { total: number };
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PostResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const data = await apiGet<SearchResponse>(`/posts?q=${encodeURIComponent(q)}&status=published`);
      setResults(data.posts);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 输入时自动搜索（防抖）
  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <ScrollReveal className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-bold gradient-text-cyan">🔍 搜索文章</h1>
        <p className="text-gray-500">输入关键词查找你感兴趣的内容</p>
      </ScrollReveal>

      {/* 搜索框 */}
      <div className="glass-heavy mx-auto mb-10 flex max-w-xl items-center gap-3 rounded-2xl p-3">
        <svg className="ml-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索文章标题或摘要..."
          className="flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="mr-2 rounded-full p-1 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 结果 */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-heavy rounded-2xl p-5">
                <div className="skeleton mb-2 h-5 w-3/4 rounded" />
                <div className="skeleton h-3 w-full rounded" />
              </div>
            ))}
          </motion.div>
        )}

        {!loading && searched && results.length === 0 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-12 text-center text-gray-400"
          >
            没有找到相关文章 🤔 换个关键词试试？
          </motion.p>
        )}

        {!loading && results.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <p className="mb-4 text-sm text-gray-500">
              找到 <span className="font-semibold text-accent">{results.length}</span> 篇文章
            </p>
            {results.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/posts/${post.slug}`}
                  className="glass-heavy group flex gap-4 rounded-2xl p-5 no-underline transition hover:border-accent/40"
                >
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 text-2xl dark:from-cyan-950/40 dark:to-blue-950/30">
                    📄
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 truncate font-semibold transition group-hover:text-accent">
                      {post.title}
                    </h3>
                    <p className="line-clamp-2 text-sm text-gray-500">{post.excerpt}</p>
                    <div className="mt-2 flex gap-3 text-xs text-gray-400">
                      {post.publishedAt && (
                        <span>{new Date(post.publishedAt).toLocaleDateString('zh-CN')}</span>
                      )}
                      <span>👁 {post.views}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
