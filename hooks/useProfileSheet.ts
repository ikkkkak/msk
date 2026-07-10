/**
 * useProfileSheet.ts
 *
 * TanStack Query hooks for profile data fetching with caching & prefetching
 */

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchProfileSheetProfile,
  fetchProfileSheetProperties,
  fetchProfileSheetLandmarks,
  toggleFollowUser,
  type ProfileSheetTarget,
  type UserProfile,
} from "../services/profileService";
import type { FeedProfileContext } from "../hooks/Videofeedtypes";

const STALE_TIME = 5 * 60 * 1000;
const CACHE_TIME = 30 * 60 * 1000;

export function profileTargetFromPreview(
  userId: number | string | null,
  preview?: FeedProfileContext | null,
): ProfileSheetTarget | null {
  if (!userId) return null;
  if (preview?.isOrganization && preview.organizationId) {
    return { id: preview.organizationId, kind: "organization" };
  }
  return { id: userId, kind: "user" };
}

export function useUserProfile(
  target: ProfileSheetTarget | null,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["userProfile", target?.kind, target?.id],
    queryFn: () => fetchProfileSheetProfile(target!),
    enabled: enabled && !!target,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    placeholderData: (previousData) => previousData,
  });
}

export function useUserProperties(
  target: ProfileSheetTarget | null,
  type: "sale" | "rent",
  enabled: boolean = true,
) {
  return useInfiniteQuery({
    queryKey: ["userProperties", target?.kind, target?.id, type],
    queryFn: ({ pageParam }) =>
      fetchProfileSheetProperties(target!, type, 8, pageParam),
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
    enabled: enabled && !!target,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 1,
    placeholderData: (previousData) => previousData,
    initialPageParam: undefined as string | undefined,
  });
}

export function useUserLandmarks(
  target: ProfileSheetTarget | null,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["userLandmarks", target?.kind, target?.id],
    queryFn: () => fetchProfileSheetLandmarks(target!),
    enabled: enabled && !!target,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 1,
    placeholderData: (previousData) => previousData,
  });
}

export function useToggleFollow(orgId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (follow: boolean) => toggleFollowUser(orgId, follow),
    onMutate: async (follow) => {
      await queryClient.cancelQueries({
        queryKey: ["userProfile", "organization", orgId],
      });

      const previousProfile = queryClient.getQueryData<UserProfile>([
        "userProfile",
        "organization",
        orgId,
      ]);

      if (previousProfile) {
        queryClient.setQueryData<UserProfile>(
          ["userProfile", "organization", orgId],
          { ...previousProfile, isFollowing: follow },
        );
      }

      return { previousProfile };
    },
    onError: (_error, _follow, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(
          ["userProfile", "organization", orgId],
          context.previousProfile,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["userProfile", "organization", orgId],
      });
    },
  });
}

export async function prefetchProfileData(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: number | string,
  preview?: FeedProfileContext | null,
) {
  const target = profileTargetFromPreview(userId, preview);
  if (!target) return;

  try {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ["userProfile", target.kind, target.id],
        queryFn: () => fetchProfileSheetProfile(target),
        staleTime: STALE_TIME,
      }),
      queryClient.prefetchInfiniteQuery({
        queryKey: ["userProperties", target.kind, target.id, "sale"],
        queryFn: ({ pageParam }) =>
          fetchProfileSheetProperties(target, "sale", 8, pageParam),
        initialPageParam: undefined as string | undefined,
        staleTime: STALE_TIME,
      }),
      queryClient.prefetchInfiniteQuery({
        queryKey: ["userProperties", target.kind, target.id, "rent"],
        queryFn: ({ pageParam }) =>
          fetchProfileSheetProperties(target, "rent", 8, pageParam),
        initialPageParam: undefined as string | undefined,
        staleTime: STALE_TIME,
      }),
      queryClient.prefetchQuery({
        queryKey: ["userLandmarks", target.kind, target.id],
        queryFn: () => fetchProfileSheetLandmarks(target),
        staleTime: STALE_TIME,
      }),
    ]);
  } catch (error) {
    console.warn(`⚠️ Prefetch failed for ${target.kind} ${target.id}:`, error);
  }
}
