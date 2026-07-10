# Debug Guide - Images & Videos Not Loading

## Problem

Cards show properties with no images and no videos displayed.

## Root Cause Analysis

### Possible Causes (in order of likelihood):

1. **API returning `null` for images/videos**
   - Backend is not providing image URLs
   - Field names don't match what the component expects

2. **Image extraction failing**
   - API structure different than expected
   - `safeParseArray()` not handling the format

3. **Video URLs not being extracted**
   - Videos field might be in different location
   - Video URL validation failing

## How to Debug

### Step 1: Check Console Logs

Open browser console (F12) and look for these logs:

```
[extractItems] Got from .data, length: 20
[🔍 Page 1] First item ID: 40, Has 0 images, Title: منزل للبيع
[Property 40] Images found: 0, Videos: 0
[PropertySaleList] Received 20 items
  First: ID=40, Title=منزل للبيع
  Images=0, Videos=0
```

**What this tells us:**

- If `Has 0 images` → API returned null/empty for images
- If `Videos: 0` → API returned null/empty for videos

### Step 2: Check Raw API Response

In browser Network tab:

1. Open DevTools (F12)
2. Go to Network tab
3. Filter for "property-sales"
4. Click the request
5. Go to Response tab
6. Look at the first item structure:

```json
{
  "id": 40,
  "title": "منزل للبيع...",
  "images": null,           // ← Check this field
  "images_urls": [...],     // ← Might be here instead
  "photos": [...],          // ← Or here
  "classified_photos": [...], // ← Or here
  "videos": null,           // ← Check this field
  "video_urls": [...],      // ← Or here
  "video": "https://..."    // ← Or here
}
```

### Step 3: Identify Actual Field Names

Write down which fields actually contain images/videos in the API response.

## Fixes Based on What You Find

### If images are in a different field:

Update line 47-52 in `usePublicPropertySalesInfiniteQuery.ts`:

```typescript
// Current (tries these in order):
const images = safeParseArray(
  it.images ??
    it.Images ??
    it.photos ??
    it.media ??
    it.classified_photos ??
    it.picture ??
    it.pictures ??
    it.photo ??
    it.gallery
);

// Add your actual field here ↑
```

### If videos are in a different field:

Update the ZillowStylePropertyCard.tsx around line 5267:

```typescript
// Current:
const videoUrl = useMemo(() => {
  const v =
    property.video_url ||
    property.videoUrl ||
    property.video ||
    (Array.isArray(property.videos) && property.videos.length > 0
      ? property.videos[0]
      : undefined);
  return isValidUrl(v) ? v : undefined;
}, [property.video_url, property.videoUrl, property.video, property.videos]);

// Add checks for your actual fields ↑
```

## Console Output Legend

When you see these logs, here's what they mean:

| Log                  | Meaning                          | Action                               |
| -------------------- | -------------------------------- | ------------------------------------ |
| `Has 0 images`       | API returned no images           | Check API response                   |
| `Has 5 images`       | Images found!                    | Should display (check if URLs valid) |
| `Videos: 0`          | API returned no videos           | Check API response                   |
| `Videos: 1`          | Video found!                     | Should display                       |
| `Images=0, Videos=0` | Data reached component empty     | Check line above                     |
| `Images=5, Videos=1` | Data reached component correctly | Should display                       |

## Step-by-Step Debug Process

1. **Open app, go to Sell tab**
   - Check console for logs

2. **Note the log output**
   - Copy the logs about images/videos

3. **Open browser DevTools Network tab**
   - Find property-sales API call
   - Check the actual response structure

4. **Compare:**
   - What the logs say (e.g., "0 images")
   - What the API response shows (e.g., `"classified_photos": [...]`)

5. **If different field names found:**
   - Tell me the actual field names
   - I'll update the normalization

## Quick Test

To verify images ARE in the response but just not extracted:

1. In DevTools Console, run:

```javascript
// Check what's in the API response
fetch("/property-sales/public?page=1&limit=1")
  .then((r) => r.json())
  .then((d) => {
    const item = d.data?.[0] || d.properties?.[0];
    console.log("Raw item:", item);
    console.log("Images:", item?.images);
    console.log("Photos:", item?.photos);
    console.log("Classified:", item?.classified_photos);
    console.log("Videos:", item?.videos);
  });
```

This shows you EXACTLY what fields the API has.

## Expected Console Output (When Working)

```
[extractItems] Got from .data, length: 20
[🔍 Page 1] First item ID: 40, Has 5 images, Title: منزل للبيع
[Property 40] Images found: 5, Videos: 1
[Property 41] Images found: 3, Videos: 0
[Property 42] Images found: 4, Videos: 2
...
[PropertySaleList] Received 20 items
  First: ID=40, Title=منزل للبيع
  Images=5, Videos=1
```

## Next Steps

1. **Run app, check console**
2. **Share the logs with me**
3. **Or check Network response structure**
4. **Tell me what fields actually contain images/videos**
5. **I'll update the code to extract from correct fields**

---

**Key Point:** The component code (ZillowStylePropertyCard.tsx) is working fine. The issue is just that `property.images` and `property.videos` are empty arrays. Once we ensure these are populated from the API response, everything will display correctly! ✅
