import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchHostShareConsent,
  updateHostShareConsent
} from "../services/hostShareConsent";
import {
  hostShareConsentStorage,
  type HostShareConsentCache
} from "../constants/hostShareConsentStorage";

export type HostShareConsentState = {
  loading: boolean;
  hasDecided: boolean;
  accepted: boolean;
  lockedHostId: number | null;
  maxBuyersPerProperty: number;
};

const defaultState: HostShareConsentState = {
  loading: true,
  hasDecided: false,
  accepted: false,
  lockedHostId: null,
  maxBuyersPerProperty: 5
};

function fromCache(c: HostShareConsentCache): HostShareConsentState {
  return {
    loading: false,
    hasDecided: c.hasDecided,
    accepted: c.shareProfileWithHosts,
    lockedHostId: c.lockedHostId ?? null,
    maxBuyersPerProperty: 5
  };
}

function fromApi(data: {
  share_profile_with_hosts: boolean;
  has_decided: boolean;
  locked_host_id?: number | null;
  max_buyers_per_property?: number;
}): HostShareConsentState {
  return {
    loading: false,
    hasDecided: data.has_decided,
    accepted: data.share_profile_with_hosts,
    lockedHostId: data.locked_host_id ?? null,
    maxBuyersPerProperty: data.max_buyers_per_property ?? 5
  };
}

export function useHostShareConsent(enabled: boolean) {
  const [state, setState] = useState<HostShareConsentState>(defaultState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const persist = useCallback(async (next: HostShareConsentState) => {
    await hostShareConsentStorage.set({
      shareProfileWithHosts: next.accepted,
      hasDecided: next.hasDecided,
      lockedHostId: next.lockedHostId,
      syncedAt: new Date().toISOString()
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setState({ ...defaultState, loading: false });
      return;
    }
    setError(null);
    try {
      const cached = await hostShareConsentStorage.get();
      if (cached && mounted.current) {
        setState(fromCache(cached));
      }
      const data = await fetchHostShareConsent();
      if (!mounted.current) return;
      const next = fromApi(data);
      setState(next);
      await persist(next);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        if (mounted.current) {
          setState({
            loading: false,
            hasDecided: false,
            accepted: false,
            lockedHostId: null,
            maxBuyersPerProperty: 5
          });
        }
        return;
      }
      if (mounted.current) {
        setState((s) => ({ ...s, loading: false }));
        setError("load_failed");
      }
    }
  }, [enabled, persist]);

  useEffect(() => {
    mounted.current = true;
    if (!enabled) {
      hostShareConsentStorage.clear().catch(() => {});
      setState({ ...defaultState, loading: false });
      return () => {
        mounted.current = false;
      };
    }
    refresh();
    return () => {
      mounted.current = false;
    };
  }, [refresh, enabled]);

  const setConsent = useCallback(
    async (accepted: boolean) => {
      if (!enabled) return;
      setSaving(true);
      setError(null);
      try {
        const data = await updateHostShareConsent(accepted);
        const next = fromApi(data);
        setState(next);
        await persist(next);
      } catch {
        setError("save_failed");
        throw new Error("save_failed");
      } finally {
        if (mounted.current) setSaving(false);
      }
    },
    [enabled, persist]
  );

  return {
    ...state,
    saving,
    error,
    refresh,
    setConsent,
    shouldPromptSheet: enabled && !state.loading && !state.hasDecided
  };
}
