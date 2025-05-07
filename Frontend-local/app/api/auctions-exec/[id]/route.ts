/**
 * مسار الملف: app/api/auctions-exec/[id]/route.ts
 *
 * ❖ وظيفة الملف:
 *   - جلب بيانات مزاد تنفيذي معين (سيارة فاخرة، ساعة نادرة، قطعة استثمارية...) بناءً على المعرّف ID.
 *   - يُستخدم في صفحة تفاصيل المزاد داخل قسم "المزادات التنفيذية".
 *
 * ❖ الارتباطات:
 *   - يُستدعى من: صفحة `auctions-exec/carDetails/page.tsx` أو ما يعادلها.
 *   - يعتمد حاليًا على بيانات ثابتة (mocked data)، ويمكن ربطه لاحقًا بقاعدة بيانات فعلية.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop(); // استخراج ID من الرابط

    const data = {
      "1": {
        id: "1",
        title: "مرسيدس SLS AMG",
        category: "سيارات",
        description: "سيارة مرسيدس SLS AMG موديل 2021 بتعديلات خاصة ومصفحة من الفئة B6، حالة ممتازة وضمان مفتوح",
        price: 1250000,
        currentBid: 1350000,
        image: "/executive/mercedes-sls.jpg"
      },
      "2": {
        id: "2",
        title: "ساعة Patek Philippe Nautilus",
        category: "ساعات",
        description: "ساعة Patek Philippe Nautilus إصدار محدود رقم 18/25 مصنوعة من الذهب الوردي، مع توثيق من الشركة الأم",
        price: 875000,
        currentBid: 880000,
        image: "/executive/patek-nautilus.jpg"
      }
    };

    if (id && id in data) {
      return NextResponse.json(data[id]);
    }

    return NextResponse.json(
      { error: "العنصر غير موجود" },
      { status: 404 }
    );
  } catch (error) {
    console.error("خطأ:", error);
    return NextResponse.json(
      { error: "خطأ في الخادم" },
      { status: 500 }
    );
  }
}
