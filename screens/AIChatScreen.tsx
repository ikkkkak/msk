// import React, {
//   useState,
//   useEffect,
//   useRef,
//   useCallback,
//   useMemo,
// } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   FlatList,
//   Dimensions,
//   StatusBar,
//   ActivityIndicator,
//   Keyboard,
//   KeyboardAvoidingView,
//   ScrollView,
//   Platform,
//   Image,
//   Share,
//   Pressable,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { useNavigation, useRoute } from "@react-navigation/native";
// import { useTranslation } from "react-i18next";
// import * as Haptics from "expo-haptics";
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withTiming,
//   withRepeat,
//   withSequence,
//   withSpring,
//   withDelay,
//   interpolate,
//   Easing,
//   FadeIn,
//   FadeInUp,
//   FadeInRight,
// } from "react-native-reanimated";
// import {
//   Sparkle,
//   PaperPlaneTilt,
//   House,
//   NavigationArrow,
//   Paperclip,
//   Clock,
//   ChatCircle,
//   Copy,
//   Check,
//   ChartBar,
//   MapTrifold,
//   ArrowCounterClockwise,
//   ThumbsUp,
//   ThumbsDown,
//   ShareNetwork,
//   ArrowLeft,
//   Info,
//   ChartLineUp,
//   Buildings,
//   MapPin,
//   CaretRight,
//   MicrophoneStage,
//   Waveform,
// } from "phosphor-react-native";
// import * as Clipboard from "expo-clipboard";
// import {
//   ChatMessage,
//   PropertyRecommendation,
//   sendMessageToAI,
//   submitAIFeedback,
//   getChatSessions,
//   getChatSession,
//   createChatSession,
//   getInitialGreeting,
//   generateMessageId,
//   generateSessionId,
//   getQuickReplyMessage,
//   AIHistoryMessage,
//   SharedPropertyContext,
// } from "../services/aiService";
// import {
//   streamAgentRun,
//   type AgentStep,
//   type AgentVerification,
// } from "../services/agentRunService";
// import { AgentRunTimeline } from "../components/agent/AgentRunTimeline";
// import { useAgentRunContext } from "../hooks/useAgentRunContext";
// import GlowyInput from "../components/GlowyInput";
// import { useSmoothTextReveal, isRTLText } from "../hooks/useSmoothTextReveal";
// import { AIPropertyCarouselCard } from "../components/agent/AIPropertyCarouselCard";
// import { AIResultsMap } from "../components/agent/AIResultsMap";
// import { AILandResultsOverviewMap } from "../components/agent/AILandResultsOverviewMap";
// import { AiSearchIntentPanel } from "../components/agent/AiSearchIntentPanel";
// import {
//   formatUserMessageForDisplay,
//   isClarificationQuickReplies,
//   sanitizeAssistantContentForDisplay,
// } from "../utils/aiChatDisplay";
// import { MotiView } from "moti";
// import AiSearchFiltersPicker from "../components/AiSearchFiltersPicker";
// import { api } from "../services/api";
// import CompatBottomSheet, {
//   BottomSheetScrollView,
// } from "../components/CompatBottomSheet";
// import { BottomSheetBackdrop } from "@gorhom/bottom-sheet";

// const { width: W, height: H } = Dimensions.get("window");
// const IOS = Platform.OS === "ios";

// // ─── DESIGN TOKENS — ChatGPT / Perplexity neutral ────────────────────────────
// const C = {
//   bg: "#FFFFFF",
//   bgCard: "#FFFFFF",
//   bgInput: "#F4F4F4",
//   bgUserBubble: "#F4F4F4",
//   bgChip: "#F4F4F4",
//   bgChipActive: "#0D0D0D",
//   bgTag: "#F4F4F4",
//   bgSheet: "#FFFFFF",
//   bgMuted: "#F7F7F8",

//   border: "#E5E5E5",
//   borderSoft: "#EBEBEB",

//   text: "#0D0D0D",
//   textSub: "#6E6E80",
//   textMuted: "#ACACBE",
//   textPlaceholder: "#ACACBE",
//   textInvert: "#FFFFFF",

//   accent: "#0D0D0D",
//   accentLight: "#F4F4F4",
//   accentGold: "#6E6E80",

//   positive: "#10A37F",
//   negative: "#EF4444",

//   speakBtn: "#0D0D0D",
// };

// const RADIUS = {
//   sm: 8,
//   md: 12,
//   lg: 16,
//   xl: 24,
//   pill: 999,
// };

// // ─── STARTER PROMPTS ─────────────────────────────────────────────────────────
// const STARTER_PROMPTS: Array<{
//   action: string;
//   Icon: React.ComponentType<{ size?: number; color?: string; weight?: any }>;
//   titleKey: string;
//   subtitleKey: string;
//   promptKey: string;
//   defaults: { title: string; subtitle: string; prompt: string };
// }> = [
//   {
//     action: "starter_rent",
//     Icon: Buildings,
//     titleKey: "aiChat.starters.rent.title",
//     subtitleKey: "aiChat.starters.rent.subtitle",
//     promptKey: "aiChat.starters.rent.prompt",
//     defaults: {
//       title: "Find a rental",
//       subtitle: "Nouakchott · set your budget",
//       prompt:
//         "I'm looking for rental properties in Nouakchott with a monthly budget around 80,000–140,000 MRU. Please show matching options and ask me for any missing details (area, bedrooms, move‑in date).",
//     },
//   },
//   {
//     action: "starter_buy",
//     Icon: House,
//     titleKey: "aiChat.starters.buy.title",
//     subtitleKey: "aiChat.starters.buy.subtitle",
//     promptKey: "aiChat.starters.buy.prompt",
//     defaults: {
//       title: "Buy a home",
//       subtitle: "Bedrooms · area · budget",
//       prompt:
//         "I want to buy a home (about 3 bedrooms). Ask me the key questions you need (city/area, budget, timeline), then suggest suitable listings.",
//     },
//   },
//   {
//     action: "starter_area",
//     Icon: MapPin,
//     titleKey: "aiChat.starters.area.title",
//     subtitleKey: "aiChat.starters.area.subtitle",
//     promptKey: "aiChat.starters.area.prompt",
//     defaults: {
//       title: "Pick a neighborhood",
//       subtitle: "Budget · commute · must‑haves",
//       prompt:
//         "Help me choose a neighborhood that fits my budget and commute. Ask where I work or study, my budget, and must‑have amenities, then recommend areas in Mauritania.",
//     },
//   },
//   {
//     action: "starter_invest",
//     Icon: ChartLineUp,
//     titleKey: "aiChat.starters.invest.title",
//     subtitleKey: "aiChat.starters.invest.subtitle",
//     promptKey: "aiChat.starters.invest.prompt",
//     defaults: {
//       title: "Investment opportunities",
//       subtitle: "Rationale · risks · returns",
//       prompt:
//         "Show me investment-style property and land opportunities available now. For each option, give a concise rationale and list practical risks to verify (title, access, utilities).",
//     },
//   },
// ];

// const TABS = ["Find"];

// // ─── THINKING INDICATOR ───────────────────────────────────────────────────────
// const ThinkingIndicator: React.FC = () => {
//   const d1 = useSharedValue(0.3);
//   const d2 = useSharedValue(0.3);
//   const d3 = useSharedValue(0.3);

//   useEffect(() => {
//     const bounce = (sv: any, delay: number) => {
//       sv.value = withDelay(
//         delay,
//         withRepeat(
//           withSequence(
//             withTiming(1, { duration: 380, easing: Easing.inOut(Easing.ease) }),
//             withTiming(0.3, {
//               duration: 380,
//               easing: Easing.inOut(Easing.ease),
//             }),
//           ),
//           -1,
//           false,
//         ),
//       );
//     };
//     bounce(d1, 0);
//     bounce(d2, 150);
//     bounce(d3, 300);
//   }, []);

//   const s = (sv: any) =>
//     useAnimatedStyle(() => ({
//       opacity: sv.value,
//       transform: [{ translateY: interpolate(sv.value, [0.3, 1], [0, -3.5]) }],
//     }));

//   return (
//     <View style={styles.thinkingWrap}>
//       <Animated.View style={[styles.thinkingDot, s(d1)]} />
//       <Animated.View style={[styles.thinkingDot, s(d2)]} />
//       <Animated.View style={[styles.thinkingDot, s(d3)]} />
//     </View>
//   );
// };

// // ─── HELPERS ──────────────────────────────────────────────────────────────────
// const isLandmarkRecommendation = (rec: PropertyRecommendation): boolean => {
//   const src = String((rec as any)?.source ?? "")
//     .trim()
//     .toLowerCase();
//   return src === "landmark" || src.includes("landmark");
// };

// const openRecommendationDetails = async (
//   nav: any,
//   rec: PropertyRecommendation,
// ) => {
//   if (isLandmarkRecommendation(rec)) {
//     try {
//       const res = await api.get(`/landmarks/${rec.id}`);
//       const lm = res?.data?.landmark;
//       if (lm) {
//         nav.navigate("LandmarkDetails", { landmark: lm });
//         return;
//       }
//     } catch (e) {
//       console.warn("AIChat landmark fetch failed:", e);
//     }
//     return;
//   }
//   if (rec.type === "sale") {
//     nav.navigate("PropertySaleDetails", { propertyId: rec.id });
//     return;
//   }
//   nav.navigate("PropertyDetails", { propertyID: rec.id });
// };

// // ─── STREAM CARET ─────────────────────────────────────────────────────────────
// const StreamCaret: React.FC<{ rtl?: boolean }> = ({ rtl }) => {
//   const op = useSharedValue(1);
//   useEffect(() => {
//     op.value = withRepeat(
//       withSequence(
//         withTiming(0, { duration: 480 }),
//         withTiming(1, { duration: 480 }),
//       ),
//       -1,
//     );
//   }, [op]);
//   const style = useAnimatedStyle(() => ({ opacity: op.value }));
//   return (
//     <Animated.View
//       style={[styles.streamCaret, rtl && styles.streamCaretRTL, style]}
//     />
//   );
// };

// // ─── MARKDOWN RENDERER ────────────────────────────────────────────────────────
// function arabicTypographyStyle(isRTL: boolean) {
//   return isRTL ? styles.arabicText : null;
// }

// function renderMarkdownText(
//   text: string,
//   baseStyle: any,
//   boldStyle: any,
//   isRTL = false,
// ) {
//   const nodes: React.ReactNode[] = [];
//   const re = /\*\*(.*?)\*\*/g;
//   let last = 0;
//   let m: RegExpExecArray | null;
//   let k = 0;
//   while ((m = re.exec(text)) !== null) {
//     if (m.index > last)
//       nodes.push(
//         <Text
//           key={`t-${k++}`}
//           style={[baseStyle, arabicTypographyStyle(isRTL)]}
//         >
//           {text.slice(last, m.index)}
//         </Text>,
//       );
//     nodes.push(
//       <Text key={`b-${k++}`} style={[boldStyle, arabicTypographyStyle(isRTL)]}>
//         {m[1]}
//       </Text>,
//     );
//     last = re.lastIndex;
//   }
//   if (last < text.length)
//     nodes.push(
//       <Text key={`t-${k++}`} style={[baseStyle, arabicTypographyStyle(isRTL)]}>
//         {text.slice(last)}
//       </Text>,
//     );
//   return nodes;
// }

// function isPipeTableLine(line: string) {
//   return /^\s*\|.*\|\s*$/.test(line);
// }
// function isPipeTableSeparator(line: string) {
//   const t = line.trim();
//   return /^\|?[\s:-]+(\|[\s:-]+)+\|?$/.test(t) && t.includes("-");
// }
// function parsePipeRow(line: string): string[] {
//   return line
//     .trim()
//     .replace(/^\|/, "")
//     .replace(/\|$/, "")
//     .split("|")
//     .map((c) => c.trim());
// }

// function renderMessageContent(text: string, isRTL = false) {
//   const lines = (text || "").split("\n");
//   const out: React.ReactNode[] = [];
//   let i = 0;
//   let key = 0;

//   while (i < lines.length) {
//     const line = lines[i];
//     const next = i + 1 < lines.length ? lines[i + 1] : "";
//     const tableStart = isPipeTableLine(line) && isPipeTableSeparator(next);

//     if (!tableStart) {
//       const para: string[] = [];
//       while (i < lines.length) {
//         const l = lines[i];
//         const n = i + 1 < lines.length ? lines[i + 1] : "";
//         if (isPipeTableLine(l) && isPipeTableSeparator(n)) break;
//         para.push(l);
//         i += 1;
//       }
//       para.forEach((rawLine) => {
//         const l = rawLine.replace(/\r/g, "");
//         if (!l.trim()) return;
//         if (l.trimStart().startsWith("### ")) {
//           const heading = l.trimStart().replace(/^###\s+/, "");
//           out.push(
//             <Text
//               key={`h3-${key++}`}
//               style={[
//                 styles.aiH3,
//                 isRTL && styles.rtlText,
//                 isRTL && styles.arabicText,
//               ]}
//             >
//               {isRTL
//                 ? heading
//                 : renderMarkdownText(
//                     heading,
//                     styles.aiH3,
//                     styles.aiH3Bold,
//                     isRTL,
//                   )}
//             </Text>,
//           );
//         } else {
//           out.push(
//             <Text
//               key={`p-${key++}`}
//               style={[
//                 styles.aiText,
//                 isRTL && styles.rtlText,
//                 isRTL && styles.arabicText,
//               ]}
//             >
//               {isRTL
//                 ? l
//                 : renderMarkdownText(
//                     l,
//                     styles.aiText,
//                     styles.aiTextBold,
//                     isRTL,
//                   )}
//             </Text>,
//           );
//         }
//       });
//       continue;
//     }

//     const header = parsePipeRow(line);
//     i += 2;
//     const rows: string[][] = [];
//     while (i < lines.length && isPipeTableLine(lines[i])) {
//       rows.push(parsePipeRow(lines[i]));
//       i += 1;
//     }
//     out.push(
//       <ScrollView
//         key={`t-${key++}`}
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         style={styles.aiTableScroll}
//         contentContainerStyle={styles.aiTableScrollContent}
//       >
//         <View style={styles.aiTableWrap}>
//           <View style={styles.aiTableRowHeader}>
//             {header.map((c, idx) => (
//               <Text
//                 key={`h-${idx}`}
//                 style={[
//                   styles.aiTableHeaderCell,
//                   isRTL && styles.rtlText,
//                   isRTL && styles.arabicText,
//                 ]}
//               >
//                 {c}
//               </Text>
//             ))}
//           </View>
//           {rows.map((r, ridx) => (
//             <View
//               key={`r-${ridx}`}
//               style={[
//                 styles.aiTableRow,
//                 ridx % 2 === 0 && styles.aiTableRowAlt,
//               ]}
//             >
//               {r.map((c, cidx) => (
//                 <Text
//                   key={`c-${ridx}-${cidx}`}
//                   style={[
//                     styles.aiTableCell,
//                     isRTL && styles.rtlText,
//                     isRTL && styles.arabicText,
//                   ]}
//                 >
//                   {c}
//                 </Text>
//               ))}
//             </View>
//           ))}
//         </View>
//       </ScrollView>,
//     );
//   }
//   return out;
// }

// function hasArabicText(text: string) {
//   return /[\u0600-\u06FF]/.test(text || "");
// }

// // ─── MESSAGE BUBBLE ───────────────────────────────────────────────────────────
// const MessageBubble: React.FC<{
//   message: ChatMessage;
//   onQuickReply: (action: string) => void;
//   onPickerSubmit?: (promptText: string) => void;
//   pickerDisabled?: boolean;
//   pickerSessionId?: string;
//   pickerAnonSessionId?: string;
//   onFeedback?: (
//     interactionId: number,
//     signal: "thumbs_up" | "thumbs_down",
//   ) => void;
//   feedbackGiven?: "thumbs_up" | "thumbs_down";
//   animateTyping?: boolean;
// }> = ({
//   message,
//   onQuickReply,
//   onPickerSubmit,
//   pickerDisabled,
//   pickerSessionId,
//   pickerAnonSessionId,
//   onFeedback,
//   feedbackGiven,
//   animateTyping,
// }) => {
//   const { t } = useTranslation();
//   const nav = useNavigation();
//   const isUser = message.role === "user";
//   const [copied, setCopied] = useState(false);

