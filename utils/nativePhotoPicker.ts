/**
 * Native Photo Picker Utility
 * 
 * This utility provides a cross-platform photo/video picker that uses native
 * system pickers without requiring any permissions.
 * 
 * Android: Uses Android Photo Picker (available on Android 13+)
 * iOS: Uses iOS Photo Picker (no permissions required)
 * 
 * Why no permissions?
 * - Android Photo Picker (API 33+) uses a system picker that doesn't require
 *   READ_MEDIA_IMAGES or READ_EXTERNAL_STORAGE permissions
 * - iOS Photo Picker uses PHPickerViewController which doesn't require
 *   NSPhotoLibraryUsageDescription permission
 * 
 * The picker only opens when the user explicitly clicks "Upload photo/video"
 * and provides a secure, privacy-friendly way to select media.
 */

import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type MediaType = 'images' | 'videos' | 'all';

export type PickerResult = {
  canceled: boolean;
  assets?: Array<{
    uri: string;
    width?: number;
    height?: number;
    /** expo-image-picker media kind: image | video | livePhoto | pairedVideo */
    type?: string;
    /** Real MIME when provided by the platform (e.g. video/mp4) */
    mimeType?: string;
    fileName?: string;
    fileSize?: number;
    base64?: string;
  }>;
  error?: string;
};

export type PickerState = 'idle' | 'loading' | 'success' | 'error' | 'canceled';

export interface PickerOptions {
  mediaTypes?: MediaType;
  allowsMultipleSelection?: boolean;
  allowsEditing?: boolean;
  /** Crop aspect ratio (iOS enforces; Android shows crop UI when allowsEditing is true). */
  aspect?: [number, number];
  quality?: number;
  base64?: boolean;
  videoMaxDuration?: number;
  /** iOS UIImagePickerControllerQualityType (0=high, 1=medium, 2=low). */
  videoQuality?: ImagePicker.UIImagePickerControllerQualityType;
  /** iOS export preset — use H264_1280x720 for listing uploads (Expo Go compatible). */
  videoExportPreset?: ImagePicker.VideoExportPreset;
}

/**
 * Get the appropriate MediaType for expo-image-picker based on our MediaType enum
 * expo-image-picker v17 uses MediaTypeOptions or string arrays
 */
const getExpoMediaType = (mediaType: MediaType): any => {
  const picker = ImagePicker as any;
  
  // Try MediaTypeOptions enum (expo-image-picker v17)
  if (picker.MediaTypeOptions) {
    switch (mediaType) {
      case 'images':
        return picker.MediaTypeOptions.Images;
      case 'videos':
        return picker.MediaTypeOptions.Videos;
      case 'all':
        return picker.MediaTypeOptions.All;
      default:
        return picker.MediaTypeOptions.Images;
    }
  }
  
  // Fallback to string array format (newer API)
  switch (mediaType) {
    case 'images':
      return ['images'];
    case 'videos':
      return ['videos'];
    case 'all':
      return ['images', 'videos'];
    default:
      return ['images'];
  }
};

/**
 * Native Photo Picker - No Permissions Required
 * 
 * This function uses the native system picker which doesn't require
 * any permissions. It only opens when explicitly called by user action.
 * 
 * @param options - Picker configuration options
 * @returns Promise with picker result
 */
