-- ✅ سكربت إنشاء جدول المزايدات
-- 📁 المسار: backend/database/sql/create-bids.sql

CREATE TABLE IF NOT EXISTS bids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  user_id TEXT, -- اختياري لاحقًا: يمكن ربطه بجداول المستخدمين
  bid_amount REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);
