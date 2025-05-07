/**
 * مسار الملف: app/api/submit-bid/route.ts
 *
 * ❖ وظيفة الملف:
 *   - استقبال البيانات المرسلة من صفحة المزايدة (مثل السعر، معرف المزاد، معرف المستخدم).
 *   - يستخدم لتسجيل مزايدة جديدة في المزادات العادية أو الفاخرة.
 *
 * ❖ الارتباطات:
 *   - يُستدعى عادة من خلال زر "قدّم مزايدتك" في صفحة تفاصيل المزاد.
 *   - يمكن ربطه مستقبلاً بقاعدة بيانات (مثل PostgreSQL أو SQLite) لتخزين المزايدات.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { itemId, bidAmount, userId } = body;

    // تحقق بسيط لضمان وجود البيانات الأساسية
    if (!itemId || !bidAmount || !userId) {
      return NextResponse.json(
        { error: "البيانات غير مكتملة" },
        { status: 400 }
      );
    }

    // ⚠️ في النسخة الحالية: البيانات لا تُخزَّن بل تُطبع فقط لأغراض التطوير
    console.log("تم استقبال مزايدة جديدة:", {
      itemId,
      bidAmount,
      userId
    });

    return NextResponse.json({ success: true, message: "تم تسجيل المزايدة بنجاح" });
  } catch (error) {
    console.error("خطأ أثناء تقديم المزايدة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تقديم المزايدة" },
      { status: 500 }
    );
  }
}
