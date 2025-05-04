
/**
 * 🧠 API: مزاد السيارات الصامتة
 * 📁 المسار: app/api/silent-auctions/route.ts
 *
 * ✅ الوظيفة:
 * - جلب كل العناصر من جدول items حيث type = 'silent'
 * - حساب نسبة التغير: (آخر سعر - سعر افتتاح الصامت) ÷ سعر الافتتاح × 100
 * - سعر افتتاح الصامت = آخر سعر من الفوري (لنفس السيارة إذا كانت موجودة)
 *
 * ⚠️ إذا لم تتوفر بيانات من الفوري → يتم عرض النسبة كـ '-'
 */

import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const dbPath = path.join(process.cwd(), 'backend/database/auctions.db');

async function getDB() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
}

export async function GET(req: NextRequest) {
  const db = await getDB();

  // جلب السيارات من نوع silent
  const silentItems = await db.all("SELECT * FROM items WHERE type = 'silent' ORDER BY created_at DESC");

  // جلب آخر سعر لكل سيارة من نوع instant (مزاد فوري)
  const instantItems = await db.all("SELECT * FROM items WHERE type = 'instant'");

  // إنشاء خريطة تحتوي على آخر سعر لكل عنوان سيارة
  const lastPricesMap: Record<string, number> = {};
  instantItems.forEach((item) => {
    lastPricesMap[item.title] = item.current_price;
  });

  // تجهيز الرد مع حساب نسبة التغير
  const response = silentItems.map((item) => {
    const refPrice = lastPricesMap[item.title]; // نستخدم عنوان السيارة كمفتاح

    let change = '-';
    if (refPrice && item.current_price) {
      const percentage = ((item.current_price - refPrice) / refPrice) * 100;
      change = percentage.toFixed(2) + '%';
    }

    return {
      ...item,
      نسبة_التغير: change,
      سعر_افتتاح_الصامت: refPrice || 'غير متاح',
    };
  });

  return NextResponse.json(response);
}
