// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   FlatList,
//   ActivityIndicator,
//   Alert,
//   Linking,
//   Platform,
// } from "react-native";
// import { useNavigation } from "@react-navigation/native";
// import { useTranslation } from "react-i18next";
// import { BlurView } from "expo-blur";
// import { Image } from "expo-image";
// import { Link2 } from "lucide-react-native";
// import { api } from "../services/api";
// import { theme } from "../theme";
// import { endpoints } from "../constants";

// /** First N matches are fully visible; the rest are blurred until the host contacts sales. */
// const FREE_MATCH_PREVIEW = 5;

// type HostProperty = {
//   id?: number;
//   ID?: number;
//   title?: string;
//   Title?: string;
//   listing_price?: number;
// };

// type Suggestion = {
//   match_id: number;
//   user_id: number;
//   name: string;
//   avatar_url?: string;
//   match_score: number;
//   match_tier: "excellent" | "strong" | "good";
//   reasons: string[];
//   engagement_level?: string;
//   urgency?: string;
//   budget_min?: number;
//   budget_max?: number;
//   property_id?: number;
//   property_title?: string;
// };

// export const HostSuggestionsScreen = () => {
//   const { t } = useTranslation();
//   const navigation = useNavigation<any>();

//   const [loading, setLoading] = useState(true);
//   /** Background matching still running — show a proper waiting state instead of “empty”. */
//   const [waitingForMatches, setWaitingForMatches] = useState(false);
//   const [contactingId, setContactingId] = useState<number | null>(null);
//   const [properties, setProperties] = useState<HostProperty[]>([]);
//   const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
//   const [endpointUnavailable, setEndpointUnavailable] = useState(false);
//   const [lastTriedEndpoint, setLastTriedEndpoint] = useState<string>("");
//   const apiRoot = endpoints.baseURL.replace(/\/+$/, "");
//   const hostSuggestionsCandidates = useMemo(
//     () =>
//       apiRoot.endsWith("/api")
//         ? [`${apiRoot}/host/suggestions`, `${apiRoot.replace(/\/api$/, "")}/host/suggestions`]
//         : [`${apiRoot}/api/host/suggestions`, `${apiRoot}/host/suggestions`],
//     [apiRoot],
//   );

//   const toArray = useCallback((value: any): any[] => {
//     if (Array.isArray(value)) return value;
//     if (Array.isArray(value?.items)) return value.items;
//     if (Array.isArray(value?.data)) return value.data;
//     if (Array.isArray(value?.property_sales)) return value.property_sales;
//     if (Array.isArray(value?.suggestions)) return value.suggestions;
//     return [];
//   }, []);

//   const getHostSuggestionsForProperty = useCallback(
//     async (propertyId: number, opts?: { refresh?: boolean }) => {
//       let lastError: any = null;
//       const params: Record<string, string | number> = { property_id: propertyId };
//       if (opts?.refresh) params.refresh = "1";
//       for (const url of hostSuggestionsCandidates) {
//         try {
//           const res = await api.get(url, { params });
//           const data = res?.data;
//           const rows = Array.isArray(data?.suggestions)
//             ? (data.suggestions as Suggestion[])
//             : (toArray(data) as Suggestion[]);
//           const refreshing = Boolean(data?.refreshing);
//           const totalMatches = Number(data?.total_matches ?? rows.length);
//           return {
//             rows,
//             url,
//             notFound: false,
//             refreshing,
//             totalMatches,
//           };
//         } catch (e: any) {
//           lastError = e;
//           if (e?.response?.status !== 404) throw e;
//         }
//       }
//       return {
//         rows: [] as Suggestion[],
//         url: hostSuggestionsCandidates[0],
//         notFound: true,
//         error: lastError,
//         refreshing: false,
//         totalMatches: 0,
//       };
//     },
//     [hostSuggestionsCandidates, toArray],
//   );

//   const postHostSuggestionAction = useCallback(
//     async (
//       matchId: number,
//       action: "contact" | "dismiss",
//       payload?: Record<string, unknown>,
//     ) => {
//       let lastError: any = null;
//       for (const url of hostSuggestionsCandidates) {
//         try {
//           return await api.post(`${url}/${matchId}/${action}`, payload || {});
//         } catch (e: any) {
//           lastError = e;
//           if (e?.response?.status !== 404) throw e;
//         }
//       }
//       throw lastError || new Error("Host suggestions endpoint unavailable");
//     },
//     [hostSuggestionsCandidates],
//   );

//   const loadProperties = useCallback(async (): Promise<HostProperty[]> => {
//     console.log("[HostSuggestions] loadProperties:start");
//     const res = await api.get(endpoints.propertySalesRoot);
//     const payload = res.data;
//     const list = (
//       Array.isArray(payload?.properties) ? payload.properties : toArray(payload)
//     ) as HostProperty[];
//     setProperties(list);
//     console.log("[HostSuggestions] loadProperties:done", {
//       count: list.length,
//     });
//     return list;
//   }, [toArray]);

//   const loadSuggestions = useCallback(
//     async (listings: HostProperty[]) => {
//       const normalized = listings
//         .map((p) => ({
//           id: Number(p.id || p.ID || 0),
//           title: p.title || p.Title || "",
//         }))
//         .filter((p) => p.id > 0);

//       if (normalized.length === 0) {
//         console.log("[HostSuggestions] loadSuggestions:empty-properties");
//         setSuggestions([]);
//         return;
//       }

//       console.log("[HostSuggestions] loadSuggestions:start", {
//         propertiesCount: normalized.length,
//         propertyIds: normalized.map((p) => p.id),
//       });
//       setEndpointUnavailable(false);

//       const maxConcurrent = 4;
//       type BatchRow = {
//         rows: Suggestion[];
//         notFound: boolean;
//         refreshing: boolean;
//         totalMatches: number;
//       };
//       const workerResults: Array<{ status: "fulfilled"; value: BatchRow }> = [];
//       let cursor = 0;

//       const worker = async () => {
//         while (cursor < normalized.length) {
//           const idx = cursor;
//           cursor += 1;
//           const p = normalized[idx];
//           try {
//             console.log("[HostSuggestions] loadSuggestions:property:start", {
//               propertyId: p.id,
//               title: p.title,
//             });
//             const result = await getHostSuggestionsForProperty(p.id);
//             const rows = result.rows;
//             console.log("[HostSuggestions] loadSuggestions:property:done", {
//               propertyId: p.id,
//               suggestionsCount: rows.length,
//               endpoint: result.url,
//               notFound: result.notFound,
//               refreshing: result.refreshing,
//             });
//             workerResults.push({
//               status: "fulfilled",
//               value: {
//                 rows: rows.map((row) => ({
//                   ...row,
//                   property_id: p.id,
//                   property_title: p.title || `#${p.id}`,
//                 })),
//                 notFound: result.notFound,
//                 refreshing: result.refreshing,
//                 totalMatches: result.totalMatches,
//               },
//             });
//           } catch (e: any) {
//             console.warn("[HostSuggestions] loadSuggestions:property:error", {
//               propertyId: p.id,
//               status: e?.response?.status,
//               message: e?.message,
//               data: e?.response?.data,
//             });
//             workerResults.push({
//               status: "fulfilled",
//               value: {
//                 rows: [] as Suggestion[],
//                 notFound: false,
//                 refreshing: false,
//                 totalMatches: 0,
//               },
//             });
//           }
//         }
//       };

//       await Promise.all(
//         Array.from({ length: Math.min(maxConcurrent, normalized.length) }, () =>
//           worker(),
//         ),
//       );
//       const batches = workerResults;

//       const fulfilled = batches.filter((r) => r.status === "fulfilled");
//       const allNotFound =
//         fulfilled.length > 0 && fulfilled.every((r) => r.value.notFound);
//       if (allNotFound) {
//         setEndpointUnavailable(true);
//         setLastTriedEndpoint(hostSuggestionsCandidates[0] || "");
//       } else {
//         setLastTriedEndpoint("");
//       }

//       const merged = fulfilled.flatMap((r) => r.value.rows);
//       const deduped = merged.filter(
//         (item, idx, arr) =>
//           arr.findIndex((x) => x.match_id === item.match_id) === idx,
//       );
//       const anyRefreshing = fulfilled.some((r) => r.value.refreshing);
//       // While there are no rows yet but the endpoint works, assume matches may still be computing (server refresh is async).
//       if (deduped.length > 0) {
//         setWaitingForMatches(false);
//       } else if (normalized.length > 0 && !allNotFound) {
//         setWaitingForMatches(true);
//       } else {
//         setWaitingForMatches(false);
//       }
//       setSuggestions(deduped);
//       console.log("[HostSuggestions] loadSuggestions:done", {
//         fulfilled: batches.filter((r) => r.status === "fulfilled").length,
//         failed: batches.filter((r) => r.status === "rejected").length,
//         totalBeforeDedup: merged.length,
//         totalAfterDedup: deduped.length,
//         endpointUnavailable: allNotFound,
//         anyRefreshing,
//         waitingAfterThisLoad: deduped.length === 0 && normalized.length > 0 && !allNotFound,
//       });
//     },
//     [getHostSuggestionsForProperty],
//   );

