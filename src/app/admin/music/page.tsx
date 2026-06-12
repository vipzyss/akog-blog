'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion as m, AnimatePresence } from 'framer-motion';
import { getAdminToken, clearAdminToken } from '@/lib/api';

interface MusicFile {
  name: string;
  title: string;
  url: string;
  size: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminMusicPage() {
  const [files, setFiles] = useState<MusicFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewFile, setPreviewFile] = useState<MusicFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const token = typeof window !== 'undefined' ? getAdminToken() : '';

  // 权限检查 + 加载数据
  useEffect(() => {
    if (!token) {
      router.push('/admin/login');
      return;
    }
    loadFiles();
  }, [token, router]);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/music');
      if (!res.ok) throw new Error('加载失败');
      setFiles(await res.json());
    } catch {
      setError('加载音乐列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 上传文件
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 客户端校验
    if (!file.name.toLowerCase().endsWith('.mp3')) {
      setError('仅支持 MP3 格式');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('文件大小不能超过 20MB');
      return;
    }

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/music', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`"${data.file.title}" 上传成功`);
        loadFiles();
      } else {
        setError(data.error || '上传失败');
      }
    } catch {
      setError('上传失败，请检查网络');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 删除文件
  const handleDelete = async (name: string) => {
    if (!confirm(`确定要删除 "${name}" 吗？此操作不可撤销。`)) return;

    setError('');
    setSuccess('');
    setDeleting(name);

    try {
      const res = await fetch(`/api/music?name=${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`"${name}" 已删除`);
        if (previewFile?.name === name) setPreviewFile(null);
        loadFiles();
      } else {
        setError(data.error || '删除失败');
      }
    } catch {
      setError('删除失败，请检查网络');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-heavy rounded-2xl p-6">
              <div className="skeleton h-4 w-48 rounded" />
              <div className="skeleton mt-2 h-3 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text-cyan">🎵 音乐管理</h1>
        <p className="mt-1 text-sm text-gray-500">
          管理网站全局音乐播放器的歌曲列表，支持 MP3 格式
        </p>
      </m.div>

      {/* 信息提示 */}
      {error && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500"
        >
          {error}
          <button onClick={() => setError('')} className="float-right text-lg leading-none opacity-50 hover:opacity-100">×</button>
        </m.div>
      )}
      {success && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-500"
        >
          {success}
          <button onClick={() => setSuccess('')} className="float-right text-lg leading-none opacity-50 hover:opacity-100">×</button>
        </m.div>
      )}

      {/* 上传区域 */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-heavy mt-6 rounded-2xl p-6"
      >
        <h2 className="mb-3 text-lg font-semibold">📤 上传音乐</h2>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,audio/mpeg"
            onChange={handleUpload}
            disabled={uploading}
            className="flex-1 text-sm text-gray-500 file:mr-3 file:rounded-xl file:border-0 file:bg-accent/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent file:transition hover:file:bg-accent/20"
          />
          {uploading && (
            <span className="text-sm text-accent animate-pulse">上传中...</span>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-400">仅支持 .mp3 格式，单个文件最大 20MB</p>
      </m.div>

      {/* 音乐列表 */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-6"
      >
        <h2 className="mb-3 text-lg font-semibold">
          🎶 当前列表
          <span className="ml-2 text-sm font-normal text-gray-400">({files.length} 首)</span>
        </h2>

        {files.length === 0 ? (
          <div className="glass-heavy rounded-2xl py-12 text-center text-gray-400">
            <p className="text-4xl">🎵</p>
            <p className="mt-3">还没有音乐，上传你的第一首歌吧</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {files.map((file, i) => (
                <m.div
                  key={file.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-heavy group flex items-center gap-3 rounded-2xl px-4 py-3"
                >
                  {/* 播放/预览按钮 */}
                  <button
                    onClick={() => setPreviewFile(previewFile?.name === file.name ? null : file)}
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent transition group-hover:bg-accent/20"
                    title={previewFile?.name === file.name ? '停止预览' : '预览播放'}
                  >
                    {previewFile?.name === file.name ? (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    ) : (
                      <svg className="ml-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    )}
                  </button>

                  {/* 歌曲信息 */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.title}</p>
                    <p className="text-xs text-gray-400">
                      {file.name} · {formatSize(file.size)}
                    </p>
                  </div>

                  {/* 删除按钮 */}
                  <button
                    onClick={() => handleDelete(file.name)}
                    disabled={deleting === file.name}
                    className="flex-shrink-0 rounded-xl px-3 py-1.5 text-xs text-red-400 opacity-0 transition hover:bg-red-500/10 group-hover:opacity-100 disabled:opacity-50"
                    title="删除"
                  >
                    {deleting === file.name ? '删除中...' : '🗑️ 删除'}
                  </button>
                </m.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </m.div>

      {/* 预览播放器 */}
      <AnimatePresence>
        {previewFile && (
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-heavy fixed bottom-6 left-1/2 z-50 w-full max-w-md -translate-x-1/2 rounded-2xl border border-white/10 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-accent">🔊 预览中</span>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-xs text-gray-400 hover:text-accent"
              >
                关闭
              </button>
            </div>
            <p className="mb-2 truncate text-sm font-medium">{previewFile.title}</p>
            <audio
              controls
              autoPlay
              className="w-full [&::-webkit-media-controls-panel]:bg-white/5 [&::-webkit-media-controls-current-time-display]:text-xs [&::-webkit-media-controls-time-remaining-display]:text-xs"
              key={previewFile.name}
            >
              <source src={previewFile.url} type="audio/mpeg" />
            </audio>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
