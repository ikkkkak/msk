import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { Property } from "../../types/property";

type PropertiesResponse = {
  data: Property[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

async function fetchPropertiesPage(page: number, limit: number) {
  const res = await api.get<PropertiesResponse>("/properties", {
    params: { page, limit }
  });
  return res.data;
}

export function usePropertiesInfiniteQuery(limit: number = 20) {
  return useInfiniteQuery({
    queryKey: ["properties", "infinite", limit],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchPropertiesPage(pageParam as number, limit),
    getNextPageParam: (lastPage) => {
      const { page, total } = lastPage.meta;
      const totalPages = Math.ceil(total / limit);
      const next = page + 1;
      return next <= totalPages ? next : undefined;
    },
    staleTime: 60 * 1000, // show cached data, refresh silently
    gcTime: 30 * 60 * 1000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000)
  });
}

