import { NextRequest, NextResponse } from 'next/server';
import { incrementViews } from '@/lib/data';

/**
 * POST /api/posts/view?slug=xxx
 * 增加文章浏览量（同一 IP 对同一文章不重复计数）
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: '缺少文章别名' }, { status: 400 });

  // 提取客户端真实 IP
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  await incrementViews(slug, ip);
  return NextResponse.json({ success: true });
}
