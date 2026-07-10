# React Native Maps Analysis - MapTiler vs Google Maps Issue

## 🔴 Problem Summary

**You are using MapTiler tiles, BUT `react-native-maps` is still installed and being used.**

This means:
- ✅ MapTiler tiles are displayed (via `UrlTile`)
- ❌ **Google Maps native SDK is still loaded** (via `react-native-maps`)
- ❌ **Android requires Google Maps API key** → **CRASHES**

## 📊 Current Usage Analysis

### Files Using `react-native-maps` (26 files total):

#### Critical Files (User Mentioned):
1. **`screens/LandmarkGuidanceScreen.tsx`**
   - Uses: `MapView`, `Marker`, `Polyline`, `Polygon`
   - Has: `PROVIDER_GOOGLE` imported (but commented out)
   - Status: ⚠️ Still uses react-native-maps native module

2. **`screens/SearchScreen.tsx`**
   - Uses: `MapView`, `Polygon`, `PROVIDER_GOOGLE`
   - Status: ⚠️ Still uses react-native-maps native module

3. **`screens/PropertySaleDetailsScreenNew.tsx`**
   - Uses: `MapView`, `Marker`
   - Status: ⚠️ Still uses react-native-maps native module

4. **`screens/PropertySaleDetailsScreen.tsx`**
   - Uses: `MapView`, `Marker`, `UrlTile`, `PROVIDER_GOOGLE`
   - Has: MapTiler tiles via `UrlTile`
   - Status: ⚠️ Still uses react-native-maps native module (even with MapTiler tiles)

#### Shared Components:
5. **`components/BaseMap.tsx`** - Uses `PROVIDER_GOOGLE`
6. **`components/Map.tsx`** - Wrapper
7. **`components/MapLandmarks.tsx`** - Wrapper
8. **`components/MapPropertySale.tsx`** - Wrapper
9. **`components/MapAdapter.tsx`** - Adapter
10. **`components/MapWrapper.tsx`** - Wrapper

#### Other Screens:
11. `screens/CreateLandmarkScreen.tsx`
12. `screens/EditPropertySaleScreen.tsx`
13. `screens/CreatePropertySaleScreen.tsx`
14. `screens/LandmarkDetailsScreen.tsx`
15. `screens/PropertyDetailsScreen.tsx`
16. `screens/EditPropertyStepScreen.tsx`
17. `components/AddPropertySection.tsx`
18. `components/FreehandDrawingMap.tsx`
19. `components/TestMap.tsx`
20. `components/MapMarker.tsx`
21. `components/propertyDetailsSections/LocationSection.tsx`

### Package Status:
- **`package.json`**: `"react-native-maps": "1.20.1"` ✅ INSTALLED
- **`package.json` overrides**: `"react-native-maps": "1.20.1"` ✅ LOCKED

## 🎯 The Core Issue

### What's Happening:
```
App Starts
  ↓
Android loads react-native-maps native module
  ↓
react-native-maps tries to initialize Google Maps SDK
  ↓
Looks for Google Maps API key
  ↓
No key found (or invalid key)
  ↓
💥 CRASH (before any JS code runs)
```

### Why MapTiler Tiles Don't Help:
- `UrlTile` only changes **what tiles are displayed**
- It does **NOT** remove the Google Maps native SDK
- The native module is still loaded and initialized
- Android **requires** Google Maps API key for the SDK

## ✅ Solutions

### Option 1: Remove PROVIDER_GOOGLE (Quick Fix - May Work)

**Try removing `provider={PROVIDER_GOOGLE}` from all MapView components.**

Some users report that without `PROVIDER_GOOGLE`, react-native-maps uses the default provider which may not require Google API key.

**Files to update:**
- `screens/PropertySaleDetailsScreen.tsx` (line 1614)
- `components/BaseMap.tsx` (line 609)
- Remove `PROVIDER_GOOGLE` imports where not needed

**Risk:** May still crash if native module requires Google SDK

### Option 2: Configure Google Maps API Key (Temporary Fix)

Add Google Maps API key to `app.json`:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    }
  }
}
```

**Pros:** Quick fix, app won't crash
**Cons:** Still using Google Maps, requires billing, not what you want

### Option 3: Remove react-native-maps Entirely (Best Long-term)

**Replace with WebView + MapTiler (Leaflet/MapLibre)**

**Steps:**
1. Remove `react-native-maps` from package.json
2. Install WebView-based map solution
3. Replace all MapView components
4. Use MapTiler via WebView

**Pros:** 
- ✅ No Google Maps dependency
- ✅ Pure MapTiler solution
- ✅ No API key needed
- ✅ Works with Expo managed workflow

**Cons:**
- ⚠️ Requires refactoring 26 files
- ⚠️ May lose some native features (gestures, performance)

### Option 4: Use Expo Maps (If Available)

Check if Expo has a maps solution that works with MapTiler without Google Maps dependency.

## 🔍 Verification Commands

### Check if react-native-maps is causing crashes:
```bash
# Check Android logs for Google Maps errors
adb logcat | grep -i "google\|maps\|api.*key"
```

### Check what's actually in the build:
```bash
# After building, check AndroidManifest.xml
bundletool dump manifest --bundle app.aab | grep -i "google\|maps"
```

## 📝 Recommended Action Plan

### Immediate (To Stop Crashes):
1. **Try Option 1 first** - Remove `PROVIDER_GOOGLE` from all MapView components
2. **Test on Android device** - See if crashes stop
3. **If still crashes** - Use Option 2 temporarily (add Google API key)

### Long-term (Proper Solution):
1. **Plan migration to WebView + MapTiler** (Option 3)
2. **Create new WebView-based map component**
3. **Gradually replace MapView usage**
4. **Remove react-native-maps** once all screens migrated

## 🚨 Critical Files to Fix First

These files are directly mentioned and should be prioritized:

1. `screens/LandmarkGuidanceScreen.tsx` - Remove `PROVIDER_GOOGLE` import
2. `screens/SearchScreen.tsx` - Remove `PROVIDER_GOOGLE` usage
3. `screens/PropertySaleDetailsScreenNew.tsx` - Check if needs MapTiler
4. `screens/PropertySaleDetailsScreen.tsx` - Already has MapTiler tiles, but still uses PROVIDER_GOOGLE

## 📚 References

- [react-native-maps Documentation](https://github.com/react-native-maps/react-native-maps)
- [MapTiler Documentation](https://docs.maptiler.com/)
- [Expo Maps (if available)](https://docs.expo.dev/)
