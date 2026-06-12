'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminToken, clearAdminToken } from '@/lib/api';

interface TokenPayload {
  userId: string;
  role: 'admin' | 'editor' | 'author' | 'reader';
  username: string;
  displayName?: string;
}

/**
 * 管理后台守卫组件
 * admin（最高管理员）和 editor（普通管理员）可进入后台
 * reader 和 author 会被重定向到登录页
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      clearAdminToken();
      router.replace('/admin/login');
      return;
    }

    try {
      const base64 = token.split('.')[1];
      const payload: TokenPayload = JSON.parse(atob(base64));

      if (payload.role !== 'admin' && payload.role !== 'editor') {
        clearAdminToken();
        router.replace('/admin/login');
        return;
      }

      setAuthorized(true);
    } catch {
      clearAdminToken();
      router.replace('/admin/login');
    } finally {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-3 text-2xl animate-pulse">🔒</div>
          <p className="text-sm text-gray-500">验证权限中...</p>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
