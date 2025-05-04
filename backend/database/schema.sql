
-- ✅ جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT CHECK (role IN ('admin', 'dealer', 'user')) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ جدول المحافظ
CREATE TABLE IF NOT EXISTS wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  balance NUMERIC DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ جدول المعاملات المالية
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_id INTEGER REFERENCES wallets(id),
  amount NUMERIC,
  type TEXT CHECK (type IN ('credit', 'debit')),
  reference TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ جدول العناصر المعروضة (المزادات)
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  description TEXT,
  category TEXT,
  type TEXT CHECK (type IN ('instant', 'silent', 'live')) DEFAULT 'instant',
  min_price NUMERIC,
  max_price NUMERIC,
  start_price NUMERIC,
  current_price NUMERIC,
  high_price NUMERIC,
  low_price NUMERIC,
  images TEXT,
  inspection_report TEXT,
  additional_info TEXT,
  auction_result TEXT DEFAULT 'بانتظار المزايدة',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ جدول البث المباشر
CREATE TABLE IF NOT EXISTS livestreams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER REFERENCES items(id),
  youtube_url TEXT,
  start_time TIMESTAMP,
  end_time TIMESTAMP
);

-- ✅ جدول المزايدات
CREATE TABLE IF NOT EXISTS bids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER REFERENCES items(id),
  user_id INTEGER REFERENCES users(id),
  bid_amount NUMERIC,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
