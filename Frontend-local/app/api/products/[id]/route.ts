/**
 * 📝 الملف: مسار API لجلب منتج محدد بالمعرف
 * 📁 المسار: Frontend-local/app/api/products/[id]/route.ts
 * 
 * ✅ الوظيفة:
 * - استرجاع منتج محدد بواسطة المعرف (id)
 * - يستخدم في صفحة تفاصيل المنتج (مثل صفحة تفاصيل السيرفر)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db'; // استيراد اتصال قاعدة البيانات

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // التحقق من أن المعرف صالح
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { message: 'معرف المنتج غير صالح' },
        { status: 400 }
      );
    }
    
    // استعلام لجلب المنتج بالمعرف
    const result = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    
    // التحقق من وجود المنتج
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'المنتج غير موجود' },
        { status: 404 }
      );
    }
    
    // إرجاع بيانات المنتج
    return NextResponse.json({
      message: 'تم استرجاع المنتج بنجاح',
      product: result.rows[0]
    });
    
  } catch (error) {
    console.error('خطأ في جلب المنتج:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب المنتج' },
      { status: 500 }
    );
  }
}