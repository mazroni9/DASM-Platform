# دليل بنية مجلد الاختبارات — التشغيل، قراءة النتائج، إضافة اختبارات

دليل موحّد لمطورين آخرين: **بنية مجلد الاختبارات**، **كيفية تشغيلها**، **كيفية قراءة النتائج**، و**كيفية إضافة اختبارات جديدة** (منطقية، سيناريوهات، يدوية، ومستقبلية).

---

## 1. بنية مجلد الاختبارات

النقطة الرسمية للوحدة: **`TestingModule/`** في جذر المشروع.

| المكوّن | المسار | الوصف |
|---------|--------|--------|
| **نقطة الدخول والهيكل** | `TestingModule/README.md`, `TestingModule/STRUCTURE.md` | وصف الوحدة، هيكل المجلدات، تصنيف الاختبارات. |
| **Backend (Laravel Module)** | `backend/Modules/Test/` | خدمات الاختبار (Logic، Transitions، Price Updates، State Consistency)، ScenarioRunner، Controllers، Routes، Entities، Migrations. |
| **Frontend** | `frontend/modules/test/` | API client، Hooks، مكوّنات العرض (TestSummaryCard، TestDataTable، TestDetailsModal). |
| **صفحة Dashboard** | `frontend/app/admin/auction-tests/page.tsx` | تشغيل الاختبارات، عرض النتائج، سيناريوهات الحمل. |
| **اختبارات يدوية** | `Test/manual test/` | ملفات Manual_Test_Cases_Auctions*.md. |
| **اختبارات PHPUnit (إن وُجدت)** | `backend/tests/` | Unit/Feature tests تقليدية (خارج وحدة المزادات). |

الشجرة التفصيلية: **[TestingModule/STRUCTURE.md](../TestingModule/STRUCTURE.md)**.

---

## 2. أنواع الاختبارات المُغطاة

| النوع | الفئة / المكوّن | الوصف |
|-------|------------------|--------|
| **منطقية (Functional)** | `logic` | منطق المزادات: isActive()، نطاق الأسعار، control_room_approved، النطاق الزمني. |
| **انتقالات (Transitions)** | `transitions` | الانتقال التلقائي بين الأنواع حسب الوقت، والحفاظ على opening_price. مصفوفة: [AUCTION_TRANSITION_TEST_MATRIX.md](AUCTION_TRANSITION_TEST_MATRIX.md). |
| **تحديث السعر** | `price_updates` | تطابق current_bid مع أعلى مزايدة، last_bid_time، opening_price. مصفوفة: [AUCTION_PRICE_AND_STATE_STABILITY_MATRIX.md](AUCTION_PRICE_AND_STATE_STABILITY_MATRIX.md). |
| **استقرار الحالة** | `state_consistency` | تناسق حالة المزاد مع حالة السيارة (in_auction، sold، available) وقواعد النوع والزمن. |
| **سيناريوهات (حمل)** | ScenarioRunner | سيناريوهات ضغط (هادئ، متوسط، عالي، سنايبر، متعدد المستخدمين). إعداد: [AUCTION_SCENARIO_TESTING_SETUP.md](AUCTION_SCENARIO_TESTING_SETUP.md). |
| **يدوية** | `Test/manual test/` | حالات اختبار موثّقة في Markdown. |
| **وحدة / تكامل (مستقبلاً)** | `backend/tests/` | يمكن إضافة PHPUnit لوحدة أو تكامل لاحقاً؛ لا تُدار من Dashboard الحالي. |

---

## 3. كيفية التشغيل

### من الـ Dashboard (الموصى به)

1. تشغيل Backend: `cd backend && php artisan serve`
2. تشغيل Frontend: `cd frontend && npm run dev`
3. تسجيل الدخول بحساب أدمن لديه صلاحيات `auction_tests.view` و `auction_tests.run`
4. فتح **`/admin/auction-tests`**
5. **تشغيل كل الاختبارات:** زر «تشغيل كل الاختبارات» (Run All)
6. **تشغيل حسب الفئة:** أزرار الفئات (منطق المزادات، الانتقال بين الأنواع، تحديثات الأسعار، استقرار الحالات) ثم «تشغيل» من الجدول أو من الـ API
7. **تشغيل سيناريو:** اختيار سيناريو من القائمة، (اختياري) عدد المزايدين والمدة، ثم «تشغيل السيناريو»

