
/**
 * 📁 المسار: Frontend-local/lib/time-utils.ts
 *
 * ✅ الوظيفة:
 * - تحديد نوع المزاد الحالي (الحراج المباشر، الفوري، أو الصامت) حسب الساعة المحلية للجهاز.
 * - تُستخدم هذه الدالة في إدخال البيانات، عرض السيارات، وتسجيل حالة البيع.
 */

export function getCurrentAuctionType(): 'live' | 'instant' | 'silent' {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 16 && hour < 19) {
    return 'live'; // الحراج المباشر
  } else if (hour >= 19 && hour < 22) {
    return 'instant'; // المزاد الفوري
  } else {
    return 'silent'; // المزاد الصامت
  }
}