//   const fullAssistantText = !isUser
//     ? sanitizeAssistantContentForDisplay(message.content)
//     : "";
//   const userDisplayText = isUser
//     ? formatUserMessageForDisplay(message.content || "")
//     : "";
//   const serverRTL = !!(message as any).agentRTL;
//   const assistantIsRTL =
//     serverRTL ||
//     isRTLText(fullAssistantText) ||
//     hasArabicText(fullAssistantText);
//   const userIsRTL =
//     isRTLText(userDisplayText) || hasArabicText(userDisplayText);
//   const {
//     visibleText,
//     complete: revealComplete,
//     skip,
//   } = useSmoothTextReveal(fullAssistantText, !isUser && !!animateTyping);
//   const assistantRevealDone = !animateTyping || revealComplete;

//   const agentSteps = (message as any).agentSteps as AgentStep[] | undefined;
//   const agentVerification = (message as any).agentVerification as
//     | AgentVerification
//     | undefined;
//   const agentRunTotalMs = (message as any).agentRunTotalMs as
//     | number
//     | undefined;
//   const agentRole = (message as any).agentRole as string | undefined;

//   const handleCopy = async () => {
//     await Clipboard.setStringAsync(message.content);
//     setCopied(true);
//     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const handleShare = async () => {
//     try {
//       const text = message.content?.trim();
//       if (!text) return;
//       await Share.share({ message: `Meskeny AI\n\n${text}` });
//       Haptics.selectionAsync();
//     } catch (e) {
//       console.warn("share failed:", e);
//     }
//   };

//   const hasProps =
//     !isUser &&
//     Array.isArray(message.propertyRecommendations) &&
//     message.propertyRecommendations.length > 0;

//   const landResults: PropertyRecommendation[] = hasProps
//     ? (message.propertyRecommendations ?? []).filter((p) =>
//         isLandmarkRecommendation(p),
//       )
//     : [];

//   const hasLandPlotMaps =
//     landResults.length > 0 &&
//     landResults.some(
//       (p) =>
//         Array.isArray(p.plot_corners) && (p.plot_corners?.length ?? 0) >= 3,
//     );

//   const hasPinMap =
//     hasProps &&
//     !hasLandPlotMaps &&
//     message.propertyRecommendations!.some((p) => p.lat !== undefined);

//   const clarificationUI =
//     assistantRevealDone &&
//     !hasProps &&
//     isClarificationQuickReplies(message.quickReplies);

//   const pickerTriggered =
//     !isUser &&
//     !hasProps &&
//     !clarificationUI &&
//     (message.quickReplies?.some((r) => r.action.startsWith("picker_")) ||
//       /(\bcity\b|\bville\b|\bzone\b|\bquartier\b|\bprix\b|\bbudget\b|\bميزانيت|\bالمدينة\b|\bالمنطقة\b)/i.test(
//         message.content || "",
//       ));

//   // ── USER BUBBLE ──
//   if (isUser) {
//     const replyOnProperty = (message as any).replyOnProperty as
//       | SharedPropertyContext
//       | undefined;
//     return (
//       <Animated.View entering={FadeIn.duration(180)} style={styles.userMsgRow}>
//         {replyOnProperty ? (
//           <View style={styles.replyOnPropertyPill}>
//             {replyOnProperty.image ? (
//               <Image
//                 source={{ uri: replyOnProperty.image }}
//                 style={styles.replyOnPropertyImg}
//               />
//             ) : (
//               <View
//                 style={[
//                   styles.replyOnPropertyImg,
//                   styles.replyOnPropertyImgFallback,
//                 ]}
//               >
//                 <House size={12} color={C.textSub} weight="fill" />
//               </View>
//             )}
//             <View style={{ flex: 1, minWidth: 0 }}>
//               <Text style={styles.replyOnPropertyLabel}>
//                 {t("aiChat.replyOnProperty", "Replying about")}
//               </Text>
//               <Text style={styles.replyOnPropertyTitle} numberOfLines={1}>
//                 {replyOnProperty.title || t("aiChat.property", "Property")}
//               </Text>
//             </View>
//           </View>
//         ) : null}
//         <TouchableOpacity
//           activeOpacity={0.85}
//           onLongPress={async () => {
//             await Clipboard.setStringAsync(message.content);
//             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//           }}
//         >
//           <View style={styles.userBubble}>
//             <Text
//               style={[
//                 styles.userBubbleText,
//                 userIsRTL && styles.rtlText,
//                 userIsRTL && styles.arabicText,
//               ]}
//             >
//               {userDisplayText}
//             </Text>
//           </View>
//         </TouchableOpacity>
//       </Animated.View>
//     );
//   }

//   // ── AI MESSAGE ──
//   return (
//     <View style={styles.aiMsgBlock}>
//       {agentSteps && agentSteps.length > 0 && (
//         <AgentRunTimeline
//           steps={agentSteps}
//           verification={agentVerification}
//           totalMs={agentRunTotalMs}
//           role={agentRole}
//           deepThink={!!(message as any).thoughtHarder}
//           collapsedDefault
//         />
//       )}

//       <Pressable
//         onPress={() => {
//           if (animateTyping && !revealComplete) skip();
//         }}
//         style={styles.aiRichBlock}
//       >
//         <View
//           style={[
//             styles.aiTypewriterRow,
//             assistantIsRTL && styles.aiTypewriterRowRTL,
//           ]}
//         >
//           {renderMessageContent(visibleText, assistantIsRTL)}
//           {animateTyping && !revealComplete && (
//             <StreamCaret rtl={assistantIsRTL} />
//           )}
//         </View>
//         {animateTyping && !revealComplete && (
//           <Text style={styles.tapSkipHint}>
//             {t("aiChat.tapToSkip", "Tap to reveal")}
//           </Text>
//         )}
//       </Pressable>

//       {/* Deep think badge */}
//       {assistantRevealDone && (message as any).thoughtHarder && (
//         <View style={styles.deepThinkBadge}>
//           <Sparkle size={10} color={C.textSub} weight="fill" />
//           <Text style={styles.deepThinkBadgeText}>
//             {t("aiChat.deepThinkAnswer", "Deep think")}
//           </Text>
//         </View>
//       )}

//       {/* Rent/buy + property type cards */}
//       {clarificationUI && (
//         <AiSearchIntentPanel
//           replies={message.quickReplies ?? []}
//           disabled={pickerDisabled}
//           onSelect={onQuickReply}
//         />
//       )}

//       {/* Filter picker */}
//       {assistantRevealDone && pickerTriggered && onPickerSubmit && (
//         <View style={styles.pickerWrap}>
//           <AiSearchFiltersPicker
//             disabled={pickerDisabled}
//             sessionId={pickerSessionId}
//             anonSessionId={pickerAnonSessionId}
//             onFindSuggestions={onPickerSubmit}
//           />
//         </View>
//       )}

//       {/* Property carousel */}
//       {hasProps && (
//         <Animated.View
//           entering={FadeIn.duration(360)}
//           style={styles.propsBlock}
//         >
//           <Text style={styles.propsSectionLabel}>
//             {t("aiChat.resultsTitle", "Matching listings")}
//           </Text>
//           <ScrollView
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             contentContainerStyle={styles.propsCarousel}
//             keyboardShouldPersistTaps="handled"
//             decelerationRate="fast"
//             snapToInterval={W * 0.68 + 10}
//           >
//             {(message.propertyRecommendations ?? []).map((p, i) => (
//               <AIPropertyCarouselCard
//                 key={p.id}
//                 rec={p}
//                 index={i}
//                 onPress={async (rec) => {
//                   await openRecommendationDetails(nav as any, rec);
//                 }}
//               />
//             ))}
//           </ScrollView>
//           {hasLandPlotMaps ? (
//             <AILandResultsOverviewMap items={landResults} />
//           ) : hasPinMap ? (
//             <AIResultsMap items={message.propertyRecommendations ?? []} />
//           ) : null}
//         </Animated.View>
//       )}

//       {/* Sources */}
//       {assistantRevealDone && (message as any).sources > 0 && (
//         <View style={styles.sourcesRow}>
//           <View style={styles.sourceDots}>
//             {["#ACACBE", "#6E6E80", "#353740"].map((clr, i) => (
//               <View
//                 key={i}
//                 style={[
//                   styles.sourceDot,
//                   {
//                     backgroundColor: clr,
//                     marginLeft: i > 0 ? -6 : 0,
//                     zIndex: 3 - i,
//                   },
//                 ]}
//               />
//             ))}
//           </View>
//           <Text style={styles.sourcesText}>
//             {(message as any).sources} {t("aiChat.sources", "sources")}
//           </Text>
//         </View>
//       )}

//       {/* Action row */}
//       {assistantRevealDone && (
//         <>
//           <View style={styles.actionRow}>
//             <TouchableOpacity
//               style={styles.actionBtn}
//               activeOpacity={0.6}
//               onPress={handleShare}
//             >
//               <ShareNetwork size={15} color={C.textMuted} weight="regular" />
//             </TouchableOpacity>
//             {onFeedback ? (
//               <>
//                 <TouchableOpacity
//                   style={styles.actionBtn}
//                   activeOpacity={0.6}
//                   onPress={() => {
//                     Haptics.selectionAsync();
//                     if (message.interactionId)
//                       onFeedback(message.interactionId, "thumbs_up");
//                   }}
//                 >
//                   <ThumbsUp
//                     size={15}
//                     color={
//                       feedbackGiven === "thumbs_up" ? C.positive : C.textMuted
//                     }
//                     weight={feedbackGiven === "thumbs_up" ? "fill" : "regular"}
//                   />
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   style={styles.actionBtn}
//                   activeOpacity={0.6}
//                   onPress={() => {
//                     Haptics.selectionAsync();
//                     if (message.interactionId)
//                       onFeedback(message.interactionId, "thumbs_down");
//                   }}
//                 >
//                   <ThumbsDown
//                     size={15}
//                     color={
//                       feedbackGiven === "thumbs_down" ? C.negative : C.textMuted
//                     }
//                     weight={
//                       feedbackGiven === "thumbs_down" ? "fill" : "regular"
//                     }
//                   />
//                 </TouchableOpacity>
//               </>
//             ) : (
//               <>
//                 <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6}>
//                   <ThumbsUp size={15} color={C.textMuted} weight="regular" />
//                 </TouchableOpacity>
//                 <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6}>
//                   <ThumbsDown size={15} color={C.textMuted} weight="regular" />
//                 </TouchableOpacity>
//               </>
//             )}
//             <TouchableOpacity
//               style={styles.actionBtn}
//               activeOpacity={0.6}
//               onPress={handleCopy}
//             >
//               {copied ? (
//                 <Check size={15} color={C.positive} weight="bold" />
//               ) : (
//                 <Copy size={15} color={C.textMuted} weight="regular" />
//               )}
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6}>
//               <ArrowCounterClockwise
//                 size={15}
//                 color={C.textMuted}
//                 weight="regular"
//               />
//             </TouchableOpacity>
//           </View>

//           {/* Follow-up chips */}
//           {!pickerTriggered &&
//             !clarificationUI &&
//             message.quickReplies &&
//             message.quickReplies.length > 0 && (
//               <ScrollView
//                 horizontal
//                 showsHorizontalScrollIndicator={false}
//                 contentContainerStyle={styles.followUps}
//               >
//                 {message.quickReplies.slice(0, 3).map((r) => (
//                   <TouchableOpacity
//                     key={r.id}
//                     onPress={() => {
//                       Haptics.selectionAsync();
//                       onQuickReply(r.action);
//                     }}
//                     style={styles.followUpChip}
//                     activeOpacity={0.75}
//                   >
//                     <Text style={styles.followUpText}>{r.text}</Text>
//                   </TouchableOpacity>
//                 ))}
//               </ScrollView>
//             )}
//         </>
//       )}
//     </View>
//   );
// };

// // ─── EMPTY STATE ──────────────────────────────────────────────────────────────
// const EmptyState: React.FC = () => {
//   const opacity = useSharedValue(0.4);
//   useEffect(() => {
//     opacity.value = withRepeat(
//       withSequence(
//         withTiming(0.65, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
//         withTiming(0.4, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
//       ),
//       -1,
//       true,
//     );
//   }, []);
//   const iconStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

//   return (
//     <View style={styles.emptyRoot}>
//       {/* Card stack */}
//       <MotiView
//         from={{ rotate: "-13deg", scale: 0.88, opacity: 0 }}
//         animate={{ rotate: "-13deg", scale: 1, opacity: 1 }}
//         transition={{ type: "timing", duration: 600, delay: 40 }}
//         style={styles.emptyCardLeft}
//       >
//         <Image
//           source={{
//             uri: "https://i2.au.reastatic.net/800x600/40ce210737b22844123e756dfa577ddc6c783e30c804bce7e9edaca1a0e5496b/image.jpg",
//           }}
//           style={{ width: "100%", height: "100%", borderRadius: RADIUS.lg }}
//           resizeMode="cover"
//         />
//       </MotiView>

//       <MotiView
//         from={{ rotate: "4deg", scale: 0.82, opacity: 0 }}
//         animate={{ rotate: "4deg", scale: 1.05, opacity: 1 }}
//         transition={{ type: "timing", duration: 680, delay: 110 }}
//         style={styles.emptyCardCenter}
//       >
//         <Image
//           source={{
//             uri: "https://www.archid.co.za/wp-content/uploads/2024/07/modern-house-plan-designs-south-africa.jpg",
//           }}
//           style={{ width: "100%", height: "100%", borderRadius: RADIUS.lg }}
//           resizeMode="cover"
//         />
//         <View style={styles.emptyCardLabel}>
//           <Text style={styles.emptyCardLabelText}>Meskeny AI</Text>
//         </View>
//       </MotiView>

//       <MotiView
//         from={{ rotate: "19deg", scale: 0.84, opacity: 0 }}
//         animate={{ rotate: "19deg", scale: 1, opacity: 1 }}
//         transition={{ type: "timing", duration: 560, delay: 170 }}
//         style={styles.emptyCardRight}
//       >
//         <Image
//           source={{
//             uri: "https://i2.au.reastatic.net/800x600/8cf5788a2ca22c2ef9b29a2343afb3521290e55bd39d7f1f5f5e81f6762eb432/main.jpg",
//           }}
//           style={{ width: "100%", height: "100%", borderRadius: RADIUS.md }}
//           resizeMode="cover"
//         />
//       </MotiView>

//       <Animated.View style={[{ zIndex: 5, alignSelf: "center" }, iconStyle]}>
//         <NavigationArrow size={68} color={C.textMuted} weight="thin" />
//       </Animated.View>
//     </View>
//   );
// };

// // ─── STARTER PROMPTS PANEL ────────────────────────────────────────────────────
// const StarterPromptsPanel: React.FC<{
//   onSelectPrompt: (prompt: string) => void;
//   t: (key: string, defaultValue: string) => string;
// }> = ({ onSelectPrompt, t }) => {
//   return (
//     <View style={styles.starterPanel}>
//       <Text style={styles.starterTitle}>
//         {t("aiChat.starters.sectionTitle", "How can I help?")}
//       </Text>
//       <View style={styles.starterList}>
//         {STARTER_PROMPTS.map((item, i) => {
//           const title = t(item.titleKey, item.defaults.title);
//           const prompt = t(item.promptKey, item.defaults.prompt);
//           return (
//             <Animated.View
//               key={item.action}
//               entering={FadeInUp.delay(40 + i * 40).duration(240)}
//             >
//               <TouchableOpacity
//                 style={styles.starterChip}
//                 onPress={() => {
//                   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//                   onSelectPrompt(prompt);
//                 }}
//                 activeOpacity={0.75}
//               >
//                 <Text style={styles.starterChipText} numberOfLines={2}>
//                   {title}
//                 </Text>
//               </TouchableOpacity>
//             </Animated.View>
//           );
//         })}
//       </View>
//     </View>
//   );
// };

// // ─── HEADER ───────────────────────────────────────────────────────────────────
// const Header: React.FC<{
//   activeTab: string;
//   onTabChange: (t: string) => void;
//   onBack: () => void;
//   onInfo: () => void;
// }> = ({ activeTab, onTabChange, onBack, onInfo }) => {
//   const { t } = useTranslation();
//   return (
//     <View style={styles.header}>
//       <TouchableOpacity
//         style={styles.headerBtn}
//         onPress={onBack}
//         activeOpacity={0.6}
//       >
//         <ArrowLeft size={20} color={C.text} weight="regular" />
//       </TouchableOpacity>

