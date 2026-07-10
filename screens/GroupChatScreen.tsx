// import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
// import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ScrollView, Animated, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Alert, Clipboard } from 'react-native';
// import LottieView from 'lottie-react-native';
// import { Text } from '@ui-kitten/components';
// import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
// import { useGroupMessages, useSendMessage, useTyping } from '../hooks/queries/useChat';
// import { useUser } from '../hooks/useUser';
// import { useWebSocket } from '../hooks/useWebSocket';
// import { ArrowLeft, PaperPlaneTilt, Smiley, Heart, ShareNetwork, Eye, DotsThreeVertical, SignOut, UserMinus, CheckCircle, Warning, LockKey, ShieldCheck, Check, Checks } from 'phosphor-react-native';
// import axios from 'axios';
// import { endpoints } from '../constants';
// import { useMyGroups, useGroupMembers } from '../hooks/queries/useExperienceInvites';
// import { BottomSheet } from '../components/BottomSheet';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useRegisterPushToken } from '../hooks/useRegisterPushToken';

// const COLORS = ["#FF5A5F", "#00A699", "#007A87", "#FC642D", "#484848", "#767676", "#8CE071", "#FFB400", "#7B0051", "#00D1C1"];

// export default function GroupChatScreen() {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const { groupId, title } = route.params as { groupId: number; title?: string };
//   const { user } = useUser();
//   const { data: messages = [], isLoading: messagesLoading, error: messagesError, refetch: refetchMessages } = useGroupMessages(groupId);
//   const sendMessage = useSendMessage(groupId);
//   const { typing /*, touch*/ } = useTyping(groupId);
  
//   // WebSocket for real-time updates
//   const { lastMessage, isConnected, sendTyping, sendReadReceipt, sendMessage: wsSend } = useWebSocket(groupId, true, user?.accessToken);
  
//   // Backfill on WS connect or screen focus
//   useFocusEffect(
//     useCallback(() => {
//       if (isConnected) {
//         try { refetchMessages(); } catch {}
//       }
//       return () => {};
//     }, [isConnected, refetchMessages])
//   );

//   // Safety backfill while screen is focused: poll briefly to catch missed WS events
//   useFocusEffect(
//     useCallback(() => {
//       let stopped = false;
//       const tick = async () => {
//         if (stopped) return;
//         try { await refetchMessages(); } catch {}
//       };
//       const interval = setInterval(tick, 5000);
//       return () => { stopped = true; clearInterval(interval); };
//     }, [refetchMessages])
//   );

//   const [liveMessages, setLiveMessages] = useState<any[]>([]);
//   const [text, setText] = useState('');
//   const { data: myGroups = [] } = useMyGroups();
//   // Register for push notifications (store token in backend)
//   useRegisterPushToken(user?.ID);
//   const group = (myGroups || []).find((g: any) => (g.id || g.ID) === groupId) || ({} as any);
//   const { data: members = [] } = useGroupMembers(groupId);
//   const [readsVisible, setReadsVisible] = useState(false);
//   const [reads, setReads] = useState<any[]>([]);
//   const [readsLoading, setReadsLoading] = useState(false);
//   const [selectedMsgId, setSelectedMsgId] = useState<number | null>(null);
//   const [readCounts, setReadCounts] = useState<Record<string, number>>({});
//   const readSentSetRef = useRef<Set<string>>(new Set());
//   const [showQuitModal, setShowQuitModal] = useState(false);
//   const [showBlockModal, setShowBlockModal] = useState(false);
//   const [selectedUser, setSelectedUser] = useState<any>(null);
//   const [showGroupMenu, setShowGroupMenu] = useState(false);
//   const [showEmoji, setShowEmoji] = useState(false);
//   const [sendingMessage, setSendingMessage] = useState(false);
//   const [pendingMessages, setPendingMessages] = useState<any[]>([]);
//   const [messageError, setMessageError] = useState<string | null>(null);
//   const [replyingTo, setReplyingTo] = useState<any>(null);
//   const flatListRef = useRef<FlatList>(null);
//   const didInitialScrollRef = useRef(false);
//   const shouldAutoScrollRef = useRef(true);
//   const listLayoutRef = useRef({ height: 0, contentHeight: 0, offsetY: 0 });
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(50)).current;

//   const scrollToEndSafely = useCallback(() => {
//     try { flatListRef.current?.scrollToEnd({ animated: true }); } catch {}
//   }, []);

//   const handleListLayout = useCallback((e: any) => {
//     listLayoutRef.current.height = e?.nativeEvent?.layout?.height || 0;
//   }, []);

//   const handleContentSizeChange = useCallback((w: number, h: number) => {
//     listLayoutRef.current.contentHeight = h;
//     const nearBottom = (listLayoutRef.current.offsetY + listLayoutRef.current.height) >= (h - 60);
//     if (!didInitialScrollRef.current || (shouldAutoScrollRef.current && nearBottom)) {
//       scrollToEndSafely();
//       didInitialScrollRef.current = true;
//     }
//   }, [scrollToEndSafely]);

//   const handleListScroll = useCallback((e: any) => {
//     const y = e?.nativeEvent?.contentOffset?.y || 0;
//     listLayoutRef.current.offsetY = y;
//     const nearBottom = (y + listLayoutRef.current.height) >= (listLayoutRef.current.contentHeight - 60);
//     shouldAutoScrollRef.current = nearBottom;
//   }, []);

//   // Mark as read when opening this chat
//   useFocusEffect(
//     useCallback(() => {
//       const markRead = async () => {
//         try { 
//           // Store locally for backup
//           await AsyncStorage.setItem(`lastRead:${groupId}`, (new Date()).toISOString()); 
//         } catch (error) {
//           console.error('Failed to mark as read:', error);
//         }
//       };
//       markRead();
      
//       // Smooth entrance animation
//       Animated.parallel([
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 400,
//           useNativeDriver: true,
//         }),
//         Animated.timing(slideAnim, {
//           toValue: 0,
//           duration: 400,
//           useNativeDriver: true,
//         })
//       ]).start();

//       return () => {
//         fadeAnim.setValue(0);
//         slideAnim.setValue(50);
//       };
//     }, [groupId, fadeAnim, slideAnim])
//   );

//   const colorByUserId = useMemo(() => (uid: number) => {
//     return COLORS[uid % COLORS.length];
//   }, []);

//   const handleSend = useCallback(async () => {
//     const content = text.trim();
//     if (!content) return;
//     setMessageError(null);

//     // Optimistic pending message
//     const tempId = Date.now();
//     const now = new Date().toISOString();
//     const optimistic: any = {
//       id: `pending_${tempId}`,
//       senderID: user?.ID,
//       sender: { firstName: user?.firstName, lastName: user?.lastName },
//       content,
//       createdAt: now,
//       color: colorByUserId(user?.ID || 0),
//       isPending: true,
//     };
//     setPendingMessages((prev) => [...prev, optimistic]);
//     setText('');
//     setReplyingTo(null);
//     setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);

//     // Fire request with soft timeout; on success, remove pending; on fail, mark error
//     const execSend = async () => {
//       const color = colorByUserId(user?.ID || 0);
//       await sendMessage.mutateAsync({ content, color, ttlSec: 24 * 3600 });
//     };

//     const softTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('soft-timeout')), 8000));

//     try {
//       await Promise.race([execSend(), softTimeout]);
//       // success (or will arrive via WS soon) → remove pending
//       setPendingMessages((prev) => prev.filter((m) => m.id !== `pending_${tempId}`));
//     } catch (err) {
//       const isSoft = (err as any)?.message === 'soft-timeout';
//       if (isSoft) {
//         // Keep as pending; trigger a backfill shortly to reconcile
//         setPendingMessages((prev) => prev.map((m) => m.id === `pending_${tempId}` ? { ...m, isPending: true, sendError: false } : m));
//         setTimeout(() => { try { refetchMessages(); } catch {} }, 2000);
//       } else {
//         // Network/real failure → show retry
//         setPendingMessages((prev) => prev.map((m) => m.id === `pending_${tempId}` ? { ...m, isPending: false, sendError: true } : m));
//         setMessageError('Failed to send message. Tap retry.');
//       }
//     }
//   }, [text, user?.ID, user?.firstName, user?.lastName, colorByUserId, sendMessage, refetchMessages]);

//   const retryPending = useCallback(async (msg: any) => {
//     if (!msg?.content) return;
//     // mark as pending again
//     setPendingMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, isPending: true, sendError: false } : m));
//     try {
//       const color = colorByUserId(user?.ID || 0);
//       await sendMessage.mutateAsync({ content: msg.content, color, ttlSec: 24 * 3600 });
//       setPendingMessages((prev) => prev.filter((m) => m.id !== msg.id));
//     } catch (error) {
//       setPendingMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, isPending: false, sendError: true } : m));
//       setMessageError('Failed to send message. Please try again.');
//     }
//   }, [colorByUserId, user?.ID, sendMessage]);

//   // Generate invite code
//   const generateInviteCode = useCallback(async () => {
//     try {
//       const response = await axios.post(
//         `${endpoints.baseURL}/groups/${groupId}/invite-code`,
//         {},
//         { headers: { Authorization: `Bearer ${user?.accessToken}` } }
//       );
      
//       const code = response.data.code;
      
//       Alert.alert(
//         'Invite Code Generated',
//         `Share this code with others to join: ${code}`,
//         [
//           { text: 'Copy', onPress: () => {
//             Clipboard.setString(code);
//             Alert.alert('Copied!', 'Invite code copied to clipboard');
//           }},
//           { text: 'Done', style: 'cancel' }
//         ]
//       );
//     } catch (error) {
//       console.error('Failed to generate invite code:', error);
//       Alert.alert('Error', 'Failed to generate invite code. Please try again.');
//     }
//   }, [groupId, user?.accessToken]);

//   // Debounce typing
//   const lastTypingAtRef = useRef<number>(0);
//   const sendTypingDebounced = useCallback((name: string) => {
//     const now = Date.now();
//     if (now - lastTypingAtRef.current < 1200) return;
//     lastTypingAtRef.current = now;
//     try { sendTyping(name); } catch {}
//   }, [sendTyping]);

//   // Mark messages as read when visible
//   const markRead = useCallback(async (msgId: number) => {
//     try { await AsyncStorage.setItem(`lastRead:${groupId}`, (new Date()).toISOString()); } catch {}
//   }, [groupId]);

//   const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
//     try {
//       for (const v of viewableItems) {
//         if (!v?.isViewable) continue;
//         const item = v.item;
//         const msgId = item?.id || item?.ID;
//         const isMine = (item?.senderID || item?.SenderID) === user?.ID;
//         if (msgId && !isMine) {
//           const key = String(msgId);
//           if (!readSentSetRef.current.has(key)) {
//             readSentSetRef.current.add(key);
//             markRead(Number(msgId));
//             sendReadReceipt(Number(msgId));
//           }
//         }
//       }
//     } catch (error) {
//       console.error('Error in viewable items changed:', error);
//     }
//   }).current;

//   useEffect(() => {
//     return () => { readSentSetRef.current.clear(); };
//   }, []);

//   const viewabilityConfig = useMemo(() => ({ 
//     itemVisiblePercentThreshold: 50,
//     minimumViewTime: 500 
//   }), []);

//   const openReads = useCallback(async (msgId: number) => {
//     setSelectedMsgId(msgId);
//     setReadsVisible(true);
//     setReads([]);
//     setReadsLoading(true);
//     try {
//       const res = await axios.get(
//         `${endpoints.baseURL}/groups/${groupId}/messages/${msgId}/reads`,
//         { headers: { Authorization: `Bearer ${user?.accessToken}` } }
//       );
//       const list = res.data?.reads || [];
//       setReads(list);
//       setReadCounts((prev) => ({ ...prev, [String(msgId)]: list.length }));
//     } catch (error) {
//       console.error('Failed to fetch reads:', error);
//       setReads([]);
//     } finally {
//       setReadsLoading(false);
//     }
//   }, [groupId, user?.accessToken]);