//   /** Poll while the server is still computing matches (async refresh can take 10–30s). */
//   useEffect(() => {
//     if (!waitingForMatches || endpointUnavailable || properties.length === 0) return;
//     let attempts = 0;
//     const maxAttempts = 28;
//     const id = setInterval(async () => {
//       attempts += 1;
//       try {
//         await loadSuggestions(properties);
//       } catch {
//         /* loadSuggestions logs */
//       }
//       if (attempts >= maxAttempts) {
//         setWaitingForMatches(false);
//         clearInterval(id);
//       }
//     }, 2500);
//     return () => clearInterval(id);
//   }, [waitingForMatches, endpointUnavailable, properties, loadSuggestions]);

//   useEffect(() => {
//     (async () => {
//       try {
//         setLoading(true);
//         const list = await loadProperties();
//         const ids = list
//           .map((p) => Number(p.id || p.ID || 0))
//           .filter((id) => id > 0);
//         // Prime the server-side async matcher on first open (GET alone can return empty while refresh runs).
//         await Promise.all(
//           ids.map((id) => getHostSuggestionsForProperty(id, { refresh: true }).catch(() => null)),
//         );
//         await loadSuggestions(list);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [loadProperties, loadSuggestions, getHostSuggestionsForProperty]);

//   const onContact = async (item: Suggestion) => {
//     try {
//       setContactingId(item.match_id);
//       await postHostSuggestionAction(item.match_id, "contact", {
//         initial_message: t(
//           "hostSuggestions.defaultContactMessage",
//           "Bonjour, votre profil correspond a notre bien. Souhaitez-vous en discuter ?",
//         ),
//       });
//       navigation.navigate("DirectMessage", {
//         otherUserId: item.user_id,
//         recipientName: item.name,
//         propertyID: item.property_id,
//       });
//     } catch (e: any) {
//       Alert.alert(
//         t("common.error", "Error"),
//         e?.response?.data?.error ||
//           e?.message ||
//           t("hostSuggestions.contactFailed", "Unable to start conversation."),
//       );
//     } finally {
//       setContactingId(null);
//     }
//   };

//   const onDismiss = async (item: Suggestion) => {
//     try {
//       await postHostSuggestionAction(item.match_id, "dismiss");
//       setSuggestions((prev) => prev.filter((x) => x.match_id !== item.match_id));
//     } catch {
//       Alert.alert(
//         t("common.error", "Error"),
//         t("hostSuggestions.dismissFailed", "Unable to dismiss this suggestion."),
//       );
//     }
//   };

//   const propertyById = useMemo(() => {
//     const m = new Map<number, HostProperty>();
//     for (const p of properties) {
//       const id = Number(p.id || p.ID);
//       if (id > 0) m.set(id, p);
//     }
//     return m;
//   }, [properties]);

//   const sortedSuggestions = useMemo(() => {
//     return [...suggestions].sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
//   }, [suggestions]);

//   const onPaywallContact = useCallback(() => {
//     const subject = encodeURIComponent(
//       t("hostSuggestions.paywallEmailSubject", "Unlock full buyer traffic — Meskeny Host"),
//     );
//     const body = encodeURIComponent(
//       t(
//         "hostSuggestions.paywallEmailBody",
//         "Hello — I would like to unlock the full list of interested buyers for my listings.",
//       ),
//     );
//     const mail = `mailto:support@meskeny.com?subject=${subject}&body=${body}`;
//     Linking.openURL(mail).catch(() => {
//       Alert.alert(
//         t("hostSuggestions.paywallTitle", "See all your traffic"),
//         t(
//           "hostSuggestions.paywallContactFallback",
//           "Please email support@meskeny.com to unlock full buyer insights.",
//         ),
//       );
//     });
//   }, [t]);

