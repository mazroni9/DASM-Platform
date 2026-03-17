# Market Council Public Comments — Implementation Summary

This document summarizes the implementation of controlled, moderation-first public comments for Market Council articles.

---

## New Files Created

| File | Purpose |
|------|---------|
| `backend/app/Http/Controllers/MarketCommentController.php` | Public GET/POST comments API |
| `docs/features/market-council/comments-summary.md` | This document |

---

## Modified Files

| File | Changes |
|------|---------|
| `backend/routes/api.php` | Added GET/POST comments routes |
| `backend/app/Http/Controllers/MarketCouncilController.php` | Override comments_count with approved count in showArticle |
| `backend/app/Http/Controllers/Admin/MarketCouncilCommentsController.php` | Maintain comments_count when status changes (update/destroy) |
| `frontend/app/market-council/[slug]/page.tsx` | Comments section: list, form, empty state, login CTA |

---

## Backend Public Comments Implementation

### Endpoints

| Method | Path | Auth | Behavior |
|--------|------|------|----------|
| GET | `/api/market-council/articles/{id}/comments` | Public | Returns approved, top-level comments only. Oldest first. Safe fields: id, content, created_at, user_name. |
| POST | `/api/market-council/articles/{id}/comments` | Required | Creates comment with status=pending. Body: `{ content }` (min 3, max 2000 chars). |

### GET Response Shape

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "content": "...",
      "created_at": "2026-03-08T12:00:00.000000Z",
      "user_name": "أحمد محمد"
    }
  ]
}
```

### POST Response (Success)

```json
{
  "success": true,
  "message": "تم استلام تعليقك وسيظهر بعد المراجعة",
  "data": { "id": 123 }
}
```

### Moderation Behavior

- **New comments**: Always created with `status = 'pending'`.
- **Public visibility**: Only comments with `status = 'approved'` are returned by GET.
- **Admin**: Uses existing admin panel to approve/hide comments. Status changes (update) and delete now maintain `comments_count` on the article.

### Comments Count Handling

- **Stored column**: `market_articles.comments_count` holds the count of approved comments.
- **When it changes**:
  - **Create (POST)**: New comment is pending → `comments_count` is **not** incremented.
  - **Admin approve**: Status changes to `approved` → `comments_count` is incremented.
  - **Admin hide/pending**: Status changes from `approved` to something else → `comments_count` is decremented (with `where comments_count > 0` guard).
  - **Admin delete**: If the deleted comment was approved → `comments_count` is decremented.
- **Article API override**: In `showArticle`, `comments_count` is overwritten with the live count of approved comments so the article detail always shows an accurate value even if the stored value has drifted.

---

## Frontend Comments UI

### Placement

Comments section is rendered below the CTA, inside the article body column.

### Elements

| Element | Arabic label / behavior |
|---------|-------------------------|
| Section title | التعليقات (with count when > 0) |
| Empty state | لا توجد تعليقات بعد |
| Form label | أضف تعليقك |
| Textarea placeholder | اكتب تعليقك هنا |
| Submit button | إرسال التعليق |
| Guest CTA | سجّل الدخول لإضافة تعليق + تسجيل الدخول button |
| Post-submit message | تم استلام تعليقك وسيظهر بعد المراجعة |

### Behavior

- **Guests**: See read-only list of comments and a login CTA. Clicking "تسجيل الدخول" opens the auth modal.
- **Authenticated**: See list plus textarea and submit button. After submit, moderation message is shown; textarea is cleared.
- **Validation**: Submit disabled until content length ≥ 3 characters; max 2000 characters.
- **Display**: Each comment shows user display name, date (ar-SA locale), and content.
- **No replies**: Only top-level comments; no threading UI.

---

## Assumptions

1. User display name is built from `first_name` + `last_name`; empty falls back to "مستخدم".
2. `market_comments` schema and admin moderation flow are reused as-is; only count maintenance and public endpoints are added.
3. Auth modal is available globally for the guest login CTA.
4. `parent_id` exists but is not used in public UI; GET filters `parent_id = null` for top-level only.
5. Migration default for `status` is `'approved'`; we override it to `'pending'` on create.

---

## Risks / Manual Review Points

1. **Existing data**: If there were comments created with default `approved` before this change, their count may already be in `comments_count`. The admin update logic assumes status transitions; a one-time sync script may be needed if historical data is inconsistent.
2. **Race conditions**: Admin approval/hide updates and `comments_count` changes are not in a single transaction. Consider wrapping in `DB::transaction` for consistency.
3. **Rate limiting**: No throttling on POST comments; consider adding if needed.
4. **XSS**: Comment content is rendered with `whitespace-pre-wrap`; ensure backend validation and frontend rendering do not allow HTML/script injection. Current implementation uses plain text; no `dangerouslySetInnerHTML` for comments.
