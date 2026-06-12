/**
 * GET  /api/music — 扫描 public/music/ 目录，返回音乐文件列表
 * POST /api/music — 上传音乐文件（需管理员认证）
 * DELETE /api/music?name=xxx — 删除指定音乐文件（需管理员认证）
 */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '@/lib/auth';

interface MusicFile {
  name: string;
  title: string;
  url: string;
  size: number;
}

const MUSIC_DIR = path.join(process.cwd(), 'public', 'music');

/** 确保音乐目录存在 */
function ensureMusicDir() {
  if (!fs.existsSync(MUSIC_DIR)) {
    fs.mkdirSync(MUSIC_DIR, { recursive: true });
  }
}

/** 扫描音乐文件 */
function scanMusic(): MusicFile[] {
  ensureMusicDir();
  const files = fs.readdirSync(MUSIC_DIR);
  return files
    .filter((f) => f.toLowerCase().endsWith('.mp3'))
    .map((f) => {
      const stats = fs.statSync(path.join(MUSIC_DIR, f));
      return {
        name: f,
        title: f.replace(/\.mp3$/i, ''),
        url: `/music/${encodeURIComponent(f)}`,
        size: stats.size,
      };
    });
}

export async function GET() {
  try {
    return NextResponse.json(scanMusic());
  } catch {
    return NextResponse.json([]);
  }
}

/** 管理员认证中间件 */
function authGuard(request: NextRequest): { authorized: boolean; error?: NextResponse } {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false, error: NextResponse.json({ error: '未授权' }, { status: 401 }) };
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return { authorized: false, error: NextResponse.json({ error: '未授权' }, { status: 401 }) };
  }
  return { authorized: true };
}

/** 上传音乐文件 */
export async function POST(request: NextRequest) {
  const guard = authGuard(request);
  if (!guard.authorized) return guard.error;

  try {
    ensureMusicDir();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '未选择文件' }, { status: 400 });
    }

    // 只接受 MP3
    if (!file.name.toLowerCase().endsWith('.mp3')) {
      return NextResponse.json({ error: '仅支持 MP3 格式' }, { status: 400 });
    }

    // 限制 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: '文件大小不能超过 20MB' }, { status: 400 });
    }

    // 检查同名文件
    const destPath = path.join(MUSIC_DIR, file.name);
    if (fs.existsSync(destPath)) {
      return NextResponse.json({ error: '已存在同名文件，请先删除或重命名' }, { status: 409 });
    }

    // 写入文件
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(destPath, buffer);

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        title: file.name.replace(/\.mp3$/i, ''),
        url: `/music/${encodeURIComponent(file.name)}`,
        size: file.size,
      },
    });
  } catch {
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}

/** 删除音乐文件 */
export async function DELETE(request: NextRequest) {
  const guard = authGuard(request);
  if (!guard.authorized) return guard.error;

  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: '缺少文件名参数' }, { status: 400 });
    }

    // 安全检查：防止路径穿越
    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
      return NextResponse.json({ error: '无效文件名' }, { status: 400 });
    }

    const filePath = path.join(MUSIC_DIR, name);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    fs.unlinkSync(filePath);
    return NextResponse.json({ success: true, deleted: name });
  } catch {
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
