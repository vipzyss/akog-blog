import { NextRequest, NextResponse } from 'next/server';
import { getPostById, getPostBySlug, updatePost } from '@/lib/data';

/**
 * POST /api/posts/[id]/like — 文章点赞
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const by = searchParams.get('by') || 'id';
  
  let post = null;
  if (by === 'slug') {
    const slug = id;
    post = await getPostBySlug(slug);
  } else {
    post = await getPostById(id);
  }

  if (!post) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  }

  // 增加点赞数
  const updated = await updatePost(post.id, { likes: (post.likes || 0) + 1 });
  
  if (!updated) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    likes: updated.likes,
  });
}