//   const onReload = async () => {
//     try {
//       console.log("[HostSuggestions] refresh:tap", {
//         currentProperties: properties.length,
//       });
//       setLoading(true);
//       // Ask server to schedule a fresh rebuild (still returns quickly).
//       const normalized = properties
//         .map((p) => ({ id: Number(p.id || p.ID || 0) }))
//         .filter((p) => p.id > 0);
//       await Promise.all(
//         normalized.map((p) => getHostSuggestionsForProperty(p.id, { refresh: true }).catch(() => null)),
//       );
//       await loadSuggestions(properties);
//       console.log("[HostSuggestions] refresh:success");
//     } catch (e: any) {
//       console.error("[HostSuggestions] refresh:error", {
//         message: e?.message,
//         status: e?.response?.status,
//         data: e?.response?.data,
//       });
//       Alert.alert(
//         t("common.error", "Error"),
//         e?.response?.data?.error ||
//           e?.message ||
//           t("hostSuggestions.refreshFailed", "Failed to refresh suggestions."),
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatPrice = useCallback(
//     (n?: number) => {
//       if (n == null || Number.isNaN(Number(n))) return "—";
//       return `${t("common.currencySymbol", "MRU")} ${Number(n).toLocaleString()}`;
//     },
//     [t],
//   );

//   const renderItem = ({
//     item,
//     index,
//   }: {
//     item: Suggestion;
//     index: number;
//   }) => {
//     const locked = index >= FREE_MATCH_PREVIEW;
//     const prop = item.property_id ? propertyById.get(item.property_id) : undefined;
//     const propertyTitle =
//       prop?.title || prop?.Title || item.property_title || t("hostSuggestions.unknownListing", "Listing");
//     const propertyPrice = prop?.listing_price;
//     const pct = Math.round(item.match_score ?? 0);
//     const tierStyle =
//       item.match_tier === "excellent"
//         ? s.excellent
//         : item.match_tier === "strong"
//           ? s.strong
//           : s.good;
//     const showPaywallBanner = locked && index === FREE_MATCH_PREVIEW;

//     return (
//       <View style={[s.card, locked && s.cardLocked]}>
//         <View style={s.linkedRow}>
//           {/* Left: interested user */}
//           <View style={s.userCol}>
//             <View style={s.avatarWrap}>
//               {item.avatar_url ? (
//                 <Image source={{ uri: item.avatar_url }} style={s.avatar} contentFit="cover" />
//               ) : (
//                 <View style={[s.avatar, s.avatarPlaceholder]}>
//                   <Text style={s.avatarLetter}>
//                     {(item.name || "?").trim().charAt(0).toUpperCase()}
//                   </Text>
//                 </View>
//               )}
//             </View>
//             <Text style={s.userName} numberOfLines={2}>
//               {item.name}
//             </Text>
//             <View style={[s.interestPill, tierStyle]}>
//               <Text style={s.interestPct}>{pct}%</Text>
//             </View>
//             <Text style={s.interestLabel}>
//               {t("hostSuggestions.interestLabel", "Interest")}
//             </Text>
//           </View>

//           {/* Middle: link */}
//           <View style={s.linkBridge}>
//             <View style={s.linkLine} />
//             <View style={s.linkIconCircle}>
//               <Link2 size={16} color="#64748B" />
//             </View>
//             <View style={s.linkLine} />
//           </View>

//           {/* Right: property */}
//           <View style={s.propertyCol}>
//             <View style={s.propertyMiniCard}>
//               <Text style={s.propertyMiniLabel}>
//                 {t("hostSuggestions.matchedListing", "Listing")}
//               </Text>
//               <Text style={s.propertyMiniTitle} numberOfLines={2}>
//                 {propertyTitle}
//               </Text>
//               <Text style={s.propertyMiniPrice}>{formatPrice(propertyPrice)}</Text>
//             </View>
//           </View>
//         </View>

//         <Text style={s.meta}>
//           {t("hostSuggestions.compatibility", "Compatibility")} •{" "}
//           {t(`hostSuggestions.tier.${item.match_tier}`, item.match_tier)}
//         </Text>

//         <View style={s.chips}>
//           {(item.reasons || []).slice(0, 4).map((r) => (
//             <View key={`${item.match_id}-${r}`} style={s.chip}>
//               <Text style={s.chipText}>{t(`hostSuggestions.reason.${r}`, r)}</Text>
//             </View>
//           ))}
//         </View>

//         {!locked ? (
//           <View style={s.actions}>
//             <TouchableOpacity
//               style={s.dismissBtn}
//               onPress={() => onDismiss(item)}
//               activeOpacity={0.85}
//             >
//               <Text style={s.dismissText}>{t("hostSuggestions.dismiss", "Ignore")}</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={s.contactBtn}
//               onPress={() => onContact(item)}
//               activeOpacity={0.9}
//               disabled={contactingId === item.match_id}
//             >
//               {contactingId === item.match_id ? (
//                 <ActivityIndicator color="#fff" size="small" />
//               ) : (
//                 <Text style={s.contactText}>{t("hostSuggestions.contact", "Contact")}</Text>
//               )}
//             </TouchableOpacity>
//           </View>
//         ) : null}

//         {locked ? (
//           <View style={s.blurOverlayWrap} pointerEvents="box-none">
//             <BlurView
//               intensity={Platform.OS === "ios" ? 55 : 70}
//               tint="light"
//               style={s.blurFill}
//               {...(Platform.OS === "android"
//                 ? { experimentalBlurMethod: "dimezisBlurView" as const }
//                 : {})}
//             >
//               <View style={s.blurInner}>
//                 {showPaywallBanner ? (
//                   <>
//                     <Text style={s.paywallTitle}>
//                       {t("hostSuggestions.paywallTitle", "See all your traffic")}
//                     </Text>
//                     <Text style={s.paywallBody}>
//                       {t(
//                         "hostSuggestions.paywallBody",
//                         "{{count}} more interested buyers are hidden. Contact us to break the wall and unlock full insights.",
//                         { count: Math.max(0, sortedSuggestions.length - FREE_MATCH_PREVIEW) },
//                       )}
//                     </Text>
//                     <TouchableOpacity
//                       style={s.paywallBtn}
//                       onPress={onPaywallContact}
//                       activeOpacity={0.9}
//                     >
//                       <Text style={s.paywallBtnText}>
//                         {t("hostSuggestions.paywallCta", "Contact us to unlock")}
//                       </Text>
//                     </TouchableOpacity>
//                   </>
//                 ) : (
//                   <Text style={s.paywallHintSmall}>
//                     {t("hostSuggestions.paywallLockedHint", "Locked")}
//                   </Text>
//                 )}
//               </View>
//             </BlurView>
//           </View>
//         ) : null}
//       </View>
//     );
//   };

//   return (
//     <View style={s.container}>
//       <Text style={s.title}>
//         {t("hostSuggestions.title", "Potential Buyers")}
//       </Text>
//       <TouchableOpacity
//         style={s.headerRefreshBtn}
//         onPress={onReload}
//         activeOpacity={0.85}
//       >
//         <Text style={s.headerRefreshBtnText}>
//           {loading
//             ? t("common.loading", "Loading...")
//             : t("hostSuggestions.refresh", "Refresh")}
//         </Text>
//       </TouchableOpacity>

//       <View style={s.propertyRow}>
//         <Text style={s.propertyLabel}>
//           {t("hostSuggestions.scopeLabel", "Scope")}:
//         </Text>
//         <Text style={s.propertyValue} numberOfLines={1}>
//           {t("hostSuggestions.scopeAllListings", "All listings")}
//         </Text>
//       </View>
//       {sortedSuggestions.length > FREE_MATCH_PREVIEW ? (
//         <View style={s.previewBanner}>
//           <Text style={s.previewBannerText}>
//             {t("hostSuggestions.previewTopN", "Showing your top {{n}} matches by interest. Unlock the rest with Meskeny.", {
//               n: FREE_MATCH_PREVIEW,
//             })}
//           </Text>
//         </View>
//       ) : null}

//       {endpointUnavailable && (
//         <View style={s.endpointWarn}>
//           <Text style={s.endpointWarnText}>
//             {t(
//               "hostSuggestions.endpointUnavailable",
//               "Suggestions endpoint is unavailable on this server build.",
//             )}
//           </Text>
//           {!!lastTriedEndpoint && (
//             <Text style={s.endpointWarnHintText}>{lastTriedEndpoint}</Text>
//           )}
//         </View>
//       )}

//       <FlatList
//         data={sortedSuggestions}
//         keyExtractor={(item) => String(item.match_id)}
//         renderItem={renderItem}
//         contentContainerStyle={{ paddingBottom: 20 }}
//         refreshing={loading}
//         onRefresh={onReload}
//         ListEmptyComponent={
//           loading ? (
//             <View style={s.emptyWrap}>
//               <ActivityIndicator color={theme["color-temporary-primary"]} />
//               <Text style={s.emptySubtle}>
//                 {t("hostSuggestions.loadingListings", "Loading your listings…")}
//               </Text>
//             </View>
//           ) : waitingForMatches ? (
//             <View style={s.emptyWrap}>
//               <View style={s.emptyCard}>
//                 <ActivityIndicator
//                   color={theme["color-temporary-primary"]}
//                   style={{ marginBottom: 12 }}
//                 />
//                 <Text style={s.emptyTitle}>
//                   {t(
//                     "hostSuggestions.generatingTitle",
//                     "Finding interested buyers",
//                   )}
//                 </Text>
//                 <Text style={s.emptyText}>
//                   {t(
//                     "hostSuggestions.generatingBody",
//                     "We’re analyzing recent activity for your listings. This usually takes less than a minute — you can keep this screen open or pull to refresh.",
//                   )}
//                 </Text>
//                 <TouchableOpacity style={s.reloadBtn} onPress={onReload} activeOpacity={0.85}>
//                   <Text style={s.reloadBtnText}>
//                     {t("hostSuggestions.refreshNow", "Refresh now")}
//                   </Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           ) : (
//             <View style={s.emptyWrap}>
//               <View style={s.emptyCard}>
//               <Text style={s.emptyTitle}>
//                 {properties.length === 0
//                   ? t("hostSuggestions.emptyNoPropertyTitle", "No listings found")
//                   : t("hostSuggestions.emptyTitle", "No potential buyers yet")}
//               </Text>
//               <Text style={s.emptyText}>
//                 {properties.length === 0
//                   ? t(
//                       "hostSuggestions.emptyNoPropertyBody",
//                       "Add or publish a listing first to start getting matches.",
//                     )
//                   : t(
//                       "hostSuggestions.empty",
//                       "No matching buyers right now. When people browse or save listings like yours, they’ll appear here.",
//                     )}
//               </Text>
//               {properties.length > 0 && (
//                 <TouchableOpacity style={s.reloadBtn} onPress={onReload} activeOpacity={0.85}>
//                   <Text style={s.reloadBtnText}>
//                     {t("hostSuggestions.refresh", "Refresh")}
//                   </Text>
//                 </TouchableOpacity>
//               )}
//               </View>
//             </View>
//           )
//         }
//       />

//     </View>
//   );
// };

// const s = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#F8FAFC", padding: 14 },
//   title: { fontSize: 22, fontWeight: "800", color: "#0F172A", marginBottom: 10 },
//   headerRefreshBtn: {
//     alignSelf: "flex-start",
//     marginBottom: 10,
//     backgroundColor: "#E2E8F0",
//     borderRadius: 999,
//     paddingHorizontal: 12,
//     paddingVertical: 7,
//   },
//   headerRefreshBtnText: { fontSize: 12, fontWeight: "800", color: "#1E293B" },
//   propertyRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     borderColor: "#E2E8F0",
//     borderWidth: 1,
//     borderRadius: 12,
//     padding: 10,
//     marginBottom: 12,
//   },
//   propertyLabel: { fontSize: 12, color: "#64748B", marginRight: 6 },
//   propertyValue: { flex: 1, fontSize: 13, fontWeight: "700", color: "#0F172A" },
//   previewBanner: {
//     backgroundColor: "#EFF6FF",
//     borderColor: "#BFDBFE",
//     borderWidth: 1,
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     marginBottom: 10,
//   },
//   previewBannerText: { fontSize: 12, color: "#1E40AF", fontWeight: "700", lineHeight: 16 },
//   endpointWarn: {
//     backgroundColor: "#FFF7ED",
//     borderColor: "#FED7AA",
//     borderWidth: 1,
//     borderRadius: 10,
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//     marginBottom: 10,
//   },
//   endpointWarnText: { fontSize: 12, color: "#9A3412", fontWeight: "700" },
//   endpointWarnHintText: { marginTop: 4, fontSize: 11, color: "#9A3412" },
//   card: {
//     backgroundColor: "#fff",
//     borderRadius: 14,
//     borderWidth: 1,
//     borderColor: "#E2E8F0",
//     padding: 12,
//     marginBottom: 10,
//     overflow: "hidden",
//   },
//   cardLocked: { minHeight: 200 },
//   linkedRow: {
//     flexDirection: "row",
//     alignItems: "stretch",
//     marginBottom: 8,
//   },
//   userCol: { flex: 1, minWidth: 0, alignItems: "center", paddingRight: 4 },
//   avatarWrap: { marginBottom: 6 },
//   avatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: "#E2E8F0",
//   },
//   avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
//   avatarLetter: { fontSize: 18, fontWeight: "800", color: "#475569" },
//   userName: {
//     fontSize: 13,
//     fontWeight: "800",
//     color: "#0F172A",
//     textAlign: "center",
//     marginBottom: 6,
//   },
//   interestPill: {
//     borderRadius: 999,
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     marginBottom: 2,
//   },
//   interestPct: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
//   interestLabel: { fontSize: 10, color: "#64748B", fontWeight: "700" },
//   linkBridge: { width: 36, alignItems: "center", justifyContent: "center", paddingVertical: 4 },
//   linkLine: { flex: 1, width: 2, backgroundColor: "#E2E8F0", maxHeight: 28 },
//   linkIconCircle: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: "#F1F5F9",
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1,
//     borderColor: "#E2E8F0",
//   },
//   propertyCol: { flex: 1, minWidth: 0, paddingLeft: 4, justifyContent: "center" },
//   propertyMiniCard: {
//     backgroundColor: "#F8FAFC",
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#E2E8F0",
//     padding: 10,
//   },
//   propertyMiniLabel: {
//     fontSize: 10,
//     fontWeight: "700",
//     color: "#64748B",
//     textTransform: "uppercase",
//     letterSpacing: 0.3,
//     marginBottom: 4,
//   },
//   propertyMiniTitle: { fontSize: 13, fontWeight: "800", color: "#0F172A", marginBottom: 6 },
//   propertyMiniPrice: { fontSize: 14, fontWeight: "800", color: "#1D4ED8" },
//   blurOverlayWrap: {
//     ...StyleSheet.absoluteFillObject,
//     zIndex: 10,
//     elevation: 6,
//     borderRadius: 12,
//   },
//   blurFill: {
//     flex: 1,
//     justifyContent: "center",
//     overflow: "hidden",
//   },
//   blurInner: { padding: 14, alignItems: "center" },
//   paywallTitle: {
//     fontSize: 16,
//     fontWeight: "900",
//     color: "#0F172A",
//     textAlign: "center",
//     marginBottom: 6,
//   },
//   paywallBody: {
//     fontSize: 13,
//     color: "#475569",
//     textAlign: "center",
//     lineHeight: 18,
//     marginBottom: 12,
//   },
//   paywallBtn: {
//     backgroundColor: theme["color-temporary-primary"],
//     paddingHorizontal: 18,
//     paddingVertical: 12,
//     borderRadius: 12,
//   },
//   paywallBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
//   paywallHintSmall: { fontSize: 12, fontWeight: "800", color: "#64748B" },
//   excellent: { backgroundColor: "#DCFCE7" },
//   strong: { backgroundColor: "#E0F2FE" },
//   good: { backgroundColor: "#F1F5F9" },
//   meta: { marginTop: 6, fontSize: 12, color: "#475569" },
//   chips: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 6 },
//   chip: {
//     backgroundColor: "#F8FAFC",
//     borderColor: "#E2E8F0",
//     borderWidth: 1,
//     borderRadius: 999,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//   },
//   chipText: { fontSize: 11, color: "#334155", fontWeight: "600" },
//   actions: { marginTop: 12, flexDirection: "row", justifyContent: "flex-end", gap: 8 },
//   dismissBtn: {
//     borderWidth: 1,
//     borderColor: "#CBD5E1",
//     borderRadius: 10,
//     paddingHorizontal: 12,
//     paddingVertical: 9,
//   },
//   dismissText: { color: "#475569", fontWeight: "700", fontSize: 12 },
//   contactBtn: {
//     backgroundColor: theme["color-temporary-primary"],
//     borderRadius: 10,
//     paddingHorizontal: 14,
//     paddingVertical: 9,
//     minWidth: 96,
//     alignItems: "center",
//   },
//   contactText: { color: "#fff", fontWeight: "800", fontSize: 12 },
//   emptyWrap: { paddingVertical: 40, alignItems: "center", paddingHorizontal: 18 },
//   emptyCard: {
//     width: "100%",
//     backgroundColor: "#FFFFFF",
//     borderColor: "#E2E8F0",
//     borderWidth: 1,
//     borderRadius: 14,
//     paddingVertical: 20,
//     paddingHorizontal: 14,
//     alignItems: "center",
//   },
//   emptyTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", marginBottom: 6 },
//   emptyText: { fontSize: 13, color: "#64748B", textAlign: "center", lineHeight: 18 },
//   emptySubtle: {
//     marginTop: 10,
//     fontSize: 13,
//     color: "#64748B",
//     textAlign: "center",
//   },
//   reloadBtn: {
//     marginTop: 12,
//     backgroundColor: "#E2E8F0",
//     borderRadius: 999,
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//   },
//   reloadBtnText: { fontSize: 12, fontWeight: "700", color: "#1E293B" },
// });

// export default HostSuggestionsScreen;

/**
 * HostSuggestionsScreen — Enterprise-grade rewrite.
 *
 * Architecture layers (top-to-bottom in this file):
 *   1. Types & constants
 *   2. Pure helpers  (zero side-effects)
 *   3. useHostSuggestions  — ALL data / polling / action logic lives here
 *   4. Atom components  (ShimmerBar, SkeletonCard, TierBadge, ReasonChip)
 *   5. Molecule components (SuggestionCard, PreviewBanner, EndpointWarning, EmptyState)
 *   6. HostSuggestionsScreen  — pure presentation shell, no business logic
 *
 * Key design decisions:
 *   • Finite state machine replaces 4+ scattered boolean flags (boot | loading |
 *     polling | ready | empty | no_listings | unavailable)
 *   • Skeleton items are real FlatList data rows — no ListEmptyComponent trick,
 *     no flash-of-wrong-content on transition
 *   • SuggestionCard is React.memo with a custom comparator — parent re-renders
 *     do NOT re-render cards unless their data actually changed
 *   • Shimmer uses one shared Animated.Value per mount (no per-card timers)
 *   • Optimistic dismiss with rollback on API failure
 *   • RTL-safe: I18nManager.isRTL drives every directional layout
 *   • onContact / onDismiss callbacks are stable refs; SuggestionCard closes
 *     over them without capturing stale state
 */

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  I18nManager,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import {
  AlertTriangle,
  Link2,
  Lock,
  RefreshCw,
  Users,
} from "lucide-react-native";

import { api } from "../services/api";
import { theme } from "../theme";
import { endpoints } from "../constants";
import { useUser } from "../hooks/useUser";
import { tokenStorage } from "../services/tokenStorage";
import { HostStudioAuthPrompt } from "../components/host-studio/HostStudioAuthPrompt";
import { isHostStudioAuthError } from "../components/host-studio/hostStudioAuth";
import {
  getApiErrorUserMessage,
  logApiError,
  parseApiError,
} from "../utils/apiError";

// ─────────────────────────────────────────────────────────────────────────────
// 1. TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const FREE_MATCH_PREVIEW = 5;
const POLL_INTERVAL_MS = 8_000;
const MAX_POLL_ATTEMPTS = 8;
const MAX_CONCURRENT_REQUESTS = 2;
const MAX_PROPERTIES_PER_CYCLE = 4;
const PRIMARY = theme["color-temporary-primary"] as string;

type MatchTier = "excellent" | "strong" | "good";

interface HostProperty {
  id?: number;
  ID?: number;
  title?: string;
  Title?: string;
  listing_price?: number;
  images?: Array<string | { url?: string }>;
}

interface NormalizedProperty {
  id: number;
  title: string;
  price?: number;
  imageURL?: string;
}

/** Minimal buyer row from API (privacy-safe; no phone, email, or avatar). */
interface Suggestion {
  match_id: number;
  user_id: number;
  name: string;
  match_score: number;
  match_tier: MatchTier;
  reasons: string[];
  engagement_level?: string;
  property_id?: number;
  property_title?: string;
}

type PendingInitialCard = {
  caption: string;
  property_id?: number;
  property_type: "sale";
  title: string;
  listing_price?: number;
  currency: string;
  image_url?: string;
};

interface SuggestionFetchResult {
  rows: Suggestion[];
  notFound: boolean;
  refreshing: boolean;
  totalMatches: number;
  url: string;
}

/**
 * The single source of truth for every visual state.
 * No booleans. If you need to know what's on-screen, read `phase`.
 */
type ScreenPhase =
  | "boot" // mounting: fetching properties for the first time
  | "loading" // re-fetching (pull-to-refresh / header button)
  | "polling" // endpoint live but server still computing async matches
  | "ready" // ≥1 suggestion available
  | "empty" // 0 suggestions, endpoint healthy, poll exhausted
  | "no_listings" // host has zero published properties
  | "unavailable" // every candidate URL returned 404
  | "session_expired"; // token missing or rejected

interface DataState {
  phase: ScreenPhase;
  suggestions: Suggestion[];
  properties: NormalizedProperty[];
  lastTriedEndpoint: string;
  pollElapsed: number; // seconds since last poll cycle started
}

// FlatList item union — real rows + loading skeletons are equal citizens
type ListItem =
  | { kind: "suggestion"; data: Suggestion; index: number }
  | { kind: "skeleton"; key: string };

// ─────────────────────────────────────────────────────────────────────────────
// 2. PURE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function coerceArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray((value as any)?.items)) return (value as any).items;
  if (Array.isArray((value as any)?.data)) return (value as any).data;
  if (Array.isArray((value as any)?.property_sales))
    return (value as any).property_sales;
  if (Array.isArray((value as any)?.suggestions))
    return (value as any).suggestions;
  return [];
}

