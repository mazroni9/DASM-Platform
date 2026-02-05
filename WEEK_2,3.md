# تقرير الأسبوع الثاني — من البداية للنهاية

**المرحلة:** تحسينات الأدمن، اختبار سيناريوهات المزادات، السجل الفوري لمنطق المزادات  
**الحالة:** مكتمل

---

## دليل المواقع (أين تجد كل شيء)

| ما تم | الموقع |
|-------|--------|
| **هذا التقرير** | `WEEK_2.md` (جذر المشروع) |
| تحليل الفجوات + خطة السيناريوهات | `docs/AUCTION_TESTING_MODULE_GAP_ANALYSIS.md` |
| خطوات تشغيل السيناريوهات | `docs/AUCTION_SCENARIO_TESTING_SETUP.md` |
| وصف السجل الفوري | `docs/AUCTION_REALTIME_LOG.md` |
| وحدة Test (سيناريوهات + نتائج) | `backend/Modules/Test/` |
| تعريف السيناريوهات | `backend/Modules/Test/Config/scenarios.php` |
| ScenarioRunner | `backend/Modules/Test/Services/ScenarioRunner.php` |
| API سيناريوهات المزادات | `backend/Modules/Test/Http/Controllers/ScenarioRunController.php` |
| صفحة اختبارات المزادات + السيناريوهات | `frontend/app/admin/auction-tests/page.tsx` |
| سجل المزادات الفوري (Backend) | `backend/app/Services/AuctionRealtimeLogService.php`, `backend/app/Jobs/ProcessAuctionActivityLogJob.php`, `backend/app/Events/AuctionActivityLogged.php` |
| صفحة سجل المزادات الفوري | `frontend/app/admin/auction-activity-log/page.tsx` |
| مكوّن Switch | `frontend/components/ui/switch.tsx` |
| Config السجل الفوري | `backend/config/auction_log.php` |

---

## 1) إصلاح الريدايركت بعد تسجيل الدخول

**المشكلة:** بعد تسجيل الدخول كان يتم توجيه المستخدم (redirect) بشكل غير صحيح أو متكرر، أو لا يُوجّه كل دور للواجهة المناسبة.

**ما تم:**
- ضبط منطق الريدايركت بعد الـ login ليعتمد على دور المستخدم (أدمن، عارض، تاجر، مستثمر، مستخدم عادي، إلخ).
- استخدام `returnUrl` إن وُجد (مثلاً من query أو من الطلب) مع تجنّب توجيه المستخدم مرة أخرى لصفحة تسجيل الدخول.
- التأكد من أن كل دور يُوجّه للواجهة المخصصة له (مثل `/admin` للأدمن، `/exhibitor` للعارض، `/dealer` للتاجر، إلخ).

**الفائدة:** تجربة دخول مستقرة وبدون توجيه خاطئ أو حلقات redirect.

---

## 2) تطبيق قالب التصميم

**ما تم:**
- قراءة قالب التصميم المُرسل بالكامل وفهم هيكله (مكونات، ألوان، تخطيط، سلوك الواجهات).
- تطبيق نفس الأسلوب على واجهات الأدمن والصفحات المشتركة: استخدام نفس المكونات، التباعد، البطاقات، الجداول، والأزرار بحيث تكون الواجهة متناسقة.
- عدم إضافة فلاتر أو شاشات جديدة معقدة؛ الهدف كان توحيد الشكل وتجربة المستخدم.

**الفائدة:** واجهة موحّدة يسهل معها إضافة شاشات جديدة بنفس الأسلوب ومراجعتها لاحقاً.

---

## 3) وحدة اختبار سيناريوهات المزادات (Auction Scenario Testing)

### الهدف

اختبار منطق المزادات تحت أحمال مختلفة (عدد مزايدين، مدة، نمط مزايدات) وقياس الأداء: عدد المزايدات الناجحة/المرفوضة، متوسط وزمن أقصى للـ latency، والتأكد من أن المنطق يعمل كما يُتوقع عند الضغط.

### تحليل الفجوة (قبل التنفيذ)

