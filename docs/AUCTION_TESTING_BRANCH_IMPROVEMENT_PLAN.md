# خطة تحسين فرع اختبارات المزاد + السجل الفوري (Pre-Merge)

هذا المستند يلخّص **مراجعة الفرع** (feature/auction-testing-realtime-log) ويقدّم **Checklist قبل الدمج** و**خطة تحسين** قابلة للتنفيذ على نفس الفرع أو فرع لاحق.

---

## 1. ماذا يضيف الفرع فعليًا؟

| المكوّن | الوصف |
|---------|--------|
| **توسيع وحدة Test** | جداول `auction_test_runs`, `auction_test_events`؛ كيانات AuctionTestRun, AuctionTestEvent؛ ScenarioRunner + ScenarioRunController؛ سيناريوهات في `config/scenarios.php` (حمل هادئ، متوسط، ضغط عالي، سنايبر، متعدد). واجهة admin تعرض السيناريوهات وتشغيلها والنتائج. |
| **نظام Real-Time Activity Log** | جدول `auction_activity_logs` + AuctionRealtimeLogService + ProcessAuctionActivityLogJob + حدث AuctionActivityLogged. تسجيل في Auction عند start, processBid, acceptBid, end. API + صفحة admin لسجل النشاط. |
| **تحسينات الواجهة** | Switch مشترك، إصلاح redirect بعد تسجيل الدخول، تطبيق Template موحد في admin. |

الفرع **لا يهدم** اختبارات المنطق السابقة (Logic, Transitions, Price Updates, State Consistency) بل يضيف فوقها سيناريوهات مركّبة وسجل نشاط لحظي.

---

## 2. Checklist قبل دمج الفرع (نقاط فحص)

استخدم هذا مع الفريق قبل الدمج في `master`.

### 2.1 قاعدة البيانات والهجرة

- [ ] تشغيل `php artisan migrate` على بيئة تشبه الإنتاج ومراجعة الجداول الجديدة: `auction_test_runs`, `auction_test_events`, `auction_activity_logs`, عمود `auctions.is_test`.
- [ ] التأكد من عدم تعارض أسماء الأعمدة أو الفهارس مع موجود.
- [ ] (اختياري) مراجعة حجم الـ payload في `auction_activity_logs` وضبط `max_payload_kb` إن لزم.

### 2.2 الأداء والـ Queue

- [ ] التأكد من وجود Queue worker للـ queue المستخدمة في `auction_log.queue` (مثلاً `auction-log`) حتى لا تتراكم الـ jobs.
- [ ] تشغيل سيناريو واحد (مثلاً small_load) ومراقبة: زمن التنفيذ، استهلاك الذاكرة، أي exception في processBid/start/end.
- [ ] التحقق من أن تفعيل السجل الفوري لا يسبب تأخيرًا ملحوظًا في استجابة وضع المزايدة (الكتابة تتم عبر Job).

### 2.3 الحدود بين Test و Production

- [ ] **ScenarioRunner** يخلق مزادًا تجريبيًا جديدًا (`is_test => true`) ولا يضخ مزايدات على مزادات إنتاج حقيقية — التأكد أن الواجهة لا تسمح باختيار مزاد حقيقي لسيناريو (إن وُجدت هذه الوظيفة لاحقًا).
- [ ] (مضاف في التحسين) تفعيل خيار `scenario_runs_allowed` أو بيئة: منع تشغيل السيناريوهات في production إلا بفلاج صريح إن رغبت.
- [ ] التأكد أن صفحة admin للاختبارات والـ activity log محمية بصلاحيات أدمن فقط.

### 2.4 تجربة الأدمن

- [ ] تسجيل الدخول كأدمن وفتح `/admin/auction-tests`: عرض السيناريوهات، تشغيل سيناريو، عرض النتائج (runs، events إن وُجد).
- [ ] فتح `/admin/auction-activity-log`: تفعيل/تعطيل السجل، عرض السجلات مع فلترة (event_type، subject_id، since).
- [ ] التأكد من أن redirect بعد تسجيل الدخول يوجّه إلى لوحة الإدارة أو الوجهة المتوقعة.

### 2.5 التوثيق والخطة التالية

