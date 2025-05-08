/**
 * 🔢 وحدة المساعدة: تنسيق البيانات
 * 📁 المسار: app/lib/format-utils.ts
 *
 * ✅ الوظيفة:
 * - توفير دوال مساعدة لتنسيق البيانات المختلفة
 * - تنسيق الأرقام المالية بالفواصل الألفية
 * - تنسيق التواريخ والأوقات
 * - وظائف تنسيق أخرى للعرض
 */

/**
 * تنسيق الأرقام المالية بإضافة الفواصل الألفية
 * مثال: 1000000 => 1,000,000
 */
export function formatMoney(amount: string | number | undefined | null): string {
  if (amount === undefined || amount === null) return "0";
  
  // تحويل الرقم إلى نص وإزالة أي فواصل موجودة مسبقاً
  const numStr = amount.toString().replace(/,/g, '');
  
  // إضافة الفواصل الألفية
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * تنسيق التاريخ بالصيغة العربية
 * مثال: 2023-05-20 => ٢٠ مايو ٢٠٢٣
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // خيارات التنسيق العربي
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return date.toLocaleDateString('ar-SA', options);
}

/**
 * تنسيق الوقت بصيغة مناسبة
 * مثال: 14:30:00 => ٢:٣٠ م
 */
export function formatTime(timeString: string | Date): string {
  const date = typeof timeString === 'string' ? new Date(`2000-01-01T${timeString}`) : timeString;
  
  // خيارات التنسيق
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  };
  
  return date.toLocaleTimeString('ar-SA', options);
} 