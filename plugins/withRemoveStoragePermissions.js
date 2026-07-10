/**
 * Expo Config Plugin to Remove Storage Permissions
 * 
 * This plugin removes forbidden storage permissions from AndroidManifest.xml
 * that are automatically added by expo-image-picker and expo-media-library.
 * 
 * IMPORTANT: This plugin must run LAST (after all other plugins) to ensure
 * it removes permissions added by other plugins.
 */

// @expo/config-plugins is bundled with expo, so we can require it
let withAndroidManifest;
try {
  withAndroidManifest = require('@expo/config-plugins').withAndroidManifest;
} catch (e) {
  // Fallback: expo package includes config-plugins
  withAndroidManifest = require('expo/config-plugins').withAndroidManifest;
}

const FORBIDDEN_PERMISSIONS = [
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.READ_MEDIA_AUDIO',
  'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
];

const withRemoveStoragePermissions = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (!manifest) {
      console.warn('[withRemoveStoragePermissions] No manifest found');
      return config;
    }

    let removedCount = 0;

    // Remove forbidden permissions from uses-permission elements
    if (manifest['uses-permission']) {
      const originalLength = manifest['uses-permission'].length;
      manifest['uses-permission'] = manifest['uses-permission'].filter(
        (permission) => {
          const permissionName = permission.$?.['android:name'];
          if (!permissionName) return true;
          
          const shouldKeep = !FORBIDDEN_PERMISSIONS.includes(permissionName);
          
          if (!shouldKeep) {
            removedCount++;
            console.log(`[withRemoveStoragePermissions] Removed permission: ${permissionName}`);
          }
          
          return shouldKeep;
        }
      );
      
      if (removedCount > 0) {
        console.log(`[withRemoveStoragePermissions] Removed ${removedCount} forbidden permission(s)`);
      }
    }

    // Also check application level if present (though permissions are usually at root)
    if (manifest.application && Array.isArray(manifest.application) && manifest.application[0]) {
      const application = manifest.application[0];
      
      if (application['uses-permission']) {
        const appOriginalLength = application['uses-permission'].length;
        application['uses-permission'] = application['uses-permission'].filter(
          (permission) => {
            const permissionName = permission.$?.['android:name'];
            if (!permissionName) return true;
            return !FORBIDDEN_PERMISSIONS.includes(permissionName);
          }
        );
        
        const appRemoved = appOriginalLength - (application['uses-permission']?.length || 0);
        if (appRemoved > 0) {
          removedCount += appRemoved;
          console.log(`[withRemoveStoragePermissions] Removed ${appRemoved} permission(s) from application level`);
        }
      }
    }

    if (removedCount === 0) {
      console.log('[withRemoveStoragePermissions] No forbidden permissions found to remove');
    }

    return config;
  });
};

module.exports = withRemoveStoragePermissions;
