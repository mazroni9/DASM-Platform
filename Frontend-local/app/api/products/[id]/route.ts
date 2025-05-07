/**
 * 📝 الملف: مسار API لجلب منتج محدد بالمعرف
 * 📁 المسار: Frontend-local/app/api/products/[id]/route.ts
 * 
 * ✅ الوظيفة:
 * - استرجاع منتج محدد بواسطة المعرف (id)
 * - يستخدم في صفحة تفاصيل المنتج (مثل صفحة تفاصيل السيرفر)
 */

import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/lib/db'; // استيراد اتصال قاعدة البيانات

interface ProductParams {
  id: string;
}

// بيانات تجريبية للسيرفرات
const mockProducts = [
  {
    id: 1,
    name: 'سيرفر ديل PowerEdge R740',
    description: 'سيرفر احترافي لمراكز البيانات بمواصفات عالية، يدعم معالجات إنتل زيون ويتميز بأداء ممتاز للتطبيقات التجارية',
    specs: `المعالج: 2 × Intel Xeon Gold 6248R
ذاكرة الوصول العشوائي: 128GB DDR4 ECC
التخزين: 6 × 1.2TB SAS 10K RPM
كروت الشبكة: 4 × 10Gbps SFP+
نظام التشغيل: VMware ESXi 7.0
الحالة: مستعمل بحالة ممتازة`,
    price: 12500,
    condition: 'excellent',
    images: ['/serverPics/server1.jpg', '/serverPics/server1-b.jpg'],
    pdf_report: '/serverPics/server1-report.pdf',
    created_at: '2025-01-15T10:30:00Z',
    category: 'السيرفرات'
  },
  {
    id: 2,
    name: 'سيرفر HP ProLiant DL380 Gen10',
    description: 'سيرفر متوازن للشركات المتوسطة والكبيرة، يدعم تقنيات التخزين المتقدمة ويوفر أداء وموثوقية ممتازة',
    specs: `المعالج: 2 × Intel Xeon Silver 4214R
ذاكرة الوصول العشوائي: 96GB DDR4 ECC
التخزين: 8 × 960GB SSD Enterprise
كروت الشبكة: 2 × 10Gbps Base-T
نظام التشغيل: Windows Server 2022 Datacenter
الحالة: جديد`,
    price: 15800,
    condition: 'new',
    images: ['/serverPics/server2.jpg', '/serverPics/server2-b.jpg'],
    pdf_report: '/serverPics/server2-report.pdf',
    created_at: '2025-02-20T14:45:00Z',
    category: 'السيرفرات'
  },
  {
    id: 3,
    name: 'سيرفر IBM System x3650 M5',
    description: 'سيرفر قوي مع إمكانية توسيع كبيرة، مثالي للشركات التي تتطلب أداء عالي وتوفر مستمر لأنظمتها',
    specs: `المعالج: 1 × Intel Xeon E5-2640 v4
ذاكرة الوصول العشوائي: 64GB DDR4 ECC
التخزين: 4 × 600GB SAS 15K RPM
كروت الشبكة: 2 × 1Gbps Base-T
نظام التشغيل: Red Hat Enterprise Linux 8
الحالة: مستعمل بحالة جيدة`,
    price: 9200,
    condition: 'good',
    images: ['/serverPics/server3.jpg'],
    pdf_report: '',
    created_at: '2025-03-05T09:15:00Z',
    category: 'السيرفرات'
  },
  {
    id: 4,
    name: 'سيرفر لينوفو ThinkSystem SR650',
    description: 'سيرفر عالي الأداء مع تصميم مرن يدعم مختلف حالات الاستخدام من قواعد البيانات إلى الحوسبة السحابية',
    specs: `المعالج: 2 × Intel Xeon Gold 5218
ذاكرة الوصول العشوائي: 192GB DDR4 ECC
التخزين: 2 × 480GB SSD + 4 × 2TB SAS 7.2K RPM
كروت الشبكة: 4 × 10Gbps SFP+ + 2 × 1Gbps Base-T
نظام التشغيل: VMware ESXi 7.0 Update 2
الحالة: مستعمل بحالة ممتازة`,
    price: 14300,
    condition: 'excellent',
    images: ['/serverPics/server4.jpg', '/serverPics/server4-b.jpg'],
    pdf_report: '/serverPics/server4-report.pdf',
    created_at: '2025-03-18T11:20:00Z',
    category: 'السيرفرات'
  }
];

export async function GET(
  request: NextRequest,
  context: { params: ProductParams }
) {
  try {
    const id = context.params.id;
    
    // التحقق من أن المعرف صالح
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { message: 'معرف المنتج غير صالح' },
        { status: 400 }
      );
    }
    
    // استخدام البيانات التجريبية بدلاً من قاعدة البيانات
    const product = mockProducts.find(p => p.id === parseInt(id));
    
    // التحقق من وجود المنتج
    if (!product) {
      return NextResponse.json(
        { message: 'المنتج غير موجود' },
        { status: 404 }
      );
    }
    
    // تأخير اصطناعي لمحاكاة استجابة الخادم (1 ثانية)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // إرجاع بيانات المنتج
    return NextResponse.json({
      message: 'تم استرجاع المنتج بنجاح',
      product
    });
    
  } catch (error) {
    console.error('خطأ في جلب المنتج:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب المنتج' },
      { status: 500 }
    );
  }
}