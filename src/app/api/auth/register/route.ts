import { NextResponse } from 'next/server';
import { registerReader } from '@/lib/auth';
import { verifyCode } from '@/lib/verify-code';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, displayName, email, password, confirmPassword, verifyCode: code } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: '请填写所有必填项' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: '两次输入的密码不一致' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度不少于 6 位' },
        { status: 400 }
      );
    }

    // 验证邮箱验证码
    if (!code) {
      return NextResponse.json(
        { error: '请输入邮箱验证码' },
        { status: 400 }
      );
    }

    if (!verifyCode(email, code)) {
      return NextResponse.json(
        { error: '验证码错误或已过期' },
        { status: 400 }
      );
    }

    const result = registerReader({ username, displayName, email, password });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      token: result.token,
      reader: result.reader,
    });
  } catch {
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
