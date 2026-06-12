import { NextRequest, NextResponse } from 'next/server';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/data';
import { getToken, verifyToken } from '@/lib/auth';

/** 仅最高管理员 */
function requireAdmin(req: NextRequest): NextResponse | null {
  const token = getToken(req);
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: '仅最高管理员可操作' }, { status: 403 });
  }
  return null;
}

export async function GET() {
  return NextResponse.json(await getCategories());
}

export async function POST(req: NextRequest) {
  const err = requireAdmin(req);
  if (err) return err;
  const cat = await createCategory(await req.json());
  return NextResponse.json(cat);
}

export async function PUT(req: NextRequest) {
  const err = requireAdmin(req);
  if (err) return err;
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: '缺少分类 ID' }, { status: 400 });
  const cat = await updateCategory(body.id, body);
  if (!cat) return NextResponse.json({ error: '未找到该分类' }, { status: 404 });
  return NextResponse.json(cat);
}

export async function DELETE(req: NextRequest) {
  const err = requireAdmin(req);
  if (err) return err;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少分类 ID' }, { status: 400 });
  await deleteCategory(id);
  return NextResponse.json({ success: true });
}
