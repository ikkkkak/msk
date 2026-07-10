/**
 * Canonical API paths — must match apartmentscloneserver/main.go route registration.
 * Use with `api` from services/api.ts (baseURL = serverUrl = …/api).
 */
import { apiOrigin, serverUrl } from "../constants";

const apiBase = serverUrl.replace(/\/+$/, "");

export const API_PATHS = {
  /** GET — no /api prefix (main.go app.Get("/health")) */
  health: `${apiOrigin}/health`,

  /** POST multipart/base64 upload (Party /api/upload) */
  uploadImage: "/upload/image",
  uploadImageBinary: "/upload/image/binary",
  uploadVideo: "/upload/video",
  uploadVideoStream: "/upload/video/stream",

  /** POST create listing — no trailing slash (Iris 307-strips slash and drops POST body). */
  propertySalesCreate: "/property-sales",

  /** Async create with server-driven percent (58–100); poll GET job. */
  propertySalesCreateJobs: "/property-sales/create-jobs",
  propertySalesCreateJobsPing: "/property-sales/create-jobs/ping",
  propertySalesCreateJob: (jobId: string) =>
    `/property-sales/create-jobs/${jobId}`,

  listingAiJobs: "/listing-ai/jobs",
  listingAiJob: (jobId: string) => `/listing-ai/jobs/${jobId}`,
  listingAiEvents: "/listing-ai/events",
  whatsappShareEvents: "/whatsapp-share/events",
} as const;

/** Full URL for logging / debugging (e.g. Metro console). */
export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${apiBase}${p}`;
}

/** Paths used by Add with AI + Publish sale flow */
export const LISTING_FLOW_URLS = {
  health: API_PATHS.health,
  uploadImage: resolveApiUrl(API_PATHS.uploadImage),
  uploadVideo: resolveApiUrl(API_PATHS.uploadVideo),
  createPropertySale: resolveApiUrl(API_PATHS.propertySalesCreate),
  createPropertySaleJob: resolveApiUrl(API_PATHS.propertySalesCreateJobs),
  createPropertySaleJobPoll: (jobId: string) =>
    resolveApiUrl(API_PATHS.propertySalesCreateJob(jobId)),
  listingAiJobs: resolveApiUrl(API_PATHS.listingAiJobs),
  listingAiJob: (jobId: string) => resolveApiUrl(API_PATHS.listingAiJob(jobId)),
} as const;