//   const EMOJIS = useMemo(() => [
//     "😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😍","😘","😗","😙","😚","🙂","🤗","🤩","🤔","🤨","😐","😑","😶","🙄","😏","😣","😥","😮","🤐","😯","😪","😫","🥱","😴","😌","😛","😜","😝","🤤","😒","😓","😔","😕","🙃","🫠","🫡","🫢","🫣","😲","☹️","🙁","😖","😞","😟","😤","😢","😭","😦","😧","😨","😩","🤯","😬","😰","😱","🥵","🥶","😳","🤪","😵","🥴","😠","😡","🤬","🤥","🤫","🤭","🫢","🫤","🫨",
//     "👍","👎","👌","✌️","🤞","🤟","🤘","🤙","👋","🤚","✋","🖐️","🖖","👏","🙌","👐","🤲","🙏","💪","🦾",
//     "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟",
//     "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵",
//     "🍎","🍊","🍌","🍉","🍇","🍓","🫐","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🥑",
//     "⚽","🏀","🏈","⚾","🎾","🏐","🏉","🎱","🏓","🏸","🥅","⛳","🥊","🥋","🎿","⛷️","🏂",
//     "✈️","🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚚","🚲","🛴","🛵","🏍️","🚂","🚆","🚇","🚄",
//     "⌚","📱","💻","⌨️","🖥️","🖨️","🖱️","💽","💾","💿","📷","🎥","📺","📻","🎧","🎤",
//     "⏰","🎉","🎁","🎈","📦","📌","📎","✂️","🗂️","📅","📖","✏️","🖊️","🖌️","📐","📏",
//     "✅","❌","⚠️","‼️","❗","❓","➕","➖","➗","♻️","🔞","🔒","🔓","🔑","🧭",
//   ], []);

//   const appendEmoji = useCallback((emoji: string) => {
//     setText((t) => t + emoji);
//     setShowEmoji(false);
//   }, []);

//   // Special sticker marker for Lottie Wumpus
//   const WUMPUS_STICKER_MARKER = '__LOTTIE_WUMPUS_HI__';
//   const LMAO_STICKER_MARKER = '__LOTTIE_LMAO__';
//   const TEDDY_STICKER_MARKER = '__LOTTIE_TEDDY__';
//   const sendWumpusSticker = useCallback(async () => {
//     // throttle rapid taps
//     const now = Date.now();
//     (sendWumpusSticker as any)._last = (sendWumpusSticker as any)._last || 0;
//     if (now - (sendWumpusSticker as any)._last < 600) return;
//     (sendWumpusSticker as any)._last = now;

//     const tempId = Date.now();
//     const optimistic: any = {
//       id: `pending_${tempId}`,
//       senderID: user?.ID,
//       sender: { firstName: user?.firstName, lastName: user?.lastName },
//       content: WUMPUS_STICKER_MARKER,
//       createdAt: new Date().toISOString(),
//       color: colorByUserId(user?.ID || 0),
//       isPending: true,
//     };
//     setPendingMessages((prev) => [...prev, optimistic]);
//     setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

//     const execSend = async () => {
//       const color = colorByUserId(user?.ID || 0);
//       await sendMessage.mutateAsync({ content: WUMPUS_STICKER_MARKER, color, ttlSec: 24 * 3600 });
//     };
//     const softTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('soft-timeout')), 5000));
//     try {
//       await Promise.race([execSend(), softTimeout]);
//       setPendingMessages((prev) => prev.filter((m) => m.id !== `pending_${tempId}`));
//     } catch (error) {
//       setPendingMessages((prev) => prev.map((m) => m.id === `pending_${tempId}` ? { ...m, isPending: false, sendError: true } : m));
//     }
//   }, [colorByUserId, user?.ID, sendMessage]);

//   const sendLMAOSticker = useCallback(async () => {
//     const now = Date.now();
//     (sendLMAOSticker as any)._last = (sendLMAOSticker as any)._last || 0;
//     if (now - (sendLMAOSticker as any)._last < 600) return;
//     (sendLMAOSticker as any)._last = now;

//     const tempId = Date.now();
//     const optimistic: any = {
//       id: `pending_${tempId}`,
//       senderID: user?.ID,
//       sender: { firstName: user?.firstName, lastName: user?.lastName },
//       content: LMAO_STICKER_MARKER,
//       createdAt: new Date().toISOString(),
//       color: colorByUserId(user?.ID || 0),
//       isPending: true,
//     };
//     setPendingMessages((prev) => [...prev, optimistic]);
//     setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

//     const execSend = async () => {
//       const color = colorByUserId(user?.ID || 0);
//       await sendMessage.mutateAsync({ content: LMAO_STICKER_MARKER, color, ttlSec: 24 * 3600 });
//     };
//     const softTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('soft-timeout')), 5000));
//     try {
//       await Promise.race([execSend(), softTimeout]);
//       setPendingMessages((prev) => prev.filter((m) => m.id !== `pending_${tempId}`));
//     } catch (error) {
//       setPendingMessages((prev) => prev.map((m) => m.id === `pending_${tempId}` ? { ...m, isPending: false, sendError: true } : m));
//     }
//   }, [colorByUserId, user?.ID, sendMessage]);

//   const sendTeddySticker = useCallback(async () => {
//     const now = Date.now();
//     (sendTeddySticker as any)._last = (sendTeddySticker as any)._last || 0;
//     if (now - (sendTeddySticker as any)._last < 600) return;
//     (sendTeddySticker as any)._last = now;

//     const tempId = Date.now();
//     const optimistic: any = {
//       id: `pending_${tempId}`,
//       senderID: user?.ID,
//       sender: { firstName: user?.firstName, lastName: user?.lastName },
//       content: TEDDY_STICKER_MARKER,
//       createdAt: new Date().toISOString(),
//       color: colorByUserId(user?.ID || 0),
//       isPending: true,
//     };
//     setPendingMessages((prev) => [...prev, optimistic]);
//     setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

//     const execSend = async () => {
//       const color = colorByUserId(user?.ID || 0);
//       await sendMessage.mutateAsync({ content: TEDDY_STICKER_MARKER, color, ttlSec: 24 * 3600 });
//     };
//     const softTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('soft-timeout')), 5000));
//     try {
//       await Promise.race([execSend(), softTimeout]);
//       setPendingMessages((prev) => prev.filter((m) => m.id !== `pending_${tempId}`));
//     } catch (error) {
//       setPendingMessages((prev) => prev.map((m) => m.id === `pending_${tempId}` ? { ...m, isPending: false, sendError: true } : m));
//     }
//   }, [colorByUserId, user?.ID, sendMessage]);

//   // Handle WebSocket messages in real-time
//   useEffect(() => {
//     if (!lastMessage) return;

//     console.log('📥 Processing WebSocket message:', lastMessage);
//     console.log('📥 Message type:', lastMessage.type);
//     console.log('📥 Message data:', lastMessage.message);

//     switch (lastMessage.type) {
//       case 'message':
//         // Append new message live without refetch
//         if (lastMessage.message) {
//           setLiveMessages((prev) => {
//             const id = lastMessage.message.id || lastMessage.message.ID;
//             if (id && prev.some((m) => (m.id || m.ID) === id)) return prev;
//             return [...prev, lastMessage.message];
//           });
//           // Ack delivered back to server (best-effort)
//           try {
//             const deliveredId = Number(lastMessage.message.id || lastMessage.message.ID);
//             if (Number.isFinite(deliveredId)) {
//               wsSend('delivered', { messageId: deliveredId });
//             }
//           } catch {}
//           // Remove any pending/error entry that matches this delivered message (same sender and content)
//           try {
//             const deliveredSenderId = lastMessage.message.senderID || lastMessage.message.SenderID;
//             const deliveredContent = lastMessage.message.content || lastMessage.message.Content;
//             setPendingMessages((prev) => prev.filter((m) => {
//               const sameSender = (m.senderID || m.SenderID) === deliveredSenderId;
//               const sameContent = (m.content || m.Content) === deliveredContent;
//               return !(sameSender && sameContent);
//             }));
//           } catch {}
//           setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
//         }
//         break;
//       case 'typing':
//         // Typing indicators are handled by useTyping hook
//         console.log('⌨️ Typing event received');
//         break;
//       case 'read_receipt':
//         // Update read counts
//         if (lastMessage.data?.messageId) {
//           console.log('👁️ Read receipt received for message:', lastMessage.data.messageId);
//           setReadCounts(prev => ({
//             ...prev,
//             [String(lastMessage.data.messageId)]: (prev[String(lastMessage.data.messageId)] || 0) + 1
//           }));
//         }
//         break;
//       default:
//         console.log('❓ Unknown message type:', lastMessage.type);
//     }
//   }, [lastMessage, wsSend]);

//   const memberNames = useMemo(() => {
//     return (members || [])
//       .map((m: any) => (((m?.user?.firstName || '') + ' ' + (m?.user?.lastName || '')).trim()))
//       .filter(Boolean)
//       .join(' · ');
//   }, [members]);

//   // Combine messages once, de-dup by id (memoized to avoid rebuilding every render)
//   const combinedMessages = useMemo(() => {
//     const base = Array.isArray(messages) ? messages : [];
//     const live = Array.isArray(liveMessages) ? liveMessages : [];
//     const pend = Array.isArray(pendingMessages) ? pendingMessages : [];
//     const seen = new Set<string | number>();
//     const out: any[] = [];
//     for (const m of base) {
//       const id = m?.id || m?.ID;
//       seen.add(id);
//       out.push(m);
//     }
//     for (const m of live) {
//       const id = m?.id || m?.ID;
//       if (id == null || seen.has(id)) continue;
//       seen.add(id);
//       out.push(m);
//     }
//     // pending items can share no id yet; keep them at the end
//     for (const m of pend) {
//       out.push(m);
//     }
//     return out;
//   }, [messages, liveMessages, pendingMessages]);

//   // Memoized message item to reduce re-renders
//   const MessageItem = useMemo(() => React.memo(({ item, index }: any) => {
//     const isMine = (item.senderID || item.SenderID) === user?.ID;
//     const sender = item?.sender || item?.Sender || {};
//     const first = sender?.firstName || sender?.FirstName || '';
//     const last = sender?.lastName || sender?.LastName || '';
//     let displayName = (first + ' ' + last).trim();
//     if (isMine) displayName = 'You';
//     if (!displayName) displayName = `Member ${item.senderID || item.SenderID}`;
//     if (/@/.test(displayName)) displayName = 'Anonymous';
//     const color = item.color || item.Color || colorByUserId(item.senderID || item.SenderID || 0);
//     const created = new Date(item.createdAt || item.CreatedAt || item.created_at);
//     const prev = combinedMessages[index - 1];
//     const showDay = !prev || new Date(prev?.createdAt || prev?.CreatedAt || prev?.created_at).toDateString() !== created.toDateString();
//     const msgId = String(item.id || item.ID);
//     const type = item.type || item.Type;
//     const previewTitle = item.previewTitle || item.PreviewTitle;
//     const previewSubtitle = item.previewSubtitle || item.PreviewSubtitle;
//     const previewImage = item.previewImageURL || item.PreviewImageURL;
//     const previewDescription = item.previewDescription || item.PreviewDescription;
//     const refType = item.refType || item.RefType;
//     const refID = item.refID || item.RefID;

//     const openLinkedCard = () => {
//       if (refType === 'property' && refID) {
//         (navigation as any).navigate('PropertyDetails', { propertyID: Number(refID) });
//       } else if (refType === 'experience' && refID) {
//         (navigation as any).navigate('ExperienceDetails', { experienceId: Number(refID) });
//       }
//     };

//     const readCount = readCounts[msgId] || 0;

