# توثيق منطق المزاد + الـ Endpoints + طريقة التشغيل

هذا المستند يجمع **منطق المزاد** (مرجع مفصل)، **أهم Endpoints** للمزادات والمزايدات، و**طريقة التشغيل والاختبار**.

---

## 1. منطق المزاد (مرجع مفصل)

المنطق الكامل (حالات المزاد، الانتقال التلقائي، آخر سعر، نسبة التغير، حالة السيارة، انتقال الفوري إلى الثابت) موثّق في:

**[منطق المزادات: State Machine وقواعد التشغيل](AUCTION_LOGIC_STATE_AND_RULES.md)**

ملخص سريع:
- **حالات المزاد:** scheduled → live → ended / failed / completed / canceled.
- **أنواع المزاد:** live، live_instant، silent_instant، fixed؛ التبديل حسب الوقت في `updateAuctionTypeBasedOnTime`.
- **آخر سعر:** محفوظ في `auctions.current_bid`؛ يُحدَّث في `processBid()` و`acceptBid()`.
- **نسبة التغير:** حقل محسوب `bid_change_percentage` (من opening_price إلى current_bid) في الـ API.
- **حالة السيارة:** تُحدَّث في `start()` (in_auction)، `acceptBid()` (sold)، `end()` عند الفشل (available لغير الفوري). الفوري عند انتهاء الوقت لا يُنهى من `updateStatusBasedOnTime` ليتحوّل إلى ثابت عبر `MoveCarToFixedAuctionJob`.

---

## 2. أهم Endpoints (المزادات والمزايدات)

جميع المسارات تحت البادئة **`/api`**. المصادقة عبر `Authorization: Bearer {token}` حيث لزم.

### 2.1 عامة (Public) — بدون مصادقة أو مصادقة اختيارية

| Method | Path | الوصف |
|--------|------|--------|
| GET | `/api/by-type/{auction_type}` | قائمة مزادات حسب النوع (live, live_instant, silent_instant, fixed) |
| GET | `/api/approved-auctions/{auction_type}` | مزادات معتمدة حسب النوع |
| GET | `/api/approved-live-auctions` | مزادات مباشرة معتمدة |
| GET | `/api/auctions-finished` | مزادات منتهية |

### 2.2 مستخدم مسجّل دخوله (Dealer / User)

| Method | Path | الوصف |
|--------|------|--------|
| GET | `/api/approved-auctions` | قائمة المزادات المعتمدة |
| GET | `/api/auctions/{auction}/bids` | مزايدات مزاد معيّن |
| POST | `/api/auctions/{auction}/bids` | وضع مزايدة (body: `bid_amount`) |
| POST | `/api/auctions/bid` | وضع مزايدة (موحّد، body: `auction_id`, `bid_amount`, `user_id`) |
| GET | `/api/auctions/bids/{id}` | آخر المزايدات لمزاد |
| GET | `/api/my-bids` | سجل مزايداتي |
| GET | `/api/bids-history` | تاريخ المزايدات |
| GET | `/api/bids/{bid}/status` | حالة مزايدة (هل لا تزال الأعلى) |
| GET | `/api/auctions/{auction}/status` | حالة مزاد |
| GET | `/api/auctions/{auction}/leaderboard` | لوحة المتصدرين لمزاد |
| POST | `/api/auctions` | إنشاء مزاد |
| PUT | `/api/auctions/{id}` | تحديث مزاد |
| POST | `/api/auctions/{id}/cancel` | إلغاء مزاد |
| GET | `/api/my-auctions` | مزاداتي |
| GET | `/api/auctions/calculate-settlement/{car_id}` | حساب التسوية لسيارة |
| POST | `/api/auctions/confirm-sale` | تأكيد البيع |

### 2.3 إدارة (Admin)

| Method | Path | الوصف |
|--------|------|--------|
| GET | `/api/admin/auctions` | قائمة كل المزادات (أدمن) |
| GET | `/api/admin/auctions/{id}` | تفاصيل مزاد |
| PUT | `/api/admin/auctions/{id}` | تحديث مزاد |
| POST | `/api/admin/auctions/{id}/approve` | اعتماد مزاد |
| POST | `/api/admin/auctions/{id}/reject` | رفض مزاد |
| PUT | `/api/admin/auctions/{id}/status` | تحديث حالة المزاد |
| PUT | `/api/admin/auctions/{id}/auction-type` | تغيير نوع المزاد |
| PUT | `/api/admin/auctions/{id}/set-open-price` | تعيين سعر الافتتاح |
| POST | `/api/admin/auctions/bulk-approve` | اعتماد جماعي |
| POST | `/api/admin/auctions/bulk-reject` | رفض جماعي |
| PUT | `/api/admin/auctions/bulk/move-to-status` | نقل جماعي بين الحالات |

(ملاحظة: مسارات الأدمن قد تتطلب prefix مختلف حسب تركيب الـ routes؛ المرجع النهائي هو `backend/routes/api.php`.)

### 2.4 اختبارات المزاد (Auction Tests) + قنوات البث (Channels)

جدول **Endpoints وحدة الاختبارات** (قائمة، latest، categories، run-all، run/{category}، سيناريوهات، حذف) و**قنوات البث** المُنفّذة (auction.{id}, auction.{car_id}, auction.fixed, auction.live, admin.auction-tests, admin.auction-log, dealer.*، إلخ) موثّق في: **[TEST_ENDPOINTS_AND_BROADCAST_CHANNELS.md](TEST_ENDPOINTS_AND_BROADCAST_CHANNELS.md)**. مجموعة Postman تحتوي على مجلد **Auction Tests (Admin)** لهذه المسارات.

---

## 3. طريقة التشغيل والاختبار

### تشغيل Backend محلياً

```bash
cd backend
composer install
cp .env.example .env
# ضبط .env: DB، APP_URL، PUSHER_APP_* إن وُجد
php artisan key:generate
php artisan migrate
php artisan serve
```

الـ API يكون متاحاً على `http://localhost:8000` (والطلبات إلى `/api/...`).

### تشغيل Scheduler (للانتقال التلقائي وتفعيل المزادات)

```bash
php artisan schedule:work
```

أو على السيرفر إضافة Cron: `* * * * * cd /path-to-project/backend && php artisan schedule:run >> /dev/null 2>&1`

### تشغيل Queue (للـ Jobs مثل MoveCarToFixedAuctionJob)

```bash
php artisan queue:work
```

### اختبار المزايدة

1. الحصول على token: تسجيل الدخول عبر `POST /api/login` (أو مسار تسجيل الدخول المعتمد).
2. وضع مزايدة: `POST /api/auctions/bid` مع body مثل `{ "auction_id": 1, "bid_amount": 50000, "user_id": 1 }` و header `Authorization: Bearer {token}`.
3. أو استخدام مسار المزايدة القديم: `POST /api/auctions/{auction_id}/bids` مع `{ "bid_amount": 50000 }`.

### مجموعة Postman

يوجد ملف Collection جاهز لاستيراده في Postman: **`docs/postman/DASM-Auctions-API.postman_collection.json`**. يضم طلبات لأهم Endpoints أعلاه؛ ضبط المتغير `base_url` (مثلاً `http://localhost:8000`) و`token` عند الحاجة.

---

بهذا يكون بند **توثيق منطق المزاد + الـ Endpoints + طريقة التشغيل** مكتملاً مع وجود **Postman Collection** لأهم الـ Endpoints.
