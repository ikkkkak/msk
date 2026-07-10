# PropertySaleList - Production Implementation Guide

## Overview

This is a **production-grade infinite-scroll property list component** for React Native/Expo using TanStack Query (React Query v5), FlashList, and Reanimated animations.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PropertySaleList.tsx                      │
│                     (Main Component)                         │
└────────────────────────────┬────────────────────────────────┘
                             │
                ┌────────────┴───────────┐
                │                       │
    ┌───────────▼────────────┐  ┌──────▼────────────┐
    │ usePropertiesInfinite  │  │ FlashList (UI)    │
    │   (Custom Hook)        │  │                   │
    └───────────┬────────────┘  │ • 60fps scrolling │
                │               │ • Virtual ize     │
    ┌───────────▼────────────┐  │ • Auto-pagination│
    │ useInfiniteQuery       │  │ • Pull-to-refresh│
    │   (TanStack Query)      │  └───────────────────┘
    │                         │
    │ • Page-based pagination │
    │ • Cache management      │  ┌──────────────────┐
    │ • Background refetch    │  │ Animations       │
    │ • Error handling        │  │                  │
    │ • Retry logic           │  │ • FadeInDown     │
    └───────────┬─────────────┘  │ • LinearTransition
                │               └──────────────────┘
    ┌───────────▼────────────┐
    │   Backend API          │
    │ /property-sales/public │
    │  ?page=1&limit=20      │
    └────────────────────────┘
```

## Installation

All dependencies are already installed:

```bash
# Package.json includes:
"@tanstack/react-query": "^5.90.16"
"@shopify/flash-list": "2.0.2"
"react-native-reanimated": "~4.1.1"
"moti": "^0.30.0"
"@react-native-async-storage/async-storage": "^2.2.0"
```

## File Structure

```
apartmentsclone/
├── hooks/
│   └── usePropertiesInfinite.ts          ← Custom infinite query hook
├── screens/
│   ├── components/
│   │   ├── PropertySaleList.tsx           ← Main list component
│   │   └── PropertySaleList.test.tsx      ← Unit tests
│   └── SearchScreen.tsx                   ← Usage example
└── components/
    └── ZillowStylePropertyCard.tsx        ← Item card component
```

## Core Components

### 1. `usePropertiesInfinite` Hook

**Purpose**: Encapsulates all fetch logic and state management

```typescript
const {
  data, // { pages: [...] }
  fetchNextPage, // () => void
  refetch, // () => void
  hasNextPage, // boolean
  isFetchingNextPage, // boolean
  isLoading, // boolean (initial)
  isPending, // boolean (initial or refetching)
  isError, // boolean
  error, // Error | null
  isFetching // boolean (any fetching)
} = usePropertiesInfinite({
  fetchUrl: "/property-sales/public",
  limit: 20,
  enabled: true
});
```

**Key Features**:

- **Page-based pagination**: Uses `?page=1&limit=20` query params
- **Automatic retry**: Built-in exponential backoff
- **Background refetch**: 5-minute stale-time + auto-refetch on reconnect
- **Deduplication**: Prevents duplicate in-flight requests
- **Offline support**: Via AsyncStorage persistence (when configured)

### 2. `PropertySaleList` Component

**Purpose**: Renders infinite-scroll list with animations

```tsx
<PropertySaleList
  fetchUrl="/property-sales/public"
  limit={20}
  numColumns={1}
  onPress={(id) => navigation.push("PropertyDetail", { id })}
  onCall={(phone) => callPhoneNumber(phone)}
  onEmail={(website) => openURL(website)}
  onFavorite={(id) => toggleFavorite(id)}
  favorites={[1, 2, 3]}
  emptyMessage="No properties available right now."
  skeletonCount={4}
/>
```

**Props**:

| Prop            | Type     | Default                  | Description             |
| --------------- | -------- | ------------------------ | ----------------------- |
| `fetchUrl`      | string   | `/property-sales/public` | API endpoint            |
| `limit`         | number   | `20`                     | Items per page          |
| `numColumns`    | number   | `1`                      | Grid columns (1 or 2)   |
| `onPress`       | function | -                        | Item tap callback       |
| `onCall`        | function | -                        | Call button callback    |
| `onEmail`       | function | -                        | Email button callback   |
| `onFavorite`    | function | -                        | Heart button callback   |
| `favorites`     | array    | `[]`                     | Array of favorite IDs   |
| `emptyMessage`  | string   | Auto                     | Custom empty state text |
| `skeletonCount` | number   | `4`                      | Loading skeleton count  |

**States**:

1. **Loading** → Shows animated skeleton loaders
2. **Data** → Renders items with FadeInDown animation
3. **Pagination** → Footer loading indicator on scroll-to-end
4. **Error** → Error message + retry button
5. **Empty** → Emoji + message

## Usage Examples

### Basic Usage

```tsx
import PropertySaleList from "../../screens/components/PropertySaleList";

