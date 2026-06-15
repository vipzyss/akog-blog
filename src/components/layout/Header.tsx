'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion as m, AnimatePresence } from 'framer-motion';
import Magnetic from '@/components/anime/Magnetic';
import { getAdminToken, clearAdminToken, getReaderToken, clearReaderToken } from '@/lib/api';
import AuthModal from './AuthModal';

interface AuthState {
  type: 'admin' | 'reader' | null;
  username: string;
  displayName?: string;
  email?: string;
  avatar?: string;
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ type: null, username: '' });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // 检查登录状态（admin 优先，其次 reader）
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    // 先查后台 admin token
    const adminToken = getAdminToken();
    if (adminToken) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAuth({ type: 'admin', username: data.username, displayName: data.displayName, email: data.email, avatar: data.avatar });
          return;
        } else {
          clearAdminToken();
        }
      } catch {
        // ignore
      }
    }

    // 再查前台 reader token
    const readerToken = getReaderToken();
    if (readerToken) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${readerToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAuth({ type: 'reader', username: data.username, displayName: data.displayName, email: data.email, avatar: data.avatar });
          return;
        } else {
          clearReaderToken();
        }
      } catch {
        // ignore
      }
    }

    setAuth({ type: null, username: '' });
  }

  function handleLogout() {
    clearAdminToken();
    clearReaderToken();
    setAuth({ type: null, username: '' });
    setUserMenuOpen(false);
    window.location.href = '/';
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    function handler(e: MouseEvent) {
      const menu = document.getElementById('user-menu');
      const btn = document.getElementById('user-menu-btn');
      if (menu && btn && !menu.contains(e.target as Node) && !btn.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-500 ${
        scrolled
          ? 'bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-800 shadow-md'
          : 'bg-white dark:bg-gray-900 border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Magnetic strength={0.3}>
          <Link href="/" className="text-xl font-extrabold no-underline transition hover:opacity-80">
            <span className="bg-gradient-to-r from-accent to-cyan-400 bg-clip-text text-transparent">
              瞬云的尽头
            </span>
          </Link>
        </Magnetic>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="/">首页</NavLink>
          <NavLink href="/posts">文章</NavLink>
          <NavLink href="/categories">分类</NavLink>
          <NavLink href="/tags">标签</NavLink>
          <NavLink href="/guestbook">留言板</NavLink>
          <NavLink href="/about">关于</NavLink>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* 搜索按钮 */}
          <Magnetic strength={0.2}>
            <Link
              href="/search"
              className="glass-light flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:text-accent"
              title="搜索文章"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
          </Magnetic>

          {/* 登录/注册 或 用户菜单 */}
          {auth.type ? (
            <div className="relative">
              <button
                id="user-menu-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="glass-light flex h-9 w-9 items-center justify-center overflow-hidden rounded-full transition hover:ring-2 hover:ring-accent"
                title={auth.displayName || auth.username}
              >
                {auth.avatar ? (
                  <img
                    src={auth.avatar}
                    alt={auth.displayName || auth.username}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-accent/20 text-sm font-bold text-accent">
                    {(auth.displayName || auth.username)?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <m.div
                    id="user-menu"
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-gray-900 absolute right-0 mt-2 w-52 rounded-2xl border border-gray-200 dark:border-gray-800 p-2 shadow-xl"
                  >
                    <div className="border-b border-white/10 px-3 py-2">
                      <p className="text-sm font-semibold text-foreground">{auth.displayName || auth.username}</p>
                      {auth.email && (
                        <p className="truncate text-xs text-gray-500">{auth.email}</p>
                      )}
                      <p className="mt-0.5 text-xs text-accent/70">
                        {auth.type === 'admin' ? '👑 管理员' : '👤 普通用户'}
                      </p>
                    </div>
                    {auth.type === 'admin' && (
                      <>
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="block rounded-xl px-3 py-2 text-sm text-gray-600 no-underline transition hover:bg-white/10 hover:text-accent dark:text-gray-300"
                        >
                          ⚙️ 管理后台
                        </Link>
                        <Link
                          href="/admin/friend-links"
                          onClick={() => setUserMenuOpen(false)}
                          className="block rounded-xl px-3 py-2 text-sm text-gray-600 no-underline transition hover:bg-white/10 hover:text-accent dark:text-gray-300"
                        >
                          🌐 友链管理
                        </Link>
                        <Link
                          href="/admin/guestbook"
                          onClick={() => setUserMenuOpen(false)}
                          className="block rounded-xl px-3 py-2 text-sm text-gray-600 no-underline transition hover:bg-white/10 hover:text-accent dark:text-gray-300"
                        >
                          💬 留言审核
                        </Link>
                        <Link
                          href="/admin/music"
                          onClick={() => setUserMenuOpen(false)}
                          className="block rounded-xl px-3 py-2 text-sm text-gray-600 no-underline transition hover:bg-white/10 hover:text-accent dark:text-gray-300"
                        >
                          🎵 音乐管理
                        </Link>
                        <Link
                          href="/admin/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="block rounded-xl px-3 py-2 text-sm text-gray-600 no-underline transition hover:bg-white/10 hover:text-accent dark:text-gray-300"
                        >
                          ⚙️ 个人设置
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-500 no-underline transition hover:bg-red-500/10"
                    >
                      🚪 退出登录
                    </button>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 md:flex">
              <Magnetic strength={0.2}>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="glass-heavy rounded-full px-4 py-2 text-sm font-medium text-accent no-underline transition hover:bg-accent/10"
                >
                  登录 / 注册
                </button>
              </Magnetic>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="glass-light flex h-9 w-9 items-center justify-center rounded-full md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="切换菜单"
          >
            {mobileOpen ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-900 overflow-hidden border-t border-gray-200 dark:border-gray-800 md:hidden"
          >
            <nav className="flex flex-col gap-1 px-6 py-4">
              <MobileNavLink href="/" onClick={() => setMobileOpen(false)}>首页</MobileNavLink>
              <MobileNavLink href="/posts" onClick={() => setMobileOpen(false)}>文章</MobileNavLink>
              <MobileNavLink href="/categories" onClick={() => setMobileOpen(false)}>分类</MobileNavLink>
              <MobileNavLink href="/tags" onClick={() => setMobileOpen(false)}>标签</MobileNavLink>
              <MobileNavLink href="/about" onClick={() => setMobileOpen(false)}>关于</MobileNavLink>
              <MobileNavLink href="/guestbook" onClick={() => setMobileOpen(false)}>💬 留言板</MobileNavLink>
              <MobileNavLink href="/search" onClick={() => setMobileOpen(false)}>🔍 搜索</MobileNavLink>

              {auth.type === 'admin' ? (
                <>
                  <MobileNavLink href="/admin/dashboard" onClick={() => setMobileOpen(false)}>⚙️ 管理后台</MobileNavLink>
                  <MobileNavLink href="/admin/settings" onClick={() => setMobileOpen(false)}>⚙️ 个人设置</MobileNavLink>
                  <button
                    onClick={() => { handleLogout(); setMobileOpen(false); }}
                    className="rounded-xl px-4 py-3 text-left text-base font-medium text-red-500 no-underline transition hover:bg-white/10"
                  >
                    🚪 退出登录
                  </button>
                </>
              ) : auth.type === 'reader' ? (
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="rounded-xl px-4 py-3 text-left text-base font-medium text-red-500 no-underline transition hover:bg-white/10"
                >
                  🚪 退出登录
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setAuthModalOpen(true); setMobileOpen(false); }}
                    className="rounded-xl px-4 py-3 text-left text-base font-medium text-accent no-underline transition hover:bg-white/10"
                  >
                    🔐 登录 / 注册
                  </button>
                </>
              )}
            </nav>
          </m.div>
        )}
      </AnimatePresence>

      {/* 登录/注册弹窗 */}
      {authModalOpen && (
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      )}
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Magnetic strength={0.2}>
      <Link
        href={href}
        className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 no-underline transition hover:bg-white/10 hover:text-accent dark:text-gray-300"
      >
        {children}
      </Link>
    </Magnetic>
  );
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="rounded-xl px-4 py-3 text-base font-medium text-gray-700 no-underline transition hover:bg-white/10 hover:text-accent dark:text-gray-200"
    >
      {children}
    </Link>
  );
}
