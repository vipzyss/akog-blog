import { NextRequest } from 'next/server';
import { getPostById } from '@/lib/data';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const post = await getPostById(id);
  if (!post) {
    return Response.json({ error: '文章不存在' }, { status: 404 });
  }

  if (!post.password) {
    return Response.json({ error: '此文章无需密码' }, { status: 400 });
  }

  if (body.password === post.password) {
    return Response.json({ success: true });
  }

  return Response.json({ error: '密码错误' }, { status: 401 });
}
