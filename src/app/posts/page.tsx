'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiGet } from '@/lib/api';
import PostCard from '@/components/blog/PostCard';
import ScrollReveal from '@/components/anime/ScrollReveal';

interface PostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  categoryId: string | null;
  tagIds: string[];
  publishedAt: string | null;
  views: number;
  categoryName?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PostsResponse {
  posts: PostSummary[];
  pagination: { page: number; total: number; totalPages: number };
}

export default function PostsPage() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Category[]>('/categories').then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('status', 'published');
    params.set('page', String(page));
    params.set('limit', '9');
    if (activeCategory) params.set('category', activeCategory);

    apiGet<PostsResponse>(`/posts?${params}`)
      .then((data) => {
        setPosts(data.posts);
        setTotalPages(data.pagination.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, activeCategory]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <ScrollReveal className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-bold gradient-text-cyan">📝 全部文章</h1>
        <p className="text-gray-500">浏览所有已发布的文章</p>
      </ScrollReveal>

      {/* 分类筛选 */}
      <ScrollReveal className="mb-10 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => { setActiveCategory(''); setPage(1); }}
          className={`rounded-full px-5 py-2 text-sm font-medium transition ${
            !activeCategory
              ? 'bg-accent text-white shadow-lg shadow-accent/30'
              : 'glass-light hover:text-accent'
          }`}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); setPage(1); }}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              activeCategory === cat.id
                ? 'bg-accent text-white shadow-lg shadow-accent/30'
                : 'glass-light hover:text-accent'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </ScrollReveal>

      {/* 文章网格 */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-heavy rounded-2xl p-4">
              <div className="skeleton mb-3 aspect-[16/10] rounded-xl" />
              <div className="skeleton mb-2 h-5 w-3/4 rounded" />
              <div className="skeleton h-3 w-full rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="py-16 text-center text-gray-400">这个分类下还没有文章 📝</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} categoryName={post.categoryName} />
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 flex justify-center gap-2"
        >
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`glass-light h-10 w-10 rounded-full text-sm font-medium transition ${
                page === i + 1 ? 'bg-accent text-white' : 'hover:text-accent'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
