/**
 * يولد رمز تحقق عشوائي من 6 أرقام
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
} 