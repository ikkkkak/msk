import type { HostStudioListing } from "./useHostStudioQuery";

/** O(n) single pass — avoids multiple .filter() allocations on each render. */
export function countHostStudioListingsByKind(
  listings: HostStudioListing[] | undefined,
): { rent: number; sale: number } {
  let rent = 0;
  let sale = 0;
  if (!listings?.length) return { rent: 0, sale: 0 };
  for (let i = 0; i < listings.length; i++) {
    if (listings[i].kind === "rent") rent++;
    else if (listings[i].kind === "sale") sale++;
  }
  return { rent, sale };
}