//       <View style={styles.headerCenter}>
//         {TABS.map((tab) => {
//           const active = activeTab === tab;
//           return (
//             <TouchableOpacity
//               key={tab}
//               onPress={() => {
//                 Haptics.selectionAsync();
//                 onTabChange(tab);
//               }}
//               activeOpacity={0.7}
//               style={styles.headerTab}
//             >
//               <Text
//                 style={[
//                   styles.headerTabText,
//                   active && styles.headerTabTextActive,
//                 ]}
//               >
//                 {t("aiChat.tabFind", "Find")}
//               </Text>
//               {active && <View style={styles.headerTabUnderline} />}
//             </TouchableOpacity>
//           );
//         })}
//       </View>

//       <TouchableOpacity
//         style={styles.headerBtn}
//         onPress={onInfo}
//         activeOpacity={0.6}
//       >
//         <Info size={20} color={C.text} weight="regular" />
//       </TouchableOpacity>
//     </View>
//   );
// };

// // ─── AI OVERVIEW SHEET ────────────────────────────────────────────────────────
// const AIOverviewSheet: React.FC<{ visible: boolean; onClose: () => void }> = ({
//   visible,
//   onClose,
// }) => {
//   const { t } = useTranslation();
//   const sheetRef = useRef<any>(null);
//   const renderBackdrop = useCallback(
//     (props: any) => (
//       <BottomSheetBackdrop
//         {...props}
//         appearsOnIndex={0}
//         disappearsOnIndex={-1}
//         opacity={0.25}
//         pressBehavior="close"
//       />
//     ),
//     [],
//   );
//   useEffect(() => {
//     if (visible) sheetRef.current?.snapToIndex?.(0);
//     else sheetRef.current?.close?.();
//   }, [visible]);

//   return (
//     <CompatBottomSheet
//       ref={sheetRef}
//       index={visible ? 0 : -1}
//       snapPoints={["52%"]}
//       enablePanDownToClose
//       animateOnMount
//       containerStyle={{ zIndex: 9999, elevation: 9999 } as any}
//       style={{ zIndex: 9999, elevation: 9999 } as any}
//       onChange={(i: number) => {
//         if (i < 0) onClose();
//       }}
//       backdropComponent={renderBackdrop}
//       backgroundStyle={{ backgroundColor: C.bgSheet }}
//       handleIndicatorStyle={{ backgroundColor: C.border, width: 32 }}
//     >
//       <BottomSheetScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.sheetScrollContent}
//       >
//         <View style={styles.sheetHeaderRow}>
//           <Text style={styles.sheetTitle}>
//             {t("aiChat.overview.title", "About Meskeny AI")}
//           </Text>
//           <TouchableOpacity
//             style={styles.sheetCloseBtn}
//             onPress={onClose}
//             activeOpacity={0.7}
//           >
//             <Text style={styles.sheetCloseBtnText}>
//               {t("aiChat.overview.close", "Done")}
//             </Text>
//           </TouchableOpacity>
//         </View>
//         <Text style={styles.sheetBody}>{t("aiChat.overview.body")}</Text>
//       </BottomSheetScrollView>
//     </CompatBottomSheet>
//   );
// };

// // ─── MENU SHEET ───────────────────────────────────────────────────────────────
// const MenuSheet: React.FC<{
//   visible: boolean;
//   onClose: () => void;
//   onNewChat: () => void;
//   onHistory: () => void;
// }> = ({ visible, onClose, onNewChat, onHistory }) => {
//   const { t } = useTranslation();
//   const ty = useSharedValue(H);
//   const bgOp = useSharedValue(0);

//   useEffect(() => {
//     if (visible) {
//       ty.value = withSpring(0, { damping: 28, stiffness: 260 });
//       bgOp.value = withTiming(1, { duration: 160 });
//     } else {
//       ty.value = withTiming(H, {
//         duration: 200,
//         easing: Easing.in(Easing.ease),
//       });
//       bgOp.value = withTiming(0, { duration: 160 });
//     }
//   }, [visible]);

//   const sheetStyle = useAnimatedStyle(() => ({
//     transform: [{ translateY: ty.value }],
//   }));
//   const bgStyle = useAnimatedStyle(() => ({ opacity: bgOp.value * 0.28 }));

//   const ITEMS = [
//     {
//       icon: <ChatCircle size={18} color={C.text} weight="regular" />,
//       label: t("aiChat.newConversation", "New conversation"),
//       fn: () => {
//         onNewChat();
//         onClose();
//       },
//     },
//     {
//       icon: <Clock size={18} color={C.text} weight="regular" />,
//       label: t("aiChat.chatHistory", "History"),
//       fn: () => {
//         onHistory();
//         onClose();
//       },
//     },
//     {
//       icon: <ChartBar size={18} color={C.text} weight="regular" />,
//       label: t("aiChat.marketInsights", "Market insights"),
//       fn: onClose,
//     },
//     {
//       icon: <MapTrifold size={18} color={C.text} weight="regular" />,
//       label: t("aiChat.exploreMap", "Explore map"),
//       fn: onClose,
//     },
//   ];

//   return (
//     <>
//       <Animated.View
//         style={[
//           StyleSheet.absoluteFill,
//           { backgroundColor: "#000", zIndex: 50 },
//           bgStyle,
//         ]}
//         pointerEvents={visible ? "auto" : "none"}
//       >
//         <TouchableOpacity
//           style={StyleSheet.absoluteFill}
//           onPress={onClose}
//           activeOpacity={1}
//         />
//       </Animated.View>
//       <Animated.View style={[styles.menuSheet, sheetStyle]}>
//         <View style={styles.menuHandle} />
//         {ITEMS.map((item, i) => (
//           <React.Fragment key={item.label}>
//             <TouchableOpacity
//               onPress={item.fn}
//               style={styles.menuRow}
//               activeOpacity={0.7}
//             >
//               {item.icon}
//               <Text style={styles.menuRowText}>{item.label}</Text>
//             </TouchableOpacity>
//             {i < ITEMS.length - 1 && <View style={styles.menuDivider} />}
//           </React.Fragment>
//         ))}
//       </Animated.View>
//     </>
//   );
// };

// // ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
// export const AIChatScreen: React.FC = () => {
//   const { t } = useTranslation();
//   const navigation = useNavigation();
//   const route = useRoute<any>();
//   const insets = useSafeAreaInsets();
//   const listRef = useRef<FlatList>(null);
//   const keyboardCompact = useSharedValue(0);

//   const { persona: agentPersona, tier: agentTier } = useAgentRunContext();
//   const agentStepsRef = useRef<AgentStep[]>([]);
//   const agentRoleRef = useRef("");
//   const agentRTLRef = useRef(false);

//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [thinking, setThinking] = useState(false);
//   const [sessionId, setSessionId] = useState("");
//   const [anonSessionId] = useState(() => generateSessionId());
//   const [blocked, setBlocked] = useState(false);
//   const [showWelcome, setShowWelcome] = useState(true);
//   const [loadingHistory, setLoadingHistory] = useState(true);
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [activeTab, setActiveTab] = useState("Find");
//   const [showAIOverview, setShowAIOverview] = useState(false);
//   const [thinkHarderEnabled, setThinkHarderEnabled] = useState(false);
//   const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
//   const [agentRole, setAgentRole] = useState("");
//   const [streamingPreview, setStreamingPreview] = useState("");
//   const [agentVerification, setAgentVerification] =
//     useState<AgentVerification | null>(null);
//   const [agentRunTotalMs, setAgentRunTotalMs] = useState<number | undefined>();
//   const [feedbackByMessageId, setFeedbackByMessageId] = useState<
//     Record<string, "thumbs_up" | "thumbs_down">
//   >({});
//   const [sharedPropertyContext, setSharedPropertyContext] =
//     useState<SharedPropertyContext | null>(null);
//   const sharedContextHydratedRef = useRef(false);
//   const sharedPropertyConsumedRef = useRef(false);

//   useEffect(() => {
//     initHistory();
//   }, []);

//   useEffect(() => {
//     const showEvt =
//       Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
//     const hideEvt =
//       Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
//     const onShow = () => {
//       keyboardCompact.value = withTiming(1, {
//         duration: 200,
//         easing: Easing.out(Easing.cubic),
//       });
//     };
//     const onHide = () => {
//       keyboardCompact.value = withTiming(0, {
//         duration: 200,
//         easing: Easing.out(Easing.cubic),
//       });
//     };
//     const subShow = Keyboard.addListener(showEvt, onShow);
//     const subHide = Keyboard.addListener(hideEvt, onHide);
//     return () => {
//       subShow.remove();
//       subHide.remove();
//     };
//   }, []);

//   const emptyCompactStyle = useAnimatedStyle(() => {
//     const p = keyboardCompact.value;
//     return {
//       transform: [
//         { translateY: interpolate(p, [0, 1], [0, -28]) },
//         { scale: interpolate(p, [0, 1], [1, 0.88]) },
//       ],
//       opacity: interpolate(p, [0, 1], [1, 0.94]),
//     };
//   });

//   useEffect(() => {
//     if (loadingHistory) return;
//     const shared = route?.params?.sharedProperty;
//     if (!shared || sharedContextHydratedRef.current) return;
//     const context: SharedPropertyContext = {
//       id: Number(shared.id),
//       title: shared.title,
//       listing_price: shared.listing_price,
//       address: shared.address,
//       city: shared.city,
//       image: shared.image,
//       type: shared.type || "sale",
//     };
//     sharedPropertyConsumedRef.current = false;
//     setSharedPropertyContext(context);
//     const prompt =
//       route?.params?.initialPrompt?.trim() ||
//       "I want to know the market value for this property. Please analyze location, luxury comparables, and offer insights.";
//     setInput(prompt);
//     setShowWelcome(false);
//     sharedContextHydratedRef.current = true;
//   }, [route?.params, loadingHistory]);

//   useEffect(() => {
//     if (messages.length > 0)
//       setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
//   }, [messages, thinking]);

//   const initHistory = async () => {
//     setLoadingHistory(true);
//     try {
//       const { sessions } = await getChatSessions();
//       if (sessions.length > 0) {
//         const data = await getChatSession(sessions[0].id);
//         if (data) {
//           setSessionId(data.id);
//           setMessages(data.messages);
//           setShowWelcome(data.messages.length <= 1);
//         }
//       } else {
//         await newSession();
//       }
//     } catch {
//       const g = await getInitialGreeting();
//       if (g) setMessages([g]);
//     } finally {
//       setLoadingHistory(false);
//     }
//   };

//   const newSession = async () => {
//     try {
//       const r = await createChatSession();
//       if (r) {
//         setSessionId(r.sessionId);
//         setMessages([r.greeting]);
//         setShowWelcome(true);
//         setBlocked(false);
//       }
//     } catch {
//       const g = await getInitialGreeting();
//       if (g) setMessages([g]);
//     }
//   };

//   const sendText = useCallback(
//     async (rawText: string) => {
//       const text = rawText.trim();
//       if (!text || loading || blocked) return;

//       const sharedForTurn = sharedPropertyContext ?? null;
//       const attachShared =
//         !!sharedForTurn && !sharedPropertyConsumedRef.current;
//       const sharedForAI = attachShared ? sharedForTurn : null;

//       if (attachShared) {
//         sharedPropertyConsumedRef.current = true;
//         setSharedPropertyContext(null);
//       }

//       setInput((prev) => (prev.trim() === text ? "" : prev));
//       setShowWelcome(false);
//       Keyboard.dismiss();

//       const userMsg: ChatMessage = {
//         id: generateMessageId(),
//         role: "user",
//         content: text,
//         timestamp: Date.now(),
//       };
//       if (attachShared) (userMsg as any).replyOnProperty = sharedForTurn;

//       setMessages((p) => [...p, userMsg]);
//       setLoading(true);
//       setThinking(true);

//       try {
//         const history: AIHistoryMessage[] = [...messages, userMsg]
//           .slice(-10)
//           .filter((m) => m.role === "user" || m.role === "assistant")
//           .map((m) => ({
//             role: m.role === "user" ? "user" : "assistant",
//             content: m.content,
//           }));

//         const marketValuePrompt =
//           "I want to know the market value for this property based on its location, luxury comparables, and offers in the database. Please provide clear, shareable insights.";

//         setAgentSteps([]);
//         setAgentRole("");
//         setStreamingPreview("");
//         setAgentVerification(null);
//         setAgentRunTotalMs(undefined);

//         const streamed = await streamAgentRun(
//           {
//             message: text,
//             sessionId: sessionId || undefined,
//             anonSessionId: sessionId ? undefined : anonSessionId,
//             deepThink: thinkHarderEnabled,
//             history,
//             sharedProperty: sharedForAI ?? undefined,
//             userPromptTemplate: marketValuePrompt,
//             persona: agentPersona,
//             tier: agentTier,
//           },
//           {
//             onStreamStart: (meta) => {
//               agentRoleRef.current = meta.role;
//               agentRTLRef.current = meta.rtl;
//               setAgentRole(meta.role);
//             },
//             onStepsChange: (steps) => {
//               agentStepsRef.current = steps;
//               setAgentSteps(steps);
//             },
//             onTextDelta: (_d, full) => setStreamingPreview(full),
//             onVerification: (v) => setAgentVerification(v),
//             onFinal: ({ message, sessionId: sid, verification, totalMs }) => {
//               if (sid && !sessionId) setSessionId(sid);
//               if (verification) setAgentVerification(verification);
//               if (totalMs != null) setAgentRunTotalMs(totalMs);
//               (message as any).thoughtHarder = thinkHarderEnabled;
//               (message as any).agentSteps = [...agentStepsRef.current];
//               (message as any).agentVerification = verification;
//               (message as any).agentRunTotalMs = totalMs;
//               (message as any).agentRole = agentRoleRef.current;
//               (message as any).agentRTL = agentRTLRef.current;
//               setMessages((p) => [...p, message]);
//               setStreamingPreview("");
//               Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//             },
//             onError: (errMsg) => {
//               setMessages((p) => [
//                 ...p,
//                 {
//                   id: generateMessageId(),
//                   role: "assistant",
//                   content: errMsg,
//                   timestamp: Date.now(),
//                 },
//               ]);
//             },
//           },
//         );

//         if (!streamed) {
//           const res = await sendMessageToAI(
//             text,
//             sessionId || undefined,
//             thinkHarderEnabled,
//             history,
//             sharedForAI ?? undefined,
//             marketValuePrompt,
//             sessionId ? undefined : anonSessionId,
//           );
//           if (res.blocked) {
//             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//             setMessages((p) => [
//               ...p,
//               {
//                 id: generateMessageId(),
//                 role: "assistant",
//                 content: t(
//                   "aiChat.cannotProcess",
//                   "I can't process that request.",
//                 ),
//                 timestamp: Date.now(),
//               },
//             ]);
//             setBlocked(true);
//             return;
//           }
//           if (res.success && res.message) {
//             if (res.sessionId && !sessionId) setSessionId(String(res.sessionId));
//             (res.message as any).thoughtHarder = thinkHarderEnabled;
//             setMessages((p) => [...p, res.message!]);
//             Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//           } else {
//             setMessages((p) => [
//               ...p,
//               {
//                 id: generateMessageId(),
//                 role: "assistant",
//                 content:
//                   res.error || t("aiChat.errorOccurred", "An error occurred."),
//                 timestamp: Date.now(),
//               },
//             ]);
//           }
//         }
//       } catch {
//         setMessages((p) => [
//           ...p,
//           {
//             id: generateMessageId(),
//             role: "assistant",
//             content: t(
//               "aiChat.connectionIssue",
//               "Connection issue. Please try again.",
//             ),
//             timestamp: Date.now(),
//           },
//         ]);
//       } finally {
//         setThinking(false);
//         setLoading(false);
//       }
//     },
//     [
//       loading,
//       blocked,
//       sessionId,
//       messages,
//       sharedPropertyContext,
//       thinkHarderEnabled,
//       anonSessionId,
//       agentPersona,
//       agentTier,
//     ],
//   );

//   const handleSend = useCallback(async () => {
//     await sendText(input);
//   }, [sendText, input]);

