// ✅ API لاسترجاع بيانات السيارة بناءً على ID من قاعدة auctions.db
// المسار: app/api/car/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const id = context.params.id;

  try {
    const db = await open({
      filename: 'backend/database/auctions.db',
      driver: sqlite3,
    });

    const car = await db.get('SELECT * FROM auctions WHERE id = ?', id);

    if (!car) {
      return NextResponse.json({ error: 'السيارة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json(car);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