export const pickMediaNative = async (
  options: PickerOptions = {}
): Promise<PickerResult> => {
  const {
    mediaTypes = 'images',
    allowsMultipleSelection = false,
    allowsEditing = false,
    aspect,
    quality = 0.82,
    base64 = false,
    videoMaxDuration,
    videoQuality,
    videoExportPreset,
  } = options;

  const isVideoPick = mediaTypes === "videos" || mediaTypes === "all";

  try {
    // IMPORTANT: We do NOT request permissions here
    // The native picker handles permissions automatically through the system UI
    
    // Get the correct media type for expo-image-picker
    const expoMediaType = getExpoMediaType(mediaTypes);
    
    // Configure picker options
    const pickerOptions: ImagePicker.ImagePickerOptions = {
      mediaTypes: expoMediaType,
      allowsMultipleSelection,
      allowsEditing,
      quality: isVideoPick ? 1 : quality,
      base64,
    };
    if (aspect && aspect.length === 2) {
      pickerOptions.aspect = aspect;
    }

    if (isVideoPick) {
      pickerOptions.videoQuality =
        videoQuality ?? ImagePicker.UIImagePickerControllerQualityType.Low;
      if (Platform.OS === "ios") {
        pickerOptions.videoExportPreset =
          videoExportPreset ?? ImagePicker.VideoExportPreset.H264_640x480;
      }
      (pickerOptions as ImagePicker.ImagePickerOptions).videoMaxDuration =
        videoMaxDuration ?? 90;
    } else if (videoMaxDuration !== undefined) {
      (pickerOptions as ImagePicker.ImagePickerOptions).videoMaxDuration =
        videoMaxDuration;
    }

    console.log('[NativePhotoPicker] Launching picker with options:', {
      mediaTypes: expoMediaType,
      allowsMultipleSelection,
      allowsEditing,
      quality: pickerOptions.quality,
      videoMaxDuration: (pickerOptions as any).videoMaxDuration,
    });

    // Launch the native picker
    // On Android 13+, this uses Android Photo Picker (no permissions)
    // On iOS, this uses PHPickerViewController (no permissions)
    const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    
    console.log('[NativePhotoPicker] Picker result:', {
      canceled: result.canceled,
      assetsCount: result.assets?.length || 0,
    });

    if (result.canceled) {
      return {
        canceled: true,
        assets: undefined,
      };
    }

    if (!result.assets || result.assets.length === 0) {
      return {
        canceled: true,
        assets: undefined,
      };
    }

    // Transform assets to our format
    const assets = result.assets.map((asset) => ({
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: asset.type ?? undefined,
      mimeType: asset.mimeType ?? undefined,
      fileName: asset.fileName ?? undefined,
      fileSize: asset.fileSize,
      base64: asset.base64,
    }));

    return {
      canceled: false,
      assets,
    };
  } catch (error: any) {
    console.error('[NativePhotoPicker] Error:', error);
    return {
      canceled: false,
      assets: undefined,
      error: error.message || 'Failed to pick media',
    };
  }
};

/**
 * Pick a single image (convenience function)
 */
export const pickImageNative = async (
  options: Omit<PickerOptions, 'mediaTypes'> = {}
): Promise<PickerResult> => {
  return pickMediaNative({
    ...options,
    mediaTypes: 'images',
  });
};

/**
 * Pick a single video (convenience function)
 */
export const pickVideoNative = async (
  options: Omit<PickerOptions, 'mediaTypes'> = {}
): Promise<PickerResult> => {
  return pickMediaNative({
    videoMaxDuration: 90,
    videoQuality: ImagePicker.UIImagePickerControllerQualityType.Low,
    videoExportPreset: ImagePicker.VideoExportPreset.H264_640x480,
    ...options,
    mediaTypes: 'videos',
  });
};

/**
 * Pick multiple images (convenience function)
 */
export const pickMultipleImagesNative = async (
  options: Omit<PickerOptions, 'mediaTypes' | 'allowsMultipleSelection'> = {}
): Promise<PickerResult> => {
  return pickMediaNative({
    ...options,
    mediaTypes: 'images',
    allowsMultipleSelection: true,
  });
};

/**
 * Check if native photo picker is available on this platform
 */
export const isNativePickerAvailable = (): boolean => {
  // Native pickers are available on:
  // - Android 13+ (API 33+) for Android Photo Picker
  // - iOS 14+ for PHPickerViewController
  // expo-image-picker handles the platform detection automatically
  return Platform.OS === 'android' || Platform.OS === 'ios';
};

/**
 * Get platform-specific information about the picker
 */
export const getPickerInfo = () => {
  return {
    platform: Platform.OS,
    requiresPermissions: false,
    pickerType:
      Platform.OS === 'android'
        ? 'Android Photo Picker (System)'
        : 'iOS PHPickerViewController (System)',
    description:
      Platform.OS === 'android'
        ? 'Uses Android Photo Picker - no permissions required on Android 13+'
        : 'Uses iOS PHPickerViewController - no permissions required',
  };
};
