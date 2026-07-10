// import React, { useState, useRef, useCallback, useEffect } from "react";
// import {
//   StyleSheet,
//   View,
//   Text,
//   Image,
//   TouchableOpacity,
//   FlatList,
//   TextInput,
//   KeyboardAvoidingView,
//   Platform,
//   Alert,
//   Modal,
//   Animated,
//   Pressable,
//   Dimensions,
// } from "react-native";
// import { BlurView } from "expo-blur";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useRoute, useNavigation } from "@react-navigation/native";
// import { MaterialIcons } from "@expo/vector-icons";
// import { useConversationsQuery } from "../hooks/queries/useConversationsQuery";
// import { useSelectedConversationQuery } from "../hooks/queries/useSelectedConversationQuery";
// import { useCreateMessageMutation } from "../hooks/mutations/useCreateMessageMutation";
// import { useUser } from "../hooks/useUser";
// import { useBlockUser } from "../hooks/useGroupManagement";
// import {
//   useGetDirectMessages,
//   useSendDirectMessage,
// } from "../hooks/queries/useExperienceInvites";
// import { api } from "../services/api";
// import { endpoints, directMessageEndpoints } from "../constants";
// import { getAppLanguage } from "../utils/translation";
// import * as Haptics from "expo-haptics";
// import { messagingWs } from "../services/messagingWs";
// import { theme } from "../theme";
// import { useIsFocused } from "@react-navigation/native";

// const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// // Common emoji reactions
// const QUICK_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

// type RouteParams = {
//   conversationID?: number | null;
//   recipientName?: string;
//   otherUserId?: number;
// };

// interface MessageType {
//   ID: number;
//   senderID: number;
//   receiverID: number;
//   text?: string;
//   Content?: string;
//   CreatedAt: string;
//   State?: string;
//   type?: string;
//   reply_to_id?: number;
//   reply_to_message?: MessageType;
//   reactions_data?: Array<{
//     emoji: string;
//     count: number;
//     users: number[];
//   }>;
// }

// const EMPTY_MESSAGES: any[] = [];

// export const DirectMessageScreen = () => {
//   const route = useRoute<any>();
//   const { conversationID, recipientName, otherUserId } = (route.params ||
//     {}) as RouteParams;
//   const { user } = useUser();
//   const isFocused = useIsFocused();
//   const nav = useNavigation<any>();

//   const { data } = useSelectedConversationQuery(conversationID || 0);
//   const conversations = useConversationsQuery();
//   const createMessage = useCreateMessageMutation();
//   const blockUser = useBlockUser();
//   const [input, setInput] = useState("");
//   const [isTyping, setIsTyping] = useState(false);
//   const [propImage, setPropImage] = useState<string | undefined>(undefined);
//   const [propTitle, setPropTitle] = useState<string | undefined>(undefined);
//   const [msgs, setMsgs] = useState<any[]>([]);
//   const [nextCursor, setNextCursor] = useState<number | null>(null);
//   const [showMenu, setShowMenu] = useState(false);
//   const [blockReason, setBlockReason] = useState("");
//   const listRef = useRef<FlatList | null>(null);
//   const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const remoteTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
//     null,
//   );

//   // Reply and Reaction states
//   const [selectedMessage, setSelectedMessage] = useState<MessageType | null>(
//     null,
//   );
//   const [showMessageActions, setShowMessageActions] = useState(false);
//   const [replyingTo, setReplyingTo] = useState<MessageType | null>(null);
//   const [showReactionPicker, setShowReactionPicker] = useState(false);
//   const actionModalY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
//   const fadeAnim = useRef(new Animated.Value(0)).current;

//   // For direct messages (when conversationID is null)
//   const isDirectMessage = !conversationID && !!otherUserId;
//   const sendDirectMessage = useSendDirectMessage();
//   const directMessagesQuery = useGetDirectMessages(otherUserId || 0);
//   const refetchDirectMessages = directMessagesQuery.refetch;
//   const directMessages = Array.isArray(directMessagesQuery.data)
//     ? directMessagesQuery.data
//     : EMPTY_MESSAGES;

//   React.useLayoutEffect(() => {
//     if (recipientName) nav.setOptions({ headerTitle: recipientName });
//   }, [recipientName, nav]);

//   const onSendPress = async (text: string) => {
//     if (!text.trim() || !user) return;

//     // Handle direct messages
//     if (isDirectMessage && otherUserId) {
//       const tempMsg = {
//         ID: Date.now(),
//         senderID: user.ID,
//         receiverID: otherUserId,
//         text: text.trim(),
//         CreatedAt: new Date().toISOString(),
//         State: "sent",
//         reply_to_id: replyingTo?.ID,
//         reply_to_message: replyingTo || undefined,
//       };
//       setMsgs((prev) => [...prev, tempMsg]);

//       try {
//         await sendDirectMessage.mutateAsync({
//           receiver_id: otherUserId,
//           content: text.trim(),
//           type: "text",
//           ref_type: undefined,
//           ref_id: undefined,
//           reply_to_id: replyingTo?.ID,
//         });
//         // Refetch to get the actual message with ID
//         refetchDirectMessages();
//       } catch (error) {
//         console.error("Failed to send message:", error);
//       }

//       setReplyingTo(null);
//       return;
//     }

//     // Handle property-based conversations
//     if (!isDirectMessage && data && conversationID) {
//       setMsgs((prev) => [
//         ...prev,
//         {
//           ID: Date.now(),
//           senderID: user.ID,
//           receiverID: data.receiverID,
//           text: text.trim(),
//           CreatedAt: new Date().toISOString(),
//           State: "sent",
//         },
//       ]);
//       createMessage.mutate({
//         conversationID,
//         author: {
//           id: String(user.ID),
//           firstName: user.firstName || user.phoneNumber || user.email || "",
//           lastName: user.lastName || "",
//         },
//         senderID: user.ID,
//         receiverID: data.receiverID,
//         text: text.trim(),
//       });
//       // Unified WS / backend events handle realtime propagation.
//     }
//   };

//   const onInputChange = useCallback(
//     (text: string) => {
//       setInput(text);
//       if (!user?.ID) return;

//       // Unified WS typing (server forwards to the other user)
//       const toUserId = isDirectMessage ? otherUserId : data?.receiverID;
//       if (toUserId) {
//         messagingWs.connect(user.accessToken || "");
//         messagingWs.send("typing", {
//           toUserId,
//           senderID: user.ID,
//           receiverID: toUserId,
//           conversationID: conversationID || null,
//           isTyping: text.trim().length > 0,
//         });
//       }

//       if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//       typingTimeoutRef.current = setTimeout(() => {
//         if (toUserId) {
//           messagingWs.send("typing", {
//             toUserId,
//             senderID: user.ID,
//             receiverID: toUserId,
//             conversationID: conversationID || null,
//             isTyping: false,
//           });
//         }
//       }, 1500);
//     },
//     [
//       user?.ID,
//       user?.accessToken,
//       isDirectMessage,
//       otherUserId,
//       data?.receiverID,
//       conversationID,
//     ],
//   );

//   const handleLongPress = (message: MessageType) => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//     setSelectedMessage(message);
//     setShowMessageActions(true);

//     // Animate modal in
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 200,
//         useNativeDriver: true,
//       }),
//       Animated.spring(actionModalY, {
//         toValue: 0,
//         useNativeDriver: true,
//         bounciness: 0,
//       }),
//     ]).start();
//   };

//   const closeMessageActions = () => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 0,
//         duration: 150,
//         useNativeDriver: true,
//       }),
//       Animated.timing(actionModalY, {
//         toValue: SCREEN_HEIGHT,
//         duration: 150,
//         useNativeDriver: true,
//       }),
//     ]).start(() => {
//       setShowMessageActions(false);
//       setSelectedMessage(null);
//       setShowReactionPicker(false);
//     });
//   };

//   const handleReply = () => {
//     setReplyingTo(selectedMessage);
//     closeMessageActions();
//   };

//   const handleReaction = async (emoji: string) => {
//     if (!selectedMessage) return;

//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

//     try {
//       const userAlreadyReacted = selectedMessage.reactions_data?.some(
//         (r) => r.emoji === emoji && r.users.includes(user?.ID || 0),
//       );

//       if (userAlreadyReacted) {
//         // Remove reaction
//         await api.delete(
//           directMessageEndpoints.removeReaction(selectedMessage.ID),
//           {
//             data: { emoji },
//             headers: { Authorization: `Bearer ${user?.accessToken}` },
//           },
//         );
//       } else {
//         // Add reaction
//         await api.post(
//           directMessageEndpoints.addReaction(selectedMessage.ID),
//           { emoji },
//           { headers: { Authorization: `Bearer ${user?.accessToken}` } },
//         );
//       }

//       // Refetch messages to get updated reactions
//       if (isDirectMessage) {
//         refetchDirectMessages();
//       }
//     } catch (error) {
//       console.error("Failed to react:", error);
//     }

//     closeMessageActions();
//   };

//   const handleBlockUser = () => {
//     const targetUserId = isDirectMessage ? otherUserId : data?.receiverID;
//     if (!targetUserId || !user) return;

//     Alert.alert("Block user", "They won't be able to message or contact you.", [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Block",
//         style: "destructive",
//         onPress: () => {
//           blockUser.mutate(
//             { userId: targetUserId, reason: blockReason },
//             {
//               onSuccess: () => {
//                 setShowMenu(false);
//                 Alert.alert(
//                   "User blocked",
//                   "This user can no longer contact you.",
//                 );
//                 nav.goBack();
//               },
//               onError: () => {
//                 Alert.alert("Something went wrong", "Please try again.");
//               },
//             },
//           );
//         },
//       },
//     ]);
//   };

//   const handleDeleteConversation = () => {
//     Alert.alert("Delete conversation", "This can't be undone.", [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Delete",
//         style: "destructive",
//         onPress: () => {
//           setShowMenu(false);
//           nav.goBack();
//         },
//       },
//     ]);
//   };

//   const convMatch: any = conversationID
//     ? (conversations.data || []).find((c: any) => c.ID === conversationID) || {}
//     : {};
//   const thumb = convMatch?.thumbnail || propImage;
//   const title = convMatch?.title || propTitle;

//   const recipientAvatar = convMatch?.recipientAvatar;
//   const myAvatar =
//     (user as any)?.avatarURL || (user as any)?.AvatarURL || undefined;
//   const statusPill = convMatch?.status || "Pending";
//   const dateRange = convMatch?.dateRange || "";
//   const propertyID = convMatch?.propertyID;

//   React.useEffect(() => {
//     let isMounted = true;
//     (async () => {
//       try {
//         if (!propertyID) return;
//         const lang = getAppLanguage();
//         const res = await api.get(
//           `${endpoints.getPropertyByID}${propertyID}?lang=${lang}`,
//         );
//         const p = res?.data;
//         if (!isMounted || !p) return;
//         const firstImg =
//           Array.isArray(p.images) && p.images.length > 0
//             ? p.images[0].url || p.images[0]
//             : undefined;
//         setPropImage(firstImg);
//         setPropTitle(p.title);
//       } catch {}
//     })();
//     return () => {
//       isMounted = false;
//     };
//   }, [propertyID]);

//   React.useEffect(() => {
//     if (isDirectMessage && otherUserId) {
//       const formatted = directMessages.map((m: any) => ({
//         ID: m.id || m.ID,
//         senderID: m.sender_id || m.senderID,
//         receiverID: m.receiver_id || m.receiverID,
//         text: m.content || m.text,
//         CreatedAt: m.created_at || m.CreatedAt,
//         State: m.is_read ? "seen" : "delivered",
//         type: m.type,
//         refType: m.ref_type,
//         refID: m.ref_id,
//         reply_to_id: m.reply_to_id,
//         reply_to_message: m.reply_to_message,
//         reactions_data: m.reactions_data,
//       }));
//       setMsgs((prev) => {
//         // Avoid render loops: only update if payload meaningfully changed.
//         if (prev.length === formatted.length) {
//           const prevLast = prev[prev.length - 1];
//           const nextLast = formatted[formatted.length - 1];
//           const prevKey = `${prevLast?.ID ?? ""}-${prevLast?.CreatedAt ?? ""}`;
//           const nextKey = `${nextLast?.ID ?? ""}-${nextLast?.CreatedAt ?? ""}`;
//           if (prevKey === nextKey) return prev;
//         }
//         return formatted;
//       });
//     }
//   }, [isDirectMessage, otherUserId, directMessages]);

