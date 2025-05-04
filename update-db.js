// سكربت تحديث قاعدة البيانات باستخدام CommonJS
const fs = require('fs');
const path = require('path');

console.log('🚀 بدء التنفيذ...');

try {
  console.log('📦 استيراد better-sqlite3...');
  const Database = require('better-sqlite3');
  console.log('✅ تم استيراد better-sqlite3 بنجاح');

  // تحديد المسارات
  const dbPath = path.resolve(__dirname, 'backend/database/auctions.db');
  const createItemsSQL = path.resolve(__dirname, 'backend/database/sql/create-items.sql');
  const createBidsSQL = path.resolve(__dirname, 'backend/database/sql/create-bids.sql');

  console.log(`📂 مسار قاعدة البيانات: ${dbPath}`);
  console.log(`📂 مسار ملف SQL للعناصر: ${createItemsSQL}`);

  // التأكد من وجود مجلد قاعدة البيانات
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    console.log(`📁 إنشاء مجلد قاعدة البيانات: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`✅ تم إنشاء المجلد: ${dbDir}`);
  } else {
    console.log(`✅ مجلد قاعدة البيانات موجود: ${dbDir}`);
  }

  // التحقق من وجود ملفات SQL
  if (fs.existsSync(createItemsSQL)) {
    console.log('✅ ملف SQL للعناصر موجود');
  } else {
    console.error('❌ ملف SQL للعناصر غير موجود:', createItemsSQL);
    process.exit(1);
  }

  if (fs.existsSync(createBidsSQL)) {
    console.log('✅ ملف SQL للمزايدات موجود');
  } else {
    console.log('⚠️ ملف SQL للمزايدات غير موجود (سيتم تجاهله):', createBidsSQL);
  }

  // اتصال بقاعدة البيانات
  console.log('🔌 الاتصال بقاعدة البيانات...');
  const db = new Database(dbPath);
  console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

  console.log('🔄 بدء تحديث قاعدة البيانات...');

  // تنفيذ SQL لإنشاء وتحديث جدول items
  console.log('📝 قراءة ملف SQL للعناصر...');
  const itemsSQL = fs.readFileSync(createItemsSQL, 'utf-8');
  console.log('✅ تم قراءة ملف SQL للعناصر');
  
  console.log('🔨 تنفيذ SQL للعناصر...');
  db.exec(itemsSQL);
  console.log('✅ تم تنفيذ SQL للعناصر بنجاح');

  // تنفيذ SQL لإنشاء جدول bids إذا كان موجوداً
  if (fs.existsSync(createBidsSQL)) {
    console.log('📝 قراءة ملف SQL للمزايدات...');
    const bidsSQL = fs.readFileSync(createBidsSQL, 'utf-8');
    console.log('✅ تم قراءة ملف SQL للمزايدات');
    
    console.log('🔨 تنفيذ SQL للمزايدات...');
    db.exec(bidsSQL);
    console.log('✅ تم تنفيذ SQL للمزايدات بنجاح');
  }

  // استعلام لعرض عدد العناصر في جدول items
  console.log('🔍 استعلام عن عدد الحافلات والشاحنات...');
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM items WHERE subcategory = ?').get('busesTrucks');
    console.log(`📊 عدد الحافلات والشاحنات في قاعدة البيانات: ${count.count}`);
  } catch (queryErr) {
    console.error('❌ خطأ في تنفيذ الاستعلام:', queryErr);
  }

  // إغلاق الاتصال
  console.log('🔌 إغلاق الاتصال بقاعدة البيانات...');
  db.close();
  console.log('✅ تم إغلاق الاتصال بقاعدة البيانات');
  
  console.log('✅ تم تحديث قاعدة البيانات بنجاح');
} catch (err) {
  console.error('❌ فشل في تحديث قاعدة البيانات:', err);
} 