import { NextRequest, NextResponse } from 'next/server';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

// API لإرسال طلب عضوية جديد
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // التحقق من البيانات الأساسية
    if (!data.name || !data.phone) {
      return NextResponse.json({ error: 'الاسم ورقم الهاتف مطلوبان' }, { status: 400 });
    }
    
    // في الإصدار النهائي، سيتم إنشاء جدول executive_requests وتسجيل الطلب فيه
    /*
    const db = await open({
      filename: 'backend/database/auctions.db',
      driver: sqlite3,
    });
    
    // إدخال الطلب الجديد في قاعدة البيانات
    const result = await db.run(
      'INSERT INTO executive_requests (user_id, name, phone, email, note, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        data.userId || 0,
        data.name,
        data.phone,
        data.email || '',
        data.note || '',
        'pending',
        new Date().toISOString()
      ]
    );
    */
    
    // للعرض التوضيحي، نقوم بإرجاع استجابة نجاح مباشرة
    return NextResponse.json({
      success: true, 
      message: 'تم تقديم طلب العضوية بنجاح، سيتم التواصل معك خلال 24 ساعة',
      requestId: Math.floor(Math.random() * 1000) + 1000
    });
    
  } catch (error) {
    console.error('Error submitting request:', error);
    return NextResponse.json({ error: 'حدث خطأ في معالجة الطلب' }, { status: 500 });
  }
}

// API لجلب طلبات العضوية (للإدارة فقط)
export async function GET(req: NextRequest) {
  try {
    // التحقق من صلاحيات المستخدم (يجب أن يكون مسؤول)
    const isAdmin = false; // سيتم استبدالها بمنطق التحقق الحقيقي
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 403 });
    }
    
    // في الإصدار النهائي، سيتم استعلام الطلبات من قاعدة البيانات
    /*
    const db = await open({
      filename: 'backend/database/auctions.db',
      driver: sqlite3,
    });
    
    // جلب جميع الطلبات مرتبة حسب تاريخ الإنشاء (الأحدث أولاً)
    const requests = await db.all('SELECT * FROM executive_requests ORDER BY created_at DESC');
    */
    
    // بيانات مزيفة للعرض التوضيحي
    const requests = [
      { 
        id: 1, 
        name: 'سلطان محمد الزهراني',
        phone: '05xxxxxxxx', 
        email: 'sultan@example.com',
        note: 'مهتم بمزادات السيارات الفاخرة والساعات النادرة',
        status: 'approved',
        created_at: '2025-06-20T14:32:11.000Z'
      },
      { 
        id: 2, 
        name: 'نورة أحمد العتيبي',
        phone: '05xxxxxxxx', 
        email: 'noura@example.com',
        note: 'أرغب في شراء قطع مجوهرات فاخرة ونادرة',
        status: 'pending',
        created_at: '2025-06-21T09:18:43.000Z'
      },
      { 
        id: 3, 
        name: 'فيصل عبدالله السعيد',
        phone: '05xxxxxxxx', 
        email: 'faisal@example.com',
        note: 'مهتم بساعات Patek Philippe و Audemars Piguet النادرة',
        status: 'pending',
        created_at: '2025-06-22T11:05:22.000Z'
      }
    ];
    
    return NextResponse.json(requests);
    
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: 'حدث خطأ في استرجاع البيانات' }, { status: 500 });
  }
}

// API لتحديث حالة طلب عضوية (للإدارة فقط)
export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    
    // التحقق من البيانات المطلوبة
    if (!data.id || !data.status) {
      return NextResponse.json({ error: 'معرف الطلب والحالة الجديدة مطلوبان' }, { status: 400 });
    }
    
    // التحقق من صلاحيات المستخدم (يجب أن يكون مسؤول)
    const isAdmin = false; // سيتم استبدالها بمنطق التحقق الحقيقي
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 403 });
    }
    
    // التحقق من صحة قيمة الحالة
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(data.status)) {
      return NextResponse.json({ error: 'قيمة الحالة غير صالحة' }, { status: 400 });
    }
    
    // في الإصدار النهائي، سيتم تحديث حالة الطلب في قاعدة البيانات
    /*
    const db = await open({
      filename: 'backend/database/auctions.db',
      driver: sqlite3,
    });
    
    // تحديث حالة الطلب
    await db.run(
      'UPDATE executive_requests SET status = ?, updated_at = ? WHERE id = ?',
      [data.status, new Date().toISOString(), data.id]
    );
    
    // إذا تمت الموافقة على الطلب، قم بتحديث حالة المستخدم إلى عضو تنفيذي
    if (data.status === 'approved') {
      // الحصول على معرف المستخدم من الطلب
      const request = await db.get('SELECT user_id FROM executive_requests WHERE id = ?', data.id);
      
      if (request && request.user_id) {
        // تحديث حالة المستخدم
        await db.run(
          'UPDATE users SET is_executive = 1, executive_until = ? WHERE id = ?',
          [
            // تعيين تاريخ انتهاء العضوية بعد سنة من اليوم
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            request.user_id
          ]
        );
      }
    }
    */
    
    return NextResponse.json({
      success: true,
      message: `تم تحديث حالة الطلب إلى "${data.status === 'approved' ? 'موافق' : data.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}"`,
      id: data.id,
      status: data.status
    });
    
  } catch (error) {
    console.error('Error updating request:', error);
    return NextResponse.json({ error: 'حدث خطأ في تحديث حالة الطلب' }, { status: 500 });
  }
} 