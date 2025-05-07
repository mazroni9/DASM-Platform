# كيفية إنشاء رمز API في Cloudflare

## الخطوات:

1. **تسجيل الدخول إلى لوحة تحكم Cloudflare**
   - افتح [dashboard.cloudflare.com](https://dash.cloudflare.com/)
   - قم بتسجيل الدخول باستخدام حسابك

2. **الوصول إلى صفحة API Tokens**
   - انقر على رمز الملف الشخصي في الزاوية اليمنى العليا
   - اختر "My Profile" (ملفي الشخصي)
   - انتقل إلى تبويب "API Tokens" (رموز API)

3. **إنشاء رمز API جديد**
   - انقر على زر "Create Token" (إنشاء رمز)
   - اختر "Create Custom Token" (إنشاء رمز مخصص)
   
4. **تكوين الرمز**
   - اسم الرمز: "Delete Pages Projects" (حذف مشاريع Pages)
   - الصلاحيات:
     - Account > Cloudflare Pages > Edit (حساب > Cloudflare Pages > تحرير)
   - تحديد الحساب: اختر حسابك "9957fea1b2d8dc64de1c7a0c6a2e3bb5"
   - انقر على "Continue to summary" (المتابعة إلى الملخص)

5. **إنشاء وحفظ الرمز**
   - انقر على "Create Token" (إنشاء رمز)
   - **مهم**: انسخ الرمز الذي تم إنشاؤه على الفور! لن تتمكن من رؤيته مرة أخرى.

6. **استخدام الرمز**
   - الآن بعد أن لديك الرمز، افتح ملف `delete-cf-projects.js`
   - استبدل `YOUR_API_TOKEN_HERE` بالرمز الذي نسخته
   - احفظ الملف وقم بتنفيذه باستخدام الأمر: `node delete-cf-projects.js`

## ملاحظة أمنية:
بعد استخدام الرمز، يُفضل:
1. حذفه من الملف
2. حذف الرمز من Cloudflare بعد الانتهاء من استخدامه (العودة إلى صفحة API Tokens واختيار Delete) 