//   React.useEffect(() => {
//     if (!isDirectMessage && conversationID) {
//       let mounted = true;
//       (async () => {
//         try {
//           const res = await api.get(
//             `/messages?conversationID=${conversationID}&limit=30`,
//           );
//           if (!mounted) return;
//           const arr = res.data?.messages || [];
//           setMsgs(arr);
//           setNextCursor(res.data?.nextCursor || null);
//           const toSee = arr
//             .filter(
//               (m: any) =>
//                 String(m.receiverID || m.ReceiverID) === String(user?.ID),
//             )
//             .map((m: any) => m.ID);
//           if (toSee.length > 0) {
//             await api.post("/messages/state", {
//               conversationID,
//               messageIDs: toSee,
//               state: "seen",
//             });
//           }
//         } catch {}
//       })();
//       return () => {
//         mounted = false;
//       };
//     }
//   }, [conversationID, user?.ID, isDirectMessage]);

//   const loadOlder = React.useCallback(async () => {
//     if (!nextCursor) return;
//     try {
//       const res = await api.get(
//         `/messages?conversationID=${conversationID}&cursor=${nextCursor}&limit=30`,
//       );
//       const arr = res.data?.messages || [];
//       if (arr.length === 0) {
//         setNextCursor(null);
//         return;
//       }
//       setMsgs((prev) => [...arr, ...prev]);
//       setNextCursor(res.data?.nextCursor || null);
//     } catch {}
//   }, [conversationID, nextCursor]);

//   useEffect(() => {
//     // Fallback polling only when chat screen is focused and WS is not connected.
//     // This avoids constant backend churn while realtime channel is healthy.
//     if (!isFocused) return;

//     const id = setInterval(() => {
//       if (messagingWs.isConnected()) return;

//       if (isDirectMessage && otherUserId) {
//         refetchDirectMessages();
//       } else if (conversationID) {
//         api
//           .get(`/messages?conversationID=${conversationID}&limit=30`)
//           .then((res) => {
//             const arr = res.data?.messages || [];
//             setMsgs(arr);
//             setNextCursor(res.data?.nextCursor || null);
//           })
//           .catch(() => {});
//       }
//     }, 7000);
//     return () => clearInterval(id);
//   }, [
//     isFocused,
//     isDirectMessage,
//     otherUserId,
//     conversationID,
//     refetchDirectMessages,
//   ]);

//   React.useEffect(() => {
//     const typingHandler = (payload: any) => {
//       if (!payload) return;
//       const senderID = Number(payload.senderID || payload.userID || 0);
//       if (!senderID || senderID === Number(user?.ID || 0)) return;
//       const targetConv = Number(payload.conversationID || 0);
//       const isTypingFlag = payload.isTyping !== false;

//       if (
//         !isDirectMessage &&
//         conversationID &&
//         targetConv !== Number(conversationID)
//       ) {
//         return;
//       }
//       if (isDirectMessage && otherUserId && senderID !== Number(otherUserId)) {
//         return;
//       }

//       setIsTyping(Boolean(isTypingFlag));
//       if (remoteTypingTimeoutRef.current)
//         clearTimeout(remoteTypingTimeoutRef.current);
//       if (isTypingFlag) {
//         remoteTypingTimeoutRef.current = setTimeout(
//           () => setIsTyping(false),
//           3000,
//         );
//       }
//     };
//     // Unified websocket events (dm:new_message + typing + dm:read)
//     if (user?.accessToken) {
//       messagingWs.connect(user.accessToken);
//     }
//     const off = messagingWs.on((evt) => {
//       const type = evt?.type;
//       if (type === "dm:new_message") {
//         const m = evt?.data;
//         if (!m) return;
//         const senderID = Number(m.sender_id ?? m.senderID ?? 0);
//         const receiverID = Number(m.receiver_id ?? m.receiverID ?? 0);

//         // Filter: only this thread
//         if (isDirectMessage && otherUserId) {
//           const me = Number(user?.ID || 0);
//           const other = Number(otherUserId);
//           const isBetween =
//             (senderID === me && receiverID === other) ||
//             (senderID === other && receiverID === me);
//           if (!isBetween) return;
//         }

//         const incoming = {
//           ID: Number(m.id ?? m.ID ?? Date.now()),
//           senderID,
//           receiverID,
//           text: String(m.content ?? m.text ?? ""),
//           CreatedAt: m.created_at ?? m.CreatedAt ?? new Date().toISOString(),
//           State: m.state ?? m.State ?? "delivered",
//           type: m.type,
//           reply_to_id: m.reply_to_id,
//           reply_to_message: m.reply_to,
//           reactions_data: m.reactions_data,
//         } as any;

//         setMsgs((prev) => {
//           // Dedupe optimistic temp message from me (same text/receiver within 10s)
//           const me = Number(user?.ID || 0);
//           if (incoming.senderID === me) {
//             const now = Date.now();
//             const idx = [...prev].reverse().findIndex((x: any) => {
//               const created = new Date(x.CreatedAt || 0).getTime();
//               return (
//                 now - created < 10_000 &&
//                 Number(x.senderID) === me &&
//                 Number(x.receiverID) === Number(incoming.receiverID) &&
//                 String(x.text || "") === String(incoming.text || "")
//               );
//             });
//             if (idx >= 0) {
//               const realIdx = prev.length - 1 - idx;
//               const next = prev.slice();
//               next[realIdx] = incoming;
//               return next;
//             }
//           }
//           // Dedupe by ID
//           if (prev.some((x: any) => String(x.ID) === String(incoming.ID)))
//             return prev;
//           return [...prev, incoming];
//         });
//       }

//       if (type === "conv:new_message") {
//         const m = evt?.data;
//         if (!m) return;
//         const convId = Number(m.conversationID ?? m.ConversationID ?? 0);
//         if (!conversationID || convId !== Number(conversationID)) return;

//         const incoming = {
//           ID: Number(m.ID ?? m.id ?? Date.now()),
//           ConversationID: convId,
//           senderID: Number(m.senderID ?? m.SenderID ?? 0),
//           receiverID: Number(m.receiverID ?? m.ReceiverID ?? 0),
//           text: String(m.text ?? m.Text ?? ""),
//           CreatedAt: m.CreatedAt ?? m.createdAt ?? new Date().toISOString(),
//           State: m.State ?? m.state ?? "delivered",
//           type: m.type,
//           previewTitle: m.previewTitle,
//           previewSubtitle: m.previewSubtitle,
//           previewImageURL: m.previewImageURL,
//           refType: m.refType,
//           refID: m.refID,
//         } as any;

//         setMsgs((prev) => {
//           if (prev.some((x: any) => String(x.ID) === String(incoming.ID)))
//             return prev;
//           return [...prev, incoming];
//         });

//         // If it's for me, immediately mark as seen (also triggers conv:state broadcast).
//         const myID = Number(user?.ID || 0);
//         const rcv = Number(incoming.receiverID || incoming.ReceiverID || 0);
//         if (myID && rcv === myID) {
//           api
//             .post("/messages/state", {
//               conversationID,
//               messageIDs: [incoming.ID],
//               state: "seen",
//             })
//             .catch(() => {});
//         }
//       }

//       if (type === "conv:state") {
//         const payload = evt?.data;
//         const convId = Number(payload?.conversationID ?? 0);
//         if (!conversationID || convId !== Number(conversationID)) return;
//         const ids = Array.isArray(payload?.messageIDs)
//           ? payload.messageIDs.map((x: any) => Number(x))
//           : [];
//         const state = String(payload?.state || "");
//         if (!ids.length || (state !== "delivered" && state !== "seen")) return;

//         setMsgs((prev) =>
//           prev.map((m: any) => {
//             const id = Number(m.ID ?? m.id ?? 0);
//             if (!ids.includes(id)) return m;
//             return {
//               ...m,
//               State: state,
//               state,
//               DeliveredAt: state === "delivered" ? payload?.at : m.DeliveredAt,
//               SeenAt: state === "seen" ? payload?.at : m.SeenAt,
//             };
//           }),
//         );
//       }

//       if (type === "typing") {
//         const payload = evt?.data;
//         typingHandler(payload);
//       }
//       if (type === "dm:read") {
//         // Optional: you can update ticks here later (UI already refetches on focus/poll)
//       }
//     });

//     return () => {
//       off();
//       if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//       if (remoteTypingTimeoutRef.current)
//         clearTimeout(remoteTypingTimeoutRef.current);
//     };
//   }, [conversationID, isDirectMessage, otherUserId, user?.ID]);

//   const baseMessages = (msgs.length ? msgs : data?.messages || []) as any[];

//   const getMessageKey = useCallback((m: any, idx: number) => {
//     const id = m?.id ?? m?.ID;
//     const created = m?.createdAt ?? m?.CreatedAt ?? m?.created_at ?? "";
//     if (id != null && String(id) !== "") {
//       // include createdAt so even accidental duplicates don't break rendering
//       return `${String(id)}-${String(created)}`;
//     }
//     return `idx-${idx}-${String(created)}`;
//   }, []);

//   // Defensive: dedupe by server id (and keep newest occurrence) to avoid
//   // "Encountered two children with the same key" when WS + refetch overlap.
//   const renderData = baseMessages
//     .slice()
//     .sort((a: any, b: any) => {
//       const ta = new Date(a.createdAt || a.CreatedAt || 0).getTime();
//       const tb = new Date(b.createdAt || b.CreatedAt || 0).getTime();
//       return ta - tb;
//     })
//     .filter((m: any, idx: number, arr: any[]) => {
//       const id = m?.id ?? m?.ID;
//       if (id == null) return true;
//       // keep last occurrence of that id
//       for (let j = arr.length - 1; j > idx; j--) {
//         const otherId = arr[j]?.id ?? arr[j]?.ID;
//         if (String(otherId) === String(id)) return false;
//       }
//       return true;
//     });

//   const renderReplyPreview = (message: MessageType) => {
//     if (!message.reply_to_message && !message.reply_to_id) return null;

//     const replyMsg = message.reply_to_message;
//     if (!replyMsg) return null;

//     return (
//       <View style={styles.replyPreview}>
//         <View style={styles.replyLine} />
//         <View style={styles.replyContent}>
//           <Text style={styles.replyName} numberOfLines={1}>
//             {replyMsg.senderID === user?.ID ? "You" : recipientName}
//           </Text>
//           <Text style={styles.replyText} numberOfLines={2}>
//             {replyMsg.text || replyMsg.Content || ""}
//           </Text>
//         </View>
//       </View>
//     );
//   };

//   const renderReactions = (message: MessageType, isMine: boolean) => {
//     if (!message.reactions_data || message.reactions_data.length === 0)
//       return null;

//     return (
//       <View
//         style={[
//           styles.reactionsContainer,
//           isMine && styles.reactionsContainerMine,
//         ]}
//       >
//         {message.reactions_data.map((reaction, idx) => {
//           const userReacted = reaction.users.includes(user?.ID || 0);
//           return (
//             <TouchableOpacity
//               key={`${reaction.emoji}-${idx}`}
//               style={[
//                 styles.reactionBubble,
//                 userReacted && styles.reactionBubbleActive,
//               ]}
//               onPress={() => handleReaction(reaction.emoji)}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
//               {reaction.count > 1 && (
//                 <Text
//                   style={[
//                     styles.reactionCount,
//                     userReacted && styles.reactionCountActive,
//                   ]}
//                 >
//                   {reaction.count}
//                 </Text>
//               )}
//             </TouchableOpacity>
//           );
//         })}
//       </View>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           onPress={() => nav.goBack()}
//           style={styles.headerButton}
//         >
//           <MaterialIcons name="arrow-back" size={24} color="#222222" />
//         </TouchableOpacity>

//         <View style={styles.headerCenter}>
//           {recipientAvatar ? (
//             <Image
//               source={{ uri: recipientAvatar }}
//               style={styles.headerAvatar}
//             />
//           ) : (
//             <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
//               <Text style={styles.avatarInitial}>
//                 {recipientName?.[0]?.toUpperCase() || "U"}
//               </Text>
//             </View>
//           )}
//           <View style={styles.headerTextContainer}>
//             <Text style={styles.headerName} numberOfLines={1}>
//               {recipientName || "Host"}
//             </Text>
//             <Text style={styles.headerSubtext}>
//               Usually responds within an hour
//             </Text>
//           </View>
//         </View>

//         <TouchableOpacity
//           onPress={() => setShowMenu(!showMenu)}
//           style={styles.headerButton}
//         >
//           <MaterialIcons name="more-horiz" size={24} color="#222222" />
//         </TouchableOpacity>
//       </View>