//     return (
//       <View>
//         {showDay && (
//           <View style={styles.dayWrap}>
//             <Text style={styles.dayText}>
//               {created.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: created.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })}
//             </Text>
//           </View>
//         )}
//         <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
//           {!isMine && (
//             <View style={[styles.avatar, { backgroundColor: color }]}>
//               <Text style={styles.avatarText}>{(displayName || 'U')[0].toUpperCase()}</Text>
//             </View>
//           )}
//           <Pressable 
//             onLongPress={() => setReplyingTo(item)}
//             style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}
//           >
//             {!isMine && <Text style={styles.senderName}>{displayName}</Text>}
//             {(item.repliedToID || item.RepliedToID) && (
//               <View style={[styles.repliedToBubble, { borderLeftColor: color }]}> 
//                 <Text style={styles.repliedToSender}>{displayName}</Text>
//                 <Text style={styles.repliedToText} numberOfLines={1}>
//                   {item.repliedToContent || item.RepliedToContent || item.content || item.Content}
//                 </Text>
//               </View>
//             )}
//             {(type === 'wishlist' || type === 'share') ? (
//               <View style={{ maxWidth: '100%' }}>
//                 <View style={styles.labelRow}>
//                   {type === 'wishlist' ? (
//                     <Heart size={14} color="#FF5A5F" weight="fill" />
//                   ) : (
//                     <ShareNetwork size={14} color="#222" weight="duotone" />
//                   )}
//                   <Text style={styles.labelText}>
//                     {(item.content || item.Content) || (type === 'wishlist' ? 'Added to wishlist' : 'Shared a property')}
//                   </Text>
//                 </View>
//                 <View style={styles.connectorDot} />
//                 <TouchableOpacity activeOpacity={0.85} onPress={openLinkedCard} style={styles.wishlistCard}>
//                   {previewImage ? (
//                     <Image source={{ uri: previewImage }} style={styles.wishlistThumb} />
//                   ) : (
//                     <View style={[styles.wishlistThumb, { backgroundColor: '#F2F2F2' }]} />
//                   )}
//                   <View style={{ flex: 1, marginLeft: 12 }}>
//                     <Text style={styles.wishlistTitle} numberOfLines={1}>{previewTitle || 'Wishlist item'}</Text>
//                     {!!previewSubtitle && <Text style={styles.wishlistSubtitle} numberOfLines={1}>{previewSubtitle}</Text>}
//                     {previewDescription ? (
//                       <Text style={styles.wishlistDesc} numberOfLines={2}>{previewDescription}</Text>
//                     ) : null}
//                   </View>
//                 </TouchableOpacity>
//               </View>
//             ) : (
//               (() => {
//                 const c = item.content || item.Content;
//                 if (c === WUMPUS_STICKER_MARKER) {
//                   return (
//                     <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
//                       <LottieView source={require('../assets/lotties/Wumpus-Hi.json')} autoPlay loop style={{ width: 160, height: 160 }} />
//                     </View>
//                   );
//                 }
//                 if (c === LMAO_STICKER_MARKER) {
//                   return (
//                     <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
//                       <LottieView source={require('../assets/lotties/LMAO.json')} autoPlay loop style={{ width: 160, height: 160 }} />
//                     </View>
//                   );
//                 }
//                 if (c === TEDDY_STICKER_MARKER) {
//                   return (
//                     <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
//                       <LottieView source={require('../assets/lotties/Teddy-Bear-laughing.json')} autoPlay loop style={{ width: 160, height: 160 }} />
//                     </View>
//                   );
//                 }
//                 return <Text style={[styles.msgText, isMine && { color: '#fff' }]}>{c}</Text>;
//               })()
//             )}
//             <View style={styles.metaRow}>
//               <Text style={[styles.time, isMine && { color: '#E8E8E8' }]}>
//                 {created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//               </Text>
//               {isMine && (
//                 <>
//                   {readCount > 0 ? (
//                     <Checks size={16} color="#00A699" weight="bold" />
//                   ) : (
//                     <Check size={16} color="#E8E8E8" weight="bold" />
//                   )}
//                   <TouchableOpacity style={styles.readsBtn} onPress={() => openReads(Number(item.id || item.ID))}>
//                     <Eye size={14} color="#E8E8E8" weight="duotone" />
//                     <Text style={styles.readsText}>{readCount}</Text>
//                   </TouchableOpacity>
//                 </>
//               )}
//             </View>
//           </Pressable>
//         </View>
//       </View>
//     );
//   }), [combinedMessages, colorByUserId, navigation, openReads, readCounts, setReplyingTo, user?.ID]);

//   const renderItem = useCallback(({ item, index }: any) => (
//     <MessageItem item={item} index={index} />
//   ), [MessageItem]);

//   if (messagesError) {
//     return (
//       <View style={styles.container}>
//         <View style={styles.errorContainer}>
//           <Warning size={56} color="#FF5A5F" weight="duotone" />
//           <Text style={styles.errorTitle}>Connection Issue</Text>
//           <Text style={styles.errorText}>We couldn't load your messages. Please check your internet connection.</Text>
//           <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
//             <Text style={styles.retryButtonText}>Go Back</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <KeyboardAvoidingView 
//       style={styles.container} 
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//       keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
//     >
//       <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
//         <View style={styles.header}>
//           <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
//             <ArrowLeft size={24} color="#222" weight="bold" />
//           </TouchableOpacity>
//           {/* WebSocket connection status indicator */}
//           {isConnected && (
//             <View style={styles.connectionIndicator}>
//               <CheckCircle size={10} color="#00A699" weight="fill" />
//             </View>
//           )}
//           <Image 
//             source={{ uri: group?.photoURL || group?.PhotoURL || 'https://via.placeholder.com/64x64?text=GP' }} 
//             style={styles.groupAvatar}
//           />
//           <View style={{ flex: 1, marginLeft: 14 }}>
//             <Text style={styles.headerTitle} numberOfLines={1}>
//               {title || group?.name || group?.Name || 'Group chat'}
//             </Text>
//             <Text style={styles.memberLine} numberOfLines={1}>
//               {members.length} members
//             </Text>
//           </View>
//           <TouchableOpacity 
//             style={styles.heartBtn} 
//             onPress={() => (navigation as any).navigate('GroupWishlist', { groupId, title: 'Shared wishlist' })}
//           >
//             <Heart size={16} color="#FF5A5F" weight="fill" />
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.menuBtn} onPress={() => setShowGroupMenu(true)}>
//             <DotsThreeVertical size={16} color="#222" weight="bold" />
//           </TouchableOpacity>
//         </View>

//         {messagesLoading ? (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color="#FF5A5F" />
//             <Text style={styles.loadingText}>Loading your conversation...</Text>
//           </View>
//         ) : messages.length === 0 ? (
//           <View style={styles.emptyContainer}>
//             <Heart size={72} color="#FFE5E5" weight="fill" />
//             <Text style={styles.emptyTitle}>Start the Conversation</Text>
//             <Text style={styles.emptyText}>
//               Share travel plans, coordinate bookings, and make memories together
//             </Text>
//             <View style={styles.emptyStickerWrap}>
//               <TouchableOpacity activeOpacity={0.9} onPress={sendWumpusSticker} disabled={sendingMessage}>
//                 <LottieView
//                   source={require('../assets/lotties/Wumpus-Hi.json')}
//                   autoPlay
//                   loop
//                   style={{ width: 180, height: 180 }}
//                 />
//               </TouchableOpacity>
//               <Text style={styles.emptyStickerHint}>Tap to send a sticker</Text>
//             </View>
//           </View>
//         ) : (
//           <FlatList
//             ref={flatListRef}
//             data={combinedMessages}
//             keyExtractor={(m: any) => String(m.id || m.ID || m.tempId || Math.random())}
//             contentContainerStyle={styles.messagesList}
//             renderItem={renderItem}
//             onViewableItemsChanged={onViewableItemsChanged}
//             viewabilityConfig={viewabilityConfig}
//             initialNumToRender={12}
//             maxToRenderPerBatch={8}
//             windowSize={21}
//             removeClippedSubviews={true}
//             showsVerticalScrollIndicator={false}
//             onLayout={handleListLayout}
//             onContentSizeChange={handleContentSizeChange}
//             onScroll={handleListScroll}
//             scrollEventThrottle={16}
//           />
//         )}

//         {messageError && (
//           <View style={styles.errorBanner}>
//             <Warning size={18} color="#FF5A5F" weight="bold" />
//             <Text style={styles.errorBannerText}>{messageError}</Text>
//             <TouchableOpacity onPress={() => setMessageError(null)}>
//               <Text style={styles.errorDismiss}>✕</Text>
//             </TouchableOpacity>
//           </View>
//         )}

//         {typing.length > 0 && (
//           <View style={styles.typingBar}>
//             <Text style={styles.typingText}>
//               {typing.map((t: any) => t.name || `User ${t.userID}`).join(', ')} {typing.length === 1 ? 'is' : 'are'} typing...
//             </Text>
//           </View>
//         )}

//         {/* Quick sticker bar */}
//         <View style={styles.stickerBar}>
//           <TouchableOpacity style={styles.stickerBtn} onPress={sendLMAOSticker} disabled={sendingMessage}>
//             <LottieView source={require('../assets/lotties/LMAO.json')} autoPlay loop style={styles.stickerLottie} />
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.stickerBtn} onPress={sendWumpusSticker} disabled={sendingMessage}>
//             <LottieView source={require('../assets/lotties/Wumpus-Hi.json')} autoPlay loop style={styles.stickerLottie} />
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.stickerBtn} onPress={sendTeddySticker} disabled={sendingMessage}>
//             <LottieView source={require('../assets/lotties/Teddy-Bear-laughing.json')} autoPlay loop style={styles.stickerLottie} />
//           </TouchableOpacity>
//         </View>

//         {/* Reply indicator */}
//         {replyingTo && (
//           <View style={styles.replyIndicator}>
//             <View style={styles.replyIndicatorContent}>
//               <Text style={styles.replyIndicatorLabel}>Replying to:</Text>
//               <Text style={styles.replyIndicatorText} numberOfLines={1}>
//                 {replyingTo.content || replyingTo.Content}
//               </Text>
//             </View>
//             <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.replyIndicatorClose}>
//               <DotsThreeVertical size={16} color="#777" weight="bold" />
//             </TouchableOpacity>
//           </View>
//         )}

//         <View style={styles.composer}>
//           <TextInput
//             style={[styles.input, sendingMessage && styles.inputDisabled]}
//             placeholder="Type a message..."
//             placeholderTextColor="#AAAAAA"
//             value={text}
//             returnKeyType="send"
//             onSubmitEditing={handleSend}
//             onFocus={() => { sendTypingDebounced(user?.firstName || 'You'); }}
//             onChangeText={(v) => { 
//               setText(v); 
//               if (v.length > 0) {
//                 sendTypingDebounced(user?.firstName || 'You');
//               }
//             }}
//             editable={!sendingMessage}
//             multiline
//             maxLength={2000}
//           />
//           <TouchableOpacity 
//             style={styles.emojiBtn} 
//             onPress={() => setShowEmoji(true)}
//             disabled={sendingMessage}
//           >
//             <Smiley size={24} color={sendingMessage ? "#CCC" : "#222"} weight="duotone" />
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={[styles.sendBtn, (!text.trim() || sendingMessage) && styles.sendBtnDisabled]} 
//             onPress={handleSend}
//             disabled={!text.trim() || sendingMessage}
//           >
//             {sendingMessage ? (
//               <ActivityIndicator size="small" color="#fff" />
//             ) : (
//               <PaperPlaneTilt size={20} color="#fff" weight="fill" />
//             )}
//           </TouchableOpacity>
//         </View>

//         <BottomSheet visible={showEmoji} onClose={() => setShowEmoji(false)}>
//           <Text style={styles.sheetTitle}>Choose an emoji</Text>
//           <ScrollView contentContainerStyle={styles.emojiGrid} showsVerticalScrollIndicator={false}>
//             {EMOJIS.map((e, idx) => (
//               <TouchableOpacity 
//                 key={`${e}-${idx}`} 
//                 style={styles.emojiCell}
//                 onPress={() => appendEmoji(e)}
//               >
//                 <Text style={styles.emojiText}>{e}</Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         </BottomSheet>