export function SearchScreen() {
  return (
    <PropertySaleList
      fetchUrl="/property-sales/public"
      onPress={(id) => navigation.push("PropertyDetail", { id })}
    />
  );
}
```

### Advanced Usage with Filters

```tsx
const [filters, setFilters] = useState({ city: "Nouakchott", minPrice: 0 });

function PropertyListWithFilters() {
  // Build URL with query params
  const fetchUrl = `/property-sales/public?city=${filters.city}&minPrice=${filters.minPrice}`;

  return (
    <PropertySaleList
      fetchUrl={fetchUrl}
      limit={30}
      numColumns={2}
      onPress={(id) => handlePropertyTap(id)}
      favorites={likedProperties}
    />
  );
}
```

### Grid Layout

```tsx
<PropertySaleList
  fetchUrl="/property-sales/public"
  numColumns={2} // 2-column grid
  limit={40} // More items for grid
/>
```

## API Response Format

**Endpoint**: `/property-sales/public?page=1&limit=20`

**Expected Response**:

```json
{
  "data": [
    {
      "id": 1,
      "title": "Beautiful Villa",
      "listing_price": 50000,
      "images": ["https://..."],
      "bedrooms": 3,
      "bathrooms": 2,
      "city": "Nouakchott",
      "address": "Street Name",
      "organization": {
        "name": "Real Estate Co",
        "banner_image": "https://...",
        "phone": "+222xxxxxxxx",
        "website": "https://..."
      },
      "videos": ["https://..."],
      ...
    },
    ...
  ],
  "page": 1,
  "limit": 20,
  "total": 150,
  "hasMore": true,
  "meta": { "page": 1, "limit": 20, "total": 150 }
}
```

**Accepted Response Formats**:

- `{ data: [...] }`
- `{ items: [...] }`
- `{ properties: [...] }`
- Direct array: `[...]`

## Pagination Logic

### How Infinite Scroll Works

1. **Initial Load** (page = 1)
   - Fetch first 20 items
   - `hasMore: true` → More pages available

2. **User Scrolls Down** (80% threshold)
   - `onEndReached` triggered
   - `fetchNextPage()` called
   - Fetch page 2 (items 21-40)

3. **Stack Pages**
   - Page 1 items + Page 2 items + Page 3 items...
   - Single flat array displayed

4. **Stop at End**
   - `hasMore: false` → No more pages
   - `fetchNextPage()` not called

### Throttling

```typescript
// Prevents duplicate fetch on fast scroll
if (hasNextPage && !isFetchingNextPage && !isLoading) {
  fetchNextPage();
}
```

## Animations

### 1. Skeleton Loaders

```tsx
// Staggered fade-in
<Animated.View entering={FadeInDown.delay(i * 50)}>
  <ZillowStylePropertyCardSkeleton delay={i * 100} />
</Animated.View>
```

**Effect**: Each skeleton fades down with 50ms stagger

### 2. Item Appearance

```tsx
// Fade + slide on item load
<Animated.View entering={FadeInDown.delay(index * 30)}>
  <ZillowStylePropertyCard {...props} />
</Animated.View>
```

**Effect**: Smooth fade-in with 30ms cascade

### 3. List Layout

```tsx
// Smooth item transitions (insert/delete/reorder)
<FlashList
  itemLayoutAnimation={LinearTransition}
  ...
/>
```

**Effect**: Items smoothly animate to new positions

## Performance Optimizations

### 1. Virtual Scrolling (FlashList)

```tsx
// Only renders visible items + buffer
<FlashList
  estimatedItemSize={300} // Estimated height for efficiency
  drawDistance={600} // Render items 600px beyond viewport
  scrollEventThrottle={16} // 60fps scroll smoothness
