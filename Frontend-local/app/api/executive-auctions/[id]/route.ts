import { NextRequest, NextResponse } from 'next/server';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    // محاكاة للتحقق من المستخدم - سيتم تحسينه لاحقًا مع نظام المصادقة
    const isExecutive = true; // يجب أن يتم التحقق فعليًا من حالة المستخدم

    if (!isExecutive) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 403 });
    }

    // في الإصدار النهائي، سنقوم بفتح قاعدة البيانات واستعلام تفاصيل المنتج
    /*
    const db = await open({
      filename: 'backend/database/auctions.db',
      driver: sqlite3,
    });

    const item = await db.get('SELECT * FROM items WHERE id = ? AND is_executive = 1', id);
    
    if (!item) {
      return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 });
    }
    */

    // بيانات مزيفة مؤقتة للعرض التوضيحي
    const items = {
      "1": {
        id: 1,
        title: 'مرسيدس SLS AMG',
        category: 'سيارات',
        categoryName: 'سيارات فاخرة',
        description: 'سيارة مرسيدس SLS AMG موديل 2021 بتعديلات خاصة ومصفحة من الفئة B6، حالة ممتازة وضمان مفتوح',
        fullDescription: `
سيارة مرسيدس SLS AMG موديل 2021 بتعديلات خاصة ومصفحة من الفئة B6، حالة ممتازة وضمان مفتوح.

هذه السيارة مملوكة سابقًا لشخصية هامة، وتم صيانتها بالكامل في وكالة مرسيدس الرسمية. تأتي بلون أسود مع داخلية جلد أحمر مخصصة، مع تعديلات خاصة من شركة Brabus.

المحرك V8 سعة 6.3 لتر بقوة 691 حصانًا، مع تحسينات على نظام العادم والتعليق. السيارة مُصفحة من الفئة B6 بواسطة شركة ألمانية متخصصة، توفر حماية ضد الرصاص حتى عيار 7.62 ملم.

تأتي مع:
- نظام صوتي Bang & Olufsen فاخر
- شاشات ترفيهية خلفية
- نظام اتصال سري مُشفر
- كاميرات محيطية بزاوية 360 درجة
- ميزات أمان إضافية
        `,
        history: `
هذه السيارة تم إنتاجها في مصنع مرسيدس في شتوتغارت، ألمانيا في يناير 2021. تم شراؤها مباشرة من المصنع بواسطة شخصية هامة وتم تخصيصها حسب الطلب.

تم تصفيحها في شركة INKAS المتخصصة في تصفيح السيارات الفاخرة، وتم تسليمها في مايو 2021. استُخدمت في المناسبات الرسمية فقط ولم تتجاوز مسافة 8,000 كيلومتر.
        `,
        origin: 'ألمانيا',
        age: '2021',
        condition: 'ممتازة',
        dimensions: 'الطول: 4.63 م × العرض: 1.94 م × الارتفاع: 1.25 م',
        weight: '1,850 كيلوغرام',
        material: 'هيكل من الألمنيوم والكربون فايبر مع تصفيح B6',
        price: 1250000,
        startBid: 1250000,
        currentBid: 1350000,
        nextMinBid: 1375000,
        bidIncrement: 25000,
        bidCount: 5,
        endDate: new Date('2025-07-30T18:00:00'),
        certificate: '/certificates/mercedes-auth.pdf',
        certificateAuthority: 'مرسيدس بنز - قسم السيارات الخاصة',
        seller: {
          name: 'مكتب السيارات التنفيذية المعتمد',
          rating: 4.9,
          transactions: 23,
          location: 'الرياض، السعودية',
          joined: '2020',
          verified: true
        },
        specialBadge: 'ملك سابق',
        is_executive: 1,
        images: [
          '/executive/mercedes-sls-1.jpg',
          '/executive/mercedes-sls-2.jpg',
          '/executive/mercedes-sls-3.jpg',
          '/executive/mercedes-sls-4.jpg',
        ],
        bids: [
          { amount: 1350000, user: 'العميل #7842', date: '2025-06-20 14:23' },
          { amount: 1325000, user: 'العميل #5396', date: '2025-06-19 18:30' },
          { amount: 1300000, user: 'العميل #2754', date: '2025-06-19 10:45' },
          { amount: 1275000, user: 'العميل #9183', date: '2025-06-18 21:17' },
          { amount: 1250000, user: 'العميل #4127', date: '2025-06-18 09:32' },
        ],
        authenticityChecks: [
          'تم التحقق بواسطة خبراء مرسيدس المعتمدين',
          'تقرير فحص كامل مع تاريخ الصيانة',
          'شهادة الملكية والمستندات الأصلية متوفرة',
          'تم التحقق من سلامة التصفيح والاختبار الأمني',
        ],
        viewingOptions: [
          'معاينة حصرية في مقر المزاد بموعد مسبق',
          'فحص كامل وتجربة قيادة للمشترين الجادين',
          'تقرير فيديو تفصيلي عند الطلب',
        ],
        similarItems: [
          { id: 101, title: 'بنتلي كونتيننتال GT', price: 950000, category: 'سيارات' },
          { id: 102, title: 'رولز رويس فانتوم', price: 1750000, category: 'سيارات' },
          { id: 103, title: 'لمبورغيني أفنتادور', price: 1450000, category: 'سيارات' },
        ]
      },
      "2": {
        id: 2,
        title: 'ساعة Patek Philippe Nautilus',
        category: 'ساعات',
        categoryName: 'ساعات فاخرة',
        description: 'ساعة Patek Philippe Nautilus إصدار محدود رقم 18/25 مصنوعة من الذهب الوردي، مع توثيق من الشركة الأم',
        fullDescription: `
ساعة Patek Philippe Nautilus إصدار محدود رقم 18 من 25 نسخة فقط، مصنوعة من الذهب الوردي عيار 18 قيراط.

هذه الساعة الاستثنائية من سلسلة Nautilus الشهيرة صُممت في 2022 كإصدار محدود للغاية، وتتميز بمينا أزرق مموج مع قرص التاريخ عند موضع الساعة 3، وخلفية شفافة من الكريستال الصفيري تكشف عن آلية الحركة المصنوعة يدويًا.

مقاس الساعة 40 ملم، سماكة 8.3 ملم، مع سوار متكامل من الذهب الوردي. الآلية من نوع Caliber 26‑330 S C أوتوماتيكية التعبئة مع احتياطي طاقة 45 ساعة.

الساعة في حالة ممتازة مع جميع الملحقات الأصلية:
- علبة الساعة الأصلية
- شهادة الأصالة
- كتيب التعليمات
- بطاقة الضمان الدولي
        `,
        history: `
هذه الساعة من إصدار محدود أنتجته شركة Patek Philippe في عام 2022 احتفالًا بالذكرى السنوية لسلسلة Nautilus. تم بيعها أول مرة عبر وكيل Patek Philippe الرسمي في جنيف، وتم شراؤها من المالك الأول مباشرة.

لم يتم ارتداء الساعة إلا نادرًا، وتم الاحتفاظ بها في خزنة خاصة معظم الوقت. جميع الأختام والملصقات الأصلية موجودة، والساعة خالية من أي خدوش أو علامات استخدام واضحة.
        `,
        origin: 'سويسرا',
        age: '2022',
        condition: 'جديدة',
        dimensions: 'قطر: 40 ملم × سماكة: 8.3 ملم',
        weight: '148 غرام',
        material: 'ذهب وردي عيار 18 قيراط',
        price: 875000,
        startBid: 875000,
        currentBid: 880000,
        nextMinBid: 890000,
        bidIncrement: 10000,
        bidCount: 3,
        endDate: new Date('2025-07-28T20:00:00'),
        certificate: '/certificates/patek-auth.pdf',
        certificateAuthority: 'Patek Philippe - قسم التوثيق',
        seller: {
          name: 'متجر الساعات الفاخرة',
          rating: 5.0,
          transactions: 15,
          location: 'دبي، الإمارات',
          joined: '2021',
          verified: true
        },
        specialBadge: 'إصدار محدود',
        is_executive: 1,
        images: [
          '/executive/patek-nautilus-1.jpg',
          '/executive/patek-nautilus-2.jpg',
          '/executive/patek-nautilus-3.jpg',
        ],
        bids: [
          { amount: 880000, user: 'العميل #3651', date: '2025-06-21 09:14' },
          { amount: 878000, user: 'العميل #8246', date: '2025-06-20 15:32' },
          { amount: 875000, user: 'العميل #1973', date: '2025-06-19 11:05' },
        ],
        authenticityChecks: [
          'توثيق كامل من Patek Philippe',
          'تأكيد الرقم التسلسلي والإصدار المحدود',
          'فحص الآلية ودقة التوقيت',
          'التحقق من جميع النقوش والعلامات',
        ],
        viewingOptions: [
          'معاينة في صالة العرض بموعد مسبق',
          'فحص من قبل خبير متخصص بحضورك',
          'توفير تقارير إضافية عند الطلب',
        ],
        similarItems: [
          { id: 201, title: 'ساعة Audemars Piguet Royal Oak', price: 650000, category: 'ساعات' },
          { id: 202, title: 'ساعة Richard Mille RM 35-02', price: 1250000, category: 'ساعات' },
          { id: 203, title: 'ساعة Rolex Daytona', price: 450000, category: 'ساعات' },
        ]
      },
      "3": {
        id: 3,
        title: 'طقم ألماس VAN CLEEF',
        category: 'مجوهرات',
        categoryName: 'مجوهرات فاخرة',
        description: 'طقم ألماس فاخر من VAN CLEEF يتكون من عقد وسوار وخاتم، إجمالي قيراط 18.5 بشهادة GIA',
        fullDescription: `
طقم ألماس فاخر من Van Cleef & Arpels من مجموعة Alhambra الشهيرة، يتكون من عقد وسوار وخاتم، بإجمالي 18.5 قيراط من الألماس المرصع بدرجة نقاء VVS1.

هذا الطقم المميز مصنوع من الذهب الأبيض عيار 18 قيراط، وتم تصميمه وفق المعايير الحرفية العالية التي تشتهر بها دار Van Cleef & Arpels. يتميز بتفاصيل دقيقة ولمعان استثنائي، ويعتبر قطعة استثمارية نادرة.

العقد: طول 45 سم، مرصع بـ 11.2 قيراط ألماس
السوار: طول 18 سم، مرصع بـ 5.3 قيراط ألماس
الخاتم: مقاس 17، مرصع بـ 2 قيراط ألماس مركزي وحوله 0.8 قيراط من الألماس الصغير

جميع القطع مختومة بختم Van Cleef & Arpels وتحمل أرقامًا تسلسلية فريدة، مع شهادات GIA لكل قطعة.
        `,
        history: `
هذا الطقم الفريد صُمم في ورشة Van Cleef & Arpels في باريس عام 2020 كطلب خاص، وتم اختيار الألماس بعناية فائقة من أفضل المصادر الأخلاقية.

الطقم كان هدية لشخصية اجتماعية مرموقة، ولم يتم ارتداؤه سوى في مناسبتين رسميتين فقط. تم الاحتفاظ به في خزنة آمنة، ويُباع الآن كاستثمار مع توقعات بارتفاع قيمته بمرور الوقت.
        `,
        origin: 'فرنسا',
        age: '2020',
        condition: 'ممتازة',
        dimensions: 'متنوعة حسب القطعة',
        weight: '75.4 غرام إجمالي',
        material: 'ذهب أبيض عيار 18 قيراط وألماس درجة VVS1',
        price: 650000,
        startBid: 650000,
        currentBid: 655000,
        nextMinBid: 660000,
        bidIncrement: 5000,
        bidCount: 2,
        endDate: new Date('2025-07-25T19:00:00'),
        certificate: '/certificates/vancleef-auth.pdf',
        certificateAuthority: 'GIA ومختبر Van Cleef & Arpels',
        seller: {
          name: 'دار المجوهرات النادرة',
          rating: 4.8,
          transactions: 19,
          location: 'الرياض، السعودية',
          joined: '2020',
          verified: true
        },
        specialBadge: 'استثماري',
        is_executive: 1,
        images: [
          '/executive/diamond-set-1.jpg',
          '/executive/diamond-set-2.jpg',
          '/executive/diamond-set-3.jpg',
          '/executive/diamond-set-4.jpg',
        ],
        bids: [
          { amount: 655000, user: 'العميل #6214', date: '2025-06-22 11:36' },
          { amount: 650000, user: 'العميل #9427', date: '2025-06-21 17:08' },
        ],
        authenticityChecks: [
          'شهادات GIA لجميع قطع الألماس الرئيسية',
          'توثيق من Van Cleef & Arpels',
          'تقييم من خبير مجوهرات مستقل',
          'فحص الأختام والعلامات الأصلية',
        ],
        viewingOptions: [
          'معاينة في غرفة آمنة بموعد مسبق',
          'فحص بحضور خبير مجوهرات',
          'إمكانية الفحص بأجهزة متخصصة',
        ],
        similarItems: [
          { id: 301, title: 'خاتم ألماس كارتييه', price: 350000, category: 'مجوهرات' },
          { id: 302, title: 'سوار بولغاري سيربنتي', price: 280000, category: 'مجوهرات' },
          { id: 303, title: 'عقد تيفاني بالألماس الأزرق', price: 520000, category: 'مجوهرات' },
        ]
      }
    };

    const item = items[id];
    
    if (!item) {
      return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
} 