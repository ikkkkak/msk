import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { endpoints } from "../../constants";
import { useUser } from "../useUser";

type UpdateProfileInput = {
  avatarURL: string;
  dateOfBirth: string;
  bio: string;
  languages: string[];
  skills?: string[];
};

export const useUpdateUserProfileMutation = () => {
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      userId,
      input
    }: {
      userId: number;
      input: UpdateProfileInput;
    }) => {
      const response = await axios.patch(
        `${endpoints.updateUserProfile(userId)}`,
        input,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`
          }
        }
      );
      return response.data;
    }
  });
};
