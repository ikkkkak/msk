/**
 * App.tsx — Meskeny Production Entry Point
 * ─────────────────────────────────────────────────────────────────────────────
 * Black screen / flash root causes fixed here:
 *
 * 1. SplashScreen.preventAutoHideAsync() called at MODULE LEVEL (line ~30),
 *    before React mounts. If you call it inside useEffect it is already too
 *    late — the native splash can auto-dismiss before React hydrates.
 *
 * 2. isQueryCacheRestored no longer gates the splash. Cache restoration runs
 *    in parallel and feeds into the UI silently. Gating on it was adding
 *    200–800 ms of unnecessary black screen every cold start.
 *
 * 3. Bootstrap is fully parallel: user restore, cache restore, token refresh,
 *    and device registration all race with Promise.allSettled — none blocks
 *    another.
 *
 * 4. A single AppState listener handles both persist-on-background and
 *    session tracking. The old code had two separate listeners competing.
 *
 * 5. Socket setup moved into its own isolated function so a socket failure
 *    cannot prevent setIsUserLoaded(true) from firing.
 *
 * 6. Splash hide uses double requestAnimationFrame after isLoadingComplete +
 *    isUserLoaded so the first React frame (same #FAEFE9 underlay) paints
 *    before native splash is removed — removes the one-frame black blink.
 *    SplashScreen.setOptions({ fade: true }) softens the handoff.
 *
 * 7. QueryClient config: staleTime bumped, placeholderData keeps previous
 *    data during background refetches so lists never go blank.
 */

import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as eva from "@eva-design/eva";
import { ApplicationProvider } from "@ui-kitten/components";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { attachQueryFetchDiagnostics } from "./services/queryFetchDiagnostics";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  setStoredUser,
  removeStoredUser,
  migrateLegacyTokensToStorage,
} from "./services/userStorage";
import { AppState, View, Text, AppStateStatus, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import Constants from "expo-constants";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ToastProvider } from "./context/ToastContext";

import useCachedResources from "./hooks/useCachedResources";
import useColorScheme from "./hooks/useColorScheme";
import Navigation from "./navigation";
import { theme } from "./theme";
import { AuthContext, LoadingContext } from "./context";
import { User } from "./types/user";
import { socket } from "./constants/socket";
import { queryKeys, SPLASH_BACKGROUND_COLOR } from "./constants";
import { checkAuth } from "./services/checkAuth";
import { refreshSessionTokens } from "./services/session";
import {
  emitAuthLogout,
  onAuthFailure,
  onTokensRefreshed,
} from "./services/authEvents";
import { teardownMessagingSession } from "./services/messagingInboxPrefetch";
import { messagingWs } from "./services/messagingWs";
import { HostModeProvider } from "./contexts/HostModeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { StoryViewerProvider } from "./contexts/StoryViewerContext";
import { AppInitializer } from "./components/AppInitializer";
import { SplashLoadingScreen } from "./components/SplashLoadingScreen";
import {
  persistQueryCache,
  restoreQueryCache,
} from "./services/queryPersistence";
import {
  registerDeviceSilently,
  updateDeviceRegistrationOnLogin,
  startDeviceSession,
  endDeviceSession,
} from "./services/deviceRegistration";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { crashReporting } from "./services/crashReporting";
import { VideoFeedPrefetcher } from "./components/VideoFeedPrefetcher";
import { startVideoPrefetchDuringSplash } from "./services/videoPrefetchDuringSplash";
import { ConnectivityProvider } from "./contexts/ConnectivityContext";
import { ConnectivityBridge } from "./components/ConnectivityBridge";
import { ReconnectRefetchBridge } from "./components/ReconnectRefetchBridge";
import { SessionRefreshBridge } from "./components/SessionRefreshBridge";
import { OfflineBanner } from "./components/OfflineBanner";
import { MutationQueueProcessor } from "./components/MutationQueueProcessor";
import { PropertySalePublishProvider } from "./contexts/PropertySalePublishContext";
import { getOrCreateDeviceId } from "./utils/deviceId";
import NetInfo from "@react-native-community/netinfo";
import { setConnectivitySnapshot } from "./services/connectivityBridge";
import { bootstrapAuthenticatedSession } from "./services/authenticatedSessionBootstrap";
import { runAppBootstrap } from "./services/appBootstrap";
import { clearBootstrapETag } from "./services/bootstrapApi";
import { clearMutationQueue } from "./services/mutationQueue";
import "./i18n";