//       {/* Property Card Header */}
//       {(thumb || title) && (
//         <TouchableOpacity
//           style={styles.propertyCard}
//           onPress={() =>
//             propertyID &&
//             nav.navigate(
//               "PropertyDetails" as never,
//               { propertyID: propertyID } as never,
//             )
//           }
//           activeOpacity={0.8}
//         >
//           {thumb ? (
//             <Image source={{ uri: thumb }} style={styles.propertyImage} />
//           ) : (
//             <View style={[styles.propertyImage, styles.imagePlaceholder]} />
//           )}
//           <View style={styles.propertyInfo}>
//             <Text style={styles.propertyTitle} numberOfLines={2}>
//               {title || "Property Listing"}
//             </Text>
//             {dateRange && (
//               <Text style={styles.propertyDates} numberOfLines={1}>
//                 {dateRange}
//               </Text>
//             )}
//             <View style={styles.propertyFooter}>
//               <View style={styles.statusBadge}>
//                 <Text style={styles.statusBadgeText}>{statusPill}</Text>
//               </View>
//               <MaterialIcons name="chevron-right" size={20} color="#717171" />
//             </View>
//           </View>
//         </TouchableOpacity>
//       )}

//       <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === "ios" ? "padding" : undefined}
//       >
//         <FlatList
//           ref={(r) => {
//             (listRef as any).current = r;
//           }}
//           style={styles.messagesList}
//           contentContainerStyle={styles.messagesContent}
//           data={renderData}
//           keyExtractor={(m: any, idx) => getMessageKey(m, idx)}
//           renderItem={({ item }) => {
//             if (item.type === "property_card") {
//               return null; // Property card rendering omitted for brevity
//             }

//             const isMine =
//               String(item.author?.id || item.senderID) === String(user?.ID);
//             const text = item.text || item.Text || item.Content || "";
//             const time = new Date(
//               item.createdAt || item.CreatedAt || Date.now(),
//             );
//             const state = (item.state || item.State || "").toString();

//             return (
//               <Pressable
//                 onLongPress={() => handleLongPress(item)}
//                 delayLongPress={300}
//               >
//                 <View
//                   style={[styles.messageRow, isMine && styles.messageRowMine]}
//                 >
//                   {!isMine &&
//                     (recipientAvatar ? (
//                       <Image
//                         source={{ uri: recipientAvatar }}
//                         style={styles.messageAvatar}
//                       />
//                     ) : (
//                       <View
//                         style={[styles.messageAvatar, styles.avatarPlaceholder]}
//                       >
//                         <Text style={styles.avatarInitialSmall}>
//                           {recipientName?.[0]?.toUpperCase() || "U"}
//                         </Text>
//                       </View>
//                     ))}
//                   <View>
//                     <View
//                       style={[
//                         styles.messageBubble,
//                         isMine
//                           ? styles.messageBubbleMine
//                           : styles.messageBubbleTheirs,
//                       ]}
//                     >
//                       {renderReplyPreview(item)}
//                       <Text
//                         style={[
//                           styles.messageText,
//                           isMine && styles.messageTextMine,
//                         ]}
//                       >
//                         {text}
//                       </Text>
//                       <View style={styles.messageFooter}>
//                         <Text
//                           style={[
//                             styles.messageTime,
//                             isMine && styles.messageTimeMine,
//                           ]}
//                         >
//                           {time.toLocaleTimeString([], {
//                             hour: "numeric",
//                             minute: "2-digit",
//                           })}
//                         </Text>
//                         {isMine &&
//                           (state === "seen" ? (
//                             <MaterialIcons
//                               name="done-all"
//                               size={14}
//                               color="#FFFFFF"
//                               style={styles.readIcon}
//                             />
//                           ) : (
//                             <MaterialIcons
//                               name="done"
//                               size={14}
//                               color="rgba(255,255,255,0.7)"
//                               style={styles.readIcon}
//                             />
//                           ))}
//                       </View>
//                     </View>
//                     {renderReactions(item, isMine)}
//                   </View>
//                   {isMine &&
//                     (myAvatar ? (
//                       <Image
//                         source={{ uri: myAvatar }}
//                         style={[styles.messageAvatar, styles.messageAvatarMine]}
//                       />
//                     ) : (
//                       <View
//                         style={[
//                           styles.messageAvatar,
//                           styles.messageAvatarMine,
//                           styles.avatarPlaceholder,
//                         ]}
//                       >
//                         <Text style={styles.avatarInitialSmall}>
//                           {(
//                             user?.firstName?.[0] ||
//                             user?.email?.[0] ||
//                             "Y"
//                           ).toUpperCase()}
//                         </Text>
//                       </View>
//                     ))}
//                 </View>
//               </Pressable>
//             );
//           }}
//           inverted={false}
//           onEndReachedThreshold={0.05}
//           onEndReached={loadOlder}
//           onContentSizeChange={() => {
//             try {
//               (listRef as any).current?.scrollToEnd({ animated: true });
//             } catch {}
//           }}
//         />

//         {isTyping && (
//           <View style={styles.typingIndicator}>
//             <View style={styles.typingDot} />
//             <View style={[styles.typingDot, styles.typingDotDelay1]} />
//             <View style={[styles.typingDot, styles.typingDotDelay2]} />
//             <Text style={styles.typingText}>
//               {recipientName || "Host"} is typing...
//             </Text>
//           </View>
//         )}

//         {/* Reply Preview in Input */}
//         {replyingTo && (
//           <View style={styles.replyingToBar}>
//             <View style={styles.replyingToContent}>
//               <MaterialIcons name="reply" size={16} color="#717171" />
//               <View style={styles.replyingToText}>
//                 <Text style={styles.replyingToName}>
//                   Replying to{" "}
//                   {replyingTo.senderID === user?.ID
//                     ? "yourself"
//                     : recipientName}
//                 </Text>
//                 <Text style={styles.replyingToMessage} numberOfLines={1}>
//                   {replyingTo.text || replyingTo.Content || ""}
//                 </Text>
//               </View>
//             </View>
//             <TouchableOpacity
//               onPress={() => setReplyingTo(null)}
//               style={styles.cancelReplyBtn}
//             >
//               <MaterialIcons name="close" size={20} color="#717171" />
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* Input Bar */}
//         <View style={styles.inputContainer}>
//           <View style={styles.inputWrapper}>
//             <TextInput
//               style={styles.input}
//               placeholder="Type a message"
//               placeholderTextColor="#717171"
//               value={input}
//               onChangeText={onInputChange}
//               multiline
//               maxLength={5000}
//             />
//           </View>
//           <TouchableOpacity
//             style={[
//               styles.sendButton,
//               !input.trim() && styles.sendButtonDisabled,
//             ]}
//             onPress={() => {
//               if (input.trim()) {
//                 onSendPress(input);
//                 setInput("");
//               }
//             }}
//             disabled={!input.trim()}
//             activeOpacity={0.8}
//           >
//             <MaterialIcons name="send" size={20} color="#FFFFFF" />
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>

//       {/* Menu Dropdown */}
//       {showMenu && (
//         <TouchableOpacity
//           style={styles.menuOverlay}
//           activeOpacity={1}
//           onPress={() => setShowMenu(false)}
//         >
//           <View style={styles.menuDropdown}>
//             <TouchableOpacity
//               style={styles.menuItem}
//               onPress={() => {
//                 setShowMenu(false);
//               }}
//             >
//               <MaterialIcons name="flag" size={20} color="#222222" />
//               <Text style={styles.menuItemText}>Report this conversation</Text>
//             </TouchableOpacity>

//             <View style={styles.menuDivider} />

//             <TouchableOpacity style={styles.menuItem} onPress={handleBlockUser}>
//               <MaterialIcons name="block" size={20} color="#222222" />
//               <Text style={styles.menuItemText}>Block user</Text>
//             </TouchableOpacity>

//             <View style={styles.menuDivider} />

//             <TouchableOpacity
//               style={styles.menuItem}
//               onPress={handleDeleteConversation}
//             >
//               <MaterialIcons name="delete-outline" size={20} color="#C13515" />
//               <Text style={[styles.menuItemText, styles.menuItemDanger]}>
//                 Delete conversation
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </TouchableOpacity>
//       )}

//       {/* Message Actions Modal */}
//       {showMessageActions && selectedMessage && (
//         <Modal
//           visible={showMessageActions}
//           transparent
//           animationType="none"
//           onRequestClose={closeMessageActions}
//         >
//           <Pressable
//             style={styles.actionsModalOverlay}
//             onPress={closeMessageActions}
//           >
//             <Animated.View
//               style={[styles.actionsModalBlur, { opacity: fadeAnim }]}
//             >
//               <BlurView
//                 intensity={90}
//                 tint="dark"
//                 style={StyleSheet.absoluteFill}
//               />
//             </Animated.View>

//             {/* Highlighted Message */}
//             <View style={styles.highlightedMessageContainer}>
//               <View
//                 style={[
//                   styles.highlightedBubble,
//                   String(selectedMessage.senderID) === String(user?.ID)
//                     ? styles.messageBubbleMine
//                     : styles.messageBubbleTheirs,
//                 ]}
//               >
//                 {renderReplyPreview(selectedMessage)}
//                 <Text
//                   style={[
//                     styles.messageText,
//                     String(selectedMessage.senderID) === String(user?.ID) &&
//                       styles.messageTextMine,
//                   ]}
//                 >
//                   {selectedMessage.text || selectedMessage.Content || ""}
//                 </Text>
//               </View>
//             </View>

//             {/* Action Buttons */}
//             <Animated.View
//               style={[
//                 styles.actionsPanel,
//                 { transform: [{ translateY: actionModalY }] },
//               ]}
//             >
//               {/* Quick Reactions */}
//               <View style={styles.quickReactionsRow}>
//                 {QUICK_REACTIONS.map((emoji) => (
//                   <TouchableOpacity
//                     key={emoji}
//                     style={styles.quickReactionBtn}
//                     onPress={() => handleReaction(emoji)}
//                     activeOpacity={0.7}
//                   >
//                     <Text style={styles.quickReactionEmoji}>{emoji}</Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>

//               {/* Action Buttons */}
//               <TouchableOpacity
//                 style={styles.actionButton}
//                 onPress={handleReply}
//               >
//                 <MaterialIcons name="reply" size={24} color="#FFFFFF" />
//                 <Text style={styles.actionButtonText}>Reply</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={styles.actionButton}
//                 onPress={() => setShowReactionPicker(!showReactionPicker)}
//               >
//                 <MaterialIcons name="add-reaction" size={24} color="#FFFFFF" />
//                 <Text style={styles.actionButtonText}>More Reactions</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={[styles.actionButton, styles.cancelButton]}
//                 onPress={closeMessageActions}
//               >
//                 <Text style={styles.cancelButtonText}>Cancel</Text>
//               </TouchableOpacity>
//             </Animated.View>
//           </Pressable>
//         </Modal>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#FFFFFF",
//   },

