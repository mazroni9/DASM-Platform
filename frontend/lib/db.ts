/**
 * 📝 الملف: اتصال قاعدة البيانات
 * 📁 المسار: Frontend-local/lib/db.ts
 * 
 * ✅ الوظيفة:
 * - إعداد اتصال قاعدة البيانات بواسطة pg
 * - تصدير كائن db للاستخدام في باقي التطبيق
 */

import { Pool } from 'pg';

// تكوين اتصال قاعدة البيانات
const db = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dsam_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// وظيفة للاتصال بقاعدة البيانات والتحقق من الاتصال
const connectToDatabase = async () => {
  try {
    const client = await db.connect();
    console.log('تم الاتصال بقاعدة البيانات بنجاح');
    client.release();
    return true;
  } catch (error) {
    console.error('فشل الاتصال بقاعدة البيانات:', error);
    return false;
  }
};

// محاولة الاتصال عند بدء التطبيق
connectToDatabase();

export { db }; 