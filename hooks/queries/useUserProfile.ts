import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { useUser } from "../useUser";

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  avatarURL: string;
  dateOfBirth: string;
  bio: string;
  languages: string[];
  skills: string[];
  location: string;
  interests: string[];
  occupation: string;
  company: string;
  website: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  travelStyle: string;
  accommodationType: string;
  isPublic: boolean;
  isComplete: boolean;
  completionPercentage: number;
  hasProfile: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrUpdateProfileInput {
  firstName: string;
  lastName: string;
  email: string;
  avatarURL: string;
  dateOfBirth: string;
  bio: string;
  languages: string[];
  skills: string[];
  location: string;
  interests: string[];
  occupation: string;
  company: string;
  website: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  travelStyle: string;
  accommodationType: string;
  isPublic: boolean;
}

export interface ProfileResponse {
  success: boolean;
  profile: UserProfile;
  message?: string;
}

export const useUserProfile = () => {
  const { user } = useUser();

  return useQuery<ProfileResponse>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const res = await api.get("/user/profile");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    enabled: !!user?.ID && !!user?.accessToken,
    placeholderData: (prev) => prev,
  });
};

export const useCreateOrUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<ProfileResponse, Error, CreateOrUpdateProfileInput>({
    mutationFn: async (profileData) => {
      const res = await api.post("/user/profile", profileData);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["profileStatus"] });
    }
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ProfileResponse,
    Error,
    Partial<CreateOrUpdateProfileInput>
  >({
    mutationFn: async (profileData) => {
      console.log(
        "🔍 useUpdateUserProfile - Updating profile with data:",
        profileData
      );
      console.log(
        "🔍 useUpdateUserProfile - Making API call to: /user/profile"
      );
      const res = await api.put("/user/profile", profileData);
      console.log("🔍 useUpdateUserProfile - API response:", res.data);
      return res.data;
    },
    onSuccess: () => {
      console.log("🔍 useUpdateUserProfile - Success, invalidating cache");
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    }
  });
};

export const useDeleteProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.delete("/user/profile");
      return res.data;
    },
    onSuccess: () => {
      // Invalidate profile data
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["profileStatus"] });
    }
  });
};
