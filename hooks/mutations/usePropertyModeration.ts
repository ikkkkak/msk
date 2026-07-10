import {
  useMutation,
  useQueryClient,
  UseMutateFunction,
  UseMutationOptions
} from "@tanstack/react-query";
import { api } from "../../services/api";
import { useUser } from "../useUser";

// Types for input and context
interface HidePropertyInput {
  propertyId: number;
  reason: string;
}
interface ModerationPrevSnapshot {
  key: unknown;
  data: unknown;
}
interface ModerationContext {
  prev?: ModerationPrevSnapshot[];
}

export const useHideProperty = () => {
  const { user } = useUser();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, reason }: HidePropertyInput) => {
      if (!user?.accessToken) throw new Error("AUTH_REQUIRED");
      const res = await api.post(
        `/properties/${propertyId}/hide`,
        { reason },
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      return res.data;
    },
    onMutate: async ({ propertyId }: HidePropertyInput) => {
      await qc.cancelQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          String(q.queryKey[0]).includes("searchProperties")
      });
      const snaps = qc
        .getQueriesData<unknown>({})
        .filter(
          ([key]) =>
            Array.isArray(key) &&
            String((key as any[])[0]).includes("searchProperties")
        );
      const prev: ModerationPrevSnapshot[] = snaps.map(([key, data]) => ({
        key,
        data
      }));
      snaps.forEach(([key, data]) => {
        if (Array.isArray(data)) {
          qc.setQueryData(
            key,
            (data as any[]).filter((p) => (p?.id ?? p?.ID) !== propertyId)
          );
        }
      });
      return { prev };
    },
    onError: (
      _err: unknown,
      _vars: HidePropertyInput,
      ctx?: ModerationContext
    ) => {
      ctx?.prev?.forEach((s) => qc.setQueryData(s.key, s.data));
    },
    onSettled: () => {
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          String(q.queryKey[0]).includes("searchProperties")
      });
    }
  });
};

interface ReportPropertyInput {
  propertyId: number;
  reason: string;
  description?: string;
}

export const useReportProperty = () => {
  const { user } = useUser();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, reason, description }: ReportPropertyInput) => {
      if (!user?.accessToken) throw new Error("AUTH_REQUIRED");
      const res = await api.post(
        `/properties/${propertyId}/report`,
        { reason, description },
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      return res.data;
    },
    onMutate: async ({ propertyId }: ReportPropertyInput) => {
      await qc.cancelQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          String(q.queryKey[0]).includes("searchProperties")
      });
      const snaps = qc
        .getQueriesData<unknown>({})
        .filter(
          ([key]) =>
            Array.isArray(key) &&
            String((key as any[])[0]).includes("searchProperties")
        );
      const prev: ModerationPrevSnapshot[] = snaps.map(([key, data]) => ({
        key,
        data
      }));
      snaps.forEach(([key, data]) => {
        if (Array.isArray(data)) {
          qc.setQueryData(
            key,
            (data as any[]).filter((p) => (p?.id ?? p?.ID) !== propertyId)
          );
        }
      });
      return { prev };
    },
    onError: (
      _err: unknown,
      _vars: ReportPropertyInput,
      ctx?: ModerationContext
    ) => {
      ctx?.prev?.forEach((s) => qc.setQueryData(s.key, s.data));
    },
    onSettled: () => {
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          String(q.queryKey[0]).includes("searchProperties")
      });
    }
  });
};

interface BlockHostInput {
  hostUserId: number;
  reason: string;
  description?: string;
}

export const useBlockHost = () => {
  const { user } = useUser();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ hostUserId, reason, description }: BlockHostInput) => {
      if (!user?.accessToken) throw new Error("AUTH_REQUIRED");
      const res = await api.post(
        `/users/${hostUserId}/flag`,
        { reason, description },
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      return res.data;
    },
    onMutate: async ({ hostUserId }: BlockHostInput) => {
      await qc.cancelQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          String(q.queryKey[0]).includes("searchProperties")
      });
      const snaps = qc
        .getQueriesData<unknown>({})
        .filter(
          ([key]) =>
            Array.isArray(key) &&
            String((key as any[])[0]).includes("searchProperties")
        );
      const prev: ModerationPrevSnapshot[] = snaps.map(([key, data]) => ({
        key,
        data
      }));
      snaps.forEach(([key, data]) => {
        if (Array.isArray(data)) {
          qc.setQueryData(
            key,
            (data as any[]).filter(
              (p) => (p?.host_id ?? p?.hostID ?? p?.HostID) !== hostUserId
            )
          );
        }
      });
      return { prev };
    },
    onError: (
      _err: unknown,
      _vars: BlockHostInput,
      ctx?: ModerationContext
    ) => {
      ctx?.prev?.forEach((s) => qc.setQueryData(s.key, s.data));
    },
    onSettled: () => {
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          String(q.queryKey[0]).includes("searchProperties")
      });
    }
  });
};