تم توثيق أن وحدة الاختبار الحالية (feature/testing-autions) تركز على اختبارات وظيفية على بيانات موجودة، لكنها تفتقد إلى:
- طبقة تعريف سيناريوهات (أنماط حمل، عدد مستخدمين، مدة).
- مُشغّل سيناريو يخلق مزادات تجريبية ومزايدين افتراضيين ويضخ مزايدات حسب السيناريو.
- مقاييس أداء تفصيلية (مثل latency لكل مزايدة، وقت التحديث في الواجهة).
- أنواع اختبارات: حمل، تكامل، أمان بسيط.
- تكامل مع CI/CD وعتبات أداء.
- طبقة metrics وتقارير غنية (تصدير CSV/JSON، أحداث مفصّلة).

الملف: `docs/AUCTION_TESTING_MODULE_GAP_ANALYSIS.md`.

### ما تم تنفيذه بالتفصيل

#### Backend

1. **تعريف السيناريوهات**
   - ملف: `backend/Modules/Test/Config/scenarios.php` (يُدمج عبر `Config/config.php`).
   - سيناريوهات: `small_load`, `medium_load`, `peak_load`, `sniper_ending`, `multi_auction`.
   - لكل سيناريو: اسم عربي/إنجليزي، وصف، `default_users`, `default_duration_seconds`, `bid_pattern` (مثل `random`, `burst_end`)، وخصائص إضافية (مثل `burst_last_seconds`, `burst_percentage`, `bids_per_minute_min/max`).
   - Enums: `ScenarioType`, `BidDistributionPattern` في `backend/Modules/Test/Entities/Enums/`.

2. **جداول الـ metrics**
   - Migration: إضافة عمود `is_test` لجدول `auctions` لتمييز المزادات التجريبية.
   - Migration: جدول `auction_test_runs` (مع: `scenario_key`, `status`, `user_count`, `duration_seconds`, `total_bids`, `successful_bids`, `failed_bids`, `avg_latency_ms`, `max_latency_ms`, `auction_id`, `options`, `started_at`, `completed_at`, `error_message`).
   - Migration: جدول `auction_test_events` (مع: `run_id`, `event_type`, `latency_ms`, `user_id`, `bid_id`, `bid_amount`, `message`, `meta`, `occurred_at`).
   - Models: `AuctionTestRun`, `AuctionTestEvent` في `backend/Modules/Test/Entities/`.
   - تحديث `App\Models\Auction`: إضافة `is_test` في `$fillable` و`$casts`.

3. **ScenarioRunner**
   - الملف: `backend/Modules/Test/Services/ScenarioRunner.php`.
   - `getScenariosList()`: يرجع قائمة السيناريوهات من الـ config.
   - `runScenario(scenarioKey, userCount?, durationSeconds?)`:
     - يتحقق من وجود السيناريو، ينشئ سجل `AuctionTestRun` بحالة `running`.
     - داخل transaction: ينشئ مستخدم تجريبي (owner)، مركبة تجريبية، مزاد تجريبي (`is_test = true`) بالمدة المحددة، ثم عدد من المستخدمين (bidders).
     - يولد جدول أحداث مزايدات حسب السيناريو (وقت، user_index، amount/increment) حسب النمط (random أو burst_end).
     - لكل حدث: يستدعي `Auction::processBid(amount, bidderId)` ويقيس الـ latency، ثم يسجل في `auction_test_events` (نوع: `bid_confirmed` أو `bid_rejected`).
     - في النهاية يحدّث الـ run: `total_bids`, `successful_bids`, `failed_bids`, `avg_latency_ms`, `max_latency_ms`, `status = completed`, `completed_at`. في حال خطأ: `status = failed`, `error_message`.
   - إنشاء المستخدمين التجريبيين: استخدام `UserStatus::ACTIVE` وقيمة `phone` قصيرة (حتى 20 حرفاً) لتتوافق مع حد العمود في جدول `users` (تم إصلاح خطأ "value too long for type character varying(20)").

