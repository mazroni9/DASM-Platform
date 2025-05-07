/**
 * المسار: app/api/executive-auctions/[id]/route.ts
 *
 * 🔹 الوظيفة: جلب بيانات مزاد تنفيذي محدد حسب معرف `id` ضمن URL.
 * 🔹 الفائدة: يُستخدم في صفحة تفاصيل المزاد التنفيذي لعرض معلومات السيارة أو الساعة الفاخرة.
 * 🔹 الارتباطات:
 *    - يُستخدم من قبل صفحة: `/executive-auctions/[id]`
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

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

    // إذا كان العنصر موجودًا
    if (id && id in data) {
      return NextResponse.json(data[id]);
    }

    // غير موجود
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