النتائج تتحدّث في الصفحة؛ التحديث اللحظي عبر WebSocket (قناة `admin.auction-tests`). قائمة بكل القنوات (المزادات، الأدمن، التاجر) في [TEST_ENDPOINTS_AND_BROADCAST_CHANNELS.md](TEST_ENDPOINTS_AND_BROADCAST_CHANNELS.md).

### من الـ API

جدول Endpoints الاختبارات كاملاً (مع الصلاحيات) + **قنوات البث (Channels)** المستخدمة في المنصة (المزادات، الاختبارات، الأدمن، التاجر) موثّق في: **[TEST_ENDPOINTS_AND_BROADCAST_CHANNELS.md](TEST_ENDPOINTS_AND_BROADCAST_CHANNELS.md)**.  
مجموعة Postman تحتوي على مجلد **Auction Tests (Admin)** يضم كل هذه الطلبات: **docs/postman/DASM-Auctions-API.postman_collection.json**.

```bash
# تشغيل جميع الاختبارات
POST /api/auction-tests/run-all
Authorization: Bearer {token}

# تشغيل حسب الفئة
POST /api/auction-tests/run/logic
POST /api/auction-tests/run/transitions
POST /api/auction-tests/run/price_updates
POST /api/auction-tests/run/state_consistency

# قائمة النتائج (مع فلترة وصفحات)
GET /api/auction-tests?category=logic&page=1&per_page=15

# سيناريوهات
GET /api/auction-tests/scenarios
POST /api/auction-tests/scenario-runs
Body: { "scenario_key": "light_load", "user_count": 5, "duration_seconds": 60 }
GET /api/auction-tests/scenario-runs?page=1&per_page=10
GET /api/auction-tests/scenario-runs/{id}
```

### Migrations والصلاحيات

- تشغيل `php artisan migrate` لإنشاء جداول `auction_test_results`, `auction_test_runs`, `auction_test_events`.
- الصلاحيات: `auction_tests.view`, `auction_tests.run`, `auction_tests.run_all`, `auction_tests.view_details`, `auction_tests.delete`. راجع seeders الأدمن.

---

## 4. قراءة النتائج

### في الـ Dashboard

| العنصر | ماذا يعرض |
|--------|-----------|
| **ملخص الاختبارات (TestSummaryCard)** | إجمالي، نجح، فشل، قيد التشغيل. |
| **جدول النتائج (TestDataTable)** | لكل تشغيل: اسم الاختبار، النوع، **الحالة** (نجح/فشل)، **الحالات** (X/Y = cases_passed/cases_total)، الرسالة، الوقت، التاريخ. |
| **نافذة التفاصيل (عند النقر «تفاصيل»)** | الرسالة، **مصفوفة Test Cases** (إن وُجدت): كل case مع Pass/Fail (نجح/فشل)، الاسم، الرسالة؛ التفاصيل الخام (JSON)؛ قائمة الأخطاء؛ وقت التنفيذ ووقت البدء/الانتهاء. |
| **قسم سجل السيناريوهات** | جدول تشغيلات السيناريوهات: الحالة، المزايدات، متوسط التأخير، زر «تفاصيل» لفتح تفاصيل التشغيلة والأحداث. |

### بنية نتيجة الاختبار (API)

- **status:** `passed` | `failed`
- **message:** رسالة ملخص
- **details:** كائن قد يحتوي على:
  - **cases:** مصفوفة `{ id, name, passed, message }` (للفئات transitions، price_updates، state_consistency)
  - **cases_passed**, **cases_total:** لسهولة عرض X/Y
  - حقول أخرى حسب الفئة (مثل current_hour، active_auctions_count)
