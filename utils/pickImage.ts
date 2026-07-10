import { pickImageNative } from "./nativePhotoPicker";
import { uploadPropertyImageBatch } from "./propertyImageUpload";
import { tokenStorage } from "../services/tokenStorage";

/**
 * Pick image using native photo picker (no permissions required)
 */
export const pickImage = async (
  images: string[],
  field: string,
  setImages: (field: string, values: any) => void,
) => {
  try {
    const result = await pickImageNative({
      allowsEditing: true,
      base64: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    if (!asset.base64) {
      return;
    }

    if (
      field === "avatarURL" ||
      field === "idFrontImage" ||
      field === "idBackImage" ||
      field === "selfieImage"
    ) {
      setImages(field, [asset.base64]);
    } else {
      const basedImage = `data:image/jpeg;base64,${asset.base64}`;
      const newImages = [...images, basedImage];
      setImages(field, newImages);
    }
  } catch (error) {
    console.error("Error picking image:", error);
    alert("Error picking image. Please try again.");
  }
};

/** Upload property listing images to CDN (authenticated binary upload). */
export const uploadImagesToCloudinary = async (
  images: string[],
  accessToken?: string,
): Promise<string[]> => {
  const token = accessToken || tokenStorage.getAccess();
  if (!token) {
    throw new Error("You must be logged in to upload photos.");
  }
  return uploadPropertyImageBatch(images, token);
};
