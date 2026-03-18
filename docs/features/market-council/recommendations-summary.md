# Market Council Context-Based Recommendations — Implementation Summary

Simple rule-based recommendations using existing `market_article_contexts` structure.

---

## New Endpoint

**GET /api/market-council/recommended**

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| context_type | Yes | — | One of: car_detail, auction_live, auction_instant, auction_delayed, finance, seller, buyer, trader |
| limit | No | 3 | 1–10 articles |
| exclude_article_id | No | — | Exclude this article (e.g. current article on detail page) |
| strict_context | No | false | If true, no fallback; return only context-matching articles |
| featured | No | false | Restrict to featured only |
| category | No | — | Filter by category slug or id |

**Response:** `{ success: true, data: [...] }` — array of articles with category relation.

**Ordering:** Featured first → published_at desc → id desc.

**Fallback:** When `strict_context` is not set, if fewer articles match than `limit`, remaining slots are filled with recent published (excluding already returned and `exclude_article_id`). When `strict_context=1`, no fallback — car details page uses this for context-only results.

---

## Frontend Integration

### Car details widget

- **Before:** `GET /api/market-council/articles?context_type=car_detail&per_page=3`
- **After:** `GET /api/market-council/recommended?context_type=car_detail&limit=3&strict_context=1`
- Uses `strict_context=1` — no fallback; only articles with `car_detail` context. Widget stays hidden when none match.
- Design unchanged; only endpoint and response handling updated.

### Article detail page

- **New block:** "مقالات ذات صلة" after the comments section.
- Shown only when the article has at least one context.
- Uses the first context's `context_type`, calls recommended with `exclude_article_id` and limit 3.
- Compact grid of 3 cards (category, title, read time).
- Not shown if the article has no contexts.

---

## Assumptions

1. `context_type` is validated against the same list used in the admin.
2. Fallback uses recent published articles only; no context matching for fallback slots.
3. First context is used when multiple exist; no merging of contexts.
4. Homepage preview section keeps using `/articles?per_page=3`; no change.

---

## Risks / Notes

1. Articles without contexts do not appear in recommendations until fallback runs.
2. Fallback articles may be unrelated to the requested context.
3. Car details widget: with fallback, non–car_detail articles can appear when few car_detail articles exist.
