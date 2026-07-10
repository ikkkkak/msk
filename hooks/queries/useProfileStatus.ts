import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { endpoints } from "../../constants";

export interface ProfileStatus {
  canDiscoverGroups: boolean;
  completionPercentage: number;
  status: "incomplete" | "basic" | "good" | "complete";
  message: string;
  hasName: boolean;
  hasBio: boolean;
  hasAvatar: boolean;
}

export interface ProfileData {
  firstName: string;
  lastName: string;
  bio: string;
  avatarURL: string;
  email: string;
}

export interface ProfileStatusResponse {
  success: boolean;
  profile: ProfileData;
  status: ProfileStatus;
}

export const useProfileStatus = () => {
  return useQuery<ProfileStatusResponse>({
    queryKey: ["profileStatus"],
    queryFn: async () => {
      const res = await api.get(endpoints.profileStatus());
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });
};
