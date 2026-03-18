# سجل المزادات الفوري (Real-time Auction Activity Log)

## الوصف

نظام مراقبة **منطق المزادات** في الوقت الفعلي: تسجيل كل مزايدة (مقبولة/مرفوضة)، بدء المزاد، انتهاء المزاد، فشل المزاد (تحت السعر الاحتياطي)، والقبول التلقائي في المزاد الصامت. يُستخدم للتدقيق وجودة التشغيل دون إبطاء الطلبات.

## التصميم (أداء وتنظيم)

- **مفعّل/متوقف من الواجهة**: لا يعمل افتراضياً؛ يتم التفعيل من صفحة الأدمن «سجل المزادات الفوري» لتقليل ضغط السيرفر.
- **كل الكتابة عبر Queue**: لا يُكتب أي سجل مباشرة من الطلب؛ يتم إرسال حدث إلى Job على Queue مخصص (`auction-log`).
- **Job واحد لكل حدث**: يكتب في جدول `auction_activity_logs` ثم يبث الحدث عبر Pusher/Reverb (أيضاً عبر الـ queue) حتى لا يُبطئ الـ worker.
- **جدول مفهرس**: `event_type`, `subject_type`, `subject_id`, `occurred_at` للاستعلام السريع والـ pagination.

## الأحداث المسجلة

| event_type          | الوصف |
|---------------------|--------|
| `bid_placed`         | مزايدة مقبولة |
| `bid_rejected`      | مزايدة مرفوضة (السبب في الـ payload: auction_not_active, bid_not_higher, outside_range) |
| `bid_auto_accepted` | مزايدة مقبولة تلقائياً (مزاد صامت وصل للسعر الاحتياطي) |
| `auction_started`   | بدء المزاد (انتقال إلى active) |
| `auction_ended`     | انتهاء المزاد (بسبب الوقت أو قبول عرض) |
| `auction_failed`    | فشل المزاد (انتهى دون الوصول للسعر الاحتياطي) |

## التشغيل

### 1) الـ Migration

```bash
cd backend
php artisan migrate
```

سيتم إنشاء جدول `auction_activity_logs`.

### 2) تفعيل الـ Queue

السجل يعمل فقط عند تشغيل الـ queue worker. استخدم Queue مخصص لعدم خلطه مع الطلبات الحرجة:

```bash
php artisan queue:work --queue=auction-log,default
```

أو تشغيل worker منفصل للـ log فقط:

```bash
php artisan queue:work --queue=auction-log
```

### 3) البث (Pusher / Reverb)

حتى يصل السجل للواجهة في الوقت الفعلي يجب أن يكون البث مفعّلاً في `.env`:

- `BROADCAST_DRIVER=pusher` (أو `reverb`)
- إعدادات Pusher/Reverb المعتادة

القناة: `admin.auction-log`، اسم الحدث: `AuctionActivityLogged`.

### 4) التفعيل من الواجهة

1. الدخول كأدمن مع صلاحية `auctions.view`.
2. من القائمة: **سجل المزادات الفوري** → `/admin/auction-activity-log`.
3. تفعيل «السجل الفوري» من المفتاح في الصفحة.
4. مراقبة الأحداث المباشرة أو استعراض السجلات السابقة مع pagination.

## الإعدادات

- **من الواجهة**: التفعيل/الإيقاف يُحفظ في `settings` تحت المفتاح `auction_realtime_log_enabled` (قيمة `1` أو `0`).
- **من الـ config**: `config/auction_log.php`:
  - `enabled`: القيمة الافتراضية إذا لم تُحدد في الإعدادات.
  - `queue`: اسم الـ queue (افتراضي `auction-log`).
  - `channel`: قناة البث (افتراضي `admin.auction-log`).
  - `max_payload_kb`: حد حجم الـ payload (افتراضي 64).

## API (أدمن)

- `GET /api/admin/auction-activity-log` — قائمة السجلات (مع `page`, `per_page`, `event_type`, `subject_type`, `subject_id`, `since`).
- `GET /api/admin/auction-activity-log/config` — حالة التفعيل واسم القناة والـ queue.
- `PUT /api/admin/auction-activity-log/config` — تفعيل/إيقاف (body: `{ "enabled": true }` أو `false`).

كل المسارات تتطلب صلاحية `auctions.view`.
