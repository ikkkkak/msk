/** Normalize rent/sale listing image fields into http(s) URL strings. */
export function resolvePropertyImages(property: unknown): string[] {
  if (!property || typeof property !== "object") return [];
  const p = property as Record<string, unknown>;

  const raw = p.images ?? p.Images ?? p.image_urls ?? p.imageUrls;
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((it) => {
        if (typeof it === "string" && it.trim()) return it.trim();
        if (it && typeof it === "object") {
          const u =
            (it as Record<string, unknown>).url ??
            (it as Record<string, unknown>).uri ??
            (it as Record<string, unknown>).URL;
          return typeof u === "string" && u.trim() ? u.trim() : "";
        }
        return "";
      })
      .filter(Boolean);
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return resolvePropertyImages({ images: parsed });
      } catch {
        return trimmed.startsWith("http") ? [trimmed] : [];
      }
    }
    return trimmed.startsWith("http") ? [trimmed] : [];
  }

  return [];
}