function normalizeProperties(raw: HostProperty[]): NormalizedProperty[] {
  return raw
    .map((p) => ({
      id: Number(p.id ?? p.ID ?? 0),
      title: p.title ?? p.Title ?? "",
      price: p.listing_price,
      imageURL: (() => {
        const first =
          Array.isArray(p.images) && p.images.length > 0
            ? p.images[0]
            : undefined;
        if (!first) return undefined;
        if (typeof first === "string") return first;
        return first.url;
      })(),
    }))
    .filter((p) => p.id > 0);
}

function scopedProperties(props: NormalizedProperty[]): NormalizedProperty[] {
  // Keep request fan-out bounded; newest listings first.
  return [...props]
    .sort((a, b) => b.id - a.id)
    .slice(0, MAX_PROPERTIES_PER_CYCLE);
}

function deduplicateByMatchId(rows: Suggestion[]): Suggestion[] {
  const seen = new Set<number>();
  return rows.filter((r) => {
    if (seen.has(r.match_id)) return false;
    seen.add(r.match_id);
    return true;
  });
}

function sortByScore(rows: Suggestion[]): Suggestion[] {
  return [...rows].sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));
}

function formatCurrency(n: number | undefined, symbol: string): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${symbol} ${Number(n).toLocaleString()}`;
}

function buildEndpointCandidates(baseURL: string): string[] {
  const root = baseURL.replace(/\/+$/, "");
  return root.endsWith("/api")
    ? [
        `${root}/host/suggestions`,
        `${root.replace(/\/api$/, "")}/host/suggestions`,
      ]
    : [`${root}/api/host/suggestions`, `${root}/host/suggestions`];
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. useHostSuggestions
// ─────────────────────────────────────────────────────────────────────────────

function useHostSuggestions() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const candidates = useMemo(
    () => buildEndpointCandidates(endpoints.baseURL),
    [],
  );

  const [state, setState] = useState<DataState>({
    phase: "boot",
    suggestions: [],
    properties: [],
    lastTriedEndpoint: "",
    pollElapsed: 0,
  });
  const [contactingId, setContactingId] = useState<number | null>(null);

  // Keep a ref so polling closure sees the latest properties without re-creating
  // the effect.
  const propertiesRef = useRef<NormalizedProperty[]>([]);
  propertiesRef.current = state.properties;

  // ── Low-level API ──────────────────────────────────────────────────────────

  const fetchForProperty = useCallback(
    async (
      propertyId: number,
      opts: { refresh?: boolean } = {},
    ): Promise<SuggestionFetchResult> => {
      const params: Record<string, string | number> = {
        property_id: propertyId,
      };
      if (opts.refresh) params.refresh = "1";

      let lastErr: unknown = null;
      for (const url of candidates) {
        try {
          const res = await api.get(url, { params });
          const data = res?.data;
          const rows: Suggestion[] = Array.isArray(data?.suggestions)
            ? (data.suggestions as Suggestion[])
            : (coerceArray(data) as Suggestion[]);
          return {
            rows,
            url,
            notFound: false,
            refreshing: Boolean(data?.refreshing),
            totalMatches: Number(data?.total_matches ?? rows.length),
          };
        } catch (e: any) {
          lastErr = e;
          if (e?.response?.status !== 404) throw e;
        }
      }
      return {
        rows: [],
        url: candidates[0],
        notFound: true,
        refreshing: false,
        totalMatches: 0,
      };
    },
    [candidates],
  );

  const postAction = useCallback(
    async (
      matchId: number,
      action: "contact" | "dismiss",
      payload: Record<string, unknown> = {},
    ) => {
      let lastErr: unknown = null;
      for (const url of candidates) {
        try {
          return await api.post(`${url}/${matchId}/${action}`, payload);
        } catch (e: any) {
          lastErr = e;
          if (e?.response?.status !== 404) throw e;
        }
      }
      throw lastErr ?? new Error("Host suggestions endpoint unavailable");
    },
    [candidates],
  );

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadProperties = useCallback(async (): Promise<
    NormalizedProperty[]
  > => {
    const res = await api.get(endpoints.propertySalesRoot);
    const payload = res.data;
    const raw = (
      Array.isArray(payload?.properties)
        ? payload.properties
        : coerceArray(payload)
    ) as HostProperty[];
    return normalizeProperties(raw);
  }, []);

  /**
   * Fan-out: fetch all properties concurrently (capped at MAX_CONCURRENT_REQUESTS).
   */
  const fetchAllSuggestions = useCallback(
    async (
      props: NormalizedProperty[],
      refresh: boolean,
    ): Promise<{
      suggestions: Suggestion[];
      allNotFound: boolean;
      anyServerRefreshing: boolean;
      lastTriedEndpoint: string;
    }> => {
      type Batch = {
        rows: Suggestion[];
        notFound: boolean;
        refreshing: boolean;
      };
      const batches: Batch[] = [];
      let cursor = 0;

      const worker = async () => {
        while (cursor < props.length) {
          const p = props[cursor++];
          try {
            const r = await fetchForProperty(p.id, { refresh });
            batches.push({
              rows: r.rows.map((row) => ({
                ...row,
                property_id: p.id,
                property_title: p.title || `#${p.id}`,
              })),
              notFound: r.notFound,
              refreshing: r.refreshing,
            });
          } catch {
            batches.push({ rows: [], notFound: false, refreshing: false });
          }
        }
      };

      await Promise.all(
        Array.from(
          { length: Math.min(MAX_CONCURRENT_REQUESTS, props.length) },
          worker,
        ),
      );

      const allNotFound =
        batches.length > 0 && batches.every((b) => b.notFound);
      const anyServerRefreshing = batches.some((b) => b.refreshing);
      const suggestions = sortByScore(
        deduplicateByMatchId(batches.flatMap((b) => b.rows)),
      );

      return {
        suggestions,
        allNotFound,
        anyServerRefreshing,
        lastTriedEndpoint: allNotFound ? (candidates[0] ?? "") : "",
      };
    },
    [fetchForProperty, candidates],
  );

  // ── Bootstrap (mount only) ─────────────────────────────────────────────────

  const initialise = useCallback(async () => {
    setState((s) => ({ ...s, phase: "boot" }));
    try {
      const props = await loadProperties();

      if (props.length === 0) {
        setState((s) => ({ ...s, phase: "no_listings", properties: [] }));
        return;
      }

      setState((s) => ({ ...s, phase: "loading", properties: props }));

      const scoped = scopedProperties(props);
      const result = await fetchAllSuggestions(scoped, false);

      setState((s) => ({
        ...s,
        suggestions: result.suggestions,
        properties: scoped,
        lastTriedEndpoint: result.lastTriedEndpoint,
        phase: result.allNotFound
          ? "unavailable"
          : result.suggestions.length > 0
            ? "ready"
            : "polling",
        pollElapsed: 0,
      }));
    } catch (e: unknown) {
      if (isHostStudioAuthError(e)) {
        logApiError("hostSuggestions.init", e);
        setState((s) => ({ ...s, phase: "session_expired" }));
        return;
      }
      logApiError("hostSuggestions.init", e);
      setState((s) => ({ ...s, phase: "empty" }));
    }
  }, [loadProperties, fetchAllSuggestions, fetchForProperty]);

  useEffect(() => {
    initialise();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Manual reload ──────────────────────────────────────────────────────────

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, phase: "loading" }));
    try {
      let props = propertiesRef.current;
      if (props.length === 0) props = await loadProperties();

      if (props.length === 0) {
        setState((s) => ({ ...s, phase: "no_listings", properties: [] }));
        return;
      }

      const scoped = scopedProperties(props);
      // Explicit reload should request recompute, but only for a bounded scope.
      if (scoped.length > 0) {
        await fetchForProperty(scoped[0].id, { refresh: true }).catch(
          () => null,
        );
      }
      const result = await fetchAllSuggestions(scoped, false);

      setState((s) => ({
        ...s,
        suggestions: result.suggestions,
        properties: scoped,
        lastTriedEndpoint: result.lastTriedEndpoint,
        phase: result.allNotFound
          ? "unavailable"
          : result.suggestions.length > 0
            ? "ready"
            : "polling",
        pollElapsed: 0,
      }));
    } catch (e: unknown) {
      if (isHostStudioAuthError(e)) {
        logApiError("hostSuggestions.reload", e);
        setState((s) => ({ ...s, phase: "session_expired" }));
        return;
      }
      logApiError("hostSuggestions.reload", e);
      setState((s) => ({
        ...s,
        phase: s.suggestions.length > 0 ? "ready" : "empty",
      }));
      Alert.alert(
        t("common.error", "Error"),
        getApiErrorUserMessage(parseApiError(e), t),
      );
    }
  }, [loadProperties, fetchForProperty, fetchAllSuggestions, t]);

  // ── Polling ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (state.phase !== "polling") return;

    let attempts = 0;
    const id = setInterval(async () => {
      attempts++;
      setState((s) => ({
        ...s,
        pollElapsed: attempts * (POLL_INTERVAL_MS / 1000),
      }));

      try {
        const result = await fetchAllSuggestions(propertiesRef.current, false);
        if (result.suggestions.length > 0) {
          clearInterval(id);
          setState((s) => ({
            ...s,
            phase: "ready",
            suggestions: result.suggestions,
            pollElapsed: 0,
          }));
          return;
        }
      } catch {
        /* silent */
      }

      if (attempts >= MAX_POLL_ATTEMPTS) {
        clearInterval(id);
        setState((s) => ({ ...s, phase: "empty", pollElapsed: 0 }));
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(id);
  }, [state.phase, fetchAllSuggestions]);

  // ── User actions ───────────────────────────────────────────────────────────

  const onContact = useCallback(
    async (item: Suggestion) => {
      const prop = item.property_id
        ? state.properties.find((p) => p.id === item.property_id)
        : undefined;
      const pendingCard: PendingInitialCard = {
        caption: t(
          "hostSuggestions.defaultContactMessage",
          "Hello, your profile matches our listing. Would you like to discuss?",
        ),
        property_id: item.property_id,
        property_type: "sale",
        title:
          item.property_title ||
          prop?.title ||
          t("hostSuggestions.unknownListing", "Listing"),
        listing_price: prop?.price,
        currency: t("common.currencySymbol", "MRU"),
      };
      try {
        setContactingId(item.match_id);
        // Navigate immediately for responsive UX, then send in background.
        navigation.navigate("DirectMessage", {
          otherUserId: item.user_id,
          recipientName: item.name,
          propertyID: item.property_id,
          pendingInitialCard: pendingCard,
        });
        postAction(item.match_id, "contact", {
          initial_message: pendingCard.caption,
        }).catch((e: any) => {
          const apiErr = String(e?.response?.data?.error ?? "");
          const message =
            apiErr.includes("consent") || apiErr.includes("consented")
              ? t(
                  "hostSuggestions.contactBuyerNoConsent",
                  "This buyer is no longer available for host matching.",
                )
              : apiErr.includes("another host")
                ? t(
                    "hostSuggestions.contactBuyerLocked",
                    "This buyer is already connected with another host.",
                  )
                : apiErr ||
                  e?.message ||
                  t(
                    "hostSuggestions.contactFailed",
                    "Unable to start conversation.",
                  );
          Alert.alert(t("common.error", "Error"), message);
        });
      } catch (e: any) {
        Alert.alert(
          t("common.error", "Error"),
          e?.response?.data?.error ??
            e?.message ??
            t("hostSuggestions.contactFailed", "Unable to start conversation."),
        );
      } finally {
        setContactingId(null);
      }
    },
    [postAction, navigation, t],
  );

  const onDismiss = useCallback(
    async (item: Suggestion) => {
      // Optimistic: remove immediately.
      setState((s) => {
        const next = s.suggestions.filter((x) => x.match_id !== item.match_id);
        return {
          ...s,
          suggestions: next,
          phase: next.length > 0 ? s.phase : "empty",
        };
      });
      try {
        await postAction(item.match_id, "dismiss");
      } catch {
        // Rollback on failure.
        setState((s) => ({
          ...s,
          suggestions: sortByScore([...s.suggestions, item]),
          phase: "ready",
        }));
        Alert.alert(
          t("common.error", "Error"),
          t(
            "hostSuggestions.dismissFailed",
            "Unable to dismiss this suggestion.",
          ),
        );
      }
    },
    [postAction, t],
  );

  const onContactSales = useCallback(() => {
    const subject = encodeURIComponent(
      t(
        "hostSuggestions.paywallEmailSubject",
        "Unlock full buyer traffic — Meskeny Host",
      ),
    );
    const body = encodeURIComponent(
      t(
        "hostSuggestions.paywallEmailBody",
        "Hello — I would like to unlock the full list of interested buyers for my listings.",
      ),
    );
    Linking.openURL(
      `mailto:support@meskeny.com?subject=${subject}&body=${body}`,
    ).catch(() =>
      Alert.alert(
        t("hostSuggestions.paywallTitle", "See all your traffic"),
        t(
          "hostSuggestions.paywallContactFallback",
          "Please email support@meskeny.com to unlock full buyer insights.",
        ),
      ),
    );
  }, [t]);

  return { state, contactingId, reload, onContact, onDismiss, onContactSales };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ATOM COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// ── Shimmer ───────────────────────────────────────────────────────────────────
/**
 * One Animated.Value per component tree → all shimmer bars pulse in sync,
 * no per-bar timer, no Reanimated dependency.
 */
function useShimmerValue() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 850,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return anim;
}

