# كيف يعمل المزاد — أين التعديلات — كيف نختبر

توثيق مختصر موحّد لأي مطوّر جديد: **رحلة المزاد من البداية للنهاية**، **أين ملفات الكود الأساسية**، و**كيف تشغّل وتختبر** بدون الحاجة لقراءة كل المستندات.

---

## 1. كيف يعمل المزاد (منظور أعمال + تقني)

### رحلة المزاد في سطور

1. **إنشاء المزاد** — المالك يضيف سيارة لمزاد (سعر افتتاح، احتياطي، وقت بداية ونهاية). الحالة الافتراضية: `scheduled`.
2. **بدء المزاد** — عند وصول وقت البداية (وموافقة غرفة التحكم إن وُجدت) ينتقل المزاد إلى `live`، والسيارة تصبح `in_auction`.
3. **المزايدة** — المستخدمون يقدمون مزايدات؛ كل مزايدة مقبولة تحدّث `current_bid` في جدول المزاد، ويُبث حدث للمتصفحين فوراً (بدون reload).
4. **نوع المزاد حسب الوقت** — النظام يغيّر نوع المزاد تلقائياً (مثلاً من live إلى live_instant ثم silent_instant) حسب نوافذ زمنية محددة في الكود.
5. **انتهاء المزاد:**
   - إذا **وُصل لسعر الاحتياطي** (أو قبول مزايدة فورية): المزاد ينتهي بنجاح، والسيارة تُحدَّث إلى `sold` عند **قبول البيع** (في `acceptBid()` أو عبر تسوية).
   - إذا **انتهى الوقت دون بلوغ الاحتياطي**: المزاد يُنهى بـ `end()`؛ السيارة تعود إلى `available` (للمزادات العادية) أو تبقى `in_auction` وتنتقل لمزاد ثابت (للمزادات الفورية) عبر Job.
6. **المزاد الفوري (instant)** — عند انتهاء وقت الفوري دون بيع، لا يُستدعى `end()` مباشرة؛ Job يحوّل نفس المزاد إلى نوع **ثابت (fixed)** لاستمرار البيع في نافذة أخرى.

### الحالات والأنواع (ملخص)

| الحالة | المعنى |
|--------|--------|
| `scheduled` | مجدول، لم يبدأ |
| `live` | نشط، يقبل مزايدات |
| `ended` / `completed` | انتهى بنجاح |
| `failed` | انتهى الوقت دون بلوغ الاحتياطي |
| `canceled` | ملغي |

**أنواع المزاد:** `live`، `live_instant`، `silent_instant`، `fixed` — التبديل بينها حسب الوقت في `updateAuctionTypeBasedOnTime()`.

**آخر سعر:** محفوظ في `auctions.current_bid`؛ **نسبة التغير** محسوبة في الـ API كـ `bid_change_percentage` (من سعر الافتتاح إلى الحالي).

للتفاصيل الكاملة (State Machine، قواعد الانتقال، حالة السيارة): **[منطق المزادات: State Machine وقواعد التشغيل](AUCTION_LOGIC_STATE_AND_RULES.md)**.

---

## 2. أين التعديلات (الملفات الأساسية)

### Backend (Laravel)

| الملف | ماذا فيه |
|-------|----------|
| `app/Models/Auction.php` | قلب المنطق: `start()`, `end()`, `processBid()`, `acceptBid()`, `updateStatusBasedOnTime()`, `updateAuctionTypeBasedOnTime()`, accessor `bid_change_percentage`. تحديث حالة السيارة (in_auction / sold / available) في بدء المزاد، قبول البيع، وانتهاء المزاد. |
| `app/Enums/AuctionStatus.php` | حالات المزاد (scheduled, live, ended, failed, …). |
| `app/Enums/AuctionType.php` | أنواع المزاد (live, live_instant, silent_instant, fixed). |
| `app/Http/Controllers/BidController.php` | استقبال المزايدات (`placeBid`, `store`) + بث `NewBidEvent` بعد كل مزايدة مقبولة. |
| `app/Events/NewBidEvent.php` | حدث البث على قناتي `auction.{car_id}` و `auction.{auction_id}` (و`auction.fixed` للثابت). |
| `app/Console/Commands/ActivateScheduledAuctions.php` | تفعيل المزادات المجدولة عند وقت البداية (يُشغّل عبر Scheduler/Cron). |
| `app/Jobs/UpdateCarAuctionJob.php` | تغيير نوع المزاد حسب الوقت. |
| `app/Jobs/MoveCarToFixedAuctionJob.php` | تحويل المزاد الفوري إلى ثابت عند انتهاء الوقت دون بيع. |
| `app/Jobs/ProcessAuctionSaleJob.php` | معالجة البيع عند قبول مزايدة محفزة. |

