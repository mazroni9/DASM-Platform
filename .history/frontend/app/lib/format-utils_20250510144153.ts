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
 * أدوات مساعدة لتنسيق البيانات
 */

/**
 * تنسيق المبلغ المالي بالأرقام العربية وإضافة الفواصل للآلاف
 * @param amount المبلغ المراد تنسيقه
 * @returns المبلغ المنسق
 */
export const formatMoney = (amount: number): string => {
  // استخدام الأرقام العربية والفواصل العشرية المناسبة
  return amount.toLocaleString('ar-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

/**
 * تنسيق التاريخ بالصيغة العربية
 * @param date التاريخ المراد تنسيقه
 * @returns التاريخ المنسق
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * تنسيق الوقت بالصيغة العربية
 * @param date التاريخ المراد استخراج الوقت منه
 * @returns الوقت المنسق
 */
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * تنسيق الفترة الزمنية المتبقية
 * @param endTime وقت الانتهاء
 * @returns الوقت المتبقي بصيغة دقائق:ثواني
 */
export const formatTimeRemaining = (endTime: Date | string): string => {
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  const now = new Date();
  
  // الفرق بالمللي ثانية
  const diffMs = end.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return 'انتهى الوقت';
  }
  
  // تحويل إلى دقائق وثواني
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  // تنسيق بصيغة دقائق:ثواني
  return `${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`;
};

/**
 * تنسيق عدد المشاهدين (اختصار الأعداد الكبيرة)
 * @param count عدد المشاهدين
 * @returns العدد المنسق
 */
export const formatViewerCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

/**
 * تنسيق الأرقام المالية بإضافة الفواصل الألفية
 * مثال: 1000000 => 1,000,000
 */
export function formatMoneyOld(amount: string | number | undefined | null): string {
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
export function formatDateOld(dateString: string | Date): string {
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
export function formatTimeOld(timeString: string | Date): string {
  const date = typeof timeString === 'string' ? new Date(`2000-01-01T${timeString}`) : timeString;
  
  // خيارات التنسيق
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  };
  
  return date.toLocaleTimeString('ar-SA', options);
} 