//         <BottomSheet visible={readsVisible} onClose={() => setReadsVisible(false)}>
//           <Text style={styles.sheetTitle}>Seen by</Text>
//           {readsLoading ? (
//             <View style={styles.sheetLoading}>
//               <ActivityIndicator size="small" color="#FF5A5F" />
//               <Text style={styles.loadingText}>Loading...</Text>
//             </View>
//           ) : reads.length === 0 ? (
//             <View style={styles.sheetEmpty}>
//               <Eye size={40} color="#E0E0E0" weight="duotone" />
//               <Text style={styles.emptyReadsText}>No one has seen this yet</Text>
//             </View>
//           ) : (
//             <ScrollView style={styles.readsScroll} contentContainerStyle={styles.readsContent}>
//               {reads.map((r: any, idx: number) => (
//                 <View key={`${r.UserID}_${r.ReadAt}_${idx}`} style={styles.readRow}>
//                   <Image 
//                     source={{ uri: r.AvatarURL || 'https://i.pravatar.cc/100' }} 
//                     style={styles.readAvatar}
//                   />
//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.readName}>
//                       {`${r.FirstName || ''} ${r.LastName || ''}`.trim() || `User ${r.UserID}`}
//                     </Text>
//                     <Text style={styles.readTime}>
//                       {new Date(r.ReadAt).toLocaleString('en-US', { 
//                         month: 'short', 
//                         day: 'numeric', 
//                         hour: '2-digit', 
//                         minute: '2-digit' 
//                       })}
//                     </Text>
//                   </View>
//                   <Checks size={20} color="#00A699" weight="fill" />
//                 </View>
//               ))}
//             </ScrollView>
//           )}
//         </BottomSheet>

//         <BottomSheet visible={showGroupMenu} onClose={() => setShowGroupMenu(false)}>
//           <Text style={styles.menuTitle}>Group Settings</Text>
          
//           <TouchableOpacity 
//             style={styles.menuItem}
//             onPress={() => {
//               setShowGroupMenu(false);
//               (navigation as any).navigate('GroupMembers', { groupId });
//             }}
//           >
//             <View style={styles.menuIconContainer}>
//               <UserMinus size={22} color="#222" weight="bold" />
//             </View>
//             <View style={{ flex: 1 }}>
//               <Text style={styles.menuItemText}>Manage Members</Text>
//               <Text style={styles.menuItemSubtext}>View and manage group members</Text>
//             </View>
//           </TouchableOpacity>

//           <TouchableOpacity 
//             style={styles.menuItem}
//             onPress={() => {
//               setShowGroupMenu(false);
//               generateInviteCode();
//             }}
//           >
//             <View style={[styles.menuIconContainer, { backgroundColor: '#E6F7F5' }]}>
//               <LockKey size={22} color="#00A699" weight="bold" />
//             </View>
//             <View style={{ flex: 1 }}>
//               <Text style={styles.menuItemText}>Invite Members</Text>
//               <Text style={styles.menuItemSubtext}>Generate an invite code</Text>
//             </View>
//           </TouchableOpacity>

//           <TouchableOpacity 
//             style={[styles.menuItem, styles.menuItemDanger]}
//             onPress={() => {
//               setShowGroupMenu(false);
//               setShowQuitModal(true);
//             }}
//           >
//             <View style={[styles.menuIconContainer, styles.menuIconDanger]}>
//               <SignOut size={22} color="#FF5A5F" weight="bold" />
//             </View>
//             <View style={{ flex: 1 }}>
//               <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Leave Group</Text>
//               <Text style={styles.menuItemSubtext}>Exit this group permanently</Text>
//             </View>
//           </TouchableOpacity>
//         </BottomSheet>
//       </Animated.View>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#FFF' },
//   header: {
//     flexDirection: 'row', 
//     alignItems: 'center', 
//     paddingHorizontal: 18, 
//     paddingBottom: 16,
//     borderBottomWidth: 1, 
//     borderBottomColor: '#EFEFEF',
//     backgroundColor: '#FFFFFF',
//     marginTop: "15%",
//   },
//   backBtn: { 
//     width: 40, 
//     height: 40, 
//     borderRadius: 20, 
//     alignItems: 'center', 
//     justifyContent: 'center', 
//     backgroundColor: '#F7F7F7',
//     marginRight: 6,
//   },
//   headerTitle: { fontSize: 18, fontWeight: '800', color: '#222222', letterSpacing: -0.5 },
//   memberLine: { fontSize: 12, color: '#999', fontWeight: '500' },
//   msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14, paddingHorizontal: 4 },
//   msgRowLeft: { justifyContent: 'flex-start' },
//   msgRowRight: { justifyContent: 'flex-end', alignSelf: 'flex-end' },
//   avatar: { 
//     width: 34, 
//     height: 34, 
//     borderRadius: 17, 
//     alignItems: 'center', 
//     justifyContent: 'center', 
//     marginRight: 10,
//   },
//   avatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
//   senderName: { fontSize: 12, color: '#8A8A8A', marginBottom: 4, fontWeight: '600' },
//   bubble: { 
//     maxWidth: '76%', 
//     paddingHorizontal: 16, 
//     paddingVertical: 12, 
//     borderRadius: 20,
//   },
//   bubbleOther: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 6 },
//   bubbleMine: { 
//     backgroundColor: '#222222',
//     borderTopRightRadius: 6,
//   },
//   msgText: { color: '#222', fontSize: 16, lineHeight: 22, letterSpacing: -0.2 },
//   metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
//   time: { fontSize: 11, color: '#AAAAAA', fontWeight: '600' },
//   readsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
//   readsText: { fontSize: 11, color: '#E8E8E8', fontWeight: '700' },
//   composer: { 
//     flexDirection: 'row', 
//     alignItems: 'flex-end',
//     padding: 16, 
//     paddingBottom: 45,
//     backgroundColor: '#FFFFFF', 
//     borderTopWidth: 1, 
//     borderTopColor: '#F0F0F0',
//   },
//   input: { 
//     flex: 1,
//     minHeight: 44,
//     maxHeight: 120,
//     backgroundColor: '#F7F7F7', 
//     borderRadius: 22, 
//     paddingHorizontal: 18,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: '#222',
//     borderWidth: 1,
//     borderColor: '#F0F0F0',
//   },
//   inputDisabled: { opacity: 0.5 },
//   sendBtn: { 
//     marginLeft: 10, 
//     height: 44, 
//     width: 44, 
//     borderRadius: 22, 
//     backgroundColor: '#FF5A5F', 
//     alignItems: 'center', 
//     justifyContent: 'center',
//   },
//   sendBtnDisabled: { 
//     backgroundColor: '#E0E0E0',
//   },
//   typingBar: { 
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 18, 
//     paddingVertical: 12,
//     backgroundColor: '#FFFFFF',
//     borderTopWidth: 1,
//     borderTopColor: '#F5F5F5',
//   },
//   typingText: { fontSize: 13, color: '#888', fontWeight: '500', fontStyle: 'italic' },
//   stickerBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'flex-start',
//     gap: 10,
//     paddingHorizontal: 16,
//     // paddingTop: 8,
//     // marginBottom: 20,
//     backgroundColor: '#FFFFFF',
//   },
//   stickerBtn: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     marginBottom: 5,
//     backgroundColor: '#F7F7F7',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: '#EFEFEF',
//     overflow: 'hidden',
//   },
//   stickerLottie: { width: 44, height: 44 },
//   groupAvatar: { 
//     width: 42, 
//     height: 42, 
//     borderRadius: 21,
//     borderWidth: 2,
//     borderColor: '#FFFFFF',
//   },
//   heartBtn: { 
//     width: 30, 
//     height: 30, 
//     borderRadius: 20, 
//     alignItems: 'center', 
//     justifyContent: 'center', 
//     marginLeft: 10,
//     borderWidth: 1.5,
//     borderColor: '#FFE0E0',
//   },
//   dayWrap: { 
//     alignSelf: 'center', 
//     backgroundColor: '#F0F0F0', 
//     paddingHorizontal: 14, 
//     paddingVertical: 7, 
//     borderRadius: 14, 
//     marginVertical: 16,
//   },
//   dayText: { fontSize: 12, color: '#777', fontWeight: '700', letterSpacing: 0.5 },
//   emojiBtn: { 
//     marginLeft: 10, 
//     height: 44, 
//     width: 44, 
//     borderRadius: 22, 
//     backgroundColor: '#F7F7F7', 
//     alignItems: 'center', 
//     justifyContent: 'center' 
//   },
//   sheetTitle: { fontSize: 22, fontWeight: '800', color: '#222', letterSpacing: -0.8, marginBottom: 20 },
//   emojiGrid: { 
//     flexDirection: 'row', 
//     flexWrap: 'wrap', 
//     gap: 6,
//     paddingBottom: 24,
//   },
//   emojiCell: { 
//     width: 52, 
//     height: 52, 
//     borderRadius: 14, 
//     alignItems: 'center', 
//     justifyContent: 'center',
//     backgroundColor: '#F9F9F9',
//   },
//   emojiText: { fontSize: 30 },
//   readRow: { 
//     flexDirection: 'row', 
//     alignItems: 'center', 
//     gap: 14, 
//     paddingVertical: 14, 
//     borderBottomWidth: 1, 
//     borderBottomColor: '#F5F5F5' 
//   },
//   readAvatar: { 
//     width: 46, 
//     height: 46, 
//     borderRadius: 23, 
//     backgroundColor: '#F0F0F0',
//     borderWidth: 2,
//     borderColor: '#FFFFFF',
//   },
//   readName: { fontSize: 16, fontWeight: '700', color: '#222', letterSpacing: -0.3 },
//   readTime: { fontSize: 13, color: '#AAA', marginTop: 2, fontWeight: '500' },
//   labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
//   labelText: { fontSize: 14, color: '#222', fontWeight: '600' },
//   connectorDot: { 
//     width: 7, 
//     height: 7, 
//     borderRadius: 4, 
//     backgroundColor: '#DDDDDD', 
//     marginLeft: 7, 
//     marginBottom: 12 
//   },
//   wishlistCard: { 
//     flexDirection: 'row', 
//     alignItems: 'center', 
//     borderWidth: 1.5, 
//     borderColor: '#EFEFEF', 
//     backgroundColor: '#FFFFFF', 
//     borderRadius: 16, 
//     padding: 14,
//   },
//   wishlistThumb: { width: 92, height: 92, borderRadius: 14 },
//   wishlistTitle: { fontSize: 16, fontWeight: '800', color: '#222', letterSpacing: -0.4 },
//   wishlistSubtitle: { fontSize: 14, color: '#777', marginTop: 4, fontWeight: '600' },
//   wishlistDesc: { fontSize: 13, color: '#666', marginTop: 6, lineHeight: 18 },
//   menuBtn: { 
//     width: 40, 
//     height: 40, 
//     borderRadius: 20, 
//     alignItems: 'center', 
//     justifyContent: 'center', 
//     backgroundColor: '#F7F7F7', 
//     marginLeft: 10,
//   },
//   menuTitle: { fontSize: 20, fontWeight: '800', color: '#222', letterSpacing: -0.5, marginBottom: 20 },
//   menuItem: { 
//     flexDirection: 'row', 
//     alignItems: 'center', 
//     paddingVertical: 16, 
//     paddingHorizontal: 14,
//     borderRadius: 14,
//     marginBottom: 6,
//   },
//   menuItemDanger: {
//     backgroundColor: '#FFF8F8',
//   },
//   menuIconContainer: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: '#F7F7F7',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 14,
//   },
//   menuIconDanger: {
//     backgroundColor: '#FFE5E5',
//   },
//   menuItemText: { fontSize: 17, color: '#222', fontWeight: '700', letterSpacing: -0.3 },
//   menuItemTextDanger: { color: '#FF5A5F' },
//   menuItemSubtext: { fontSize: 13, color: '#AAA', marginTop: 3, fontWeight: '500' },
//   messagesList: { 
//     padding: 18, 
//     paddingBottom: 120,
//   },
//   loadingContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 14,
//     backgroundColor: '#FAFAFA',
//   },
//   loadingText: { fontSize: 16, color: '#777', fontWeight: '600' },
//   emptyContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 44,
//     backgroundColor: '#FAFAFA',
//   },
//   emptyTitle: { fontSize: 24, fontWeight: '800', color: '#222', marginTop: 8, letterSpacing: -0.8 },
//   emptyText: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 12, lineHeight: 24, fontWeight: '500' },
//   emptyStickerWrap: {
//     position: 'absolute',
//     bottom: 40,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   emptyStickerHint: {
//     marginTop: 6,
//     fontSize: 12,
//     color: '#888',
//     fontWeight: '600'
//   },
//   errorContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 44,
//     gap: 16,
//     backgroundColor: '#FAFAFA',
//   },
//   errorTitle: { fontSize: 24, fontWeight: '800', color: '#222', marginTop: 12, letterSpacing: -0.8 },
//   errorText: { fontSize: 16, color: '#999', textAlign: 'center', lineHeight: 24, fontWeight: '500' },
//   retryButton: {
//     marginTop: 24,
//     paddingHorizontal: 36,
//     paddingVertical: 16,
//     backgroundColor: '#FF5A5F',
//     borderRadius: 28,
//   },
//   retryButtonText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
//   errorBanner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#FFF5F5',
//     paddingHorizontal: 18,
//     paddingVertical: 14,
//     borderTopWidth: 2,
//     borderTopColor: '#FFE0E0',
//     gap: 12,
//   },
//   errorBannerText: { flex: 1, fontSize: 14, color: '#FF5A5F', fontWeight: '600' },
//   errorDismiss: { fontSize: 20, color: '#FF5A5F', fontWeight: '400' },
//   sheetLoading: {
//     paddingVertical: 48,
//     alignItems: 'center',
//     gap: 14,
//   },
//   sheetEmpty: {
//     paddingVertical: 48,
//     alignItems: 'center',
//     gap: 14,
//   },
//   emptyReadsText: { fontSize: 14, color: '#AAA', fontWeight: '500', textAlign: 'center' },
//   readsScroll: { maxHeight: 420 },
//   readsContent: { paddingHorizontal: 14, paddingBottom: 20 },
//   connectionIndicator: {
//     position: 'absolute',
//     top: 8,
//     right: 8,
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     backgroundColor: 'rgba(0, 166, 153, 0.1)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   repliedToBubble: {
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     backgroundColor: 'rgba(0, 0, 0, 0.05)',
//     borderRadius: 8,
//     borderLeftWidth: 3,
//     marginBottom: 8,
//   },
//   repliedToSender: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#666',
//     marginBottom: 2,
//   },
//   repliedToText: {
//     fontSize: 13,
//     color: '#999',
//     fontStyle: 'italic',
//   },
//   replyIndicator: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     backgroundColor: '#F9F9F9',
//     borderTopWidth: 1,
//     borderTopColor: '#EFEFEF',
//   },
//   replyIndicatorContent: {
//     flex: 1,
//   },
//   replyIndicatorLabel: {
//     fontSize: 12,
//     color: '#999',
//     fontWeight: '600',
//     marginBottom: 2,
//   },
//   replyIndicatorText: {
//     fontSize: 14,
//     color: '#222',
//     fontWeight: '500',
//   },
//   replyIndicatorClose: {
//     padding: 4,
//   },
// });


