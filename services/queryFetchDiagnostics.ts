import type { QueryClient } from "@tanstack/react-query";
import { recordReactQueryFetch } from "./apiDiagnostics";

/** Log which React Query keys trigger network (explains "why server called"). */
export function attachQueryFetchDiagnostics(queryClient: QueryClient): () => void {
  return queryClient.getQueryCache().subscribe((event) => {
    if (event?.type !== "updated") return;
    const q = event.query;
    if (q.state.fetchStatus !== "fetching") return;
    recordReactQueryFetch(q.queryKey, {
      stale: q.isStale(),
    });
  });
}
