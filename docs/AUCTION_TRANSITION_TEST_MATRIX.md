# مصفوفة حالات الانتقال بين أنواع وحالات المزاد

هذا المستند يحدد **مصفوفة الانتقالات** المعتمدة في النظام وربط كل انتقال **باختبار (Test Case)** محدد أو بشرح المنطق. يُستخدم كمرجع لاختبارات فئة `transitions` في الـ Testing Module.

---

## 1. انتقالات الحالة (Auction Status)

الحالات: `scheduled` → `live`/`active` → `ended` | `failed` | `canceled` | `completed`.

| الانتقال | الشرط | الملف/الدالة | Test Case ID |
|----------|--------|----------------|--------------|
| **Scheduled → Live** | `now >= start_time` و `control_room_approved = true` | `Auction::updateStatusBasedOnTime()` → `start()` | `Status_Scheduled_to_Live` |
| **Live → Ended** | انتهاء الوقت أو قبول فوري، و `current_bid >= reserve_price` | `Auction::end()` أو `acceptBid()` | (يُغطى في منطق الانتهاء؛ لا استدعاء صريح في transitions) |
| **Live → Failed** | انتهاء الوقت و `current_bid < reserve_price` (لأنواع غير الفوري) | `Auction::end()` | (نفس ما فوق) |
| **Live → Extended** | مزايدة في آخر دقيقة مع وجود "فائز" (آخر مزايدة ≥ min_price) | `maybeExtendOnLastMinuteBid()` أو منطق تمديد في BidController | (منطق تمديد؛ يمكن إضافة case لاحقاً) |
| **Live (Instant) → لا يُنهى عند الوقت** | نوع المزاد LIVE_INSTANT أو SILENT_INSTANT؛ عند `now > end_time` لا يُستدعى `end()` | `Auction::updateStatusBasedOnTime()` (استثناء الفوري) | `Status_Instant_NoEndOnTime` (توثيق فقط أو فحص المنطق) |
| **أي → Canceled** | إلغاء يدوي | Controller / `cancel()` | (يدوي أو اختبار منفصل) |

---

## 2. انتقالات النوع (Auction Type) حسب الوقت

النوع يتغير تلقائياً حسب الساعة عند استدعاء `updateAuctionTypeBasedOnTime()`.

| النطاق الزمني (الساعة) | النوع المتوقع | الشرط إضافي | Test Case ID |
|-------------------------|---------------|-------------|--------------|
| **16:00 – 18:59** | `LIVE` | `approved_for_live = true` | `Type_16_19_IsLIVE` |
| **19:00 – 21:59** | `LIVE_INSTANT` | — | `Type_19_22_IsLiveInstant` |
| **22:00 – 15:59** | `SILENT_INSTANT` | — | `Type_22_16_IsSilentInstant` |

---

## 3. الحفاظ على opening_price عند تغيير النوع

| الانتقال (النوع) | القاعدة | Test Case ID |
|-------------------|---------|--------------|
| **LIVE → LIVE_INSTANT** | إن وُجدت مزايدات (`current_bid > 0`) يُحدَّث `opening_price = current_bid` | `Type_LIVE_to_LIVE_INSTANT_preserves_opening_price` |
| **LIVE_INSTANT → SILENT_INSTANT** | نفس القاعدة: `opening_price = current_bid` إن وُجدت مزايدات | `Type_LIVE_INSTANT_to_SILENT_preserves_opening_price` |

---

## 4. قائمة Test Cases المُنفَّذة في TransitionsTestService

| ID | الوصف | ما يُفحص |
|----|--------|----------|
| `Type_By_Hour` | النوع حسب الساعة (16–19→LIVE، 19–22→LIVE_INSTANT، 22–16→SILENT_INSTANT) | استدعاء `updateAuctionTypeBasedOnTime()` على كل مزاد نشط؛ التحقق من تطابق النوع مع الساعة الحالية. يغطي المصفوفة في القسم 2. |
| `Type_LIVE_to_LIVE_INSTANT_preserves_opening_price` | عند الانتقال من LIVE إلى LIVE_INSTANT مع مزايدات، opening_price يُحدَّث | بعد التحديث حسب الوقت، أي مزاد كان LIVE وأصبح LIVE_INSTANT وله current_bid > 0 يجب أن يكون له opening_price محدد. |
| `Type_LIVE_INSTANT_to_SILENT_preserves_opening_price` | عند الانتقال من LIVE_INSTANT إلى SILENT_INSTANT مع مزايدات، opening_price يُحدَّث | نفس الفكرة للنوعين المعنيين. |
| `Status_Scheduled_to_Live` | مجدول مع start_time في الماضي و control_room_approved ينتقل إلى نشط | إن وُجد مزاد بهذه المواصفات، استدعاء `updateStatusBasedOnTime()` ثم التحقق من `isActive()`. إن لم وُجد أي مزاد، الحالة تُعتبر "تخطي" (لا فشل). |

النتائج تُخزَّن في `details['cases']` لكل تشغيل: كل عنصر يحتوي على `id`, `name`, `passed`, `message`. كما يُخزَّن `details['cases_passed']` و `details['cases_total']` لسهولة العرض في الـ Dashboard.

---

## 5. مراجع الكود

| الملف | الدور |
|-------|--------|
| `app/Models/Auction.php` | `updateStatusBasedOnTime()`, `updateAuctionTypeBasedOnTime()`, `start()`, `end()`, `isInLiveAuctionPeriod()`, `isInLiveInstantPeriod()`, `isInSilentPeriod()` |
| `app/Enums/AuctionStatus.php` | قيم الحالة و activeValues() |
| `app/Enums/AuctionType.php` | قيم النوع |
| `Modules/Test/Services/Tests/TransitionsTestService.php` | تنفيذ مصفوفة الاختبارات أعلاه وحفظ النتائج في details['cases'] |

بهذا يكون بند **اختبارات لحالات الانتقال بين أنواع المزاد** مبنيّاً على مصفوفة حالات واضحة ومرتبطاً بـ Test Cases محددة في الكود.
