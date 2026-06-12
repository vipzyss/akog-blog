'use client';

import Link from 'next/link';
import Magnetic from '@/components/anime/Magnetic';
import ScrollReveal from '@/components/anime/ScrollReveal';

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  categoryId: string;
  tagIds: string[];
  publishedAt: string | null;
  views: number;
  categoryName?: string;
}

export default function PostCard({ post, categoryName }: { post: Post; categoryName?: string }) {
  return (
    <ScrollReveal>
      <Magnetic strength={0.2} className="block h-full">
        <Link
          href={`/posts/${post.slug}`}
          className="group glass-heavy card-hover flex h-full flex-col overflow-hidden rounded-2xl no-underline transition-all duration-500 hover:border-accent/60 hover:shadow-lg hover:shadow-accent/10"
        >
          {/* 封面图区域 */}
          <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-950/40 dark:to-cyan-950/30">
            {post.coverImage ? (
              <img
                src={post.coverImage}
                alt={post.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl opacity-30 transition-opacity group-hover:opacity-50">
                📝
              </div>
            )}
            {/* 悬浮青色高亮覆盖层 */}
            <div className="pointer-events-none absolute inset-0 bg-accent/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* 类别标签 */}
            {categoryName && (
              <span className="absolute left-3 top-3 z-10 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-accent backdrop-blur-sm dark:bg-black/50">
                {categoryName}
              </span>
            )}
          </div>

          {/* 内容区 */}
          <div className="flex flex-1 flex-col p-5">
            <h3 className="mb-2 text-lg font-bold leading-snug transition-colors duration-300 group-hover:text-accent group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
              {post.title}
            </h3>
            <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {post.excerpt || '暂无摘要...'}
            </p>

            {/* 底部元信息 */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '未发布'}
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {post.views}
              </span>
            </div>
          </div>
        </Link>
      </Magnetic>
    </ScrollReveal>
  );
}
