# هيكل Testing Module — شجرة المجلدات والملفات

هذا المستند يوضح **شجرة المجلدات** الخاصة بوحدة اختبارات المزادات و**دور كل جزء**.

---

## 1. المجلد الجذر (نقطة الدخول)

```
TestingModule/
├── README.md      # نقطة الدخول: ما هو الـ Module، كيف تشغّل، كيف تضيف اختبارات
└── STRUCTURE.md   # هذا الملف: شجرة المجلدات
```

---

## 2. Backend — Laravel Module

```
backend/Modules/Test/
├── Config/
│   ├── config.php           # إعدادات الوحدة
│   └── scenarios.php        # تعريفات سيناريوهات الاختبار (حمل، ضغط، إلخ)
├── Database/
│   └── Migrations/
│       ├── 2025_01_21_000001_create_auction_test_results_table.php
│       ├── 2026_01_31_100001_create_auction_test_runs_table.php
│       └── 2026_01_31_100002_create_auction_test_events_table.php
├── Entities/
│   ├── AuctionTestResult.php    # نتيجة تشغيل اختبار (فئة واحدة)
│   ├── AuctionTestRun.php      # تشغيلة سيناريو واحد
│   ├── AuctionTestEvent.php    # حدث داخل تشغيلة (مثلاً bid أُرسل، latency)
│   └── Enums/
│       ├── TestCategory.php       # logic, transitions, price_updates, state_consistency
│       ├── TestStatus.php         # pass, fail
│       ├── ScenarioType.php       # أنواع السيناريوهات
│       └── BidDistributionPattern.php
├── Events/
│   └── AuctionTestResultUpdated.php   # بث عند تحديث النتيجة (قناة admin.auction-tests)
├── Http/
│   └── Controllers/
│       ├── AuctionTestController.php   # تشغيل الاختبارات، جلب النتائج، حذف
│       └── ScenarioRunController.php   # تشغيل السيناريوهات، جلب التشغيلات
├── Providers/
│   ├── TestServiceProvider.php
│   └── RouteServiceProvider.php
├── Routes/
│   ├── api.php       # مسارات تحت /api/auction-tests
│   └── channels.php  # قناة admin.auction-tests
├── Services/
│   ├── AuctionTestRunner.php      # تشغيل كل الفئات أو فئة واحدة
│   ├── ScenarioRunner.php        # تنفيذ سيناريو (مستخدمون، مزايدات، قياس latency)
│   ├── Contracts/
│   │   └── TestServiceInterface.php
│   ├── Traits/
│   │   └── TestResultTrait.php
│   └── Tests/
│       ├── LogicTestService.php           # فئة logic
│       ├── TransitionsTestService.php    # فئة transitions
│       ├── PriceUpdatesTestService.php    # فئة price_updates
│       └── StateConsistencyTestService.php # فئة state_consistency
├── module.json
└── README.md
```

**الجداول:**
- `auction_test_results`: نتيجة كل تشغيل لاختبار (فئة)، (اسم، فئة، حالة، رسالة، تفاصيل، أخطاء، وقت).
- `auction_test_runs`: تشغيلة سيناريو (scenario_key، status، عدد المستخدمين، مدة، إحصائيات مزايدات، latency، إلخ).
- `auction_test_events`: أحداث داخل التشغيلة (run_id، event_type، latency_ms، user_id، bid_id، إلخ).

---

## 3. Frontend — وحدة الاختبارات

```
frontend/modules/test/
├── api/
│   └── auctionTestsApi.ts    # استدعاءات API: getResults, runAll, runCategory, runScenario, delete
├── hooks/
│   ├── useTestResults.ts    # جلب النتائج مع pagination وفلترة
│   ├── useTestRunner.ts     # تشغيل الاختبارات (كل أو حسب فئة)
│   └── useTestWebSocket.ts  # الاشتراك في قناة admin.auction-tests للتحديث اللحظي
├── components/
│   ├── TestSummaryCard.tsx  # بطاقة ملخص (عدد ناجح/فاشل)
│   ├── TestDataTable.tsx    # جدول النتائج
│   ├── TestDetailsModal.tsx # نافذة تفاصيل نتيجة
│   ├── TestCard.tsx         # بطاقة نتيجة واحدة
│   └── CategoryCard.tsx     # بطاقة فئة (لتشغيل فئة واحدة)
├── types/
│   └── index.ts             # TypeScript: AuctionTestResult, ScenarioRun, إلخ
├── index.ts                 # تصدير الوحدة
└── README.md
```

**صفحة الـ Dashboard:**
```
frontend/app/admin/auction-tests/
└── page.tsx   # صفحة اختبارات المزادات: عرض النتائج، تشغيل الكل/حسب الفئة، سيناريوهات، WebSocket
```

---

## 4. اختبارات يدوية

```
Test/
└── manual test/
    ├── Manual_Test_Cases_Auctions.md
    ├── Manual_Test_Cases_Auctions_TODO.md
    └── Manual_Test_Cases_Auctions_Completed.md
```

---

## 5. خلاصة المسارات والصلاحيات

| المسار أو الملف | الدور |
|-----------------|--------|
| `TestingModule/` | نقطة الدخول الموحّدة والوثائق. |
| `backend/Modules/Test/` | تنفيذ الاختبارات، حفظ النتائج، API، بث النتائج. |
| `frontend/modules/test/` | استدعاء API وعرض النتائج وتحديث لحظي. |
| `frontend/app/admin/auction-tests/page.tsx` | واجهة المستخدم للـ Dashboard. |
| `Test/manual test/` | حالات اختبار يدوي موثّقة. |

الصلاحيات: `auction_tests.view`, `auction_tests.run`, `auction_tests.run_all`, `auction_tests.view_details`, `auction_tests.delete`.
