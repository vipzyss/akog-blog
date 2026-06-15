'use client';

import Link from 'next/link';
import type { Post } from '@/lib/data';
import ScrollReveal from '@/components/anime/ScrollReveal';
import { estimateReadingTime, formatReadingTime } from '@/lib/reading-time';

interface Props {
  posts: Post[];
  currentPostId: string;
}

export default function RelatedPosts({ posts, currentPostId }: Props) {
  const filtered = posts.filter((p) => p.id !== currentPostId).slice(0, 3);

  if (filtered.length === 0) return null;

  return (
    <section>
      <ScrollReveal>
        <h2 className="mb-6 text-xl font-bold gradient-text-cyan inline-block">
          相关文章
        </h2>
      </ScrollReveal>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post, i) => (
          <ScrollReveal key={post.id} delay={i * 0.08}>
            <Link
              href={`/posts/${post.slug}`}
              className="group glass-light block overflow-hidden rounded-2xl no-underline transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 hover:border-accent/40 border border-transparent"
            >
              {/* 封面图 */}
              <div className="aspect-[16/9] overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-950/30 dark:to-cyan-950/20">
                {post.coverImage ? (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl opacity-30">
                    📝
                  </div>
                )}
              </div>

              {/* 信息区 */}
              <div className="p-4">
                <h3 className="mb-2 text-sm font-bold leading-snug line-clamp-2 transition-colors group-hover:text-accent">
                  {post.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('zh-CN')
                      : ''}
                  </span>
                  <span>·</span>
                  <span>{formatReadingTime(estimateReadingTime(post.richContent || post.content))}</span>
                </div>
              </div>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
