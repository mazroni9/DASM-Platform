import pandas as pd
import sqlite3
import os

# تحديد المسارات بناءً على موقع السكربت داخل backend/scripts/
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

EXCEL_CARS = os.path.join(BASE_DIR, '..', 'data', 'قاعدة بيانات المزاد.xlsx')
EXCEL_HIDDEN = os.path.join(BASE_DIR, '..', 'data', 'حد البائع.xlsx')
DB_PATH = os.path.join(BASE_DIR, '..', 'database', 'auctions.db')

# تحميل بيانات السيارات
cars_df = pd.read_excel(EXCEL_CARS)
hidden_df = pd.read_excel(EXCEL_HIDDEN)

# الاتصال بقاعدة البيانات
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# إنشاء جدول المزادات (إن لم يكن موجودًا)
cursor.execute('''
CREATE TABLE IF NOT EXISTS auctions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT,
    model TEXT,
    year INTEGER,
    plate TEXT,
    mileage INTEGER,
    car_condition TEXT,
    auction_status TEXT,
    color TEXT,
    fuel TEXT,
    bids INTEGER,
    opening_price REAL,
    min_price REAL,
    max_price REAL,
    last_price REAL,
    price_change REAL,
    change_percent TEXT,
    auction_result TEXT
)
''')

# إنشاء جدول الأسعار المخفية
cursor.execute('''
CREATE TABLE IF NOT EXISTS hidden_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auction_id INTEGER,
    owner_name TEXT,
    min_hidden_price REAL,
    max_hidden_price REAL,
    FOREIGN KEY (auction_id) REFERENCES auctions(id)
)
''')

# إدخال بيانات السيارات
for _, row in cars_df.iterrows():
    cursor.execute('''
        INSERT INTO auctions (
            brand, model, year, plate, mileage, car_condition, auction_status, color, fuel, bids,
            opening_price, min_price, max_price, last_price, price_change, change_percent, auction_result
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        row['ماركة'], row['موديل'], row['سنة الصنع'], row['اللوحة'], row['العداد'], row['حالة السيارة'],
        row['حالة المزاد'], row['لون السيارة'], row['نوع الوقود'], row['المزايدات المقدمة'],
        row['سعر الافتتاح'], row['أقل سعر'], row['أعلى سعر'], row['اخر سعر'], row['التغير'],
        row['نسبة التغير'], row['نتيجة المزاد الجديدة']
    ))

# ربط اللوحات بإدخالات الأسعار المخفية
conn.commit()
cursor.execute('SELECT id, plate FROM auctions')
auctions_map = {plate: id for id, plate in cursor.fetchall()}

for _, row in hidden_df.iterrows():
    plate = row.get('اللوحة')
    auction_id = auctions_map.get(plate)
    cursor.execute('''
        INSERT INTO hidden_prices (
            auction_id, owner_name, min_hidden_price, max_hidden_price
        ) VALUES (?, ?, ?, ?)
    ''', (
        auction_id, row['المالك'], row['اقل سعر'], row['اعلى سعر']
    ))

conn.commit()
conn.close()

print("✅ تم استيراد البيانات بنجاح إلى قاعدة auctions.db")
