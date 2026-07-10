# Native Photo Picker Implementation

## Overview

The Habitat app now uses **native system photo pickers** that do **not require any permissions**. This implementation ensures Google Play Store compliance and provides a better user experience.

## Why No Permissions?

### Android (Android 13+ / API 33+)
- Uses **Android Photo Picker** - a system-level picker that doesn't require `READ_MEDIA_IMAGES` or `READ_EXTERNAL_STORAGE` permissions
- The picker is provided by the Android system and runs in a separate process
- Users select photos/videos through the system UI, and the app only receives the selected media URIs
- **No permissions needed** - the system handles access control

### iOS (iOS 14+)
- Uses **PHPickerViewController** - Apple's modern photo picker that doesn't require `NSPhotoLibraryUsageDescription` permission
- The picker runs in a separate process and only returns selected media
- Users maintain full control over which photos/videos to share
- **No permissions needed** - the system handles access control

## Implementation Details

### Core Utility: `utils/nativePhotoPicker.ts`

This utility provides a cross-platform interface for picking photos and videos:

```typescript
import { pickImageNative, pickVideoNative, pickMediaNative } from '../utils/nativePhotoPicker';

// Pick a single image
const result = await pickImageNative({
  allowsEditing: true,
  base64: true,
  quality: 0.8,
});

// Pick a single video
const result = await pickVideoNative({
  quality: 0.8,
  allowsEditing: true,
});

// Pick multiple media (images/videos)
const result = await pickMediaNative({
  mediaTypes: 'all',
  allowsMultipleSelection: true,
  quality: 0.9,
});
```

### State Management

The picker returns a result with the following states:

- **`canceled: true`** - User canceled the picker
- **`canceled: false`** - User selected media
- **`assets`** - Array of selected media assets
- **`error`** - Error message if something went wrong

### Updated Files

All files that previously used `expo-image-picker` with permission requests have been updated:

1. **Utility Files:**
   - `utils/pickImage.ts` - Updated to use native picker
   - `utils/pickPropertyImage.ts` - Updated to use native picker
   - `utils/nativePhotoPicker.ts` - **NEW** - Core native picker utility

2. **Screen Files:**
   - `screens/CreatePropertySaleScreen.tsx`
   - `screens/EditPropertySaleScreen.tsx`
   - `screens/EditOrganizationScreen.tsx`
   - `screens/CreateOrganizationScreen.tsx`
   - `screens/VideoUploadScreen.tsx`
   - `screens/AdminPromotionalVideosScreen.tsx`
   - `screens/CreateManagerScreen.tsx`
   - `screens/GroupMembersScreen.tsx`
   - `screens/CreateLandmarkScreen.tsx`

3. **Component Files:**
   - `components/AddStoryModal.tsx`
   - `components/experience/PlaceholderSteps.tsx`

## Configuration Changes

### app.json

**Removed:**
- `NSPhotoLibraryUsageDescription` - No longer needed for photo picker (only needed for camera)

**Kept:**
- `NSCameraUsageDescription` - Still needed for camera functionality
- `NSPhotoLibraryAddUsageDescription` - Still needed for saving photos to device

**Android:**
- Added explicit `permissions: []` to ensure no permissions are automatically added

## How It Works

1. **User Action Required**: The picker only opens when the user explicitly clicks "Upload photo/video" or similar buttons
2. **System Picker Opens**: The native system picker opens (Android Photo Picker or iOS PHPickerViewController)
3. **User Selects Media**: User browses and selects photos/videos through the system UI
4. **Media Returned**: The app receives URIs to the selected media (no direct access to the library)
5. **No Permissions**: The entire process happens without requesting any permissions

## Benefits

✅ **Google Play Compliance** - No forbidden permissions  
✅ **Better Privacy** - Users control what they share  
✅ **Better UX** - Native system pickers are familiar to users  
✅ **No Permission Prompts** - Smoother user experience  
✅ **Cross-Platform** - Works on both Android and iOS  

## Testing Checklist

- [ ] Test on Android 13+ device (Android Photo Picker)
- [ ] Test on Android 12 or lower (fallback behavior)
- [ ] Test on iOS 14+ device/simulator (PHPickerViewController)
- [ ] Verify no permission prompts appear
- [ ] Verify photos can be selected and uploaded
- [ ] Verify videos can be selected and uploaded
- [ ] Verify multiple selection works
- [ ] Verify cancel state works correctly
- [ ] Verify error handling works correctly

## Migration Notes

### Before (Old Implementation)
```typescript
// ❌ Required permissions
const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
if (status !== 'granted') {
  alert('Permission required!');
  return;
}

const result = await ImagePicker.launchImageLibraryAsync({...});
```

### After (New Implementation)
```typescript
// ✅ No permissions needed
const result = await pickImageNative({
  allowsEditing: true,
  base64: true,
  quality: 0.8,
});

if (result.canceled || !result.assets) return;
```

## Important Notes

1. **Camera Still Needs Permissions**: If your app uses the camera (not just the picker), you still need `NSCameraUsageDescription` for iOS and camera permissions for Android.

2. **Android 12 and Lower**: On older Android versions, `expo-image-picker` may still request permissions as a fallback. However, the code no longer explicitly requests them, so the picker will handle it gracefully.

3. **expo-image-picker Version**: We're using `expo-image-picker@~17.0.10` which supports native pickers on both platforms.

4. **No Automatic Access**: The picker never automatically accesses the gallery. It only opens when the user explicitly triggers it.

## Troubleshooting

### Issue: Picker not opening
- **Solution**: Ensure you're calling the picker function from a user action (button press, etc.)

### Issue: Permissions still requested
- **Solution**: Check that you're using `pickImageNative` or `pickVideoNative` from `nativePhotoPicker.ts`, not the old `ImagePicker.requestMediaLibraryPermissionsAsync()`

### Issue: Media not loading
- **Solution**: Ensure you're handling the `result.assets` array correctly and checking for `canceled` state

## Future Considerations

- Consider adding support for camera capture (which still requires permissions)
- Monitor expo-image-picker updates for improved native picker support
- Consider adding image compression before upload for better performance