- [ ] وجود مرجع لسياسة التسجيل (متى نفعّل، كم مدة الاحتفاظ، أرشفة/حذف): [SCENARIOS_AND_LOGGING_POLICY.md](SCENARIOS_AND_LOGGING_POLICY.md).
- [ ] إمكانية أن يضيف مطوّر سيناريو جديد من خلال [SCENARIOS_AND_LOGGING_POLICY.md](SCENARIOS_AND_LOGGING_POLICY.md#كيف-أضيف-سيناريو-جديد).

---

## 3. خطة التحسين (ما تم تنفيذه / ما يُنفَّذ لاحقًا)

### تم تنفيذه في هذه الجولة

| البند | الوصف |
|--------|--------|
| **إعدادات السجل: retention واختياري test-only** | في `config/auction_log.php`: `keep_days` (مدة الاحتفاظ)، `enable_for_test_only` (تفعيل التسجيل لمزادات تجريبية فقط). الـ Job يحذف الحدث إن كان `enable_for_test_only` والمزاد غير تجريبي. |
| **حماية الإنتاج من السيناريوهات** | في `backend/Modules/Test/Config/config.php`: `scenario_runs_allowed_in_production` (افتراضي false). ScenarioRunner يرمي استثناء في production إلا إن `TEST_SCENARIO_RUNS_IN_PRODUCTION=true`. |
| **توثيق السيناريوهات وسياسة الـ Logging** | مستند [SCENARIOS_AND_LOGGING_POLICY.md](SCENARIOS_AND_LOGGING_POLICY.md): كيف أضيف سيناريو، كيف أشغّل يدويًا/من CI، سياسة التسجيل ومدة الاحتفاظ واقتراح تنفيذ أمر/Job للتنظيف. |

### مرحلة لاحقة (تم تنفيذها)

| البند | الوصف |
|--------|--------|
| **لوحة تحليلية واحدة** | تم: صفحة `/admin/auction-testing-analytics` تربط runs + events + activity_logs + test_results. KPIs: نسبة نجاح السيناريوهات، متوسط latency، متوسط مزايدات/دقيقة، إجمالي اختبارات المنطق (نجح/فشل)، أحداث السجل. جداول: تشغيلات حسب اليوم، أحداث السجل حسب اليوم. API: `GET /api/admin/auction-testing-analytics?days=30`. |
| **توحيد اختبارات المنطق مع السيناريوهات** | تم: إضافة سيناريوهات من نوع `test_suite` في `scenarios.php` (logic، transitions، price_updates، state_consistency). ScenarioRunner عند تشغيلها يستدعي الخدمة المناظرة ويُسجّل النتيجة في نفس جدول `auction_test_runs` بحالة passed/failed. |
| **Job تنظيف سجلات قديمة** | تم: أمر `php artisan auction-log:prune [--days=30] [--dry-run]` يحذف سجلات `auction_activity_logs` الأقدم من `keep_days` (من config) أو من المعامل. مُجدول يوميًا في `routes/console.php` (الساعة 03:00). |
| **توثيق تفسير النتائج للأعمال** | تم: [AUCTION_TESTING_BUSINESS_INTERPRETATION.md](AUCTION_TESTING_BUSINESS_INTERPRETATION.md) — كيف نقرأ نتائج السيناريوهات والسجل وتحويلها إلى قرارات (جودة، أداء، تدقيق، سياسات). |

---

## 4. كيف نرفع التحسينات ونحسّن الفرع

1. **دمج هذه التعديلات في نفس الفرع**  
   إضافة الملفات والتعديلات أعلاه (config، ScenarioRunner guard، docs)، ثم commit + push للفرع الحالي.

2. **تشغيل الـ Checklist**  
   تنفيذ نقاط الفحص في القسم 2 قبل فتح PR للدمج في master.

3. **المرحلة التالية**  
   بعد الدمج: فتح فرع جديد أو استكمال نفس الفرع لصفحة التحليلات (auction-testing-analytics) وربط المنطق القديم بالسيناريوهات و Job التنظيف حسب الأولوية.

---

*آخر تحديث: إضافة خطة التحسين وChecklist وتنفيذ إعدادات السجل وحماية الإنتاج وتوثيق السيناريوهات والـ Logging.*
