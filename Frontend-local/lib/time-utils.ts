/**
 * وظائف مساعدة لمعالجة الوقت والتواريخ
 */

/**
 * تحويل تاريخ إلى تنسيق مقروء باللغة العربية
 */
export function formatDate(date: Date | string | number): string {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * حساب الوقت المتبقي بين تاريخين بتنسيق مقروء
 */
export function calculateTimeLeft(endDate: Date | string | number): string {
  const end = new Date(endDate);
  const now = new Date();
  
  const difference = end.getTime() - now.getTime();
  
  if (difference <= 0) {
    return 'انتهى';
  }
  
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days} يوم${days === 1 ? '' : ' و'} ${hours} ساعة`;
  } else if (hours > 0) {
    return `${hours} ساعة و ${minutes} دقيقة`;
  } else {
    return `${minutes} دقيقة`;
  }
}

/**
 * إضافة عدد محدد من الأيام إلى تاريخ
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * الحصول على تاريخ بتنسيق يناسب حقول الإدخال
 */
export function getInputDateFormat(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * تحديد نوع المزاد الحالي بناءً على الوقت
 * الحراج المباشر: 4-7 مساءً
 * السوق الفوري: 7-10 مساءً
 * السوق المتأخر: 10 مساءً-4 عصراً
 */
export function getCurrentAuctionType(): string {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 16 && hour < 19) {
    return 'live'; // الحراج المباشر
  } else if (hour >= 19 && hour < 22) {
    return 'immediate'; // السوق الفوري
  } else {
    return 'late'; // السوق المتأخر
  }
} 