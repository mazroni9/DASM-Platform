# Market Council Article Reactions — Implementation Summary

This document summarizes the implementation of positive-only article actions (إعجاب، حفظ، مفيد) and share actions (واتساب، نسخ الرابط) for the Market Council feature.

---

## New Files Created

| File | Purpose |
|------|---------|
| `backend/database/migrations/2026_03_08_140004_create_market_reactions_table.php` | Creates `market_reactions` table |
| `backend/database/migrations/2026_03_08_140005_add_helpful_count_to_market_articles_table.php` | Adds `helpful_count` column to `market_articles` |
| `backend/app/Models/MarketReaction.php` | Eloquent model for reactions |
| `backend/app/Http/Controllers/MarketReactionController.php` | POST/DELETE react API |
| `docs/features/market-council/reactions-summary.md` | This document |

---

## Modified Files

| File | Changes |
|------|---------|
| `backend/app/Models/MarketArticle.php` | Added `helpful_count` to fillable/casts, `reactions()` relationship |
| `backend/app/Http/Controllers/MarketCouncilController.php` | Added `user_reactions` to showArticle response when authenticated |
| `backend/routes/api.php` | Added POST/DELETE routes under auth:sanctum |
| `frontend/app/market-council/[slug]/page.tsx` | Article action buttons (reactions, WhatsApp, copy link) |

---

## Backend Reactions Implementation

### Database

**`market_reactions` table:**
- `id`, `article_id` (FK → market_articles), `user_id` (FK → users), `type` (enum: like, save, helpful), `timestamps`
- Unique constraint: `(article_id, user_id, type)` — one reaction per type per user per article
- Index on `(article_id, type)` for aggregation

**`market_articles` table:**
- Added `helpful_count` (unsigned integer, default 0) — option (a) chosen: dedicated column for consistent schema with `likes_count` and `saves_count`.

### API Endpoints

| Method | Path | Auth | Body/Query | Behavior |
|--------|------|------|------------|----------|
| POST | `/api/market-council/articles/{id}/react` | Required | `{ type: 'like'\|'save'\|'helpful' }` | Add reaction (idempotent if already exists) |
| DELETE | `/api/market-council/articles/{id}/react?type=...` | Required | Query: `type` | Remove reaction |

### Response Shape

```json
{
  "success": true,
  "message": "...",
  "data": {
    "reaction": "like",
    "active": true,
    "counts": {
      "likes_count": 5,
      "saves_count": 2,
      "helpful_count": 1
    }
  }
}
```

### Article API Extension

`GET /api/market-council/articles/{slug}`:
- When authenticated: adds `user_reactions: ['like', 'save', ...]` to the response so the frontend can show active state.

---

## Aggregate Counts

**Chosen approach:** Option (a) — dedicated `helpful_count` column on `market_articles`.

**Implementation:**
- On POST (add reaction): increment corresponding column (`likes_count`, `saves_count`, `helpful_count`) inside a DB transaction.
- On DELETE (remove reaction): decrement within a `where(column, '>', 0)` clause to avoid underflow on unsigned columns.

Counts are kept in sync with `market_reactions` on each add/remove. No background jobs or aggregation queries.

---

## Frontend Article Actions

### Placement

Actions are rendered between the article prose content and the main CTA ("طبّق هذه المعرفة في المزاد الآن"), in a horizontal row with `border-t`.

### Actions

| Action | Label | Auth required | Behavior |
|--------|-------|----------------|-----------|
| Like | إعجاب | Yes | Toggle like; opens login modal if guest |
| Save | حفظ | Yes | Toggle save; opens login modal if guest |
| Helpful | مفيد | Yes | Toggle helpful; opens login modal if guest |
| WhatsApp | واتساب | No | Opens `wa.me` with article title + URL |
| Copy link | نسخ الرابط | No | Copies URL to clipboard; toast "تم نسخ الرابط" |

### Guest Handling

If a guest clicks إعجاب / حفظ / مفيد: `useAuthStore.getState().openAuthModal("login")` is called (same pattern as BidForm).

### Visual Design

- Buttons use rounded corners, borders, primary color for active state.
- Active reaction: `bg-primary/10 border-primary text-primary`.
- Count shown next to label when > 0.
- Loading spinner per action while request is in progress.

---

## Assumptions

1. Market Council article pages use the root layout that includes `AuthModal` via `AppChrome`.
2. `auth:sanctum` is the standard API auth for user-scoped endpoints.
3. Article show uses `slug` in the URL; react endpoints use numeric `id` from the article response.
4. WhatsApp share uses `https://wa.me/?text=...` with encoded title + URL.
5. `navigator.clipboard.writeText` is used for copy (works in HTTPS contexts).

---

## Risks / Manual Review Points

1. **Migration order:** Run migrations in order; `2026_03_08_140005` depends on `market_articles`.
2. **helpful_count sync:** Existing reactions (if any) added before this feature will not be reflected in `helpful_count`; consider a one-time sync script if needed.
3. **Rate limiting:** No throttling on react endpoints; consider adding if abuse occurs.
4. **Clipboard:** Copy link requires a secure context (HTTPS or localhost); fallback UX for HTTP not implemented.
5. **RTL:** All labels are Arabic; layout and alignment should remain RTL-friendly.