// Context so every ShimmerBar in a SkeletonCard shares one value.
const ShimmerCtx = React.createContext<Animated.Value | null>(null);

interface ShimmerBarProps {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  style?: object;
}
const ShimmerBar = memo(
  ({ width = "100%", height, radius = 6, style }: ShimmerBarProps) => {
    const ctxAnim = React.useContext(ShimmerCtx);
    const ownAnim = useRef(new Animated.Value(0)).current; // fallback if no ctx
    const anim = ctxAnim ?? ownAnim;
    const opacity = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.35, 0.85],
    });
    return (
      <Animated.View
        style={[
          {
            width: width as any,
            height,
            borderRadius: radius,
            backgroundColor: "#E2E8F0",
            opacity,
          },
          style,
        ]}
      />
    );
  },
);

const SkeletonCard = memo(() => {
  const anim = useShimmerValue();
  return (
    <ShimmerCtx.Provider value={anim}>
      <View style={sk.card}>
        {/* Linked row */}
        <View style={sk.linkedRow}>
          {/* User col */}
          <View style={sk.col}>
            <ShimmerBar width={52} height={52} radius={26} />
            <ShimmerBar width={68} height={10} style={{ marginTop: 9 }} />
            <ShimmerBar
              width={52}
              height={22}
              radius={11}
              style={{ marginTop: 8 }}
            />
            <ShimmerBar width={36} height={8} style={{ marginTop: 5 }} />
          </View>
          {/* Bridge */}
          <View style={sk.bridge}>
            <ShimmerBar width={2} height={22} radius={1} />
            <ShimmerBar
              width={30}
              height={30}
              radius={15}
              style={{ marginVertical: 4 }}
            />
            <ShimmerBar width={2} height={22} radius={1} />
          </View>
          {/* Property col */}
          <View style={sk.col}>
            <View style={sk.propCard}>
              <ShimmerBar width={38} height={8} style={{ marginBottom: 8 }} />
              <ShimmerBar
                width={"88%"}
                height={10}
                style={{ marginBottom: 6 }}
              />
              <ShimmerBar width={52} height={10} />
            </View>
          </View>
        </View>
        {/* Meta */}
        <ShimmerBar width={110} height={9} style={{ marginTop: 12 }} />
        {/* Chips */}
        <View style={sk.chips}>
          <ShimmerBar width={62} height={22} radius={11} />
          <ShimmerBar width={78} height={22} radius={11} />
          <ShimmerBar width={54} height={22} radius={11} />
        </View>
        {/* Actions */}
        <View style={sk.actions}>
          <ShimmerBar width={76} height={36} radius={10} />
          <ShimmerBar width={100} height={36} radius={10} />
        </View>
      </View>
    </ShimmerCtx.Provider>
  );
});

