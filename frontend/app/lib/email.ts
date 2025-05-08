// هذا ملف مبسط لإرسال البريد الإلكتروني - في الإنتاج سيتم استخدام خدمة بريد إلكتروني حقيقية مثل SendGrid أو Mailgun

import nodemailer from 'nodemailer';

type EmailProps = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * إرسال بريد إلكتروني باستخدام nodemailer
 */
export async function sendEmail({ to, subject, text, html }: EmailProps) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    secure: process.env.NODE_ENV === 'production',
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}

/**
 * وظيفة لإرسال بريد إلكتروني يحتوي على رمز التحقق إلى المستخدم
 * في البيئة الحقيقية، يمكن استخدام خدمة بريد مثل SendGrid, Mailgun, Amazon SES, إلخ
 */
export async function sendVerificationEmail(email: string, code: string) {
  // في بيئة التطوير، نقوم بطباعة رسالة في وحدة التحكم فقط
  console.log(`[DEV EMAIL] رمز التحقق لـ ${email}: ${code}`);
  
  // في بيئة الإنتاج، سنستخدم خدمة بريد فعلية
  if (process.env.NODE_ENV === 'production') {
    // يمكن استخدام مكتبات مثل nodemailer أو خدمات API مثل SendGrid أو Mailgun
    // هذا مثال باستخدام واجهة بريد وهمية للتوضيح
    try {
      // اتصل بخدمة البريد الإلكتروني
      // أمثلة: 
      // await sendgrid.send({ to: email, subject: "رمز التحقق", text: `رمز التحقق الخاص بك هو: ${code}` });
      // await mailgun.messages.create({ to: email, subject: "رمز التحقق", text: `رمز التحقق الخاص بك هو: ${code}` });
      
      // في الحالة الواقعية، ستكون هناك استدعاءات API حقيقية هنا
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('فشل في إرسال البريد الإلكتروني');
    }
  }
  
  // نعيد true لتأكيد نجاح العملية
  return true;
}

/**
 * وظيفة لإرسال بريد إلكتروني ترحيبي بعد تسجيل المستخدم
 */
export async function sendWelcomeEmail(email: string, name: string) {
  console.log(`[DEV EMAIL] مرحبًا ${name}! شكرًا لتسجيلك في منصتنا.`);
  
  // نفس المنطق المذكور أعلاه لبيئة الإنتاج
  return true;
}

/**
 * وظيفة لإرسال بريد إلكتروني لإعادة تعيين كلمة المرور
 */
export async function sendPasswordResetEmail(email: string, resetLink: string) {
  console.log(`[DEV EMAIL] رابط إعادة تعيين كلمة المرور لـ ${email}: ${resetLink}`);
  
  // نفس المنطق المذكور أعلاه لبيئة الإنتاج
  return true;
} 