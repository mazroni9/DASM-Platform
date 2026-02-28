# توثيق Endpoints اختبارات المزاد + قنوات البث (Channels)

هذا المستند يجمّع **كل Endpoints وحدة الاختبارات (Auction Tests)** و**قنوات البث (Pusher/WebSocket)** التي تم تنفيذها واستخدامها في المنصة.

---

## 1. Endpoints اختبارات المزاد (Auction Tests)

البادئة: **`/api/auction-tests`**.  
يتطلب مصادقة أدمن: `Authorization: Bearer {token}`، وصلاحيات حسب الجدول.

| Method | Path | الوصف | صلاحية |
|--------|------|--------|--------|
| GET | `/api/auction-tests` | قائمة تشغيلات الاختبارات (مع pagination وفلترة حسب category) | auction_tests.view |
| GET | `/api/auction-tests/latest` | آخر نتائج تشغيل لكل فئة | auction_tests.view |
| GET | `/api/auction-tests/categories` | قائمة فئات الاختبار (logic, transitions, price_updates, state_consistency) | auction_tests.view |
| GET | `/api/auction-tests/{id}` | تفاصيل تشغيل اختبار واحد (مع cases) | auction_tests.view_details |
| POST | `/api/auction-tests/run-all` | تشغيل كل الاختبارات (كل الفئات) | auction_tests.run_all |
| POST | `/api/auction-tests/run/{category}` | تشغيل فئة واحدة: `logic` \| `transitions` \| `price_updates` \| `state_consistency` | auction_tests.run |
| DELETE | `/api/auction-tests/{id}` | حذف تشغيل اختبار واحد | auction_tests.delete |
| DELETE | `/api/auction-tests/bulk` | حذف جماعي (body: ids[]) | auction_tests.delete |

### سيناريوهات الحمل (Scenario Runs)

| Method | Path | الوصف | صلاحية |
|--------|------|--------|--------|
| GET | `/api/auction-tests/scenarios` | قائمة السيناريوهات المعرّفة | auction_tests.view |
| GET | `/api/auction-tests/scenario-runs` | قائمة تشغيلات السيناريوهات (سجل التشغيل) | auction_tests.view |
| POST | `/api/auction-tests/scenario-runs` | تشغيل سيناريو (body حسب السيناريو) | auction_tests.run |
| GET | `/api/auction-tests/scenario-runs/{id}` | تفاصيل تشغيل سيناريو واحد | auction_tests.view_details |

**معاملات اختيارية للقائمة (GET /api/auction-tests):** `category`, `page`, `per_page`.

---

## 2. قنوات البث (Broadcast Channels) — ما تم تنفيذه

البث عبر **Pusher** (أو Reverb/Redis حسب الإعداد). الواجهة الأمامية تشترك في القنوات لتحديث السعر وعدد المزايدين وحالة الاختبارات دون إعادة تحميل.

### 2.1 قنوات المزادات والمزايدات

| القناة | النوع | الحدث | الاستخدام |
|--------|--------|--------|-----------|
| `auction.{auction_id}` | عام (Public) | NewBidEvent | تحديث لحظي لصفحة تفاصيل المزاد (حسب معرّف المزاد). |
| `auction.{car_id}` | عام | NewBidEvent | تحديث لحظي لصفحة تفاصيل السيارة/المزاد حسب معرّف السيارة (ما عدا الفوري الثابت). |
| `auction.fixed` | عام | NewBidEvent | مزايدات المزاد الفوري الثابت (نوع fixed). |
| `auction.live` | عام | LiveMarketBidEvent | سوق الحي: مزايدة جديدة في المزاد المباشر (بيانات السيارة والسعر الحالي). |

**ملاحظة:** عند وضع مزايدة يتم البث على قناتين: إما `auction.{car_id}` أو `auction.fixed`، بالإضافة دائماً إلى `auction.{auction_id}`.

### 2.2 قنوات الأدمن والمراقبة

| القناة | النوع | الحدث | الاستخدام |
|--------|--------|--------|-----------|
| `admin.auction-tests` | عام (محمي بالصلاحية في الواجهة) | AuctionTestResultUpdated | تحديث نتائج الاختبارات لحظياً في Dashboard (`/admin/auction-tests`). الصلاحية: admin / super_admin. |
| `admin.auction-log` | عام | AuctionActivityLogged | سجل نشاط المزادات الفوري (مزايدات، رفض، بدء، انتهاء). يُفعّل من إعدادات الأدمن. الاسم من `config('auction_log.channel')`. |

### 2.3 قنوات التاجر (Private)

| القناة | النوع | الحدث | الاستخدام |
|--------|--------|--------|-----------|
| `dealer.{userId}.ai` | خاص (Private) | AiRecommendationEvent | توصيات الذكاء الاصطناعي للتاجر. |
| `dealer.{userId}.wallet` | خاص | — | تحديثات المحفظة. |
| `dealer.{userId}.system` | خاص | — | إشعارات نظام للتاجر. |

### 2.4 قنوات إضافية (أحداث أخرى)

| القناة | الحدث | الاستخدام |
|--------|--------|-----------|
| `auction.updates` | CarMovedBetweenAuctionsEvent | نقل سيارة بين مزادين. |
| `auction.status.changed` | AuctionStatusChangedEvent | تغيير حالة المزاد. |
| `session.{session_id}` | CarApprovedForLiveEvent | اعتماد سيارة للمزاد المباشر في جلسة معيّنة. |

---

## 3. المراجع في الكود

- **Routes الاختبارات:** `backend/Modules/Test/Routes/api.php`
- **قنوات الاختبارات:** `backend/Modules/Test/Routes/channels.php` (`admin.auction-tests`)
- **قنوات المزادات العامة:** `backend/routes/channels.php` (`auction.*`, `dealer.*`)
- **أحداث البث:** `App\Events\NewBidEvent`, `LiveMarketBidEvent`, `AuctionActivityLogged`؛ `Modules\Test\Events\AuctionTestResultUpdated`
- **إعداد قناة السجل:** `config/auction_log.php` (`channel`, `broadcast_event`)

---

## 4. Postman

تم إضافة مجلد **Auction Tests (Admin)** في مجموعة `docs/postman/DASM-Auctions-API.postman_collection.json` يضم كل الـ endpoints أعلاه (قائمة، latest، categories، تشغيل run-all و run/{category}، سيناريوهات، حذف). استخدم `token` بأدمن لاختبارها.

---

*آخر تحديث: توثيق Endpoints الاختبارات وقنوات البث وإضافتها إلى الخطة والكوليكشن.*
