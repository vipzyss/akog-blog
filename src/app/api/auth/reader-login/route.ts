import { NextResponse } from 'next/server';
import { loginReader } from '@/lib/auth';
import { verifyCaptcha, consumeCaptcha } from '@/lib/captcha';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password, captchaId, captchaCode } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: '请输入用户名/邮箱和密码' },
        { status: 400 }
      );
    }

    // 验证码校验
    if (!captchaId || !captchaCode) {
      return NextResponse.json({ error: '请输入验证码' }, { status: 400 });
    }
    if (!verifyCaptcha(captchaId, captchaCode)) {
      return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 });
    }

    const result = loginReader(identifier, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    consumeCaptcha(captchaId);

    return NextResponse.json({
      token: result.token,
      reader: result.reader,
    });
  } catch {
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
