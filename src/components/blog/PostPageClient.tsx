'use client';

import { useState } from 'react';
import { motion as m } from 'framer-motion';
import PostContent from '@/components/blog/PostContent';
import TableOfContents from '@/components/blog/TableOfContents';
import CommentSection from '@/components/blog/CommentSection';
import ShareButton from '@/components/blog/ShareButton';
import Link from 'next/link';
import type { Category, Comment } from '@/lib/data';

interface Post {
  id: string;
  title: string;
  slug: string;
  richContent: string;
  content: string;
  coverImage: string;
  categoryId: string;
  publishedAt: string | null;
  views: number;
  likes: number;
}

interface Props {
  post: Post;
  category: Category | undefined;
  comments: Comment[];
}

export default function PostPageClient({ post, category, comments }: Props) {
  return (
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
              <ShareButton title={post.title} />
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
  );
}

// ==================== 点赞按钮组件 ====================

function LikeButton({ postId, postSlug, initialLikes }: { postId: string; postSlug: string; initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(false);

  const handleLike = async () => {
    if (loading || liked) return;
    
    setLoading(true);
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
    <button
      onClick={handleLike}
      disabled={loading || liked}
      className={`group flex items-center gap-2 rounded-full px-8 py-4 font-medium transition-all duration-300 ${
        liked
          ? 'bg-red-500/20 text-red-500'
          : 'glass-heavy text-gray-600 hover:bg-red-500/10 hover:text-red-500 dark:text-gray-300'
      }`}
    >
      <span className={`text-2xl transition-transform duration-300 ${liked ? 'scale-125' : 'group-hover:scale-110'}`}>
        {liked ? '❤️' : '🤍'}
      </span>
      <span className="text-lg">
        {liked ? '已点赞' : '点赞'}
      </span>
      <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
        {likes}
      </span>
    </button>
  );
}
