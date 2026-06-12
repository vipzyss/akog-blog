/**
 * POST /api/auth/verify-code
 * 发送邮箱验证码
 * Body: { email: string }
 * 限制：同一邮箱 60 秒内只能发一次
 */
import { NextResponse } from 'next/server';
import { canSendCode } from '@/lib/verify-code';
import { sendVerifyCode } from '@/lib/mail';
import { getUserByIdentifier } from '@/lib/data';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: '请输入邮箱地址' }, { status: 400 });
    }

    // 校验邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
    }

    // 检查邮箱是否已被后台用户使用
    const existingUser = getUserByIdentifier(email);
    if (existingUser) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 400 });
    }

    // 冷却检查
    const cooldown = canSendCode(email);
    if (!cooldown.ok) {
      return NextResponse.json(
        { error: `请 ${cooldown.waitSeconds} 秒后再试` },
        { status: 429 }
      );
    }

    // 发送验证码
    const result = await sendVerifyCode(email);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // 开发模式下返回验证码（便于调试，生产环境应关闭）
    const isDev = !process.env.SMTP_HOST;
    return NextResponse.json({
      message: '验证码已发送',
      ...(isDev && result.code ? { code: result.code } : {}),
    });
  } catch (err: any) {
    console.error('[VERIFY-CODE ERROR]', err);
    return NextResponse.json(
      { error: '发送失败：' + String(err?.message || err) },
      { status: 500 }
    );
  }
}
