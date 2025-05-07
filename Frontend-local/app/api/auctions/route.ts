/**
 * مسار الملف: app/api/auctions/route.ts
 *
 * ❖ وظيفة الملف:
 *   - جلب قائمة بجميع العناصر المتاحة في المزادات (الفوري، الصامت، الحراج المباشر...).
 *   - يُستخدم في صفحات عرض الجداول العامة للمزادات في الصفحة الرئيسية لكل سوق.
 *
 * ❖ الارتباطات:
 *   - يُستدعى من: صفحات مثل `instant-auctions/page.tsx` و `silent-auctions/page.tsx`.
 *   - يعتمد على جدول `items` في قاعدة البيانات `auctions.db`.
 */

import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const dbPath = path.join(process.cwd(), 'backend/database/auctions.db');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const items = await db.all('SELECT * FROM items');

    return NextResponse.json(items);
  } catch (error) {
    console.error("فشل في جلب بيانات المزادات:", error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
