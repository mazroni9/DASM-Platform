/**
 * ✅ API: تقديم المزايدة
 * 📁 المسار: Frontend-local/app/api/submit-bid/route.ts
 *
 * ✅ المنطق:
 * - يمنع المزايدات الأقل من السعر الحالي
 * - ❗️يستثني المزاد الصامت: يسمح بتقديم مزايدة أقل حتى 10% فقط
 */

import { NextResponse } from 'next/server';
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

export async function POST(req: Request) {
  try {
    const { item_id, bid_amount } = await req.json();

    if (!item_id || !bid_amount || isNaN(bid_amount)) {
      return NextResponse.json({ error: 'البيانات ناقصة أو غير صالحة' }, { status: 400 });
    }

    // الاتصال بقاعدة البيانات
    const db = await getDB();

    // ✅ جلب بيانات السيارة
    const item = await db.get(
      'SELECT current_price, auction_type FROM items WHERE id = ?',
      [item_id]
    );

    if (!item) {
      return NextResponse.json({ error: 'السيارة غير موجودة' }, { status: 404 });
    }

    const currentPrice = item.current_price;
    const type = item.auction_type;

    // ✅ التحقق من نوع المزاد
    if (type === 'silent') {
      const minAllowed = currentPrice * 0.9; // -10%
      if (bid_amount < minAllowed) {
        return NextResponse.json({
          error: `لا يمكن تقديم مزايدة تقل عن ${minAllowed.toFixed(2)} ريال (حد -10%)`,
        }, { status: 400 });
      }
    } else {
      // ✅ في جميع الأنواع الأخرى: لا تقبل إلا مزايدة أعلى من السعر
      if (bid_amount <= currentPrice) {
        return NextResponse.json({
          error: 'المزايدة يجب أن تكون أعلى من السعر الحالي',
        }, { status: 400 });
      }
    }

    // ✅ تحديث السعر في جدول items
    await db.run(
      'UPDATE items SET current_price = ? WHERE id = ?',
      [bid_amount, item_id]
    );

    // ✅ تسجيل المزايدة في جدول bids
    await db.run(
      'INSERT INTO bids (item_id, bid_amount, created_at) VALUES (?, ?, DATETIME("now"))',
      [item_id, bid_amount]
    );

    return NextResponse.json({ success: true, message: 'تم تسجيل المزايدة بنجاح' });

  } catch (err) {
    console.error('❌ خطأ في تسجيل المزايدة:', err);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
