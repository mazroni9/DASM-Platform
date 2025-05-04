import { NextRequest, NextResponse } from 'next/server';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

export async function GET(req: NextRequest) {
  try {
    // محاكاة للتحقق من المستخدم - سيتم تحسينه لاحقًا مع نظام المصادقة
    const isExecutive = true; // يجب أن يتم التحقق فعليًا من حالة المستخدم

    if (!isExecutive) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 403 });
    }

    // في الإصدار النهائي، سنقوم بفتح قاعدة البيانات واستعلام المنتجات التنفيذية
    /*
    const db = await open({
      filename: 'backend/database/auctions.db',
      driver: sqlite3,
    });

    const items = await db.all('SELECT * FROM items WHERE is_executive = 1');
    */

    // نستخدم بيانات مزيفة مؤقتة للعرض التوضيحي
    const items = [
      {
        id: 1,
        title: 'مرسيدس SLS AMG',
        category: 'سيارات',
        description: 'سيارة مرسيدس SLS AMG موديل 2021 بتعديلات خاصة ومصفحة من الفئة B6، حالة ممتازة وضمان مفتوح',
        origin: 'ألمانيا',
        condition: 'ممتازة',
        price: 1250000,
        currentBid: 1350000,
        bidCount: 5,
        image: '/executive/mercedes-sls.jpg',
        hasCertificate: true,
        specialBadge: 'ملك سابق',
        is_executive: 1
      },
      {
        id: 2,
        title: 'ساعة Patek Philippe Nautilus',
        category: 'ساعات',
        description: 'ساعة Patek Philippe Nautilus إصدار محدود رقم 18/25 مصنوعة من الذهب الوردي، مع توثيق من الشركة الأم',
        origin: 'سويسرا',
        condition: 'جديدة',
        price: 875000,
        currentBid: 880000,
        bidCount: 3,
        image: '/executive/patek-nautilus.jpg',
        hasCertificate: true,
        specialBadge: 'إصدار محدود',
        is_executive: 1
      },
      {
        id: 3,
        title: 'طقم ألماس VAN CLEEF',
        category: 'مجوهرات',
        description: 'طقم ألماس فاخر من VAN CLEEF يتكون من عقد وسوار وخاتم، إجمالي قيراط 18.5 بشهادة GIA',
        origin: 'فرنسا',
        condition: 'ممتازة',
        price: 650000,
        currentBid: 655000,
        bidCount: 2,
        image: '/executive/diamond-set.jpg',
        hasCertificate: true,
        specialBadge: 'استثماري',
        is_executive: 1
      },
    ];

    return NextResponse.json(items);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// API لتسجيل طلب عضوية VIP
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // التحقق من صحة البيانات
    if (!data.name || !data.phone) {
      return NextResponse.json({ error: 'البيانات غير مكتملة' }, { status: 400 });
    }
    
    // في الإصدار النهائي، سنقوم بحفظ الطلب في قاعدة البيانات
    /*
    const db = await open({
      filename: 'backend/database/auctions.db',
      driver: sqlite3,
    });

    // إدراج الطلب في جدول executive_requests
    await db.run(
      'INSERT INTO executive_requests (user_id, name, phone, note, status) VALUES (?, ?, ?, ?, ?)',
      [data.userId || 0, data.name, data.phone, data.note, 'pending']
    );
    */
    
    // للعرض التوضيحي، نعيد استجابة نجاح مباشرة
    return NextResponse.json({ 
      success: true,
      message: 'تم استلام طلبك بنجاح. سيتواصل معك فريقنا خلال 24 ساعة.',
      requestId: Math.floor(Math.random() * 1000)
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة الطلب' }, { status: 500 });
  }
} 