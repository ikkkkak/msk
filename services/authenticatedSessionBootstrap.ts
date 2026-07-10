/**
 * Enterprise session bootstrap: after login / token restore, hydrate user + prefetch
 * all authenticated React Query caches so tabs open instantly (no pull-to-refresh).
 */

import type { QueryClient } from "@tanstack/react-query";
import axios from "axios";
import { endpoints, queryKeys } from "../constants";
import type { User } from "../types/user";
import { api } from "./api";
import { fetchVideoFeedPage } from "./videoFeedFetcher";
import { getOrCreateDeviceId } from "../utils/deviceId";
import { messagingWs } from "./messagingWs";
import { updateDeviceRegistrationOnLogin } from "./deviceRegistration";
import { tokenStorage } from "./tokenStorage";
import { emitAuthSessionReady } from "./authEvents";
import { prefetchMessagingInbox } from "./messagingInboxPrefetch";
import { runAppBootstrap } from "./appBootstrap";
import { videoFeedQueryKey } from "./videoFeedQueryKey";
import { resolveInitialFeedQuality } from "./networkQuality";

const BOOTSTRAP_TIMEOUT_MS = 20_000;

type BootstrapOpts = {
  lang?: string;
  deviceId?: string | null;
};

/** Fresh account fields from GET /user/:id (saved IDs, role, notifications). */
export async function hydrateUserFromServer(user: User): Promise<User> {
  try {
    const { data } = await api.get(endpoints.getUser(user.ID));
    const saved =
      data?.savedProperties ??
      data?.SavedProperties ??
      user.savedProperties ??
      [];
    const savedExp =
      data?.savedExperiences ??
      data?.SavedExperiences ??
      user.savedExperiences ??
      [];
    return {
      ...user,
      firstName: data?.firstName ?? user.firstName,
      lastName: data?.lastName ?? user.lastName,
      email: data?.email ?? user.email,
      phoneNumber: data?.phoneNumber ?? user.phoneNumber,
      role: data?.role ?? user.role,
      allowsNotifications:
        data?.allowsNotifications ?? user.allowsNotifications,
      savedProperties: Array.isArray(saved) ? saved : user.savedProperties,
      savedExperiences: Array.isArray(savedExp)
        ? savedExp
        : user.savedExperiences,
    };
  } catch (e) {
    if (__DEV__) {
      console.warn("[sessionBootstrap] hydrateUserFromServer failed", e);
    }
    return user;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("bootstrap timeout")), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

/**
 * Prefetch authenticated data into React Query. Safe to call on login and cold start.
 */
export async function bootstrapAuthenticatedSession(
  queryClient: QueryClient,
  user: User,
  opts: BootstrapOpts = {},
): Promise<User> {
  if (!user?.ID || !user?.accessToken) {
    return user;
  }

  const lang = (opts.lang || "en").toLowerCase();
  const deviceId =
    opts.deviceId !== undefined
      ? opts.deviceId
      : await getOrCreateDeviceId().catch(() => null);

  tokenStorage.setAccess(user.accessToken, String(user.ID));
  messagingWs.connect(user.accessToken);
  updateDeviceRegistrationOnLogin(user.ID).catch(() => {});

  const hydrated = await hydrateUserFromServer(user);

  const feedQuality = await resolveInitialFeedQuality();
  void runAppBootstrap(queryClient, {
    useAuth: true,
    userId: hydrated.ID,
    lang,
  }).catch(() => {});

  // Inbox first — must complete before login/navigation feels "done" (do not wait on video feeds).
  try {
    await withTimeout(
      prefetchMessagingInbox(queryClient, hydrated),
      12_000,
    );
  } catch (e) {
    if (__DEV__) {
      console.warn("[sessionBootstrap] inbox prefetch failed", e);
    }
  }
  emitAuthSessionReady(hydrated.ID);

  const saleFeedKey = videoFeedQueryKey({
    tab: "sale",
    userId: hydrated.ID,
    lang,
    feedQuality,
  });
  const rentFeedKey = videoFeedQueryKey({
    tab: "rent",
    userId: hydrated.ID,
    lang,
    feedQuality,
  });

  const hasSaleFeed = Boolean(
    queryClient.getQueryData<{ pages?: Array<{ videos?: unknown[] }> }>(
      saleFeedKey,
    )?.pages?.[0]?.videos?.length,
  );

  const deferredTasks: Array<Promise<unknown>> = [
    queryClient.prefetchQuery({
      queryKey: ["savedProperties"],
      queryFn: () =>
        api.get("/user/wishlist").then((r) => r.data?.properties ?? []),
    }),
    queryClient.prefetchQuery({
      queryKey: ["savedPropertySales"],
      queryFn: () =>
        api
          .get("/user/wishlist/property-sales")
          .then((r) => r.data?.properties ?? r.data ?? []),
    }),
    queryClient.prefetchQuery({
      queryKey: ["savedLandmarks"],
      queryFn: () =>
        api.get("/user/wishlist/landmarks").then((r) => r.data?.landmarks ?? []),
    }),
    queryClient.prefetchQuery({
      queryKey: ["user", hydrated.ID],
      queryFn: () => api.get(endpoints.getUser(hydrated.ID)).then((r) => r.data),
    }),
    queryClient.prefetchQuery({
      queryKey: ["userProfile"],
      queryFn: () => api.get("/user/profile").then((r) => r.data),
    }),
    queryClient.prefetchQuery({
      queryKey: ["host-studio"],
      queryFn: () =>
        import("../hooks/queries/useHostStudioQuery").then((m) =>
          m.fetchHostStudio(),
        ),
    }),
    queryClient.prefetchQuery({
      queryKey: [...queryKeys.myProperties, hydrated.ID],
      queryFn: () =>
        api.get(`/property/userid/${hydrated.ID}`).then((r) => r.data),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.contactedProperties,
      queryFn: () =>
        axios
          .get(endpoints.getContactedPropertiesByUserID(hydrated.ID), {
            headers: { Authorization: `Bearer ${hydrated.accessToken}` },
          })
          .then((r) => r.data ?? []),
    }),
    queryClient.prefetchQuery({
      queryKey: ["user-organization"],
      queryFn: () =>
        api
          .get(endpoints.organization)
          .then((r) => r.data?.organization ?? null),
    }),
    queryClient.prefetchQuery({
      queryKey: ["user-properties", hydrated.ID],
      queryFn: () =>
        api
          .get(endpoints.propertySales)
          .then((r) =>
            Array.isArray(r?.data?.properties) ? r.data.properties : [],
          ),
    }),
    queryClient.prefetchQuery({
      queryKey: ["user-landmarks", hydrated.ID],
      queryFn: () =>
        api
          .get(`${endpoints.baseURL}/landmarks/organization`)
          .then((r) => (Array.isArray(r?.data?.landmarks) ? r.data.landmarks : [])),
    }),
    queryClient.prefetchQuery({
      queryKey: ["notifications"],
      queryFn: () =>
        api
          .get(endpoints.notifications)
          .then((r) => r.data?.notifications ?? []),
    }),
    queryClient.prefetchQuery({
      queryKey: ["host-reservations"],
      queryFn: () =>
        api.get("/apartment/host/reservations").then((r) => r.data ?? []),
    }),
  ];

  if (!hasSaleFeed) {
    deferredTasks.push(
      queryClient.prefetchInfiniteQuery({
        queryKey: saleFeedKey,
        queryFn: ({ pageParam }) =>
          fetchVideoFeedPage({
            tab: "sale",
            cursor: (pageParam as string | null) ?? null,
            limit: 8,
            lang,
            useAuth: true,
            skipCache: false,
            userId: hydrated.ID,
            deviceId: deviceId ?? undefined,
            feedQuality,
            fastFirstPage: pageParam == null,
          }),
        initialPageParam: null as string | null,
        getNextPageParam: (last: { nextCursor?: string | null }) =>
          last?.nextCursor ?? undefined,
      }),
    );
  }

  deferredTasks.push(
    queryClient.prefetchInfiniteQuery({
      queryKey: rentFeedKey,
      queryFn: ({ pageParam }) =>
        fetchVideoFeedPage({
          tab: "rent",
          cursor: (pageParam as string | null) ?? null,
          limit: 8,
          lang,
          useAuth: true,
          skipCache: false,
          userId: hydrated.ID,
          deviceId: deviceId ?? undefined,
          feedQuality,
          fastFirstPage: pageParam == null,
        }),
      initialPageParam: null as string | null,
      getNextPageParam: (last: { nextCursor?: string | null }) =>
        last?.nextCursor ?? undefined,
    }),
  );

  const allDeferredTasks = deferredTasks;
  void Promise.allSettled([
    withTimeout(Promise.all(allDeferredTasks), BOOTSTRAP_TIMEOUT_MS),
  ]).then((results) => {
    if (__DEV__) {
      const failed = results.filter((r) => r.status === "rejected").length;
      console.log(
        `[sessionBootstrap] deferred user=${hydrated.ID} tasks=${allDeferredTasks.length} failed=${failed}`,
      );
    }
  });

  return hydrated;
}
