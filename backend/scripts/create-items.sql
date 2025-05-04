-- ✅ سكربت إنشاء جدول السيارات (items)
-- 📁 المسار المقترح: backend/scripts/sql/create-items.sql

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  images TEXT,
  current_price REAL NOT NULL,
  start_price REAL,
  min_price REAL,
  auction_type TEXT,         -- 'live', 'instant', 'silent', etc.
  category TEXT,             -- 'cars', 'jewelry', etc.
  subcategory TEXT,          -- 'luxury', 'trucks', etc.
  additional_info TEXT,      -- JSON string: year, fuel_type, color, mileage...
  auction_result TEXT,       -- 'تم البيع في...', إلخ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