//   const handleChip = (text: string) => {
//     setInput(text);
//     setShowWelcome(false);
//     setTimeout(() => {
//       sendText(text);
//     }, 80);
//   };

//   const handlePickerSubmit = useCallback(
//     (promptText: string) => {
//       sendText(promptText);
//     },
//     [sendText],
//   );

//   const toggleThinkHarder = useCallback(() => {
//     Haptics.selectionAsync();
//     setThinkHarderEnabled((v) => !v);
//   }, []);

//   const latestAssistantMessageId = useMemo(() => {
//     for (let i = messages.length - 1; i >= 0; i -= 1)
//       if (messages[i]?.role === "assistant") return messages[i].id;
//     return null;
//   }, [messages]);

//   // ── LOADING SCREEN ──
//   if (loadingHistory) {
//     return (
//       <View style={[styles.screen, styles.center]}>
//         <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
//         <Animated.View
//           entering={FadeIn.duration(380)}
//           style={styles.loadingWrap}
//         >
//           <NavigationArrow size={40} color={C.textMuted} weight="thin" />
//           <Text style={styles.loadingText}>
//             {t("aiChat.brand", "Meskeny AI")}
//           </Text>
//         </Animated.View>
//       </View>
//     );
//   }

//   const isEmpty = showWelcome && messages.length <= 1;

//   return (
//     <KeyboardAvoidingView
//       style={[styles.screen, { paddingTop: insets.top }]}
//       behavior={IOS ? "padding" : "height"}
//       keyboardVerticalOffset={0}
//       onStartShouldSetResponderCapture={() => {
//         Keyboard.dismiss();
//         return false;
//       }}
//     >
//       <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

//       <Header
//         activeTab={activeTab}
//         onTabChange={setActiveTab}
//         onBack={() => (navigation as any).goBack?.()}
//         onInfo={() => setShowAIOverview(true)}
//       />

//       {/* ── CONTENT ── */}
//       {isEmpty ? (
//         <ScrollView
//           style={{ flex: 1 }}
//           contentContainerStyle={{ flexGrow: 1 }}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//         >
//           <View style={styles.emptyLayout}>
//             <View style={styles.emptyHero}>
//               <Animated.View style={emptyCompactStyle}>
//                 <EmptyState />
//               </Animated.View>
//             </View>
//             <StarterPromptsPanel onSelectPrompt={handleChip} t={t as any} />
//           </View>
//         </ScrollView>
//       ) : (
//         <FlatList
//           ref={listRef}
//           data={messages}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={[
//             styles.listContent,
//             { paddingBottom: 12 + insets.bottom },
//           ]}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//           keyboardDismissMode="on-drag"
//           renderItem={({ item }) => (
//             <MessageBubble
//               message={item}
//               animateTyping={
//                 item.role === "assistant" &&
//                 item.id === latestAssistantMessageId
//               }
//               onQuickReply={handleChip}
//               onPickerSubmit={handlePickerSubmit}
//               pickerDisabled={loading || blocked}
//               pickerSessionId={sessionId || undefined}
//               pickerAnonSessionId={sessionId ? undefined : anonSessionId}
//               onFeedback={async (id, signal) => {
//                 setFeedbackByMessageId((p) => ({ ...p, [item.id]: signal }));
//                 const ok = await submitAIFeedback(id, signal);
//                 if (!ok)
//                   setFeedbackByMessageId((p) => {
//                     const n = { ...p };
//                     delete n[item.id];
//                     return n;
//                   });
//               }}
//               feedbackGiven={feedbackByMessageId[item.id]}
//             />
//           )}
//           ListFooterComponent={
//             thinking ? (
//               <View>
//                 {agentSteps.length > 0 ? (
//                   <>
//                     <AgentRunTimeline
//                       steps={agentSteps}
//                       verification={agentVerification}
//                       totalMs={agentRunTotalMs}
//                       role={agentRole}
//                       deepThink={thinkHarderEnabled}
//                     />
//                     {streamingPreview.trim().length > 0 &&
//                       !thinkHarderEnabled && (
//                         <View style={styles.streamingPreviewWrap}>
//                           <Text
//                             style={[
//                               styles.streamingPreviewText,
//                               agentRTLRef.current && styles.rtlText,
//                               agentRTLRef.current && styles.arabicText,
//                             ]}
//                           >
//                             {streamingPreview}
//                           </Text>
//                         </View>
//                       )}
//                   </>
//                 ) : (
//                   <View style={styles.thinkingRow}>
//                     <ThinkingIndicator />
//                     <Text style={styles.thinkingLabel}>
//                       {t("aiChat.thinking.analyzing", "Thinking…")}
//                     </Text>
//                   </View>
//                 )}
//               </View>
//             ) : null
//           }
//         />
//       )}

//       {/* ── INPUT AREA ── */}
//       <View
//         style={[
//           styles.bottomArea,
//           { paddingBottom: Math.max(insets.bottom, 12) },
//         ]}
//       >
//         {/* Shared property context strip */}
//         {sharedPropertyContext && (
//           <View style={styles.contextStrip}>
//             {sharedPropertyContext.image ? (
//               <Image
//                 source={{ uri: sharedPropertyContext.image }}
//                 style={styles.contextStripImg}
//               />
//             ) : (
//               <View
//                 style={[styles.contextStripImg, styles.contextStripImgFallback]}
//               >
//                 <House size={13} color={C.textSub} weight="fill" />
//               </View>
//             )}
//             <View style={{ flex: 1, minWidth: 0 }}>
//               <Text style={styles.contextStripLabel}>
//                 {t("aiChat.replyOnProperty", "Replying about")}
//               </Text>
//               <Text style={styles.contextStripTitle} numberOfLines={1}>
//                 {sharedPropertyContext.title ||
//                   t("aiChat.property", "Property")}
//               </Text>
//             </View>
//             <Text style={styles.contextStripPrice} numberOfLines={1}>
//               {sharedPropertyContext.listing_price
//                 ? `${Number(sharedPropertyContext.listing_price).toLocaleString()} MRU`
//                 : sharedPropertyContext.city || ""}
//             </Text>
//           </View>
//         )}

//         <GlowyInput
//           message={input}
//           setMessage={setInput}
//           handleSendMessage={(text: string) => {
//             if (!text.trim()) return;
//             sendText(text);
//           }}
//           handleSubmitEditing={() => {
//             if (input.trim().length === 0) return;
//             sendText(input);
//           }}
//           placeholder={t(
//             "aiChat.inputPlaceholder",
//             "Ask anything about properties…",
//           )}
//           deepThinkEnabled={thinkHarderEnabled}
//           onToggleDeepThink={toggleThinkHarder}
//           deepThinkLabel={t("aiChat.deepThink", "Deep think")}
//           autoLabel={t("aiChat.auto", "Auto")}
//         />
//       </View>

//       <MenuSheet
//         visible={menuOpen}
//         onClose={() => setMenuOpen(false)}
//         onNewChat={newSession}
//         onHistory={() => console.log("History")}
//       />

//       <AIOverviewSheet
//         visible={showAIOverview}
//         onClose={() => setShowAIOverview(false)}
//       />
//     </KeyboardAvoidingView>
//   );
// };

// // ─── STYLES ───────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   screen: { flex: 1, backgroundColor: C.bg },
//   center: { justifyContent: "center", alignItems: "center" },

//   // ── Loading ──
//   loadingWrap: { alignItems: "center", gap: 14 },
//   loadingText: {
//     fontSize: 15,
//     fontWeight: "500",
//     color: C.textSub,
//     letterSpacing: -0.2,
//   },

//   // ── Header ──
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 16,
//     paddingVertical: 11,
//     backgroundColor: C.bg,
//     borderBottomWidth: StyleSheet.hairlineWidth,
//     borderBottomColor: C.border,
//   },
//   headerBtn: {
//     width: 36,
//     height: 36,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   headerCenter: {
//     flex: 1,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   headerTab: { alignItems: "center", paddingVertical: 3, paddingHorizontal: 4 },
//   headerTabText: {
//     fontSize: 15,
//     fontWeight: "400",
//     color: C.textSub,
//     letterSpacing: -0.15,
//   },
//   headerTabTextActive: { color: C.text, fontWeight: "600" },
//   headerTabUnderline: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     height: 1.5,
//     borderRadius: 1,
//     backgroundColor: C.text,
//   },

//   // ── Empty state ──
//   emptyLayout: { flexGrow: 1, minHeight: H * 0.38 },
//   emptyHero: {
//     flex: 1,
//     minHeight: 0,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   emptyRoot: { alignItems: "center", justifyContent: "center" },
//   emptyCardLeft: {
//     position: "absolute",
//     top: 24,
//     left: "16%",
//     zIndex: 1,
//     width: 104,
//     height: 146,
//     borderRadius: RADIUS.lg,
//     overflow: "hidden",
//     backgroundColor: C.bgCard,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 4,
//   },
//   emptyCardCenter: {
//     position: "absolute",
//     top: 4,
//     alignSelf: "center",
//     zIndex: 3,
//     width: 118,
//     height: 162,
//     borderRadius: RADIUS.lg,
//     overflow: "hidden",
//     backgroundColor: C.bgCard,
//     borderWidth: 1.5,
//     borderColor: C.border,
//     shadowColor: "#000",
//     shadowOpacity: 0.16,
//     shadowRadius: 14,
//     shadowOffset: { width: 0, height: 5 },
//     elevation: 8,
//   },
//   emptyCardRight: {
//     position: "absolute",
//     top: 40,
//     right: "16%",
//     zIndex: 2,
//     width: 96,
//     height: 134,
//     borderRadius: RADIUS.md,
//     overflow: "hidden",
//     backgroundColor: C.bgCard,
//     shadowColor: "#000",
//     shadowOpacity: 0.07,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 2 },
//     elevation: 3,
//   },
//   emptyCardLabel: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: "rgba(26,25,23,0.72)",
//     paddingVertical: 6,
//     alignItems: "center",
//   },
//   emptyCardLabelText: {
//     color: "#FFFFFF",
//     fontWeight: "700",
//     fontSize: 11.5,
//     letterSpacing: 0.4,
//   },

//   // ── Starter panel ──
//   starterPanel: {
//     width: "100%",
//     paddingHorizontal: 16,
//     paddingTop: 8,
//     paddingBottom: 10,
//   },
//   starterTitle: {
//     fontSize: 22,
//     fontWeight: "600",
//     color: C.text,
//     letterSpacing: -0.3,
//     lineHeight: 28,
//     marginBottom: 14,
//   },
//   starterList: {
//     gap: 8,
//   },
//   starterChip: {
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: RADIUS.pill,
//     backgroundColor: C.bgChip,
//     borderWidth: StyleSheet.hairlineWidth,
//     borderColor: C.borderSoft,
//   },
//   starterChipText: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: C.text,
//     lineHeight: 20,
//   },

//   // ── Messages list ──
//   listContent: { paddingHorizontal: 16, paddingTop: 20, flexGrow: 1 },

//   // ── User message ──
//   userMsgRow: { alignItems: "flex-end", marginBottom: 22 },
//   userBubble: {
//     backgroundColor: C.bgUserBubble,
//     borderRadius: 20,
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     maxWidth: "78%",
//   },
//   userBubbleText: { fontSize: 15, color: C.text, lineHeight: 24 },

