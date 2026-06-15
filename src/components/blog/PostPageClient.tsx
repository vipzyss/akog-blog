'use client';

import { useState, useEffect } from 'react';
import { motion as m } from 'framer-motion';
import PostContent from '@/components/blog/PostContent';
import TableOfContents from '@/components/blog/TableOfContents';
import CommentSection from '@/components/blog/CommentSection';
import ShareButton from '@/components/blog/ShareButton';
import RelatedPosts from '@/components/blog/RelatedPosts';
import ImageLightbox from '@/components/blog/ImageLightbox';
import FontSizeToggle from '@/components/blog/FontSizeToggle';
import PasswordGate from '@/components/blog/PasswordGate';
import Link from 'next/link';
import type { Category, Comment } from '@/lib/data';
import type { Post } from '@/lib/data';
import { estimateReadingTime, formatReadingTime } from '@/lib/reading-time';

interface Props {
  post: Post;
  category: Category | undefined;
  comments: Comment[];
  relatedPosts: Post[];
  postPassword?: string | null;
}

export default function PostPageClient({ post, category, comments, relatedPosts, postPassword }: Props) {
  const readingTime = estimateReadingTime(post.richContent || post.content);
  const [unlocked, setUnlocked] = useState(() => {
    if (!postPassword) return true;
    return sessionStorage.getItem(`post_unlock_${post.id}`) === 'true';
  });

  if (postPassword && !unlocked) {
    return <PasswordGate postId={post.id} postTitle={post.title} onUnlock={() => setUnlocked(true)} />;
  }

  // JSON-LD 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.coverImage || undefined,
    datePublished: post.publishedAt || undefined,
    dateModified: undefined,
    author: {
      '@type': 'Person',
      name: '瞬云的尽头',
    },
    publisher: {
      '@type': 'Person',
      name: '瞬云的尽头',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://akog-blog.vercel.app/posts/${post.slug}`,
    },
    wordCount: (post.richContent || post.content).replace(/<[^>]*>/g, '').length,
    timeRequired: `PT${readingTime}M`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ImageLightbox />
      <article className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* 主内容区 */}
        <div>
          {/* 面包屑导航 */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="accent-link no-underline">首页</Link>
            <span>/</span>
            {category && (
              <>
                <Link href={`/categories/${category.slug}`} className="accent-link no-underline">
                  {category.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-gray-600 dark:text-gray-300 truncate">{post.title}</span>
          </nav>

          {/* 文章头部 */}
          <header className="mb-10">
            <m.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-4 text-3xl font-extrabold leading-tight md:text-4xl"
            >
              {post.title}
            </m.h1>

            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400"
            >
              {category && (
                <Link
                  href={`/categories/${category.slug}`}
                  className="glass-light rounded-full px-3 py-1 text-xs font-medium text-accent hover:bg-accent/10 no-underline"
                >
                  {category.name}
                </Link>
              )}
              <span>
                📅 {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('zh-CN', {
                  year: 'numeric', month: 'long', day: 'numeric'
                }) : ''}
              </span>
              <span>👁️ {post.views} 次阅读</span>
              <span>❤️ {post.likes || 0} 次点赞</span>
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
                {formatReadingTime(readingTime)}
              </span>
              <ShareButton title={post.title} />
              <FontSizeToggle />
            </m.div>

            {/* 封面图 */}
            {post.coverImage && (
              <m.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                src={post.coverImage}
                alt={post.title}
                className="aspect-video w-full rounded-2xl object-cover shadow-xl"
              />
            )}
          </header>

          {/* 文章内容 */}
          <PostContent content={post.richContent || post.content} />

          {/* 点赞按钮 */}
          <div className="mt-8 flex justify-center">
            <LikeButton postId={post.id} postSlug={post.slug} initialLikes={post.likes || 0} />
          </div>

          {/* 相关文章推荐 */}
          {relatedPosts.length > 0 && (
            <>
              <hr className="my-12 border-white/10" />
              <RelatedPosts posts={relatedPosts} currentPostId={post.id} />
            </>
          )}

          {/* 评论区 */}
          <hr className="my-12 border-white/10" />
          <CommentSection postId={post.id} initialComments={comments} />
        </div>

        {/* 侧边栏 - 目录导航 */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <TableOfContents content={post.richContent || post.content} />
          </div>
        </div>
      </div>
    </article>
    </>
  );
}

// ==================== 点赞按钮组件（粒子迸发版） ====================

function LikeButton({ postId, postSlug, initialLikes }: { postId: string; postSlug: string; initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [particles, setParticles] = useState<number[]>([]);

  const handleLike = async () => {
    if (loading || liked) return;

    setLoading(true);

    // 粒子迸发
    setParticles(Array.from({ length: 12 }, (_, i) => i));
    setTimeout(() => setParticles([]), 1200);

    try {
      const res = await fetch(`/api/posts/${postId}/like?by=id`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setLikes(data.likes);
        setLiked(true);
      }
    } catch (err) {
      console.error('点赞失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleLike}
        disabled={loading || liked}
        className={`group relative flex items-center gap-2 rounded-full px-8 py-4 font-medium transition-all duration-300 ${
          liked
            ? 'bg-red-500/20 text-red-500'
            : 'glass-heavy text-gray-600 hover:bg-red-500/10 hover:text-red-500 dark:text-gray-300'
        }`}
      >
        <span
          className={`relative text-2xl transition-transform duration-300 ${
            liked ? 'scale-125' : 'group-hover:scale-110'
          }`}
        >
          {liked ? '❤️' : '🤍'}
        </span>
        <span className="text-lg">
          {liked ? '已点赞' : '点赞'}
        </span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
          {likes}
        </span>
      </button>

      {/* 粒子迸发动画 */}
      {particles.map((i) => {
        const angle = (i / particles.length) * 360;
        const distance = 60 + Math.random() * 40;
        const size = 6 + Math.random() * 8;
        return (
          <m.div
            key={i}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              x: Math.cos((angle * Math.PI) / 180) * distance,
              y: Math.sin((angle * Math.PI) / 180) * distance - 20,
              scale: 0,
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{
              width: size,
              height: size,
              borderRadius: i % 2 === 0 ? '50%' : '2px',
              background:
                i % 3 === 0
                  ? '#ef4444'
                  : i % 3 === 1
                    ? '#f97316'
                    : '#ec4899',
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </div>
  );
}