- **errors:** مصفوفة نصوص أخطاء إن وُجدت
- **execution_time_ms**, **started_at**, **completed_at**

---

## 5. إضافة اختبارات جديدة

### أ) إضافة فئة اختبار برمجي جديدة (Functional)

1. إنشاء ملف خدمة في `backend/Modules/Test/Services/Tests/` (مثلاً `MyNewTestService.php`) يُطبّق `TestServiceInterface` وينفّذ `run(): AuctionTestResult`.
2. في `backend/Modules/Test/Entities/Enums/TestCategory.php`: إضافة case جديد (مثلاً `MY_NEW = 'my_new'`) وتحديث `getServiceClass()` و`label()` و`description()`.
3. تشغيل الاختبار من Dashboard (بعد إضافة الزر/الفئة في الواجهة إن لزم) أو عبر `POST /api/auction-tests/run/my_new`.
4. (اختياري) إرجاع `details.cases` كمصفوفة `{ id, name, passed, message }` لعرض مصفوفة Test Cases في نافذة التفاصيل.

### ب) إضافة سيناريو حمل جديد

1. تعديل `backend/Modules/Test/Config/scenarios.php`: إضافة تعريف السيناريو (key، name_ar، name_en، default_users، default_duration_seconds، bid_pattern، إلخ).
2. تشغيل السيناريو من Dashboard أو عبر `POST /api/auction-tests/scenario-runs` مع `scenario_key`.

### ج) إضافة اختبار يدوي

1. إضافة أو تعديل ملف في `Test/manual test/` (مثل `Manual_Test_Cases_Auctions_New.md`).
2. توثيق الخطوات والنتيجة المتوقعة والمعيار (Pass/Fail).

### د) اختبارات وحدة أو تكامل (PHPUnit) مستقبلاً

- يمكن إضافة اختبارات في `backend/tests/Unit/` أو `backend/tests/Feature/` وتشغيلها بـ `php artisan test`. لا تظهر في Dashboard الحالي؛ يمكن توثيقها في هذا الدليل عند إضافتها.

---

## 6. مراجع إضافية

| المستند | المحتوى |
|---------|---------|
| [TestingModule/README.md](../TestingModule/README.md) | نظرة عامة على الوحدة والتصنيف والتشغيل. |
| [TestingModule/STRUCTURE.md](../TestingModule/STRUCTURE.md) | شجرة المجلدات والملفات. |
| [AUCTION_SCENARIO_TESTING_SETUP.md](AUCTION_SCENARIO_TESTING_SETUP.md) | إعداد وتشغيل سيناريوهات الاختبار خطوة بخطوة. |
| [AUCTION_TRANSITION_TEST_MATRIX.md](AUCTION_TRANSITION_TEST_MATRIX.md) | مصفوفة حالات الانتقال و Test Cases. |
| [AUCTION_PRICE_AND_STATE_STABILITY_MATRIX.md](AUCTION_PRICE_AND_STATE_STABILITY_MATRIX.md) | مصفوفة تحديث السعر واستقرار الحالة. |
| [AUCTION_TESTING_MODULE_GAP_ANALYSIS.md](AUCTION_TESTING_MODULE_GAP_ANALYSIS.md) | تحليل الفجوات والتوصيات. |
| [backend/Modules/Test/README.md](../backend/Modules/Test/README.md) | تفاصيل الخدمات والفحوصات في الـ Backend. |
| [frontend/modules/test/README.md](../frontend/modules/test/README.md) | تفاصيل الـ API client والـ Hooks في الـ Frontend. |

---

بهذا يكون **توثيق بنية مجلد الاختبارات وكيفية تشغيلها وقراءة النتائج وإضافة اختبارات** متكاملاً: دليل واحد يربط البنية، أنواع الاختبارات (منطقية، انتقالات، سعر، استقرار، سيناريوهات، يدوية)، التشغيل، قراءة النتائج (بما فيها مصفوفة Test Cases و X/Y)، وإضافة اختبارات جديدة مع مراجع للتفاصيل.
