# Market Council (مجلس السوق) — تحليل وتوصيات قبل التنفيذ

**التاريخ:** 8 مارس 2025  
**الحالة:** تحليل فقط — لا تعديل ولا إنشاء ملفات

---

## 1. Frontend Architecture

### Framework & App Structure

| العنصر | القيمة |
|--------|--------|
| **Framework** | Next.js 16.0.10 (App Router) |
| **React** | 19.2.1 |
| **TypeScript** | نعم |
| **Styling** | Tailwind CSS + shadcn/ui (Radix) |
| **State** | Zustand, React state |
| **HTTP** | axios (`lib/axios.ts`) |
| **Auth** | useAuth hook, authStore |

**هيكل app:**
```
frontend/app/
├── layout.tsx          # Root: Navbar + AppChrome + children
├── page.tsx            # Homepage
├── about/               # صفحة من نحن
├── admin/               # لوحة الإدارة (layout خاص)
├── auctions/            # المزادات (متداخل: auctions-1main, auctions-2car, etc.)
├── auth/                # تسجيل دخول/تسجيل
├── blog/                # المدونة (page + [slug])
├── carDetails/[id]/     # تفاصيل السيارة
├── dashboard/           # لوحة المستخدم
├── dealer/              # لوحة التاجر
├── exhibitor/           # لوحة المعرض
├── fees/, how-it-works/, terms/, privacy/
├── why-dasm/
└── ...
```

### Routing Pattern

- **App Router**: ملفات `page.tsx` داخل مجلدات تحدد المسار
- **Dynamic segments**: `[id]`, `[slug]` (مثل `blog/[slug]`, `carDetails/[id]`)
- **Layouts**: `layout.tsx` لكل قسم (admin, dealer, moderator, dashboard)
- **Public pages**: بدون layout خاص، تستخدم Root Layout + Navbar

### Shared UI Components

| المكون | المسار | الاستخدام |
|--------|--------|-----------|
| Navbar | `components/shared/Navbar.tsx` | في Root Layout |
| Footer | `components/shared/Footer.tsx` | في الصفحات (مثل page, blog) |
| LoadingLink | `components/LoadingLink` | للروابط مع حالة تحميل |
| MarketTypeNav | `components/shared/MarketTypeNav.tsx` | بطاقات الأسواق في الصفحة الرئيسية |
| Button, Card, Input, etc. | `components/ui/*` | مكونات أساسية |

### Navbar/Header Implementation

- **مصدر وحيد**: `components/shared/Navbar.tsx` داخل Root Layout
- **الروابط الحالية**: "لماذا داسم؟" فقط (بدون المدونة في الـ Navbar)
- **الفوتر**: يستورد `FOOTER_NAV_LINKS` من `lib/siteConfig.ts`

### Homepage Structure

من `docs/source-of-truth/HOMEPAGE-SOURCE-OF-TRUTH.md` و `app/page.tsx`:

| الترتيب | القسم | الملف |
|---------|-------|-------|
| 1 | Hero | مضمّن في page.tsx |
| 2 | بطاقات الأسواق | MarketTypeNav |
| 3 | البث المباشر | LiveBroadcastSection (مضمّن) |
| 4 | الإحصائيات | StatsSection (مضمّن) |
| 5 | المزايا | BenefitsSection (مضمّن) |
| 6 | Footer | Footer.tsx |

### Car Details Page Location

- **المسار**: `frontend/app/carDetails/[id]/page.tsx`
- **الرابط**: `/carDetails/{id}`
- **مكونات داخلية**: BidForm, AddToWatchlistButton, FeaturedCars (سيارات مشابهة)
- **بنية**: عمودان RTL — محتوى + بطاقة مزايدة لاصقة

### Admin Dashboard Frontend Location

- **Layout**: `frontend/app/admin/layout.tsx`
- **القائمة**: مصفوفة `navigation` داخل layout — أقسام مع permissions
- **الصفحات**: `frontend/app/admin/*` (users, cars, auctions, blog, sessions, etc.)
- **الحماية**: `useAuth` + `usePermission` — redirect إلى login إذا لم يكن admin/moderator

---

## 2. Backend Architecture

### Framework & Module Structure

| العنصر | القيمة |
|--------|--------|
| **Framework** | Laravel 12 |
| **PHP** | 8.2+ |
| **Auth** | Laravel Sanctum |
| **Controllers** | `app/Http/Controllers/` + namespaced (Admin/, Dealer/, Exhibitor/, Market/) |

