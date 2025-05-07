/**
 * مسار الملف: app/api/auctions/[id]/route.ts
 *
 * ❖ وظيفة الملف:
 *   - جلب تفاصيل مزاد معين باستخدام معرف `id` من عنوان الرابط.
 *   - يُستخدم في صفحات عرض تفاصيل السيارة في جميع أنواع المزادات.
 *
 * ❖ الارتباطات:
 *   - يُستدعى تلقائيًا من صفحة `carDetails/page.tsx`.
 *   - يرتبط بالجدول `items` في قاعدة البيانات `auctions.db`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dbPath = path.join(process.cwd(), 'backend/database/auctions.db');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const item = await db.get('SELECT * FROM items WHERE id = ?', params.id);

    if (!item) {
      return NextResponse.json({ error: "لم يتم العثور على المزاد" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("خطأ أثناء جلب بيانات المزاد:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