import React, { useMemo, useState, useCallback, useRef, useEffect, memo } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Animated, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  Pressable, 
  Alert, 
  Clipboard,
  StatusBar,
  Dimensions,
  LayoutAnimation,
  UIManager
} from 'react-native';
import LottieView from 'lottie-react-native';
import { Text } from '@ui-kitten/components';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useGroupMessages, useSendMessage, useTyping } from '../hooks/queries/useChat';
import { useUser } from '../hooks/useUser';
import { useWebSocket } from '../hooks/useWebSocket';
import { 
  ArrowLeft, 
  PaperPlaneTilt, 
  Smiley, 
  Heart, 
  ShareNetwork, 
  Eye, 
  DotsThreeVertical, 
  SignOut, 
  UserMinus, 
  CheckCircle, 
  Warning, 
  LockKey,
  Check, 
  Checks,
  Microphone,
  Camera,
  Image as ImageIcon,
  X
} from 'phosphor-react-native';
import axios from 'axios';
import { endpoints } from '../constants';
import { useMyGroups, useGroupMembers } from '../hooks/queries/useExperienceInvites';
import { BottomSheet } from '../components/BottomSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRegisterPushToken } from '../hooks/useRegisterPushToken';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLORS = ["#FF5A5F", "#00A699", "#007A87", "#FC642D", "#484848", "#767676", "#8CE071", "#FFB400", "#7B0051", "#00D1C1"];

