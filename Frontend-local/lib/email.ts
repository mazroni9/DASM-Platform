import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ ثابت رسمي يمثل الإيميل المعتمد لمنصة قلب
const SENDER_EMAIL = 'mazroni@alb-maz.com';

/**
 * إرسال رمز التحقق عبر Resend
 */
export async function sendOTPEmail(to: string, code: string) {
  return await resend.emails.send({
    from: SENDER_EMAIL,
    to,
    subject: 'رمز التحقق - منصة قلب',
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; padding: 20px;">
        <h2>رمز التحقق الخاص بك</h2>
        <p>مرحبًا،</p>
        <p>رمز الدخول هو:</p>
        <h1 style="letter-spacing: 4px;">${code}</h1>
        <p>صلاحية الرمز: 5 دقائق فقط.</p>
        <p>في حال لم تطلب رمزًا، يرجى تجاهل هذه الرسالة.</p>
        <p style="margin-top: 30px;">فريق منصة قلب</p>
      </div>
    `
  });
}

/**
 * إرسال أي رسالة مخصصة عبر Resend
 */
export async function sendCustomEmail(to: string, subject: string, html: string) {
  return await resend.emails.send({
    from: SENDER_EMAIL,
    to,
    subject,
    html
  });
}