//   // Reply-on-property pill (above user bubble)
//   replyOnPropertyPill: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     paddingHorizontal: 10,
//     paddingVertical: 7,
//     borderRadius: RADIUS.md,
//     borderWidth: 1,
//     borderColor: C.border,
//     backgroundColor: C.bgMuted,
//     marginBottom: 5,
//     maxWidth: "88%",
//   },
//   replyOnPropertyImg: {
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     backgroundColor: C.bgChip,
//   },
//   replyOnPropertyImgFallback: {
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   replyOnPropertyLabel: {
//     fontSize: 10,
//     color: C.textMuted,
//     fontWeight: "700",
//     textTransform: "uppercase",
//     letterSpacing: 0.4,
//   },
//   replyOnPropertyTitle: {
//     fontSize: 12.5,
//     color: C.text,
//     fontWeight: "700",
//     marginTop: 1,
//   },

//   // ── AI message ──
//   aiMsgBlock: {
//     marginBottom: 26,
//     width: "100%",
//     maxWidth: "100%",
//     alignSelf: "stretch",
//   },
//   aiRichBlock: { gap: 0, marginBottom: 6, width: "100%", maxWidth: "100%" },
//   rtlText: {
//     writingDirection: "rtl",
//     textAlign: "right",
//     alignSelf: "stretch",
//     width: "100%",
//   },
//   arabicText: {
//     fontSize: 16,
//     lineHeight: 28,
//     letterSpacing: 0,
//     flexShrink: 1,
//   },
//   aiTypewriterRow: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     alignItems: "flex-end",
//     width: "100%",
//     maxWidth: "100%",
//   },
//   aiTypewriterRowRTL: {
//     width: "100%",
//     maxWidth: "100%",
//     flexDirection: "column",
//     alignItems: "stretch",
//   },
//   streamCaret: {
//     width: 7,
//     height: 17,
//     borderRadius: 2,
//     backgroundColor: C.textSub,
//     marginLeft: 3,
//     marginBottom: 14,
//     opacity: 0.6,
//   },
//   streamCaretRTL: { marginLeft: 0, marginRight: 3, alignSelf: "flex-end" },
//   tapSkipHint: {
//     fontSize: 10.5,
//     color: C.textMuted,
//     marginTop: 3,
//     marginBottom: 3,
//   },
//   pickerWrap: { marginBottom: 12 },

//   aiText: {
//     fontSize: 15,
//     color: C.text,
//     lineHeight: 24,
//     marginBottom: 13,
//     flexShrink: 1,
//     width: "100%",
//     maxWidth: "100%",
//   },
//   aiTextBold: {
//     fontSize: 15,
//     color: C.text,
//     lineHeight: 23,
//     fontWeight: "700",
//   },
//   aiH3: {
//     fontSize: 15.5,
//     color: C.text,
//     lineHeight: 22,
//     fontWeight: "700",
//     marginTop: 2,
//     marginBottom: 5,
//   },
//   aiH3Bold: {
//     fontSize: 15.5,
//     color: C.text,
//     lineHeight: 22,
//     fontWeight: "800",
//   },

//   // Table
//   aiTableScroll: { marginBottom: 14, maxWidth: "100%" },
//   aiTableScrollContent: { flexGrow: 1 },
//   aiTableWrap: {
//     borderWidth: 1,
//     borderColor: C.border,
//     borderRadius: RADIUS.md,
//     overflow: "hidden",
//     backgroundColor: C.bgCard,
//     minWidth: 280,
//   },
//   aiTableRowHeader: {
//     flexDirection: "row",
//     backgroundColor: C.bgMuted,
//     borderBottomWidth: StyleSheet.hairlineWidth,
//     borderBottomColor: C.border,
//   },
//   aiTableHeaderCell: {
//     flex: 1,
//     fontSize: 11.5,
//     color: C.text,
//     fontWeight: "700",
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//   },
//   aiTableRow: {
//     flexDirection: "row",
//     borderBottomWidth: StyleSheet.hairlineWidth,
//     borderBottomColor: C.borderSoft,
//   },
//   aiTableRowAlt: { backgroundColor: C.bgMuted },
//   aiTableCell: {
//     flex: 1,
//     fontSize: 12,
//     color: C.textSub,
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//     lineHeight: 17,
//   },

//   // Deep think badge
//   deepThinkBadge: {
//     alignSelf: "flex-start",
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//     backgroundColor: C.bgChip,
//     borderRadius: RADIUS.pill,
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     marginBottom: 8,
//     borderWidth: StyleSheet.hairlineWidth,
//     borderColor: C.borderSoft,
//   },
//   deepThinkBadgeText: {
//     color: C.textSub,
//     fontSize: 11,
//     fontWeight: "500",
//   },

//   // Thinking
//   thinkingRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     paddingVertical: 10,
//     paddingHorizontal: 2,
//   },
//   thinkingWrap: {
//     flexDirection: "row",
//     alignItems: "flex-end",
//     gap: 5,
//     height: 22,
//   },
//   thinkingLabel: { fontSize: 12.5, color: C.textSub },
//   thinkingDot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: C.textMuted,
//   },

//   // Streaming preview
//   streamingPreviewWrap: {
//     marginTop: 4,
//     marginBottom: 6,
//     paddingHorizontal: 0,
//     paddingVertical: 0,
//     width: "100%",
//     maxWidth: "100%",
//   },
//   streamingPreviewText: {
//     fontSize: 15,
//     lineHeight: 22,
//     color: C.textSub,
//     width: "100%",
//     maxWidth: "100%",
//     flexShrink: 1,
//   },

//   // Sources
//   sourcesRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 7,
//     marginBottom: 9,
//   },
//   sourceDots: { flexDirection: "row", alignItems: "center" },
//   sourceDot: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     borderWidth: 1.5,
//     borderColor: C.bgCard,
//   },
//   sourcesText: { fontSize: 12.5, fontWeight: "500", color: C.textSub },

//   // Action row
//   actionRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 0,
//     marginBottom: 10,
//   },
//   actionBtn: {
//     width: 32,
//     height: 32,
//     alignItems: "center",
//     justifyContent: "center",
//     borderRadius: 6,
//   },

//   // Follow-up chips
//   followUps: { gap: 7, marginBottom: 6, paddingRight: 4 },
//   followUpChip: {
//     paddingVertical: 9,
//     paddingHorizontal: 14,
//     borderRadius: RADIUS.pill,
//     borderWidth: StyleSheet.hairlineWidth,
//     borderColor: C.borderSoft,
//     backgroundColor: C.bgChip,
//   },
//   followUpText: { fontSize: 14, color: C.text, fontWeight: "500" },

//   // Property results
//   propsBlock: { marginBottom: 12, gap: 8 },
//   landMapsBlock: { gap: 10, marginTop: 4 },
//   propsSectionLabel: {
//     fontSize: 12,
//     fontWeight: "500",
//     color: C.textMuted,
//     marginBottom: 4,
//   },
//   propsCarousel: { gap: 10, paddingRight: 16 },

//   // Bottom input area
//   bottomArea: {
//     backgroundColor: C.bg,
//     borderTopWidth: StyleSheet.hairlineWidth,
//     borderTopColor: C.border,
//     paddingTop: 8,
//   },

//   // Shared context strip
//   contextStrip: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//     marginHorizontal: 12,
//     marginBottom: 7,
//     marginTop: 2,
//     paddingHorizontal: 11,
//     paddingVertical: 8,
//     borderRadius: RADIUS.md,
//     borderWidth: 1,
//     borderColor: C.border,
//     backgroundColor: C.bgMuted,
//   },
//   contextStripImg: {
//     width: 30,
//     height: 30,
//     borderRadius: RADIUS.sm,
//     backgroundColor: C.bgChip,
//   },
//   contextStripImgFallback: { alignItems: "center", justifyContent: "center" },
//   contextStripLabel: {
//     fontSize: 9.5,
//     color: C.textMuted,
//     fontWeight: "700",
//     textTransform: "uppercase",
//     letterSpacing: 0.4,
//   },
//   contextStripTitle: {
//     fontSize: 13,
//     color: C.text,
//     fontWeight: "700",
//     marginTop: 1,
//   },
//   contextStripPrice: { fontSize: 12, color: C.textSub, fontWeight: "500" },

//   // Menu sheet
//   menuSheet: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     zIndex: 100,
//     backgroundColor: C.bgSheet,
//     borderTopLeftRadius: RADIUS.xl,
//     borderTopRightRadius: RADIUS.xl,
//     borderTopWidth: StyleSheet.hairlineWidth,
//     borderColor: C.border,
//     paddingBottom: 44,
//     paddingTop: 10,
//     ...(IOS
//       ? {
//           shadowColor: "rgba(0,0,0,0.10)",
//           shadowOffset: { width: 0, height: -3 },
//           shadowOpacity: 1,
//           shadowRadius: 16,
//         }
//       : { elevation: 10 }),
//   },
//   menuHandle: {
//     alignSelf: "center",
//     width: 32,
//     height: 3.5,
//     borderRadius: 2,
//     backgroundColor: C.border,
//     marginBottom: 14,
//   },
//   menuRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 14,
//     paddingHorizontal: 22,
//     paddingVertical: 15,
//   },
//   menuRowText: { fontSize: 15, fontWeight: "400", color: C.text },
//   menuDivider: {
//     height: StyleSheet.hairlineWidth,
//     backgroundColor: C.border,
//     marginHorizontal: 22,
//   },

//   // AI overview sheet
//   sheetScrollContent: {
//     paddingHorizontal: 20,
//     paddingBottom: 28,
//     paddingTop: 8,
//   },
//   sheetHeaderRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingBottom: 12,
//   },
//   sheetTitle: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: C.text,
//     letterSpacing: -0.2,
//     flex: 1,
//     paddingRight: 12,
//   },
//   sheetCloseBtn: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: RADIUS.md,
//     borderWidth: 1,
//     borderColor: C.border,
//     backgroundColor: C.bgChip,
//   },
//   sheetCloseBtnText: { fontSize: 13, fontWeight: "600", color: C.text },
//   sheetBody: { fontSize: 14, lineHeight: 21, color: C.textSub },
// });

// export default AIChatScreen;

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  Share,
  Pressable
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  withDelay,
  interpolate,
  Easing,
  FadeIn,
  FadeInUp
} from "react-native-reanimated";
import {
  Sparkle,
  PaperPlaneTilt,
  House,
  NavigationArrow,
  Clock,
  ChatCircle,
  Copy,
  Check,
  ChartBar,
  MapTrifold,
  ArrowCounterClockwise,
  ThumbsUp,
  ThumbsDown,
  ShareNetwork,
  ArrowLeft,
  Info,
  Headset,
  ChartLineUp,
  Buildings,
  MapPin
} from "phosphor-react-native";
import * as Clipboard from "expo-clipboard";
import {
  ChatMessage,
  PropertyRecommendation,
  sendMessageToAI,
  submitAIFeedback,
  getChatSessions,
  getChatSession,
  createChatSession,
  getInitialGreeting,
  generateMessageId,
  generateSessionId,
  normalizeChatSessionId,
  getQuickReplyMessage,
  resolveQuickReplySendText,
  AIHistoryMessage,
  SharedPropertyContext
} from "../services/aiService";
import {
  streamAgentRun,
  type AgentStep,
  type AgentVerification
} from "../services/agentRunService";
import { AgentRunTimeline } from "../components/agent/AgentRunTimeline";
import { EscalationBanner } from "../components/ai/EscalationBanner";
import { SpecialistContactSheet } from "../components/ai/SpecialistContactSheet";
import { useAIEscalation } from "../hooks/useAIEscalation";
import { useUser } from "../hooks/useUser";
import { useAgentRunContext } from "../hooks/useAgentRunContext";
import GlowyInput from "../components/GlowyInput";
import { useSmoothTextReveal, isRTLText } from "../hooks/useSmoothTextReveal";
import { AIPropertyCarouselCard } from "../components/agent/AIPropertyCarouselCard";
import { AIResultsMap } from "../components/agent/AIResultsMap";
import { AILandResultsOverviewMap } from "../components/agent/AILandResultsOverviewMap";
import { AiSearchIntentPanel } from "../components/agent/AiSearchIntentPanel";
import {
  formatUserMessageForDisplay,
  isClarificationQuickReplies,
  sanitizeAssistantContentForDisplay
} from "../utils/aiChatDisplay";
import { MotiView } from "moti";
import AiSearchFiltersPicker from "../components/AiSearchFiltersPicker";
import { api } from "../services/api";
import CompatBottomSheet, {
  BottomSheetScrollView
} from "../components/CompatBottomSheet";
import { BottomSheetBackdrop } from "@gorhom/bottom-sheet";

const { width: W, height: H } = Dimensions.get("window");
const IOS = Platform.OS === "ios";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: "#FFFFFF",
  bgCard: "#FFFFFF",
  bgInput: "#F4F4F4",
  bgUserBubble: "#F4F4F4",
  bgChip: "#F4F4F4",
  bgChipActive: "#0D0D0D",
  bgTag: "#F4F4F4",
  bgSheet: "#FFFFFF",
  bgMuted: "#F7F7F8",

  border: "#E5E5E5",
  borderSoft: "#EBEBEB",

  text: "#0D0D0D",
  textSub: "#6E6E80",
  textMuted: "#ACACBE",
  textPlaceholder: "#ACACBE",
  textInvert: "#FFFFFF",

  accent: "#0D0D0D",
  accentLight: "#F4F4F4",

  positive: "#10A37F",
  negative: "#EF4444"
};

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999
};

// ─── STARTER PROMPTS ──────────────────────────────────────────────────────────
const STARTER_PROMPTS: Array<{
  action: string;
  Icon: React.ComponentType<{ size?: number; color?: string; weight?: any }>;
  titleKey: string;
  subtitleKey: string;
  promptKey: string;
  defaults: { title: string; subtitle: string; prompt: string };
}> = [
  {
    action: "starter_rent",
    Icon: Buildings,
    titleKey: "aiChat.starters.rent.title",
    subtitleKey: "aiChat.starters.rent.subtitle",
    promptKey: "aiChat.starters.rent.prompt",
    defaults: {
      title: "Find a rental",
      subtitle: "Nouakchott · set your budget",
      prompt:
        "I'm looking for rental properties in Nouakchott with a monthly budget around 80,000–140,000 MRU. Please show matching options and ask me for any missing details (area, bedrooms, move‑in date)."
    }
  },
  {
    action: "starter_buy",
    Icon: House,
    titleKey: "aiChat.starters.buy.title",
    subtitleKey: "aiChat.starters.buy.subtitle",
    promptKey: "aiChat.starters.buy.prompt",
    defaults: {
      title: "Buy a home",
      subtitle: "Bedrooms · area · budget",
      prompt:
        "I want to buy a home (about 3 bedrooms). Ask me the key questions you need (city/area, budget, timeline), then suggest suitable listings."
    }
  },
  {
    action: "starter_area",
    Icon: MapPin,
    titleKey: "aiChat.starters.area.title",
    subtitleKey: "aiChat.starters.area.subtitle",
    promptKey: "aiChat.starters.area.prompt",
    defaults: {
      title: "Pick a neighborhood",
      subtitle: "Budget · commute · must‑haves",
      prompt:
        "Help me choose a neighborhood that fits my budget and commute. Ask where I work or study, my budget, and must‑have amenities, then recommend areas in Mauritania."
    }
  },
  {
    action: "starter_invest",
    Icon: ChartLineUp,
    titleKey: "aiChat.starters.invest.title",
    subtitleKey: "aiChat.starters.invest.subtitle",
    promptKey: "aiChat.starters.invest.prompt",
    defaults: {
      title: "Investment opportunities",
      subtitle: "Rationale · risks · returns",
      prompt:
        "Show me investment-style property and land opportunities available now. For each option, give a concise rationale and list practical risks to verify (title, access, utilities)."
    }
  }
];

const TABS = ["Find"];

// ─── THINKING INDICATOR ───────────────────────────────────────────────────────
const ThinkingIndicator: React.FC = () => {
  const d1 = useSharedValue(0.3);
  const d2 = useSharedValue(0.3);
  const d3 = useSharedValue(0.3);

  useEffect(() => {
    const bounce = (sv: any, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 380, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.3, {
              duration: 380,
              easing: Easing.inOut(Easing.ease)
            })
          ),
          -1,
          false
        )
      );
    };
    bounce(d1, 0);
    bounce(d2, 150);
    bounce(d3, 300);
  }, []);

  const s1 = useAnimatedStyle(() => ({
    opacity: d1.value,
    transform: [{ translateY: interpolate(d1.value, [0.3, 1], [0, -3.5]) }]
  }));
  const s2 = useAnimatedStyle(() => ({
    opacity: d2.value,
    transform: [{ translateY: interpolate(d2.value, [0.3, 1], [0, -3.5]) }]
  }));
  const s3 = useAnimatedStyle(() => ({
    opacity: d3.value,
    transform: [{ translateY: interpolate(d3.value, [0.3, 1], [0, -3.5]) }]
  }));

  return (
    <View style={styles.thinkingWrap}>
      <Animated.View style={[styles.thinkingDot, s1]} />
      <Animated.View style={[styles.thinkingDot, s2]} />
      <Animated.View style={[styles.thinkingDot, s3]} />
    </View>
  );
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const isLandmarkRecommendation = (rec: PropertyRecommendation): boolean => {
  const src = String((rec as any)?.source ?? "")
    .trim()
    .toLowerCase();
  return src === "landmark" || src.includes("landmark");
};

const openRecommendationDetails = async (
  nav: any,
  rec: PropertyRecommendation
) => {
  if (isLandmarkRecommendation(rec)) {
    try {
      const res = await api.get(`/landmarks/${rec.id}`);
      const lm = res?.data?.landmark;
      if (lm) {
        nav.navigate("LandmarkDetails", { landmark: lm });
        return;
      }
    } catch (e) {
      console.warn("AIChat landmark fetch failed:", e);
    }
    return;
  }
  if (rec.type === "sale") {
    nav.navigate("PropertySaleDetails", { propertyId: rec.id });
    return;
  }
  nav.navigate("PropertyDetails", { propertyID: rec.id });
};

function hasArabicText(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text || "");
}

// ─── STREAM CARET ─────────────────────────────────────────────────────────────
const StreamCaret: React.FC<{ rtl?: boolean }> = ({ rtl }) => {
  const op = useSharedValue(1);
  useEffect(() => {
    op.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 480 }),
        withTiming(1, { duration: 480 })
      ),
      -1
    );
  }, [op]);
  const style = useAnimatedStyle(() => ({ opacity: op.value }));
  return (
    <Animated.View
      style={[styles.streamCaret, rtl && styles.streamCaretRTL, style]}
    />
  );
};

// ─── MARKDOWN ─────────────────────────────────────────────────────────────────
// LTR only — RTL content is rendered as atomic Text blocks (see renderMessageContent)
function renderMarkdownText(
  text: string,
  baseStyle: any,
  boldStyle: any
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /\*\*(.*?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last)
      nodes.push(
        <Text key={`t-${k++}`} style={baseStyle}>
          {text.slice(last, m.index)}
        </Text>
      );
    nodes.push(
      <Text key={`b-${k++}`} style={boldStyle}>
        {m[1]}
      </Text>
    );
    last = re.lastIndex;
  }
  if (last < text.length)
    nodes.push(
      <Text key={`t-${k++}`} style={baseStyle}>
        {text.slice(last)}
      </Text>
    );
  return nodes;
}

function isPipeTableLine(line: string): boolean {
  return /^\s*\|.*\|\s*$/.test(line);
}
function isPipeTableSeparator(line: string): boolean {
  const t = line.trim();
  return /^\|?[\s:-]+(\|[\s:-]+)+\|?$/.test(t) && t.includes("-");
}
function parsePipeRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

/**
 * Renders AI message content into React Native elements.
 *
 * Arabic/RTL critical path:
 *   — Each paragraph renders as one atomic <Text> inside a full-width <View>.
 *   — This prevents React Native's text engine from fragmenting Arabic glyphs
 *     into separate inline nodes, which destroys ligatures and bidi ordering.
 *   — The container switches to flexDirection:"column" (aiTypewriterColumnRTL)
 *     so block paragraphs stack correctly instead of flowing horizontally.
 */
