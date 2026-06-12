'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthToken, apiGet, apiDelete, clearAuthToken } from '@/lib/api';

interface Comment {
  id: string;
  postId: string;
  author: string;
  email: string;
  content: string;
  approved: boolean;
  createdAt: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
}

export default function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [tab, setTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const router = useRouter();

  const token = typeof window !== 'undefined' ? getAuthToken() : '';

  const loadData = useCallback(async () => {
    if (!token) { router.push('/admin/login'); return; }
    try {
      const [commentData, postData] = await Promise.all([
        apiGet<Comment[]>('/comments', token),
        apiGet<{ posts: Post[] }>('/posts?limit=999'),
      ]);
      setComments(commentData || []);
      setPosts(postData?.posts || []);
    } catch (err) {
      if (String(err).includes('401') || String(err).includes('未授权')) {
        clearAuthToken();
        router.push('/admin/login');
        return;
      }
      setError('加载评论数据失败');
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => { loadData(); }, [loadData]);

  const getPostTitle = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    return post ? post.title : '未知文章';
  };

  const handleApprove = async (id: string) => {
    try {
      await fetch(`/api/comments?id=${id}&action=approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, approved: true } : c))
      );
      setActionMsg('✅ 评论已审核通过');
      setTimeout(() => setActionMsg(''), 2000);
    } catch {
      setActionMsg('❌ 操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条评论？')) return;
    try {
      await apiDelete(`/comments?id=${id}`, token);
      setComments((prev) => prev.filter((c) => c.id !== id));
      setActionMsg('🗑️ 评论已删除');
      setTimeout(() => setActionMsg(''), 2000);
    } catch {
      setActionMsg('❌ 删除失败');
    }
  };

  const filteredComments = comments.filter((c) => {
    if (tab === 'pending') return !c.approved;
    if (tab === 'approved') return c.approved;
    return true;
  });

  const pendingCount = comments.filter((c) => !c.approved).length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold gradient-text-cyan">💬 评论管理</h1>
        <p className="mt-1 text-sm text-gray-500">
          审核和管理所有评论
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-500">
              {pendingCount} 条待审
            </span>
          )}
        </p>
      </motion.div>

      {actionMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass mb-4 rounded-xl px-4 py-3 text-center text-sm font-medium"
        >
          {actionMsg}
        </motion.div>
      )}

      {/* Tab 切换 */}
      <div className="mb-6 flex gap-2">
        {(['pending', 'approved', 'all'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              tab === t
                ? 'bg-accent text-white shadow-lg shadow-accent/30'
                : 'glass text-gray-500 hover:text-foreground'
            }`}
          >
            {t === 'pending' ? `⏳ 待审核 (${pendingCount})` : t === 'approved' ? '✅ 已通过' : '📋 全部'}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-heavy rounded-2xl p-6">
              <div className="skeleton mb-2 h-4 w-40 rounded" />
              <div className="skeleton h-10 w-full rounded" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="glass rounded-xl p-6 text-center text-red-500">{error}</div>
      )}

      {!loading && filteredComments.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">
            {tab === 'pending' ? '🎉' : '💬'}
          </p>
          <p className="text-gray-500">
            {tab === 'pending' ? '没有待审核的评论' : '还没有任何评论'}
          </p>
        </div>
      )}

      <AnimatePresence>
        <div className="space-y-3">
          {filteredComments.map((comment, i) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.04 }}
              className={`glass-heavy rounded-2xl p-5 ${
                !comment.approved ? 'ring-1 ring-amber-500/30' : ''
              }`}
            >
              <div className="mb-2 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-bold text-white">
                      {comment.author.charAt(0)}
                    </span>
                    <span className="text-sm font-semibold">{comment.author}</span>
                    {comment.email && (
                      <span className="text-xs text-gray-400">{comment.email}</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(comment.createdAt).toLocaleDateString('zh-CN', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-accent/80">
                    文章：{getPostTitle(comment.postId)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {!comment.approved && (
                    <button
                      onClick={() => handleApprove(comment.id)}
                      className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-500 transition-colors hover:bg-green-500/20"
                    >
                      通过
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
                  >
                    删除
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {comment.content}
              </p>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
