// سكربت لنقل قاعدة البيانات إلى المسار الصحيح
const fs = require('fs');
const path = require('path');

// المسار المصدر (المستخدم في fix-db.js)
const sourceDbPath = path.resolve(__dirname, 'backend/database/auctions.db');

// المسار الهدف (المستخدم في API)
const frontendPath = path.resolve(__dirname, 'Frontend-local');
const targetDbPath = path.join(frontendPath, 'backend/database/auctions.db');

console.log('🚀 بدء نقل قاعدة البيانات...');
console.log(`📂 المسار المصدر: ${sourceDbPath}`);
console.log(`📂 المسار الهدف: ${targetDbPath}`);

try {
  // التحقق من وجود قاعدة البيانات المصدر
  if (!fs.existsSync(sourceDbPath)) {
    console.error('❌ قاعدة البيانات المصدر غير موجودة');
    process.exit(1);
  }

  // التأكد من وجود المجلدات اللازمة
  const targetDir = path.dirname(targetDbPath);
  if (!fs.existsSync(targetDir)) {
    console.log(`📁 إنشاء المجلدات اللازمة: ${targetDir}`);
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // نسخ قاعدة البيانات
  fs.copyFileSync(sourceDbPath, targetDbPath);
  console.log('✅ تم نسخ قاعدة البيانات بنجاح');

  // قراءة حجم الملف للتأكد من نجاح العملية
  const stats = fs.statSync(targetDbPath);
  console.log(`📊 حجم قاعدة البيانات: ${stats.size} بايت`);

  console.log('📝 تحقق من طرق الوصول إلى قاعدة البيانات:');
  console.log(`1. process.cwd(): ${process.cwd()}`);
  console.log(`2. الوصول باستخدام process.cwd(): ${path.join(process.cwd(), 'backend/database/auctions.db')}`);
  console.log(`3. الوصول النسبي من API: ${path.join(process.cwd(), 'Frontend-local/backend/database/auctions.db')}`);

  console.log('✅ تم نقل قاعدة البيانات بنجاح');
} catch (err) {
  console.error('❌ فشل في نقل قاعدة البيانات:', err);
} 