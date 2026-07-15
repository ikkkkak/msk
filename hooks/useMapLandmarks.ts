import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { enrichMapLandmarksWithPlotGeometry } from "../utils/enrichMapLandmarks";
import {
  isPublishedMapLandmark,
  dedupeLandmarksByPlot,
  landmarkHasPlotGeometry,
  type MapLandmarkRecord,
} from "../utils/landmarkMapMarkers";

/** All verified lands for sale — map layer ignores list filters. */
export function useMapLandmarks(enabled: boolean, lang: string) {
  return useQuery({
    queryKey: ["publicLandmarks", "mapAll", lang] as const,
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const res = await api.get<{
        data?: MapLandmarkRecord[];
        landmarks?: MapLandmarkRecord[];
      }>("/landmarks/public/map", { params: { lang }, signal });
      const list = res.data?.data ?? res.data?.landmarks ?? [];
      const published = list.filter(isPublishedMapLandmark);
      const unique = dedupeLandmarksByPlot(published);
      if (!unique.some((lm) => !landmarkHasPlotGeometry(lm))) {
        return unique;
      }
      return enrichMapLandmarksWithPlotGeometry(unique);
    },
  });
}
