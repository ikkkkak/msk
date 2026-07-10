import axios from 'axios';
import { cloudinary } from '../constants';

export const uploadToCloudinary = async (base64Data: string, folder: string = 'general'): Promise<string> => {
  try {
    const data = new FormData();
    data.append('file', `data:image/jpeg;base64,${base64Data}`);
    data.append('upload_preset', cloudinary.uploadPreset);
    data.append('folder', folder);

    const response = await axios.post(cloudinary.uploadUrl('image'), data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data && response.data.secure_url) {
      return response.data.secure_url;
    } else {
      throw new Error('No secure URL returned from Cloudinary');
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};