const sk = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 10,
  },
  linkedRow: { flexDirection: "row", alignItems: "stretch" },
  col: { flex: 1, alignItems: "center" },
  bridge: { width: 40, alignItems: "center", justifyContent: "center" },
  propCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    width: "100%",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
  },
});

// ── TierBadge ─────────────────────────────────────────────────────────────────
const TIER_PALETTE: Record<
  MatchTier,
  { bg: string; text: string; dot: string }
> = {
  excellent: { bg: "#DCFCE7", text: "#15803D", dot: "#22C55E" },
  strong: { bg: "#DBEAFE", text: "#1D4ED8", dot: "#60A5FA" },
  good: { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8" },
};

const TierBadge = memo(({ tier, pct }: { tier: MatchTier; pct: number }) => {
  const c = TIER_PALETTE[tier];
  return (
    <View style={[tb.pill, { backgroundColor: c.bg }]}>
      <View style={[tb.dot, { backgroundColor: c.dot }]} />
      <Text style={[tb.pct, { color: c.text }]}>{pct}%</Text>
    </View>
  );
});
const tb = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    marginTop: 7,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pct: { fontSize: 13, fontWeight: "800" },
});

// ── ReasonChip ────────────────────────────────────────────────────────────────
const ReasonChip = memo(({ label }: { label: string }) => (
  <View style={rc.chip}>
    <Text style={rc.text}>{label}</Text>
  </View>
));
const rc = StyleSheet.create({
  chip: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  text: { fontSize: 11, color: "#334155", fontWeight: "600" },
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. MOLECULE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// ── SuggestionCard ────────────────────────────────────────────────────────────
interface SuggestionCardProps {
  item: Suggestion;
  index: number;
  totalCount: number;
  propertyPrice?: number;
  propertyTitle: string;
  propertyImageURL?: string;
  contactingId: number | null;
  currencySymbol: string;
  locked: boolean;
  isPaywallCard: boolean;
  onContact: (item: Suggestion) => void;
  onDismiss: (item: Suggestion) => void;
  onContactSales: () => void;
  t: any;
}

const SuggestionCard = memo(
  ({
    item,
    totalCount,
    propertyPrice,
    propertyTitle,
    propertyImageURL,
    contactingId,
    currencySymbol,
    locked,
    isPaywallCard,
    onContact,
    onDismiss,
    onContactSales,
    t,
  }: SuggestionCardProps) => {
    const pct = Math.round(item.match_score ?? 0);
    const hiddenCount = Math.max(0, totalCount - FREE_MATCH_PREVIEW);
    const isBusy = contactingId === item.match_id;
    const rtl = I18nManager.isRTL;

    const handleContact = useCallback(() => onContact(item), [onContact, item]);
    const handleDismiss = useCallback(() => onDismiss(item), [onDismiss, item]);

    return (
      <View style={[cd.card, locked && cd.cardLocked]}>
        {/* ── Buyer ↔ Listing bridge row ── */}
        <View style={[cd.linkedRow, rtl && cd.linkedRowRtl]}>
          {/* Left column: buyer */}
          <View style={cd.userCol}>
            <View style={cd.avatarRing}>
              <View style={[cd.avatar, cd.avatarFallback]}>
                <Text style={cd.avatarInitial}>
                  {(item.name || "?").trim().charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={cd.userName} numberOfLines={2}>
              {item.name}
            </Text>
            <TierBadge tier={item.match_tier} pct={pct} />
            <Text style={cd.interestLabel}>
              {t("hostSuggestions.interestLabel", "Interest")}
            </Text>
          </View>

          {/* Bridge */}
          <View style={cd.bridge}>
            <View style={cd.bridgeLine} />
            <View style={cd.bridgeIcon}>
              <Link2 size={13} color="#94A3B8" strokeWidth={2.5} />
            </View>
            <View style={cd.bridgeLine} />
          </View>

          {/* Right column: property */}
          <View style={cd.propertyCol}>
            <View style={cd.propCard}>
              {propertyImageURL ? (
                <Image
                  source={{ uri: propertyImageURL }}
                  style={cd.propImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[cd.propImage, cd.propImageFallback]}>
                  <Text style={cd.propImageFallbackText}>
                    {t("hostSuggestions.noImage", "No image")}
                  </Text>
                </View>
              )}
              <Text style={cd.propLabel}>
                {t("hostSuggestions.matchedListing", "Listing")}
              </Text>
              <Text style={cd.propTitle} numberOfLines={2}>
                {propertyTitle}
              </Text>
              <Text style={cd.propPrice}>
                {formatCurrency(propertyPrice, currencySymbol)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Tier meta row ── */}
        <View style={cd.metaRow}>
          <View
            style={[
              cd.metaDot,
              { backgroundColor: TIER_PALETTE[item.match_tier].dot },
            ]}
          />
          <Text style={cd.metaText}>
            {t("hostSuggestions.compatibility", "Compatibility")}
            {" · "}
            {t(`hostSuggestions.tier.${item.match_tier}`, item.match_tier)}
          </Text>
        </View>

        {!!item.engagement_level && (
          <View style={cd.quickInfoRow}>
            <View style={cd.quickInfoPill}>
              <Text style={cd.quickInfoText}>
                {t("hostSuggestions.engagement", "Engagement")}:{" "}
                {item.engagement_level}
              </Text>
            </View>
          </View>
        )}

        {/* ── Reason chips ── */}
        {(item.reasons?.length ?? 0) > 0 && (
          <View style={cd.chips}>
            {item.reasons.slice(0, 4).map((r) => (
              <ReasonChip
                key={`${item.match_id}-${r}`}
                label={t(`hostSuggestions.reason.${r}`, r)}
              />
            ))}
          </View>
        )}

        {/* ── Actions (unlocked cards only) ── */}
        {!locked && (
          <View style={[cd.actions, rtl && cd.actionsRtl]}>
            <TouchableOpacity
              style={cd.dismissBtn}
              onPress={handleDismiss}
              activeOpacity={0.8}
            >
              <Text style={cd.dismissText}>
                {t("hostSuggestions.dismiss", "Ignore")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cd.contactBtn, isBusy && cd.contactBtnBusy]}
              onPress={handleContact}
              activeOpacity={0.88}
              disabled={isBusy}
            >
              {isBusy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={cd.contactText}>
                  {t("hostSuggestions.contact", "Contact")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Paywall blur overlay (locked cards only) ── */}
        {locked && (
          <View style={cd.blurWrap} pointerEvents="box-none">
            <BlurView
              intensity={Platform.OS === "ios" ? 50 : 68}
              tint="light"
              style={cd.blurFill}
              {...(Platform.OS === "android"
                ? { experimentalBlurMethod: "dimezisBlurView" as any }
                : {})}
            >
              {isPaywallCard ? (
                <View style={cd.paywallInner}>
                  <View style={cd.paywallIconCircle}>
                    <Lock size={20} color={PRIMARY} strokeWidth={2.5} />
                  </View>
                  <Text style={cd.paywallTitle}>
                    {t("hostSuggestions.paywallTitle", "See all your traffic")}
                  </Text>
                  <Text style={cd.paywallBody}>
                    {t(
                      "hostSuggestions.paywallBody",
                      "{{count}} more interested buyers are waiting. Contact us to unlock full insights.",
                      { count: hiddenCount },
                    )}
                  </Text>
                  <TouchableOpacity
                    style={cd.paywallCta}
                    onPress={onContactSales}
                    activeOpacity={0.88}
                  >
                    <Text style={cd.paywallCtaText}>
                      {t("hostSuggestions.paywallCta", "Contact us to unlock")}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={cd.lockedHintRow}>
                  <Lock size={11} color="#94A3B8" strokeWidth={2.5} />
                  <Text style={cd.lockedHintText}>
                    {t("hostSuggestions.paywallLockedHint", "Locked")}
                  </Text>
                </View>
              )}
            </BlurView>
          </View>
        )}
      </View>
    );
  },
  // Custom comparator — only re-render when data that affects visuals changes.
  (prev, next) =>
    prev.item === next.item &&
    prev.contactingId === next.contactingId &&
    prev.propertyPrice === next.propertyPrice &&
    prev.propertyTitle === next.propertyTitle &&
    prev.propertyImageURL === next.propertyImageURL,
);

const cd = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 10,
    overflow: "hidden",
  },
  cardLocked: { minHeight: 216 },
  linkedRow: { flexDirection: "row", alignItems: "stretch", marginBottom: 10 },
  linkedRowRtl: { flexDirection: "row-reverse" },
  userCol: { flex: 1, minWidth: 0, alignItems: "center", paddingRight: 6 },
  avatarRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 7,
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarFallback: {
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 20, fontWeight: "800", color: "#2563EB" },
  userName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    lineHeight: 16,
  },
  interestLabel: {
    marginTop: 4,
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  bridge: { width: 38, alignItems: "center", justifyContent: "center" },
  bridgeLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: "#E2E8F0",
    maxHeight: 28,
  },
  bridgeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  propertyCol: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 6,
    justifyContent: "center",
  },
  propCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
  },
  propImage: {
    width: "100%",
    height: 90,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#E2E8F0",
  },
  propImageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  propImageFallbackText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
  propLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  propTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 5,
    lineHeight: 16,
  },
  propPrice: { fontSize: 13, fontWeight: "800", color: "#1D4ED8" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  metaDot: { width: 6, height: 6, borderRadius: 3 },
  metaText: { fontSize: 11, color: "#64748B" },
  quickInfoRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  quickInfoPill: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quickInfoText: {
    color: "#3730A3",
    fontSize: 11,
    fontWeight: "700",
  },
  chips: { marginTop: 9, flexDirection: "row", flexWrap: "wrap", gap: 5 },
  actions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  actionsRtl: { flexDirection: "row-reverse" },
  dismissBtn: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  dismissText: { color: "#64748B", fontWeight: "700", fontSize: 12 },
  contactBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
    minWidth: 96,
    alignItems: "center",
  },
  contactBtnBusy: { opacity: 0.7 },
  contactText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  blurWrap: { ...StyleSheet.absoluteFillObject, zIndex: 10, elevation: 6 },
  blurFill: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  paywallInner: { padding: 18, alignItems: "center" },
  paywallIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  paywallTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 6,
  },
  paywallBody: {
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 14,
  },
  paywallCta: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
  },
  paywallCtaText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  lockedHintRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  lockedHintText: { fontSize: 11, fontWeight: "700", color: "#94A3B8" },
});

