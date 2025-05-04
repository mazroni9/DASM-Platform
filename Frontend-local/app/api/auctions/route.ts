import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

export async function POST(req: NextRequest) {
  try {
    // الحصول على البيانات من FormData
    const formData = await req.formData();
    
    // استخراج البيانات
    const make = formData.get('make') as string;
    const model = formData.get('model') as string;
    const year = formData.get('year') as string;
    const vin = formData.get('vin') as string;
    const fuel = formData.get('fuel') as string;
    const kilometers = formData.get('kilometers') as string;
    const color = formData.get('color') as string;
    const inspectionCompany = formData.get('inspectionCompany') as string;
    const minPrice = formData.get('minPrice') as string;
    const maxPrice = formData.get('maxPrice') as string;
    const auctionType = formData.get('auctionType') as string;
    const carCategory = formData.get('carCategory') as string;
    const imagePath = formData.get('imagePath') as string || '/public/auctionsPIC/auctions-car/luxuryPIC';
    
    // الصور وتقرير الفحص
    const images = formData.getAll('images') as File[];
    const report = formData.get('report') as File;
    
    // إنشاء معرّف فريد للسيارة
    const carId = `car_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // إنشاء مسار الصور
    const folderPath = join(process.cwd(), imagePath);
    const carFolderPath = join(folderPath, carId);
    
    try {
      // إنشاء المجلد للسيارة
      await mkdir(carFolderPath, { recursive: true });
    } catch (err) {
      console.error('Error creating directory:', err);
      return NextResponse.json({ error: 'فشل في إنشاء مجلد للصور' }, { status: 500 });
    }
    
    // حفظ الصور
    const imageURLs: string[] = [];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const buffer = Buffer.from(await image.arrayBuffer());
      const imageName = `${carId}_image_${i + 1}.${image.name.split('.').pop()}`;
      const imageSavePath = join(carFolderPath, imageName);
      
      try {
        await writeFile(imageSavePath, buffer);
        imageURLs.push(`${imagePath}/${carId}/${imageName}`);
      } catch (err) {
        console.error('Error saving image:', err);
        return NextResponse.json({ error: 'فشل في حفظ الصور' }, { status: 500 });
      }
    }
    
    // حفظ تقرير الفحص إذا كان موجودًا
    let reportURL = '';
    
    if (report) {
      const buffer = Buffer.from(await report.arrayBuffer());
      const reportName = `${carId}_report.pdf`;
      const reportSavePath = join(carFolderPath, reportName);
      
      try {
        await writeFile(reportSavePath, buffer);
        reportURL = `${imagePath}/${carId}/${reportName}`;
      } catch (err) {
        console.error('Error saving report:', err);
        return NextResponse.json({ error: 'فشل في حفظ تقرير الفحص' }, { status: 500 });
      }
    }
    
    // حفظ بيانات السيارة في قاعدة البيانات
    const db = await open({
      filename: 'backend/database/auctions.db',
      driver: sqlite3.Database,
    });
    
    // إدراج البيانات في الجدول
    await db.run(`
      INSERT INTO auctions (
        id, الماركة, الموديل, "سنة الصنع", "رقم الشاصي", "نوع الوقود", "رقم العداد",
        "لون السيارة", "شركة الفحص", "سعر الافتتاح", "اعلى سعر", "نوع المزاد", "فئة السيارة",
        "مسار الصور", "عدد الصور", "رابط تقرير الفحص", "نتيجة المزايدة"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      carId,
      make,
      model,
      year,
      vin,
      fuel,
      kilometers,
      color,
      inspectionCompany,
      minPrice,
      maxPrice,
      auctionType,
      carCategory,
      JSON.stringify(imageURLs),
      images.length,
      reportURL,
      auctionType === 'instant' ? 'الفوري' : auctionType === 'silent' ? 'الصامت' : 'الحراج المباشر'
    ]);
    
    return NextResponse.json({
      success: true,
      message: 'تم إدخال بيانات السيارة بنجاح',
      carId,
      imageURLs,
      reportURL
    });
    
  } catch (error) {
    console.error('Error processing car data:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة بيانات السيارة' }, { status: 500 });
  }
}
