import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getSearchSuggestions,
  semanticSearch,
  SemanticPropertyMatch,
  SemanticSearchFilters,
} from "../services/semanticSearchService";

export function useSemanticSearch(debounceMs = 400) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SemanticSearchFilters>({});
  const [results, setResults] = useState<SemanticPropertyMatch[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      getSearchSuggestions(q).then(setSuggestions).catch(() => setSuggestions([]));
    }, debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs]);

  const runSearch = useCallback(async (text?: string) => {
    const q = (text ?? query).trim();
    if (!q) {
      setResults([]);
      return [];
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await semanticSearch(q, filters);
      setResults(rows);
      return rows;
    } catch (e: any) {
      setError(e?.message ?? "search_failed");
      setResults([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) return;
    const t = setTimeout(() => {
      runSearch(q);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [query, filters, debounceMs, runSearch]);

  return useMemo(
    () => ({
      query,
      setQuery,
      filters,
      setFilters,
      results,
      suggestions,
      loading,
      error,
      runSearch,
    }),
    [query, filters, results, suggestions, loading, error, runSearch],
  );
}