4. **API السيناريوهات**
   - Controller: `backend/Modules/Test/Http/Controllers/ScenarioRunController.php`.
   - المسارات (تحت `api/auction-tests`، مع صلاحيات `auction_tests.view` / `auction_tests.run` / `auction_tests.view_details`):
     - `GET /scenarios` — قائمة تعريفات السيناريوهات.
     - `POST /scenario-runs` — تشغيل سيناريو (body: `scenario_key`, اختياري `user_count`, `duration_seconds`).
     - `GET /scenario-runs` — قائمة التشغيلات مع pagination (واختياري: `status`, `scenario_key`, `per_page`, `page`).
     - `GET /scenario-runs/{id}` — تفاصيل تشغيل مع الأحداث.
   - المسارات مضافة في `backend/Modules/Test/Routes/api.php` قبل المسار العام `/{id}` لتجنّب التعارض.

#### Frontend

- في صفحة «اختبارات المزادات» (`frontend/app/admin/auction-tests/page.tsx`):
  - قسم جديد: «تشغيل سيناريوهات الحمل».
  - اختيار السيناريو من قائمة منسدلة (من API `/scenarios`)، وحقول اختيارية: عدد المزايدين، المدة بالثواني.
  - زر «تشغيل السيناريو» يستدعي `POST /scenario-runs` ثم يحدّث قائمة التشغيلات.
  - جدول «سجل التشغيلات»: عرض آخر التشغيلات مع الحالة، عدد المزايدات (ناجحة/إجمالي)، متوسط التأخير، وقت البدء، وزر «تفاصيل» لكل صف.
  - نافذة تفاصيل: تفاصيل التشغيل الكاملة + قائمة الأحداث (نوع، latency، مبلغ، رسالة) مع pagination بسيط للأحداث.
- استدعاءات الـ API مضافة في `frontend/modules/test/api/auctionTestsApi.ts` (مثل `getScenarios`, `getScenarioRuns`, `runScenario`, `getScenarioRun`) والـ types في `frontend/modules/test/types/index.ts` (مثل `ScenarioDefinition`, `ScenarioRunSummary`, `ScenarioRunDetail`).

### إصلاح تقني أثناء التشغيل

- عند تشغيل سيناريو ظهر خطأ: `value too long for type character varying(20)` على عمود `phone` في جدول `users`.
- السبب: إنشاء مستخدمين تجريبيين بقيمة `phone` طويلة (مثل `test_scenario_2_owner_0_6984d6dde8ad8`).
- الحل: في `ScenarioRunner::createTestUser()` تم توليد `phone` قصير وفريد (مثلاً: بادئة مثل `s` + runId + حرف الدور + index + جزء من uniqid) ثم `substr(..., 0, 20)`، والإبقاء على `email` طويلاً كما هو مسموح في الجدول.

### الفائدة

- مراقبة أداء منطق المزادات تحت حمل قابل للتكرار (سيناريوهات محددة).
- قياس الـ latency ومعدل النجاح/الفشل للمزايدات.
- أساس جاهز لربط السيناريوهات لاحقاً بـ CI أو عتبات أداء (مثل: فشل الـ pipeline إذا تجاوز متوسط الـ latency حداً معيناً).

---

## 4) السجل الفوري لمنطق المزادات (Real-time Auction Activity Log)

### الهدف

مراقبة منطق المزادات في الوقت الفعلي: متابعة آخر عمليات المزايدة (تمت بشكل صحيح أم مرفوضة ولماذا)، ومتابعة عرض المزاد وحالته حسب النوع والوقت (بدء، انتهاء، فشل)، مع أداء عالي وإمكانية إيقاف التسجيل عند عدم الحاجة.

### التصميم (أداء وتنظيم)

- **مفعّل من مكان واحد:** تفعيل/إيقاف من صفحة الأدمن «سجل المزادات الفوري» فقط؛ السجل **متوقف افتراضياً** حتى لا يثقل السيرفر.
- **كل الكتابة عبر Queue:** لا يُكتب أي سجل داخل الطلب نفسه؛ يتم إرسال حدث إلى Job على Queue مخصص (`auction-log`).
- **Job واحد لكل حدث:** الـ Job يكتب في جدول `auction_activity_logs` ثم يبث الحدث عبر Pusher (أيضاً عبر الـ queue) حتى لا يُبطئ الـ worker.
- **جدول مفهرس:** للاستعلام السريع والـ pagination (فهارس على `event_type`, `subject_type`, `subject_id`, `occurred_at`).

### ما تم تنفيذه بالتفصيل

#### Backend

