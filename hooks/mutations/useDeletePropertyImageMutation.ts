import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "../useUser";
import { endpoints } from "../../constants";

interface DeletePropertyImageInput {
  propertyID: number;
  imageURL: string;
}

interface DeletePropertyImageResponse {
  message: string;
  success: boolean;
}

export const useDeletePropertyImageMutation = () => {
  const { user } = useUser();

  return useMutation<
    DeletePropertyImageResponse,
    Error,
    DeletePropertyImageInput
  >({
    mutationFn: async (input: DeletePropertyImageInput) => {
      // URL encode the image URL to handle special characters
      const encodedImageURL = encodeURIComponent(input.imageURL);
      const url = `${endpoints.baseURL}/property/image?propertyID=${input.propertyID}&imageURL=${encodedImageURL}`;

      console.log("Original URL:", input.imageURL);
      console.log("Encoded URL:", encodedImageURL);
      console.log("Full request URL:", url);

      const response = await axios.delete(url, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`
        }
      });
      return response.data;
    }
  });
};
