/**
 * GET /api/auth/captcha — 生成登录验证码
 * 返回 { id, code }，客户端用 id 提交验证
 */
import { NextResponse } from 'next/server';
import { createCaptcha } from '@/lib/captcha';

export async function GET() {
  const { id, code } = createCaptcha();
  return NextResponse.json({ id, code });
}
