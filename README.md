# منصة DASM

منصة متكاملة للمزادات الرقمية عبر الإنترنت، مصممة بواجهة مستخدم عربية سلسة وأنيقة.

## مميزات المشروع

-   واجهة مستخدم عربية كاملة بتصميم عصري
-   نظام مزادات متكامل يدعم أنواع متعددة من المزادات (مباشر، فوري، متأخر)
-   فئات متنوعة من المنتجات (سيارات، مجوهرات، ساعات، فنون)
-   نظام مزايدة متطور مع تتبع الوقت المتبقي
-   لوحة تحكم للمستخدم ولوحة تحكم للإدارة
-   تكامل مع نظام الدفع
-   تقارير وإحصائيات متقدمة

## التقنيات المستخدمة

-   **الواجهة الأمامية**: Next.js 15+, React 19+, TypeScript, Tailwind CSS, Material UI, Radix UI
-   **الخادم الخلفي**: Laravel 12, PHP 8.2+
-   **المصادقة**: Laravel Sanctum, JWT
-   **التخزين السحابي**: Cloudinary
-   **CI/CD**: GitHub Actions

## البدء في المشروع

### المتطلبات الأساسية

-   Node.js (الإصدار 18.18.0 أو أحدث)
-   PHP 8.2 أو أحدث
-   Composer
-   npm أو pnpm

### خطوات التثبيت

#### تثبيت الواجهة الأمامية (Frontend)

1. استنساخ المستودع:

    ```bash
    git clone https://github.com/yourusername/DASM-Platform.git
    cd DASM-Platform
    ```

2. تثبيت تبعيات الواجهة الأمامية:

    ```bash
    cd frontend
    npm install
    ```

3. تشغيل بيئة التطوير للواجهة الأمامية:

    ```bash
    npm run dev
    ```

4. افتح المتصفح على العنوان: `http://localhost:3000`

#### تثبيت الخادم الخلفي (Backend)

1. انتقل إلى مجلد الخادم الخلفي:

    ```bash
    cd backend
    ```

2. تثبيت تبعيات الخادم الخلفي:

    ```bash
    composer install
    ```

3. انسخ ملف البيئة وقم بإنشاء مفتاح التطبيق:

    ```bash
    cp .env.example .env
    php artisan key:generate
    ```

4. قم بتكوين قاعدة البيانات في ملف `.env`

5. قم بتشغيل الترحيلات لإنشاء جداول قاعدة البيانات:

    ```bash
    php artisan migrate
    ```

6. قم بتشغيل خادم التطوير:

    ```bash
    php artisan serve
    ```

7. سيكون الخادم الخلفي متاحًا على العنوان: `http://localhost:8000`

## هيكل المشروع

```
DASM-Platform/
├── frontend/            # تطبيق Next.js للواجهة الأمامية
│   ├── app/             # صفحات التطبيق (Next.js App Router)
│   │   ├── api/         # مسارات واجهة برمجة التطبيقات
│   │   ├── auctions/    # صفحات المزادات المختلفة
│   │   └── ...
│   ├── components/      # مكونات قابلة لإعادة الاستخدام
│   ├── hooks/           # خطافات React المخصصة
│   ├── lib/             # مكتبات ووظائف مساعدة
│   ├── public/          # ملفات ثابتة وصور
│   ├── store/           # إدارة حالة التطبيق
│   └── ...
├── backend/             # تطبيق Laravel للخادم الخلفي
│   ├── app/             # الكود الأساسي للتطبيق
│   │   ├── Console/     # أوامر Artisan المخصصة
│   │   ├── Http/        # وحدات التحكم والطلبات
│   │   ├── Models/      # نماذج قاعدة البيانات
│   │   └── ...
│   ├── database/        # ترحيلات ومصانع قاعدة البيانات
│   ├── routes/          # تعريفات المسارات
│   └── ...
└── build/               # مستندات ووثائق المشروع
```

## النشر

### نشر الواجهة الأمامية

يمكن نشر تطبيق Next.js على منصات مثل Vercel أو Cloudflare Pages:

```bash
cd frontend
npm run build
# اتبع تعليمات النشر الخاصة بمنصة الاستضافة المفضلة لديك
```

### نشر الخادم الخلفي

يمكن نشر تطبيق Laravel على خوادم مثل DigitalOcean أو Render أو أي استضافة PHP أخرى.

## المساهمة

نرحب بالمساهمات! يرجى اتباع هذه الخطوات:

1. شُعِّب (Fork) المستودع
2. أنشئ فرعًا للميزة (`git checkout -b feature/amazing-feature`)
3. قم بإجراء تغييراتك وارتكبها (`git commit -m 'Add amazing feature'`)
4. ادفع إلى الفرع (`git push origin feature/amazing-feature`)
5. افتح طلب سحب

## الترخيص

هذا المشروع ملكية خاصة © DASM. جميع الحقوق محفوظة.

هذا البرنامج هو ملكية خاصة وسرية. يحظر النسخ أو التوزيع أو الاستخدام غير المصرح به.
