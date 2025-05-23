# سوق الساعات الفاخرة المستعملة

## نظرة عامة

هذا القسم يمثل سوق الساعات الفاخرة المستعملة ضمن منصة المزادات. يتيح المنصة للمستخدمين تصفح وشراء وبيع الساعات الفاخرة من ماركات عالمية مرموقة مثل Rolex، Patek Philippe، Audemars Piguet، وغيرها.

## هيكل الصفحات

1. **الصفحة الرئيسية للسوق** (`/watches/page.tsx`)
   - عرض فئات الساعات والماركات
   - عرض الساعات المميزة والأحدث
   - فلاتر للبحث والتصفية
   - معلومات عن آلية البيع والشراء

2. **صفحة تفاصيل الساعة** (`/watches/[id]/page.tsx`)
   - عرض تفاصيل ساعة محددة
   - صور متعددة للساعة
   - المواصفات الفنية
   - معلومات البائع
   - آلية تقديم العروض والمزايدة
   - ساعات مشابهة

3. **نموذج طلب بيع ساعة** (`/forms/watch-auction-request/page.tsx`)
   - نموذج لإضافة ساعة جديدة للمنصة
   - حقول لمعلومات الساعة (الماركة، الموديل، الرقم المرجعي، الحالة، إلخ)
   - رفع صور متعددة
   - خيارات المزايدة والتسليم

## الميزات الرئيسية

1. **التحقق من الأصالة**: جميع الساعات تخضع لفحص دقيق للتأكد من أصالتها قبل الإدراج.

2. **نظام الحماية**: يتم حجز المبلغ حتى يتم تسليم الساعة وفحصها من قبل المشتري.

3. **خيارات متعددة للبيع**:
   - المزايدة التفاعلية (مع وقت محدد)
   - البيع المباشر (Buy Now)
   - إمكانية التفاوض على السعر

4. **خيارات التوصيل**:
   - توصيل من خلال المنصة (رسوم 200 ريال)
   - شركات شحن خارجية (DHL, Aramex)
   - استلام شخصي موثق

5. **عمولات تنافسية**:
   - 5% للبيع عبر المزاد
   - 3% فقط للبيع المباشر
   - رسوم إدخال ساعة: 50 ريال (غير مستردة)

## الماركات المعتمدة

- Rolex
- Patek Philippe
- Audemars Piguet
- Richard Mille
- Omega
- Cartier
- Hublot
- Jaeger-LeCoultre
- Grand Seiko

## التخطيط المستقبلي

- نظام التعرف على الساعة من الصورة باستخدام الذكاء الاصطناعي
- حساب القيمة السوقية للساعات المشهورة آليًا
- نظام تنبيهات للمزايدين عند اقتراب انتهاء المزاد
- إمكانية المقارنة بين الساعات المختلفة

## التكامل مع قاعدة البيانات

يتم ربط صفحات السوق مع جدول `items` في قاعدة البيانات `auctions.db` مع تصنيف نوع العنصر كـ "watches". 