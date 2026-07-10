import { api, publicApi } from "./api";

export interface SemanticSearchFilters {
  city?: string;
  zone?: string;
  property_type?: string;
  purpose?: "rent" | "sale" | "land";
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
}

export interface SemanticPropertyMatch {
  id: number;
  title: string;
  price: number;
  currency: string;
  city: string;
  bedrooms: number;
  image: string;
  type: "rent" | "sale";
  source?: string;
  matchScore?: number;
}

export async function semanticSearch(
  query: string,
  filters?: SemanticSearchFilters,
  limit = 12,
): Promise<SemanticPropertyMatch[]> {
  const body = { query, limit, ...filters };
  try {
    const res = await api.post("/ai/search/semantic", body, { timeout: 60000 });
    return res.data?.results ?? [];
  } catch {
    const res = await publicApi.post("/ai/search/semantic", body, { timeout: 60000 });
    return res.data?.results ?? [];
  }
}

export async function findSimilarProperties(
  propertyId: number,
  source = "sale",
  limit = 8,
): Promise<SemanticPropertyMatch[]> {
  const body = { property_id: propertyId, source, limit };
  try {
    const res = await api.post("/ai/search/similar", body, { timeout: 60000 });
    return res.data?.results ?? [];
  } catch {
    const res = await publicApi.post("/ai/search/similar", body, { timeout: 60000 });
    return res.data?.results ?? [];
  }
}

export async function getSearchSuggestions(q: string): Promise<string[]> {
  try {
    const res = await publicApi.get("/ai/search/suggestions", { params: { q } });
    return res.data?.suggestions ?? [];
  } catch {
    return [];
  }
}
