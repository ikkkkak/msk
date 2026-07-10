import { useQuery } from "@tanstack/react-query";
import { api, publicApi } from "../../services/api";

export type Banner = {
  id: number;
  image_url: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
  /**
   * Display dimensions from the database, served by the API.
   * Used to compute aspectRatio on the mobile feed.
   */
  width?: number;
  height?: number;
};

export function useBannersQuery(options?: { enabled?: boolean }) {
  return useQuery<Banner[]>({
    queryKey: ["banners"],
    queryFn: async () => {
      let res;
      try {
        res = await publicApi.get<{ banners: Banner[] }>("/banners", {
          timeout: 12000,
        });
      } catch (e) {
        // Fallback to authenticated client (in case some deployments require auth).
        res = await api.get<{ banners: Banner[] }>("/banners", {
          timeout: 12000,
        });
      }
      const raw = res.data as any;
      // Be tolerant to backend envelope differences: {banners:[...]}, {data:[...]}, or direct [].
      const banners = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.banners)
          ? raw.banners
          : Array.isArray(raw?.items)
            ? raw.items
          : Array.isArray(raw?.data)
            ? raw.data
            : [];
      if (__DEV__) {
        console.log("📣 [useBannersQuery] banners:", banners.length, JSON.stringify(banners.map((b) => ({ id: b.id, w: b.width, h: b.height }))));
      }
      return banners;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
    placeholderData: [],
    enabled: options?.enabled ?? true,
  });
}