**هيكل Controllers:**
- Public: `AuthController`, `BlogController`, `CarController`, `AuctionController`, etc.
- Admin: `Admin\BlogController`, `Admin\CarController`, etc.
- Role-based: `Dealer\`, `Exhibitor\`, `Moderator\`

### Existing API Route Organization

من `backend/routes/api.php`:

| القسم | Prefix | الحماية |
|-------|--------|---------|
| Diagnostics | `_diag` | DIAG_TOKEN |
| Auth | `auth`, `/login`, etc. | Public |
| Public | `auctions`, `blog`, `market`, `sessions` | Public |
| Protected | — | auth:sanctum |
| Dealer | `dealer` | auth:sanctum + DealerMiddleware |
| Moderator | `moderator` | auth:sanctum + ModeratorMiddleware |
| Exhibitor | `exhibitor` | auth:sanctum (+ role) |
| Admin | `admin` | auth:sanctum + AdminMiddleware + set.organization |

### Controller/Service/Model Patterns

- **Controllers**: مباشرة على Models — لا طبقة Service واضحة
- **Resources**: `CarCardResource`, `Admin\CarResource`, etc.
- **Models**: `app/Models/` مع Relationships و Enums

### Existing Auth Handling

- **Backend**: `auth:sanctum` — Bearer token
- **Frontend**: `useAuth` hook، `authStore` (Zustand)، `localStorage` للـ token
- **Admin**: `AdminMiddleware` + `can`/`canAny` للصلاحيات

### Comment/Reaction-like Patterns

- **لا يوجد** نظام تعليقات أو تفاعلات عام
- أقرب شيء: `VenueOwnerRatingController` للتقييمات
- Blog: بدون تعليقات في الكود الحالي

### Admin API Structure

- **Prefix**: `admin`
- **Pattern**: `Route::prefix('admin')->group(...)` مع middleware
- **Blog مثال**: `admin/blog/posts`, `admin/blog/categories`, `admin/blog/tags`
- **Permissions**: `can:permission.name` على المسارات

---

## 3. Database Patterns

### Migration Style

- **التنسيق**: `YYYY_MM_DD_HHMMSS_action_description.php`
- **أمثلة**: `2026_01_14_160836_create_blog_categories_table.php`
- **الاحتياط**: `Schema::hasTable()` و `Schema::hasColumn()` قبل الإنشاء/التعديل
- **down()**: `Schema::dropIfExists()`

### Naming Conventions

- **جداول**: snake_case، plural (`blog_categories`, `blog_posts`)
- **أعمدة**: snake_case (`published_at`, `user_id`)

### Foreign Key Patterns

- `$table->unsignedBigInteger('user_id')` مع `->references()->on()->onDelete()`
- أو `foreignId()` في Laravel حديث

### Enum/Style Conventions

- **Enums**: `app/Enums/` (مثل `CarsMarketsCategory`, `CarCondition`)
- **Casts**: `'market_category' => CarsMarketsCategory::class`

### Seeders/Factories

- موجودة: `RolesAndPermissionsSeeder`, `AuctionTestDataSeeder`, etc.

---

## 4. Integration Points for Market Council

### 4.1 `/market-council` (قائمة عامة)

| البند | التوصية |
|-------|---------|
| **المسار** | `frontend/app/market-council/page.tsx` |
| **المرجع** | بنية `blog/page.tsx` (قائمة + pagination) |
| **API** | `GET /api/market-council` (public) |

### 4.2 `/market-council/[slug]` (صفحة تفصيل)

| البند | التوصية |
|-------|---------|
| **المسار** | `frontend/app/market-council/[slug]/page.tsx` |
| **المرجع** | بنية `blog/[slug]/page.tsx` |
| **API** | `GET /api/market-council/{slug}` (public) |

### 4.3 Admin Market Council Section

| البند | التوصية |
|-------|---------|
| **المسار** | `frontend/app/admin/market-council/*` |
| **القائمة** | إضافة عنصر في `navigation` داخل `admin/layout.tsx` |
| **المرجع** | بنية `admin/blog` |
| **API** | `admin/market-council/*` مع AdminMiddleware |

### 4.4 Navbar Link

| البند | التوصية |
|-------|---------|
| **الملف** | `components/shared/Navbar.tsx` |
| **الموقع** | بجانب "لماذا داسم؟" في الـ Center Links |
| **بديل** | إضافة في `lib/siteConfig.ts` إذا أردنا توحيد المصدر |

### 4.5 Homepage Preview Section

| البند | التوصية |
|-------|---------|
| **الملف** | `frontend/app/page.tsx` |
| **الموقع** | بين StatsSection و BenefitsSection — أو قسم جديد بعد MarketTypeNav |
| **المرجع** | بنية `LiveBroadcastSection` أو `StatsSection` |
| **ملاحظة** | تحديث `docs/source-of-truth/HOMEPAGE-SOURCE-OF-TRUTH.md` بعد التعديل |

### 4.6 Car Details Widget

| البند | التوصية |
|-------|---------|
| **الملف** | `frontend/app/carDetails/[id]/page.tsx` |
| **الموقع** | قسم جانبي أو ضمن المحتوى — مثل FeaturedCars |
| **المرجع** | مكوّن FeaturedCars الموجود |
| **ملاحظة** | يجب تحديد العلاقة: هل مجلس السوق يرتبط بسيارة معينة؟ |

---

## 5. Risks and Constraints

| المخاطر | التفاصيل |
|---------|----------|
| **تعارض المسارات** | `/market-council/[slug]` يجب أن يكون بعد أي مسار ثابت مثل `/market-council/latest` |
| **تعارض API** | تجنب أسماء مثل `/api/market/*` لأن `market` مستخدم حاليًا |
| **صلاحيات Admin** | إضافة permission جديد أو استخدام موجود (مثل `blog_posts.view`) |
| **siteConfig** | إضافة رابط مجلس السوق يتطلب تعديل `FOOTER_NAV_LINKS` إذا أردنا ظهوره في الفوتر |
| **Homepage** | أي قسم جديد يجب أن يلتزم بـ `docs/source-of-truth/HOMEPAGE-SOURCE-OF-TRUTH.md` |
| **RTL/Layout** | كل الصفحات RTL — مراعاة `dir="rtl"` في المكونات الجديدة |
| **تحميل الصور** | استخدام `next/image` مع `unoptimized: true` أو تكوين `images` في next.config |
| **Blog كمثال** | Blog يستخدم slug — تجنب تعارض slugs إذا كان مجلس السوق يستخدم نفس الجداول |

---

## 6. Implementation Recommendation

### Recommended Implementation Order

1. **Backend: Database**
   - Migration لجدول `market_council_items` (أو اسم مشابه)
   - Model + Resource

2. **Backend: Public API**
   - `GET /api/market-council` (قائمة)
   - `GET /api/market-council/{slug}` (تفاصيل)

3. **Backend: Admin API**
   - Controller في `Admin\`
   - Routes تحت `admin/market-council`
   - إضافة permission إن لزم

4. **Frontend: Public Pages**
   - `app/market-council/page.tsx`
   - `app/market-council/[slug]/page.tsx`

5. **Frontend: Admin Section**
   - `app/admin/market-council/page.tsx` (قائمة)
   - `app/admin/market-council/new/page.tsx` و `[id]/edit` إن لزم
   - إضافة عنصر في `admin/layout.tsx`

6. **Frontend: Navigation**
   - رابط في Navbar
   - رابط في Footer (siteConfig) إن رغبت

7. **Frontend: Homepage**
   - قسم معاينة في الصفحة الرئيسية

8. **Frontend: Car Details**
   - Widget (إذا كانت هناك علاقة منطقية)

---

## 7. Probable Files/Folders to Touch Later

### Backend

| الملف/المجلد | الإجراء |
|--------------|---------|
| `database/migrations/YYYY_MM_DD_*_create_market_council_*` | إنشاء |
| `app/Models/MarketCouncilItem.php` (أو مشابه) | إنشاء |
| `app/Http/Resources/MarketCouncilResource.php` | إنشاء |
| `app/Http/Controllers/MarketCouncilController.php` | إنشاء (public) |
| `app/Http/Controllers/Admin/MarketCouncilController.php` | إنشاء |
| `routes/api.php` | تعديل (إضافة routes) |
| `database/seeders/*` | اختياري |

### Frontend

| الملف/المجلد | الإجراء |
|--------------|---------|
| `app/market-council/page.tsx` | إنشاء |
| `app/market-council/[slug]/page.tsx` | إنشاء |
| `app/admin/market-council/*` | إنشاء |
| `app/admin/layout.tsx` | تعديل (إضافة navigation item) |
| `components/shared/Navbar.tsx` | تعديل (رابط) |
| `lib/siteConfig.ts` | تعديل (إذا أضفنا للفوتر) |
| `components/shared/Footer.tsx` | لا تعديل مباشر (يستورد من siteConfig) |
| `app/page.tsx` | تعديل (قسم معاينة) |
| `app/carDetails/[id]/page.tsx` | تعديل (widget، إن وجد) |
| `docs/source-of-truth/HOMEPAGE-SOURCE-OF-TRUTH.md` | تحديث (بعد تغيير الصفحة الرئيسية) |

---

## 8. Warnings Before Starting Development

1. **لا تعدّل ملفات غير مرتبطة** — تجنب refactoring لـ admin layout أو blog أو غيرها إلا للضرورة.
2. **اتبع ترتيب التنفيذ** — Backend أولاً ثم Frontend.
3. **اختبر المسارات الثابتة أولاً** — أي route ثابت (مثل `/market-council/latest`) يجب أن يُعرَّف قبل `[slug]`.
4. **احترم FOOTER_NAV_LINKS** — إضافة رابط جديد يجب أن يكون في siteConfig لا hardcoded.
5. **حدّث HOMEPAGE-SOURCE-OF-TRUTH** — عند إضافة قسم في الصفحة الرئيسية.
6. **لا تغيّر بنية Blog** — استخدمها كمرجع فقط دون دمج أو تعديل.
7. **تحقق من slug uniqueness** — إذا استخدمت slug في مجلس السوق، تأكد أنه لا يتعارض مع blog.
8. **Admin permissions** — حدد إذا كنت ستضيف permission جديد أو تعتمد على موجود.
