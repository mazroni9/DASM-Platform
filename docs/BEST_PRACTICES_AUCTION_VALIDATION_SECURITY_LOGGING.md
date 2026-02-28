# أفضل الممارسات: Validation، Security، Logging، Error handling (منطق المزاد)

هذا المستند يسجّل **بالظبط** ما تم تنفيذه في بند "أفضل الممارسات" بعد مراجعة منطق المزاد والمزايدات: التحقق من المدخلات، الأمان، التسجيل، ومعالجة الأخطاء.

---

## 1. Validation (التحقق من المدخلات وقواعد الأعمال)

### 1.1 Form Requests جديدة

| الملف | الاستخدام | القواعد |
|-------|------------|---------|
| `app/Http/Requests/StoreBidRequest.php` | `BidController::store()` | `bid_amount`: required, numeric, min:1, max:999999999.99, regex (خانتان عشريتان كحد أقصى). رسائل خطأ بالعربية. `authorize()`: يتطلب مستخدماً مسجّل الدخول. |
| `app/Http/Requests/PlaceBidRequest.php` | `BidController::placeBid()` | `auction_id`: required, integer, exists:auctions,id. `bid_amount`: نفس قواعد StoreBidRequest. `user_id`: required, numeric, exists:users,id. رسائل عربية. `authorize()`: يتطلب مستخدماً. |

- **فائدة:** تركيز قواعد التحقق في مكان واحد، إعادة استخدام، ورسائل خطأ موحّدة (422 + `errors`).
- **failedValidation:** يرجع JSON بـ `status`, `message`, `errors` ولا يسمح بعرض صفحة خطأ HTML.

### 1.2 قواعد أعمال المزايدة (في الـ Controller)

- **store():**
  - بعد التحقق من الـ Request: التحقق من وجود المزاد (404 إن لم يوجد).
  - استدعاء `$auction->updateStatusBasedOnTime()` قبل التحقق من النشاط.
  - التحقق من أن المزاد **نشط** عبر `$auction->isActive()` (بدلاً من `status !== ACTIVE` ليشمل أيضاً الحالة `active` Legacy).
  - بقية الشروط كما كانت: مبلغ أعلى من current_bid، عدم المزايدة على مزادك، وجود رصيد كافٍ في المحفظة.

- **placeBid():**
  - التحقق من النشاط عبر `$auction->isActive()`.
  - التحقق من أن `user_id` في الطلب = المستخدم المصادق (403 إن لم يتطابق)، مع تسجيل تحذيري.
  - منع المزايدة على مزادك (مع Log::warning).
  - التحقق من وقت انتهاء المزاد (extended_until أو end_time).
  - **قواعد المبلغ:**
    - للمزادات الفورية (live_instant، silent_instant): نطاق 90%–130% من سعر الافتتاح (تم تطبيقه لكلا النوعين؛ سابقاً كان silent_instant يُستثنى خطأً).
    - للمزادات غير الفورية: المبلغ يجب أن يكون أعلى من (current_bid، minimum_bid، starting_bid)، مع حد أدنى لزيادة المزايدة (1% من current_bid أو 100، أيهما أكبر).

---

## 2. Security (الأمان)

| الإجراء | التفاصيل |
|---------|-----------|
| **مصادقة** | مساري المزايدة (`store`, `placeBid`) داخل مجموعة `auth:sanctum`؛ Form Requests تتحقق من وجود مستخدم في `authorize()`. |
| **الصلاحية** | في `placeBid`: التحقق من أن `user_id` في الـ body = `Auth::id()`؛ خلاف ذلك 403 وتسجيل تحذيري. منع المزايدة على مزادك (صاحب السيارة) مع تسجيل. |
| **تحديد المعدل (Rate limiting)** | Middleware `bid.rate.limit` مطبّق على `POST /api/auctions/bid` و `POST /api/auctions/{auction}/bids`: 5 مزايدات/دقيقة/مستخدم، 3 مزايدات/دقيقة/مزاد/مستخدم، 50 مزايدة/ساعة/مستخدم. عند التجاوز: 429 + تسجيل في `AuctionLoggingService::logRateLimitViolation`. |
| **عدم تسريب معلومات داخلية** | في استجابات 500 لا يُعاد `$e->getMessage()` للمستخدم؛ يُعاد رسالة عامة: "حدث خطأ أثناء تقديم المزايدة" أو "خطأ في قاعدة البيانات" أو "حدث خطأ غير متوقع". التفاصيل تُسجّل في الـ Log فقط. |
| **مدخلات محصورة** | استخدام `$request->validated()` أو `StoreBidRequest`/`PlaceBidRequest` فقط؛ عدم الاعتماد على `$request->all()` للمبلغ أو المعرّفات دون تحقق. |

---

## 3. Logging (التسجيل)

