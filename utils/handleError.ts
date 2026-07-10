import {
  logApiError,
  parseApiError,
  getApiErrorUserMessage,
} from "./apiError";
import type { ParsedApiError } from "../types/apiError";

export function getParsedApiError(error: unknown, scope = "unknown"): ParsedApiError {
  return logApiError(scope, error);
}

export function getErrorMessage(error: unknown, scope = "unknown"): string {
  return getApiErrorUserMessage(logApiError(scope, error));
}

export function getErrorCode(error: unknown, scope = "unknown"): string {
  return logApiError(scope, error).code;
}

export const handleError = (error: unknown, scope = "app") => {
  const parsed = logApiError(scope, error);
  alert(getApiErrorUserMessage(parsed));
};

export function getApiErrorDetail(error: unknown): string | undefined {
  const p = parseApiError(error);
  return p.detail ?? p.message;
}
