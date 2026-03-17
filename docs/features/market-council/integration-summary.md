# Market Council (مجلس السوق) Integration Summary

This document summarizes the integration of the Market Council feature into the main DASM-e platform experience.

---

## List of New Files Created

**None.** All integration was done by modifying existing files.

---

## List of Existing Files Modified

| File | Changes |
|------|---------|
| `frontend/components/shared/Navbar.tsx` | Added "مجلس السوق" link to desktop and mobile nav |
| `frontend/app/page.tsx` | Added `MarketCouncilPreviewSection` component and section |
| `frontend/app/carDetails/[id]/page.tsx` | Added `MarketCouncilWidget` component |

---

## Navbar Integration Summary

- **Desktop:** Added "مجلس السوق" link in the center links block, immediately before "لماذا داسم؟"
- **Mobile:** Added "مجلس السوق" link in the mobile menu drawer, before "لماذا داسم؟"
- **Target:** Both links point to `/market-council`
- **Styling:** Same pattern as existing links (`LoadingLink`, rounded-full desktop pills, mobile drawer items)

---

## Homepage Market Council Preview Section Summary

- **Placement:** After `BenefitsSection`, before the Footer
- **Title:** "من مجلس السوق"
- **Subtitle:** "ثقافة التاجر المحترف — قصص السوق وعلم المزاد"
- **Data source:** `GET /api/market-council/articles?per_page=3` (server-side fetch via `useEffect` + `api.get()`)
- **Cards:** Each card shows title, excerpt, category, read time
- **CTA:** "عرض كل المقالات" button linking to `/market-council`
- **Styling:** Follows existing homepage conventions (motion, container, spacing, border-t)

---

## Car Details Page Widget Integration Summary

- **Placement:** After `FeaturedCars` (similar cars), full-width section
- **Title:** "من مجلس السوق"
- **Data source:** `GET /api/market-council/articles?context_type=car_detail&per_page=3`
- **Behavior:** Renders only when articles are returned; hidden when empty or loading
- **Links:** Each item links to `/market-council/{slug}` via `LoadingLink`
- **Styling:** Premium block style, consistent with `FeaturedCars` (border-t, py-16, grid layout)

---

## Backend Endpoint Additions / Query Enhancements

**File:** `backend/app/Http/Controllers/MarketCouncilController.php`

- **Change:** Optional `context_type` filter added to `GET /api/market-council/articles`
- **Usage:** `?context_type=car_detail` filters articles that have a related `market_article_contexts` record with `context_type = car_detail`
- **Backward compatibility:** Omission of `context_type` returns all published articles as before

---

## Assumptions Made

1. Navbar links are hardcoded in `Navbar.tsx`; no shared `siteConfig` for main nav, so the new link was added directly.
2. Homepage sections use client-side fetching (`useEffect` + `api.get()`) rather than server components.
3. The car detail widget should only show when articles with `context_type=car_detail` exist; no fallback to recent articles.
4. Article detail route is `/market-council/[slug]` as implemented in `frontend/app/market-council/[slug]/page.tsx`.

---

## Risks / Manual Review Points Before Next Step

1. **Context data:** Articles must have `market_article_contexts` records with `context_type=car_detail` to appear in the car details widget. If none exist, the widget will not render. Consider seeding or admin UI for attaching contexts.
2. **API response shape:** Frontend expects `res.data.data` (paginator) or `res.data` (array). Verify axios response interceptor or API wrapper does not alter this structure.
3. **Loading state:** Homepage section shows a skeleton during loading; car details widget returns `null` until loaded—acceptable per requirements.
4. **RTL:** All new content uses RTL-friendly layout and `text-right` where appropriate.