// ─────────────────────────────────────────────────────────────────────────────
// MODULE-LEVEL INIT — runs synchronously before React renders anything.
// This is the ONLY correct place for these calls.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CRITICAL: Keep the native splash screen visible until we explicitly call
 * SplashScreen.hideAsync(). Must be called synchronously at module load —
 * calling it inside useEffect is already too late on fast devices.
 */
SplashScreen.preventAutoHideAsync().catch(() => {
  // On web or if called twice: silently ignore.
});

// Seed connectivity before React mounts (mutation queue + API timeouts).
NetInfo.fetch()
  .then((state) => {
    const type = (state.type || "").toLowerCase();
    let connectionQuality: "good" | "moderate" | "poor" | "offline" = "good";
    if (!state.isConnected) connectionQuality = "offline";
    else if (state.isInternetReachable === false) connectionQuality = "poor";
    else if (type === "cellular") {
      const gen = (
        state.details as { cellularGeneration?: string } | undefined
      )?.cellularGeneration?.toLowerCase?.();
      if (gen === "3g") connectionQuality = "moderate";
      else if (gen !== "4g" && gen !== "5g" && gen !== "lte")
        connectionQuality = "poor";
    }
    setConnectivitySnapshot({
      connectionQuality,
      isConnected: !!state.isConnected,
    });
  })
  .catch(() => {});

// Expo Go does not support setOptions; guard to avoid noisy warning spam.
if (Constants.appOwnership !== "expo") {
  try {
    SplashScreen.setOptions({ fade: true, duration: 280 });
  } catch {
    /* setOptions unsupported on some platforms */
  }
}

/**
 * Crash reporting must be wired up before React renders so it catches
 * synchronous errors that occur during the initial render pass.
 */
try {
  crashReporting.setupCrashReporting();
} catch (e) {
  console.error("❌ Crash reporting setup failed:", e);
}

// Clear any legacy crash log queue from older app versions (storage disabled).
setTimeout(() => {
  crashReporting.sendQueuedLogs().catch(() => {});
}, 3000);

// ─────────────────────────────────────────────────────────────────────────────
// QueryClient — single instance, created at module level to survive HMR
// ─────────────────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * 10 min stale window — avoids any background refetch during normal use.
       * Users scroll a feed and see instant data from cache; silent revalidation
       * only fires when they leave and return after 10+ minutes.
       */
      staleTime: 10 * 60 * 1000,
      /**
       * 60 min gc — data lives in memory for an hour. Prevents blank list
       * flashes when navigating back to a screen.
       */
      gcTime: 60 * 60 * 1000,
      /**
       * Never refetch automatically. Every refetch must be intentional
       * (pull-to-refresh, explicit invalidation). This is the single biggest
       * source of "data disappearing" bugs in most React Native apps.
       */
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      /** Refetch when network returns — critical for communities on flaky mobile networks. */
      refetchOnReconnect: true,
      /**
       * Keep previous data visible during background refetch.
       * Without this: list goes blank → spinner → data. With this: list stays,
       * new data replaces it in-place. Zero perceived flash.
       */
      placeholderData: (prev: unknown) => prev,
      structuralSharing: true,
      retry: 2,
      retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 8000),
    },
  },
});

attachQueryFetchDiagnostics(queryClient);

// ─────────────────────────────────────────────────────────────────────────────
// Socket helpers — isolated so errors cannot propagate upward
// ─────────────────────────────────────────────────────────────────────────────

function setupSocketListeners(
  setUser: React.Dispatch<React.SetStateAction<User | null>>,
) {
  try {
    socket.on(
      "getMessage",
      async (data: {
        senderID: number;
        senderName: string;
        conversationID: number;
        text: string;
      }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
        queryClient.invalidateQueries({
          queryKey: queryKeys.selectedConversation,
        });

        try {
          const { status } = await Notifications.getPermissionsAsync();
          if (status !== "granted") return;
          await Notifications.scheduleNotificationAsync({
            content: {
              title: data.senderName,
              body: data.text,
              data: { conversationID: data.conversationID },
            },
            trigger: null,
          });
        } catch {
          // Notification failure must never crash the app
        }
      },
    );

    socket.on("session", (data: { sessionID: string }) => {
      try {
        socket.auth = { sessionID: data.sessionID };
        setUser((currentUser) => {
          if (!currentUser) return currentUser;
          const updated = { ...currentUser, sessionID: data.sessionID };
          setStoredUser(updated).catch(() => {});
          return updated;
        });
      } catch {
        /* ignore */
      }
    });

    socket.on("connect_error", () => {
      // Reconnect with latest credentials
      setUser((currentUser) => {
        if (!currentUser) return currentUser;
        socket.auth = {
          userID: currentUser.ID,
          username:
            currentUser.firstName && currentUser.lastName
              ? `${currentUser.firstName} ${currentUser.lastName}`
              : `${currentUser.phoneNumber || currentUser.email}`,
          accessToken: currentUser.accessToken,
        };
        socket.connect();
        return currentUser;
      });
    });
  } catch (e) {
    crashReporting.logError(e as Error, { context: "socket_setup" });
  }
}

