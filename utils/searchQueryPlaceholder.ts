/** TanStack Query state — hide stale placeholder rows when the filter session changes. */
export type PlaceholderQueryState = {
  isPlaceholderData?: boolean;
  isFetching: boolean;
  isRefetching?: boolean;
};

export function shouldStripPlaceholderOnNewFilter(
  query: PlaceholderQueryState,
): boolean {
  return !!(
    query.isPlaceholderData &&
    query.isFetching &&
    !query.isRefetching
  );
}
