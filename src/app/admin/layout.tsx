'use client';

import { usePathname } from 'next/navigation';
import AdminGuard from '@/components/admin/AdminGuard';

/**
 * 管理后台布局 — 所有 /admin/* 页面共享
 * /admin/login 不需要守卫，其余页面均需要管理员角色
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 登录页面不需要权限验证
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return <AdminGuard>{children}</AdminGuard>;
}