// Optimized Message Item Component with React.memo
const MessageItem = memo(({ 
  item, 
  index, 
  userId, 
  colorByUserId, 
  combinedMessages, 
  navigation, 
  openReads, 
  readCounts, 
  setReplyingTo 
}: any) => {
  const isMine = (item.senderID || item.SenderID) === userId;
  const sender = item?.sender || item?.Sender || {};
  const first = sender?.firstName || sender?.FirstName || '';
  const last = sender?.lastName || sender?.LastName || '';
  let displayName = (first + ' ' + last).trim();
  if (isMine) displayName = 'You';
  if (!displayName) displayName = `Member ${item.senderID || item.SenderID}`;
  if (/@/.test(displayName)) displayName = 'Anonymous';
  
  const color = item.color || item.Color || colorByUserId(item.senderID || item.SenderID || 0);
  const created = new Date(item.createdAt || item.CreatedAt || item.created_at);
  const prev = combinedMessages[index - 1];
  const showDay = !prev || new Date(prev?.createdAt || prev?.CreatedAt || prev?.created_at).toDateString() !== created.toDateString();
  const msgId = String(item.id || item.ID);
  const type = item.type || item.Type;
  const previewTitle = item.previewTitle || item.PreviewTitle;
  const previewSubtitle = item.previewSubtitle || item.PreviewSubtitle;
  const previewImage = item.previewImageURL || item.PreviewImageURL;
  const previewDescription = item.previewDescription || item.PreviewDescription;
  const refType = item.refType || item.RefType;
  const refID = item.refID || item.RefID;
  const readCount = readCounts[msgId] || 0;

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
    setReplyingTo(item);
  }, [item, scaleAnim, setReplyingTo]);

  const openLinkedCard = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (refType === 'property' && refID) {
      (navigation as any).navigate('PropertyDetails', { propertyID: Number(refID) });
    } else if (refType === 'experience' && refID) {
      (navigation as any).navigate('ExperienceDetails', { experienceId: Number(refID) });
    }
  }, [refType, refID, navigation]);

  const WUMPUS_STICKER_MARKER = '__LOTTIE_WUMPUS_HI__';
  const LMAO_STICKER_MARKER = '__LOTTIE_LMAO__';
  const TEDDY_STICKER_MARKER = '__LOTTIE_TEDDY__';

  return (
    <View>
      {showDay && (
        <View style={styles.dayWrap}>
          <BlurView intensity={80} tint="light" style={styles.dayBlur}>
            <Text style={styles.dayText}>
              {created.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric', 
                year: created.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
              })}
            </Text>
          </BlurView>
        </View>
      )}
      <Animated.View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft, { transform: [{ scale: scaleAnim }] }]}>
        {!isMine && (
          <View style={[styles.avatar, { backgroundColor: color }]}>
            <Text style={styles.avatarText}>{(displayName || 'U')[0].toUpperCase()}</Text>
          </View>
        )}
        <Pressable 
          onLongPress={handleLongPress}
          style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}
        >
          {!isMine && <Text style={styles.senderName}>{displayName}</Text>}
          {(item.repliedToID || item.RepliedToID) && (
            <View style={[styles.repliedToBubble, { borderLeftColor: color }]}> 
              <Text style={styles.repliedToSender}>{displayName}</Text>
              <Text style={styles.repliedToText} numberOfLines={1}>
                {item.repliedToContent || item.RepliedToContent || item.content || item.Content}
              </Text>
            </View>
          )}
          {(type === 'wishlist' || type === 'share') ? (
            <View style={{ maxWidth: '100%' }}>
              <View style={styles.labelRow}>
                {type === 'wishlist' ? (
                  <Heart size={14} color="#FF5A5F" weight="fill" />
                ) : (
                  <ShareNetwork size={14} color="#222" weight="duotone" />
                )}
                <Text style={styles.labelText}>
                  {(item.content || item.Content) || (type === 'wishlist' ? 'Added to wishlist' : 'Shared a property')}
                </Text>
              </View>
              <View style={styles.connectorDot} />
              <TouchableOpacity activeOpacity={0.85} onPress={openLinkedCard} style={styles.wishlistCard}>
                {previewImage ? (
                  <Image source={{ uri: previewImage }} style={styles.wishlistThumb} />
                ) : (
                  <View style={[styles.wishlistThumb, { backgroundColor: '#F2F2F2' }]} />
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.wishlistTitle} numberOfLines={1}>{previewTitle || 'Wishlist item'}</Text>
                  {!!previewSubtitle && <Text style={styles.wishlistSubtitle} numberOfLines={1}>{previewSubtitle}</Text>}
                  {previewDescription ? (
                    <Text style={styles.wishlistDesc} numberOfLines={2}>{previewDescription}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            (() => {
              const c = item.content || item.Content;
              if (c === WUMPUS_STICKER_MARKER) {
                return (
                  <View style={styles.stickerContainer}>
                    <LottieView 
                      source={require('../assets/lotties/Wumpus-Hi.json')} 
                      autoPlay 
                      loop 
                      style={styles.stickerLarge} 
                    />
                  </View>
                );
              }
              if (c === LMAO_STICKER_MARKER) {
                return (
                  <View style={styles.stickerContainer}>
                    <LottieView 
                      source={require('../assets/lotties/LMAO.json')} 
                      autoPlay 
                      loop 
                      style={styles.stickerLarge} 
                    />
                  </View>
                );
              }
              if (c === TEDDY_STICKER_MARKER) {
                return (
                  <View style={styles.stickerContainer}>
                    <LottieView 
                      source={require('../assets/lotties/Teddy-Bear-laughing.json')} 
                      autoPlay 
                      loop 
                      style={styles.stickerLarge} 
                    />
                  </View>
                );
              }
              return <Text style={[styles.msgText, isMine && { color: '#fff' }]}>{c}</Text>;
            })()
          )}
          <View style={styles.metaRow}>
            <Text style={[styles.time, isMine && { color: '#E8E8E8' }]}>
              {created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isMine && (
              <>
                {readCount > 0 ? (
                  <Checks size={16} color="#00A699" weight="bold" />
                ) : (
                  <Check size={16} color="#E8E8E8" weight="bold" />
                )}
                <TouchableOpacity 
                  style={styles.readsBtn} 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    openReads(Number(item.id || item.ID));
                  }}
                >
                  <Eye size={14} color="#E8E8E8" weight="duotone" />
                  <Text style={styles.readsText}>{readCount}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}, (prevProps, nextProps) => {
  const prevId = prevProps.item.id || prevProps.item.ID;
  const nextId = nextProps.item.id || nextProps.item.ID;
  
  // If IDs don't match, re-render
  if (prevId !== nextId) return false;
  
  // Check if read counts changed
  const prevReadCount = prevProps.readCounts[String(prevId)] || 0;
  const nextReadCount = nextProps.readCounts[String(nextId)] || 0;
  if (prevReadCount !== nextReadCount) return false;
  
  // Check if content changed (for pending messages)
  const prevContent = prevProps.item.content || prevProps.item.Content;
  const nextContent = nextProps.item.content || nextProps.item.Content;
  if (prevContent !== nextContent) return false;
  
  // Check if pending status changed
  if (prevProps.item.isPending !== nextProps.item.isPending) return false;
  
  // All checks passed, skip re-render
  return true;
});

MessageItem.displayName = 'MessageItem';

export default function GroupChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId, title } = route.params as { groupId: number; title?: string };
  const { user } = useUser();
  const { data: messages = [], isLoading: messagesLoading, error: messagesError, refetch: refetchMessages } = useGroupMessages(groupId);
  const sendMessage = useSendMessage(groupId);
  const { typing } = useTyping(groupId);
  
  const { lastMessage, isConnected, sendTyping, sendReadReceipt, sendMessage: wsSend } = useWebSocket(groupId, true, user?.accessToken);
  
  // State Management
  const [liveMessages, setLiveMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const { data: myGroups = [] } = useMyGroups();
  useRegisterPushToken(user?.ID);
  const group = (myGroups || []).find((g: any) => (g.id || g.ID) === groupId) || ({} as any);
  const { data: members = [] } = useGroupMembers(groupId);
  const [readsVisible, setReadsVisible] = useState(false);
  const [reads, setReads] = useState<any[]>([]);
  const [readsLoading, setReadsLoading] = useState(false);
  const [readCounts, setReadCounts] = useState<Record<string, number>>({});
  const readSentSetRef = useRef<Set<string>>(new Set());
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  
  // Refs
  const flatListRef = useRef<FlatList>(null);
  const didInitialScrollRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);
  const listLayoutRef = useRef({ height: 0, contentHeight: 0, offsetY: 0 });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const lastTypingAtRef = useRef<number>(0);

  // Optimized scroll handler
  const scrollToEndSafely = useCallback(() => {
    try { 
      flatListRef.current?.scrollToEnd({ animated: true }); 
    } catch (e) {
      console.error('Scroll error:', e);
    }
  }, []);

  const handleListLayout = useCallback((e: any) => {
    listLayoutRef.current.height = e?.nativeEvent?.layout?.height || 0;
  }, []);

  const handleContentSizeChange = useCallback((w: number, h: number) => {
    listLayoutRef.current.contentHeight = h;
    const nearBottom = (listLayoutRef.current.offsetY + listLayoutRef.current.height) >= (h - 100);
    if (!didInitialScrollRef.current || (shouldAutoScrollRef.current && nearBottom)) {
      // Debounce to prevent rapid scrolls
      setTimeout(() => {
        if (shouldAutoScrollRef.current) {
          scrollToEndSafely();
        }
        didInitialScrollRef.current = true;
      }, 50);
    }
  }, [scrollToEndSafely]);

  const handleListScroll = useCallback((e: any) => {
    const y = e?.nativeEvent?.contentOffset?.y || 0;
    listLayoutRef.current.offsetY = y;
    const nearBottom = (y + listLayoutRef.current.height) >= (listLayoutRef.current.contentHeight - 60);
    shouldAutoScrollRef.current = nearBottom;
  }, []);

  // Backfill on WS connect or screen focus
  useFocusEffect(
    useCallback(() => {
      if (isConnected) {
        try { refetchMessages(); } catch (e) { console.error('Refetch error:', e); }
      }
      return () => {};
    }, [isConnected, refetchMessages])
  );

  // Safety backfill polling (reduced frequency to prevent glitching)
  useFocusEffect(
    useCallback(() => {
      let stopped = false;
      const tick = async () => {
        if (stopped) return;
        try { await refetchMessages(); } catch (e) { console.error('Poll error:', e); }
      };
      // Increased interval from 5s to 15s to reduce glitching
      const interval = setInterval(tick, 15000);
      return () => { stopped = true; clearInterval(interval); };
    }, [refetchMessages])
  );

  // Mark as read on focus
  useFocusEffect(
    useCallback(() => {
      const markRead = async () => {
        try { 
          await AsyncStorage.setItem(`lastRead:${groupId}`, (new Date()).toISOString()); 
        } catch (error) {
          console.error('Failed to mark as read:', error);
        }
      };
      markRead();
      
      // Smooth entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      return () => {
        fadeAnim.setValue(0);
        slideAnim.setValue(50);
      };
    }, [groupId, fadeAnim, slideAnim])
  );

  const colorByUserId = useMemo(() => (uid: number) => {
    return COLORS[uid % COLORS.length];
  }, []);

  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Remove LayoutAnimation to prevent flickering
    
    setMessageError(null);

    const tempId = Date.now();
    const now = new Date().toISOString();
    const optimistic: any = {
      id: `pending_${tempId}`,
      senderID: user?.ID,
      sender: { firstName: user?.firstName, lastName: user?.lastName },
      content,
      createdAt: now,
      color: colorByUserId(user?.ID || 0),
      isPending: true,
    };
    setPendingMessages((prev) => [...prev, optimistic]);
    setText('');
    setReplyingTo(null);
    // Debounce scroll to prevent glitching
    setTimeout(() => {
      if (shouldAutoScrollRef.current) {
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    }, 100);

    const execSend = async () => {
      const color = colorByUserId(user?.ID || 0);
      await sendMessage.mutateAsync({ content, color, ttlSec: 24 * 3600 });
    };

    const softTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('soft-timeout')), 8000));

    try {
      await Promise.race([execSend(), softTimeout]);
      setPendingMessages((prev) => prev.filter((m) => m.id !== `pending_${tempId}`));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const isSoft = (err as any)?.message === 'soft-timeout';
      if (isSoft) {
        setPendingMessages((prev) => prev.map((m) => m.id === `pending_${tempId}` ? { ...m, isPending: true, sendError: false } : m));
        setTimeout(() => { try { refetchMessages(); } catch (e) { console.error('Refetch error:', e); } }, 2000);
      } else {
        setPendingMessages((prev) => prev.map((m) => m.id === `pending_${tempId}` ? { ...m, isPending: false, sendError: true } : m));
        setMessageError('Failed to send message. Tap retry.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [text, user?.ID, user?.firstName, user?.lastName, colorByUserId, sendMessage, refetchMessages]);

  const generateInviteCode = useCallback(async () => {
    try {
      const response = await axios.post(
        `${endpoints.baseURL}/groups/${groupId}/invite-code`,
        {},
        { headers: { Authorization: `Bearer ${user?.accessToken}` } }
      );
      
      const code = response.data.code;
      
      Alert.alert(
        'Invite Code Generated',
        `Share this code with others to join: ${code}`,
        [
          { text: 'Copy', onPress: () => {
            Clipboard.setString(code);
            Alert.alert('Copied!', 'Invite code copied to clipboard');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }},
          { text: 'Done', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Failed to generate invite code:', error);
      Alert.alert('Error', 'Failed to generate invite code. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [groupId, user?.accessToken]);

  const sendTypingDebounced = useCallback((name: string) => {
    const now = Date.now();
    if (now - lastTypingAtRef.current < 1200) return;
    lastTypingAtRef.current = now;
    try { sendTyping(name); } catch (e) { console.error('Typing error:', e); }
  }, [sendTyping]);

  const markRead = useCallback(async (msgId: number) => {
    try { 
      await AsyncStorage.setItem(`lastRead:${groupId}`, (new Date()).toISOString()); 
    } catch (e) { 
      console.error('Mark read error:', e); 
    }
  }, [groupId]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    try {
      for (const v of viewableItems) {
        if (!v?.isViewable) continue;
        const item = v.item;
        const msgId = item?.id || item?.ID;
        const isMine = (item?.senderID || item?.SenderID) === user?.ID;
        if (msgId && !isMine) {
          const key = String(msgId);
          if (!readSentSetRef.current.has(key)) {
            readSentSetRef.current.add(key);
            markRead(Number(msgId));
            sendReadReceipt(Number(msgId));
          }
        }
      }
    } catch (error) {
      console.error('Error in viewable items changed:', error);
    }
  }).current;

  useEffect(() => {
    return () => { readSentSetRef.current.clear(); };
  }, []);

  const viewabilityConfig = useMemo(() => ({ 
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 500 
  }), []);

  const openReads = useCallback(async (msgId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReadsVisible(true);
    setReads([]);
    setReadsLoading(true);
    try {
      const res = await axios.get(
        `${endpoints.baseURL}/groups/${groupId}/messages/${msgId}/reads`,
        { headers: { Authorization: `Bearer ${user?.accessToken}` } }
      );
      const list = res.data?.reads || [];
      setReads(list);
      setReadCounts((prev) => ({ ...prev, [String(msgId)]: list.length }));
    } catch (error) {
      console.error('Failed to fetch reads:', error);
      setReads([]);
    } finally {
      setReadsLoading(false);
    }
  }, [groupId, user?.accessToken]);

  const EMOJIS = useMemo(() => [
    "😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😍","😘","😗","😙","😚","🙂","🤗","🤩","🤔","🤨","😐","😑","😶","🙄","😏","😣","😥","😮","🤐","😯","😪","😫","🥱","😴","😌","😛","😜","😝","🤤","😒","😓","😔","😕","🙃",
    "👍","👎","👌","✌️","🤞","🤟","🤘","🤙","👋","🤚","✋","🖐️","🖖","👏","🙌","👐","🤲","🙏","💪","🦾",
    "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟",
    "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵",
    "🍎","🍊","🍌","🍉","🍇","🍓","🫐","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🥑",
    "⚽","🏀","🏈","⚾","🎾","🏐","🏉","🎱","🏓","🏸","🥅","⛳","🥊","🥋","🎿",
    "✈️","🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚚","🚲","🛴","🛵","🏍️",
    "⌚","📱","💻","⌨️","🖥️","🖨️","🖱️","💽","💾","💿","📷","🎥","📺","📻","🎧","🎤",
    "⏰","🎉","🎁","🎈","📦","📌","📎","✂️","🗂️","📅","📖","✏️","🖊️","🖌️","📐","📏",
    "✅","❌","⚠️","‼️","❗","❓","➕","➖","➗","♻️","🔞","🔒","🔓","🔑","🧭",
  ], []);

  const appendEmoji = useCallback((emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setText((t) => t + emoji);
    setShowEmoji(false);
  }, []);

  const WUMPUS_STICKER_MARKER = '__LOTTIE_WUMPUS_HI__';
  const LMAO_STICKER_MARKER = '__LOTTIE_LMAO__';
  const TEDDY_STICKER_MARKER = '__LOTTIE_TEDDY__';

  const sendSticker = useCallback(async (marker: string) => {
    const now = Date.now();
    const fnKey = `_last_${marker}`;
    (sendSticker as any)[fnKey] = (sendSticker as any)[fnKey] || 0;
    if (now - (sendSticker as any)[fnKey] < 600) return;
    (sendSticker as any)[fnKey] = now;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const tempId = Date.now();
    const optimistic: any = {
      id: `pending_${tempId}`,
      senderID: user?.ID,
      sender: { firstName: user?.firstName, lastName: user?.lastName },
      content: marker,
      createdAt: new Date().toISOString(),
      color: colorByUserId(user?.ID || 0),
      isPending: true,
    };
    setPendingMessages((prev) => [...prev, optimistic]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    const execSend = async () => {
      const color = colorByUserId(user?.ID || 0);
      await sendMessage.mutateAsync({ content: marker, color, ttlSec: 24 * 3600 });
    };
    const softTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('soft-timeout')), 5000));
    try {
      await Promise.race([execSend(), softTimeout]);
      setPendingMessages((prev) => prev.filter((m) => m.id !== `pending_${tempId}`));
    } catch (error) {
      setPendingMessages((prev) => prev.map((m) => m.id === `pending_${tempId}` ? { ...m, isPending: false, sendError: true } : m));
    }
  }, [colorByUserId, user?.ID, sendMessage]);

  // WebSocket message handler
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'message':
        if (lastMessage.message) {
          // Remove LayoutAnimation to prevent flickering
          setLiveMessages((prev) => {
            const id = lastMessage.message.id || lastMessage.message.ID;
            if (id && prev.some((m) => (m.id || m.ID) === id)) return prev;
            return [...prev, lastMessage.message];
          });
          try {
            const deliveredId = Number(lastMessage.message.id || lastMessage.message.ID);
            if (Number.isFinite(deliveredId)) {
              wsSend('delivered', { messageId: deliveredId });
            }
          } catch (e) { console.error('Delivered ack error:', e); }
          try {
            const deliveredSenderId = lastMessage.message.senderID || lastMessage.message.SenderID;
            const deliveredContent = lastMessage.message.content || lastMessage.message.Content;
            setPendingMessages((prev) => prev.filter((m) => {
              const sameSender = (m.senderID || m.SenderID) === deliveredSenderId;
              const sameContent = (m.content || m.Content) === deliveredContent;
              return !(sameSender && sameContent);
            }));
          } catch (e) { console.error('Pending cleanup error:', e); }
          // Debounce scroll to prevent multiple rapid scrolls
          setTimeout(() => {
            if (shouldAutoScrollRef.current) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }, 100);
        }
        break;
      case 'typing':
        console.log('⌨️ Typing event received');
        break;
      case 'read_receipt':
        if (lastMessage.data?.messageId) {
          setReadCounts(prev => ({
            ...prev,
            [String(lastMessage.data.messageId)]: (prev[String(lastMessage.data.messageId)] || 0) + 1
          }));
        }
        break;
      default:
        console.log('❓ Unknown message type:', lastMessage.type);
    }
  }, [lastMessage, wsSend]);

  // Combined messages with deduplication and sorting
  const combinedMessages = useMemo(() => {
    const base = Array.isArray(messages) ? messages : [];
    const live = Array.isArray(liveMessages) ? liveMessages : [];
    const pend = Array.isArray(pendingMessages) ? pendingMessages : [];
    const seen = new Set<string | number>();
    const out: any[] = [];
    
    // Add base messages
    for (const m of base) {
      const id = m?.id || m?.ID;
      if (id) seen.add(id);
      out.push(m);
    }
    
    // Add live messages (avoid duplicates)
    for (const m of live) {
      const id = m?.id || m?.ID;
      if (id == null || seen.has(id)) continue;
      seen.add(id);
      out.push(m);
    }
    
    // Add pending messages (these don't have IDs yet)
    for (const m of pend) {
      out.push(m);
    }
    
    // Sort by timestamp to ensure correct order
    return out.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.CreatedAt || a.created_at || 0).getTime();
      const timeB = new Date(b.createdAt || b.CreatedAt || b.created_at || 0).getTime();
      return timeA - timeB;
    });
  }, [messages, liveMessages, pendingMessages]);

  const renderItem = useCallback(({ item, index }: any) => (
    <MessageItem 
      item={item} 
      index={index}
      userId={user?.ID}
      colorByUserId={colorByUserId}
      combinedMessages={combinedMessages}
      navigation={navigation}
      openReads={openReads}
      readCounts={readCounts}
      setReplyingTo={setReplyingTo}
    />
  ), [user?.ID, colorByUserId, combinedMessages, navigation, openReads, readCounts]);

  const handleInputFocus = useCallback(() => {
    Animated.timing(inputFocusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    sendTypingDebounced(user?.firstName || 'You');
  }, [inputFocusAnim, sendTypingDebounced, user?.firstName]);

  const handleInputBlur = useCallback(() => {
    Animated.timing(inputFocusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [inputFocusAnim]);

  const inputBorderColor = inputFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F0F0F0', '#FF5A5F']
  });

  if (messagesError) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Warning size={64} color="#FF5A5F" weight="duotone" />
          <Text style={styles.errorTitle}>Connection Issue</Text>
          <Text style={styles.errorText}>We couldn't load your messages. Please check your internet connection.</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.goBack();
            }}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Modern Header */}
        <BlurView intensity={95} tint="light" style={styles.headerBlur}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
            >
              <ArrowLeft size={24} color="#222" weight="bold" />
            </TouchableOpacity>
            
            <View style={styles.avatarGroup}>
              <Image 
                source={{ uri: group?.photoURL || group?.PhotoURL || 'https://via.placeholder.com/64x64?text=GP' }} 
                style={styles.groupAvatar}
              />
              {isConnected && (
                <View style={styles.onlineDot} />
              )}
            </View>
            
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {title || group?.name || group?.Name || 'Group chat'}
              </Text>
              <View style={styles.memberRow}>
                <Text style={styles.memberLine} numberOfLines={1}>
                  {members.length} members
                </Text>
                {typing.length > 0 && (
                  <>
                    <View style={styles.dot} />
                    <Text style={styles.typingIndicator}>typing...</Text>
                  </>
                )}
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.heartBtn} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                (navigation as any).navigate('GroupWishlist', { groupId, title: 'Shared wishlist' });
              }}
            >
              <Heart size={20} color="#FF5A5F" weight="fill" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuBtn} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowGroupMenu(true);
              }}
            >
              <DotsThreeVertical size={20} color="#222" weight="bold" />
            </TouchableOpacity>
          </View>
        </BlurView>

        {messagesLoading ? (
          <View style={styles.loadingContainer}>
            <LottieView
              source={require('../assets/lotties/Loading.json')}
              autoPlay
              loop
              style={styles.loadingAnimation}
            />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : combinedMessages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Heart size={80} color="#FFE5E5" weight="fill" />
            </View>
            <Text style={styles.emptyTitle}>Start the Conversation</Text>
            <Text style={styles.emptyText}>
              Share travel plans, coordinate bookings, and make memories together
            </Text>
            <View style={styles.emptyStickerWrap}>
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => sendSticker(WUMPUS_STICKER_MARKER)} 
                disabled={sendingMessage}
              >
                <LottieView
                  source={require('../assets/lotties/Wumpus-Hi.json')}
                  autoPlay
                  loop
                  style={styles.emptySticker}
                />
              </TouchableOpacity>
              <Text style={styles.emptyStickerHint}>Tap to send a sticker</Text>
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={combinedMessages}
            keyExtractor={(m: any, idx) => String(m.id || m.ID || m.tempId || `msg_${idx}`)}
            contentContainerStyle={styles.messagesList}
            renderItem={renderItem}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={21}
            removeClippedSubviews={Platform.OS === 'android'}
            showsVerticalScrollIndicator={false}
            onLayout={handleListLayout}
            onContentSizeChange={handleContentSizeChange}
            onScroll={handleListScroll}
            scrollEventThrottle={16}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10
            }}
          />
        )}

        {messageError && (
          <Animated.View style={styles.errorBanner}>
            <BlurView intensity={80} tint="light" style={styles.errorBannerBlur}>
              <Warning size={18} color="#FF5A5F" weight="bold" />
              <Text style={styles.errorBannerText}>{messageError}</Text>
              <TouchableOpacity 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMessageError(null);
                }}
              >
                <X size={20} color="#FF5A5F" weight="bold" />
              </TouchableOpacity>
            </BlurView>
          </Animated.View>
        )}

        {/* Reply indicator */}
        {replyingTo && (
          <Animated.View style={styles.replyIndicator}>
            <BlurView intensity={80} tint="light" style={styles.replyIndicatorBlur}>
              <View style={styles.replyIndicatorContent}>
                <Text style={styles.replyIndicatorLabel}>Replying to</Text>
                <Text style={styles.replyIndicatorText} numberOfLines={1}>
                  {replyingTo.content || replyingTo.Content}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Remove LayoutAnimation to prevent flickering
                  setReplyingTo(null);
                }} 
                style={styles.replyIndicatorClose}
              >
                <X size={18} color="#777" weight="bold" />
              </TouchableOpacity>
            </BlurView>
          </Animated.View>
        )}

        {/* Modern Sticker Bar */}
        <View style={styles.stickerBar}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stickerBarContent}
          >
            <TouchableOpacity 
              style={styles.stickerBtn} 
              onPress={() => sendSticker(LMAO_STICKER_MARKER)} 
              disabled={sendingMessage}
            >
              <LottieView 
                source={require('../assets/lotties/LMAO.json')} 
                autoPlay 
                loop 
                style={styles.stickerLottie} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.stickerBtn} 
              onPress={() => sendSticker(WUMPUS_STICKER_MARKER)} 
              disabled={sendingMessage}
            >
              <LottieView 
                source={require('../assets/lotties/Wumpus-Hi.json')} 
                autoPlay 
                loop 
                style={styles.stickerLottie} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.stickerBtn} 
              onPress={() => sendSticker(TEDDY_STICKER_MARKER)} 
              disabled={sendingMessage}
            >
              <LottieView 
                source={require('../assets/lotties/Teddy-Bear-laughing.json')} 
                autoPlay 
                loop 
                style={styles.stickerLottie} 
              />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Modern Input Composer */}
        <BlurView intensity={95} tint="light" style={styles.composerBlur}>
          <View style={styles.composer}>
           
            
            <Animated.View style={[styles.inputWrapper, { borderColor: inputBorderColor }]}>
              <TextInput
                style={[styles.input, sendingMessage && styles.inputDisabled]}
                placeholder="Message..."
                placeholderTextColor="#AAAAAA"
                value={text}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onChangeText={(v) => { 
                  setText(v); 
                  if (v.length > 0) {
                    sendTypingDebounced(user?.firstName || 'You');
                  }
                }}
                editable={!sendingMessage}
                multiline
                maxLength={2000}
              />
              <TouchableOpacity 
                style={styles.emojiBtn} 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowEmoji(true);
                }}
                disabled={sendingMessage}
              >
                <Smiley size={22} color={sendingMessage ? "#CCC" : "#222"} weight="duotone" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sendBtn, (!text.trim() || sendingMessage) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!text.trim() || sendingMessage}
                accessibilityLabel="Send message"
                accessibilityHint="Sends your message to the chat"
              >
                <PaperPlaneTilt size={18} color="#fff" weight="fill" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </BlurView>

        {/* Emoji Picker Bottom Sheet */}
        <BottomSheet visible={showEmoji} onClose={() => setShowEmoji(false)}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Emoji</Text>
            <TouchableOpacity onPress={() => setShowEmoji(false)}>
              <X size={24} color="#222" weight="bold" />
            </TouchableOpacity>
          </View>
          <ScrollView 
            contentContainerStyle={styles.emojiGrid} 
            showsVerticalScrollIndicator={false}
          >
            {EMOJIS.map((e, idx) => (
              <TouchableOpacity 
                key={`${e}-${idx}`} 
                style={styles.emojiCell}
                onPress={() => appendEmoji(e)}
              >
                <Text style={styles.emojiText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BottomSheet>

        {/* Reads Bottom Sheet */}
        <BottomSheet visible={readsVisible} onClose={() => setReadsVisible(false)}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Seen by</Text>
            <TouchableOpacity onPress={() => setReadsVisible(false)}>
              <X size={24} color="#222" weight="bold" />
            </TouchableOpacity>
          </View>
          {readsLoading ? (
            <View style={styles.sheetLoading}>
              <ActivityIndicator size="large" color="#FF5A5F" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : reads.length === 0 ? (
            <View style={styles.sheetEmpty}>
              <Eye size={48} color="#E0E0E0" weight="duotone" />
              <Text style={styles.emptyReadsText}>No one has seen this yet</Text>
            </View>
          ) : (
            <ScrollView style={styles.readsScroll} contentContainerStyle={styles.readsContent}>
              {reads.map((r: any, idx: number) => (
                <View key={`${r.UserID}_${r.ReadAt}_${idx}`} style={styles.readRow}>
                  <Image 
                    source={{ uri: r.AvatarURL || 'https://i.pravatar.cc/100' }} 
                    style={styles.readAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.readName}>
                      {`${r.FirstName || ''} ${r.LastName || ''}`.trim() || `User ${r.UserID}`}
                    </Text>
                    <Text style={styles.readTime}>
                      {new Date(r.ReadAt).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                  <Checks size={22} color="#00A699" weight="fill" />
                </View>
              ))}
            </ScrollView>
          )}
        </BottomSheet>

        {/* Group Menu Bottom Sheet */}
        <BottomSheet visible={showGroupMenu} onClose={() => setShowGroupMenu(false)}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Group Settings</Text>
            <TouchableOpacity onPress={() => setShowGroupMenu(false)}>
              <X size={24} color="#222" weight="bold" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowGroupMenu(false);
              (navigation as any).navigate('GroupMembers', { groupId });
            }}
          >
            <View style={styles.menuIconContainer}>
              <UserMinus size={22} color="#222" weight="duotone" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemText}>Manage Members</Text>
              <Text style={styles.menuItemSubtext}>View and manage group members</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowGroupMenu(false);
              generateInviteCode();
            }}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#E6F7F5' }]}>
              <LockKey size={22} color="#00A699" weight="duotone" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemText}>Invite Members</Text>
              <Text style={styles.menuItemSubtext}>Generate an invite code</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, styles.menuItemDanger]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowGroupMenu(false);
              Alert.alert(
                'Leave Group',
                'Are you sure you want to leave this group?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Leave', 
                    style: 'destructive',
                    onPress: () => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                      // Handle leave group logic
                    }
                  }
                ]
              );
            }}
          >
            <View style={[styles.menuIconContainer, styles.menuIconDanger]}>
              <SignOut size={22} color="#FF5A5F" weight="duotone" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Leave Group</Text>
              <Text style={styles.menuItemSubtext}>Exit this group permanently</Text>
            </View>
          </TouchableOpacity>
        </BottomSheet>

        {/* Media Picker Bottom Sheet */}
        <BottomSheet visible={showMediaPicker} onClose={() => setShowMediaPicker(false)}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Send Media</Text>
            <TouchableOpacity onPress={() => setShowMediaPicker(false)}>
              <X size={24} color="#222" weight="bold" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.mediaOption}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowMediaPicker(false);
              Alert.alert('Photo', 'Photo picker coming soon!');
            }}
          >
            <View style={[styles.mediaIconContainer, { backgroundColor: '#FFE5E5' }]}>
              <ImageIcon size={24} color="#FF5A5F" weight="duotone" />
            </View>
            <Text style={styles.mediaOptionText}>Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.mediaOption}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowMediaPicker(false);
              Alert.alert('Camera', 'Camera coming soon!');
            }}
          >
            <View style={[styles.mediaIconContainer, { backgroundColor: '#E6F7F5' }]}>
              <Camera size={24} color="#00A699" weight="duotone" />
            </View>
            <Text style={styles.mediaOptionText}>Camera</Text>
          </TouchableOpacity>
        </BottomSheet>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FAFAFA' 
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginRight: 12,
  },
  avatarGroup: {
    position: 'relative',
  },
  groupAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00D1C1',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#000', 
    letterSpacing: -0.4 
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  memberLine: { 
    fontSize: 13, 
    color: '#8E8E93', 
    fontWeight: '500' 
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#8E8E93',
    marginHorizontal: 6,
  },
  typingIndicator: {
    fontSize: 13,
    color: '#00A699',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  heartBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginLeft: 8,
    backgroundColor: 'rgba(255, 90, 95, 0.1)',
  },
  menuBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(0,0,0,0.05)', 
    marginLeft: 8,
  },
  msgRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    marginBottom: 16, 
    paddingHorizontal: 16 
  },
  msgRowLeft: { 
    justifyContent: 'flex-start' 
  },
  msgRowRight: { 
    justifyContent: 'flex-end', 
    alignSelf: 'flex-end' 
  },
  avatar: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 13 
  },
  senderName: { 
    fontSize: 12, 
    color: '#8E8E93', 
    marginBottom: 4, 
    fontWeight: '600' 
  },
  bubble: { 
    maxWidth: '82%', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleOther: { 
    backgroundColor: '#FFFFFF', 
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)'
  },
  bubbleMine: { 
    backgroundColor: '#111111',
    borderTopRightRadius: 4,
  },
  msgText: { 
    color: '#000', 
    fontSize: 16, 
    lineHeight: 22, 
    letterSpacing: -0.2 
  },
  metaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginTop: 4 
  },
  time: { 
    fontSize: 11, 
    color: '#8E8E93', 
    fontWeight: '500' 
  },
  readsBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 3 
  },
  readsText: { 
    fontSize: 11, 
    color: '#E8E8E8', 
    fontWeight: '600' 
  },
  composerBlur: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  composer: { 
    flexDirection: 'row', 
    alignItems: 'flex-end',
    padding: 12, 
    paddingBottom: Platform.OS === 'ios' ? 44 : 44,
    backgroundColor: 'transparent',
  },
  mediaBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginRight: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: { 
    flex: 1,
    minHeight: 20,
    maxHeight: 100,
    fontSize: 16,
    color: '#000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  inputPlaceholder: {
    fontSize: 16,
    color: '#8E8E93',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: '#007AFF',
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  sendIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  commentList: {
    flex: 1,
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  commentBubble: {
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    alignSelf: 'flex-start',
    maxWidth: '88%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  commentAuthor: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 15,
    color: '#181818'
  },
  commentTimestamp: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 3,
    alignSelf: 'flex-end'
  },
  likeBtn: {
    marginLeft: 16,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255,149,0,0.12)'
  },
  likeBtnIcon: {
    color: '#FF9500',
    fontSize: 17,
    marginRight: 2,
  },
  liked: {
    backgroundColor: 'rgba(255,149,0,0.22)'
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderColor: '#ECECEC',
  },
  commentInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 92,
    backgroundColor: '#F3F3F3',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 15,
    color: '#222',
  },
  sendBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  bottomSafeSpacer: {
    height: 16,
  },
  username: {
    fontWeight: '500',
    fontSize: 15,
    color: '#222',
    marginRight: 4,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeCount: {
    color: '#FF9500',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  comment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  commentTime: {
    color: '#AAA',
    fontSize: 12,
    marginLeft: 8,
  },
  profilePic: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    backgroundColor: '#EEE',
  },
  contentOverlay: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(250,250,250,0.85)',
    paddingTop: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '52%',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 6,
    marginHorizontal: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F8',
    marginRight: 8,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    opacity: 0.7,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 8,
  },
  dayWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  dayBlur: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(240, 240, 240, 0.9)',
    overflow: 'hidden',
  },
  dayText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  repliedToBubble: {
    backgroundColor: '#F5F5F8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    alignSelf: 'flex-start',
    maxWidth: '88%',
  },
  repliedToSender: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  repliedToText: {
    fontSize: 15,
    color: '#181818'
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  labelText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  connectorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8E8E93',
    marginRight: 8,
  },
  wishlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  wishlistThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F2F2F2',
  },
  wishlistTitle: {
    fontSize: 14,
    color: '#222',
    fontWeight: '500',
    marginRight: 8,
  },
  wishlistMeta: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  wishlistSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  wishlistDesc: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  stickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  stickerLarge: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
  },
  stickerSmall: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#F2F2F2',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorTitle: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 8,
  },
  mediaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F5F5F8',
  },
  mediaOptionText: {
    fontSize: 14,
    color: '#222',
    fontWeight: '500',
  },
  mediaIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
