// utils/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  const confirmUrl = `https://alb-maz.com.sa/verify?token=${token}`;

  return await resend.emails.send({
    from: 'mazroni@alb-maz.com',
    to: email,
    subject: 'رمز التحقق من بريدك',
    html: `
      <p>أهلا!</p>
      <p>اضغط على الرابط لتأكيد بريدك:</p>
      <a href="${confirmUrl}">${confirmUrl}</a>
    `,
  });
}
