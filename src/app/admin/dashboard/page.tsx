'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getAdminToken, clearAdminToken, api } from '@/lib/api';

interface Stats {
  totalPosts: number;
  publishedPosts: number;
  pendingPosts: number;
  draftPosts: number;
  totalComments: number;
  pendingComments: number;
  totalCategories: number;
  totalTags: number;
  totalViews: number;
  recentPosts: number;
  totalUsers: number;
  totalReaders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }
    loadStats(token);
  }, [router]);

  async function loadStats(token: string) {
    try {
      const data = await api.get<Stats>('/stats', token);
      setStats(data);
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg.includes('401') || msg.includes('未授权')) {
        clearAdminToken();
        router.push('/admin/login');
        return;
      }
      setError('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    clearAdminToken();
    router.push('/');
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text-cyan">📊 管理后台</h1>
          <p className="mt-1 text-sm text-gray-500">欢迎回来，查看博客数据概览</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/posts/new"
            className="btn-premium inline-block text-sm no-underline"
          >
            ✏️ 写文章
          </Link>
          <button
            onClick={handleLogout}
            className="glass rounded-xl px-4 py-2 text-sm text-gray-500 hover:text-red-500"
          >
            退出
          </button>
        </div>
      </motion.div>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-heavy rounded-2xl p-6">
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton mt-3 h-8 w-16 rounded" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="glass rounded-xl p-6 text-center text-red-500">{error}</div>
      )}

      {stats && (
        <>
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard icon="📝" label="总文章" value={stats.totalPosts} sub={`${stats.publishedPosts} 已发布 · ${stats.draftPosts} 草稿 · ${stats.pendingPosts} 待审核`} delay={0} />
            <StatCard icon="👁️" label="总浏览" value={stats.totalViews} sub={`近 7 天 ${stats.recentPosts} 篇新文章`} delay={0.1} />
            <StatCard icon="💬" label="评论" value={stats.totalComments} sub={`${stats.pendingComments} 条待审核`} delay={0.2} />
            <StatCard icon="🏷️" label="分类/标签" value={stats.totalCategories} sub={`${stats.totalTags} 个标签`} delay={0.3} />
            <StatCard icon="👑" label="管理组" value={1} sub="仅 shunyun · 全站最高权限" delay={0.4} />
            <StatCard icon="👤" label="普通用户组" value={stats.totalReaders + (stats.totalUsers - 1)} sub="浏览 · 搜索 · 评论" delay={0.5} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin/posts" className="glass-heavy no-underline rounded-2xl p-6 card-hover">
              <h3 className="mb-2 text-lg font-semibold">📋 管理文章</h3>
              <p className="text-sm text-gray-500">查看、编辑、删除已发布的文章和草稿</p>
            </Link>
            <Link href="/admin/posts/new" className="glass-heavy no-underline rounded-2xl p-6 card-hover">
              <h3 className="mb-2 text-lg font-semibold">✍️ 撰写新文章</h3>
              <p className="text-sm text-gray-500">使用富文本编辑器创建新文章</p>
            </Link>
            <Link href="/admin/comments" className="glass-heavy no-underline rounded-2xl p-6 card-hover">
              <h3 className="mb-2 text-lg font-semibold">💬 评论管理</h3>
              <p className="text-sm text-gray-500">
                审核和管理所有评论
                {stats.pendingComments > 0 && (
                  <span className="ml-2 inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-500">
                    {stats.pendingComments} 条待审
                  </span>
                )}
              </p>
            </Link>
            <Link href="/admin/categories" className="glass-heavy no-underline rounded-2xl p-6 card-hover">
              <h3 className="mb-2 text-lg font-semibold">📂 分类管理</h3>
              <p className="text-sm text-gray-500">管理文章分类，新建、编辑或删除分类</p>
            </Link>
            <Link href="/admin/tags" className="glass-heavy no-underline rounded-2xl p-6 card-hover">
              <h3 className="mb-2 text-lg font-semibold">🏷️ 标签管理</h3>
              <p className="text-sm text-gray-500">
                管理文章标签，新建或删除标签
                <span className="ml-2 inline-block rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-bold text-cyan-500">
                  {stats.totalTags} 个
                </span>
              </p>
            </Link>
            <Link href="/admin/users" className="glass-heavy no-underline rounded-2xl p-6 card-hover">
              <h3 className="mb-2 text-lg font-semibold">👥 用户管理</h3>
              <p className="text-sm text-gray-500">
                管理组 · 普通用户组
                <span className="ml-2 inline-block rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-bold text-green-500">
                  {stats.totalUsers} 管理 + {stats.totalReaders} 用户
                </span>
              </p>
            </Link>
            <Link href="/admin/friend-links" className="glass-heavy no-underline rounded-2xl p-6 card-hover">
              <h3 className="mb-2 text-lg font-semibold">🌐 友链管理</h3>
              <p className="text-sm text-gray-500">
                管理网站友情链接
              </p>
            </Link>
            <Link href="/admin/guestbook" className="glass-heavy no-underline rounded-2xl p-6 card-hover">
              <h3 className="mb-2 text-lg font-semibold">💬 留言审核</h3>
              <p className="text-sm text-gray-500">
                审核访客留言板内容
              </p>
            </Link>
            <Link href="/admin/music" className="glass-heavy no-underline rounded-2xl p-6 card-hover">
              <h3 className="mb-2 text-lg font-semibold">🎵 音乐管理</h3>
              <p className="text-sm text-gray-500">
                管理网站全局音乐播放器的歌曲
              </p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, delay }: {
  icon: string;
  label: string;
  value: number;
  sub: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-heavy rounded-2xl p-6"
    >
      <div className="mb-2 text-2xl">{icon}</div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-bold gradient-text">{value}</div>
      <div className="mt-1 text-xs text-gray-400">{sub}</div>
    </motion.div>
  );
}