// MISSING/NON-REDUNDANT STYLES ONLY

// Style for chat message input box
inputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 8,
  backgroundColor: '#F7F7FA',
  borderTopWidth: 1,
  borderTopColor: '#ECECEC',
},

textInput: {
  flex: 1,
  height: 40,
  borderWidth: 1,
  borderColor: '#ECECEC',
  borderRadius: 20,
  paddingHorizontal: 16,
  fontSize: 15,
  backgroundColor: '#fff',
  marginRight: 8,
},

// Send button style
sendButton: {
  backgroundColor: '#007AFF',
  borderRadius: 20,
  paddingHorizontal: 16,
  paddingVertical: 8,
  justifyContent: 'center',
  alignItems: 'center',
},

sendButtonText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 15,
},

// Style for each message bubble
messageBubble: {
  maxWidth: '80%',
  borderRadius: 16,
  padding: 10,
  marginBottom: 6,
},

myMessage: {
  alignSelf: 'flex-end',
  backgroundColor: '#DCF8C6',
},

otherMessage: {
  alignSelf: 'flex-start',
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#ECECEC',
},

// Username/title above messages
usernameText: {
  fontSize: 13,
  color: '#888',
  fontWeight: '500',
  marginBottom: 2,
},

// Timestamp style
timestamp: {
  fontSize: 11,
  color: '#AAA',
  marginTop: 2,
  alignSelf: 'flex-end',
},

