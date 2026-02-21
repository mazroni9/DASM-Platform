# ربط الواجهة الأمامية بالمزادات Realtime

هذا المستند يوضح **ما تم تنفيذه** في بند "ربط الواجهة الأمامية بالمزادات Realtime": عرض السعر الحالي، عدد المزايدين، حالة المزاد، وتحديث لحظي بدون إعادة تحميل.

---

## 1. البث من الخادم (Backend)

- **الحدث:** `NewBidEvent` يُبث عند كل مزايدة مقبولة.
- **المسارات التي تُطلق البث:**
  - `POST /api/auctions/bid` (placeBid)
  - `POST /api/auctions/{id}/bids` (store) — تمت إضافته لضمان التحديث اللحظي من أي مسار مزايدة.
- **القنوات:** يُبث على قناتين لضمان وصول التحديث لكل الواجهات:
  - `auction.{car_id}` — لصفحة تفاصيل السيارة (الرابط يعتمد على معرّف السيارة).
  - `auction.{auction_id}` — للوحات التاجر وأي واجهة تشترك بمعرّف المزاد.
  - للمزاد الثابت (FIXED): أيضاً `auction.fixed`.
- **البيانات المُرسلة:** `active_auction` (المزاد الحالي مع `current_bid`، الحالة، الوقت المتبقي)، و`total_bids` (عدد المزايدات).

---

## 2. الشاشات المرتبطة بالتحديث اللحظي

| الشاشة | المسار / المكون | القناة | الحدث | ما يُحدَّث |
|--------|------------------|--------|--------|------------|
| تفاصيل سيارة (مزايدة) | `app/carDetails/[id]/page.tsx` | `auction.{carId}` | NewBidEvent | السعر الحالي، عدد المزايدات، بيانات المزاد (بدون reload) |
| لوحة التاجر (Dealer) | `app/dealer/page.tsx` + `useDealerSocket` | `auction.{auctionId}` | NewBidEvent + price-updated | سعر المزاد في القائمة/البطاقات |
| المزاد المباشر (Live) | `app/lib/websocket-provider.tsx` + dashboard/auctioneer | `auction.live` | أحداث البث | السيارة الحالية، السعر، المزايدات، الإحصائيات |
| سوق مباشر (Live Market) | `app/auctions/auctions-1main/live-market/LiveMarketPageContent.tsx` | `session.{sessionId}` أو `auction.live` | Pusher | السعر الحالي والصفوف |
| الصامت (Silent) | `app/auctions/auctions-1main/silent/page.tsx` | `auction.silent` | CarMovedBetweenAuctionsEvent، AuctionStatusChangedEvent | إعادة جلب القائمة عند تغيير الحالة أو نقل سيارة |
| الفوري (Instant) | `app/auctions/auctions-1main/instant/page.tsx` | usePusher | — | إمكانية ربط نفس النمط (قناة حسب النوع أو المعرّف) |
| الثابت (Fixed) | `app/auctions/auctions-1main/fixed/page.tsx` | usePusher | — | إمكانية ربط نفس النمط |

---

## 3. البنية التقنية في الواجهة

- **Pusher:** الاتصال عبر `PusherProvider` (في `contexts/PusherContext.tsx`) و`usePusher()` / `useChannel()` للاشتراك في القنوات.
- **قنوات عامة:** `auction.live`، `auction.silent`، `auction.fixed`، `auction.{car_id}`، `auction.{auction_id}`.
- **صفحة تفاصيل السيارة:** تشترك في `auction.{carId}` وتربط `NewBidEvent` بتحديث الـ state (`active_auction`، `total_bids`) فوراً دون إعادة تحميل.
- **لوحة التاجر:** تشترك في `auction.{auctionId}` لكل مزاد معروض، وتستمع لـ `NewBidEvent` و`price-updated` وتحدّث السعر في الـ store.

---

## 4. خلاصة

- تم ضمان **بث حدث المزايدة** من مساري وضع المزايدة (placeBid و store) وبثه على قناتي **car_id** و **auction_id**.
- **تفاصيل السيارة** و**لوحة التاجر** تعرضان السعر الحالي وعدد المزايدين وتتحديثان **لحظياً** عند استلام NewBidEvent دون reload.
- شاشات المزاد المباشر وسوق المزاد الحي تعتمد على قنوات Pusher نفسها أو المرتبطة بها.
- بند **ربط الواجهة الأمامية بالمزادات Realtime** يُعتبر مكتملاً بالرجوع إلى هذا المستند وإلى التعديلات في Backend (BidController، NewBidEvent) و Frontend (carDetails، useDealerSocket).
