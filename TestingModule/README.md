# مجلد Testing Module مستقل — وحدة اختبارات المزادات

هذا المجلد هو **نقطة الدخول الرسمية** لوحدة اختبارات المزادات في منصة DASM-e. يجمّع كل ما يتعلق بالاختبارات البرمجية واليدوية في مكان واحد موثّق.

---

## 1. ما هو Testing Module؟

وحدة مستقلة تحتوي على:

- **اختبارات برمجية (Functional / Logic)** لمنطق المزادات.
- **اختبارات الانتقال بين أنواع المزاد** حسب الوقت (Scheduled → Live → Live Instant → Silent Instant).
- **اختبارات تحديث السعر والمزايدات** (تطابق current_bid مع أعلى مزايدة، last_bid_time).
- **اختبارات استقرار الحالات (State Consistency)** بين المزاد والسيارة.
- **اختبارات سيناريوهات (Scenario Testing)** لحمل وضغط متعدد المستخدمين.
- **اختبارات يدوية** موثّقة (Manual Test Cases).

جميع الاختبارات البرمجية تُنفَّذ دون تغيير دائم على البيانات (استخدام transactions و rollback حيث يلزم).

---

## 2. هيكل المجلد (أين الكود فعلياً)

الـ Testing Module **مبعثر منطقياً** في ثلاثة أماكن؛ هذا المجلد يوحّد الوصف والوصول:

| المكوّن | المسار | الوصف |
|---------|--------|--------|
| **Backend (Laravel Module)** | `backend/Modules/Test/` | خدمات الاختبار (Logic، Transitions، Price Updates، State Consistency)، ScenarioRunner، Controllers، Routes، Entities، Migrations. |
| **Frontend (Next.js module)** | `frontend/modules/test/` | API client، Hooks (useTestResults، useTestRunner، useTestWebSocket)، مكوّنات العرض، Types. |
| **صفحة Dashboard** | `frontend/app/admin/auction-tests/page.tsx` | واجهة تشغيل الاختبارات وعرض النتائج. |
| **اختبارات يدوية** | `Test/manual test/` | ملفات Manual_Test_Cases_Auctions*.md. |

للشجرة التفصيلية انظر: **[STRUCTURE.md](STRUCTURE.md)**.

---

## 3. تصنيف الاختبارات (حسب النوع)

| الفئة (category) | الملف / الخدمة | ماذا يختبر |
|------------------|-----------------|------------|
| **logic** | `LogicTestService.php` | المنطق الأساسي: isActive()، current_bid ضمن النطاق، end_time > start_time، control_room_approved. |
| **transitions** | `TransitionsTestService.php` | الانتقال التلقائي: updateAuctionTypeBasedOnTime()، النوع حسب الساعة (LIVE 16–19، LIVE_INSTANT 19–22، SILENT_INSTANT 22–16)، الحفاظ على opening_price. |
| **price_updates** | `PriceUpdatesTestService.php` | تطابق current_bid مع أعلى مزايدة، last_bid_time، opening_price عند عدم وجود مزايدات. |
| **state_consistency** | `StateConsistencyTestService.php` | تناسق حالة المزاد مع حالة السيارة (in_auction، sold، available). |
| **سيناريوهات** | `ScenarioRunner.php` + Config | تشغيل سيناريوهات حمل (هادئ، متوسط، ضغط عالي، سنايبر، متعدد المستخدمين) مع تسجيل في auction_test_runs و auction_test_events. |

---

## 4. طريقة التشغيل

### من الواجهة (Dashboard)

1. تشغيل Backend و Frontend.
2. تسجيل الدخول بحساب أدمن لديه صلاحيات `auction_tests.view` و `auction_tests.run`.
3. فتح **`/admin/auction-tests`**.
4. تشغيل **جميع الاختبارات** أو تشغيل **حسب الفئة** (Logic، Transitions، Price Updates، State Consistency)، أو تشغيل **سيناريو** من القائمة.
5. النتائج تظهر في الصفحة مع تحديث لحظي عبر WebSocket (قناة `admin.auction-tests`).