// Empty state (empty chat) indicator style
emptyStateContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 32,
},

emptyStateText: {
  color: '#9C9C9C',
  fontSize: 16,
  textAlign: 'center',
},

// Chat image style
chatImage: {
  width: 180,
  height: 180,
  borderRadius: 12,
  marginTop: 4,
},

// Group chat header
headerContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 16,
  backgroundColor: '#F7F7FA',
  borderBottomWidth: 1,
  borderBottomColor: '#ECECEC',
},

headerAvatar: {
  width: 36,
  height: 36,
  borderRadius: 18,
  marginRight: 12,
},
replyIndicatorClose: {
  position: 'absolute',
  top: 0,
  right: 0,
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
},
replyIndicatorCloseText: {
  color: '#fff',
  fontSize: 12,
  fontWeight: '600',
},
replyIndicatorCloseIcon: {
  color: '#fff',
  fontSize: 20,
  fontWeight: '600',
},
replyIndicator: {
  position: 'absolute',
  bottom: Platform.OS === 'ios' ? 104 : 104,
  left: 0,
  right: 0,
  zIndex: 999,
},
replyIndicatorBlur: {
  paddingHorizontal: 16,
  paddingVertical: 10,
  backgroundColor: 'rgba(249, 249, 250, 0.95)',
},
replyIndicatorContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 12,
  backgroundColor: '#F7F7FA',
},
replyIndicatorLabel: {
  fontSize: 13,
  color: '#8E8E93',
  fontWeight: '500',
},
replyIndicatorText: {
  fontSize: 15,
  color: '#222',
  fontWeight: '500',
},
sheetHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 12,
  backgroundColor: '#F7F7FA',
  borderBottomWidth: 1,
  borderBottomColor: '#ECECEC',
},
sheetTitle: {
  fontSize: 16,
  color: '#222',
  fontWeight: '600',
},
sheetClose: {
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
},
sheetCloseIcon: {
  color: '#222',
  fontSize: 20,
  fontWeight: '600',
},
sheetCloseText: {
  color: '#222',
  fontSize: 12,
  fontWeight: '600',
},
loadingContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
loadingAnimation: {
  width: 120,
  height: 120,
},
errorText: {
  color: '#8E8E93',
  fontSize: 14,
  marginTop: 8,
},
retryButton: {
  backgroundColor: '#007AFF',
  borderRadius: 20,
  paddingHorizontal: 16,
  paddingVertical: 8,
  justifyContent: 'center',
  alignItems: 'center',
},
retryButtonText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 15,
},
emptyContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
emptyIconWrap: {
  width: 64,
  height: 64,
  borderRadius: 32,
  backgroundColor: '#F2F2F2',
  justifyContent: 'center',
  alignItems: 'center',
},
emptyTitle: {
  fontSize: 16,
  color: '#222',
  fontWeight: '600',
  marginTop: 16,
},
emptyText: {
  fontSize: 14,
  color: '#8E8E93',
  marginTop: 4,
  textAlign: 'center',
},
emptyStickerWrap: {
  width: 64,
  height: 64,
  borderRadius: 32,
  backgroundColor: '#F2F2F2',
  justifyContent: 'center',
},
emptySticker: {
  width: 64,
  height: 64,
  borderRadius: 10,
  backgroundColor: '#F2F2F2',
},
emptyStickerHint: {
  fontSize: 12,
  color: '#8E8E93',
  fontWeight: '500',
},
stickerBar: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
},
stickerBarContent: {
  paddingHorizontal: 8,
},
stickerBtn: {
  width: 48,
  height: 48,
  borderRadius: 8,
  backgroundColor: '#F2F2F2',
},
stickerLottie: {
  width: 48,
  height: 48,
},
inputDisabled: {
  opacity: 0.5,
},
emojiBtn: {
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
},
menuItem: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#ECECEC',
},
menuItemText: {
  fontSize: 14,
  color: '#222',
  fontWeight: '500',
},
menuItemSubtext: {
  fontSize: 12,
  color: '#8E8E93',
  fontWeight: '500',
},
menuItemDanger: {
  backgroundColor: '#FFE5E5',
},
menuItemTextDanger: {
  color: '#FF5A5F',
},
emojiGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  padding: 8,
},
emojiCell: {
  width: 48,
  height: 48,
  borderRadius: 8,
  backgroundColor: '#F2F2F2',
},
emojiText: {
  fontSize: 12,
  color: '#222',
  fontWeight: '500',
},
sheetLoading: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
errorBanner: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
},
errorBannerBlur: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 100,
  backgroundColor: 'rgba(255,255,255,0.8)',
},
errorBannerText: {
  color: '#8E8E93',
  fontSize: 14,
  marginTop: 8,
},
sendBtnDisabled: {
  opacity: 0.5,
},
micBtn: {
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
},
menuIconContainer: {
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
},
menuIconDanger: {
  backgroundColor: '#FFE5E5',
},
menuIconTextDanger: {
  color: '#FF5A5F',
},
menuIconSubtextDanger: {
  color: '#FF5A5F',
},
sheetEmpty: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
emptyReadsText: {
  fontSize: 12,
  color: '#8E8E93',
  fontWeight: '500',
},
readsScroll: {
  flex: 1,
  backgroundColor: 'transparent',
},
readsContent: {
  paddingHorizontal: 12,
  paddingVertical: 8,
},
readRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 4,
},
readAvatar: {
  width: 32,
  height: 32,
  borderRadius: 16,
  marginRight: 8,
},
readName: {
  fontSize: 13,
  color: '#222',
  fontWeight: '500',
},
readTime: {
  fontSize: 11,
  color: '#8E8E93',
  fontWeight: '500',
},
messagesList: {
  paddingHorizontal: 16,
  paddingTop: 16,
  paddingBottom: 120,
},
})