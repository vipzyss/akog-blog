/**
 * 邮件发送模块
 * - 生产环境通过 SMTP 发送真实邮件（需安装 nodemailer: npm i nodemailer）
 * - 开发环境打印验证码到控制台（方便调试）
 *
 * 配置环境变量：
 *   SMTP_HOST     - SMTP 服务器地址
 *   SMTP_PORT     - SMTP 端口（默认 587）
 *   SMTP_USER     - 发件邮箱账号
 *   SMTP_PASS     - 发件邮箱密码/授权码
 *   SMTP_FROM     - 发件人地址（默认 SMTP_USER）
 */

import { createVerifyCode } from './verify-code';

interface SendResult {
  success: boolean;
  code?: string;    // 开发模式下返回验证码供调试
  error?: string;
}

/** 发送验证码邮件 */
export async function sendVerifyCode(email: string): Promise<SendResult> {
  const code = createVerifyCode(email);

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;

  // 生产模式：有 SMTP 配置时发送真实邮件
  if (smtpHost && smtpUser) {
    try {
      // 动态导入 nodemailer（仅在配置了 SMTP 时才会加载）
      // @ts-ignore — nodemailer 为可选依赖，未安装时走开发模式
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: smtpUser,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || smtpUser,
        to: email,
        subject: '【瞬云的尽头】邮箱验证码',
        html: [
          '<div style="max-width:480px;margin:0 auto;padding:32px;font-family:sans-serif;background:#f0f4ff;border-radius:16px">',
          '<h2 style="color:#06b6d4;margin:0 0 8px">瞬云的尽头</h2>',
          '<p style="color:#4a5568;margin:0 0 24px">你的邮箱验证码如下，5 分钟内有效：</p>',
          '<div style="background:#fff;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px">',
          `<span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1a1a2e">${code}</span>`,
          '</div>',
          '<p style="color:#94a3b8;font-size:12px;margin:0">如果不是你本人操作，请忽略此邮件。</p>',
          '</div>',
        ].join(''),
      });

      return { success: true };
    } catch (err: any) {
      console.error('[邮件发送失败]', err.message);
      return { success: false, error: '邮件发送失败，请检查 SMTP 配置' };
    }
  }

  // 开发模式：打印到控制台
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 [开发模式] 验证码已生成');
  console.log(`   收件人: ${email}`);
  console.log(`   验证码: ${code}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return { success: true, code };
}
