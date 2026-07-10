# Permissions Fix Summary

## ✅ Issues Fixed

### 1. Removed expo-image-picker Permission Requests
- ✅ All `requestMediaLibraryPermissionsAsync()` calls removed
- ✅ All files now use `nativePhotoPicker.ts` utility
- ✅ `CreateLandmarkScreen.tsx` - Fixed remaining ImagePicker import

### 2. Disabled expo-media-library Usage
**Files Modified:**
- ✅ `components/AddStoryModal.tsx`
  - Disabled gallery preview feature (MediaLibrary.getAssetsAsync)
  - Disabled MediaLibrary.getAssetInfoAsync for ph:// URIs
  - Gallery now uses native picker only (no permissions needed)
  
- ✅ `screens/VideoFeedScreen.tsx`
  - Disabled "Save to Gallery" feature (MediaLibrary.createAssetAsync)
  - Users can still download videos to app cache, but not to device gallery
  - This avoids requiring storage permissions

### 3. Updated app.json Configuration
```json
{
  "android": {
    "permissions": [],
    "blockedPermissions": [
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_MEDIA_VIDEO",
      "android.permission.WRITE_EXTERNAL_STORAGE"
    ]
  }
}
```

## ⚠️ Important Notes

### expo-media-library Still in package.json
The package is still listed in `package.json` because:
- It may be a dependency of other packages
- Removing it might break other functionality
- **However**, we've disabled all usage in code

### expo-image-picker Still in package.json
The package is still listed because:
- It's used by `nativePhotoPicker.ts` (our wrapper)
- The wrapper uses it WITHOUT requesting permissions
- Native picker mode doesn't require permissions

## 🔍 Verification Steps

1. **Check for remaining permission requests:**
   ```bash
   grep -r "requestMediaLibraryPermissionsAsync" apartmentsclone/
   grep -r "MediaLibrary\." apartmentsclone/
   ```

2. **Build and verify:**
   ```bash
   eas build --platform android --profile production
   ```

3. **Check AAB permissions:**
   ```bash
   bundletool dump manifest --bundle=app-release.aab | grep permission
   ```

## 📋 Features Disabled

### AddStoryModal
- ❌ Gallery preview grid (was using MediaLibrary.getAssetsAsync)
- ✅ Native photo picker still works (no permissions)
- ✅ Camera still works (requires camera permission, which is OK)

### VideoFeedScreen
- ❌ "Save to Gallery" button (was using MediaLibrary.createAssetAsync)
- ✅ Video playback still works
- ✅ Share functionality still works

## 🎯 Expected Result

After rebuilding, the AAB should:
- ✅ NOT contain `READ_EXTERNAL_STORAGE`
- ✅ NOT contain `READ_MEDIA_IMAGES`
- ✅ NOT contain `READ_MEDIA_VIDEO`
- ✅ NOT contain `WRITE_EXTERNAL_STORAGE`
- ✅ Pass Google Play Store review

## 🚀 Next Steps

1. **Rebuild the app:**
   ```bash
   eas build --platform android --profile production
   ```

2. **Verify permissions are removed:**
   Use bundletool to check the manifest

3. **Submit to Google Play:**
   The build should now be accepted

## 📝 Alternative Solutions (if needed)

If `blockedPermissions` doesn't work in app.json, you may need to:

1. **Remove expo-media-library from package.json** (if safe):
   ```bash
   npm uninstall expo-media-library
   ```

2. **Use expo config plugin to remove permissions:**
   Create a custom config plugin that removes these permissions from AndroidManifest.xml

3. **Eject from Expo** (last resort):
   Manually edit AndroidManifest.xml to remove permissions