### من الـ API (Backend)

```bash
# تشغيل جميع الاختبارات
POST /api/auction-tests/run-all

# تشغيل حسب الفئة
POST /api/auction-tests/run/logic
POST /api/auction-tests/run/transitions
POST /api/auction-tests/run/price_updates
POST /api/auction-tests/run/state_consistency

# قائمة النتائج
GET /api/auction-tests?category=logic&page=1&per_page=15

# سيناريوهات
GET /api/auction-tests/scenarios
POST /api/auction-tests/scenario-runs   # body: { "scenario_key": "..." }
GET /api/auction-tests/scenario-runs
```

تأكد من وجود صلاحيات `auction_tests.*` للحساب المستخدم.

### من سطر الأوامر (اختياري)

لا يوجد أمر Artisan افتراضي لتشغيل الاختبارات؛ التشغيل يتم عبر الـ API أو من الـ Dashboard. لاختبارات PHPUnit انظر `backend/tests/`.

---

## 5. إضافة اختبارات جديدة

### اختبار برمجي جديد (فئة جديدة)

1. **إنشاء خدمة** في `backend/Modules/Test/Services/Tests/` تطبّق `TestServiceInterface` وتنفّذ `run(): AuctionTestResult`.
2. **تسجيل الفئة** في `TestCategory` enum في `backend/Modules/Test/Entities/Enums/TestCategory.php`: أضف case جديد وحدّث `getServiceClass()`.
3. **تشغيل الاختبار** من Dashboard أو عبر `POST /api/auction-tests/run/{category}`.

### سيناريو جديد

1. إضافة تعريف السيناريو في `backend/Modules/Test/Config/scenarios.php`.
2. استخدام نفس الـ API: `POST /api/auction-tests/scenario-runs` مع `scenario_key`.

### اختبار يدوي

إضافة أو تحديث ملف في `Test/manual test/` (مثل Manual_Test_Cases_Auctions.md) ووصف الخطوات والنتائج المتوقعة.

---

## 6. الصلاحيات

| الصلاحية | الوصف |
|----------|--------|
| `auction_tests.view` | عرض صفحة الاختبارات وقائمة النتائج والسيناريوهات. |
| `auction_tests.view_details` | عرض تفاصيل نتيجة أو تشغيلة سيناريو. |
| `auction_tests.run` | تشغيل اختبار لفئة واحدة أو سيناريو. |
| `auction_tests.run_all` | تشغيل جميع الاختبارات (كل الفئات). |
| `auction_tests.delete` | حذف نتائج. |

---

## 7. مراجع إضافية

| المستند | المحتوى |
|---------|---------|
| [docs/TESTING_MODULE_MANUAL.md](../docs/TESTING_MODULE_MANUAL.md) | **دليل شامل:** بنية المجلد، التشغيل، قراءة النتائج، إضافة اختبارات (منطقية، سيناريوهات، يدوية، مستقبلية). |
| [backend/Modules/Test/README.md](../backend/Modules/Test/README.md) | تفاصيل الـ Backend: أنواع الاختبارات، الفحوصات، البنية الداخلية. |
| [frontend/modules/test/README.md](../frontend/modules/test/README.md) | تفاصيل الـ Frontend: API client، Hooks، المكوّنات. |
| [docs/AUCTION_SCENARIO_TESTING_SETUP.md](../docs/AUCTION_SCENARIO_TESTING_SETUP.md) | إعداد وتشغيل سيناريوهات الاختبار. |
| [docs/AUCTION_TESTING_MODULE_GAP_ANALYSIS.md](../docs/AUCTION_TESTING_MODULE_GAP_ANALYSIS.md) | تحليل الفجوات والتوصيات. |
| [STRUCTURE.md](STRUCTURE.md) | شجرة المجلدات ووصف كل جزء. |

---

بهذا يكون **مجلد Testing Module مستقل** واضحاً: نقطة دخول واحدة، هيكل ثابت، تصنيف حسب النوع، وطريقة تشغيل وإضافة اختبارات موثّقة.
