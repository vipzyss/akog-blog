'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getAuthToken, getAdminToken, apiGet, apiDelete, apiPut } from '@/lib/api';

interface PostItem {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published' | 'scheduled' | 'pending';
  views: number;
  publishedAt: string | null;
  createdAt: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  async function loadPosts() {
    const token = getAuthToken();
    if (!token) { router.push('/admin/login'); return; }
    try {
      const data = await apiGet<{ posts: PostItem[] }>('/posts?status=all', token);
      setPosts(data.posts);
      // 从新文章发布跳转过来的提示
      if (searchParams.get('pending') === '1') {
        setSuccess('文章已提交，等待最高管理员审核后即可发布');
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      if (String(err).includes('401') || String(err).includes('未授权')) router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPosts(); }, []);

  // 获取当前用户角色
  const getRole = () => {
    const token = getAuthToken();
    if (!token) return null;
    try { return JSON.parse(atob(token.split('.')[1])).role; } catch { return null; }
  };

  const role = getRole();

  async function handleDelete(id: string) {
    if (!confirm('确定删除这篇文章？')) return;
    const token = getAuthToken();
    await apiDelete(`/posts?id=${id}`, token);
    loadPosts();
  }

  // 批准发布（仅最高管理员）
  async function handleApprove(id: string) {
    const token = getAdminToken();
    try {
      await apiPut(`/posts/${id}`, { status: 'published', publishedAt: new Date().toISOString() }, token);
      setSuccess('文章已批准发布');
      loadPosts();
    } catch {
      setSuccess('');
    }
  }

  const filteredPosts = (() => {
    // 编辑器只看自己的文章
    return posts;
  })();

  const pendingPosts = posts.filter(p => p.status === 'pending');
  const publishedPosts = posts.filter(p => p.status === 'published');
  const draftPosts = posts.filter(p => p.status === 'draft');

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">📋 文章管理</h1>
        <Link href="/admin/posts/new" className="btn-premium text-sm no-underline">
          ✍️ 写文章
        </Link>
      </div>

      {success && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-500"
        >
          {success}
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-heavy rounded-2xl p-5">
              <div className="skeleton h-5 w-3/4 rounded" />
              <div className="skeleton mt-2 h-3 w-1/4 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* 待审核文章 */}
          {pendingPosts.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 text-lg font-semibold text-amber-400">
                ⏳ 待审核 ({pendingPosts.length})
              </h2>
              <div className="space-y-2">
                {pendingPosts.map((p) => (
                  <div
                    key={p.id}
                    className="glass-heavy flex items-center gap-3 rounded-2xl border-l-4 border-l-amber-400 px-5 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(p.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <Link
                        href={`/posts/${p.slug}`}
                        target="_blank"
                        className="rounded-lg px-3 py-1.5 text-xs text-gray-400 transition hover:text-accent"
                      >
                        预览
                      </Link>
                      <Link
                        href={`/admin/posts/${p.id}/edit`}
                        className="rounded-lg px-3 py-1.5 text-xs text-accent transition hover:bg-accent/10"
                      >
                        编辑
                      </Link>
                      {role === 'admin' && (
                        <button
                          onClick={() => handleApprove(p.id)}
                          className="rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-500 transition hover:bg-green-500/30"
                        >
                          批准发布
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="rounded-lg px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 已发布文章 */}
          <h2 className="mb-3 text-lg font-semibold">✅ 已发布 ({publishedPosts.length})</h2>
          <div className="space-y-2">
            {publishedPosts.map((p) => (
              <div key={p.id} className="glass-heavy flex items-center gap-3 rounded-2xl px-5 py-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/posts/${p.slug}`} className="truncate font-medium no-underline hover:text-accent" target="_blank">
                    {p.title}
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{new Date(p.publishedAt || p.createdAt).toLocaleDateString('zh-CN')}</span>
                    <span>👁️ {p.views}</span>
                  </div>
                </div>
                <Link
                  href={`/admin/posts/${p.id}/edit`}
                  className="rounded-lg px-3 py-1.5 text-xs text-accent transition hover:bg-accent/10"
                >
                  编辑
                </Link>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="rounded-lg px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10"
                >
                  删除
                </button>
              </div>
            ))}
          </div>

          {/* 草稿 */}
          {draftPosts.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-lg font-semibold text-gray-400">📝 草稿 ({draftPosts.length})</h2>
              <div className="space-y-2">
                {draftPosts.map((p) => (
                  <div key={p.id} className="glass-heavy flex items-center gap-3 rounded-2xl px-5 py-4 opacity-70">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.title}</p>
                      <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('zh-CN')}</p>
                    </div>
                    <Link href={`/admin/posts/${p.id}/edit`} className="rounded-lg px-3 py-1.5 text-xs text-accent transition hover:bg-accent/10">
                      编辑
                    </Link>
                    <button onClick={() => handleDelete(p.id)} className="rounded-lg px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10">
                      删除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {posts.length === 0 && (
            <div className="glass-heavy rounded-2xl py-16 text-center text-gray-400">
              <p className="text-4xl">📝</p>
              <p className="mt-3">还没有文章，去写第一篇吧</p>
              <Link href="/admin/posts/new" className="btn-premium mt-4 inline-block text-sm no-underline">
                ✍️ 写文章
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
