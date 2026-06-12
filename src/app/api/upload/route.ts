import { NextRequest, NextResponse } from 'next/server';
import { getToken, verifyToken } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/** POST /api/upload — 上传图片（需认证），返回可公开访问的 URL */
export async function POST(request: NextRequest) {
  const token = getToken(request);
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  // 确保上传目录存在
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '未选择文件' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '仅支持 JPG/PNG/GIF/WebP 格式' }, { status: 400 });
    }

    // 最高管理员 (admin) 可上传 20MB，其余用户 5MB
    const maxSize = payload.role === 'admin' ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const limit = payload.role === 'admin' ? '20MB' : '5MB';
      return NextResponse.json({ error: `图片大小不能超过 ${limit}` }, { status: 400 });
    }

    // 生成唯一文件名
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${uuidv4()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`,
      filename,
    });
  } catch {
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}
