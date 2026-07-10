import { useState, useEffect } from "react";
import { useUser } from "./useUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { endpoints } from "../constants";

export const useHostProfile = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState({
    avatarURL: "",
    firstName: "",
    lastName: "",
    bio: "",
    languages: [] as string[],
    skills: [] as string[]
  });

  // Load existing profile data when user changes
  useEffect(() => {
    if (user) {
      setProfile({
        avatarURL: user.avatarURL || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: user.bio || "",
        languages: user.languages || [],
        skills: user.skills || []
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: {
      avatarURL?: string;
      firstName?: string;
      lastName?: string;
      bio?: string;
      languages?: string[];
      skills?: string[];
    }) => {
      const response = await axios.patch(
        `${endpoints.updateUserProfile(user?.ID || 0)}`,
        profileData,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`
          }
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user query to refresh profile data
      queryClient.invalidateQueries({ queryKey: ["user"] });
    }
  });

  const updateProfile = (profileData: {
    avatarURL?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    languages?: string[];
    skills?: string[];
  }) => {
    updateProfileMutation.mutate(profileData);
  };

  return {
    profile,
    setProfile,
    updateProfile,
    isLoading: updateProfileMutation.isLoading
  };
};