function renderMessageContent(text: string, isRTL = false): React.ReactNode[] {
  const lines = (text || "").split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const next = i + 1 < lines.length ? lines[i + 1] : "";
    const tableStart = isPipeTableLine(line) && isPipeTableSeparator(next);

    if (!tableStart) {
      const para: string[] = [];
      while (i < lines.length) {
        const l = lines[i];
        const n = i + 1 < lines.length ? lines[i + 1] : "";
        if (isPipeTableLine(l) && isPipeTableSeparator(n)) break;
        para.push(l);
        i += 1;
      }

      para.forEach((rawLine) => {
        const l = rawLine.replace(/\r/g, "");
        if (!l.trim()) return;

        // ── H2 heading ──
        if (
          l.trimStart().startsWith("## ") &&
          !l.trimStart().startsWith("### ")
        ) {
          const heading = l.trimStart().replace(/^##\s+/, "");
          out.push(
            <Text
              key={`h2-${key++}`}
              style={[styles.aiH2, isRTL && styles.rtlText]}
            >
              {isRTL
                ? heading
                : renderMarkdownText(heading, styles.aiH2, styles.aiH2Bold)}
            </Text>
          );
          return;
        }

        // ── H3 heading ──
        if (l.trimStart().startsWith("### ")) {
          const heading = l.trimStart().replace(/^###\s+/, "");
          out.push(
            <Text
              key={`h3-${key++}`}
              style={[styles.aiH3, isRTL && styles.rtlText]}
            >
              {isRTL
                ? heading
                : renderMarkdownText(heading, styles.aiH3, styles.aiH3Bold)}
            </Text>
          );
          return;
        }

        // ── RTL paragraph — atomic block, never fragmented ──
        if (isRTL) {
          out.push(
            <View key={`pw-${key++}`} style={styles.rtlParagraphWrap}>
              <Text style={[styles.aiText, styles.rtlText, styles.arabicText]}>
                {l}
              </Text>
            </View>
          );
          return;
        }

        // ── LTR paragraph ──
        out.push(
          <Text key={`p-${key++}`} style={styles.aiText}>
            {renderMarkdownText(l, styles.aiText, styles.aiTextBold)}
          </Text>
        );
      });
      continue;
    }

    // ── Pipe table ──
    const header = parsePipeRow(line);
    i += 2;
    const rows: string[][] = [];
    while (i < lines.length && isPipeTableLine(lines[i])) {
      rows.push(parsePipeRow(lines[i]));
      i += 1;
    }
    out.push(
      <ScrollView
        key={`t-${key++}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.aiTableScroll}
        contentContainerStyle={styles.aiTableScrollContent}
      >
        <View style={styles.aiTableWrap}>
          <View style={styles.aiTableRowHeader}>
            {header.map((c, idx) => (
              <Text
                key={`h-${idx}`}
                style={[styles.aiTableHeaderCell, isRTL && styles.rtlText]}
              >
                {c}
              </Text>
            ))}
          </View>
          {rows.map((r, ridx) => (
            <View
              key={`r-${ridx}`}
              style={[
                styles.aiTableRow,
                ridx % 2 === 0 && styles.aiTableRowAlt
              ]}
            >
              {r.map((c, cidx) => (
                <Text
                  key={`c-${ridx}-${cidx}`}
                  style={[styles.aiTableCell, isRTL && styles.rtlText]}
                >
                  {c}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }
  return out;
}

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────────────────
const MessageBubble: React.FC<{
  message: ChatMessage;
  onQuickReply: (action: string) => void;
  onPickerSubmit?: (promptText: string) => void;
  pickerDisabled?: boolean;
  pickerSessionId?: string;
  pickerAnonSessionId?: string;
  onFeedback?: (
    interactionId: number,
    signal: "thumbs_up" | "thumbs_down"
  ) => void;
  feedbackGiven?: "thumbs_up" | "thumbs_down";
  animateTyping?: boolean;
}> = ({
  message,
  onQuickReply,
  onPickerSubmit,
  pickerDisabled,
  pickerSessionId,
  pickerAnonSessionId,
  onFeedback,
  feedbackGiven,
  animateTyping
}) => {
  const { t } = useTranslation();
  const nav = useNavigation();
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const fullAssistantText = !isUser
    ? sanitizeAssistantContentForDisplay(message.content)
    : "";
  const userDisplayText = isUser
    ? formatUserMessageForDisplay(message.content || "")
    : "";

  const serverRTL = !!(message as any).agentRTL;
  const assistantIsRTL =
    serverRTL ||
    isRTLText(fullAssistantText) ||
    hasArabicText(fullAssistantText);
  const userIsRTL =
    isRTLText(userDisplayText) || hasArabicText(userDisplayText);

  const {
    visibleText,
    complete: revealComplete,
    skip
  } = useSmoothTextReveal(fullAssistantText, !isUser && !!animateTyping);
  const assistantRevealDone = !animateTyping || revealComplete;

  const agentSteps = (message as any).agentSteps as AgentStep[] | undefined;
  const agentVerification = (message as any).agentVerification as
    | AgentVerification
    | undefined;
  const agentRunTotalMs = (message as any).agentRunTotalMs as
    | number
    | undefined;
  const agentRole = (message as any).agentRole as string | undefined;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(message.content);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      const text = message.content?.trim();
      if (!text) return;
      await Share.share({
        message: `${t("modelX46.sharePrefix", "Meskeny Model X46")}\n\n${text}`,
      });
      Haptics.selectionAsync();
    } catch (e) {
      console.warn("share failed:", e);
    }
  };

  const hasProps =
    !isUser &&
    Array.isArray(message.propertyRecommendations) &&
    message.propertyRecommendations.length > 0;

  const landResults: PropertyRecommendation[] = hasProps
    ? (message.propertyRecommendations ?? []).filter((p) =>
        isLandmarkRecommendation(p)
      )
    : [];

  const hasLandPlotMaps =
    landResults.length > 0 &&
    landResults.some(
      (p) => Array.isArray(p.plot_corners) && (p.plot_corners?.length ?? 0) >= 3
    );

  const hasPinMap =
    hasProps &&
    !hasLandPlotMaps &&
    message.propertyRecommendations!.some((p) => p.lat !== undefined);

  const clarificationUI =
    assistantRevealDone &&
    !hasProps &&
    isClarificationQuickReplies(message.quickReplies);

  const pickerTriggered =
    !isUser &&
    !hasProps &&
    !clarificationUI &&
    (message.quickReplies?.some((r) => r.action.startsWith("picker_")) ||
      /(\bcity\b|\bville\b|\bzone\b|\bquartier\b|\bprix\b|\bbudget\b|\bميزانيت|\bالمدينة\b|\bالمنطقة\b)/i.test(
        message.content || ""
      ));

  // ── USER BUBBLE ──────────────────────────────────────────────────────────
  if (isUser) {
    const replyOnProperty = (message as any).replyOnProperty as
      | SharedPropertyContext
      | undefined;
    return (
      <Animated.View entering={FadeIn.duration(180)} style={styles.userMsgRow}>
        {replyOnProperty ? (
          <View style={styles.replyOnPropertyPill}>
            {replyOnProperty.image ? (
              <Image
                source={{ uri: replyOnProperty.image }}
                style={styles.replyOnPropertyImg}
              />
            ) : (
              <View
                style={[
                  styles.replyOnPropertyImg,
                  styles.replyOnPropertyImgFallback
                ]}
              >
                <House size={12} color={C.textSub} weight="fill" />
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.replyOnPropertyLabel}>
                {t("aiChat.replyOnProperty", "Replying about")}
              </Text>
              <Text style={styles.replyOnPropertyTitle} numberOfLines={1}>
                {replyOnProperty.title || t("aiChat.property", "Property")}
              </Text>
            </View>
          </View>
        ) : null}
        <TouchableOpacity
          activeOpacity={0.85}
          onLongPress={async () => {
            await Clipboard.setStringAsync(message.content);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
        >
          <View style={styles.userBubble}>
            <Text
              style={[
                styles.userBubbleText,
                userIsRTL && styles.rtlText,
                userIsRTL && styles.arabicText
              ]}
            >
              {userDisplayText}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ── AI MESSAGE ────────────────────────────────────────────────────────────
  return (
    <View style={styles.aiMsgBlock}>
      {agentSteps && agentSteps.length > 0 && (
        <AgentRunTimeline
          steps={agentSteps}
          verification={agentVerification}
          totalMs={agentRunTotalMs}
          role={agentRole}
          deepThink={!!(message as any).thoughtHarder}
          collapsedDefault
        />
      )}

      {/*
       * Typewriter block.
       * LTR → row + wrap container (paragraph Text nodes fill width individually).
       * RTL → column container (each View/Text block stacks naturally).
       * Pressing anywhere skips the reveal animation.
       */}
      <Pressable
        onPress={() => {
          if (animateTyping && !revealComplete) skip();
        }}
        style={styles.aiRichBlock}
      >
        <View
          style={
            assistantIsRTL
              ? styles.aiTypewriterColumnRTL
              : styles.aiTypewriterRowLTR
          }
        >
          {renderMessageContent(visibleText, assistantIsRTL)}

          {/* LTR caret sits inline at end of last text run */}
          {animateTyping && !revealComplete && !assistantIsRTL && (
            <StreamCaret />
          )}
        </View>

        {/* RTL caret below the last paragraph block */}
        {animateTyping && !revealComplete && assistantIsRTL && (
          <View style={styles.rtlCaretRow}>
            <StreamCaret rtl />
          </View>
        )}

        {animateTyping && !revealComplete && (
          <Text style={styles.tapSkipHint}>
            {t("aiChat.tapToSkip", "Tap to reveal")}
          </Text>
        )}
      </Pressable>

      {/* Deep think badge */}
      {assistantRevealDone && (message as any).thoughtHarder && (
        <View style={styles.deepThinkBadge}>
          <Sparkle size={10} color={C.textSub} weight="fill" />
          <Text style={styles.deepThinkBadgeText}>
            {t("aiChat.deepThinkAnswer", "Deep think")}
          </Text>
        </View>
      )}

      {/* Clarification panel */}
      {clarificationUI && (
        <AiSearchIntentPanel
          replies={message.quickReplies ?? []}
          disabled={pickerDisabled}
          onSelect={onQuickReply}
        />
      )}

      {/* Filter picker */}
      {assistantRevealDone && pickerTriggered && onPickerSubmit && (
        <View style={styles.pickerWrap}>
          <AiSearchFiltersPicker
            disabled={pickerDisabled}
            sessionId={pickerSessionId}
            anonSessionId={pickerAnonSessionId}
            onFindSuggestions={onPickerSubmit}
          />
        </View>
      )}

      {/* Property carousel + map */}
      {hasProps && (
        <Animated.View
          entering={FadeIn.duration(360)}
          style={styles.propsBlock}
        >
          <Text style={styles.propsSectionLabel}>
            {t("aiChat.resultsTitle", "Matching listings")}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.propsCarousel}
            keyboardShouldPersistTaps="handled"
            decelerationRate="fast"
            snapToInterval={W * 0.68 + 10}
          >
            {(message.propertyRecommendations ?? []).map((p, i) => (
              <AIPropertyCarouselCard
                key={p.id}
                rec={p}
                index={i}
                onPress={async (rec) =>
                  await openRecommendationDetails(nav as any, rec)
                }
              />
            ))}
          </ScrollView>
          {hasLandPlotMaps ? (
            <AILandResultsOverviewMap items={landResults} />
          ) : hasPinMap ? (
            <AIResultsMap items={message.propertyRecommendations ?? []} />
          ) : null}
        </Animated.View>
      )}

      {/* Sources indicator */}
      {assistantRevealDone && (message as any).sources > 0 && (
        <View style={styles.sourcesRow}>
          <View style={styles.sourceDots}>
            {["#ACACBE", "#6E6E80", "#353740"].map((clr, i) => (
              <View
                key={i}
                style={[
                  styles.sourceDot,
                  {
                    backgroundColor: clr,
                    marginLeft: i > 0 ? -6 : 0,
                    zIndex: 3 - i
                  }
                ]}
              />
            ))}
          </View>
          <Text style={styles.sourcesText}>
            {(message as any).sources} {t("aiChat.sources", "sources")}
          </Text>
        </View>
      )}

      {/* Action row + follow-up chips */}
      {assistantRevealDone && (
        <>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.6}
              onPress={handleShare}
            >
              <ShareNetwork size={15} color={C.textMuted} weight="regular" />
            </TouchableOpacity>

            {onFeedback ? (
              <>
                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.6}
                  onPress={() => {
                    Haptics.selectionAsync();
                    if (message.interactionId)
                      onFeedback(message.interactionId, "thumbs_up");
                  }}
                >
                  <ThumbsUp
                    size={15}
                    color={
                      feedbackGiven === "thumbs_up" ? C.positive : C.textMuted
                    }
                    weight={feedbackGiven === "thumbs_up" ? "fill" : "regular"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.6}
                  onPress={() => {
                    Haptics.selectionAsync();
                    if (message.interactionId)
                      onFeedback(message.interactionId, "thumbs_down");
                  }}
                >
                  <ThumbsDown
                    size={15}
                    color={
                      feedbackGiven === "thumbs_down" ? C.negative : C.textMuted
                    }
                    weight={
                      feedbackGiven === "thumbs_down" ? "fill" : "regular"
                    }
                  />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6}>
                  <ThumbsUp size={15} color={C.textMuted} weight="regular" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6}>
                  <ThumbsDown size={15} color={C.textMuted} weight="regular" />
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.6}
              onPress={handleCopy}
            >
              {copied ? (
                <Check size={15} color={C.positive} weight="bold" />
              ) : (
                <Copy size={15} color={C.textMuted} weight="regular" />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6}>
              <ArrowCounterClockwise
                size={15}
                color={C.textMuted}
                weight="regular"
              />
            </TouchableOpacity>
          </View>

          {/* Follow-up chips */}
          {!pickerTriggered &&
            !clarificationUI &&
            message.quickReplies &&
            message.quickReplies.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.followUps}
              >
                {message.quickReplies.slice(0, 3).map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      if (r.action?.startsWith("picker_")) {
                        onQuickReply(r.action);
                        return;
                      }
                      onQuickReply(resolveQuickReplySendText(r));
                    }}
                    style={styles.followUpChip}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.followUpText}>{r.text}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
        </>
      )}
    </View>
  );
};

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
const EmptyState: React.FC = () => {
  const { t } = useTranslation();
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);
  const iconStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.emptyRoot}>
      <MotiView
        from={{ rotate: "-13deg", scale: 0.88, opacity: 0 }}
        animate={{ rotate: "-13deg", scale: 1, opacity: 1 }}
        transition={{ type: "timing", duration: 600, delay: 40 }}
        style={styles.emptyCardLeft}
      >
        <Image
          source={{
            uri: "https://i2.au.reastatic.net/800x600/40ce210737b22844123e756dfa577ddc6c783e30c804bce7e9edaca1a0e5496b/image.jpg"
          }}
          style={{ width: "100%", height: "100%", borderRadius: RADIUS.lg }}
          resizeMode="cover"
        />
      </MotiView>

      <MotiView
        from={{ rotate: "4deg", scale: 0.82, opacity: 0 }}
        animate={{ rotate: "4deg", scale: 1.05, opacity: 1 }}
        transition={{ type: "timing", duration: 680, delay: 110 }}
        style={styles.emptyCardCenter}
      >
        <Image
          source={{
            uri: "https://www.archid.co.za/wp-content/uploads/2024/07/modern-house-plan-designs-south-africa.jpg"
          }}
          style={{ width: "100%", height: "100%", borderRadius: RADIUS.lg }}
          resizeMode="cover"
        />
        <View style={styles.emptyCardLabel}>
          <Text style={styles.emptyCardLabelText}>
            {t("modelX46.brandName", "Meskeny Model X46")}
          </Text>
        </View>
      </MotiView>

      <MotiView
        from={{ rotate: "19deg", scale: 0.84, opacity: 0 }}
        animate={{ rotate: "19deg", scale: 1, opacity: 1 }}
        transition={{ type: "timing", duration: 560, delay: 170 }}
        style={styles.emptyCardRight}
      >
        <Image
          source={{
            uri: "https://i2.au.reastatic.net/800x600/8cf5788a2ca22c2ef9b29a2343afb3521290e55bd39d7f1f5f5e81f6762eb432/main.jpg"
          }}
          style={{ width: "100%", height: "100%", borderRadius: RADIUS.md }}
          resizeMode="cover"
        />
      </MotiView>

      <Animated.View style={[{ zIndex: 5, alignSelf: "center" }, iconStyle]}>
        <NavigationArrow size={68} color={C.textMuted} weight="thin" />
      </Animated.View>
    </View>
  );
};

// ─── STARTER PROMPTS PANEL ────────────────────────────────────────────────────
const StarterPromptsPanel: React.FC<{
  onSelectPrompt: (prompt: string) => void;
  t: (key: string, defaultValue: string) => string;
}> = ({ onSelectPrompt, t }) => (
  <View style={styles.starterPanel}>
    <Text style={styles.starterTitle}>
      {t("aiChat.starters.sectionTitle", "How can I help?")}
    </Text>
    <View style={styles.starterList}>
      {STARTER_PROMPTS.map((item, i) => {
        const title = t(item.titleKey, item.defaults.title);
        const prompt = t(item.promptKey, item.defaults.prompt);
        return (
          <Animated.View
            key={item.action}
            entering={FadeInUp.delay(40 + i * 40).duration(240)}
          >
            <TouchableOpacity
              style={styles.starterChip}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectPrompt(prompt);
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.starterChipText} numberOfLines={2}>
                {title}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  </View>
);

// ─── HEADER ───────────────────────────────────────────────────────────────────
const Header: React.FC<{
  activeTab: string;
  onTabChange: (t: string) => void;
  onBack: () => void;
  onInfo: () => void;
  onSpecialist: () => void;
  specialistPending?: boolean;
}> = ({
  activeTab,
  onTabChange,
  onBack,
  onInfo,
  onSpecialist,
  specialistPending,
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.headerBtn}
        onPress={onBack}
        activeOpacity={0.6}
      >
        <ArrowLeft size={20} color={C.text} weight="regular" />
      </TouchableOpacity>

      <View style={styles.headerCenter}>
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                Haptics.selectionAsync();
                onTabChange(tab);
              }}
              activeOpacity={0.7}
              style={styles.headerTab}
            >
              <Text
                style={[
                  styles.headerTabText,
                  active && styles.headerTabTextActive
                ]}
              >
                {t("aiChat.tabFind", "Find")}
              </Text>
              {active && <View style={styles.headerTabUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={onSpecialist}
          activeOpacity={0.6}
          disabled={specialistPending}
        >
          <Headset
            size={20}
            color={specialistPending ? C.textMuted : "#059669"}
            weight="fill"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={onInfo}
          activeOpacity={0.6}
        >
          <Info size={20} color={C.text} weight="regular" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── AI OVERVIEW SHEET ────────────────────────────────────────────────────────
const AIOverviewSheet: React.FC<{
  visible: boolean;
  onClose: () => void;
}> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const sheetRef = useRef<any>(null);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.25}
        pressBehavior="close"
      />
    ),
    []
  );

  useEffect(() => {
    if (visible) sheetRef.current?.snapToIndex?.(0);
    else sheetRef.current?.close?.();
  }, [visible]);

  return (
    <CompatBottomSheet
      ref={sheetRef}
      index={visible ? 0 : -1}
      snapPoints={["52%"]}
      enablePanDownToClose
      animateOnMount
      containerStyle={{ zIndex: 9999, elevation: 9999 } as any}
      style={{ zIndex: 9999, elevation: 9999 } as any}
      onChange={(i: number) => {
        if (i < 0) onClose();
      }}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: C.bgSheet }}
      handleIndicatorStyle={{ backgroundColor: C.border, width: 32 }}
    >
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.sheetScrollContent}
      >
        <View style={styles.sheetHeaderRow}>
          <Text style={styles.sheetTitle}>
            {t("aiChat.overview.title", "About Meskeny AI")}
          </Text>
          <TouchableOpacity
            style={styles.sheetCloseBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.sheetCloseBtnText}>
              {t("aiChat.overview.close", "Done")}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sheetBody}>{t("aiChat.overview.body")}</Text>
      </BottomSheetScrollView>
    </CompatBottomSheet>
  );
};

// ─── MENU SHEET ───────────────────────────────────────────────────────────────
const MenuSheet: React.FC<{
  visible: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onHistory: () => void;
}> = ({ visible, onClose, onNewChat, onHistory }) => {
  const { t } = useTranslation();
  const ty = useSharedValue(H);
  const bgOp = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      ty.value = withSpring(0, { damping: 28, stiffness: 260 });
      bgOp.value = withTiming(1, { duration: 160 });
    } else {
      ty.value = withTiming(H, {
        duration: 200,
        easing: Easing.in(Easing.ease)
      });
      bgOp.value = withTiming(0, { duration: 160 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }]
  }));
  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOp.value * 0.28 }));

  const ITEMS = [
    {
      icon: <ChatCircle size={18} color={C.text} weight="regular" />,
      label: t("aiChat.newConversation", "New conversation"),
      fn: () => {
        onNewChat();
        onClose();
      }
    },
    {
      icon: <Clock size={18} color={C.text} weight="regular" />,
      label: t("aiChat.chatHistory", "History"),
      fn: () => {
        onHistory();
        onClose();
      }
    },
    {
      icon: <ChartBar size={18} color={C.text} weight="regular" />,
      label: t("aiChat.marketInsights", "Market insights"),
      fn: onClose
    },
    {
      icon: <MapTrifold size={18} color={C.text} weight="regular" />,
      label: t("aiChat.exploreMap", "Explore map"),
      fn: onClose
    }
  ];

  return (
    <>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "#000", zIndex: 50 },
          bgStyle
        ]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>
      <Animated.View style={[styles.menuSheet, sheetStyle]}>
        <View style={styles.menuHandle} />
        {ITEMS.map((item, i) => (
          <React.Fragment key={item.label}>
            <TouchableOpacity
              onPress={item.fn}
              style={styles.menuRow}
              activeOpacity={0.7}
            >
              {item.icon}
              <Text style={styles.menuRowText}>{item.label}</Text>
            </TouchableOpacity>
            {i < ITEMS.length - 1 && <View style={styles.menuDivider} />}
          </React.Fragment>
        ))}
      </Animated.View>
    </>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export const AIChatScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const keyboardCompact = useSharedValue(0);

  const { persona: agentPersona, tier: agentTier } = useAgentRunContext();
  const { user } = useUser();
  const { escalation, setEscalation, requestAgent, loading: escalationLoading } =
    useAIEscalation();
  const agentStepsRef = useRef<AgentStep[]>([]);
  const agentRoleRef = useRef("");
  const agentRTLRef = useRef(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [anonSessionId] = useState(() => generateSessionId());
  const [blocked, setBlocked] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Find");
  const [showAIOverview, setShowAIOverview] = useState(false);
  const [showSpecialistSheet, setShowSpecialistSheet] = useState(false);
  const [thinkHarderEnabled, setThinkHarderEnabled] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [agentRole, setAgentRole] = useState("");
  const [streamingPreview, setStreamingPreview] = useState("");
  const [agentVerification, setAgentVerification] =
    useState<AgentVerification | null>(null);
  const [agentRunTotalMs, setAgentRunTotalMs] = useState<number | undefined>();
  const [feedbackByMessageId, setFeedbackByMessageId] = useState<
    Record<string, "thumbs_up" | "thumbs_down">
  >({});
  const [sharedPropertyContext, setSharedPropertyContext] =
    useState<SharedPropertyContext | null>(null);
  const sharedContextHydratedRef = useRef(false);
  const sharedPropertyConsumedRef = useRef(false);

  // ── Keyboard compact animation ──
  useEffect(() => {
    const showEvt = IOS ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = IOS ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = () => {
      keyboardCompact.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.cubic)
      });
    };
    const onHide = () => {
      keyboardCompact.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.cubic)
      });
    };
    const subShow = Keyboard.addListener(showEvt, onShow);
    const subHide = Keyboard.addListener(hideEvt, onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  const emptyCompactStyle = useAnimatedStyle(() => {
    const p = keyboardCompact.value;
    return {
      transform: [
        { translateY: interpolate(p, [0, 1], [0, -28]) },
        { scale: interpolate(p, [0, 1], [1, 0.88]) }
      ],
      opacity: interpolate(p, [0, 1], [1, 0.94])
    };
  });

  // ── Session hydration ──
  useEffect(() => {
    initHistory();
  }, []);

  useEffect(() => {
    if (loadingHistory) return;
    const shared = route?.params?.sharedProperty;
    if (!shared || sharedContextHydratedRef.current) return;
    const context: SharedPropertyContext = {
      id: Number(shared.id),
      title: shared.title,
      listing_price: shared.listing_price,
      address: shared.address,
      city: shared.city,
      image: shared.image,
      type: shared.type || "sale"
    };
    sharedPropertyConsumedRef.current = false;
    setSharedPropertyContext(context);
    const prompt =
      route?.params?.initialPrompt?.trim() ||
      "I want to know the market value for this property. Please analyze location, luxury comparables, and offer insights.";
    setInput(prompt);
    setShowWelcome(false);
    sharedContextHydratedRef.current = true;
  }, [route?.params, loadingHistory]);

  // ── Auto-scroll ──
  useEffect(() => {
    if (messages.length > 0)
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
  }, [messages, thinking]);

  const initHistory = async () => {
    setLoadingHistory(true);
    try {
      const { sessions } = await getChatSessions();
      if (sessions.length > 0) {
        const data = await getChatSession(sessions[0].id);
        if (data) {
          setSessionId(String(data.id));
          setMessages(data.messages);
          setShowWelcome(data.messages.length <= 1);
        }
      } else {
        await newSession();
      }
    } catch {
      const g = await getInitialGreeting();
      if (g) setMessages([g]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const newSession = async () => {
    try {
      const r = await createChatSession();
      if (r) {
        setSessionId(String(r.sessionId));
        setMessages([r.greeting]);
        setShowWelcome(true);
        setBlocked(false);
      }
    } catch {
      const g = await getInitialGreeting();
      if (g) setMessages([g]);
    }
  };

  const sendText = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || loading || blocked) return;

      const sharedForTurn = sharedPropertyContext ?? null;
      const attachShared =
        !!sharedForTurn && !sharedPropertyConsumedRef.current;
      const sharedForAI = attachShared ? sharedForTurn : null;

      if (attachShared) {
        sharedPropertyConsumedRef.current = true;
        setSharedPropertyContext(null);
      }

      setInput((prev) => (prev.trim() === text ? "" : prev));
      setShowWelcome(false);
      Keyboard.dismiss();

      const userMsg: ChatMessage = {
        id: generateMessageId(),
        role: "user",
        content: text,
        timestamp: Date.now()
      };
      if (attachShared) (userMsg as any).replyOnProperty = sharedForTurn;

      setMessages((p) => [...p, userMsg]);
      setLoading(true);
      setThinking(true);

      try {
        const history: AIHistoryMessage[] = [...messages, userMsg]
          .slice(-10)
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content
          }));

        const marketValuePrompt =
          "I want to know the market value for this property based on its location, luxury comparables, and offers in the database. Please provide clear, shareable insights.";

        setAgentSteps([]);
        setAgentRole("");
        setStreamingPreview("");
        setAgentVerification(null);
        setAgentRunTotalMs(undefined);

        const streamed = await streamAgentRun(
          {
            message: text,
            sessionId: sessionId || undefined,
            anonSessionId: sessionId ? undefined : anonSessionId,
            deepThink: thinkHarderEnabled,
            history,
            sharedProperty: sharedForAI ?? undefined,
            userPromptTemplate: marketValuePrompt,
            persona: agentPersona,
            tier: agentTier
          },
          {
            onStreamStart: (meta) => {
              agentRoleRef.current = meta.role;
              agentRTLRef.current = meta.rtl;
              setAgentRole(meta.role);
            },
            onStepsChange: (steps) => {
              agentStepsRef.current = steps;
              setAgentSteps(steps);
            },
            onTextDelta: (_d, full) => setStreamingPreview(full),
            onVerification: (v) => setAgentVerification(v),
            onFinal: ({ message, sessionId: sid, verification, totalMs }) => {
              if (sid && !sessionId) setSessionId(sid);
              if (verification) setAgentVerification(verification);
              if (totalMs != null) setAgentRunTotalMs(totalMs);
              (message as any).thoughtHarder = thinkHarderEnabled;
              (message as any).agentSteps = [...agentStepsRef.current];
              (message as any).agentVerification = verification;
              (message as any).agentRunTotalMs = totalMs;
              (message as any).agentRole = agentRoleRef.current;
              (message as any).agentRTL = agentRTLRef.current;
              setMessages((p) => [...p, message]);
              setStreamingPreview("");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
            onError: (errMsg) => {
              setMessages((p) => [
                ...p,
                {
                  id: generateMessageId(),
                  role: "assistant",
                  content: errMsg,
                  timestamp: Date.now()
                }
              ]);
            }
          }
        );

        if (!streamed) {
          const res = await sendMessageToAI(
            text,
            sessionId || undefined,
            thinkHarderEnabled,
            history,
            sharedForAI ?? undefined,
            marketValuePrompt,
            sessionId ? undefined : anonSessionId
          );
          if (res.blocked) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setMessages((p) => [
              ...p,
              {
                id: generateMessageId(),
                role: "assistant",
                content: t(
                  "aiChat.cannotProcess",
                  "I can't process that request."
                ),
                timestamp: Date.now()
              }
            ]);
            setBlocked(true);
            return;
          }
          if (res.success && res.message) {
            if (res.sessionId && !sessionId) setSessionId(String(res.sessionId));
            if (res.escalation) {
              setEscalation({
                id: res.escalation.id,
                session_id: sessionId || anonSessionId,
                status: (res.escalation.status as any) ?? "pending",
                urgency: (res.escalation.urgency as any) ?? "medium",
                reason: res.escalation.reason ?? "",
              });
            }
            (res.message as any).thoughtHarder = thinkHarderEnabled;
            setMessages((p) => [...p, res.message!]);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } else {
            setMessages((p) => [
              ...p,
              {
                id: generateMessageId(),
                role: "assistant",
                content:
                  res.error || t("aiChat.errorOccurred", "An error occurred."),
                timestamp: Date.now()
              }
            ]);
          }
        }
      } catch {
        setMessages((p) => [
          ...p,
          {
            id: generateMessageId(),
            role: "assistant",
            content: t(
              "aiChat.connectionIssue",
              "Connection issue. Please try again."
            ),
            timestamp: Date.now()
          }
        ]);
      } finally {
        setThinking(false);
        setLoading(false);
      }
    },
    [
      loading,
      blocked,
      sessionId,
      messages,
      sharedPropertyContext,
      thinkHarderEnabled,
      anonSessionId,
      agentPersona,
      agentTier
    ]
  );

  const handleSend = useCallback(async () => {
    await sendText(input);
  }, [sendText, input]);

  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const handleChip = useCallback(
    (text: string) => {
      const trimmed = (text || "").trim();
      if (trimmed.startsWith("picker_")) {
        setShowWelcome(false);
        setShowLocationPicker(true);
        return;
      }
      const outgoing = resolveQuickReplySendText({ action: trimmed, text: "" });
      setInput(outgoing);
      setShowWelcome(false);
      setShowLocationPicker(false);
      setTimeout(() => sendText(outgoing), 80);
    },
    [sendText]
  );

  const handlePickerSubmit = useCallback(
    (promptText: string) => {
      setShowLocationPicker(false);
      sendText(promptText);
    },
    [sendText]
  );

  const effectiveSessionId = useMemo(
    () => normalizeChatSessionId(sessionId, anonSessionId),
    [sessionId, anonSessionId],
  );

  const handleSpecialistPress = useCallback(() => {
    if (escalation) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const hasContact =
      !!user?.ID &&
      (!!(user as any)?.email ||
        !!(user as any)?.phoneNumber ||
        !!(user as any)?.Email);
    if (hasContact) {
      void requestAgent(
        effectiveSessionId,
        t("modelX46.escalation.requestAgent", "Talk to a specialist"),
        {
          guest_name: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
          guest_email: String((user as any)?.email ?? (user as any)?.Email ?? ""),
          guest_phone: String((user as any)?.phoneNumber ?? ""),
        },
        anonSessionId,
      );
      return;
    }
    setShowSpecialistSheet(true);
  }, [escalation, user, effectiveSessionId, anonSessionId, requestAgent, t]);

  const handleSpecialistSheetSubmit = useCallback(
    async (payload: {
      name: string;
      email: string;
      phone: string;
      note: string;
    }) => {
      const reason =
        payload.note.trim() ||
        t("modelX46.escalation.requestAgent", "Talk to a specialist");
      await requestAgent(
        effectiveSessionId,
        reason,
        {
          guest_name: payload.name,
          guest_email: payload.email,
          guest_phone: payload.phone,
        },
        anonSessionId,
      );
    },
    [effectiveSessionId, anonSessionId, requestAgent, t],
  );

  const toggleThinkHarder = useCallback(() => {
    Haptics.selectionAsync();
    setThinkHarderEnabled((v) => !v);
  }, []);

  const latestAssistantMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1)
      if (messages[i]?.role === "assistant") return messages[i].id;
    return null;
  }, [messages]);

  // ── LOADING SCREEN ──
  if (loadingHistory) {
    return (
      <View style={[styles.screen, styles.center]}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <Animated.View
          entering={FadeIn.duration(380)}
          style={styles.loadingWrap}
        >
          <NavigationArrow size={40} color={C.textMuted} weight="thin" />
          <Text style={styles.loadingText}>
            {t("modelX46.brandName", "Meskeny Model X46")}
          </Text>
        </Animated.View>
      </View>
    );
  }

  const isEmpty = showWelcome && messages.length <= 1;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={IOS ? "padding" : "height"}
      keyboardVerticalOffset={0}
      onStartShouldSetResponderCapture={() => {
        Keyboard.dismiss();
        return false;
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={() => (navigation as any).goBack?.()}
        onInfo={() => setShowAIOverview(true)}
        onSpecialist={handleSpecialistPress}
        specialistPending={!!escalation || escalationLoading}
      />

      {escalation ? <EscalationBanner escalation={escalation} /> : null}

      {isEmpty ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyLayout}>
            <View style={styles.emptyHero}>
              <Animated.View style={emptyCompactStyle}>
                <EmptyState />
              </Animated.View>
            </View>
            <StarterPromptsPanel onSelectPrompt={handleChip} t={t as any} />
          </View>
        </ScrollView>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 12 + insets.bottom }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              animateTyping={
                item.role === "assistant" &&
                item.id === latestAssistantMessageId
              }
              onQuickReply={handleChip}
              onPickerSubmit={handlePickerSubmit}
              pickerDisabled={loading || blocked}
              pickerSessionId={sessionId || undefined}
              pickerAnonSessionId={sessionId ? undefined : anonSessionId}
              onFeedback={async (id, signal) => {
                setFeedbackByMessageId((p) => ({ ...p, [item.id]: signal }));
                const ok = await submitAIFeedback(id, signal);
                if (!ok)
                  setFeedbackByMessageId((p) => {
                    const n = { ...p };
                    delete n[item.id];
                    return n;
                  });
              }}
              feedbackGiven={feedbackByMessageId[item.id]}
            />
          )}
          ListFooterComponent={
            thinking ? (
              <View>
                {agentSteps.length > 0 ? (
                  <>
                    <AgentRunTimeline
                      steps={agentSteps}
                      verification={agentVerification}
                      totalMs={agentRunTotalMs}
                      role={agentRole}
                      deepThink={thinkHarderEnabled}
                    />
                    {streamingPreview.trim().length > 0 &&
                      !thinkHarderEnabled && (
                        <View style={styles.streamingPreviewWrap}>
                          <Text
                            style={[
                              styles.streamingPreviewText,
                              agentRTLRef.current && styles.rtlText,
                              agentRTLRef.current && styles.arabicText
                            ]}
                          >
                            {streamingPreview}
                          </Text>
                        </View>
                      )}
                  </>
                ) : (
                  <View style={styles.thinkingRow}>
                    <ThinkingIndicator />
                    <Text style={styles.thinkingLabel}>
                      {t("aiChat.thinking.analyzing", "Thinking…")}
                    </Text>
                  </View>
                )}
              </View>
            ) : null
          }
        />
      )}

      {/* ── INPUT AREA ── */}
      <View
        style={[
          styles.bottomArea,
          { paddingBottom: Math.max(insets.bottom, 12) }
        ]}
      >
        {sharedPropertyContext && (
          <View style={styles.contextStrip}>
            {sharedPropertyContext.image ? (
              <Image
                source={{ uri: sharedPropertyContext.image }}
                style={styles.contextStripImg}
              />
            ) : (
              <View
                style={[styles.contextStripImg, styles.contextStripImgFallback]}
              >
                <House size={13} color={C.textSub} weight="fill" />
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.contextStripLabel}>
                {t("aiChat.replyOnProperty", "Replying about")}
              </Text>
              <Text style={styles.contextStripTitle} numberOfLines={1}>
                {sharedPropertyContext.title ||
                  t("aiChat.property", "Property")}
              </Text>
            </View>
            <Text style={styles.contextStripPrice} numberOfLines={1}>
              {sharedPropertyContext.listing_price
                ? `${Number(sharedPropertyContext.listing_price).toLocaleString()} MRU`
                : sharedPropertyContext.city || ""}
            </Text>
          </View>
        )}

        {showLocationPicker ? (
          <View style={styles.pickerWrap}>
            <AiSearchFiltersPicker
              disabled={loading || blocked}
              sessionId={sessionId || undefined}
              anonSessionId={sessionId ? undefined : anonSessionId}
              onFindSuggestions={handlePickerSubmit}
            />
          </View>
        ) : null}

        <GlowyInput
          message={input}
          setMessage={setInput}
          handleSendMessage={(text: string) => {
            if (!text.trim()) return;
            sendText(text);
          }}
          handleSubmitEditing={() => {
            if (input.trim().length === 0) return;
            sendText(input);
          }}
          placeholder={t(
            "aiChat.inputPlaceholder",
            "Ask anything about properties…"
          )}
          deepThinkEnabled={thinkHarderEnabled}
          onToggleDeepThink={toggleThinkHarder}
          deepThinkLabel={t("aiChat.deepThink", "Deep think")}
          autoLabel={t("aiChat.auto", "Auto")}
        />
      </View>

      <MenuSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNewChat={newSession}
        onHistory={() => console.log("History")}
      />

      <AIOverviewSheet
        visible={showAIOverview}
        onClose={() => setShowAIOverview(false)}
      />
      <SpecialistContactSheet
        visible={showSpecialistSheet}
        onClose={() => setShowSpecialistSheet(false)}
        onSubmit={handleSpecialistSheetSubmit}
        defaultName={[user?.firstName, user?.lastName].filter(Boolean).join(" ")}
        defaultEmail={String((user as any)?.email ?? (user as any)?.Email ?? "")}
        defaultPhone={String((user as any)?.phoneNumber ?? "")}
      />
    </KeyboardAvoidingView>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  center: { justifyContent: "center", alignItems: "center" },

  // ── Loading ──
  loadingWrap: { alignItems: "center", gap: 14 },
  loadingText: {
    fontSize: 15,
    fontWeight: "500",
    color: C.textSub,
    letterSpacing: -0.2
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: C.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center"
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  headerTab: {
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 4
  },
  headerTabText: {
    fontSize: 15,
    fontWeight: "400",
    color: C.textSub,
    letterSpacing: -0.15
  },
  headerTabTextActive: { color: C.text, fontWeight: "600" },
  headerTabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: C.text
  },

  // ── Empty state ──
  emptyLayout: { flexGrow: 1, minHeight: H * 0.38 },
  emptyHero: {
    flex: 1,
    minHeight: 0,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyRoot: { alignItems: "center", justifyContent: "center" },
  emptyCardLeft: {
    position: "absolute",
    top: 24,
    left: "16%",
    zIndex: 1,
    width: 104,
    height: 146,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    backgroundColor: C.bgCard,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4
  },
  emptyCardCenter: {
    position: "absolute",
    top: 4,
    alignSelf: "center",
    zIndex: 3,
    width: 118,
    height: 162,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    backgroundColor: C.bgCard,
    borderWidth: 1.5,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8
  },
  emptyCardRight: {
    position: "absolute",
    top: 40,
    right: "16%",
    zIndex: 2,
    width: 96,
    height: 134,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    backgroundColor: C.bgCard,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  emptyCardLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(26,25,23,0.72)",
    paddingVertical: 6,
    alignItems: "center"
  },
  emptyCardLabelText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 11.5,
    letterSpacing: 0.4
  },

  // ── Starter panel ──
  starterPanel: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10
  },
  starterTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: C.text,
    letterSpacing: -0.3,
    lineHeight: 28,
    marginBottom: 14
  },
  starterList: { gap: 8 },
  starterChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.pill,
    backgroundColor: C.bgChip,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.borderSoft
  },
  starterChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: C.text,
    lineHeight: 20
  },

  // ── Messages list ──
  listContent: { paddingHorizontal: 16, paddingTop: 20, flexGrow: 1 },

  // ── User message ──
  userMsgRow: { alignItems: "flex-end", marginBottom: 22 },
  userBubble: {
    backgroundColor: C.bgUserBubble,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "78%"
  },
  userBubbleText: { fontSize: 15.5, color: C.text, lineHeight: 24 },

  // Reply-on-property pill
  replyOnPropertyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bgMuted,
    marginBottom: 5,
    maxWidth: "88%"
  },
  replyOnPropertyImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.bgChip
  },
  replyOnPropertyImgFallback: {
    alignItems: "center",
    justifyContent: "center"
  },
  replyOnPropertyLabel: {
    fontSize: 10,
    color: C.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  replyOnPropertyTitle: {
    fontSize: 12.5,
    color: C.text,
    fontWeight: "700",
    marginTop: 1
  },

  // ── AI message block ──
  aiMsgBlock: {
    marginBottom: 26,
    width: "100%",
    alignSelf: "stretch"
  },

  // Container for the typewriter text — no gap, margins live on aiText paragraphs
  aiRichBlock: {
    marginBottom: 6,
    width: "100%"
  },

  // ── RTL critical styles ──────────────────────────────────────────────────────
  //
  // rtlParagraphWrap:
  //   Forces each Arabic paragraph into a full-width block so React Native's
  //   layout engine treats it as a block element, not an inline text run.
  //
  // rtlText:
  //   Applies writingDirection + textAlign on the Text node itself.
  //   Must live on the innermost Text, not just the container.
  //
  // arabicText:
  //   Larger size + more line-height for Arabic script legibility.
  //   Arabic glyphs have longer ascenders/descenders than Latin.
  //
  rtlParagraphWrap: {
    width: "100%",
    alignSelf: "stretch"
  },
  rtlText: {
    writingDirection: "rtl",
    textAlign: "right",
    alignSelf: "stretch",
    width: "100%"
  },
  arabicText: {
    fontSize: 16.5,
    lineHeight: 30,
    letterSpacing: 0.1
  },

  // ── Typewriter containers ────────────────────────────────────────────────────
  //
  // LTR: row + wrap — paragraph Text nodes have width:"100%" so each takes
  //   a full row. StreamCaret flows inline at the end of the last text run.
  //
  // RTL: column — View/Text blocks stack naturally without fighting the
  //   flex-row bidi ordering that destroys Arabic ligatures.
  //
  aiTypewriterRowLTR: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    width: "100%"
  },
  aiTypewriterColumnRTL: {
    flexDirection: "column",
    alignItems: "stretch",
    width: "100%"
  },

  // RTL caret row — sits below the last paragraph block
  rtlCaretRow: {
    alignItems: "flex-end",
    width: "100%",
    marginTop: 2
  },

  // ── Stream caret ──
  streamCaret: {
    width: 7,
    height: 17,
    borderRadius: 2,
    backgroundColor: C.textSub,
    marginLeft: 3,
    marginBottom: 14,
    opacity: 0.6
  },
  streamCaretRTL: {
    marginLeft: 0,
    marginRight: 3,
    alignSelf: "flex-end"
  },
  tapSkipHint: {
    fontSize: 10.5,
    color: C.textMuted,
    marginTop: 3,
    marginBottom: 3
  },
  pickerWrap: { marginBottom: 12 },

  // ── AI prose — ChatGPT / Perplexity typographic scale ───────────────────────
  //
  // Body: 15.5 / 26 — the extra line-height is what makes responses feel
  //   "editorial" rather than cramped. ChatGPT uses ~1.65–1.7 ratio.
  //
  // H2: used for major section breaks (## in markdown).
  // H3: used for sub-sections (### in markdown).
  //
  aiText: {
    fontSize: 15.5,
    color: C.text,
    lineHeight: 26,
    marginBottom: 14,
    flexShrink: 1,
    width: "100%",
    maxWidth: "100%"
  },
  aiTextBold: {
    fontSize: 15.5,
    color: C.text,
    lineHeight: 26,
    fontWeight: "700"
  },
  aiH2: {
    fontSize: 17,
    color: C.text,
    lineHeight: 24,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 6,
    letterSpacing: -0.2,
    width: "100%"
  },
  aiH2Bold: {
    fontSize: 17,
    color: C.text,
    lineHeight: 24,
    fontWeight: "800",
    letterSpacing: -0.2
  },
  aiH3: {
    fontSize: 15.5,
    color: C.text,
    lineHeight: 23,
    fontWeight: "700",
    marginTop: 6,
    marginBottom: 5,
    letterSpacing: -0.15,
    width: "100%"
  },
  aiH3Bold: {
    fontSize: 15.5,
    color: C.text,
    lineHeight: 23,
    fontWeight: "800",
    letterSpacing: -0.15
  },

  // ── Table ──
  aiTableScroll: { marginBottom: 14, maxWidth: "100%" },
  aiTableScrollContent: { flexGrow: 1 },
  aiTableWrap: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    backgroundColor: C.bgCard,
    minWidth: 280
  },
  aiTableRowHeader: {
    flexDirection: "row",
    backgroundColor: C.bgMuted,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border
  },
  aiTableHeaderCell: {
    flex: 1,
    fontSize: 11.5,
    color: C.text,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  aiTableRow: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.borderSoft
  },
  aiTableRowAlt: { backgroundColor: C.bgMuted },
  aiTableCell: {
    flex: 1,
    fontSize: 12,
    color: C.textSub,
    paddingHorizontal: 10,
    paddingVertical: 8,
    lineHeight: 17
  },

  // ── Deep think badge ──
  deepThinkBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.bgChip,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.borderSoft
  },
  deepThinkBadgeText: {
    color: C.textSub,
    fontSize: 11,
    fontWeight: "500"
  },

  // ── Thinking indicator ──
  thinkingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 2
  },
  thinkingWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
    height: 22
  },
  thinkingLabel: { fontSize: 12.5, color: C.textSub },
  thinkingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.textMuted
  },

  // ── Streaming preview ──
  streamingPreviewWrap: {
    marginTop: 4,
    marginBottom: 6,
    width: "100%"
  },
  streamingPreviewText: {
    fontSize: 15.5,
    lineHeight: 26,
    color: C.textSub,
    width: "100%",
    flexShrink: 1
  },

  // ── Sources ──
  sourcesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 9
  },
  sourceDots: { flexDirection: "row", alignItems: "center" },
  sourceDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.bgCard
  },
  sourcesText: { fontSize: 12.5, fontWeight: "500", color: C.textSub },

  // ── Action row ──
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },
  actionBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6
  },

  // ── Follow-up chips ──
  followUps: { gap: 7, marginBottom: 6, paddingRight: 4 },
  followUpChip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.borderSoft,
    backgroundColor: C.bgChip
  },
  followUpText: { fontSize: 14, color: C.text, fontWeight: "500" },

  // ── Property results ──
  propsBlock: { marginBottom: 12, gap: 8 },
  propsSectionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: C.textMuted,
    marginBottom: 4
  },
  propsCarousel: { gap: 10, paddingRight: 16 },

  // ── Bottom input area ──
  bottomArea: {
    backgroundColor: C.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    paddingTop: 8
  },

  // ── Shared context strip ──
  contextStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 12,
    marginBottom: 7,
    marginTop: 2,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bgMuted
  },
  contextStripImg: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.sm,
    backgroundColor: C.bgChip
  },
  contextStripImgFallback: { alignItems: "center", justifyContent: "center" },
  contextStripLabel: {
    fontSize: 9.5,
    color: C.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  contextStripTitle: {
    fontSize: 13,
    color: C.text,
    fontWeight: "700",
    marginTop: 1
  },
  contextStripPrice: { fontSize: 12, color: C.textSub, fontWeight: "500" },

  // ── Menu sheet ──
  menuSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: C.bgSheet,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    paddingBottom: 44,
    paddingTop: 10,
    ...(IOS
      ? {
          shadowColor: "rgba(0,0,0,0.10)",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 1,
          shadowRadius: 16
        }
      : { elevation: 10 })
  },
  menuHandle: {
    alignSelf: "center",
    width: 32,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: C.border,
    marginBottom: 14
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 22,
    paddingVertical: 15
  },
  menuRowText: { fontSize: 15, fontWeight: "400", color: C.text },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginHorizontal: 22
  },

  // ── AI overview sheet ──
  sheetScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 8
  },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.2,
    flex: 1,
    paddingRight: 12
  },
  sheetCloseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bgChip
  },
  sheetCloseBtnText: { fontSize: 13, fontWeight: "600", color: C.text },
  sheetBody: { fontSize: 14, lineHeight: 22, color: C.textSub }
});

export default AIChatScreen;
