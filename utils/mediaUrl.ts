import type { ConnectionQuality } from "../hooks/useConnectivity";

type ImageTier = "thumb" | "small" | "medium" | "large";

/** Pick CDN image URL tier for weak networks (Meskeny cards often use single URL today). */
export function pickListingImageUrl(
  url: string | undefined | null,
  quality: ConnectionQuality,
): string {
  const u = String(url ?? "").trim();
  if (!u) return "";

  if (quality === "good") return u;

  // Cloudinary-style transforms if present
  if (u.includes("/upload/") && !u.includes("/upload/t_media_lib_thumb/")) {
    if (quality === "poor" || quality === "offline") {
      return u.replace("/upload/", "/upload/t_media_lib_thumb,w_120/");
    }
    if (quality === "moderate") {
      return u.replace("/upload/", "/upload/w_320,q_auto:low,f_auto/");
    }
  }

  // Generic: append width hint for imgproxy/bunny-style paths
  if (quality === "poor" || quality === "offline") {
    const sep = u.includes("?") ? "&" : "?";
    return `${u}${sep}w=120&q=60`;
  }
  if (quality === "moderate") {
    const sep = u.includes("?") ? "&" : "?";
    return `${u}${sep}w=320&q=70`;
  }
  return u;
}

export function pickVideoStartHeight(quality: ConnectionQuality): number {
  switch (quality) {
    case "offline":
      return 240;
    case "poor":
      return 240;
    case "moderate":
      return 360;
    default:
      return 540;
  }
}

export type { ImageTier };
