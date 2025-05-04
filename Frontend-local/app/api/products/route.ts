/**
 * 📝 الملف: مسار API لجلب المنتجات
 * 📁 المسار: Frontend-local/app/api/products/route.ts
 * 
 * ✅ الوظيفة:
 * - استرجاع قائمة المنتجات من قاعدة البيانات
 * - دعم الفلترة حسب الفئة (category)
 * - استخدامه في صفحة عرض السيرفرات والآلات المكتبية والأجهزة الطبية
 */

import { NextRequest, NextResponse } from 'next/server';
// import { db } from '../../../lib/db'; // استيراد اتصال قاعدة البيانات بالمسار النسبي

// بيانات تجريبية للسيرفرات
const mockProducts = [
  // السيرفرات
  {
    id: 1,
    name: 'سيرفر ديل PowerEdge R740',
    description: 'سيرفر احترافي لمراكز البيانات بمواصفات عالية، يدعم معالجات إنتل زيون ويتميز بأداء ممتاز للتطبيقات التجارية',
    price: 12500,
    condition: 'excellent',
    images: ['/serverPics/server1.jpg', '/serverPics/server1-b.jpg'],
    created_at: '2025-01-15T10:30:00Z',
    category: 'السيرفرات'
  },
  {
    id: 2,
    name: 'سيرفر HP ProLiant DL380 Gen10',
    description: 'سيرفر متوازن للشركات المتوسطة والكبيرة، يدعم تقنيات التخزين المتقدمة ويوفر أداء وموثوقية ممتازة',
    price: 15800,
    condition: 'new',
    images: ['/serverPics/server2.jpg', '/serverPics/server2-b.jpg'],
    created_at: '2025-02-20T14:45:00Z',
    category: 'السيرفرات'
  },
  {
    id: 3,
    name: 'سيرفر IBM System x3650 M5',
    description: 'سيرفر قوي مع إمكانية توسيع كبيرة، مثالي للشركات التي تتطلب أداء عالي وتوفر مستمر لأنظمتها',
    price: 9200,
    condition: 'good',
    images: ['/serverPics/server3.jpg'],
    created_at: '2025-03-05T09:15:00Z',
    category: 'السيرفرات'
  },
  {
    id: 4,
    name: 'سيرفر لينوفو ThinkSystem SR650',
    description: 'سيرفر عالي الأداء مع تصميم مرن يدعم مختلف حالات الاستخدام من قواعد البيانات إلى الحوسبة السحابية',
    price: 14300,
    condition: 'excellent',
    images: ['/serverPics/server4.jpg', '/serverPics/server4-b.jpg'],
    created_at: '2025-03-18T11:20:00Z',
    category: 'السيرفرات'
  },
  
  // الآلات المكتبية
  {
    id: 101,
    name: 'آلة تصوير Canon ImageRunner 2545',
    description: 'آلة تصوير وطابعة ليزرية متعددة الوظائف، مناسبة للمكاتب متوسطة الحجم مع إمكانية الطباعة والمسح الضوئي والنسخ',
    price: 7500,
    condition: 'good',
    images: ['/officePics/copier1.jpg', '/officePics/copier1-b.jpg'],
    created_at: '2025-02-10T14:30:00Z',
    category: 'الآلات المكتبية'
  },
  {
    id: 102,
    name: 'طابعة HP LaserJet M507x',
    description: 'طابعة ليزرية أحادية اللون عالية السرعة للمكاتب، بسرعة طباعة 45 صفحة في الدقيقة، مع ميزات أمان متقدمة',
    price: 3200,
    condition: 'excellent',
    images: ['/officePics/printer1.jpg'],
    created_at: '2025-01-25T09:45:00Z',
    category: 'الآلات المكتبية'
  },
  {
    id: 103,
    name: 'ماسح ضوئي Fujitsu ScanSnap iX1600',
    description: 'ماسح ضوئي احترافي سريع بسرعة 40 صفحة في الدقيقة، مع وحدة تغذية تلقائية للمستندات بسعة 50 ورقة',
    price: 1800,
    condition: 'new',
    images: ['/officePics/scanner1.jpg', '/officePics/scanner1-b.jpg'],
    created_at: '2025-03-12T11:15:00Z',
    category: 'الآلات المكتبية'
  },
  {
    id: 104,
    name: 'آلة تغليف GBC Fusion 7000L',
    description: 'آلة تغليف احترافية مناسبة للمكاتب والمراكز التجارية، تدعم التغليف الحراري والبارد بعرض A3',
    price: 950,
    condition: 'good',
    images: ['/officePics/laminator1.jpg'],
    created_at: '2025-02-28T13:20:00Z',
    category: 'الآلات المكتبية'
  },
  
  // الأجهزة الطبية
  {
    id: 201,
    name: 'جهاز تخطيط القلب Philips PageWriter TC70',
    description: 'جهاز تخطيط قلب متطور من فيليبس، يوفر تشخيصًا دقيقًا مع شاشة لمس عالية الوضوح وبرمجيات تحليل متقدمة',
    price: 21000,
    condition: 'excellent',
    images: ['/medicalPics/ecg1.jpg', '/medicalPics/ecg1-b.jpg'],
    created_at: '2025-01-18T10:25:00Z',
    category: 'الأجهزة الطبية'
  },
  {
    id: 202,
    name: 'جهاز مراقبة المريض GE Carescape B450',
    description: 'جهاز مراقبة حيوية متنقل يقيس الضغط ومعدل ضربات القلب والأكسجين ودرجة الحرارة، مع شاشة ملونة 10 بوصة',
    price: 18500,
    condition: 'good',
    images: ['/medicalPics/monitor1.jpg'],
    created_at: '2025-02-05T15:40:00Z',
    category: 'الأجهزة الطبية'
  },
  {
    id: 203,
    name: 'جهاز تنفس صناعي Dräger Evita V500',
    description: 'جهاز تنفس صناعي متطور للعناية المركزة، يوفر مجموعة واسعة من أنماط التهوية والتشخيص المتقدم',
    price: 45000,
    condition: 'excellent',
    images: ['/medicalPics/ventilator1.jpg', '/medicalPics/ventilator1-b.jpg'],
    created_at: '2025-03-01T09:30:00Z',
    category: 'الأجهزة الطبية'
  },
  {
    id: 204,
    name: 'كرسي أسنان Sirona Intego',
    description: 'وحدة أسنان متكاملة تشمل كرسي مريح وأنظمة مياه وهواء وشفط، مع حامل أدوات قابل للتعديل وإضاءة LED',
    price: 29500,
    condition: 'good',
    images: ['/medicalPics/dental1.jpg'],
    created_at: '2025-02-15T12:10:00Z',
    category: 'الأجهزة الطبية'
  }
];

export async function GET(request: NextRequest) {
  try {
    // استخراج معلمات الاستعلام
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    // فلترة المنتجات التجريبية حسب الفئة
    let filteredProducts = mockProducts;
    if (category) {
      filteredProducts = mockProducts.filter(product => product.category === category);
    }
    
    // تأخير اصطناعي لمحاكاة استجابة الخادم (1 ثانية)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // إرجاع النتائج
    return NextResponse.json({
      message: 'تم استرجاع المنتجات بنجاح',
      products: filteredProducts
    });
    
  } catch (error) {
    console.error('خطأ في جلب المنتجات:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب المنتجات' },
      { status: 500 }
    );
  }
} 