1. **Config**
   - الملف: `backend/config/auction_log.php`.
   - إعدادات: `enabled` (افتراضي false), `queue` (مثل `auction-log`), `channel` (مثل `admin.auction-log`), `broadcast_event`, `max_payload_kb`.

2. **قاعدة البيانات**
   - Migration: جدول `auction_activity_logs` (أعمدة: `id`, `event_type`, `subject_type`, `subject_id`, `payload` (JSON), `occurred_at`, `timestamps`) مع فهارس مناسبة.

3. **الموديل والـ Job والـ Event**
   - Model: `App\Models\AuctionActivityLog` مع `$fillable` و`$casts` لـ `payload` و`occurred_at`.
   - Job: `App\Jobs\ProcessAuctionActivityLogJob`: يستقبل `eventType`, `subjectType`, `subjectId`, `payload`, `occurredAt`؛ يعمل على الـ queue المخصص؛ ينشئ سجلاً في `auction_activity_logs` ثم يطلق الـ Event للبث.
   - Event: `App\Events\AuctionActivityLogged`: يُبث على القناة المحددة في الـ config، مع `broadcastQueue()` لنفس الـ queue، ويُرسل (id, event_type, subject_type, subject_id, payload, occurred_at).

4. **الخدمة والربط في المزاد**
   - Service: `App\Services\AuctionRealtimeLogService`:
     - `isEnabled()`: يقرأ من الكاش (مع TTL)؛ إن وُجد إعداد `auction_realtime_log_enabled` في جدول `settings` يُستخدم، وإلا القيمة من الـ config.
     - `log(eventType, subjectType?, subjectId?, payload?)`: إن كان التفعيل مفعّلاً فقط يُرسل `ProcessAuctionActivityLogJob::dispatch(...)` مع تقليم الـ payload إذا تجاوز الحجم المسموح.
     - `clearEnabledCache()`: لاستدعائه عند تغيير إعداد التفعيل.
   - الربط في `App\Models\Auction`:
     - في `processBid`: عند رفض المزايدة (مزاد غير نشط، مبلغ أقل من الحالي، خارج النطاق) استدعاء `AuctionRealtimeLogService::log('bid_rejected', ...)` مع السبب والبيانات المناسبة؛ عند قبول تلقائي (SILENT_INSTANT + وصل للسعر الاحتياطي) استدعاء `log('bid_auto_accepted', ...)`؛ عند نجاح المزايدة العادية استدعاء `log('bid_placed', ...)` مع bid_id وuser_id وbid_amount وincrement وauction_type.
     - في `start()`: بعد تغيير الحالة إلى ACTIVE استدعاء `log('auction_started', ...)` مع status وauction_type وstart_time وend_time.
     - في `end()`: عند ENDED استدعاء `log('auction_ended', ...)`؛ عند FAILED استدعاء `log('auction_failed', ...)` مع current_bid وreserve_price.
     - في `acceptBid()`: بعد إنشاء التسوية استدعاء `log('auction_ended', ...)` مع reason وwinner_id وfinal_price.

5. **API الأدمن**
   - Controller: `App\Http\Controllers\Admin\AuctionActivityLogController`.
   - المسارات (تحت `api/admin`, صلاحية `auctions.view`):
     - `GET /auction-activity-log` — قائمة السجلات مع pagination وفلترة (`event_type`, `subject_type`, `subject_id`, `since`, `per_page`).
     - `GET /auction-activity-log/config` — حالة التفعيل واسم القناة والـ queue.
     - `PUT /auction-activity-log/config` — تحديث التفعيل (body: `enabled` boolean) مع مسح كاش التفعيل.
   - المسارات مضافة في `backend/routes/api.php` ضمن مجموعة الأدمن.

#### Frontend

- صفحة جديدة: `frontend/app/admin/auction-activity-log/page.tsx`.
  - جلب الإعداد (`/api/admin/auction-activity-log/config`) وعرض مفتاح تفعيل/إيقاف (مكوّن Switch).
  - عند التفعيل: إرسال `PUT .../config` مع `enabled: true`، والاشتراك في قناة Pusher `admin.auction-log` لاستقبال حدث `AuctionActivityLogged` وإضافة الأحداث الجديدة في قائمة «البث المباشر» (محدودة بعدد معين مثل 200).
  - جدول يعرض إما «البث المباشر» (عند التفعيل ووجود أحداث مباشرة) أو «آخر السجلات» من API مع pagination.
  - أعمدة: الوقت، نوع الحدث (مع تسميات عربية مثل مزايدة مقبولة/مرفوضة، بدء المزاد، انتهاء المزاد، فشل المزاد)، الموضوع (subject_type وsubject_id)، وزر «تفاصيل» لفتح الـ payload كـ JSON.
