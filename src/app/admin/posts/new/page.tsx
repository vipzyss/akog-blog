'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { getAuthToken, apiGet, apiPost, apiPut } from '@/lib/api';

const TipTapEditor = dynamic(() => import('@/components/admin/TipTapEditor'), {
  ssr: false,
  loading: () => (
    <div className="glass rounded-xl p-6 min-h-[400px] flex items-center justify-center">
      <div className="skeleton h-[400px] w-full rounded-xl" />
    </div>
  ),
});

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PostData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  richContent: string;
  coverImage: string;
  categoryId: string;
  status: 'draft' | 'published';
  publishedAt: string | null;
}

export default function NewPostPage() {
  const params = useParams();
  const editId = params?.id as string | undefined;
  const isEditing = !!editId;

  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [post, setPost] = useState<PostData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    richContent: '',
    coverImage: '',
    categoryId: '',
    status: 'draft',
    publishedAt: null,
  });

  useEffect(() => {
    loadCategories();
    if (isEditing) loadPost();
  }, [editId]);

  async function loadCategories() {
    try {
      const data = await apiGet<Category[]>('/categories');
      setCategories(data);
    } catch {}
  }

  async function loadPost() {
    const token = getAuthToken();
    if (!token) { router.push('/admin/login'); return; }
    setLoading(true);
    try {
      const data = await apiGet<PostData & { id: string }>(`/posts/${editId}`, token);
      setPost({
        title: data.title || '',
        slug: data.slug || '',
        excerpt: data.excerpt || '',
        content: data.content || '',
        richContent: data.richContent || '',
        coverImage: data.coverImage || '',
        categoryId: data.categoryId || '',
        status: data.status || 'draft',
        publishedAt: data.publishedAt || null,
      });
    } catch (err) {
      if (String(err).includes('Unauthorized')) router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  }

  /** 从标题自动生成 slug */
  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[\s]+/g, '-')
      .replace(/[^\w\u4e00-\u9fa5-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);
  }

  /** 上传封面图 */
  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setError('仅支持 JPG/PNG/GIF/WebP 格式');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB');
      return;
    }

    setUploadingCover(true);
    setError('');
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setPost((p) => ({ ...p, coverImage: data.url }));
      } else {
        setError(data.error || '上传失败');
      }
    } catch {
      setError('上传失败，请重试');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  function handleTitleChange(title: string) {
    setPost((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  }

  async function handleSave(status: 'draft' | 'published') {
    const token = getAuthToken();
    if (!token) { router.push('/admin/login'); return; }
    if (!post.title.trim()) { setError('请输入文章标题'); return; }

    setSaving(true);
    setError('');

    // 判断用户角色：editor 发布需审核，admin 直接发布
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isEditor = payload.role === 'editor';
    const finalStatus = status === 'published' && isEditor ? 'pending' : status;

    const postData = {
      ...post,
      status: finalStatus,
      slug: post.slug || generateSlug(post.title),
      publishedAt: status === 'published' && !isEditor ? (post.publishedAt || new Date().toISOString()) : post.publishedAt,
    };

    try {
      if (isEditing) {
        await apiPut(`/posts/${editId}`, postData, token);
      } else {
        await apiPost('/posts', postData, token);
      }
      // 编辑器发布时提示审核
      if (finalStatus === 'pending') {
        router.push('/admin/posts?pending=1');
      } else {
        router.push('/admin/posts');
      }
    } catch (err) {
      setError('保存失败：' + String(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="space-y-4">
          <div className="skeleton h-10 w-48 rounded" />
          <div className="skeleton h-12 w-full rounded-xl" />
          <div className="skeleton h-[500px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <h1 className="text-2xl font-bold">
          {isEditing ? '✏️ 编辑文章' : '✍️ 撰写新文章'}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="glass rounded-xl px-5 py-2 text-sm font-medium hover:text-accent disabled:opacity-50"
          >
            保存草稿
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="btn-premium text-sm disabled:opacity-50"
          >
            {saving ? '保存中...' : '发布文章'}
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* 标题 */}
        <input
          type="text"
          value={post.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="文章标题..."
          className="glass w-full rounded-xl px-5 py-4 text-2xl font-bold text-foreground outline-none placeholder-gray-300 transition focus:ring-2 focus:ring-accent"
        />

        {/* 封面图上传 */}
        <div>
          <label className="mb-1 block text-xs text-gray-400">封面图片</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="glass rounded-xl px-4 py-2.5 text-sm font-medium text-accent hover:bg-accent/10 transition disabled:opacity-50"
            >
              {uploadingCover ? '上传中...' : post.coverImage ? '更换封面' : '选择封面图片'}
            </button>
            {post.coverImage && (
              <button
                type="button"
                onClick={() => setPost((p) => ({ ...p, coverImage: '' }))}
                className="text-xs text-red-400 hover:text-red-300"
              >
                移除
              </button>
            )}
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={uploadCover}
          />
          {post.coverImage && (
            <div className="mt-2 relative inline-block">
              <img
                src={post.coverImage}
                alt="封面预览"
                className="h-32 w-56 rounded-xl object-cover shadow-md"
              />
            </div>
          )}
        </div>

        {/* 摘要 */}
        <textarea
          value={post.excerpt}
          onChange={(e) => setPost((p) => ({ ...p, excerpt: e.target.value }))}
          placeholder="文章摘要..."
          rows={2}
          className="glass w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none placeholder-gray-300 transition focus:ring-2 focus:ring-accent/50"
        />

        {/* 分类选择 */}
        <div>
          <label className="mb-1 block text-xs text-gray-400">分类</label>
          <select
            value={post.categoryId}
            onChange={(e) => setPost((p) => ({ ...p, categoryId: e.target.value }))}
            className="glass w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
          >
            <option value="">选择分类...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* 富文本编辑器 */}
        <div>
          <label className="mb-1 block text-xs text-gray-400">文章内容</label>
          <TipTapEditor
            content={post.richContent}
            onChange={(html) => setPost((p) => ({ ...p, richContent: html, content: html }))}
            draftKey={editId || 'new-post'}
          />
        </div>
      </div>
    </div>
  );
}
