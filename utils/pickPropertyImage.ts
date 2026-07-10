import { pickImageNative } from "./nativePhotoPicker";
import {
  uploadPropertyImageBinary,
  uploadPropertyImageBatch,
} from "./propertyImageUpload";

export { uploadPropertyImageBinary, uploadPropertyImageBatch } from "./propertyImageUpload";

/**
 * Pick property image using native photo picker (no permissions required)
 */
export const pickPropertyImage = async (
  images: string[],
  field: string,
  setImages: (field: string, values: any) => void,
  accessToken?: string,
  onUploadStatus?: (
    status: "uploading" | "success" | "error",
    message?: string,
  ) => void,
) => {
  try {
    const result = await pickImageNative({
      allowsEditing: true,
      base64: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const uri = result.assets[0]?.uri;
    if (!uri) {
      alert("Unable to read the selected image. Please try another one.");
      return;
    }

    const tempImages = [...images, uri];
    setImages(field, tempImages);

    onUploadStatus?.("uploading", "Uploading your photo...");

    if (!accessToken) {
      onUploadStatus?.("error", "You must be logged in to upload photos.");
      setImages(field, images);
      return;
    }

    try {
      const url = await uploadPropertyImageBinary(uri, accessToken);
      setImages(field, [...images, url]);
      onUploadStatus?.("success", "Photo uploaded successfully!");
    } catch (uploadError: any) {
      console.error("Upload error:", uploadError);
      setImages(field, images);

      const errorMessage =
        uploadError.message?.includes("network") ||
        uploadError.message?.includes("fetch")
          ? "No internet connection. Please check your network and try again."
          : uploadError.message?.includes("401") ||
              uploadError.message?.includes("Unauthorized")
            ? "Upload permission denied. Please try again."
            : uploadError.message?.includes("413") ||
                uploadError.message?.includes("too large")
              ? "Photo is too large. Please choose a smaller image."
              : "Unable to upload photo. Please try again.";

      onUploadStatus?.("error", errorMessage);
    }
  } catch (error: any) {
    console.error("Error picking image:", error);
    onUploadStatus?.(
      "error",
      error.message || "Unable to select photo. Please try again.",
    );
  }
};
