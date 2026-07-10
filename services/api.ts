import axios from 'axios';
import { getStoredUser } from './userStorage';
import { tokenStorage } from './tokenStorage';
import { refreshSessionTokens } from './session';
import { ensureValidAccessToken } from './proactiveRefresh';
import { endpoints } from '../constants';
import { getOrCreateDeviceId } from '../utils/deviceId';
import { attachApiError, extractApiErrorPayload } from '../utils/apiError';
import { attachRetryInterceptor } from '../utils/apiRetry';
import { apiTimeoutMs } from './connectivityBridge';
import { attachApiDiagnostics } from './apiDiagnosticsInterceptors';
import i18n from '../i18n';

export const api = axios.create({ baseURL: endpoints.baseURL, timeout: 8000 });
attachRetryInterceptor(api);
attachApiDiagnostics(api);

export const publicApi = axios.create({
  baseURL: endpoints.baseURL,
  timeout: 20000,
});
attachRetryInterceptor(publicApi, 5);
attachApiDiagnostics(publicApi);

const applyAdaptiveTimeout = (config: { timeout?: number; url?: string }) => {
  const t = apiTimeoutMs();
  const isFeed =
    config.url?.includes('/bootstrap') ||
    config.url?.includes('/feed') ||
    config.url?.includes('/property-sales/public');
  config.timeout = isFeed ? Math.max(t, 25_000) : t;
};

publicApi.interceptors.request.use(async (config) => {
  applyAdaptiveTimeout(config);
  return config;
});

publicApi.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject(attachApiError(error)),
);

api.interceptors.request.use(async (config) => {
  applyAdaptiveTimeout(config);
  try {
    const token = await ensureValidAccessToken();
    let phoneNumber: string | undefined;
    const parsed = await getStoredUser();
    if (parsed) phoneNumber = parsed.phoneNumber;

    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    const locale = (i18n.language || 'en').split('-')[0];
    config.headers = config.headers ?? {};
    (config.headers as any)['X-App-Locale'] = locale;
    
    // Add device ID and phone number headers for view tracking (even for anonymous users)
    try {
      const deviceId = await getOrCreateDeviceId();
      if (deviceId) {
        config.headers = config.headers ?? {};
        (config.headers as any)['X-Device-ID'] = deviceId;
      }
      if (phoneNumber) {
        config.headers = config.headers ?? {};
        (config.headers as any)['X-Phone-Number'] = phoneNumber;
      }
    } catch (err) {
      // Device ID fetch failed, continue without it
    }
  } catch {}
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const drainQueue = (err: unknown, token: string | null) => {
  pendingQueue.forEach((p) => (err ? p.reject(err) : p.resolve(token!)));
  pendingQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    attachApiError(error);

    // Never treat transport failures as auth failures.
    const code = String(error?.code ?? "");
    if (
      !error?.response &&
      (code === "ECONNABORTED" ||
        code === "ERR_NETWORK" ||
        code === "NETWORK_ERROR")
    ) {
      return Promise.reject(error);
    }

    const original = error.config || {};
    if (
      error?.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/refresh")
    ) {
      // Only refresh on explicit TOKEN_EXPIRED (or legacy header), not on real auth failures.
      const payload = extractApiErrorPayload(error?.response?.data);
      const code = String(
        payload?.code ?? (error?.response?.data as { code?: string })?.code ?? "",
      );
      const tokenExpiredHeader = String(error?.response?.headers?.["x-token-expired"] || "").toLowerCase() === "true";
      if (code && code !== "TOKEN_EXPIRED" && code !== "AUTH_TOKEN_EXPIRED" && code !== "NO_TOKEN" && code !== "AUTH_NO_TOKEN") {
        return Promise.reject(error);
      }
      if ((code === "NO_TOKEN" || code === "AUTH_NO_TOKEN") && !tokenExpiredHeader) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (t) => {
              original.headers = original.headers ?? {};
              (original.headers as any).Authorization = `Bearer ${t}`;
              api(original).then(resolve).catch(reject);
            },
            reject,
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshed = await refreshSessionTokens();
        const newAccess = refreshed?.accessToken;
        if (!newAccess) throw error;
        drainQueue(null, newAccess);
        original.headers = original.headers ?? {};
        (original.headers as any).Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (e) {
        drainQueue(e, null);
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);


