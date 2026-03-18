# Market Council — Maintenance & Operations

Short operational notes for throttling, counter sync, and moderation/recovery.

---

## Rate Limiting (Throttling)

| Endpoint | Limit | Scope |
|----------|-------|-------|
| `POST /api/market-council/articles/{id}/react` | 30 requests/min | Per authenticated user |
| `DELETE /api/market-council/articles/{id}/react` | 30 requests/min | Per authenticated user |
| `POST /api/market-council/articles/{id}/comments` | 10 requests/min | Per authenticated user |

Uses Laravel `throttle:X,1` middleware (X requests per 1 minute). Limits are per-user when authenticated.

---

## Counter Sync Command

If stored counters (`likes_count`, `saves_count`, `helpful_count`, `comments_count`) drift from source tables, run:

```bash
# Dry run — show what would change
php artisan market-council:sync-counters --dry-run

# Apply updates
php artisan market-council:sync-counters

# Sync a single article
php artisan market-council:sync-counters --article=123
```

The command recalculates from `market_reactions` (by type) and `market_comments` (approved, top-level only). Safe to run manually; does not run automatically.

---

## Recommendation Endpoint

`GET /api/market-council/recommended` — Context-based article recommendations.

| Param | Required | Description |
|-------|----------|-------------|
| context_type | Yes | car_detail, auction_live, auction_instant, auction_delayed, finance, seller, buyer, trader |
| limit | No | 1–10, default 3 |
| exclude_article_id | No | Exclude this article from results |
| featured | No | If true, only featured articles |
| category | No | Filter by category slug or id |
| strict_context | No | If true, no fallback — return only context-matching articles (empty if none) |

**Ordering:** Featured first, then published_at desc, id desc.  
**Fallback:** When `strict_context` is not set, if fewer than limit context-matching articles, fills remaining slots with recent published (excluding already shown and exclude_article_id). When `strict_context=1`, no fallback; returns only matching articles.

---

## Operator Notes

- **Comments moderation**: Use existing admin panel (`/admin/market-council/comments`) to approve/hide. Counters update on status change.
- **Counter drift**: After bulk imports, migrations, or data fixes, run `market-council:sync-counters`.
- **Abuse**: If a user exceeds throttle, they receive 429; no automatic blocking beyond the per-minute limit.
