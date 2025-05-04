// سكربت لإصلاح قاعدة البيانات
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

console.log('🚀 بدء إصلاح قاعدة البيانات...');

// تحديد المسارات
const dbPath = path.resolve(__dirname, 'backend/database/auctions.db');
const createItemsSQL = path.resolve(__dirname, 'backend/database/sql/create-items.sql');

console.log(`📂 مسار قاعدة البيانات: ${dbPath}`);
console.log(`📂 مسار ملف SQL للعناصر: ${createItemsSQL}`);

try {
  // حذف قاعدة البيانات القديمة إذا كانت موجودة
  if (fs.existsSync(dbPath)) {
    console.log('🗑️ حذف قاعدة البيانات القديمة...');
    fs.unlinkSync(dbPath);
    console.log('✅ تم حذف قاعدة البيانات القديمة');
  }

  // إنشاء قاعدة بيانات جديدة
  console.log('🔌 إنشاء قاعدة بيانات جديدة...');
  const db = new Database(dbPath);
  console.log('✅ تم إنشاء قاعدة بيانات جديدة');

  // قراءة وتنفيذ ملف SQL
  if (fs.existsSync(createItemsSQL)) {
    console.log('📝 قراءة ملف SQL للعناصر...');
    const itemsSQL = fs.readFileSync(createItemsSQL, 'utf-8');
    console.log('✅ تم قراءة ملف SQL للعناصر');
    
    console.log('🔨 تنفيذ SQL...');
    db.exec(itemsSQL);
    console.log('✅ تم تنفيذ SQL بنجاح');
    
    // التحقق من وجود البيانات
    const count = db.prepare('SELECT COUNT(*) as count FROM items WHERE subcategory = ?').get('busesTrucks');
    console.log(`📊 عدد الحافلات والشاحنات في قاعدة البيانات: ${count.count}`);
    
    if (count.count > 0) {
      // استعراض عناوين الحافلات والشاحنات
      console.log('📋 قائمة الحافلات والشاحنات:');
      const vehicles = db.prepare('SELECT id, title, subcategory, type FROM items WHERE subcategory = ?').all('busesTrucks');
      vehicles.forEach(vehicle => {
        console.log(` - ${vehicle.id}: ${vehicle.title} (${vehicle.type})`);
      });
    }
  } else {
    console.error('❌ ملف SQL للعناصر غير موجود');
  }
  
  // إغلاق الاتصال
  db.close();
  console.log('✅ تم إصلاح قاعدة البيانات بنجاح');
} catch (err) {
  console.error('❌ فشل في إصلاح قاعدة البيانات:', err);
} 