'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Magnetic from '@/components/anime/Magnetic';
import { api, getAdminToken } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  
  // 表单状态
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    bio: '',
    avatar: '',
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await api.get('/auth/me', getAdminToken());
        setAuthState(data);
        setForm({
          displayName: data.displayName || data.username || '',
          email: data.email || '',
          bio: data.bio || '',
          avatar: data.avatar || '',
        });
      } catch (err: any) {
        router.push('/admin/login');
      }
    };
    checkAuth();
  }, [router]);

  // 上传头像
  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingAvatar(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAdminToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm(f => ({ ...f, avatar: data.url }));
      } else {
        setError(data.error || '上传失败');
      }
    } catch {
      setError('上传失败，请重试');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // 更新个人资料
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await api.put('/auth/me', {
        displayName: form.displayName,
        email: form.email,
        bio: form.bio,
        avatar: form.avatar,
      }, getAdminToken());
      setAuthState(data.user);
      setSuccess('个人资料更新成功！');
    } catch (err: any) {
      setError(err.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('新密码至少需要 6 个字符');
      return;
    }

    setLoading(true);

    try {
      await api.put('/auth/me/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }, getAdminToken());
      setSuccess('密码修改成功！');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.message || '密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  if (!authState) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-heavy rounded-2xl px-8 py-6">
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <nav className="glass-heavy sticky top-0 z-50 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-xl font-black">
                <span className="bg-gradient-to-r from-accent to-cyan-400 bg-clip-text text-transparent">
                  瞬云的尽头
                </span>
              </Link>
              <span className="text-sm text-gray-400">/ 个人设置</span>
            </div>
            <Link href="/admin/dashboard" className="text-sm text-gray-400 hover:text-accent">
              ← 返回仪表盘
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black">个人设置</h1>
          <p className="mt-2 text-gray-400">管理你的个人资料和账户安全</p>
        </motion.div>

        {/* Tab 切换 */}
        <div className="mb-8 flex gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`rounded-xl px-6 py-3 font-medium transition ${
              activeTab === 'profile'
                ? 'bg-accent text-white'
                : 'glass hover:bg-accent/10'
            }`}
          >
            👤 个人资料
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`rounded-xl px-6 py-3 font-medium transition ${
              activeTab === 'password'
                ? 'bg-accent text-white'
                : 'glass hover:bg-accent/10'
            }`}
          >
            🔒 修改密码
          </button>
        </div>

        {/* 提示信息 */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 rounded-xl bg-red-500/10 px-4 py-3 text-center text-sm text-red-500"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 rounded-xl bg-green-500/10 px-4 py-3 text-center text-sm text-green-500"
          >
            {success}
          </motion.div>
        )}

        {/* 个人资料标签页 */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-heavy rounded-3xl p-8"
          >
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {/* 头像 */}
              <div>
                <label className="mb-2 block text-sm font-medium">头像</label>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={uploadAvatar}
                />
                <div className="flex items-center gap-4">
                  {form.avatar ? (
                    <img
                      src={form.avatar}
                      alt="头像预览"
                      className="h-20 w-20 rounded-full object-cover ring-2 ring-accent/30"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-2xl text-accent">
                      {authState.displayName?.[0]?.toUpperCase() || authState.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="glass rounded-xl px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent/10 disabled:opacity-50"
                    >
                      {uploadingAvatar ? '上传中...' : form.avatar ? '更换头像' : '上传头像'}
                    </button>
                    {form.avatar && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, avatar: '' }))}
                        className="ml-2 text-xs text-red-400 hover:text-red-300"
                      >
                        移除
                      </button>
                    )}
                    <p className="mt-1 text-xs text-gray-400">支持 JPG/PNG/GIF/WebP，最大 5MB</p>
                  </div>
                </div>
              </div>

              {/* 显示名称 */}
              <div>
                <label className="mb-2 block text-sm font-medium">显示名称</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  className="glass w-full rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-accent"
                  placeholder="支持中文的显示名称"
                />
                <p className="mt-1 text-xs text-gray-500">
                  这是别人看到的名字，可以包含中文
                </p>
              </div>

              {/* 用户名（只读） */}
              <div>
                <label className="mb-2 block text-sm font-medium">用户名（登录标识符）</label>
                <input
                  type="text"
                  value={authState.username}
                  disabled
                  className="glass w-full cursor-not-allowed rounded-xl px-4 py-3 text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  用户名是英文登录标识符，创建后不可修改
                </p>
              </div>

              {/* 邮箱 */}
              <div>
                <label className="mb-2 block text-sm font-medium">邮箱</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="glass w-full rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-accent"
                  placeholder="your@email.com"
                />
              </div>

              {/* 个人简介 */}
              <div>
                <label className="mb-2 block text-sm font-medium">个人简介</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={4}
                  className="glass w-full rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-accent"
                  placeholder="简单介绍一下自己..."
                />
              </div>

              {/* 提交按钮 */}
              <Magnetic>
                <button
                  type="submit"
                  disabled={loading}
                  className="glass-heavy w-full rounded-xl py-3 font-semibold text-accent transition hover:bg-accent/10 disabled:opacity-50"
                >
                  {loading ? '保存中...' : '💾 保存修改'}
                </button>
              </Magnetic>
            </form>
          </motion.div>
        )}

        {/* 修改密码标签页 */}
        {activeTab === 'password' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-heavy rounded-3xl p-8"
          >
            <form onSubmit={handlePasswordChange} className="space-y-6">
              {/* 当前密码 */}
              <div>
                <label className="mb-2 block text-sm font-medium">当前密码</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="glass w-full rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-accent"
                  placeholder="请输入当前密码"
                  required
                />
              </div>

              {/* 新密码 */}
              <div>
                <label className="mb-2 block text-sm font-medium">新密码</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="glass w-full rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-accent"
                  placeholder="至少 6 个字符"
                  required
                />
              </div>

              {/* 确认新密码 */}
              <div>
                <label className="mb-2 block text-sm font-medium">确认新密码</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="glass w-full rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-accent"
                  placeholder="再次输入新密码"
                  required
                />
              </div>

              {/* 提交按钮 */}
              <Magnetic>
                <button
                  type="submit"
                  disabled={loading}
                  className="glass-heavy w-full rounded-xl py-3 font-semibold text-accent transition hover:bg-accent/10 disabled:opacity-50"
                >
                  {loading ? '修改中...' : '🔒 修改密码'}
                </button>
              </Magnetic>
            </form>
          </motion.div>
        )}
      </main>
    </div>
  );
}
