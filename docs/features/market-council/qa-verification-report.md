# Market Council — QA Verification Report

**Date:** Post-implementation stabilization pass  
**Scope:** End-to-end verification of the Market Council feature.

---

## Overall Verdict

**Stable** — The feature is internally consistent, operationally safe, and aligned with the DASM-e project structure. No critical issues found. Safe to proceed to context-based recommendations.

---

## A) Routes and Endpoints

| Check | Status |
|-------|--------|
| Public routes grouped under `/api/market-council` | ✓ |
| Admin routes under `/api/admin/market-council` | ✓ |
| Write endpoints protected (auth + throttle) | ✓ POST comments, POST/DELETE react |
| Route ordering | ✓ `GET /articles/{id}/comments` before `GET /articles/{slug}` |
| No collisions | ✓ |

---

## B) Data Model Consistency

| Check | Status |
|-------|--------|
| Models ↔ migrations ↔ controllers aligned | ✓ |
| helpful_count in MarketArticle fillable/casts | ✓ |
| comments_count semantics (approved top-level only) | ✓ |
| Reaction types: like, save, helpful | ✓ |

---

## C) Public API Shape

| Endpoint | Response shape | Frontend compatibility |
|----------|----------------|-------------------------|
| GET /categories | `{ success, data: [...] }` | ✓ |
| GET /articles | `{ success, data: paginator }` | ✓ Normalized in page.tsx |
| GET /articles/{slug} | `{ success, data: article }` | ✓ |
| GET /articles/{id}/comments | `{ success, data: [...] }` | ✓ |
| POST react response | `{ success, data: { reaction, active, counts } }` | ✓ |
| Article includes user_reactions when auth | ✓ |
| Article includes comments_count (live) | ✓ |

---

## D) Admin Flow

| Capability | Status |
|------------|--------|
| Categories CRUD | ✓ |
| Articles CRUD + status toggle | ✓ |
| Article contexts (car_detail, etc.) in create/edit | ✓ |
| Comments moderation (approve/hide/delete) | ✓ |
| Comments index with article slug for “view on site” | ✓ |

---

## E) Frontend Flow

| Check | Status |
|-------|--------|
| /market-council list page | ✓ Pagination, categories, article cards |
| /market-council/[slug] article detail | ✓ Full content, reactions, comments |
| Guest vs auth: reactions open modal | ✓ |
| Guest vs auth: comments show login CTA | ✓ |
| Comments submit → moderation message | ✓ |

---

## F) Integration Flow

| Integration | Status |
|-------------|--------|
| Navbar: مجلس السوق → /market-council | ✓ Desktop + mobile |
| Homepage preview: 3 articles, “عرض كل المقالات” | ✓ |
| Car details widget: context_type=car_detail | ✓ |
| Widget hidden when no matching articles | ✓ |

**Assumption:** Articles must have `market_article_contexts` with `context_type=car_detail` to appear in the car details widget. Admins set this in article create/edit.

---

## G) Hardening / Operations

| Check | Status |
|-------|--------|
| Throttle on POST react (30/min) | ✓ |
| Throttle on DELETE react (30/min) | ✓ |
| Throttle on POST comments (10/min) | ✓ |
| market-council:sync-counters command | ✓ --dry-run, --article |
| Comment strip_tags | ✓ |
| Counter underflow guard | ✓ where(column, '>', 0) |

---

## H) Documentation

| Check | Status |
|-------|--------|
| Docs under docs/features/market-council/ | ✓ |
| README lists documents | ✓ |
| maintenance-operations.md | ✓ |
| No broken internal refs | ✓ |

---

## Issues Found

**None critical.** Minor observations (left for later):

1. **Link consistency:** Homepage and market-council list use raw `<a href>` for article links; car details widget uses `LoadingLink`. Both work; LoadingLink adds loading UX.
2. **429 handling:** Frontend does not explicitly handle 429 responses from throttle. Users see generic error. Consider adding a “الرجاء الانتظار قليلاً” message for 429 in a future pass.
3. **Admin comment article link:** Uses `href` (external-style); could use `LoadingLink` for consistency.

---

## Manual Verification Checklist

1. [ ] **Navbar:** Click “مجلس السوق” → lands on /market-council
2. [ ] **List:** Browse articles, filter by category, pagination
3. [ ] **Article:** Open article by slug, verify content, cover, meta
4. [ ] **Reactions (guest):** Click إعجاب/حفظ/مفيد → auth modal opens
5. [ ] **Reactions (auth):** Toggle like/save/helpful, verify counts update
6. [ ] **Share:** WhatsApp and copy link work
7. [ ] **Comments (guest):** See list, “سجّل الدخول” opens modal
8. [ ] **Comments (auth):** Submit comment, see “تم استلام تعليقك وسيظهر بعد المراجعة”
9. [ ] **Admin:** Create category, create article with context car_detail, approve comment
10. [ ] **Homepage:** “من مجلس السوق” shows up to 3 articles
11. [ ] **Car details:** With car_detail-context articles, widget appears; without, it is hidden
12. [ ] **Sync:** Run `php artisan market-council:sync-counters --dry-run` (no DB errors)

---

## Recommendation

**Safe to proceed to context-based recommendations.** The feature is stable; any enhancements (e.g. 429 handling, LoadingLink consistency) can be done in later iterations.
