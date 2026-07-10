import axios, { type AxiosError } from "axios";
import { ApiErrorCode, type ApiErrorCodeType } from "../constants/apiErrorCodes";
import { apiOrigin } from "../constants";
import type { ApiErrorPayload, HealthCheckResult, ParsedApiError } from "../types/apiError";

/** User-facing only — no URLs, hosts, or internal paths. */
const CODE_MESSAGES: Partial<Record<string, string>> = {
  [ApiErrorCode.NET_NO_RESPONSE]:
    "Unable to connect right now. Check your internet connection and try again.",
  [ApiErrorCode.NET_TIMEOUT]:
    "The request timed out. Please try again.",
  [ApiErrorCode.NET_DNS]:
    "Unable to connect right now. Please try again later.",
  [ApiErrorCode.NET_OFFLINE]:
    "No internet connection. Connect to the internet and try again.",
  [ApiErrorCode.NET_SSL]:
    "Secure connection failed. Please try again.",
  [ApiErrorCode.NET_UNKNOWN]:
    "A network error occurred. Please try again.",
  [ApiErrorCode.SERVER_INTERNAL]:
    "Something went wrong on our side. Please try again shortly.",
  [ApiErrorCode.USER_CHECK_NO_IDENTIFIER]:
    "Enter your email or phone number to continue.",
  [ApiErrorCode.USER_CHECK_BOTH_IDENTIFIERS]:
    "Use either email or phone, not both.",
  [ApiErrorCode.USER_CHECK_INVALID_BODY]:
    "Invalid request. Please try again.",
  [ApiErrorCode.AUTH_INVALID_CREDENTIALS]:
    "Incorrect email/phone or password.",
  [ApiErrorCode.AUTH_UNAUTHORIZED]:
    "You need to sign in again.",
};

export function extractApiErrorPayload(data: unknown): ApiErrorPayload | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;

  if (root.error && typeof root.error === "object") {
    const e = root.error as Record<string, unknown>;
    const code = String(e.code ?? e.error ?? "").trim();
    const message = String(e.message ?? e.detail ?? "").trim();
    if (code || message) {
      return {
        code: (code || ApiErrorCode.UNKNOWN) as ApiErrorCodeType,
        message: message || code,
        status: typeof e.status === "number" ? e.status : undefined,
        detail: typeof e.detail === "string" ? e.detail : undefined,
      };
    }
  }

  if (typeof root.error === "string") {
    return {
      code: root.error,
      message: String(root.message ?? root.error),
      status: typeof root.status === "number" ? root.status : undefined,
    };
  }

  if (typeof root.detail === "string" || typeof root.title === "string") {
    return {
      code: (typeof root.type === "string" ? root.type : ApiErrorCode.UNKNOWN) as ApiErrorCodeType,
      message: String(root.detail ?? root.title ?? "Request failed"),
      status: typeof root.status === "number" ? root.status : undefined,
      detail: typeof root.title === "string" ? root.title : undefined,
    };
  }

  if (typeof root.message === "string") {
    return {
      code: String(root.code ?? ApiErrorCode.UNKNOWN),
      message: root.message,
    };
  }

  return null;
}

function mapAxiosNetworkCode(error: AxiosError): ApiErrorCodeType {
  const c = error.code ?? "";
  if (c === "ECONNABORTED" || c === "ETIMEDOUT") return ApiErrorCode.NET_TIMEOUT;
  if (c === "ENOTFOUND" || c === "EAI_AGAIN") return ApiErrorCode.NET_DNS;
  if (c === "ERR_NETWORK" || !error.response) return ApiErrorCode.NET_NO_RESPONSE;
  if (c === "ERR_CERT" || c === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
    return ApiErrorCode.NET_SSL;
  }
  return ApiErrorCode.NET_UNKNOWN;
}

