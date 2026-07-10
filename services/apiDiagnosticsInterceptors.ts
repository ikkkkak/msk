import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import {
  captureApiCaller,
  recordApiCall,
} from "./apiDiagnostics";

type TimedConfig = InternalAxiosRequestConfig & {
  __diagStart?: number;
  __diagCaller?: string;
};

export function attachApiDiagnostics(client: AxiosInstance): void {
  client.interceptors.request.use((config: TimedConfig) => {
    config.__diagStart = Date.now();
    config.__diagCaller =
      (config.headers?.["X-Client-Source"] as string) || captureApiCaller();
    return config;
  });

  client.interceptors.response.use(
    (res) => {
      const cfg = res.config as TimedConfig;
      const start = cfg.__diagStart ?? Date.now();
      recordApiCall({
        method: (cfg.method ?? "GET").toUpperCase(),
        url: cfg.url ?? "",
        status: res.status,
        durationMs: Date.now() - start,
        ok: res.status < 400,
        source: "axios",
        caller: cfg.__diagCaller,
      });
      return res;
    },
    (error) => {
      const cfg = (error?.config ?? {}) as TimedConfig;
      const start = cfg.__diagStart ?? Date.now();
      const status = error?.response?.status;
      recordApiCall({
        method: (cfg.method ?? "GET").toUpperCase(),
        url: cfg.url ?? "",
        status,
        durationMs: Date.now() - start,
        ok: false,
        source: "axios",
        caller: cfg.__diagCaller,
        error:
          error?.message ??
          (status ? `HTTP ${status}` : "network error"),
      });
      return Promise.reject(error);
    },
  );
}
