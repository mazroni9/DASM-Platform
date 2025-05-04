/**
 * 📝 الملف: مسار API لإضافة الأجهزة الطبية المستعملة
 * 📁 المسار: Frontend-local/app/api/medical-market/add/route.ts
 * 
 * ✅ الوظيفة:
 * - استقبال بيانات الأجهزة الطبية المستعملة من نموذج الإدخال
 * - معالجة الصور المرفقة وملف PDF
 * - حفظ البيانات في قاعدة البيانات في جدول products
 * 
 * ✅ طريقة الربط:
 * - يستقبل طلبات POST من صفحة forms/medical-market-entry
 * - يحتفظ بالصور في مجلد /auctionsPIC/quality-medicalPIC
 * - يحتفظ بملفات PDF في مجلد /auctionsPIC/quality-medicalPIC/pdfReports
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db'; // استيراد اتصال قاعدة البيانات

// تحديد المسار الذي سيتم حفظ الصور فيه
const IMAGES_DIRECTORY = path.join(process.cwd(), 'public', 'auctionsPIC', 'quality-medicalPIC');
// تحديد المسار الذي سيتم حفظ ملفات PDF فيه
const PDF_DIRECTORY = path.join(process.cwd(), 'public', 'auctionsPIC', 'quality-medicalPIC', 'pdfReports');

// التأكد من وجود المجلدات، وإنشاؤها إذا لم تكن موجودة
if (!fs.existsSync(IMAGES_DIRECTORY)) {
  fs.mkdirSync(IMAGES_DIRECTORY, { recursive: true });
}

if (!fs.existsSync(PDF_DIRECTORY)) {
  fs.mkdirSync(PDF_DIRECTORY, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    // التحقق من أن الطلب هو FormData
    if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
      return NextResponse.json(
        { message: 'يجب أن يكون الطلب بصيغة FormData' },
        { status: 400 }
      );
    }

    // استخراج البيانات من FormData
    const formData = await request.formData();
    
    // استخراج البيانات الأساسية
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const specs = formData.get('specs') as string;
    const price = formData.get('price') as string;
    const condition = formData.get('condition') as string;
    const manufacturer = formData.get('manufacturer') as string;
    const model_year = formData.get('model_year') as string;
    const category = formData.get('category') as string || 'الأجهزة الطبية';

    // التحقق من البيانات الإلزامية
    if (!name || !description || !specs || !price || !condition || !manufacturer || !model_year) {
      return NextResponse.json(
        { message: 'جميع الحقول الإلزامية مطلوبة' },
        { status: 400 }
      );
    }

    // معالجة الصور
    const imageFiles = formData.getAll('images') as File[];
    const imageUrls: string[] = [];

    if (!imageFiles || imageFiles.length === 0) {
      return NextResponse.json(
        { message: 'يجب إرفاق صورة واحدة على الأقل' },
        { status: 400 }
      );
    }

    // معالجة وحفظ الصور
    for (const imageFile of imageFiles) {
      if (imageFile.size > 0) {
        const fileExtension = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `medical_${uuidv4()}.${fileExtension}`;
        const filePath = path.join(IMAGES_DIRECTORY, fileName);
        
        // تحويل الملف إلى Buffer
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        
        // حفظ الملف
        fs.writeFileSync(filePath, buffer);
        
        // إضافة المسار النسبي للصورة إلى المصفوفة
        imageUrls.push(`/auctionsPIC/quality-medicalPIC/${fileName}`);
      }
    }

    // معالجة ملف PDF إذا وجد
    let pdfUrl = '';
    const pdfFile = formData.get('pdf_report') as File;
    
    if (pdfFile && pdfFile.size > 0) {
      const fileExtension = pdfFile.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileName = `medical_report_${uuidv4()}.${fileExtension}`;
      const filePath = path.join(PDF_DIRECTORY, fileName);
      
      // تحويل الملف إلى Buffer
      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      
      // حفظ الملف
      fs.writeFileSync(filePath, buffer);
      
      // حفظ المسار النسبي للملف
      pdfUrl = `/auctionsPIC/quality-medicalPIC/pdfReports/${fileName}`;
    }

    // إعداد البيانات للحفظ في قاعدة البيانات
    const productData = {
      category,
      name,
      description,
      specs,
      condition,
      price: parseFloat(price),
      manufacturer,
      model_year,
      images: JSON.stringify(imageUrls),
      pdf_report: pdfUrl,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // إدخال البيانات في قاعدة البيانات
    try {
      // استخدام استعلام SQL لإدخال البيانات
      const result = await db.query(
        `INSERT INTO products (category, name, description, specs, condition, price, manufacturer, model_year, images, pdf_report, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          productData.category,
          productData.name,
          productData.description,
          productData.specs,
          productData.condition,
          productData.price,
          productData.manufacturer,
          productData.model_year,
          productData.images,
          productData.pdf_report,
          productData.created_at,
          productData.updated_at
        ]
      );
      
      // إعادة معرف المنتج الذي تم إدخاله
      return NextResponse.json({
        message: 'تمت إضافة الجهاز الطبي بنجاح',
        productId: result.rows[0].id
      }, { status: 201 });
      
    } catch (dbError) {
      console.error('خطأ في قاعدة البيانات:', dbError);
      
      // حذف الملفات التي تم رفعها في حالة فشل الإدخال
      imageUrls.forEach(url => {
        const filePath = path.join(process.cwd(), 'public', url.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
      
      if (pdfUrl) {
        const pdfPath = path.join(process.cwd(), 'public', pdfUrl.replace(/^\//, ''));
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
        }
      }
      
      return NextResponse.json(
        { message: 'خطأ في حفظ البيانات في قاعدة البيانات' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('خطأ في معالجة الطلب:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء معالجة الطلب' },
      { status: 500 }
    );
  }
} 