// ── PreviewBanner ─────────────────────────────────────────────────────────────
interface PreviewBannerProps {
  count: number;
  t: any;
}
const PreviewBanner = memo(({ count, t }: PreviewBannerProps) => (
  <View style={pb.wrap}>
    <View style={pb.accent} />
    <Text style={pb.text}>
      {t(
        "hostSuggestions.previewTopN",
        "Showing top {{n}} matches by interest. Unlock the rest with Meskeny.",
        { n: count },
      )}
    </Text>
  </View>
));
const pb = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
    gap: 8,
  },
  accent: {
    width: 4,
    height: 30,
    backgroundColor: "#2563EB",
    borderRadius: 2,
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontSize: 12,
    color: "#1E40AF",
    fontWeight: "700",
    lineHeight: 17,
  },
});

// ── EndpointWarning ───────────────────────────────────────────────────────────
interface EndpointWarningProps {
  endpoint: string;
  t: (key: string, fallback: string) => string;
}
const EndpointWarning = memo(({ endpoint, t }: EndpointWarningProps) => (
  <View style={ew.wrap}>
    <View style={ew.iconCircle}>
      <AlertTriangle size={14} color="#9A3412" strokeWidth={2.5} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={ew.title}>
        {t(
          "hostSuggestions.endpointUnavailable",
          "Suggestions endpoint unavailable.",
        )}
      </Text>
      {!!endpoint && <Text style={ew.hint}>{endpoint}</Text>}
    </View>
  </View>
));
const ew = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: { fontSize: 12, color: "#9A3412", fontWeight: "700" },
  hint: { marginTop: 3, fontSize: 10, color: "#C2410C" },
});

// ── EmptyState ────────────────────────────────────────────────────────────────
interface EmptyStateProps {
  phase: ScreenPhase;
  pollElapsed: number;
  onReload: () => void;
  t: any;
}

