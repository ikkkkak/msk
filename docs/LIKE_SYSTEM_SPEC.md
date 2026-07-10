# Like / Unlike System – Backend Specification

This document defines the **mandatory** backend contract for the like system. The frontend has been refactored to assume this contract. Data integrity is enforced in the database and exposed via an idempotent API.

---

## 1. Database Rules

### 1.1 Table: `video_likes` (or equivalent per resource)

| Column      | Type         | Constraints |
|------------|--------------|-------------|
| `id`       | BIGINT / UUID| PRIMARY KEY |
| `user_id`  | BIGINT       | NOT NULL, FK → users |
| `video_id` | BIGINT       | NOT NULL, FK → videos (or property_sale_videos / landmarks as applicable) |
| `created_at` | TIMESTAMP  | NOT NULL, DEFAULT NOW() |

**Mandatory constraint:**

```sql
UNIQUE (user_id, video_id)
```

This guarantees:

- A user can like a video **only once**.
- Duplicate likes are **impossible** at the DB level.
- No manual increment/decrement of counters.

### 1.2 Like count is always derived

The like count must **never** be stored as a denormalized counter that is manually incremented/decremented. It must always be computed:

```sql
SELECT COUNT(*) FROM video_likes WHERE video_id = ?
```

Use this (or equivalent) in every response that returns a like count.

---

## 2. API Contract

### 2.1 Like (POST)

**Request:** e.g. `POST /api/videos/:videoId/like` (or property-sale-videos / landmarks equivalent)  
**Auth:** Required (Bearer token).

**Idempotent behavior:**

1. If a like record **already exists** for `(user_id, video_id)`:
   - Do **not** insert again.
   - Return current state (see response below).
2. If no record exists:
   - Insert one row into `video_likes`.
   - Return new state.

**Response (200):**

```json
{
  "likesCount": 12,
  "liked": true
}
```

- `likesCount`: result of `COUNT(*) FROM video_likes WHERE video_id = ?`
- `liked`: `true` for the acting user (they have just liked or already had a like).

Alternative naming supported by frontend: `likeCount` / `isLikedByUser`.

### 2.2 Unlike (POST)

**Request:** e.g. `POST /api/videos/:videoId/unlike`  
**Auth:** Required.

**Idempotent behavior:**

1. `DELETE FROM video_likes WHERE user_id = ? AND video_id = ?`
2. If no row was deleted (already unlike), still return success and current state.
3. Return updated count and `liked: false`.

**Response (200):**

```json
{
  "likesCount": 11,
  "liked": false
}
```

Again, `likesCount` must be derived with `COUNT(*)`, not by decrementing a counter.

---

## 3. Video load / feed response

When returning a video (feed, detail, etc.), each video object must include:

```json
{
  "id": 1,
  "likeCount": 12,
  "isLikedByUser": false
}
```

Or with existing naming:

```json
{
  "ID": 1,
  "likesCount": 12,
  "liked": false
}
```

Rules:

- `likeCount` / `likesCount`: always `COUNT(*)` for that video.
- `isLikedByUser` / `liked`: `true` iff the **authenticated user** has a row in `video_likes` for this video; if unauthenticated, `false`.

The heart icon on the client is driven **only** by `isLikedByUser` / `liked`. The displayed number is **only** the server-provided count. No client-side arithmetic.

---

## 4. Concurrency and safety

- Use a **database transaction** for like/unlike (check existence, insert/delete, then return count).
- Avoid double requests from the client: the frontend **disables the like button** while a request is pending and does not manually adjust the count.
- If your stack supports it, you can use `INSERT ... ON CONFLICT (user_id, video_id) DO NOTHING` (or equivalent) for like, and always run `COUNT(*)` after to return the current count.

---

## 5. Summary

| Rule | Requirement |
|------|-------------|
| Uniqueness | `UNIQUE(user_id, video_id)` on like table |
| Count | Always `COUNT(*)` from like table; no manual +/- |
| Like endpoint | Idempotent: if record exists, return current state; else insert and return |
| Unlike endpoint | Idempotent: delete record, return current count and `liked: false` |
| Video payload | Include `likeCount` and `isLikedByUser` (or `likesCount` / `liked`) on every video |
| Heart UI | Driven only by `isLikedByUser`; count only from server |

Implementing the backend to this spec eliminates duplicate likes, count jumps, and desync between heart state and server.
