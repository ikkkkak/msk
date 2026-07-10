import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { endpoints } from "../../constants";

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  avatarURL?: string;
  dateOfBirth?: string;
  bio?: string;
  languages?: string[];
  skills?: string[];
  location?: string;
  interests?: string[];
  occupation?: string;
  company?: string;
  website?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  travelStyle?: string;
  accommodationType?: string;
  isPublic?: boolean;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
}

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateProfileResponse, Error, UpdateProfileInput>({
    mutationFn: async (profileData) => {
      const res = await api.put(endpoints.userProfile(), profileData);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate and refetch user profile
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["profileStatus"] });
    }
  });
};

export const useCreateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateProfileResponse, Error, UpdateProfileInput>({
    mutationFn: async (profileData) => {
      const res = await api.post(endpoints.userProfile(), profileData);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate and refetch user profile
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["profileStatus"] });
    }
  });
};

export const useDeleteUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateProfileResponse, Error, void>({
    mutationFn: async () => {
      const res = await api.delete(endpoints.userProfile());
      return res.data;
    },
    onSuccess: () => {
      // Invalidate and refetch user profile
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["profileStatus"] });
    }
  });
};