### Frontend (Next.js)

| الملف / المسار | ماذا فيه |
|-----------------|----------|
| `app/carDetails/[id]/page.tsx` | صفحة تفاصيل السيارة: اشتراك في قناة `auction.{carId}`، استقبال `NewBidEvent`، تحديث السعر وعدد المزايدات دون reload. |
| `hooks/useDealerSocket.ts` | اشتراك في `auction.{auctionId}`، ربط `NewBidEvent` بتحديث سعر المزاد في لوحة التاجر. |
| شاشات المزاد المباشر / الصامت / الفوري / الثابت | تعتمد على Pusher وقنوات مثل `auction.live`, `auction.silent`, `auction.fixed`. |

تفاصيل ربط الواجهة بالقنوات والشاشات: **[ربط الواجهة بالمزادات Realtime](AUCTION_REALTIME_UI_BINDING.md)**.

---

## 3. كيف نختبر ونشغّل

### تشغيل الخدمات

```bash
# Backend
cd backend && composer install && cp .env.example .env && php artisan key:generate && php artisan migrate
php artisan serve
# الـ API: http://localhost:8000/api/...

# تفعيل المزادات المجدولة + تغيير النوع حسب الوقت
php artisan schedule:work

# معالجة Jobs (تحويل فوري → ثابت، إلخ)
php artisan queue:work
```

### اختبار المزايدة

1. **الحصول على token:** `POST /api/login` (email + password).
2. **وضع مزايدة:**  
   - `POST /api/auctions/bid` مع body: `{ "auction_id": 1, "bid_amount": 50000, "user_id": 1 }` و header `Authorization: Bearer {token}`  
   - أو `POST /api/auctions/{auction_id}/bids` مع `{ "bid_amount": 50000 }`.
3. **التحقق:** صفحة تفاصيل السيارة أو لوحة التاجر يجب أن تتحدّث فوراً (بدون reload) عند مزايدة من متصفح آخر أو من Postman.

### Postman

استخدم مجموعة الطلبات الجاهزة: **[docs/postman/DASM-Auctions-API.postman_collection.json](postman/DASM-Auctions-API.postman_collection.json)**.  
ضبط `base_url` (مثلاً `http://localhost:8000`) ثم تنفيذ **Login** وملء `token`، بعدها يمكن تجربة كل Endpoints المزادات والمزايدات.

### توثيق إضافي

| المستند | المحتوى |
|---------|----------|
| [AUCTION_LOGIC_STATE_AND_RULES.md](AUCTION_LOGIC_STATE_AND_RULES.md) | State Machine، الأنواع، آخر سعر، نسبة التغير، حالة السيارة، قائمة الملفات ذات الصلة. |
| [AUCTION_LOGIC_AND_ENDPOINTS.md](AUCTION_LOGIC_AND_ENDPOINTS.md) | جدول Endpoints (عامة، مسجّل دخوله، أدمن) + طريقة التشغيل والاختبار. |
| [AUCTION_REALTIME_UI_BINDING.md](AUCTION_REALTIME_UI_BINDING.md) | قنوات البث، الشاشات المرتبطة، البنية في الواجهة. |

---

بهذا يكون لديك **صورة موحدة**: كيف يعمل المزاد، أين التعديلات في الكود، وكيف تشغّل وتختبر. للتفاصيل الدقيقة ارجع للمستندات المربوطة أعلاه.
