# Property Sales Public API – Pagination Contract

This document defines the **exact** API contract between the frontend (Search Screen / Property Sale List) and the backend for infinite scroll.

> **Backend implementation**: `apartmentscloneserver/routes/property_sales.go` – `GetPublishedProperties`  
> Default `limit` is 10. Response includes `data`, `properties`, `hasMore`, `nextCursor`.

## Endpoint

```
GET /api/property-sales/public
```

## Request (Query Params)

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `lang` | string | ✅ | Language code (e.g. `en`, `fr`, `ar`) |
| `page` | number | ✅ | 1-based page number. First request: `page=1` |
| `limit` | number | ✅ | Items per page. Must be `10` for production. |
| `cursor` | string | ❌ | Optional. Use if backend supports cursor-based pagination. |
| `bedrooms` | number | ❌ | Min bedrooms filter |
| `bathrooms` | number | ❌ | Min bathrooms filter |
| `year_built` | number | ❌ | Min year built |
| `city_id` | number | ❌ | Filter by city ID |
| `zone_id` | number | ❌ | Filter by zone ID |
| `quartier_id` | number | ❌ | Filter by quartier ID |
| `min_area` | number | ❌ | Min area (m²) |
| `max_area` | number | ❌ | Max area (m²) |
| `min_price` | number | ❌ | Min listing price (MRU) |
| `max_price` | number | ❌ | Max listing price (MRU) |

### Example Request

```
GET /api/property-sales/public?lang=en&page=1&limit=10
GET /api/property-sales/public?lang=en&page=2&limit=10&city_id=5
```

## Response (Required Shape)

```json
{
  "data": [...],
  "hasMore": true,
  "nextCursor": "optional_cursor_string"
}
```

### Accepted Array Fields

The frontend accepts any of these as the items array:

- `data`
- `items`
- `properties`
- `results`
- `payload`

### Response Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `data` (or `items`/`properties`) | array | ✅ | Array of property sale objects |
| `hasMore` | boolean | ✅ | `true` if more pages exist, `false` otherwise |
| `nextCursor` | string | ❌ | Opaque cursor for next page (if cursor-based) |

### Example Response (Page 1)

```json
{
  "data": [
    {
      "id": 1,
      "title": "Modern Apartment",
      "listing_price": 2500000,
      "bedrooms": 3,
      "bathrooms": 2,
      "city": "Nouakchott",
      "images": ["https://..."],
      "latitude": 18.0735,
      "longitude": -15.9582
    }
  ],
  "hasMore": true,
  "nextCursor": null
}
```

### Example Response (Last Page)

```json
{
  "data": [...],
  "hasMore": false,
  "nextCursor": null
}
```

## Backend Implementation Requirements

### 1. Pagination Logic

- Use **offset-based**: `OFFSET (page - 1) * limit LIMIT limit`
- Or **cursor-based**: Use `nextCursor` for efficient paging on large datasets
- **Sorting**: `ORDER BY created_at DESC` (or `id DESC`) for deterministic order
- **Index**: Ensure index on `created_at` / `id` to avoid full table scan

### 2. `hasMore` Calculation

```js
// Offset-based
const hasMore = items.length >= limit;

// Or explicit from DB
const totalCount = await getTotalCount();
const hasMore = page * limit < totalCount;
```

### 3. SQL Example (Offset-Based)

```sql
SELECT * FROM property_sales
WHERE status = 'published'
  AND (city_id = $city_id OR $city_id IS NULL)
  AND (listing_price >= $min_price OR $min_price IS NULL)
  -- ... other filters
ORDER BY created_at DESC
LIMIT $limit OFFSET ($page - 1) * $limit
```

### 4. Node/Express Example

```js
// GET /api/property-sales/public
router.get('/property-sales/public', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const offset = (page - 1) * limit;

  const [items, total] = await Promise.all([
    db.query(
      'SELECT * FROM property_sales WHERE ... ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    ),
    db.query('SELECT COUNT(*) as c FROM property_sales WHERE ...')
  ]);

  const hasMore = page * limit < total[0].c;

  res.json({
    data: items,
    hasMore,
    nextCursor: null
  });
});
```

## Frontend → Server Flow

1. **Initial load**: `page=1`, `limit=10` → 10 items, `hasMore: true`
2. **User scrolls to bottom**: frontend calls `fetchNextPage()` → `page=2`, `limit=10`
3. **Server returns** next 10 items, `hasMore: true` or `false`
4. **Frontend appends** new items to the list, shows `ActivityIndicator` while loading

## Notes

- Frontend uses `@tanstack/react-query` `useInfiniteQuery`
- Request includes `AbortSignal` for cancellation
- Never return more than `limit` items per request
- Ensure fast response (< 1s) for good UX
