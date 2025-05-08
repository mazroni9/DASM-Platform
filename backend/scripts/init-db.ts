// ✅ سكربت تهيئة قاعدة البيانات مع دعم ESM
// 📁 backend/scripts/init-db.ts

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Database from 'better-sqlite3';

// ⬇️ حل مشكلة __dirname في ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// تحديد المسارات
const dbPath = path.resolve(__dirname, '../database/auctions.db');
const createItemsSQL = path.resolve(__dirname, '../database/sql/create-items.sql');
const createBidsSQL = path.resolve(__dirname, '../database/sql/create-bids.sql');

try {
  const db = new Database(dbPath);

  console.log('🔄 بدء تهيئة قاعدة البيانات...');

  // إنشاء جدول items وإضافة البيانات
  if (fs.existsSync(createItemsSQL)) {
    const itemsSQL = fs.readFileSync(createItemsSQL, 'utf-8');
    db.exec(itemsSQL);
    console.log('✅ جدول items تم إنشاؤه وإضافة البيانات بنجاح');
  } else {
    console.error('⚠️ ملف SQL للعناصر غير موجود:', createItemsSQL);
  }

  // إنشاء جدول bids
  if (fs.existsSync(createBidsSQL)) {
    const bidsSQL = fs.readFileSync(createBidsSQL, 'utf-8');
    db.exec(bidsSQL);
    console.log('✅ جدول bids تم إنشاؤه بنجاح');
  } else {
    console.error('⚠️ ملف SQL للمزايدات غير موجود:', createBidsSQL);
  }

  db.close();
  console.log('✅ تم تهيئة قاعدة البيانات بنجاح');
} catch (err) {
  console.error('❌ فشل في تهيئة قاعدة البيانات:', err);
}