| الموقع | نوع التسجيل | ما يُسجّل |
|--------|-------------|-----------|
| **BidController::store** | `Log::info` عند النجاح | bid_id، auction_id، user_id، bid_amount (بعد commit). |
| **BidController::store** | `Log::error` عند فشل غير متوقع | auction_id، user_id، error message، trace، ip (لا يُعاد للمستخدم). |
| **BidController::store** | `Log::warning` عند فشل البث | رسالة الخطأ فقط. |
| **BidController::placeBid** | موجود مسبقاً | تحقق فاشل (Log::warning)، خطأ قاعدة بيانات (Log::error)، نموذج غير موجود (Log::warning)، خطأ غير متوقع (Log::error)، تمديد الوقت (Log::info)، بث وإشعارات (Log::info). |
| **BidController::placeBid** | إضافة | تحذير عند محاولة المزايدة على مزادك (user_id، auction_id، ip). تحذير عند عدم تطابق user_id مع المصادق (auth_user_id، request_user_id، auction_id، ip). |
| **Auction::acceptBid** | `Log::error` عند فشل car/settlement | auction_id، user_id، amount، error message؛ ثم إعادة رمي الاستثناء لتفعيل rollback إن وُجد transaction. |
| **AuctionLoggingService** | موجود مسبقاً | logBidAttempt، logBidSuccess، logRateLimitViolation، إلخ. |

---

## 4. Error handling (معالجة الأخطاء)

| الموقع | ما تم |
|--------|--------|
| **BidController::store** | استبدال `catch (\Exception $e)` الذي كان يعيد `$e->getMessage()` للمستخدم بـ: (1) عدم إرجاع الرسالة الداخلية، (2) `Log::error('BidController::store failed', [...])` مع السياق، (3) رسالة ثابتة للمستخدم: "حدث خطأ أثناء تقديم المزايدة. يرجى المحاولة مرة أخرى" مع 500. إضافة `catch (ValidationException)` للتحقق البرمجي إن وُجد (422 + errors). |
| **BidController::placeBid** | كان يحتوي بالفعل على معالجة مناسبة: ValidationException (422)، QueryException (500 + سجل بدون تسريب bindings حساسة للمستخدم)، ModelNotFoundException (404)، Exception عام (500 + رسالة عامة). لم تُغيّر؛ التأكد من أن الاستجابات لا تتضمن trace أو sql للمستخدم. |
| **Auction::acceptBid** | لفّ تحديث `car->auction_status` وإنشاء `Settlement` داخل `try/catch`؛ عند الاستثناء: تسجيل Log::error ثم `throw $e` لضمان rollback إذا كان النداء داخل transaction. |
| **استجابات JSON موحّدة** | أخطاء: `status: 'error'`, `message` (رسالة آمنة للمستخدم)، و`errors` في حالة 422 فقط. نجاح: `status: 'success'` أو `'success_sold'` مع `data` حسب الحالة. |

---

## 5. ملخص الملفات المُعدّلة

| الملف | التعديلات |
|-------|-----------|
| `app/Http/Requests/StoreBidRequest.php` | **جديد.** قواعد تحقق لمبلغ المزايدة في مسار store. |
| `app/Http/Requests/PlaceBidRequest.php` | **جديد.** قواعد تحقق لـ auction_id، bid_amount، user_id في placeBid. |
| `app/Http/Controllers/BidController.php` | استخدام StoreBidRequest و PlaceBidRequest؛ استبدال التحقق اليدوي في store؛ استخدام `isActive()` بدلاً من مقارنة status بـ ACTIVE فقط؛ إصلاح التحقق من نطاق المزايدة الفورية (SILENT_INSTANT + LIVE_INSTANT)； تحسين catch في store (Log + رسالة آمنة)； إضافة تسجيل عند رفض صلاحية (مزادك، user_id)； إضافة Log::info عند نجاح store. |
| `app/Models/Auction.php` | في `acceptBid`: try/catch حول تحديث السيارة وإنشاء Settlement مع Log::error وإعادة رمي الاستثناء. |

---

## 6. ما لَم يُغيَّر (للتجنب كسر السلوك)

- منطق المحفظة (خصم/إعادة الرصيد) في `store()` كما هو.
- منطق تمديد الوقت، ProcessAuctionSaleJob، والبث (NewBidEvent، LiveMarketBidEvent، الإشعارات) في `placeBid()` كما هو.
- Middleware `bid.rate.limit` وقواعد التحديد نفسها.
- بنية الـ API (المسارات، أسماء الحقول، رموز الحالة 200/201/400/403/404/422/429/500).

بهذا يكون بند **أفضل الممارسات (Validation, Security, Logging, Error handling)** قد تم تنفيذه ومراجعته لمنطق المزاد والمزايدات، مع تسجيل التعديلات أعلاه.