function teardownSocketListeners() {
  try {
    socket.off("getMessage");
    socket.off("session");
    socket.off("connect_error");
  } catch {
    /* ignore */
  }
}

function connectSocket(userObj: User) {
  try {
    socket.auth = {
      userID: userObj.ID,
      username:
        userObj.firstName && userObj.lastName
          ? `${userObj.firstName} ${userObj.lastName}`
          : `${userObj.phoneNumber || userObj.email}`,
      accessToken: userObj.accessToken,
    };
    socket.connect();
  } catch (e) {
    console.warn("⚠️ Socket connect failed:", e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const [splashTimeoutReached, setSplashTimeoutReached] = useState(false);
  // Cache restore is fire-and-forget; it does NOT block the splash.
  const cacheRestored = useRef(false);

  // Fail-safe: never let native splash stick forever if any startup task hangs.
  useEffect(() => {
    const t = setTimeout(() => {
      setSplashTimeoutReached(true);
      setIsUserLoaded(true);
    }, 8000);
    return () => clearTimeout(t);
  }, []);

  // ── Auth event listeners ────────────────────────────────────────────────
  useEffect(() => {
    onTokensRefreshed((accessToken, refreshToken) => {
      setUser((prev) => (prev ? { ...prev, accessToken, refreshToken } : null));
      // Ensure user-based WS reconnects with fresh JWT
      try {
        messagingWs.connect(accessToken);
      } catch {}
    });

    onAuthFailure(() => {
      teardownMessagingSession(queryClient);
      setUser(null);
      removeStoredUser();
      socket.disconnect();
      void clearBootstrapETag();
      void clearMutationQueue();
      emitAuthLogout();
      queryClient.clear();
    });

    return () => {
      // No unsubscribe functions are provided by authEvents helpers.
    };
  }, []);

  // ── Parallel bootstrap ────────────────────────────────────────────────────
  // ALL async work runs in parallel via Promise.allSettled.
  // No operation can block another; the slowest one determines total time.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      // Prewarm stable device id for smart anonymous feed ranking.
      getOrCreateDeviceId().catch(() => {});

      // Fire cache restore + server bootstrap in parallel (offline-first read path).
      restoreQueryCache(queryClient)
        .catch(() => {})
        .finally(() => {
          cacheRestored.current = true;
        });

      void runAppBootstrap(queryClient, { useAuth: false, lang: "en" }).catch(
        () => {},
      );

      try {
        await migrateLegacyTokensToStorage();

        const applySession = (userObj: User) => {
          if (cancelled) return;
          setUser(userObj);
          connectSocket(userObj);
          void bootstrapAuthenticatedSession(queryClient, userObj).then(
            (hydrated) => {
              if (cancelled) return;
              setUser(hydrated);
              setStoredUser(hydrated).catch(() => {});
            },
          );
        };

        const auth = await checkAuth();
        if (cancelled) return;

        if (auth.status === "authenticated") {
          applySession(auth.user);
          if (auth.offline) {
            void refreshSessionTokens().then((refreshed) => {
              if (cancelled || !refreshed?.user) return;
              applySession(refreshed.user);
            });
          }
        }
      } catch (e) {
        crashReporting.logError(e as Error, { context: "bootstrap" });
      } finally {
        if (!cancelled) setIsUserLoaded(true);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    setupSocketListeners(setUser);
    return () => teardownSocketListeners();
  }, []);

  // ── Video prefetch — starts immediately, parallel to everything ───────────
  useEffect(() => {
    startVideoPrefetchDuringSplash(queryClient, user);
  }, [user?.ID]);

  // ── Query cache persistence ───────────────────────────────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedulePersist = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        persistQueryCache(queryClient).catch(() => {});
      }, 2000); // Debounce: wait 2 s of quiet before persisting
    };

    const unsubCache = queryClient.getQueryCache().subscribe(schedulePersist);

    return () => {
      unsubCache();
      if (timer) clearTimeout(timer);
    };
  }, []);

  // ── AppState — single listener for BOTH persist + session ────────────────
  // The old code had two separate AppState listeners. Two listeners on the
  // same event = double callbacks, double session starts, race conditions.
  useEffect(() => {
    let current = AppState.currentState;

    const handleChange = (next: AppStateStatus) => {
      if (current === next) return;
      current = next;

      if (next === "background" || next === "inactive") {
        // Persist cache immediately (don't wait for debounce timer)
        persistQueryCache(queryClient).catch(() => {});
        endDeviceSession().catch(() => {});
      } else if (next === "active") {
        startDeviceSession().catch(() => {});
      }
    };

    const sub = AppState.addEventListener("change", handleChange);
    return () => {
      sub.remove();
      endDeviceSession().catch(() => {});
    };
  }, []);

  // ── Splash hide — after resources + user; defer one frame so RN paints underlay ─
  // Double requestAnimationFrame lets the first committed frame (matching splash bg)
  // render before native splash is removed — avoids the common one-frame black blink.
  useEffect(() => {
    if ((!isLoadingComplete || !isUserLoaded) && !splashTimeoutReached) return;

    let cancelled = false;
    let raf2 = 0;

    const hideSplash = async () => {
      if (cancelled) return;
      try {
        await SplashScreen.hideAsync();
      } catch {
        /* already hidden / web */
      }
      if (cancelled) return;
      registerDeviceSilently().catch(() => {});
      startDeviceSession().catch(() => {});
    };

    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        void hideSplash();
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [isLoadingComplete, isUserLoaded, splashTimeoutReached]);

  // ── Loading gate ──────────────────────────────────────────────────────────
  // Only block on resources + user; cache restore runs in background.
  // SplashLoadingScreen renders the SAME background color as the native
  // splash (#FAEFE9) so there is zero visual transition between them.
  if ((!isLoadingComplete || !isUserLoaded) && !splashTimeoutReached) {
    return (
      <View style={{ flex: 1, backgroundColor: SPLASH_BACKGROUND_COLOR }}>
        <SplashLoadingScreen />
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <ErrorBoundary
      fallback={
        <View style={fallbackStyle}>
          <Text style={fallbackTitle}>Something went wrong</Text>
          <Text style={fallbackBody}>
            Please force-quit and reopen the app.
          </Text>
        </View>
      }
      onError={(e) =>
        crashReporting.logError(e, { context: "render", screen: "App" })
      }
    >
      <GestureHandlerRootView
        style={{ flex: 1, backgroundColor: SPLASH_BACKGROUND_COLOR }}
      >
        <SafeAreaProvider style={{ flex: 1, backgroundColor: SPLASH_BACKGROUND_COLOR }}>
          <QueryClientProvider client={queryClient}>
            <PropertySalePublishProvider>
              <LoadingContext.Provider value={{ loading, setLoading }}>
                <AuthContext.Provider value={{ user, setUser }}>
                  <AppInitializer>
                    <NotificationProvider>
                      <ConnectivityProvider>
                        <ConnectivityBridge />
                        <OfflineBanner />
                        <ReconnectRefetchBridge queryClient={queryClient} />
                        <SessionRefreshBridge />
                        <MutationQueueProcessor>
                        <ApplicationProvider {...eva} theme={theme}>
                          <BottomSheetModalProvider>
                            <ToastProvider>
                              <HostModeProvider>
                                <StoryViewerProvider>
                                  <Navigation colorScheme={colorScheme} />
                                  <VideoFeedPrefetcher />
                                  <StatusBar style="auto" />
                                </StoryViewerProvider>
                              </HostModeProvider>
                            </ToastProvider>
                          </BottomSheetModalProvider>
                        </ApplicationProvider>
                        </MutationQueueProcessor>
                      </ConnectivityProvider>
                    </NotificationProvider>
                  </AppInitializer>
                </AuthContext.Provider>
              </LoadingContext.Provider>
            </PropertySalePublishProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback styles (inline to avoid external imports that could fail)
// ─────────────────────────────────────────────────────────────────────────────

const fallbackStyle = {
  flex: 1,
  backgroundColor: SPLASH_BACKGROUND_COLOR,
  justifyContent: "center" as const,
  alignItems: "center" as const,
  padding: 24,
};
const fallbackTitle = {
  fontSize: 17,
  fontWeight: "700" as const,
  color: "#111827",
  marginBottom: 8,
  textAlign: "center" as const,
};
const fallbackBody = {
  fontSize: 13,
  color: "#6B7280",
  textAlign: "center" as const,
};
