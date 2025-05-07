/**
 * 📁 المسار: Frontend-local/app/api/executive-auctions/route.ts
 *
 * 🧾 الغرض من الملف:
 * هذا الملف يُستخدم لجلب بيانات مزاد تنفيذي ثابتة (Executive Auctions) بدون قاعدة بيانات فعلية.
 * يعرض بيانات مزاد محدد بناءً على رقم `id` المستخرج من الرابط.
 *
 * 🔗 الارتباطات:
 * - يُستخدم ضمن صفحة عرض تفاصيل المزاد التنفيذي.
 * - يعتمد على الطلب الوارد من المسار `/api/executive-auctions/[id]`
 */

import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest } from 'next'; // هذا ليس ضروري ولكن ممكن تحتاجه لو توسعت مستقبلاً

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop(); // استخراج آخر جزء من الرابط كـ id

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