/>
```

**Benefit**:

- Handles 1000+ items smoothly
- 5-10x faster than FlatList
- Android/iOS optimized

### 2. Memoization

```tsx
// Prevent unnecessary re-renders
const renderItem = useMemo(() => makeRenderItem(...), [deps]);
const allProperties = useMemo(() => data.pages.flatMap(...), [data]);
```

### 3. Cache Strategy

```typescript
{
  staleTime: 1000 * 60 * 5,     // 5 min (don't refetch immediately)
  gcTime: 1000 * 60 * 10,        // 10 min (keep in memory)
  refetchOnWindowFocus: "stale", // Refetch when app focused (if stale)
  refetchOnReconnect: "stale",   // Refetch when back online (if stale)
}
```

## Error Handling

### Network Error

```
┌─────────────────────────────┐
│   "Something went wrong"    │
│  "Network error: 500"       │
│      [Try Again] button     │
└─────────────────────────────┘
```

### Retry Logic

- Built-in exponential backoff (1s, 2s, 4s...)
- User can manually retry via button
- Auto-retry on network reconnect

## Pull-to-Refresh

```tsx
<RefreshControl
  refreshing={isFetching && !isFetchingNextPage}
  onRefresh={handleRefresh}
  tintColor="#0F172A"
/>
```

**Behavior**:

- Drag down to refresh
- Refetches from page 1
- Combines all pages (old + new)
- Shows loading spinner

## Testing

Run tests:

```bash
npm test -- PropertySaleList.test.tsx
```

**Test Coverage**:

✅ Skeleton loading state  
✅ Data display after fetch  
✅ Infinite scroll pagination  
✅ Pull-to-refresh  
✅ Error & retry  
✅ Empty state  
✅ Multi-page flattening  
✅ Duplicate fetch prevention

**Example Test**:

```typescript
it("calls fetchNextPage when reaching end of list", async () => {
  const mockFetchNextPage = jest.fn();

  (usePropertiesInfinite as jest.Mock).mockReturnValue({
    hasNextPage: true,
    isFetchingNextPage: false,
    fetchNextPage: mockFetchNextPage,
    // ... other props
  });

  const { getByTestId } = render(<PropertySaleList />);

  fireEvent.scroll(getByTestId("flash-list"), { ... });

  await waitFor(() => {
    expect(mockFetchNextPage).toHaveBeenCalled();
  });
});
```

## Offline Support (Optional)

To enable offline caching:

```tsx
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "REACT_QUERY_OFFLINE_CACHE"
});

<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }}
>
  <App />
</PersistQueryClientProvider>;
```

Now data persists across app restarts and works offline!

## Debugging

### Enable Console Logs

```typescript
// In usePropertiesInfinite.ts
console.log(`📡 Fetching page ${pageParam}...`);
console.log(`✅ Page ${pageParam} loaded:`, { itemsCount, hasMore });
console.log("🔄 Fetching next page...");
```

### Check Network Tab

1. Open React Native Debugger
2. Check "Network" tab
3. Look for requests to `/property-sales/public?page=X&limit=Y`

### Monitor Query State

```tsx
// Add to PropertySaleList for debugging
console.log({
  dataPages: data?.pages.length,
  totalItems: allProperties.length,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  isPending,
  isError
});
```

## Common Issues

### "Infinite loading" / Skeleton never stops

**Cause**: API returns `hasMore: true` forever  
**Fix**: Ensure API sends `hasMore: false` on last page

### "Duplicate items" in list

**Cause**: Pagination param wrong (e.g., `cursor` instead of `page`)  
**Fix**: Check API format matches `getNextPageParam`

### "Slow scroll" on large lists

**Cause**: Not using FlashList or wrong props  
**Fix**: Use `estimatedItemSize`, `drawDistance`, `scrollEventThrottle`

### "Memory leak" warnings

**Cause**: Component unmounts during fetch  
**Fix**: Query cleanup automatic; ignore if in development

## Future Enhancements

- [ ] Bidirectional pagination (scroll up for older properties)
- [ ] Search/filter alongside infinite scroll
- [ ] Favorites sync across pages
- [ ] Analytics (scroll depth, time on page)
- [ ] Image lazy loading with blurhash
- [ ] Gesture-based interactions (swipe, pinch)

## References

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [FlashList Docs](https://shopify.github.io/flash-list/)
- [Reanimated Docs](https://docs.swmansion.com/react-native-reanimated/)
- [Moti Animations](https://moti.fyi/)
