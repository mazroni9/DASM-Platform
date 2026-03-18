# السيناريوهات وسياسة التسجيل (الاختبارات + Activity Log)

هذا المستند يوضح: **كيف تضيف سيناريو جديد**، **كيف تشغّل السيناريوهات** (يدويًا أو من CI)، و**سياسة التسجيل** (متى نفعّل سجل النشاط، مدة الاحتفاظ، التنظيف).

---

## 1. كيف أضيف سيناريو جديد؟

السيناريوهات معرّفة في **`backend/Modules/Test/Config/scenarios.php`** ضمن المفتاح `scenarios`.

### خطوات إضافة سيناريو

1. افتح `backend/Modules/Test/Config/scenarios.php`.
2. أضف عنصرًا جديدًا داخل `'scenarios' => [ ... ]` بمفتاح فريد (مثلاً `my_scenario`):

```php
'my_scenario' => [
    'key' => 'my_scenario',
    'name_ar' => 'اسم بالعربي',
    'name_en' => 'Display Name',
    'description' => 'وصف قصير',
    'default_users' => 10,
    'default_duration_seconds' => 300,
    'bid_pattern' => 'random',  // أو 'burst_end'
    'bids_per_minute_min' => 5,
    'bids_per_minute_max' => 15,
    // لـ burst_end أضف:
    // 'burst_last_seconds' => 60,
    // 'burst_percentage' => 0.6,
],
```

3. **أنماط التوزيع (`bid_pattern`):**
   - `random`: مزايدات موزعة عشوائيًا على مدى المزاد.
   - `burst_end`: نسبة من المزايدات في آخر ثوانٍ (استخدم `burst_last_seconds` و `burst_percentage`).

4. احفظ الملف. الـ ScenarioRunner يقرأ القائمة من `config('test.scenarios')` ولا يحتاج إعادة تشغيل.

5. يمكنك تشغيل السيناريو من واجهة `/admin/auction-tests` (قسم السيناريوهات) أو عبر API:
   ```http
   POST /api/auction-tests/scenario-runs
   Body: { "scenario_key": "my_scenario", "user_count": 10, "duration_seconds": 300 }
   ```

---

## 2. كيف أشغّل السيناريوهات؟

### من الواجهة (الأدمن)

1. الدخول إلى **`/admin/auction-tests`**.
2. قسم **السيناريوهات**: اختر السيناريو، (اختياري) عدّل عدد المستخدمين والمدة.
3. اضغط **تشغيل السيناريو**. النتائج تظهر في الجدول وتفاصيل كل run من الـ API.

### من الـ API

```bash
# قائمة السيناريوهات
GET /api/auction-tests/scenarios

# تشغيل سيناريو
POST /api/auction-tests/scenario-runs
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "scenario_key": "small_load",
  "user_count": 5,
  "duration_seconds": 300
}

# قائمة تشغيلات السيناريوهات
GET /api/auction-tests/scenario-runs?page=1&per_page=10

# تفاصيل تشغيل واحد
GET /api/auction-tests/scenario-runs/{id}
```

### من CI (مستقبلاً)

يمكن إضافة خطوة في pipeline (GitHub Actions أو غيره) تستدعي الـ API أعلاه بعد رفع الكود، أو تشغيل أمر Artisan إن وُجد أمر لتشغيل سيناريو محدد. التوثيق الحالي يركز على التشغيل اليدوي والـ API.

---

## 3. سياسة التسجيل (Activity Log)

### متى نفعّل التسجيل؟

- **افتراضيًا** السجل الفوري **معطّل** (`AUCTION_REALTIME_LOG_ENABLED=false` أو من إعدادات الأدمن).
- التفعيل من صفحة **`/admin/auction-activity-log`** أو إعداد `auction_realtime_log_enabled` في الإعدادات.
- يُنصح بتفعيله في بيئة **staging** أو **test** لمراقبة سلوك المزاد دون ضغط على إنتاج.

### إعدادات السجل (`config/auction_log.php`)

| الإعداد | الوصف | متغير البيئة |
|---------|--------|----------------|
| `enabled` | تفعيل التسجيل (يمكن تجاوزه من إعدادات الأدمن). | `AUCTION_REALTIME_LOG_ENABLED` |
| `keep_days` | مدة الاحتفاظ بالسجلات بالأيام (للمرجع عند التنظيف). | `AUCTION_LOG_KEEP_DAYS` (افتراضي 30) |
| `enable_for_test_only` | إن كان `true` يُسجّل فقط أحداث مزادات تجريبية (`is_test = true`). | `AUCTION_LOG_FOR_TEST_ONLY` |
| `max_payload_kb` | أقصى حجم للـ payload بالكيلوبايت. | `AUCTION_LOG_MAX_PAYLOAD_KB` |
| `queue` | اسم الـ queue للـ Job. | `AUCTION_LOG_QUEUE` |

### مدة الاحتفاظ والتنظيف

- **أمر Artisan:** `php artisan auction-log:prune [--days=30] [--dry-run]` يحذف سجلات `auction_activity_logs` الأقدم من `keep_days` (من config) أو من المعامل `--days`. استخدم `--dry-run` لعرض عدد السجلات التي ستُحذف دون تنفيذ.
- **التجدولة:** الأمر مُجدول يوميًا في `routes/console.php` (الساعة 03:00 توقيت الرياض). يمكن تغيير التوقيت أو تكرار التشغيل حسب الحاجة.

---

## 4. حماية الإنتاج من السيناريوهات

- **ScenarioRunner** يخلق دائمًا **مزادًا تجريبيًا جديدًا** (`is_test => true`) ولا يضخ مزايدات على مزادات إنتاج.
- في بيئة **production** تشغيل السيناريوهات **معطّل افتراضيًا** إلا إذا تم تعيين `TEST_SCENARIO_RUNS_IN_PRODUCTION=true` (أو الإعداد `test.scenario_runs_allowed_in_production`).
- راجع [AUCTION_TESTING_BRANCH_IMPROVEMENT_PLAN.md](AUCTION_TESTING_BRANCH_IMPROVEMENT_PLAN.md) للـ Checklist قبل الدمج.

---

*آخر تحديث: إضافة سياسة السيناريوهات والتسجيل والاحتفاظ.*
