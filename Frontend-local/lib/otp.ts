/**
 * وظيفة لإنشاء رمز تحقق مكون من 6 أرقام
 * @returns رمز التحقق كسلسلة نصية
 */
export function generateOTP(): string {
  // إنشاء رقم عشوائي بين 100000 و 999999
  return Math.floor(100000 + Math.random() * 900000).toString();
} 