- إضافة رابط «سجل المزادات الفوري» في قائمة الأدمن (`frontend/app/admin/layout.tsx`) بصلاحية `auctions.view`.
- مكوّن **Switch** كان مطلوباً للصفحة وغير موجود: تم إنشاء `frontend/components/ui/switch.tsx` كزر بدور `switch` مع تنسيق تبديل (دائرة متحركة، لون يتغير حسب `checked`) بدون إضافة حزمة جديدة، مع دعم `checked`, `onCheckedChange`, `disabled` و`id`.

### الأحداث المسجلة

| event_type | الوصف |
|------------|--------|
| `bid_placed` | مزايدة مقبولة |
| `bid_rejected` | مزايدة مرفوضة (السبب في الـ payload: auction_not_active, bid_not_higher, outside_range) |
| `bid_auto_accepted` | مزايدة مقبولة تلقائياً (مزاد صامت وصل للسعر الاحتياطي) |
| `auction_started` | بدء المزاد (انتقال إلى active) |
| `auction_ended` | انتهاء المزاد (وقت أو قبول عرض) |
| `auction_failed` | فشل المزاد (انتهى دون السعر الاحتياطي) |

### الفائدة

- متابعة آخر عمليات المزايدة (تمت بشكل صحيح أم مرفوضة والسبب).
- متابعة عرض المزاد وحالته حسب النوع والوقت (بدء، انتهاء، فشل).
- إمكانية إيقاف السجل عند عدم الحاجة لتقليل الحمل على السيرفر مع الحفاظ على إمكانية التشغيل عند الحاجة للمراقبة.

---

## 5) التوثيق المُنشأ في هذه المرحلة

| الملف | الوصف |
|-------|--------|
| `docs/AUCTION_TESTING_MODULE_GAP_ANALYSIS.md` | تحليل الفجوات لوحدة اختبار المزادات وخطة الإضافة (سيناريوهات، metrics، تكامل CI، إلخ). |
| `docs/AUCTION_SCENARIO_TESTING_SETUP.md` | خطوات تشغيل سيناريوهات الحمل من البداية: تشغيل الـ backend والـ frontend، الـ migrations، ضبط الـ API، الصلاحيات، استخدام الواجهة، واختياريًا تجربة الـ API يدوياً. |
| `docs/AUCTION_REALTIME_LOG.md` | وصف السجل الفوري: التصميم، الأحداث، الجدول، الـ Queue، البث، التشغيل (migrations، queue worker، إعداد البث)، والإعدادات والـ API. |

---

## ملخص تنفيذي

في هذه المرحلة (الأسبوع الثاني) تم من البداية للنهاية:

1. إصلاح الريدايركت بعد تسجيل الدخول لضمان توجيه صحيح حسب دور المستخدم.
2. تطبيق قالب التصميم على واجهات الأدمن لتحقيق تناسق الشكل وتجربة المستخدم.
3. تنفيذ وحدة اختبار سيناريوهات المزادات: تعريف سيناريوهات، ScenarioRunner، جداول metrics، API، وواجهة تشغيل وسجل وتفاصيل، مع إصلاح مشكلة طول حقل `phone` للمستخدمين التجريبيين.
4. تنفيذ السجل الفوري لمنطق المزادات: تفعيل من صفحة واحدة، كتابة كاملة عبر Queue، ربط أحداث المزاد (مزايدات، بدء، انتهاء، فشل)، API وواجهة عرض وبث مباشر، وإضافة مكوّن Switch للواجهة.
5. توثيق كل ما سبق في ملفات منفصلة ومرجعية من هذا التقرير.

جميع الملفات والمسارات المذكورة أعلاه موجودة في المشروع ويمكن الرجوع إليها من جدول «دليل المواقع» في بداية هذا الملف.
