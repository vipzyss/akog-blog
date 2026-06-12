import { NextRequest, NextResponse } from 'next/server';
import { getStats } from '@/lib/data';
import { getToken, verifyToken } from '@/lib/auth';

/**
 * GET /api/stats — 获取统计数据（需认证）
 */
export async function GET(req: NextRequest) {
  const token = getToken(req);
  if (!verifyToken(token)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const stats = await getStats();
  return NextResponse.json(stats);
}
