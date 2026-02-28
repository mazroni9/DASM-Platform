# مصفوفة اختبارات تحديث السعر والمزايدات اللحظية + استقرار الحالة

هذا المستند يحدد **مصفوفة الاختبارات الرسمية** لتحديث السعر والمزايدات واستقرار الحالة، وربط كل فحص **بـ Test Case** محدد. يُستخدم كمرجع لفئتي `price_updates` و `state_consistency` في الـ Testing Module.

---

## 1. اختبارات تحديث السعر والمزايدات (Price Updates)

الهدف: التأكد من أن **السعر المعروض (current_bid)** و**وقت آخر مزايدة (last_bid_time)** متسقان مع بيانات جدول المزايدات.

| Test Case ID | القاعدة | ما يُفحص |
|--------------|---------|----------|
| **CurrentBid_Matches_HighestBid** | عند وجود مزايدات، `auctions.current_bid` = أعلى `bid_amount` في `bids` | لكل مزاد نشط: استعلام أعلى مزايدة؛ المقارنة مع current_bid. |
| **NoBids_CurrentBid_Or_OpeningPrice** | عند عدم وجود مزايدات، إما `current_bid = 0` أو يُفسَّر من `opening_price` | إذا لم توجد مزايدات و current_bid > 0 فيجب وجود opening_price (أو مصدر واضح). |
| **LastBidTime_NotFuture** | `last_bid_time` لا يكون في المستقبل | لكل مزاد: last_bid_time إن وُجد يجب أن يكون <= now. |
| **HasBids_HasLastBidTime** | المزاد الذي لديه مزايدات يجب أن يكون له `last_bid_time` | إذا كان عدد المزايدات > 0 فيجب last_bid_time غير null. |

**الخدمة:** `Modules/Test/Services/Tests/PriceUpdatesTestService.php`  
**النتائج:** تُخزَّن في `details['cases']` (id, name, passed, message) و `details['cases_passed']`, `details['cases_total']`.

---

## 2. اختبارات استقرار الحالة (State Consistency)

الهدف: التأكد من **تناسق حالة المزاد** مع **حالة السيارة** ومع **قواعد النوع والزمن** (لا تضارب بين الحالات).

| Test Case ID | القاعدة | ما يُفحص |
|--------------|---------|----------|
| **Active_IsActive** | المزاد الذي له status = live/active يرجع `isActive() === true` | لكل مزاد: إن كان status من activeValues() فيجب isActive() true. |
| **Active_CarInAuction** | مزاد نشط (live/active) → السيارة المرتبطة `auction_status = in_auction` | لكل مزاد نشط مع car: car.auction_status === 'in_auction'. |
| **Ended_ReserveMet_CarSold** | مزاد منتهٍ (ended) مع current_bid >= reserve_price → السيارة `sold` | إن status = ended و current_bid >= reserve_price فيجب car.auction_status = 'sold'. |
| **Failed_CarAvailable** | مزاد فاشل (failed) → السيارة `available` | إن status = failed فيجب car.auction_status = 'available'. |
| **Live_ApprovedForLive** | نوع المزاد LIVE يتطلب `approved_for_live = true` | إن auction_type = LIVE فيجب approved_for_live = true. |
| **EffectiveEnd_AfterStart** | وقت الانتهاء الفعلي (extended_until أو end_time) لا يكون قبل start_time | effective_end >= start_time لكل مزاد له start_time و end_time. |

**الخدمة:** `Modules/Test/Services/Tests/StateConsistencyTestService.php`  
**النتائج:** تُخزَّن في `details['cases']` و `details['cases_passed']`, `details['cases_total']`.

---

## 3. ملخص التغطية

| الفئة | عدد الـ Cases | الغرض |
|-------|----------------|--------|
| **price_updates** | 4 | تطابق السعر الحالي مع أعلى مزايدة، واتساق last_bid_time. |
| **state_consistency** | 6 | تناسق حالة المزاد مع حالة السيارة وقواعد النوع والزمن. |

---

## 4. مراجع الكود

| الملف | الدور |
|-------|--------|
| `app/Models/Auction.php` | current_bid، last_bid_time، getEffectiveEndTime()، isActive() |
| `app/Enums/AuctionStatus.php` | activeValues()، ENDED، FAILED |
| `Modules/Test/Services/Tests/PriceUpdatesTestService.php` | تنفيذ مصفوفة تحديث السعر |
| `Modules/Test/Services/Tests/StateConsistencyTestService.php` | تنفيذ مصفوفة استقرار الحالة |

بهذا يكون بند **اختبارات تحديث السعر والمزايدات اللحظية + استقرار الحالة** موثّقاً بصورة Matrix رسمية ومرتبطاً بـ Test Cases محددة في الكود.
