/**
 * Exponential backoff retries for transient network failures (TikTok-style resilience).
 * Applied to idempotent GET requests on api/publicApi.
 */
import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig
} from "axios";

const RETRYABLE_CODES = new Set([
  "ECONNABORTED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "ECONNRESET",
  "EAI_AGAIN",
  "ERR_NETWORK",
]);

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

export const DEFAULT_MAX_RETRIES = 4;

/** 1s → 2s → 4s → 8s (capped) */
export function retryDelayMs(attempt: number): number {
  return Math.min(1000 * 2 ** Math.max(0, attempt - 1), 16000);
}

function isRetryable(error: AxiosError): boolean {
  const code = String(error.code || "");
  if (RETRYABLE_CODES.has(code)) return true;
  const status = error.response?.status;
  if (status != null && RETRYABLE_STATUS.has(status)) return true;
  return !error.response && !!error.request;
}

function isIdempotentGet(config: InternalAxiosRequestConfig): boolean {
  const method = (config.method || "get").toLowerCase();
  return method === "get" || method === "head";
}

export function attachRetryInterceptor(
  client: AxiosInstance,
  maxRetries = DEFAULT_MAX_RETRIES
): void {
  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const config = error.config as InternalAxiosRequestConfig & {
        _retryCount?: number;
      };
      if (!config || !isIdempotentGet(config) || !isRetryable(error)) {
        return Promise.reject(error);
      }

      const count = config._retryCount ?? 0;
      if (count >= maxRetries) {
        return Promise.reject(error);
      }

      config._retryCount = count + 1;
      const delay = retryDelayMs(config._retryCount);
      await new Promise((r) => setTimeout(r, delay));
      return client.request(config);
    }
  );
}
