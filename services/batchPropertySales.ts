import { api, publicApi } from "./api";

export type BatchPropertySaleCard = Record<string, unknown>;

/** Fetch multiple listing cards in one request (weak network friendly). */
export async function fetchPropertySalesBatch(
  ids: number[],
  opts?: { useAuth?: boolean; lang?: string; fields?: "card" | "full" },
): Promise<BatchPropertySaleCard[]> {
  const unique = [...new Set(ids.filter((id) => id > 0))].slice(0, 50);
  if (unique.length === 0) return [];

  const client = opts?.useAuth ? api : publicApi;
  const res = await client.post<{ properties?: BatchPropertySaleCard[] }>(
    "/batch/property-sales",
    {
      ids: unique,
      fields: opts?.fields ?? "card",
      lang: (opts?.lang ?? "en").toLowerCase(),
    },
    { timeout: 30000 },
  );
  return Array.isArray(res.data?.properties) ? res.data.properties : [];
}
