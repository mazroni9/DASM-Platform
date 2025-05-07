# الحصول على رمز API من Cloudflare

هذا الدليل يوضح كيفية الحصول على رمز API من Cloudflare لاستخدامه في عمليات النشر التلقائي.

## خطوات الحصول على رمز API

1. قم بتسجيل الدخول إلى [لوحة تحكم Cloudflare](https://dash.cloudflare.com/)

2. انقر على **My Profile** من القائمة الموجودة في الزاوية العليا اليمنى.

3. في الشريط الجانبي، انقر على **API Tokens**.

4. انقر على زر **Create Token**.

5. يمكنك اختيار:
   - إما استخدام قالب "Edit Cloudflare Workers" وتعديله.
   - أو استخدام "Create Custom Token".

6. لإنشاء رمز مخصص:
   - اسم الرمز: "Pages Deployment"
   - أذونات:
     - Account > Account Settings > Read
     - Account > Cloudflare Pages > Edit
     - Account > Workers Scripts > Edit

7. تحت "Account Resources"، حدد حسابك.

8. حدد مدة صلاحية مناسبة للرمز (أو اتركها دون تغيير للصلاحية الدائمة).

9. انقر على **Continue to Summary** ثم **Create Token**.

10. قم بنسخ الرمز المعروض على الفور - **لن تتمكن من رؤيته مرة أخرى بعد مغادرة هذه الصفحة**.

## إضافة الرمز إلى GitHub

1. انتقل إلى مستودع GitHub الخاص بالمشروع.

2. انقر على **Settings** > **Secrets and variables** > **Actions**.

3. انقر على **New repository secret**.

4. أضف الرمز:
   - الاسم: `CLOUDFLARE_API_TOKEN`
   - القيمة: الرمز الذي نسخته من Cloudflare

5. كرر الخطوات لإضافة سر آخر:
   - الاسم: `CLOUDFLARE_ACCOUNT_ID`
   - القيمة: معرف حساب Cloudflare الخاص بك (يمكن العثور عليه في عنوان URL للوحة التحكم أو في "Workers & Pages" > "Overview" > "Account ID")

## التحقق من صلاحية الرمز

يمكنك التحقق من صلاحية الرمز باستخدام Wrangler CLI:

```bash
npx wrangler pages project list --api-token=<your-token>
```

إذا رأيت قائمة بمشاريع Pages الخاصة بك، فهذا يعني أن الرمز يعمل بشكل صحيح. 