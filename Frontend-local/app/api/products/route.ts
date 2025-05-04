/**
 * 📝 الملف: مسار API لجلب المنتجات
 * 📁 المسار: Frontend-local/app/api/products/route.ts
 * 
 * ✅ الوظيفة:
 * - استرجاع قائمة المنتجات من قاعدة البيانات
 * - دعم الفلترة حسب الفئة (category)
 * - استخدامه في صفحة عرض السيرفرات
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db'; // استيراد اتصال قاعدة البيانات

export async function GET(request: NextRequest) {
  try {
    // استخراج معلمات الاستعلام
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    // بناء استعلام SQL
    let query = 'SELECT * FROM products';
    let params = [];
    
    // إضافة شرط الفئة إذا تم تحديده
    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    
    // إضافة ترتيب حسب تاريخ الإنشاء (الأحدث أولاً)
    query += ' ORDER BY created_at DESC';
    
    // تنفيذ الاستعلام
    const result = await db.query(query, params);
    
    // إرجاع النتائج
    return NextResponse.json({
      message: 'تم استرجاع المنتجات بنجاح',
      products: result.rows
    });
    
  } catch (error) {
    console.error('خطأ في جلب المنتجات:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب المنتجات' },
      { status: 500 }
    );
  }
} 