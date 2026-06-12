import { NextRequest, NextResponse } from 'next/server';
import { getTags, createTag, deleteTag } from '@/lib/data';
import { getToken, verifyToken } from '@/lib/auth';

/**
 * GET /api/tags — 获取所有标签
 * POST /api/tags — 新建标签（需认证）
 * DELETE /api/tags?id=xxx — 删除标签（需认证）
 */

export async function GET() {
  const tags = await getTags();
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const token = getToken(req);
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: '仅最高管理员可操作' }, { status: 403 });
  }

  const body = await req.json();
  const tag = await createTag({
    name: body.name,
    slug: body.slug || body.name?.toLowerCase().replace(/\s+/g, '-'),
  });

  return NextResponse.json(tag, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const token = getToken(req);
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: '仅最高管理员可操作' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: '缺少标签 ID' }, { status: 400 });
  }

  await deleteTag(id);
  return NextResponse.json({ success: true });
}
