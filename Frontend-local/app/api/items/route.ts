import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

// استخدام المسار الصحيح بناءً على السياق
// التحقق من وجود المسارات المحتملة
const possiblePaths = [
  path.join(process.cwd(), 'backend/database/auctions.db'), // المسار الأصلي
  path.join(process.cwd(), '../backend/database/auctions.db'), // للوصول من Frontend-local
  path.resolve(__dirname, '../../../../../backend/database/auctions.db'), // مسار مطلق من مجلد API
];

// اختيار أول مسار موجود
let dbPath = possiblePaths[0]; // المسار الافتراضي
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    dbPath = p;
    console.log(`✅ تم العثور على قاعدة البيانات في المسار: ${p}`);
    break;
  }
}

console.log(`📂 مسار قاعدة البيانات المستخدم: ${dbPath}`);

async function getDB() {
  console.log(`🔌 الاتصال بقاعدة البيانات: ${dbPath}`);
  return open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
}

// POST: إدخال بيانات جديدة
export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const db = await getDB();

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const subcategory = formData.get('subcategory') as string;
  const type = formData.get('type') as string;
  const min_price = formData.get('min_price');
  const max_price = formData.get('max_price');
  const start_price = formData.get('start_price');
  const current_price = formData.get('current_price');
  const high_price = formData.get('high_price');
  const low_price = formData.get('low_price');
  const images = formData.getAll('images');
  const inspection_report = formData.get('inspection_report') as string;
  const additional_info = formData.get('additional_info') as string;

  const result = await db.run(
    `INSERT INTO items 
      (title, description, category, subcategory, type, min_price, max_price, start_price, current_price, high_price, low_price, images, inspection_report, additional_info)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      description,
      category,
      subcategory,
      type,
      Number(min_price),
      Number(max_price),
      Number(start_price),
      Number(current_price),
      Number(high_price),
      Number(low_price),
      JSON.stringify(images),
      inspection_report,
      additional_info
    ]
  );

  return NextResponse.json({ status: 'success', id: result.lastID });
}

// GET: جلب جميع العناصر حسب الفئة والفئة الفرعية
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const subcategory = searchParams.get('subcategory');
  const id = searchParams.get('id');

  console.log('🔍 استعلام API:', { category, subcategory, id });

  try {
    const db = await getDB();

    let rows;
    
    if (id) {
      // جلب عنصر محدد بواسطة المعرف
      console.log(`🔍 البحث عن العنصر بالمعرف: ${id}`);
      rows = await db.get(`SELECT * FROM items WHERE id = ?`, [id]);
      console.log(`ℹ️ نتيجة البحث:`, rows ? 'تم العثور على العنصر' : 'لم يتم العثور على العنصر');
      return NextResponse.json(rows);
    }
    
    if (category && subcategory) {
      // جلب العناصر حسب الفئة والفئة الفرعية
      console.log(`🔍 البحث عن category=${category} & subcategory=${subcategory}`);      
      rows = await db.all(
        `SELECT * FROM items WHERE category = ? AND subcategory = ? ORDER BY created_at DESC`, 
        [category, subcategory]
      );
      console.log(`📊 تم العثور على ${rows?.length || 0} نتيجة`);
    } else if (category) {
      // جلب العناصر حسب الفئة فقط
      rows = await db.all(
        `SELECT * FROM items WHERE category = ? ORDER BY created_at DESC`, 
        [category]
      );
      console.log(`📊 تم العثور على ${rows?.length || 0} نتيجة للفئة ${category}`);
    } else {
      // جلب جميع العناصر
      rows = await db.all(`SELECT * FROM items ORDER BY created_at DESC`);
      console.log(`📊 تم العثور على ${rows?.length || 0} نتيجة (كل العناصر)`);
    }

    // التحقق من عدد النتائج
    console.log(`📊 محتوى النتائج:`, JSON.stringify(rows).substring(0, 100) + '...');
    
    return NextResponse.json(rows);
  } catch (err) {
    console.error('❌ خطأ في جلب البيانات:', err);
    return NextResponse.json({ error: 'خطأ في الاتصال بقاعدة البيانات' }, { status: 500 });
  }
}