//   // Header
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     marginTop: "15%",
//     borderBottomColor: "#EBEBEB",
//     backgroundColor: "#FFFFFF",
//   },
//   headerButton: {
//     padding: 8,
//     borderRadius: 20,
//   },
//   headerCenter: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     marginHorizontal: 12,
//   },
//   headerAvatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     marginRight: 12,
//   },
//   avatarPlaceholder: {
//     backgroundColor: "#717171",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   avatarInitial: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   avatarInitialSmall: {
//     color: "#FFFFFF",
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   headerTextContainer: {
//     flex: 1,
//   },
//   headerName: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#222222",
//     marginBottom: 2,
//   },
//   headerSubtext: {
//     fontSize: 12,
//     color: "#717171",
//   },

//   // Property Card
//   propertyCard: {
//     flexDirection: "row",
//     backgroundColor: "#F7F7F7",
//     marginHorizontal: 16,
//     marginTop: 12,
//     marginBottom: 8,
//     borderRadius: 12,
//     overflow: "hidden",
//     borderWidth: 1,
//     borderColor: "#EBEBEB",
//   },
//   propertyImage: {
//     width: 80,
//     height: 80,
//     backgroundColor: "#DDDDDD",
//   },
//   imagePlaceholder: {
//     backgroundColor: "#EBEBEB",
//   },
//   propertyInfo: {
//     flex: 1,
//     padding: 12,
//     justifyContent: "space-between",
//   },
//   propertyTitle: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#222222",
//     marginBottom: 4,
//   },
//   propertyDates: {
//     fontSize: 12,
//     color: "#717171",
//     marginBottom: 8,
//   },
//   propertyFooter: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   statusBadge: {
//     backgroundColor: "#FFFFFF",
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 4,
//     borderWidth: 1,
//     borderColor: "#DDDDDD",
//   },
//   statusBadgeText: {
//     fontSize: 11,
//     fontWeight: "600",
//     color: "#222222",
//   },

//   // Messages
//   messagesList: {
//     flex: 1,
//     backgroundColor: "#FFFFFF",
//   },
//   messagesContent: {
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//   },
//   messageRow: {
//     flexDirection: "row",
//     alignItems: "flex-end",
//     marginBottom: 16,
//   },
//   messageRowMine: {
//     flexDirection: "row-reverse",
//   },
//   messageAvatar: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     marginRight: 8,
//   },
//   messageAvatarMine: {
//     marginRight: 0,
//     marginLeft: 8,
//   },
//   messageBubble: {
//     maxWidth: 280,
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 20,
//   },
//   messageBubbleTheirs: {
//     backgroundColor: "#F0F0F0",
//     borderBottomLeftRadius: 4,
//   },
//   messageBubbleMine: {
//     backgroundColor: "#222222",
//     borderBottomRightRadius: 4,
//   },
//   messageText: {
//     fontSize: 15,
//     lineHeight: 20,
//     color: "#222222",
//   },
//   messageTextMine: {
//     color: "#FFFFFF",
//   },
//   messageFooter: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 4,
//     justifyContent: "flex-end",
//   },
//   messageTime: {
//     fontSize: 11,
//     color: "#717171",
//   },
//   messageTimeMine: {
//     color: "rgba(255,255,255,0.7)",
//   },
//   readIcon: {
//     marginLeft: 4,
//   },

//   // Reply Preview in Message
//   replyPreview: {
//     flexDirection: "row",
//     marginBottom: 8,
//     paddingLeft: 8,
//     opacity: 0.8,
//   },
//   replyLine: {
//     width: 3,
//     backgroundColor: "#FF385C",
//     borderRadius: 2,
//     marginRight: 8,
//   },
//   replyContent: {
//     flex: 1,
//   },
//   replyName: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: "#222222",
//     marginBottom: 2,
//   },
//   replyText: {
//     fontSize: 13,
//     color: "#717171",
//   },

//   // Reactions
//   reactionsContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     marginTop: 4,
//     marginLeft: 8,
//   },
//   reactionsContainerMine: {
//     marginLeft: 0,
//     marginRight: 8,
//     justifyContent: "flex-end",
//   },
//   reactionBubble: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#FFFFFF",
//     borderWidth: 1,
//     borderColor: "#DDDDDD",
//     borderRadius: 12,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     marginRight: 4,
//     marginBottom: 4,
//   },
//   reactionBubbleActive: {
//     backgroundColor: "#FFF0F0",
//     borderColor: "#FF385C",
//   },
//   reactionEmoji: {
//     fontSize: 14,
//   },
//   reactionCount: {
//     fontSize: 11,
//     fontWeight: "600",
//     color: "#717171",
//     marginLeft: 4,
//   },
//   reactionCountActive: {
//     color: "#FF385C",
//   },

//   // Typing Indicator
//   typingIndicator: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 24,
//     paddingVertical: 8,
//   },
//   typingDot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: "#717171",
//     marginRight: 4,
//   },
//   typingDotDelay1: {
//     opacity: 0.7,
//   },
//   typingDotDelay2: {
//     opacity: 0.4,
//   },
//   typingText: {
//     fontSize: 13,
//     color: "#717171",
//     marginLeft: 8,
//   },

//   // Replying To Bar
//   replyingToBar: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     backgroundColor: "#F7F7F7",
//     borderTopWidth: 1,
//     borderTopColor: "#EBEBEB",
//   },
//   replyingToContent: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   replyingToText: {
//     flex: 1,
//     marginLeft: 8,
//   },
//   replyingToName: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: "#222222",
//   },
//   replyingToMessage: {
//     fontSize: 13,
//     color: "#717171",
//     marginTop: 2,
//   },
//   cancelReplyBtn: {
//     padding: 4,
//   },

//   // Input
//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "flex-end",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderTopWidth: 1,
//     marginBottom: 20,
//     borderTopColor: "#EBEBEB",
//     backgroundColor: "#FFFFFF",
//   },
//   inputWrapper: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "flex-end",
//     backgroundColor: "#F7F7F7",
//     borderRadius: 24,
//     borderWidth: 1,
//     borderColor: "#B0B0B0",
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     marginRight: 8,
//     minHeight: 44,
//   },
//   input: {
//     flex: 1,
//     fontSize: 15,
//     color: "#222222",
//     maxHeight: 100,
//     paddingVertical: 8,
//   },
//   sendButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: theme["color-temporary-primary"],
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   sendButtonDisabled: {
//     backgroundColor: "#DDDDDD",
//   },

//   // Menu
//   menuOverlay: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: "rgba(0,0,0,0.3)",
//     justifyContent: "flex-start",
//     alignItems: "flex-end",
//     paddingTop: 60,
//     paddingRight: 16,
//   },
//   menuDropdown: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 12,
//     minWidth: 240,
//     shadowColor: "#000000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 12,
//     elevation: 8,
//   },
//   menuItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 16,
//     paddingHorizontal: 16,
//   },
//   menuItemText: {
//     fontSize: 15,
//     color: "#222222",
//     marginLeft: 12,
//     fontWeight: "400",
//   },
//   menuItemDanger: {
//     color: "#C13515",
//   },
//   menuDivider: {
//     height: 1,
//     backgroundColor: "#EBEBEB",
//   },

//   // Message Actions Modal
//   actionsModalOverlay: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   actionsModalBlur: {
//     ...StyleSheet.absoluteFillObject,
//   },
//   highlightedMessageContainer: {
//     paddingHorizontal: 40,
//     marginBottom: 40,
//   },
//   highlightedBubble: {
//     maxWidth: "100%",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 20,
//     shadowColor: "#000000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   actionsPanel: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: "#1C1C1E",
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     paddingTop: 20,
//     paddingBottom: 40,
//     paddingHorizontal: 20,
//   },
//   quickReactionsRow: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     marginBottom: 20,
//     paddingVertical: 12,
//     backgroundColor: "#2C2C2E",
//     borderRadius: 16,
//   },
//   quickReactionBtn: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: "#3A3A3C",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   quickReactionEmoji: {
//     fontSize: 28,
//   },
//   actionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#3A3A3C",
//     paddingVertical: 16,
//     borderRadius: 12,
//     marginBottom: 12,
//   },
//   actionButtonText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#FFFFFF",
//     marginLeft: 12,
//   },
//   cancelButton: {
//     backgroundColor: "#2C2C2E",
//     marginTop: 8,
//   },
//   cancelButtonText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#FFFFFF",
//   },
// });

// export default DirectMessageScreen;

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Animated,
  Pressable,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useConversationsQuery } from "../hooks/queries/useConversationsQuery";
import { useSelectedConversationQuery } from "../hooks/queries/useSelectedConversationQuery";
import { useCreateMessageMutation } from "../hooks/mutations/useCreateMessageMutation";
import { useUser } from "../hooks/useUser";
import { useBlockUser } from "../hooks/useGroupManagement";
import {
  useGetDirectMessages,
  useSendDirectMessage,
} from "../hooks/queries/useExperienceInvites";
import { api } from "../services/api";
import { endpoints, directMessageEndpoints } from "../constants";
import { getAppLanguage } from "../utils/translation";
import * as Haptics from "expo-haptics";
import { messagingWs } from "../services/messagingWs";
import { markDirectThreadRead } from "../services/markDirectThreadRead";
import {
  fetchRentConversationThread,
  rentConversationMessagesKey,
} from "../services/messagingThreadPrefetch";
import { useQueryClient } from "@tanstack/react-query";
import { theme } from "../theme";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import Toast from "../components/CustomToast";
import { useTranslation } from "react-i18next";
import {
  MeskenyTeamAvatar,
  MeskenyTeamNameRow,
} from "../components/MeskenyTeamAvatar";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Design Tokens (TikTok 2026 — Light) ─────────────────────────────────────
const TK = {
  bg: "#FFFFFF",
  surface: "#F7F7F7",
  surface2: "#EFEFEF",
  surface3: "#E4E4E4",
  border: "#E8E8E8",
  accent: theme["color-temporary-primary"],
  accentSoft: "rgba(254,44,85,0.10)",
  text: "#111111",
  textSub: "#6B6B6B",
  textFaint: "#AAAAAA",
  bubbleMine: theme["color-temporary-primary"],
  bubbleTheirs: "#EFEFEF",
  bubbleTextMine: "#FFFFFF",
  bubbleTextTheirs: "#111111",
  headerHeight: 56,
  inputHeight: 52,
  avatarSM: 30,
  avatarMD: 40,
  radius: {
    bubble: 20,
    bubbleTail: 4,
    input: 26,
    card: 14,
    badge: 6,
    action: 16,
  },
};

// Common emoji reactions
const QUICK_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

type RouteParams = {
  conversationID?: number | null;
  recipientName?: string;
  otherUserId?: number;
  isMeskenyTeam?: boolean;
  /** Inbox preview row — show immediately while thread refetches */
  seedLastMessage?: Record<string, unknown>;
  /** Sale listing id — loads header card + deep links */
  propertyID?: number;
  pendingInitialCard?: {
    caption: string;
    property_id?: number;
    property_type?: "sale" | "rent";
    title: string;
    listing_price?: number;
    currency?: string;
    image_url?: string;
  };
};

type PropertyCardPayload = {
  caption?: string;
  property_id: number;
  property_type?: "sale" | "rent";
  title: string;
  listing_price?: number;
  currency?: string;
  image_url?: string;
};

function tryParsePropertyCardPayload(raw: string): PropertyCardPayload | null {
  try {
    const o = JSON.parse(raw);
    if (o && typeof o.property_id === "number" && typeof o.title === "string")
      return o as PropertyCardPayload;
  } catch {
    /* not JSON */
  }
  return null;
}

function formatListingPrice(n?: number, currency?: string): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  // Always use MRU as the currency
  return `MRU ${Number(n).toLocaleString()}`;
}

interface MessageType {
  ID: number;
  senderID: number;
  receiverID: number;
  text?: string;
  Content?: string;
  CreatedAt: string;
  State?: string;
  type?: string;
  reply_to_id?: number;
  reply_to_message?: MessageType;
  reactions_data?: Array<{
    emoji: string;
    count: number;
    users: number[];
  }>;
}

const EMPTY_MESSAGES: any[] = [];

