// مسار API لاختبار قاعدة البيانات
import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

// المسارات المحتملة لقاعدة البيانات
const possiblePaths = [
  // المسار المستخدم في API الأصلي
  path.join(process.cwd(), 'backend/database/auctions.db'),
  
  // المسار البديل داخل Frontend-local
  path.join(process.cwd(), '../backend/database/auctions.db'),
  
  // المسار المطلق
  path.resolve(process.cwd(), '../backend/database/auctions.db'),
  
  // المسار داخل مجلد Frontend-local
  path.join(process.cwd(), '/backend/database/auctions.db')
];

export async function GET() {
  try {
    // التحقق من جميع المسارات
    const pathsInfo = possiblePaths.map(p => ({
      path: p,
      exists: fs.existsSync(p),
      size: fs.existsSync(p) ? fs.statSync(p).size : 0
    }));
    
    // محاولة قراءة قاعدة البيانات
    let dbData = null;
    let error = null;
    
    // استخدام أول مسار موجود
    const validPath = pathsInfo.find(p => p.exists);
    
    if (validPath) {
      try {
        const db = await open({
          filename: validPath.path,
          driver: sqlite3.Database
        });
        
        // محاولة قراءة بيانات الحافلات والشاحنات
        const vehicles = await db.all(
          "SELECT * FROM items WHERE subcategory = 'busesTrucks'"
        );
        
        // عدد صفوف كل الجداول
        const itemsCount = await db.get("SELECT COUNT(*) as count FROM items");
        const busesTrucksCount = await db.get("SELECT COUNT(*) as count FROM items WHERE subcategory = 'busesTrucks'");
        
        dbData = {
          vehicles,
          counts: {
            total: itemsCount.count,
            busesTrucks: busesTrucksCount.count
          }
        };
        
        await db.close();
      } catch (dbErr) {
        error = `خطأ في قراءة قاعدة البيانات: ${dbErr.message}`;
      }
    }
    
    return NextResponse.json({ 
      paths: pathsInfo,
      working: validPath ? validPath.path : null,
      dbData,
      error,
      cwd: process.cwd()
    });
  } catch (err) {
    return NextResponse.json({ 
      error: `خطأ عام: ${err.message}`,
      stack: err.stack
    }, { status: 500 });
  }
} 