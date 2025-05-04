
/**
 * ✅ API لتأكيد البيع وتحديث auction_result
 * 📁 المسار: app/api/items/confirm-sale/route.ts
 *
 * ✅ الوظيفة:
 * - يستقبل POST يحتوي على itemId و result
 * - يُحدّث auction_result في جدول items داخل auctions.db
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

export async function POST(req: NextRequest) {
  try {
    const db = await getDB();
    const body = await req.json();
    const { itemId, result } = body;

    if (!itemId || !result) {
      return NextResponse.json({ error: 'Missing itemId or result' }, { status: 400 });
    }

    await db.run('UPDATE items SET auction_result = ? WHERE id = ?', result, itemId);

    return NextResponse.json({ success: true, message: 'تم تحديث نتيجة المزاد' });
  } catch (err) {
    console.error('Error updating auction result:', err);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
