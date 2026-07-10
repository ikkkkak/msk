import type { ApiErrorCodeType } from "../constants/apiErrorCodes";

export type ApiErrorPayload = {
  code: ApiErrorCodeType | string;
  message: string;
  status?: number;
  detail?: string;
};

export type ParsedApiError = {
  code: ApiErrorCodeType | string;
  message: string;
  status?: number;
  detail?: string;
  /** User-facing sentence */
  userMessage: string;
  /** Dev-only: URL, axios code, raw snippet */
  debug: string;
  isNetworkError: boolean;
  isTimeout: boolean;
};

export type HealthCheckResult = {
  ok: boolean;
  code: string;
  message: string;
  latencyMs: number;
  url: string;
};
