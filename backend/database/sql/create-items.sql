-- Table: items
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  type TEXT,
  min_price REAL,
  max_price REAL,
  start_price REAL,
  current_price REAL DEFAULT 0,
  high_price REAL,
  low_price REAL,
  images TEXT, -- JSON string مخزن كـ
  inspection_report TEXT,
  additional_info TEXT,
  auction_result TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إضافة بيانات تجريبية للحافلات والشاحنات
INSERT OR IGNORE INTO items (
  title,
  description,
  category,
  subcategory,
  type,
  min_price,
  max_price,
  start_price,
  current_price,
  images,
  inspection_report
) VALUES (
  'مرسيدس أكتروس 2019 شاحنة نقل ثقيل',
  'شاحنة مرسيدس أكتروس موديل 2019 بحالة ممتازة، 450 حصان، ناقل حركة أوتوماتيكي، مسافة قطع 120,000 كم، تم إجراء صيانة كاملة.',
  'cars',
  'busesTrucks',
  'heavy',
  350000,
  450000,
  350000,
  380000,
  '["/auctionsPIC/car-busesTrucksPIC/truck-1.jpg"]',
  'تم فحص المحرك والهيكل والإطارات، الشاحنة بحالة فنية ممتازة.'
);

INSERT OR IGNORE INTO items (
  title,
  description,
  category,
  subcategory,
  type,
  min_price,
  max_price,
  start_price,
  current_price,
  images,
  inspection_report
) VALUES (
  'حافلة مرسيدس ترافيجو 2020',
  'حافلة مرسيدس ترافيجو موديل 2020، سعة 50 راكب، مكيفة بالكامل، أنظمة سلامة متكاملة، حالة ممتازة.',
  'cars',
  'busesTrucks',
  'passenger',
  600000,
  750000,
  600000,
  650000,
  '["/auctionsPIC/car-busesTrucksPIC/bus-1.jpg"]',
  'تم فحص جميع أنظمة الحافلة والمحرك، جميع الأنظمة تعمل بكفاءة.'
);

INSERT OR IGNORE INTO items (
  title,
  description,
  category,
  subcategory,
  type,
  min_price,
  max_price,
  start_price,
  current_price,
  images,
  inspection_report
) VALUES (
  'شاحنة فولفو FH16 2021',
  'شاحنة فولفو FH16 موديل 2021، قوة 750 حصان، نظام كبح متطور، نظام تعليق هوائي، كابينة فاخرة.',
  'cars',
  'busesTrucks',
  'heavy',
  700000,
  850000,
  700000,
  730000,
  '["/auctionsPIC/car-busesTrucksPIC/truck-2.jpg"]',
  'الشاحنة في حالة ممتازة، جميع الأنظمة الإلكترونية والميكانيكية تعمل بكفاءة عالية.'
);

INSERT OR IGNORE INTO items (
  title,
  description,
  category,
  subcategory,
  type,
  min_price,
  max_price,
  start_price,
  current_price,
  images,
  inspection_report
) VALUES (
  'حافلة هيونداي يونيفرس 2022',
  'حافلة هيونداي يونيفرس موديل 2022، سعة 45 راكب، مكيفة بالكامل، نظام ترفيهي متكامل، استهلاك وقود اقتصادي.',
  'cars',
  'busesTrucks',
  'passenger',
  450000,
  550000,
  450000,
  480000,
  '["/auctionsPIC/car-busesTrucksPIC/bus-2.jpg"]',
  'تم فحص الحافلة بالكامل، جميع الأنظمة تعمل بكفاءة، الإطارات في حالة جيدة.'
);

INSERT OR IGNORE INTO items (
  title,
  description,
  category,
  subcategory,
  type,
  min_price,
  max_price,
  start_price,
  current_price,
  images,
  inspection_report
) VALUES (
  'شاحنة مان TGX 2020',
  'شاحنة مان TGX موديل 2020، قوة 500 حصان، ناقل حركة أوتوماتيكي، كابينة واسعة ومريحة، تصميم عصري.',
  'cars',
  'busesTrucks',
  'heavy',
  500000,
  600000,
  500000,
  530000,
  '["/auctionsPIC/car-busesTrucksPIC/truck-3.jpg"]',
  'تم فحص الشاحنة من قبل وكيل معتمد، جميع الأنظمة تعمل بكفاءة.'
);

-- إضافة مزيد من الحافلات والشاحنات
INSERT OR IGNORE INTO items (
  title,
  description,
  category,
  subcategory,
  type,
  min_price,
  max_price,
  start_price,
  current_price,
  images,
  inspection_report
) VALUES (
  'حافلة كينج لونج 2021',
  'حافلة كينج لونج موديل 2021، سعة 40 راكب، مكيفة بالكامل، تقنيات حديثة للسلامة والراحة.',
  'cars',
  'busesTrucks',
  'passenger',
  400000,
  500000,
  400000,
  420000,
  '["/auctionsPIC/car-busesTrucksPIC/bus-3.jpg"]',
  'تم فحص الحافلة بالكامل، جميع الأنظمة تعمل بكفاءة وبحالة ممتازة.'
);

INSERT OR IGNORE INTO items (
  title,
  description,
  category,
  subcategory,
  type,
  min_price,
  max_price,
  start_price,
  current_price,
  images,
  inspection_report
) VALUES (
  'حافلة داف 2022',
  'حافلة داف موديل 2022، سعة 45 راكب، أنظمة تكييف متطورة، نظام صوتي ممتاز، استهلاك وقود اقتصادي.',
  'cars',
  'busesTrucks',
  'passenger',
  550000,
  650000,
  550000,
  580000,
  '["/auctionsPIC/car-busesTrucksPIC/bus-4.jpg"]',
  'تم فحص الحافلة بشكل شامل، تقرير فني إيجابي، جميع الأنظمة تعمل بكفاءة عالية.'
);

INSERT OR IGNORE INTO items (
  title,
  description,
  category,
  subcategory,
  type,
  min_price,
  max_price,
  start_price,
  current_price,
  images,
  inspection_report
) VALUES (
  'شاحنة سكانيا R500 2021',
  'شاحنة سكانيا R500 موديل 2021، قوة 500 حصان، نظام تعليق هوائي، أنظمة سلامة متطورة، كفاءة عالية.',
  'cars',
  'busesTrucks',
  'heavy',
  650000,
  750000,
  650000,
  680000,
  '["/auctionsPIC/car-busesTrucksPIC/truck-4.jpg"]',
  'تم فحص الشاحنة من قبل مركز سكانيا المعتمد، جميع المكونات تعمل بكفاءة عالية.'
);
