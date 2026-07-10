import { useCallback, useState } from "react";
import { Video } from "react-native-compressor";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";

/**
 * useVideoCompressor - Compress videos on-device before upload
 *
 * Features:
 * - H.264 codec, 720p max dimension, 2 Mbps bitrate
 * - Preserves audio (AAC 128kbps)
 * - Progress tracking
 * - Skip compression for small files (<10MB)
 */
export function useVideoCompressor() {
  const [progress, setProgress] = useState(0);
  const [compressing, setCompressing] = useState(false);

  const compress = useCallback(
    async (originalUri: string, originalSize: number) => {
      setCompressing(true);
      setProgress(0);

      try {
        // Skip compression for small files
        if (originalSize < 10 * 1024 * 1024) {
          // < 10MB, skip
          setProgress(100);
          return {
            uri: originalUri,
            size: originalSize,
            compressionRatio: 1,
            compressed: false
          };
        }

        const compressedUri = await Video.compress(
          originalUri,
          {
            compressionMethod: "auto",
            maxSize: 1280, // 1280px max dimension (720p)
            bitrate: 2_000_000, // 2 Mbps (good balance for property video)
            minimumFileSizeForCompress: 10 * 1024 * 1024, // only compress if >10MB
            audioBitrate: 128_000, // 128 kbps audio (AAC)
            audioChannels: 2,
            videoFrameRate: 30 // 30fps (smooth playback)
          },
          (prog) => {
            setProgress(Math.round(prog.percent * 100));
          }
        );

        // Get compressed file size
        const fileInfo = await FileSystem.getInfoAsync(compressedUri);
        const newSize = fileInfo.size || 0;

        const ratio = newSize > 0 ? originalSize / newSize : 1;

        setProgress(100);
        return {
          uri: compressedUri,
          size: newSize,
          compressionRatio: ratio,
          compressed: true
        };
      } catch (err: any) {
        setProgress(0);
        throw new Error(err.message ?? "Video compression failed");
      } finally {
        setCompressing(false);
      }
    },
    []
  );

  return { compress, progress, compressing };
}

/**
 * useImageCompressor - Compress images on-device before upload
 *
 * Features:
 * - JPEG output (converts HEIC, PNG, etc.)
 * - Preserves aspect ratio
 * - Removes EXIF metadata (privacy)
 * - Supports single and batch compression
 */
export function useImageCompressor() {
  const compress = useCallback(
    async (
      uri: string,
      maxDimension: number = 2048,
      quality: number = 0.82
    ) => {
      try {
        const result = await ImageManipulator.manipulateAsync(
          uri,
          [
            {
              resize: {
                width: maxDimension // preserve aspect ratio
              }
            }
          ],
          {
            compress: quality,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: false
          }
        );

        return {
          uri: result.uri,
          width: result.width,
          height: result.height
        };
      } catch (err: any) {
        throw new Error(err.message ?? "Image compression failed");
      }
    },
    []
  );

  const compressMany = useCallback(
    async (uris: string[]) => {
      return Promise.all(uris.map((uri) => compress(uri)));
    },
    [compress]
  );

  const generateThumbnail = useCallback(
    async (uri: string) => {
      // 400x300 max, lower quality for thumbnails
      return compress(uri, 400, 0.75);
    },
    [compress]
  );

  return { compress, compressMany, generateThumbnail };
}

/**
 * useImageBulkCompressor - Optimize multiple images for property listing
 *
 * Produces responsive image set:
 * - original: Full quality for desktop (up to 3840px)
 * - display: Detail view (2048px)
 * - card: Property cards (800px)
 * - thumb: Feed thumbnails (400px)
 */
export function useImageBulkCompressor() {
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const processPropertyPhotos = useCallback(async (imageUris: string[]) => {
    setProcessing(true);
    setProgress(0);

    const results: Array<{
      original: string;
      variants: {
        display: string;
        card: string;
        thumb: string;
      };
    }> = [];

    for (let i = 0; i < imageUris.length; i++) {
      const uri = imageUris[i];

      try {
        // Original: 3840px, high quality
        const original = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 3840 } }],
          { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Display: 2048px
        const display = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 2048 } }],
          { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Card: 800px
        const card = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Thumb: 400px
        const thumb = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 400 } }],
          { compress: 0.78, format: ImageManipulator.SaveFormat.JPEG }
        );

        results.push({
          original: original.uri,
          variants: {
            display: display.uri,
            card: card.uri,
            thumb: thumb.uri
          }
        });

        setProgress(Math.round(((i + 1) / imageUris.length) * 100));
      } catch (err) {
        console.error(`Failed to process image ${i}:`, err);
        // Skip this image, continue with others
      }
    }

    setProcessing(false);
    return results;
  }, []);

  return { processPropertyPhotos, progress, processing };
}
