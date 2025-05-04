
/**
 * ✅ API: البحث عن السيارة الحالية باستخدام رقم اللوحة
 * 📁 المسار: app/api/live-market/plate/route.ts
 *
 * ✅ الوظيفة:
 * - يستقبل plate_number كـ query param
 * - يبحث عن أول سيارة نوعها 'live' تحتوي رقم اللوحة
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
  const { searchParams } = new URL(req.url);
  const plate = searchParams.get('plate');

  if (!plate) {
    return NextResponse.json({ error: 'Plate is required' }, { status: 400 });
  }

  const db = await getDB();

  const result = await db.get(
    `SELECT * FROM items WHERE type = 'live' AND vin LIKE ? ORDER BY updated_at DESC LIMIT 1`,
    [`%${plate}%`]
  );

  return NextResponse.json(result || {});
}
