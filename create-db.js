// سكربت لإنشاء قاعدة البيانات في المكان الصحيح للـ API
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// تحديد المسارات
const frontendPath = path.resolve(__dirname, 'Frontend-local');
const dbPath = path.join(frontendPath, 'backend/database/auctions.db');
const sqlPath = path.resolve(__dirname, 'backend/database/sql/create-items.sql');

console.log('🚀 بدء إنشاء قاعدة البيانات...');
console.log(`📂 مسار قاعدة البيانات: ${dbPath}`);
console.log(`📂 مسار ملف SQL: ${sqlPath}`);

try {
  // التأكد من وجود المجلدات اللازمة
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    console.log(`📁 إنشاء المجلدات اللازمة: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // حذف قاعدة البيانات القديمة إذا كانت موجودة
  if (fs.existsSync(dbPath)) {
    console.log('🗑️ حذف قاعدة البيانات القديمة...');
    fs.unlinkSync(dbPath);
  }

  // إنشاء قاعدة بيانات جديدة
  console.log('🔌 إنشاء قاعدة بيانات جديدة...');
  const db = new Database(dbPath);

  // التحقق من وجود ملف SQL
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ ملف SQL غير موجود:', sqlPath);
    process.exit(1);
  }

  // قراءة وتنفيذ ملف SQL
  console.log('📝 قراءة ملف SQL...');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('🔨 تنفيذ SQL...');
  db.exec(sql);

  // التحقق من إنشاء البيانات
  const count = db.prepare('SELECT COUNT(*) as count FROM items WHERE subcategory = ?').get('busesTrucks');
  console.log(`📊 عدد الحافلات والشاحنات في قاعدة البيانات: ${count.count}`);

  // استعراض البيانات
  if (count.count > 0) {
    const vehicles = db.prepare('SELECT id, title, subcategory, type FROM items WHERE subcategory = ?').all('busesTrucks');
    console.log('📋 قائمة الحافلات والشاحنات:');
    vehicles.forEach(vehicle => {
      console.log(` - ${vehicle.id}: ${vehicle.title} (${vehicle.type})`);
    });
  }

  console.log('✅ تم إنشاء قاعدة البيانات بنجاح في المسار الصحيح');
  
  // إغلاق الاتصال
  db.close();
  
  // التحقق من وجود قاعدة البيانات بعد الإنشاء
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    console.log(`📊 حجم قاعدة البيانات: ${stats.size} بايت`);
  } else {
    console.error('❌ فشل في إنشاء قاعدة البيانات، الملف غير موجود بعد العملية!');
  }
} catch (err) {
  console.error('❌ فشل في إنشاء قاعدة البيانات:', err);
} 