function buildDebug(error: AxiosError, url?: string): string {
  const parts = [
    url ? `url=${url}` : null,
    error.code ? `axios=${error.code}` : null,
    error.response?.status ? `http=${error.response.status}` : null,
    apiOrigin ? `origin=${apiOrigin}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function parseApiError(error: unknown, requestUrl?: string): ParsedApiError {
  if (axios.isAxiosError(error)) {
    const payload = extractApiErrorPayload(error.response?.data);
    const isTimeout =
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT" ||
      payload?.code === ApiErrorCode.NET_TIMEOUT;
    const isNetworkError = !error.response || error.code === "ERR_NETWORK";

    if (payload?.code) {
      const code = payload.code as ApiErrorCodeType;
      return {
        code,
        message: payload.message,
        status: payload.status ?? error.response?.status,
        detail: payload.detail,
        userMessage:
          CODE_MESSAGES[code] ?? "Something went wrong. Please try again.",
        debug: buildDebug(error, requestUrl ?? error.config?.url),
        isNetworkError,
        isTimeout,
      };
    }

    const netCode = mapAxiosNetworkCode(error);
    return {
      code: netCode,
      message: error.message,
      status: error.response?.status,
      userMessage: CODE_MESSAGES[netCode] ?? "Something went wrong. Please try again.",
      debug: buildDebug(error, requestUrl ?? error.config?.url),
      isNetworkError: true,
      isTimeout: netCode === ApiErrorCode.NET_TIMEOUT,
    };
  }

  if (error instanceof Error) {
    return {
      code: ApiErrorCode.UNKNOWN,
      message: error.message,
      userMessage: "Something went wrong. Please try again.",
      debug: error.stack?.split("\n")[0] ?? "",
      isNetworkError: false,
      isTimeout: false,
    };
  }

  return {
    code: ApiErrorCode.UNKNOWN,
    message: "Unknown error",
    userMessage: "Something went wrong. Please try again.",
    debug: String(error),
    isNetworkError: false,
    isTimeout: false,
  };
}

export type ApiErrorLogMeta = {
  type?: string;
  debug?: string;
  url?: string;
  latencyMs?: number;
};

/** Log technical details to Metro/console only — never show these to users. */
export function logApiError(
  scope: string,
  error: unknown,
  meta?: ApiErrorLogMeta,
): ParsedApiError {
  const parsed = parseApiError(error);
  const type = meta?.type ?? parsed.code;
  const debug =
    meta?.debug ??
    [
      parsed.debug,
      meta?.url ? `url=${meta.url}` : null,
      meta?.latencyMs != null ? `latency=${meta.latencyMs}ms` : null,
    ]
      .filter(Boolean)
      .join(" · ");

  console.error(`[API Error · ${scope}]`, {
    type,
    message: parsed.message,
    status: parsed.status,
    network: parsed.isNetworkError,
    timeout: parsed.isTimeout,
    detail: parsed.detail,
    debug,
  });

  return { ...parsed, code: type };
}

export function attachApiError(error: unknown): AxiosError & { parsed?: ParsedApiError } {
  if (axios.isAxiosError(error)) {
    (error as AxiosError & { parsed?: ParsedApiError }).parsed = parseApiError(
      error,
      error.config?.url,
    );
  }
  return error as AxiosError & { parsed?: ParsedApiError };
}

/** Short message for Alert — no codes, URLs, or API hostnames. */
export function getApiErrorUserMessage(
  parsed: ParsedApiError,
  t?: (key: string, def: string) => string,
): string {
  const translate = t ?? ((_k, def) => def);
  return translate(`apiErrors.${parsed.code}`, parsed.userMessage);
}

/** @deprecated Use getApiErrorUserMessage — kept for callers migrating off debug alerts */
export function formatApiErrorAlert(
  parsed: ParsedApiError,
  t?: (key: string, def: string) => string,
): string {
  return getApiErrorUserMessage(parsed, t);
}

export async function pingApiHealth(timeoutMs = 5000): Promise<HealthCheckResult> {
  const url = `${apiOrigin}/health`;
  const started = Date.now();
  try {
    const res = await axios.get(url, { timeout: timeoutMs });
    const latencyMs = Date.now() - started;
    const data = res.data as Record<string, unknown>;
    return {
      ok: res.status === 200 && (data?.ok === true || data?.status === "ok"),
      code: String(data?.code ?? ApiErrorCode.SERVER_OK),
      message: String(data?.message ?? "Server is running"),
      latencyMs,
      url,
    };
  } catch (e) {
    const parsed = parseApiError(e, url);
    logApiError("health", e);
    return {
      ok: false,
      code: parsed.code,
      message: parsed.userMessage,
      latencyMs: Date.now() - started,
      url,
    };
  }
}
