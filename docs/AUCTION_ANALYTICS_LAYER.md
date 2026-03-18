# الطبقة التحليلية لحركة الأسعار وسلوك المزايدة

## الغرض

ربط **التحليل الفني** بمصدر البيانات الموجود: سجل النشاط الفوري (AUCTION_REALTIME_LOG) وجدول `auction_activity_logs`. توفر هذه الطبقة تقارير وجداول تحليلية جاهزة للأعمال (Business-ready) تفسّر:

- **حركة الأسعار:** أول مزايدة مقابل آخر مزايدة، نسبة التغيّر.
- **سلوك المزايدة:** عدد المزايدات المقبولة والمرفوضة، الزمن بين السومات (متوسط، أدنى، أقصى)، أنماط الأحداث (bid_placed، bid_rejected، auction_started، auction_ended، إلخ).

## مصدر البيانات

- **الجدول:** `auction_activity_logs`  
  الحقول: `event_type`, `subject_type`, `subject_id`, `payload` (JSON), `occurred_at`.
- **التسجيل:** يتم عبر `AuctionRealtimeLogService::log()` ثم Job يكتب في الجدول (تفعيل من إعدادات الأدمن: `auction_realtime_log_enabled`).
- **أحداث مرتبطة بالسعر والزمن:** `bid_placed` (مع bid_amount، user_id، previous_bid، increment)، `bid_rejected`، `auction_started`، `auction_ended`، `auction_failed`، `bid_auto_accepted`.

## المكونات المضافة

| المكون | المسار | الوصف |
|--------|--------|--------|
| خدمة التحليل | `backend/app/Services/AuctionActivityAnalyticsService.php` | تجميع من `auction_activity_logs`: مقاييس لكل مزاد (عدد المزايدات، الزمن بين السومات، حركة السعر، عَدّ الأحداث حسب النوع) + ملخص عام. |
| API التحليلات | `GET /api/admin/auction-activity-log/analytics` | يرجع تقرير تحليلي: `by_auction` (جدول تحليلي لكل مزاد) و `summary` (ملخص عبر المزادات). |
| التوثيق | هذا الملف | شرح المصدر، الـ API، والمقاييس المُرجعة. |

## API: التحليلات

**المسار:** `GET /api/admin/auction-activity-log/analytics`  
**الصلاحية:** `auctions.view` (أدمن).

**معاملات الاستعلام (اختيارية):**

| المعامل | النوع | الوصف |
|---------|--------|--------|
| `auction_id` | number | تحليل مزاد واحد. |
| `since` | string (تاريخ/ISO) | بداية النطاق الزمني. |
| `until` | string (تاريخ/ISO) | نهاية النطاق الزمني. |
| `include_timeline` | boolean | إن كان `true` يُرجَع لكل مزاد حقل `bid_timeline` (قائمة وقت + مبلغ كل مزايدة). افتراضي: `false`. |
| `limit_auctions` | number | أقصى عدد مزادات في النتيجة (1–200). افتراضي: 50. |

**مثال طلب:**

```http
GET /api/admin/auction-activity-log/analytics?auction_id=5
GET /api/admin/auction-activity-log/analytics?since=2026-01-01&limit_auctions=20
GET /api/admin/auction-activity-log/analytics?auction_id=5&include_timeline=true
```

**شكل الاستجابة (مختصر):**

```json
{
  "status": "success",
  "data": {
    "by_auction": [
      {
        "auction_id": 5,
        "event_type_counts": { "bid_placed": 12, "bid_rejected": 2, "auction_ended": 1 },
        "bids_placed_count": 12,
        "bids_rejected_count": 2,
        "first_bid_at": "2026-01-15T10:00:00+00:00",
        "last_bid_at": "2026-01-15T10:05:30+00:00",
        "last_activity_at": "2026-01-15T10:06:00+00:00",
        "price_start": 10000,
        "price_end": 15000,
        "price_change": { "absolute": 5000, "percent": 50 },
        "avg_seconds_between_bids": 27.5,
        "min_seconds_between_bids": 5,
        "max_seconds_between_bids": 120,
        "intervals_count": 11,
        "bid_timeline": []
      }
    ],
    "summary": {
      "auctions_count": 1,
      "auctions_with_bids_count": 1,
      "total_bids_placed": 12,
      "total_bids_rejected": 2,
      "avg_seconds_between_bids_across_auctions": 27.5,
      "avg_price_change_percent": 50
    }
  }
}
```

- `bid_timeline` يظهر فقط عند `include_timeline=true`، ويحتوي على `occurred_at` و `bid_amount` لكل حدث `bid_placed`.

## المقاييس المُرجعة (تفسير تحليلي)

- **لكل مزاد (by_auction):**
  - **حركة السعر:** `price_start`، `price_end`، `price_change` (absolute، percent).
  - **سلوك المزايدة:** `bids_placed_count`، `bids_rejected_count`، `event_type_counts`.
  - **الزمن بين السومات:** `avg_seconds_between_bids`، `min_seconds_between_bids`، `max_seconds_between_bids`، `intervals_count`، `first_bid_at`، `last_bid_at`.
- **ملخص (summary):** إجماليات ومتوسطات عبر المزادات المُرجعَة (عدد المزادات، إجمالي المزايدات المقبولة/المرفوضة، متوسط الزمن بين المزايدات، متوسط نسبة تغيّر السعر).

## الاستخدام في الواجهات

- يمكن لصفحة أدمن (مثلاً تحت قسم سجل النشاط أو تقارير المزادات) استدعاء هذا الـ API وعرض:
  - جدول تحليلي: مزاد، عدد المزايدات، الزمن بين السومات، حركة السعر، عدد المرفوضات.
  - ملخص عام: إجمالي المزايدات، متوسط الزمن بين السومات، متوسط تغيّر السعر.
- يمكن تصدير البيانات نفسها (CSV/Excel) من الواجهة باستخدام نفس الاستجابة.

## ملاحظات

- التحليل يعتمد على **بيانات السجل فقط** (auction_activity_logs). تفعيل السجل الفوري من الأدمن ضروري لوجود بيانات كافية.
- للتحليل حسب فترة زمنية استخدم `since` و `until`.
- لتقليل حجم الاستجابة لا تضف `include_timeline=true` إلا عند الحاجة لجدولة زمنية تفصيلية لكل مزايدة.

---

*آخر تحديث: إضافة الطبقة التحليلية و endpoint التحليلات وتوثيقها.*
