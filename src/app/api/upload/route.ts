import { NextRequest, NextResponse } from 'next/server';
import { getToken, verifyToken } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const BUCKET_NAME = 'uploads';

/** POST /api/upload — 上传图片到 Supabase Storage（需认证） */
export async function POST(request: NextRequest) {
  const token = getToken(request);
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
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

    // 上传到 Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('[upload] Supabase 上传失败:', error);
      return NextResponse.json({ error: '上传失败: ' + error.message }, { status: 500 });
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      filename,
    });
  } catch (err: any) {
    console.error('[upload] 上传异常:', err);
    return NextResponse.json({ error: '上传失败: ' + (err?.message || '未知错误') }, { status: 500 });
  }
}
