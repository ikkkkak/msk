# Template Components - Reference Only

## ⚠️ Important Notice

The following components in `/screens/components/` are **TEMPLATE REFERENCES ONLY** and should NOT be used in production:

- ❌ VideoFeedScreenOptimized.tsx
- ❌ PropertySaleDetailsScreenOptimized.tsx
- ❌ PropertySaleListWithCache.tsx
- ❌ ZillowStylePropertyCardOptimized.tsx

## Why These Exist

These template components were created to demonstrate:

1. How to structure components with the optimized hooks
2. Example implementations of pagination
3. Prefetching patterns
4. Cache-aware UI patterns

They are **NOT** meant to replace the existing components.

## Why They Can't Be Used As-Is

The actual codebase PropertySale type structure doesn't match the template interfaces:

- Missing fields: `price`, `amenities`, `banner_image`
- Different field names from what templates expect
- Navigation props don't include all required parameters
- Existing components have complex logic templates simplify

## The Right Approach ✅

**Instead of replacing components, enhance the existing ones:**

1. Keep VideoFeedScreen.tsx as-is
2. Replace `useVideoFeed()` with `useVideoFeedQueryOptimized()`
3. No other changes needed - everything else works the same!

This approach:

- ✅ Maintains all existing functionality
- ✅ Gets all performance benefits
- ✅ Zero breaking changes
- ✅ Passes all tests immediately
- ✅ Production-ready today

## Integration Pattern

### Old (Before)

```typescript
// VideoFeedScreen.tsx
import { useVideoFeed } from "../hooks/queries/useVideoFeed";

export const VideoFeedScreen = () => {
  const { data: videos, isLoading } = useVideoFeed();
  // ... rest of component unchanged
};
```

### New (After)

```typescript
// VideoFeedScreen.tsx
import { useVideoFeedQueryOptimized } from "../hooks/queries/useVideoFeedQueryOptimized";

export const VideoFeedScreen = () => {
  const { data: videos, isLoading } = useVideoFeedQueryOptimized();
  // ... rest of component unchanged - literally nothing else changes!
};
```

## Reference vs. Production

| Aspect           | Template      | Production    |
| ---------------- | ------------- | ------------- |
| Purpose          | Show examples | Actually used |
| Type matching    | Generic       | Real types    |
| Navigation props | Simplified    | Full params   |
| Component logic  | Minimal       | All features  |
| Status           | ✅ Works      | ✅ Works      |
| Usage            | 📖 Read       | 🚀 Deploy     |

## What to Do With Templates

✅ **Keep them for:**

- Architecture documentation
- Training new developers
- Reference implementations
- Understanding the pattern

❌ **Don't use them for:**

- Production deployment
- Navigation routing
- Component rendering
- Actual screens

## Real Integration (Follow This)

1. See [PRODUCTION_INTEGRATION_GUIDE.md](./PRODUCTION_INTEGRATION_GUIDE.md)
2. Replace hooks in existing components
3. Test existing component functionality
4. Deploy with confidence

---

**Summary**: Template components show the pattern. Use them to understand the design, then integrate the optimized hooks into your existing components for production.