// ─── Typing Dots Animated ────────────────────────────────────────────────────
const TypingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -5,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(600),
        ]),
      ).start();

    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View style={styles.typingBubble}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[styles.typingDotAnim, { transform: [{ translateY: dot }] }]}
        />
      ))}
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
export const DirectMessageScreen = () => {
  const { t } = useTranslation();
  const route = useRoute<any>();
  const {
    conversationID,
    recipientName,
    otherUserId,
    propertyID: routePropertyID,
    pendingInitialCard,
    seedLastMessage,
    isMeskenyTeam: routeIsMeskenyTeam,
  } = (route.params || {}) as RouteParams;
  const { user } = useUser();
  const queryClient = useQueryClient();
  const isFocused = useIsFocused();
  const nav = useNavigation<any>();

  const { data } = useSelectedConversationQuery(conversationID || 0);
  const conversations = useConversationsQuery();
  const createMessage = useCreateMessageMutation();
  const blockUser = useBlockUser();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [propImage, setPropImage] = useState<string | undefined>(undefined);
  const [propTitle, setPropTitle] = useState<string | undefined>(undefined);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [optimisticCards, setOptimisticCards] = useState<any[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    duration?: number;
  } | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [showAttachTray, setShowAttachTray] = useState(false);
  const attachTrayY = useRef(new Animated.Value(80)).current;
  const attachTrayOpacity = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Reply and Reaction states
  const [selectedMessage, setSelectedMessage] = useState<MessageType | null>(
    null,
  );
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageType | null>(null);
  const actionModalY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // For direct messages
  const isDirectMessage = !conversationID && !!otherUserId;
  const consumedPendingRef = useRef(false);
  useEffect(() => {
    if (consumedPendingRef.current) return;
    if (!isDirectMessage || !otherUserId || !pendingInitialCard || !user?.ID)
      return;
    consumedPendingRef.current = true;
    setToast({
      message: t("dm.toastPreparingMessage", {
        defaultValue: "Preparing message...",
      }),
      type: "info",
      duration: 1000,
    });
    const pid = Number(pendingInitialCard.property_id || routePropertyID || 0);
    const payload = {
      caption: pendingInitialCard.caption,
      property_id: pid,
      property_type: pendingInitialCard.property_type || "sale",
      title: pendingInitialCard.title,
      listing_price: pendingInitialCard.listing_price,
      currency: pendingInitialCard.currency || "MRU",
      image_url: pendingInitialCard.image_url,
    };
    setOptimisticCards((prev) => [
      ...prev,
      {
        ID: `optimistic-card-${Date.now()}`,
        senderID: user.ID,
        receiverID: otherUserId,
        text: JSON.stringify(payload),
        CreatedAt: new Date().toISOString(),
        type: "property_card",
        refType: "property_sale",
        refID: pid,
        _optimistic: true,
      },
    ]);
    setToast({
      message: t("dm.toastSendingMessage", {
        defaultValue: "Sending message...",
      }),
      type: "info",
      duration: 1800,
    });
  }, [
    isDirectMessage,
    otherUserId,
    pendingInitialCard,
    user?.ID,
    routePropertyID,
  ]);

  const sendDirectMessage = useSendDirectMessage();
  const directMessagesQuery = useGetDirectMessages(otherUserId || 0);
  const refetchDirectMessages = directMessagesQuery.refetch;
  const threadPayload = directMessagesQuery.data as
    | { messages?: unknown[]; isMeskenyTeam?: boolean }
    | unknown[]
    | undefined;
  const directMessages = Array.isArray(threadPayload)
    ? threadPayload
    : Array.isArray(threadPayload?.messages)
      ? threadPayload.messages
      : EMPTY_MESSAGES;
  const isMeskenyTeam =
    Boolean(routeIsMeskenyTeam) ||
    Boolean(
      threadPayload &&
        !Array.isArray(threadPayload) &&
        threadPayload.isMeskenyTeam,
    );
  const displayRecipientName = isMeskenyTeam
    ? t("messages.meskenyTeam", "Meskeny Team")
    : recipientName || t("dm.userFallback", { defaultValue: "User" });

  // Show inbox preview instantly (offer/tour cards) while full thread loads.
  React.useEffect(() => {
    if (!seedLastMessage) return;
    const raw = seedLastMessage as Record<string, unknown>;
    const seedId = Number(raw.id ?? raw.ID ?? 0);
    const seedSender = Number(raw.sender_id ?? raw.senderID ?? raw.SenderID ?? 0);
    const seedReceiver = Number(
      raw.receiver_id ?? raw.receiverID ?? raw.ReceiverID ?? 0,
    );
    const seedText = String(
      raw.content ?? raw.text ?? raw.Text ?? raw.Content ?? "",
    );
    const seedCreated = String(
      raw.created_at ?? raw.CreatedAt ?? raw.createdAt ?? new Date().toISOString(),
    );
    if (!seedId && !seedText) return;

    const seeded = {
      ID: seedId || Date.now(),
      senderID: seedSender,
      receiverID: seedReceiver,
      text: seedText,
      CreatedAt: seedCreated,
      State: "delivered",
      type: raw.type ?? raw.Type,
      refType: raw.ref_type ?? raw.refType ?? raw.RefType,
      refID: raw.ref_id ?? raw.refID ?? raw.RefID,
      ref_type: raw.ref_type ?? raw.refType,
      ref_id: raw.ref_id ?? raw.refID,
    };

    setMsgs((prev) => {
      if (prev.some((m: any) => String(m.ID) === String(seeded.ID))) return prev;
      return [...prev, seeded];
    });
  }, [seedLastMessage]);

  React.useLayoutEffect(() => {
    if (recipientName) nav.setOptions({ headerShown: false });
  }, [recipientName, nav]);

  // ─── Send ──────────────────────────────────────────────────────────────────
  const onSendPress = async (text: string) => {
    if (!text.trim() || !user) return;

    if (isDirectMessage && otherUserId) {
      const tempMsg = {
        ID: Date.now(),
        senderID: user.ID,
        receiverID: otherUserId,
        text: text.trim(),
        CreatedAt: new Date().toISOString(),
        State: "sent",
        reply_to_id: replyingTo?.ID,
        reply_to_message: replyingTo || undefined,
      };
      setMsgs((prev) => [...prev, tempMsg]);
      try {
        await sendDirectMessage.mutateAsync({
          receiver_id: otherUserId,
          content: text.trim(),
          type: "text",
          ref_type: undefined,
          ref_id: undefined,
          reply_to_id: replyingTo?.ID,
        });
        refetchDirectMessages();
      } catch (error) {
        console.error("Failed to send message:", error);
      }
      setReplyingTo(null);
      return;
    }

    if (!isDirectMessage && data && conversationID) {
      setMsgs((prev) => [
        ...prev,
        {
          ID: Date.now(),
          senderID: user.ID,
          receiverID: data.receiverID,
          text: text.trim(),
          CreatedAt: new Date().toISOString(),
          State: "sent",
        },
      ]);
      createMessage.mutate({
        conversationID,
        author: {
          id: String(user.ID),
          firstName: user.firstName || user.phoneNumber || user.email || "",
          lastName: user.lastName || "",
        },
        senderID: user.ID,
        receiverID: data.receiverID,
        text: text.trim(),
      });
    }
  };

  // ─── Typing ────────────────────────────────────────────────────────────────
  const onInputChange = useCallback(
    (text: string) => {
      setInput(text);
      if (!user?.ID) return;
      const toUserId = isDirectMessage ? otherUserId : data?.receiverID;
      if (toUserId) {
        messagingWs.connect(user.accessToken || "");
        messagingWs.send("typing", {
          toUserId,
          senderID: user.ID,
          receiverID: toUserId,
          conversationID: conversationID || null,
          isTyping: text.trim().length > 0,
        });
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (toUserId) {
          messagingWs.send("typing", {
            toUserId,
            senderID: user.ID,
            receiverID: toUserId,
            conversationID: conversationID || null,
            isTyping: false,
          });
        }
      }, 1500);
    },
    [
      user?.ID,
      user?.accessToken,
      isDirectMessage,
      otherUserId,
      data?.receiverID,
      conversationID,
    ],
  );

  // ─── Long Press → Actions ──────────────────────────────────────────────────
  const handleLongPress = (message: MessageType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMessage(message);
    setShowMessageActions(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(actionModalY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }),
    ]).start();
  };

  const closeMessageActions = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(actionModalY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowMessageActions(false);
      setSelectedMessage(null);
    });
  };

  const openAttachTray = () => {
    setShowAttachTray(true);
    Animated.parallel([
      Animated.timing(attachTrayOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(attachTrayY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 6,
      }),
    ]).start();
  };

  const closeAttachTray = () => {
    Animated.parallel([
      Animated.timing(attachTrayOpacity, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(attachTrayY, {
        toValue: 80,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start(() => setShowAttachTray(false));
  };

  const toggleAttachTray = () => {
    if (showAttachTray) closeAttachTray();
    else openAttachTray();
  };

  const handleReply = () => {
    setReplyingTo(selectedMessage);
    closeMessageActions();
  };

  const handleReaction = async (emoji: string) => {
    if (!selectedMessage) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const userAlreadyReacted = selectedMessage.reactions_data?.some(
        (r) => r.emoji === emoji && r.users.includes(user?.ID || 0),
      );
      if (userAlreadyReacted) {
        await api.delete(
          directMessageEndpoints.removeReaction(selectedMessage.ID),
          {
            data: { emoji },
            headers: { Authorization: `Bearer ${user?.accessToken}` },
          },
        );
      } else {
        await api.post(
          directMessageEndpoints.addReaction(selectedMessage.ID),
          { emoji },
          { headers: { Authorization: `Bearer ${user?.accessToken}` } },
        );
      }
      if (isDirectMessage) refetchDirectMessages();
    } catch (error) {
      console.error("Failed to react:", error);
    }
    closeMessageActions();
  };

  const handleBlockUser = () => {
    if (isMeskenyTeam) return;
    const targetUserId = isDirectMessage ? otherUserId : data?.receiverID;
    if (!targetUserId || !user) return;
    Alert.alert(
      t("dm.blockUserTitle", { defaultValue: "Block user" }),
      t("dm.blockUserBody", {
        defaultValue: "They won't be able to message or contact you.",
      }),
      [
        {
          text: t("common.cancel", { defaultValue: "Cancel" }),
          style: "cancel",
        },
        {
          text: t("dm.blockUserConfirm", { defaultValue: "Block" }),
          style: "destructive",
          onPress: () => {
            blockUser.mutate(
              { userId: targetUserId, reason: blockReason },
              {
                onSuccess: () => {
                  setShowMenu(false);
                  Alert.alert(
                    t("dm.userBlockedTitle", { defaultValue: "User blocked" }),
                    t("dm.userBlockedBody", {
                      defaultValue: "This user can no longer contact you.",
                    }),
                  );
                  nav.goBack();
                },
                onError: () =>
                  Alert.alert(
                    t("common.error", { defaultValue: "Error" }),
                    t("common.somethingWentWrongTryAgain", {
                      defaultValue: "Something went wrong. Please try again.",
                    }),
                  ),
              },
            );
          },
        },
      ],
    );
  };

  const handleDeleteConversation = () => {
    Alert.alert(
      t("dm.deleteConversationTitle", { defaultValue: "Delete conversation" }),
      t("dm.deleteConversationBody", { defaultValue: "This can't be undone." }),
      [
        {
          text: t("common.cancel", { defaultValue: "Cancel" }),
          style: "cancel",
        },
        {
          text: t("dm.deleteConversationConfirm", { defaultValue: "Delete" }),
          style: "destructive",
          onPress: () => {
            setShowMenu(false);
            nav.goBack();
          },
        },
      ],
    );
  };

  // ─── Data ──────────────────────────────────────────────────────────────────
  const convMatch: any = conversationID
    ? (conversations.data || []).find((c: any) => c.ID === conversationID) || {}
    : {};
  const thumb = convMatch?.thumbnail || propImage;
  const title = convMatch?.title || propTitle;
  const recipientAvatar = convMatch?.recipientAvatar;
  const myAvatar =
    (user as any)?.avatarURL || (user as any)?.AvatarURL || undefined;
  const statusPill =
    convMatch?.status || t("dm.statusPending", { defaultValue: "Pending" });
  const dateRange = convMatch?.dateRange || "";
  const propertyID = convMatch?.propertyID || routePropertyID;

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (!propertyID) return;
        const lang = getAppLanguage();
        const res = await api.get(
          `${endpoints.getPropertyByID}${propertyID}?lang=${lang}`,
        );
        const p = res?.data;
        if (!isMounted || !p) return;
        const firstImg =
          Array.isArray(p.images) && p.images.length > 0
            ? p.images[0].url || p.images[0]
            : undefined;
        setPropImage(firstImg);
        setPropTitle(p.title);
      } catch {}
    })();
    return () => {
      isMounted = false;
    };
  }, [propertyID]);

  const formatDirectMessages = React.useCallback((rows: any[]) => {
    return rows.map((m: any) => ({
      ID: m.id || m.ID,
      senderID: m.sender_id || m.senderID,
      receiverID: m.receiver_id || m.receiverID,
      text: m.content || m.text,
      CreatedAt: m.created_at || m.CreatedAt,
      State: m.is_read ? "seen" : "delivered",
      type: m.type,
      refType: m.ref_type,
      refID: m.ref_id,
      ref_type: m.ref_type,
      ref_id: m.ref_id,
      reply_to_id: m.reply_to_id,
      reply_to_message: m.reply_to_message,
      reactions_data: m.reactions_data,
    }));
  }, []);

  const syncMsgsFromDirectRows = React.useCallback(
    (rows: any[]) => {
      const formatted = formatDirectMessages(rows);
      setMsgs((prev) => {
        const prevKey = prev
          .map((m: any) => `${m.ID ?? ""}:${m.CreatedAt ?? ""}`)
          .join("|");
        const nextKey = formatted
          .map((m: any) => `${m.ID ?? ""}:${m.CreatedAt ?? ""}`)
          .join("|");
        return prevKey === nextKey ? prev : formatted;
      });
    },
    [formatDirectMessages],
  );

  React.useEffect(() => {
    if (isDirectMessage && otherUserId) {
      syncMsgsFromDirectRows(directMessages);
    }
  }, [isDirectMessage, otherUserId, directMessages, syncMsgsFromDirectRows]);

  const refreshRentConversationMessages = React.useCallback(async () => {
    if (!conversationID || isDirectMessage) return;
    try {
      const cached = queryClient.getQueryData<{
        messages: unknown[];
        nextCursor: number | null;
      }>(rentConversationMessagesKey(conversationID));
      if (cached?.messages?.length) {
        setMsgs(cached.messages as any[]);
        setNextCursor(cached.nextCursor);
      }

      const { messages: arr, nextCursor: cursor } =
        await fetchRentConversationThread(conversationID);
      queryClient.setQueryData(rentConversationMessagesKey(conversationID), {
        messages: arr,
        nextCursor: cursor,
      });
      setMsgs(arr as any[]);
      setNextCursor(cursor);

      const toSee = (arr as any[])
        .filter(
          (m: any) =>
            String(m.receiverID || m.ReceiverID) === String(user?.ID),
        )
        .map((m: any) => m.ID);
      if (toSee.length > 0) {
        void api
          .post("/messages/state", {
            conversationID,
            messageIDs: toSee,
            state: "seen",
          })
          .catch(() => {});
      }
    } catch {}
  }, [conversationID, isDirectMessage, user?.ID, queryClient]);

  // Show cached thread immediately; refresh in background (no await blocking UI).
  useFocusEffect(
    React.useCallback(() => {
      if (isDirectMessage && otherUserId) {
        void markDirectThreadRead(otherUserId).catch(() => {});
        void queryClient.invalidateQueries({
          queryKey: ["directMessageConversations", user?.ID],
        });
        void refetchDirectMessages();
        return;
      }
      if (conversationID && !isDirectMessage) {
        const cached = queryClient.getQueryData<{
          messages: unknown[];
          nextCursor: number | null;
        }>(rentConversationMessagesKey(conversationID));
        if (cached?.messages?.length) {
          setMsgs(cached.messages as any[]);
          setNextCursor(cached.nextCursor);
        }
        void refreshRentConversationMessages();
      }
    }, [
      isDirectMessage,
      otherUserId,
      conversationID,
      refetchDirectMessages,
      refreshRentConversationMessages,
      queryClient,
      user?.ID,
    ]),
  );

  const loadOlder = React.useCallback(async () => {
    if (!nextCursor) return;
    try {
      const res = await api.get(
        `/messages?conversationID=${conversationID}&cursor=${nextCursor}&limit=30`,
      );
      const arr = res.data?.messages || [];
      if (arr.length === 0) {
        setNextCursor(null);
        return;
      }
      setMsgs((prev) => [...arr, ...prev]);
      setNextCursor(res.data?.nextCursor || null);
    } catch {}
  }, [conversationID, nextCursor]);

  useEffect(() => {
    if (!isFocused) return;
    const id = setInterval(() => {
      if (messagingWs.isConnected()) return;
      if (isDirectMessage && otherUserId) {
        refetchDirectMessages();
      } else if (conversationID) {
        api
          .get(`/messages?conversationID=${conversationID}&limit=30`)
          .then((res) => {
            setMsgs(res.data?.messages || []);
            setNextCursor(res.data?.nextCursor || null);
          })
          .catch(() => {});
      }
    }, 7000);
    return () => clearInterval(id);
  }, [
    isFocused,
    isDirectMessage,
    otherUserId,
    conversationID,
    refetchDirectMessages,
  ]);

  React.useEffect(() => {
    const typingHandler = (payload: any) => {
      if (!payload) return;
      const senderID = Number(payload.senderID || payload.userID || 0);
      if (!senderID || senderID === Number(user?.ID || 0)) return;
      if (
        !isDirectMessage &&
        conversationID &&
        Number(payload.conversationID || 0) !== Number(conversationID)
      )
        return;
      if (isDirectMessage && otherUserId && senderID !== Number(otherUserId))
        return;
      setIsTyping(Boolean(payload.isTyping !== false));
      if (remoteTypingTimeoutRef.current)
        clearTimeout(remoteTypingTimeoutRef.current);
      if (payload.isTyping !== false) {
        remoteTypingTimeoutRef.current = setTimeout(
          () => setIsTyping(false),
          3000,
        );
      }
    };

    if (user?.accessToken) messagingWs.connect(user.accessToken);

    const off = messagingWs.on((evt) => {
      const type = evt?.type;

      if (type === "dm:new_message") {
        const m = evt?.data;
        if (!m) return;
        const senderID = Number(m.sender_id ?? m.senderID ?? 0);
        const receiverID = Number(m.receiver_id ?? m.receiverID ?? 0);
        if (isDirectMessage && otherUserId) {
          const me = Number(user?.ID || 0);
          const other = Number(otherUserId);
          if (
            !(
              (senderID === me && receiverID === other) ||
              (senderID === other && receiverID === me)
            )
          )
            return;
        }
        const incoming = {
          ID: Number(m.id ?? m.ID ?? Date.now()),
          senderID,
          receiverID,
          text: String(m.content ?? m.text ?? ""),
          CreatedAt: m.created_at ?? m.CreatedAt ?? new Date().toISOString(),
          State: m.state ?? m.State ?? "delivered",
          type: m.type,
          refType: m.ref_type,
          refID: m.ref_id,
          ref_type: m.ref_type,
          ref_id: m.ref_id,
          reply_to_id: m.reply_to_id,
          reply_to_message: m.reply_to,
          reactions_data: m.reactions_data,
        } as any;
        setMsgs((prev) => {
          const me = Number(user?.ID || 0);
          if (incoming.senderID === me) {
            const now = Date.now();
            const idx = [...prev].reverse().findIndex((x: any) => {
              const created = new Date(x.CreatedAt || 0).getTime();
              return (
                now - created < 10_000 &&
                Number(x.senderID) === me &&
                Number(x.receiverID) === Number(incoming.receiverID) &&
                String(x.text || "") === String(incoming.text || "")
              );
            });
            if (idx >= 0) {
              const realIdx = prev.length - 1 - idx;
              const next = prev.slice();
              next[realIdx] = incoming;
              return next;
            }
          }
          if (prev.some((x: any) => String(x.ID) === String(incoming.ID)))
            return prev;
          return [...prev, incoming];
        });
      }

      if (type === "conv:new_message") {
        const m = evt?.data;
        if (!m) return;
        const convId = Number(m.conversationID ?? m.ConversationID ?? 0);
        if (!conversationID || convId !== Number(conversationID)) return;
        const incoming = {
          ID: Number(m.ID ?? m.id ?? Date.now()),
          ConversationID: convId,
          senderID: Number(m.senderID ?? m.SenderID ?? 0),
          receiverID: Number(m.receiverID ?? m.ReceiverID ?? 0),
          text: String(m.text ?? m.Text ?? ""),
          CreatedAt: m.CreatedAt ?? m.createdAt ?? new Date().toISOString(),
          State: m.State ?? m.state ?? "delivered",
          type: m.type,
        } as any;
        setMsgs((prev) => {
          if (prev.some((x: any) => String(x.ID) === String(incoming.ID)))
            return prev;
          return [...prev, incoming];
        });
        const myID = Number(user?.ID || 0);
        if (myID && Number(incoming.receiverID) === myID) {
          api
            .post("/messages/state", {
              conversationID,
              messageIDs: [incoming.ID],
              state: "seen",
            })
            .catch(() => {});
        }
      }

      if (type === "conv:state") {
        const payload = evt?.data;
        const convId = Number(payload?.conversationID ?? 0);
        if (!conversationID || convId !== Number(conversationID)) return;
        const ids = Array.isArray(payload?.messageIDs)
          ? payload.messageIDs.map((x: any) => Number(x))
          : [];
        const state = String(payload?.state || "");
        if (!ids.length || (state !== "delivered" && state !== "seen")) return;
        setMsgs((prev) =>
          prev.map((m: any) => {
            const id = Number(m.ID ?? m.id ?? 0);
            if (!ids.includes(id)) return m;
            return { ...m, State: state, state };
          }),
        );
      }

      if (type === "typing") typingHandler(evt?.data);
    });

    return () => {
      off();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (remoteTypingTimeoutRef.current)
        clearTimeout(remoteTypingTimeoutRef.current);
    };
  }, [conversationID, isDirectMessage, otherUserId, user?.ID]);

  // ─── Render Data ───────────────────────────────────────────────────────────
  const baseMessages = [
    ...((msgs.length ? msgs : data?.messages || []) as any[]),
    ...optimisticCards,
  ] as any[];

  useEffect(() => {
    if (!optimisticCards.length || !user?.ID) return;
    const real = (msgs.length ? msgs : data?.messages || []) as any[];
    if (!real.length) return;
    const sentSaleCards = new Set<number>();
    for (const m of real) {
      const sender = Number(m.senderID ?? m.sender_id ?? 0);
      const isCard = (m.type || "").toString() === "property_card";
      const refType = String(m.refType ?? m.ref_type ?? "");
      const refID = Number(m.refID ?? m.ref_id ?? 0);
      if (
        sender === Number(user.ID) &&
        isCard &&
        refType === "property_sale" &&
        refID > 0
      ) {
        sentSaleCards.add(refID);
      }
    }
    if (!sentSaleCards.size) return;
    setOptimisticCards((prev) =>
      prev.filter((m) => !sentSaleCards.has(Number(m.refID ?? m.ref_id ?? 0))),
    );
    setToast({
      message: t("dm.toastMessageSent", { defaultValue: "Message sent" }),
      type: "success",
      duration: 1200,
    });
  }, [msgs, data?.messages, optimisticCards.length, user?.ID]);

  const getMessageKey = useCallback((m: any, idx: number) => {
    const id = m?.id ?? m?.ID;
    const created = m?.createdAt ?? m?.CreatedAt ?? m?.created_at ?? "";
    if (id != null && String(id) !== "")
      return `${String(id)}-${String(created)}`;
    return `idx-${idx}-${String(created)}`;
  }, []);

  const renderData = baseMessages
    .slice()
    .sort((a: any, b: any) => {
      const ta = new Date(a.createdAt || a.CreatedAt || 0).getTime();
      const tb = new Date(b.createdAt || b.CreatedAt || 0).getTime();
      return ta - tb;
    })
    .filter((m: any, idx: number, arr: any[]) => {
      const id = m?.id ?? m?.ID;
      if (id == null) return true;
      for (let j = arr.length - 1; j > idx; j--) {
        if (String(arr[j]?.id ?? arr[j]?.ID) === String(id)) return false;
      }
      return true;
    });

  // ─── Sub-renders ───────────────────────────────────────────────────────────
  const renderReplyPreview = (message: MessageType) => {
    const replyMsg = message.reply_to_message;
    if (!replyMsg && !message.reply_to_id) return null;
    if (!replyMsg) return null;
    const isMine = String(message.senderID) === String(user?.ID);
    return (
      <View style={[styles.replyPreview, isMine && styles.replyPreviewMine]}>
        <View style={[styles.replyLine, isMine && styles.replyLineMine]} />
        <View style={styles.replyContent}>
          <Text
            style={[styles.replyName, isMine && styles.replyNameMine]}
            numberOfLines={1}
          >
            {replyMsg.senderID === user?.ID
              ? t("dm.you", { defaultValue: "You" })
              : recipientName}
          </Text>
          <Text
            style={[styles.replyText, isMine && styles.replyTextMine]}
            numberOfLines={1}
          >
            {replyMsg.text || replyMsg.Content || ""}
          </Text>
        </View>
      </View>
    );
  };

  const renderReactions = (message: MessageType, isMine: boolean) => {
    if (!message.reactions_data || message.reactions_data.length === 0)
      return null;
    return (
      <View style={[styles.reactionsRow, isMine && styles.reactionsRowMine]}>
        {message.reactions_data.map((reaction, idx) => {
          const userReacted = reaction.users.includes(user?.ID || 0);
          return (
            <TouchableOpacity
              key={`${reaction.emoji}-${idx}`}
              style={[
                styles.reactionPill,
                userReacted && styles.reactionPillActive,
              ]}
              onPress={() => handleReaction(reaction.emoji)}
              activeOpacity={0.75}
            >
              <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
              {reaction.count > 1 && (
                <Text
                  style={[
                    styles.reactionCount,
                    userReacted && styles.reactionCountActive,
                  ]}
                >
                  {reaction.count}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // ─── Message Item ──────────────────────────────────────────────────────────
  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const raw = String(item.text || item.Text || item.Content || "");
    const payload = tryParsePropertyCardPayload(raw);
    const isPropertySaleRef =
      String(item.refType ?? item.ref_type ?? "") === "property_sale";
    if (item.type === "property_card" || (payload && isPropertySaleRef)) {
      const saleId = Number(
        payload?.property_id || item.refID || item.ref_id || 0,
      );
      if (!payload && !saleId) return null;

      const isMine =
        String(item.author?.id || item.senderID) === String(user?.ID);
      const time = new Date(item.createdAt || item.CreatedAt || Date.now());
      const prev = renderData[index - 1];
      const showTimestamp =
        !prev ||
        time.getTime() -
          new Date(prev.createdAt || prev.CreatedAt || 0).getTime() >
          10 * 60 * 1000;

      const title =
        payload?.title ||
        t("dm.propertyCardTitleFallback", { defaultValue: "Property" });
      const price = formatListingPrice(
        payload?.listing_price,
        payload?.currency,
      );
      const thumb = payload?.image_url;

      return (
        <>
          {showTimestamp && (
            <View style={styles.timestampRow}>
              <Text style={styles.timestampText}>
                {time.toLocaleDateString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}{" "}
                {time.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          )}
          <Pressable
            onLongPress={() => handleLongPress(item)}
            delayLongPress={300}
          >
            <View
              style={[
                styles.msgRow,
                isMine ? styles.msgRowMine : styles.msgRowTheirs,
              ]}
            >
              {!isMine &&
                (recipientAvatar ? (
                  <Image
                    source={{ uri: recipientAvatar }}
                    style={styles.msgAvatar}
                  />
                ) : (
                  <View style={[styles.msgAvatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>
                      {recipientName?.[0]?.toUpperCase() ||
                        t("dm.avatarFallback", { defaultValue: "U" })}
                    </Text>
                  </View>
                ))}

              <View
                style={isMine ? styles.msgGroupMine : styles.msgGroupTheirs}
              >
                <View
                  style={[
                    styles.bubble,
                    isMine ? styles.bubbleMine : styles.bubbleTheirs,
                    styles.propertyCardBubble,
                  ]}
                >
                  {payload?.caption ? (
                    <Text
                      style={
                        isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs
                      }
                    >
                      {payload.caption}
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      if (saleId <= 0) return;
                      const refType = String(
                        item.refType ?? item.ref_type ?? "",
                      );
                      const kind =
                        payload?.property_type ||
                        (refType === "property_sale" ? "sale" : "rent");
                      if (kind === "sale" || refType === "property_sale") {
                        nav.navigate(
                          "PropertySaleDetails" as never,
                          {
                            propertyId: saleId,
                          } as never,
                        );
                        return;
                      }
                      nav.navigate(
                        "PropertyDetails" as never,
                        {
                          propertyID: saleId,
                        } as never,
                      );
                    }}
                    style={styles.inlinePropertyCard}
                  >
                    {thumb ? (
                      <Image
                        source={{ uri: thumb }}
                        style={styles.inlinePropertyImage}
                      />
                    ) : (
                      <View
                        style={[
                          styles.inlinePropertyImage,
                          { backgroundColor: TK.surface3 },
                        ]}
                      />
                    )}
                    <View style={styles.inlinePropertyInfo}>
                      <Text
                        style={styles.inlinePropertyTitle}
                        numberOfLines={2}
                      >
                        {title}
                      </Text>
                      <Text style={styles.inlinePropertyPrice}>{price}</Text>
                      <Text style={styles.inlinePropertyLink}>
                        View listing →
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {isMine ? (
                    <View style={styles.tailRight} />
                  ) : (
                    <View style={styles.tailLeft} />
                  )}
                </View>
                <View style={[styles.msgMeta, isMine && styles.msgMetaMine]}>
                  <Text style={styles.msgTime}>
                    {time.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>

              {isMine &&
                (myAvatar ? (
                  <Image source={{ uri: myAvatar }} style={styles.msgAvatar} />
                ) : (
                  <View
                    style={[
                      styles.msgAvatar,
                      styles.avatarFallback,
                      styles.avatarMine,
                    ]}
                  >
                    <Text style={styles.avatarInitial}>
                      {(
                        user?.firstName?.[0] ||
                        user?.email?.[0] ||
                        "Y"
                      ).toUpperCase()}
                    </Text>
                  </View>
                ))}
            </View>
          </Pressable>
        </>
      );
    }

    const isMine =
      String(item.author?.id || item.senderID) === String(user?.ID);
    const text = item.text || item.Text || item.Content || "";
    const time = new Date(item.createdAt || item.CreatedAt || Date.now());
    const state = (item.state || item.State || "").toString();

    // Show timestamp if first message or >10min gap from previous
    const prev = renderData[index - 1];
    const showTimestamp =
      !prev ||
      time.getTime() -
        new Date(prev.createdAt || prev.CreatedAt || 0).getTime() >
        10 * 60 * 1000;

    return (
      <>
        {showTimestamp && (
          <View style={styles.timestampRow}>
            <Text style={styles.timestampText}>
              {time.toLocaleDateString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}{" "}
              {time.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
          </View>
        )}
        <Pressable
          onLongPress={() => handleLongPress(item)}
          delayLongPress={300}
        >
          <View
            style={[
              styles.msgRow,
              isMine ? styles.msgRowMine : styles.msgRowTheirs,
            ]}
          >
            {/* Avatar — theirs only */}
            {!isMine &&
              (isMeskenyTeam ? (
                <MeskenyTeamAvatar size={32} showBadge />
              ) : recipientAvatar ? (
                <Image
                  source={{ uri: recipientAvatar }}
                  style={styles.msgAvatar}
                />
              ) : (
                <View style={[styles.msgAvatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>
                    {displayRecipientName?.[0]?.toUpperCase() ||
                      t("dm.avatarFallback", { defaultValue: "U" })}
                  </Text>
                </View>
              ))}

            {/* Bubble + reactions */}
            <View style={isMine ? styles.msgGroupMine : styles.msgGroupTheirs}>
              <View
                style={[
                  styles.bubble,
                  isMine ? styles.bubbleMine : styles.bubbleTheirs,
                ]}
              >
                {renderReplyPreview(item)}
                <Text
                  style={
                    isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs
                  }
                >
                  {text}
                </Text>
                {/* Tail indicators */}
                {isMine ? (
                  <View style={styles.tailRight} />
                ) : (
                  <View style={styles.tailLeft} />
                )}
              </View>

              {/* Time + state row */}
              <View style={[styles.msgMeta, isMine && styles.msgMetaMine]}>
                <Text style={styles.msgTime}>
                  {time.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Text>
                {isMine && (
                  <View style={styles.tickContainer}>
                    {state === "seen" ? (
                      <MaterialIcons
                        name="done-all"
                        size={12}
                        color={TK.accent}
                      />
                    ) : state === "delivered" ? (
                      <MaterialIcons
                        name="done-all"
                        size={12}
                        color={TK.textFaint}
                      />
                    ) : (
                      <MaterialIcons
                        name="done"
                        size={12}
                        color={TK.textFaint}
                      />
                    )}
                  </View>
                )}
              </View>

              {renderReactions(item, isMine)}
            </View>

            {/* My avatar */}
            {isMine &&
              (myAvatar ? (
                <Image source={{ uri: myAvatar }} style={styles.msgAvatar} />
              ) : (
                <View
                  style={[
                    styles.msgAvatar,
                    styles.avatarFallback,
                    styles.avatarMine,
                  ]}
                >
                  <Text style={styles.avatarInitial}>
                    {(
                      user?.firstName?.[0] ||
                      user?.email?.[0] ||
                      "Y"
                    ).toUpperCase()}
                  </Text>
                </View>
              ))}
          </View>
        </Pressable>
      </>
    );
  };

  // ─── JSX ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => nav.goBack()}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="arrow-back-ios" size={20} color={TK.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerCenter} activeOpacity={0.75}>
          {isMeskenyTeam ? (
            <MeskenyTeamAvatar size={36} showBadge badgeSize="md" />
          ) : recipientAvatar ? (
            <Image
              source={{ uri: recipientAvatar }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitialMd}>
                {displayRecipientName?.[0]?.toUpperCase() ||
                  t("dm.avatarFallback", { defaultValue: "U" })}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            {isMeskenyTeam ? (
              <MeskenyTeamNameRow
                nameStyle={styles.headerName}
                badgeStyle={undefined}
              />
            ) : (
              <Text style={styles.headerName} numberOfLines={1}>
                {displayRecipientName}
              </Text>
            )}
            {isTyping ? (
              <Text style={styles.headerStatus}>
                {t("dm.typing", { defaultValue: "typing…" })}
              </Text>
            ) : isMeskenyTeam ? (
              <Text style={styles.headerStatus}>
                {t("messages.meskenyTeamSubtitle", "Official Meskeny support")}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setShowMenu(!showMenu)}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <MaterialIcons name="more-horiz" size={22} color={TK.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Property Card ── */}
      {(thumb || title) && (
        <TouchableOpacity
          style={styles.propCard}
          onPress={() =>
            propertyID &&
            nav.navigate(
              "PropertySaleDetails" as never,
              { propertyId: propertyID } as never,
            )
          }
          activeOpacity={0.8}
        >
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.propImage} />
          ) : (
            <View
              style={[styles.propImage, { backgroundColor: TK.surface3 }]}
            />
          )}
          <View style={styles.propInfo}>
            <Text style={styles.propTitle} numberOfLines={1}>
              {title ||
                t("dm.propertyListingFallback", {
                  defaultValue: "Property listing",
                })}
            </Text>
            {dateRange ? (
              <Text style={styles.propDates}>{dateRange}</Text>
            ) : null}
            <View style={styles.propFooter}>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{statusPill}</Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={16}
                color={TK.textFaint}
              />
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Messages + Input ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          ref={(r) => {
            (listRef as any).current = r;
          }}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={renderData}
          keyExtractor={getMessageKey}
          renderItem={renderMessage}
          onEndReachedThreshold={0.05}
          onEndReached={loadOlder}
          onContentSizeChange={() => {
            try {
              (listRef as any).current?.scrollToEnd({ animated: true });
            } catch {}
          }}
        />

        {/* Typing indicator (bubble style) */}
        {isTyping && (
          <View style={styles.typingRow}>
            {recipientAvatar ? (
              <Image
                source={{ uri: recipientAvatar }}
                style={styles.msgAvatar}
              />
            ) : (
              <View style={[styles.msgAvatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {recipientName?.[0]?.toUpperCase() ||
                    t("dm.avatarFallback", { defaultValue: "U" })}
                </Text>
              </View>
            )}
            <TypingDots />
          </View>
        )}

        {/* Reply-to bar */}
        {replyingTo && (
          <View style={styles.replyBar}>
            <MaterialIcons name="reply" size={16} color={TK.accent} />
            <View style={styles.replyBarContent}>
              <Text style={styles.replyBarLabel}>
                Replying to{" "}
                <Text style={{ color: TK.accent }}>
                  {replyingTo.senderID === user?.ID
                    ? "yourself"
                    : recipientName}
                </Text>
              </Text>
              <Text style={styles.replyBarText} numberOfLines={1}>
                {replyingTo.text || replyingTo.Content || ""}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setReplyingTo(null)}
              style={styles.replyBarClose}
            >
              <MaterialIcons name="close" size={18} color={TK.textSub} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Attachment Tray ── */}
        {showAttachTray && (
          <Animated.View
            style={[
              styles.attachTray,
              {
                opacity: attachTrayOpacity,
                transform: [{ translateY: attachTrayY }],
              },
            ]}
          >
            {[
              {
                icon: "photo-camera",
                label: t("dm.attachCamera", { defaultValue: "Camera" }),
                onPress: () => {
                  closeAttachTray();
                  Alert.alert(
                    t("dm.attachCamera", { defaultValue: "Camera" }),
                    t("dm.attachCameraStub", {
                      defaultValue: "Open camera picker here",
                    }),
                  );
                },
              },
              {
                icon: "photo-library",
                label: t("dm.attachGallery", { defaultValue: "Gallery" }),
                onPress: () => {
                  closeAttachTray();
                  Alert.alert(
                    t("dm.attachGallery", { defaultValue: "Gallery" }),
                    t("dm.attachGalleryStub", {
                      defaultValue: "Open image library here",
                    }),
                  );
                },
              },
              {
                icon: "insert-drive-file",
                label: t("dm.attachFile", { defaultValue: "File" }),
                onPress: () => {
                  closeAttachTray();
                  Alert.alert(
                    t("dm.attachFile", { defaultValue: "File" }),
                    t("dm.attachFileStub", {
                      defaultValue: "Open file picker here",
                    }),
                  );
                },
              },
              {
                icon: "location-on",
                label: t("dm.attachLocation", { defaultValue: "Location" }),
                onPress: () => {
                  closeAttachTray();
                  Alert.alert(
                    t("dm.attachLocation", { defaultValue: "Location" }),
                    t("dm.attachLocationStub", {
                      defaultValue: "Share location here",
                    }),
                  );
                },
              },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.attachItem}
                onPress={item.onPress}
                activeOpacity={0.75}
              >
                <View style={styles.attachIconWrap}>
                  <MaterialIcons
                    name={item.icon as any}
                    size={22}
                    color={TK.accent}
                  />
                </View>
                <Text style={styles.attachLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* ── Input Bar ── */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.inputField}
              placeholder={t("dm.messagePlaceholder", {
                defaultValue: "Message…",
              })}
              placeholderTextColor={TK.textFaint}
              value={input}
              onChangeText={onInputChange}
              multiline
              maxLength={5000}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              input.trim() ? styles.sendBtnActive : styles.sendBtnInactive,
            ]}
            onPress={() => {
              if (input.trim()) {
                onSendPress(input);
                setInput("");
              }
            }}
            disabled={!input.trim()}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="send"
              size={18}
              color={input.trim() ? "#FFFFFF" : TK.textFaint}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Context Menu ── */}
      {showMenu && (
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setShowMenu(false)}
        >
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.menuSheet}>
            {[
              {
                icon: "flag" as const,
                label: t("dm.menuReportConversation", {
                  defaultValue: "Report conversation",
                }),
                onPress: () => setShowMenu(false),
                danger: false,
              },
              ...(!isMeskenyTeam
                ? [
                    {
                      icon: "block" as const,
                      label: t("dm.menuBlockUser", {
                        defaultValue: "Block user",
                      }),
                      onPress: handleBlockUser,
                      danger: false,
                    },
                  ]
                : []),
              {
                icon: "delete-outline" as const,
                label: t("dm.menuDeleteConversation", {
                  defaultValue: "Delete conversation",
                }),
                onPress: handleDeleteConversation,
                danger: true,
              },
            ].map((item, i, arr) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.menuIconWrap,
                      item.danger && styles.menuIconDanger,
                    ]}
                  >
                    <MaterialIcons
                      name={item.icon}
                      size={18}
                      color={item.danger ? "#FF453A" : TK.text}
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      item.danger && styles.menuLabelDanger,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
                {i < arr.length - 1 && <View style={styles.menuDivider} />}
              </React.Fragment>
            ))}
          </View>
        </Pressable>
      )}

      {/* ── Message Actions Modal ── */}
      {showMessageActions && selectedMessage && (
        <Modal
          visible
          transparent
          animationType="none"
          onRequestClose={closeMessageActions}
        >
          <Pressable
            style={styles.actionsOverlay}
            onPress={closeMessageActions}
          >
            {/* Blurred backdrop */}
            <Animated.View
              style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}
            >
              <BlurView
                intensity={60}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            {/* Floating highlighted bubble */}
            <View style={styles.floatingBubbleWrap} pointerEvents="none">
              <View
                style={[
                  styles.bubble,
                  styles.floatingBubble,
                  String(selectedMessage.senderID) === String(user?.ID)
                    ? styles.bubbleMine
                    : styles.bubbleTheirs,
                ]}
              >
                {renderReplyPreview(selectedMessage)}
                <Text
                  style={
                    String(selectedMessage.senderID) === String(user?.ID)
                      ? styles.bubbleTextMine
                      : styles.bubbleTextTheirs
                  }
                >
                  {selectedMessage.text || selectedMessage.Content || ""}
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Bottom sheet (outside Pressable so it doesn't close on tap) */}
          <Animated.View
            style={[
              styles.actionsSheet,
              { transform: [{ translateY: actionModalY }] },
            ]}
            pointerEvents="box-none"
          >
            {/* Drag handle */}
            <View style={styles.sheetHandle} />

            {/* Quick reactions */}
            <View style={styles.reactionsStrip}>
              {QUICK_REACTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.quickEmojiBtn}
                  onPress={() => handleReaction(emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.quickEmojiBtn}
                activeOpacity={0.7}
              >
                <MaterialIcons name="add" size={22} color={TK.textSub} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetDivider} />

            {/* Action rows */}
            {[
              {
                icon: "reply" as const,
                label: t("dm.actionReply", { defaultValue: "Reply" }),
                onPress: handleReply,
              },
              {
                icon: "content-copy" as const,
                label: t("dm.actionCopyText", { defaultValue: "Copy text" }),
                onPress: closeMessageActions,
              },
              {
                icon: "forward" as const,
                label: t("dm.actionForward", { defaultValue: "Forward" }),
                onPress: closeMessageActions,
              },
              {
                icon: "delete-outline" as const,
                label: t("dm.actionDelete", { defaultValue: "Delete" }),
                onPress: closeMessageActions,
                danger: true,
              },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.sheetAction}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.sheetActionIcon,
                    action.danger && styles.sheetActionIconDanger,
                  ]}
                >
                  <MaterialIcons
                    name={action.icon}
                    size={20}
                    color={action.danger ? "#FF453A" : TK.text}
                  />
                </View>
                <Text
                  style={[
                    styles.sheetActionLabel,
                    action.danger && styles.sheetActionLabelDanger,
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.sheetCancel}
              onPress={closeMessageActions}
              activeOpacity={0.8}
            >
              <Text style={styles.sheetCancelText}>
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Modal>
      )}

      {toast && (
        <View style={styles.toastWrap}>
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration || 1400}
            onHide={() => setToast(null)}
          />
        </View>
      )}
    </View>
  );
};

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TK.bg,
  },
  toastWrap: {
    ...StyleSheet.absoluteFillObject,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: Platform.OS === "ios" ? 54 : 16,
    paddingBottom: 10,
    backgroundColor: TK.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TK.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 4,
  },
  headerAvatar: {
    width: TK.avatarMD,
    height: TK.avatarMD,
    borderRadius: TK.avatarMD / 2,
    borderWidth: 1.5,
    borderColor: TK.accent,
  },
  headerName: {
    fontSize: 15,
    fontWeight: "700",
    color: TK.text,
    letterSpacing: -0.2,
  },
  headerStatus: {
    fontSize: 11,
    color: TK.textFaint,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },

  // ── Avatars ──────────────────────────────────────────────────────────────────
  avatarFallback: {
    backgroundColor: TK.surface3,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarMine: {
    backgroundColor: TK.accent,
  },
  avatarInitial: {
    color: TK.text,
    fontSize: 12,
    fontWeight: "700",
  },
  avatarInitialMd: {
    color: TK.text,
    fontSize: 15,
    fontWeight: "700",
  },
  avatarInitialLg: {
    color: TK.text,
    fontSize: 16,
    fontWeight: "700",
  },

  // ── Property Card ─────────────────────────────────────────────────────────────
  propCard: {
    flexDirection: "row",
    backgroundColor: TK.surface,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: TK.radius.card,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TK.border,
  },
  propImage: {
    width: 72,
    height: 72,
  },
  propInfo: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "space-between",
  },
  propTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: TK.text,
    letterSpacing: -0.1,
  },
  propDates: {
    fontSize: 11,
    color: TK.textSub,
    marginTop: 2,
  },
  propFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: TK.surface3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: TK.accent,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: TK.text,
  },

  // ── List ──────────────────────────────────────────────────────────────────────
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },

  // ── Timestamp ─────────────────────────────────────────────────────────────────
  timestampRow: {
    alignItems: "center",
    marginVertical: 12,
  },
  timestampText: {
    fontSize: 11,
    color: TK.textFaint,
    backgroundColor: TK.surface2,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
  },

  // ── Message Row ───────────────────────────────────────────────────────────────
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  msgRowMine: {
    flexDirection: "row-reverse",
  },
  msgRowTheirs: {
    flexDirection: "row",
  },
  msgAvatar: {
    width: TK.avatarSM,
    height: TK.avatarSM,
    borderRadius: TK.avatarSM / 2,
    marginHorizontal: 6,
    flexShrink: 0,
  },

  msgGroupMine: {
    alignItems: "flex-end",
    maxWidth: SCREEN_WIDTH * 0.68,
  },
  msgGroupTheirs: {
    alignItems: "flex-start",
    maxWidth: SCREEN_WIDTH * 0.68,
  },

  // ── Bubbles ───────────────────────────────────────────────────────────────────
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: TK.radius.bubble,
  },
  bubbleMine: {
    backgroundColor: TK.bubbleMine,
    borderBottomRightRadius: TK.radius.bubbleTail,
  },
  bubbleTheirs: {
    backgroundColor: TK.bubbleTheirs,
    borderBottomLeftRadius: TK.radius.bubbleTail,
  },
  bubbleTextMine: {
    fontSize: 15,
    lineHeight: 21,
    color: TK.bubbleTextMine,
    fontWeight: "400",
  },
  bubbleTextTheirs: {
    fontSize: 15,
    lineHeight: 21,
    color: TK.bubbleTextTheirs,
    fontWeight: "400",
  },
  // Decorative tail accents (optional visual flourish)
  tailRight: {
    position: "absolute",
    bottom: -1,
    right: -4,
    width: 10,
    height: 10,
    backgroundColor: TK.bubbleMine,
    borderRadius: 2,
    transform: [{ rotate: "45deg" }],
  },
  tailLeft: {
    position: "absolute",
    bottom: -1,
    left: -4,
    width: 10,
    height: 10,
    backgroundColor: TK.bubbleTheirs,
    borderRadius: 2,
    transform: [{ rotate: "45deg" }],
  },
  propertyCardBubble: {
    paddingBottom: 8,
  },
  inlinePropertyCard: {
    flexDirection: "row",
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "stretch",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },
  inlinePropertyImage: {
    width: 88,
    height: 88,
    backgroundColor: "#EAEAEA",
  },
  inlinePropertyInfo: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "center",
  },
  inlinePropertyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 4,
  },
  inlinePropertyPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: theme["color-temporary-primary"],
    marginBottom: 4,
  },
  inlinePropertyLink: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },

  // ── Message meta ──────────────────────────────────────────────────────────────
  msgMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    gap: 4,
  },
  msgMetaMine: {
    flexDirection: "row-reverse",
  },
  msgTime: {
    fontSize: 10,
    color: TK.textFaint,
  },
  tickContainer: {
    marginLeft: 2,
  },

  // ── Reply Preview ─────────────────────────────────────────────────────────────
  replyPreview: {
    flexDirection: "row",
    marginBottom: 8,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.15)",
    paddingVertical: 5,
    paddingRight: 8,
  },
  replyPreviewMine: {
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  replyLine: {
    width: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginHorizontal: 6,
    borderRadius: 2,
  },
  replyLineMine: {
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  replyContent: {
    flex: 1,
  },
  replyName: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    marginBottom: 1,
  },
  replyNameMine: {
    color: "rgba(255,255,255,0.8)",
  },
  replyText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },
  replyTextMine: {
    color: "rgba(255,255,255,0.65)",
  },

  // ── Reactions ─────────────────────────────────────────────────────────────────
  reactionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    gap: 4,
  },
  reactionsRowMine: {
    justifyContent: "flex-end",
  },
  reactionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: TK.surface2,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: TK.border,
  },
  reactionPillActive: {
    backgroundColor: TK.accentSoft,
    borderColor: TK.accent,
  },
  reactionEmoji: {
    fontSize: 13,
  },
  reactionCount: {
    fontSize: 10,
    fontWeight: "700",
    color: TK.textSub,
    marginLeft: 3,
  },
  reactionCountActive: {
    color: TK.accent,
  },

  // ── Typing ────────────────────────────────────────────────────────────────────
  typingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: TK.bubbleTheirs,
    borderRadius: TK.radius.bubble,
    borderBottomLeftRadius: TK.radius.bubbleTail,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 5,
  },
  typingDotAnim: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#BBBBBB",
  },

  // ── Reply Bar ─────────────────────────────────────────────────────────────────
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: TK.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TK.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  replyBarContent: {
    flex: 1,
  },
  replyBarLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: TK.textSub,
  },
  replyBarText: {
    fontSize: 12,
    color: TK.textFaint,
    marginTop: 1,
  },
  replyBarClose: {
    padding: 4,
  },

  // ── Attach Tray ─────────────────────────────────────────────────────────────
  attachTray: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: TK.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TK.border,
  },
  attachItem: {
    alignItems: "center",
    gap: 6,
  },
  attachIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: TK.accentSoft,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(254,44,85,0.15)",
  },
  attachLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: TK.textSub,
  },

  // ── Input Bar ─────────────────────────────────────────────────────────────────
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 40 : 14,
    backgroundColor: TK.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TK.border,
    gap: 8,
  },
  inputIconBtn: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 19,
  },
  inputIconBtnActive: {
    backgroundColor: TK.accentSoft,
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: TK.surface2,
    borderRadius: TK.radius.input,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TK.border,
    paddingHorizontal: 14,
    paddingVertical: 0,
    minHeight: 44,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    color: TK.text,
    maxHeight: 100,
    paddingVertical: 11,
  },

  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnActive: {
    backgroundColor: TK.accent,
  },
  sendBtnInactive: {
    backgroundColor: TK.surface2,
  },

  // ── Context Menu ──────────────────────────────────────────────────────────────
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: Platform.OS === "ios" ? 110 : 72,
    paddingRight: 12,
  },
  menuSheet: {
    backgroundColor: TK.surface,
    borderRadius: 14,
    minWidth: 220,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TK.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: TK.surface3,
    justifyContent: "center",
    alignItems: "center",
  },
  menuIconDanger: {
    backgroundColor: "rgba(255,69,58,0.15)",
  },
  menuLabel: {
    fontSize: 14,
    color: TK.text,
    fontWeight: "500",
  },
  menuLabelDanger: {
    color: "#FF453A",
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: TK.border,
    marginHorizontal: 16,
  },

  // ── Actions Sheet ─────────────────────────────────────────────────────────────
  actionsOverlay: {
    flex: 1,
  },
  floatingBubbleWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 48,
    paddingBottom: 280,
  },
  floatingBubble: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  actionsSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: TK.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: TK.surface3,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  reactionsStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 4,
  },
  quickEmojiBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: TK.surface2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TK.border,
  },
  quickEmoji: {
    fontSize: 24,
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: TK.border,
    marginBottom: 8,
  },
  sheetAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  sheetActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: TK.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetActionIconDanger: {
    backgroundColor: "rgba(255,69,58,0.12)",
  },
  sheetActionLabel: {
    fontSize: 15,
    color: TK.text,
    fontWeight: "500",
  },
  sheetActionLabelDanger: {
    color: "#FF3B30",
  },
  sheetCancel: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: TK.surface2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: TK.text,
  },
});

export default DirectMessageScreen;
