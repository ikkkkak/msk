/**
 * profileService.ts
 *
 * Profile & user data fetching with proper error handling and typing
 */

import { api, publicApi } from "./api";

/** Org sheet endpoints can be slow on cold DB / large orgs — default axios is 8s */
const PROFILE_SHEET_TIMEOUT_MS = 45_000;

export type ProfileSheetKind = "user" | "organization";

export type ProfileSheetTarget = {
  id: number | string;
  kind: ProfileSheetKind;
};

export interface UserProfile {
  id: number;
  name: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  stats?: {
    totalListings: number;
    followers: number;
    verified: boolean;
  };
  isFollowing?: boolean;
}

export interface Property {
  id: number;
  title: string;
  price?: number;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  shortDesc?: string;
  geo?: {
    city?: string;
    zone?: string;
  };
  createdAt?: string;
  isBoosted?: boolean;
  bedrooms?: number;
  bathrooms?: number;
}

export interface PropertyResponse {
  data: Property[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface Landmark {
  id: number;
  name: string;
  title?: string;
  distance?: number;
  distanceKm?: number;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  category?: string;
  zone_name?: string;
}

function sheetBasePath(target: ProfileSheetTarget): string {
  return target.kind === "organization"
    ? `/organizations/${target.id}`
    : `/users/${target.id}`;
}

/**
 * Fetch profile for a user or organization
 */
export async function fetchProfileSheetProfile(
  target: ProfileSheetTarget,
): Promise<UserProfile> {
  try {
    const response = await publicApi.get(
      `${sheetBasePath(target)}/profile-sheet`,
      { timeout: PROFILE_SHEET_TIMEOUT_MS },
    );
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to fetch profile for ${target.kind} ${target.id}:`,
      error,
    );
    throw error;
  }
}

/** @deprecated Use fetchProfileSheetProfile with ProfileSheetTarget */
export async function fetchUserProfile(
  userId: number | string,
): Promise<UserProfile> {
  return fetchProfileSheetProfile({ id: userId, kind: "user" });
}

/**
 * Fetch properties for a user or organization (paginated)
 */
export async function fetchProfileSheetProperties(
  target: ProfileSheetTarget,
  type: "sale" | "rent" = "sale",
  limit: number = 8,
  pageParam?: number | string,
): Promise<PropertyResponse> {
  try {
    const page =
      typeof pageParam === "number"
        ? pageParam
        : typeof pageParam === "string"
          ? parseInt(pageParam, 10) || 1
          : 1;
    const params: Record<string, string | number> = {
      limit,
      page,
      listing: type,
    };

    const response = await publicApi.get(
      `${sheetBasePath(target)}/properties-sheet`,
      { params, timeout: PROFILE_SHEET_TIMEOUT_MS },
    );

    const properties = response.data?.properties || [];
    const pagination = response.data?.pagination || {};
    const currentPage = pagination.page || 1;
    const totalPage = pagination.totalPage || 1;
    const hasMore = currentPage < totalPage;

    return {
      data: properties,
      nextCursor: hasMore ? String(currentPage + 1) : undefined,
      hasMore,
    };
  } catch (error) {
    console.error(
      `❌ Failed to fetch properties for ${target.kind} ${target.id}:`,
      error,
    );
    throw error;
  }
}

/** @deprecated Use fetchProfileSheetProperties with ProfileSheetTarget */
export async function fetchUserProperties(
  userId: number | string,
  type: "sale" | "rent" = "sale",
  limit: number = 8,
  pageParam?: number | string,
): Promise<PropertyResponse> {
  return fetchProfileSheetProperties(
    { id: userId, kind: "user" },
    type,
    limit,
    pageParam,
  );
}

/**
 * Fetch landmarks for a user or organization
 */
export async function fetchProfileSheetLandmarks(
  target: ProfileSheetTarget,
): Promise<Landmark[]> {
  try {
    const response = await publicApi.get(
      `${sheetBasePath(target)}/landmarks-sheet`,
      { timeout: PROFILE_SHEET_TIMEOUT_MS },
    );
    return response.data?.landmarks || [];
  } catch (error) {
    console.error(
      `❌ Failed to fetch landmarks for ${target.kind} ${target.id}:`,
      error,
    );
    throw error;
  }
}

/** @deprecated Use fetchProfileSheetLandmarks with ProfileSheetTarget */
export async function fetchUserLandmarks(
  userId: number | string,
): Promise<Landmark[]> {
  return fetchProfileSheetLandmarks({ id: userId, kind: "user" });
}

/**
 * Toggle follow status for an organization
 */
export async function toggleFollowUser(
  orgId: number | string,
  follow: boolean,
): Promise<void> {
  try {
    const response = await api.post(`/organizations/${orgId}/follow`, {
      action: follow ? "follow" : "unfollow",
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to toggle follow for organization ${orgId}:`, error);
    throw error;
  }
}

export async function likeProperty(propertyId: number): Promise<void> {
  try {
    await api.patch(`/properties/${propertyId}/like`, { liked: true });
  } catch (error) {
    console.error(`❌ Failed to like property ${propertyId}:`, error);
    throw error;
  }
}

export async function unlikeProperty(propertyId: number): Promise<void> {
  try {
    await api.patch(`/properties/${propertyId}/like`, { liked: false });
  } catch (error) {
    console.error(`❌ Failed to unlike property ${propertyId}:`, error);
    throw error;
  }
}
