
/**
 * ✅ API: نتائج الحراج المباشر (حالي وجاري)
 * 📁 المسار: app/api/live-market/current/route.ts
 *
 * ✅ الوظيفة:
 * - يجلب السيارات من جدول items التي type = 'live'
 * - يحسب نسبة التغير بين current_price و start_price
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

  const results = await db.all(`
    SELECT id, title, current_price, start_price, auction_result,
           ROUND(((current_price - start_price) / start_price) * 100, 2) AS change_percent
    FROM items
    WHERE type = 'live'
    ORDER BY updated_at DESC
  `);

  return NextResponse.json(results);
}