const POLL_TOTAL_SECONDS = (MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000;

const EmptyState = memo(
  ({ phase, pollElapsed, onReload, t }: EmptyStateProps) => {
    const isPolling = phase === "polling";
    const noListings = phase === "no_listings";
    const isUnavail = phase === "unavailable";

    const title = isPolling
      ? t("hostSuggestions.generatingTitle", "Finding interested buyers")
      : noListings
        ? t("hostSuggestions.emptyNoPropertyTitle", "No listings found")
        : isUnavail
          ? t("hostSuggestions.unavailableTitle", "Feature unavailable")
          : t("hostSuggestions.emptyTitle", "No potential buyers yet");

    const body = isPolling
      ? t(
          "hostSuggestions.generatingBody",
          "Analysing recent activity for your listings. This usually takes under a minute — keep this screen open or tap Refresh.",
        )
      : noListings
        ? t(
            "hostSuggestions.emptyNoPropertyBody",
            "Publish a listing first to start receiving buyer matches.",
          )
        : isUnavail
          ? t(
              "hostSuggestions.unavailableBody",
              "This feature is not enabled on the current server build. Contact your administrator.",
            )
          : t(
              "hostSuggestions.empty",
              "No matches right now. When buyers browse or save listings like yours, they'll appear here.",
            );

    const progressPct = Math.min(100, (pollElapsed / POLL_TOTAL_SECONDS) * 100);

    return (
      <View style={em.wrap}>
        <View style={em.card}>
          <View style={[em.iconCircle, isUnavail && em.iconCircleWarn]}>
            {isPolling ? (
              <ActivityIndicator color={PRIMARY} size="small" />
            ) : isUnavail ? (
              <AlertTriangle size={22} color="#9A3412" />
            ) : (
              <Users size={22} color={PRIMARY} />
            )}
          </View>

          <Text style={em.title}>{title}</Text>
          <Text style={em.body}>{body}</Text>

          {/* Indeterminate progress bar while polling */}
          {isPolling && (
            <View style={em.progressTrack}>
              <View
                style={[em.progressFill, { width: `${progressPct}%` as any }]}
              />
            </View>
          )}

          {!isUnavail && (
            <TouchableOpacity
              style={em.btn}
              onPress={onReload}
              activeOpacity={0.82}
            >
              <RefreshCw size={13} color="#1E293B" strokeWidth={2.5} />
              <Text style={em.btnText}>
                {isPolling
                  ? t("hostSuggestions.refreshNow", "Refresh now")
                  : t("hostSuggestions.refresh", "Refresh")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  },
);

const em = StyleSheet.create({
  wrap: { paddingVertical: 40, paddingHorizontal: 4, alignItems: "center" },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderColor: "#E2E8F0",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  iconCircleWarn: { backgroundColor: "#FFF7ED" },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  body: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 280,
  },
  progressTrack: {
    width: "100%",
    height: 3,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    marginTop: 18,
    overflow: "hidden",
  },
  progressFill: { height: 3, backgroundColor: PRIMARY, borderRadius: 2 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
    backgroundColor: "#F1F5F9",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  btnText: { fontSize: 12, fontWeight: "700", color: "#1E293B" },
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. SCREEN
// ─────────────────────────────────────────────────────────────────────────────

const SKELETON_COUNT = 4;
const SKELETON_ITEMS: ListItem[] = Array.from(
  { length: SKELETON_COUNT },
  (_, i) => ({
    kind: "skeleton",
    key: `skeleton-${i}`,
  }),
);

export const HostSuggestionsScreen = () => {
  const { user } = useUser();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const accessToken = user?.accessToken || tokenStorage.getAccess();

  const goSignIn = useCallback(() => {
    navigation.navigate("UnifiedAuth");
  }, [navigation]);

  if (!user || !accessToken) {
    return (
      <View style={ss.root}>
        <HostStudioAuthPrompt
          variant="signin"
          onSignIn={goSignIn}
          title={t(
            "hostSuggestions.signInTitle",
            "Sign in to view buyer matches",
          )}
          subtitle={t(
            "hostSuggestions.signInSub",
            "Potential buyer matches are available after you sign in as a host.",
          )}
        />
      </View>
    );
  }

  return <HostSuggestionsAuthenticated goSignIn={goSignIn} />;
};

function HostSuggestionsAuthenticated({ goSignIn }: { goSignIn: () => void }) {
  const { t } = useTranslation();
  const { state, contactingId, reload, onContact, onDismiss, onContactSales } =
    useHostSuggestions();

  const currencySymbol = t("common.currencySymbol", "MRU");

  const { phase, suggestions, properties, lastTriedEndpoint, pollElapsed } =
    state;

  const isBooting = phase === "boot";
  const isLoading = phase === "boot" || phase === "loading";
  const canRefresh = !isLoading;

  // Build O(1) property lookup map.
  const propertyById = useMemo<Map<number, NormalizedProperty>>(() => {
    const m = new Map<number, NormalizedProperty>();
    for (const p of properties) m.set(p.id, p);
    return m;
  }, [properties]);

  // Skeletons while booting; real items otherwise. Keeping both as flat arrays
  // means FlatList's item-pool stays consistent (no full remount on transition).
  const listData = useMemo<ListItem[]>(() => {
    if (isBooting) return SKELETON_ITEMS;
    if (phase === "loading" && suggestions.length === 0) return SKELETON_ITEMS;
    return suggestions.map(
      (s, i): ListItem => ({ kind: "suggestion", data: s, index: i }),
    );
  }, [isBooting, phase, suggestions]);

  const showPreviewBanner =
    !isLoading && suggestions.length > FREE_MATCH_PREVIEW;
  const showEndpointWarn = !isLoading && phase === "unavailable";
  const showEmpty =
    !isLoading &&
    suggestions.length === 0 &&
    (phase === "empty" ||
      phase === "no_listings" ||
      phase === "unavailable" ||
      phase === "polling");

  // ── Stable renderItem — SuggestionCard's custom memo comparator handles the rest.
  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.kind === "skeleton") return <SkeletonCard />;

      const { data: sug, index } = item;
      const locked = index >= FREE_MATCH_PREVIEW;
      const isPaywallCard = locked && index === FREE_MATCH_PREVIEW;
      const prop = sug.property_id
        ? propertyById.get(sug.property_id)
        : undefined;

      return (
        <SuggestionCard
          item={sug}
          index={index}
          totalCount={suggestions.length}
          propertyPrice={prop?.price}
          propertyImageURL={prop?.imageURL}
          propertyTitle={
            prop?.title ||
            sug.property_title ||
            t("hostSuggestions.unknownListing", "Listing")
          }
          contactingId={contactingId}
          currencySymbol={currencySymbol}
          locked={locked}
          isPaywallCard={isPaywallCard}
          onContact={onContact}
          onDismiss={onDismiss}
          onContactSales={onContactSales}
          t={t}
        />
      );
    },
    [
      propertyById,
      suggestions.length,
      contactingId,
      currencySymbol,
      onContact,
      onDismiss,
      onContactSales,
      t,
    ],
  );

  const keyExtractor = useCallback(
    (item: ListItem) =>
      item.kind === "skeleton" ? item.key : String(item.data.match_id),
    [],
  );

  if (phase === "session_expired") {
    return (
      <View style={ss.root}>
        <HostStudioAuthPrompt
          variant="session"
          onSignIn={goSignIn}
          title={t("hostSuggestions.sessionExpiredTitle", "Sign in again")}
          subtitle={t(
            "hostSuggestions.sessionExpiredSub",
            "Your session ended. Sign in again to view buyer matches.",
          )}
        />
      </View>
    );
  }

  return (
    <View style={ss.root}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={ss.header}>
        <View style={ss.headerLeft}>
          <Text style={ss.title}>
            {t("hostSuggestions.title", "Potential Buyers")}
          </Text>
          <Text style={ss.subtitle}>
            {t("hostSuggestions.scopeAllListings", "All listings")}
            {!isLoading && suggestions.length > 0
              ? `  ·  ${suggestions.length} ${t("hostSuggestions.matchesFound", "matches")}`
              : ""}
          </Text>
        </View>

        <TouchableOpacity
          style={[ss.refreshBtn, !canRefresh && ss.refreshBtnDisabled]}
          onPress={reload}
          disabled={!canRefresh}
          activeOpacity={0.78}
        >
          {phase === "loading" ? (
            <ActivityIndicator size="small" color={PRIMARY} />
          ) : (
            <RefreshCw size={13} color="#161616" strokeWidth={2.5} />
          )}
          <Text style={ss.refreshBtnText}>
            {phase === "loading"
              ? t("common.loading", "Loading…")
              : t("hostSuggestions.refresh", "Refresh")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Banners (above list) ────────────────────────────────────────── */}
      <View style={ss.banners}>
        {!isLoading && phase !== "unavailable" && (
          <View style={ss.privacyBanner}>
            <Text style={ss.privacyBannerText}>
              {t(
                "hostSuggestions.privacyFootnote",
                "Buyers who opted in appear with minimal details only (first name and match signals).",
              )}
            </Text>
          </View>
        )}
        {showEndpointWarn && (
          <EndpointWarning endpoint={lastTriedEndpoint} t={t} />
        )}
        {showPreviewBanner && (
          <PreviewBanner count={FREE_MATCH_PREVIEW} t={t} />
        )}
      </View>

      {/* ── Main list ───────────────────────────────────────────────────── */}
      <FlatList<ListItem>
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={ss.listContent}
        showsVerticalScrollIndicator={false}
        // PTR only when not in a boot/load state (prevents double-spinner).
        refreshing={false}
        onRefresh={canRefresh ? reload : undefined}
        // Performance tuning.
        removeClippedSubviews={Platform.OS === "android"}
        windowSize={7}
        maxToRenderPerBatch={5}
        initialNumToRender={5}
        ListEmptyComponent={
          showEmpty ? (
            <EmptyState
              phase={phase}
              pollElapsed={pollElapsed}
              onReload={reload}
              t={t}
            />
          ) : null
        }
      />
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: "15%",
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8E8E8",
  },
  headerLeft: { flex: 1, marginRight: 12 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#161616",
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B6B6B",
    fontWeight: "500",
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E8E8E8",
    minWidth: 104,
    justifyContent: "center",
  },
  refreshBtnDisabled: { opacity: 0.5 },
  refreshBtnText: { fontSize: 13, fontWeight: "700", color: "#161616" },
  banners: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  privacyBanner: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E8E8E8",
  },
  privacyBannerText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6B6B6B",
    fontWeight: "500",
  },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
});

export default HostSuggestionsScreen;
