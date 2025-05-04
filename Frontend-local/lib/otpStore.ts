// تخزين مؤقت لرموز التحقق (في الذاكرة فقط للتجربة)
// في الإنتاج سيتم استبدال هذا بتخزين في قاعدة بيانات

/**
 * نوع بيانات لتخزين رمز التحقق
 */
export interface OTPData {
  code: string;
  expiresAt: number; // وقت انتهاء الصلاحية بالميلي ثانية
}

/**
 * مخزن مؤقت لتخزين رموز التحقق
 * في تطبيق واقعي، سيتم تخزين هذه البيانات في قاعدة بيانات
 */
export const otpStore: Record<string, OTPData> = {};

// دالة مساعدة لحذف الرموز منتهية الصلاحية
export function cleanupExpiredOTPs() {
  const now = Date.now();
  Object.keys(otpStore).forEach(email => {
    if (otpStore[email].expiresAt < now) {
      delete otpStore[email];
    }
  });
}

// تشغيل التنظيف كل 10 دقائق إذا كنا في بيئة الخادم
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredOTPs, 10 * 60 * 1000);
} 