import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../../services/api";
import { withNormalizedLandmarkMedia } from "../../utils/landmarkMedia";

/** Lightweight fetch of public landmarks for Discover row on sale feed — independent query key from Search lands tab filters. */
export function useDiscoverLandmarksPreview(enabled: boolean) {
  const { i18n } = useTranslation();
  const lang = ((i18n.language || "en") as string).slice(0, 2);

  return useQuery({
    queryKey: ["discoverLandmarksPreview", lang] as const,
    enabled,
    queryFn: async () => {
      const res = await api.get("/landmarks/public", { params: { lang } });
      const raw = res.data?.landmarks ?? [];
      const list = Array.isArray(raw) ? raw : [];
      return list.map((lm: any) =>
        withNormalizedLandmarkMedia(
          typeof lm === "object" && lm != null ? lm : {},
        ),
      );
    },
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
  });
}
