# Storage Permissions Removal Plugin

## Problem

Even though we've removed all `expo-image-picker` and `expo-media-library` permission requests from code, these packages' Expo config plugins **automatically add** the following permissions to `AndroidManifest.xml`:

- `android.permission.READ_EXTERNAL_STORAGE`
- `android.permission.READ_MEDIA_IMAGES`
- `android.permission.READ_MEDIA_VIDEO`
- `android.permission.WRITE_EXTERNAL_STORAGE`
- `android.permission.READ_MEDIA_AUDIO`
- `android.permission.READ_MEDIA_VISUAL_USER_SELECTED`

These permissions are **forbidden** by Google Play Store for apps that use native photo pickers.

## Solution

We've created a custom Expo config plugin (`plugins/withRemoveStoragePermissions.js`) that:

1. Runs **after** all other plugins (placed last in `app.json` plugins array)
2. Removes all forbidden storage permissions from `AndroidManifest.xml`
3. Logs which permissions were removed for debugging

## How It Works

The plugin uses Expo's `withAndroidManifest` API to:
- Parse the generated `AndroidManifest.xml`
- Filter out all `uses-permission` elements with forbidden permission names
- Return the modified manifest

## Installation

The plugin is already configured in `app.json`:

```json
{
  "expo": {
    "plugins": [
      "expo-notifications",
      "expo-asset",
      "expo-font",
      "expo-secure-store",
      "expo-web-browser",
      "expo-localization",
      "./plugins/withRemoveStoragePermissions.js"  // ← Must be LAST
    ]
  }
}
```

**IMPORTANT**: The plugin **must be last** in the plugins array to ensure it runs after all other plugins that might add permissions.

## Verification

After building, verify permissions are removed:

```bash
# Extract and check manifest
java -jar bundletool-all-1.18.3.jar dump manifest \
  --bundle app-release.aab \
  --output manifest.txt

# Check for forbidden permissions
grep -i "READ_EXTERNAL_STORAGE\|READ_MEDIA\|WRITE_EXTERNAL_STORAGE" manifest.txt
```

If the plugin is working, you should see **no results** (permissions removed).

## Troubleshooting

### Permissions Still Present

1. **Check plugin order**: Ensure `./plugins/withRemoveStoragePermissions.js` is **last** in plugins array
2. **Check plugin file**: Verify `plugins/withRemoveStoragePermissions.js` exists and is valid JavaScript
3. **Check build logs**: Look for `[withRemoveStoragePermissions]` log messages during build
4. **Clear build cache**: Try `eas build --platform android --clear-cache`

### Plugin Not Running

1. **Check Expo version**: Ensure you're using Expo SDK 54+ (includes `@expo/config-plugins`)
2. **Check file path**: Plugin path in `app.json` must be relative to project root
3. **Check syntax**: Plugin must export a function that returns a config object

### Build Errors

If you see errors about `@expo/config-plugins`:
- It's bundled with Expo SDK 54+, no separate installation needed
- If issues persist, try: `npm install --save-dev @expo/config-plugins`

## Alternative Solutions

If the plugin doesn't work, you can:

1. **Remove packages entirely** (if not needed):
   ```bash
   npm uninstall expo-image-picker expo-media-library
   ```
   Then remove all imports and usage.

2. **Use app.json android.permissions** (may not work if plugins override):
   ```json
   {
     "android": {
       "permissions": []
     }
   }
   ```

3. **Eject from Expo** (last resort):
   Manually edit `android/app/src/main/AndroidManifest.xml` after each build.

## Current Status

✅ Plugin created and configured  
✅ Plugin placed last in plugins array  
⏳ **Next step**: Rebuild and verify permissions are removed

## Next Steps

1. **Rebuild the app**:
   ```bash
   eas build --platform android --profile production
   ```

2. **Verify permissions removed**:
   ```bash
   java -jar bundletool-all-1.18.3.jar dump manifest \
     --bundle app-release.aab \
     --output manifest.txt
   grep -i "READ_EXTERNAL_STORAGE\|READ_MEDIA\|WRITE_EXTERNAL_STORAGE" manifest.txt
   ```

3. **If successful**: Submit to Google Play Store
4. **If still present**: Check build logs and plugin execution
