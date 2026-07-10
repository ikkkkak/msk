import React, { useRef, useState } from "react";
import { View, StyleSheet, Dimensions, FlatList, TouchableOpacity, Image, Modal, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { Text } from "@ui-kitten/components";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Video } from "expo-av";
import * as Haptics from "expo-haptics";
import { useLikedVideosQuery } from "../hooks/queries/useVideoFeedQuery";
import { useLikeVideoMutation, useUnlikeVideoMutation, useSaveVideoMutation, useUnsaveVideoMutation, useCreateVideoCommentMutation } from "../hooks/mutations/useVideoMutations";
import { Video as VideoType } from "../types/video";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

const { height, width } = Dimensions.get("window");

export const LikedVideosScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { data: videos = [] } = useLikedVideosQuery();
  const like = useLikeVideoMutation();
  const unlike = useUnlikeVideoMutation();
  const save = useSaveVideoMutation();
  const unsave = useUnsaveVideoMutation();
  const createComment = useCreateVideoCommentMutation();

  const videoRefs = useRef<Array<Video | null>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState<Record<number, boolean>>({});
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [likesCount, setLikesCount] = useState<Record<number, number>>({});
  const [savesCount, setSavesCount] = useState<Record<number, number>>({});
  const [likePending, setLikePending] = useState<Record<number, boolean>>({});
  const [savePending, setSavePending] = useState<Record<number, boolean>>({});
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentVideoId, setCommentVideoId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

  const viewabilityConfig = { itemVisiblePercentThreshold: 80 } as const;
  const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
    if (viewableItems?.length > 0) {
      const idx = viewableItems[0].index ?? 0;
      setCurrentIndex(idx);
      videoRefs.current.forEach((ref, i) => {
        if (!ref) return;
        if (i === idx) ref.playAsync().catch(() => {});
        else ref.pauseAsync().catch(() => {});
      });
    }
  }).current;

  const handleTogglePlay = (index: number) => {
    const ref = videoRefs.current[index];
    if (!ref) return;
    const isPaused = paused[index];
    if (isPaused) ref.playAsync().catch(() => {});
    else ref.pauseAsync().catch(() => {});
    setPaused((p) => ({ ...p, [index]: !isPaused }));
  };

  const handleToggleMute = () => setMuted((m) => !m);

  const handleLike = (id: number, baseCount: number) => {
    if (likePending[id]) return;
    setLikePending((p) => ({ ...p, [id]: true }));
    const alreadyLiked = !!liked[id];
    const current = likesCount[id] ?? baseCount;
    setLiked((m) => ({ ...m, [id]: !alreadyLiked }));
    setLikesCount((m) => ({ ...m, [id]: alreadyLiked ? Math.max(current - 1, 0) : current + 1 }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    (alreadyLiked ? unlike.mutateAsync(id) : like.mutateAsync(id)).finally(() => setLikePending((p) => ({ ...p, [id]: false })));
  };

  const handleSave = (id: number, baseCount: number) => {
    if (savePending[id]) return;
    setSavePending((p) => ({ ...p, [id]: true }));
    const alreadySaved = !!saved[id];
    const current = savesCount[id] ?? baseCount;
    setSaved((m) => ({ ...m, [id]: !alreadySaved }));
    setSavesCount((m) => ({ ...m, [id]: alreadySaved ? Math.max(current - 1, 0) : current + 1 }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    (alreadySaved ? unsave.mutateAsync(id) : save.mutateAsync(id)).finally(() => setSavePending((p) => ({ ...p, [id]: false })));
  };

  const renderItem = ({ item, index }: { item: VideoType; index: number }) => (
    <View style={styles.page}>
      <TouchableOpacity activeOpacity={1} style={styles.fill} onPress={() => handleTogglePlay(index)}>
        <Video
          ref={(r) => (videoRefs.current[index] = r)}
          source={{ uri: item.videoURL }}
          style={styles.video}
          resizeMode="cover"
          shouldPlay={index === currentIndex && !paused[index]}
          isLooping
          isMuted={muted}
        />
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleLike(item.ID, item.likesCount)} style={styles.actionButton} disabled={!!likePending[item.ID]}>
          <MaterialCommunityIcons name={liked[item.ID] ? "heart" : "heart-outline"} size={28} color={liked[item.ID] ? "#FF385C" : "#FFFFFF"} />
          <Text style={styles.actionText}>{likesCount[item.ID] ?? item.likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setCommentVideoId(item.ID); setCommentsVisible(true); }} style={styles.actionButton}>
          <MaterialCommunityIcons name="comment" size={28} color="#FFFFFF" />
          <Text style={styles.actionText}>{item.commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleSave(item.ID, item.savesCount)} style={styles.actionButton} disabled={!!savePending[item.ID]}>
          <MaterialCommunityIcons name={saved[item.ID] ? "bookmark" : "bookmark-outline"} size={28} color={saved[item.ID] ? "#FFC107" : "#FFFFFF"} />
          <Text style={styles.actionText}>{savesCount[item.ID] ?? item.savesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleToggleMute} style={[styles.actionButton, { marginTop: 16 }]}>
          <MaterialCommunityIcons name={muted ? "volume-mute" : "volume-high"} size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {item.property && (
        <TouchableOpacity style={styles.propertyCard} onPress={() => navigation.navigate("PropertyDetails" as never, { propertyID: item.property.ID } as never)}>
          {Array.isArray(item.property.images) && item.property.images.length > 0 ? (
            <Image source={{ uri: item.property.images[0] }} style={styles.propertyImage} />
          ) : (
            <View style={styles.propertyImagePlaceholder} />
          )}
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyTitle} numberOfLines={1}>{item.property.title}</Text>
            <Text style={styles.propertyMeta} numberOfLines={1}>{item.property.city}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <>
      <View style={{ position: 'absolute', top: 50, left: 16, right: 16, zIndex: 2, alignItems: 'center' }}>
        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>{t('video.likedVideos', 'فيديوهات معجب بها')}</Text>
      </View>
      <FlatList
        data={videos}
        renderItem={renderItem}
        keyExtractor={(i) => i.ID.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig as any}
      />

      <Modal visible={commentsVisible} transparent animationType="slide" onRequestClose={() => setCommentsVisible(false)}>
        <View style={styles.commentsOverlay}>
          <View style={styles.commentsSheet}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>{t('video.comments', 'تعليقات')}</Text>
              <TouchableOpacity onPress={() => setCommentsVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#222" />
              </TouchableOpacity>
            </View>
            <View style={styles.commentsListPlaceholder}>
              <Text style={{ color: '#717171' }}>{t('video.noComments', 'لا توجد تعليقات')}</Text>
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={styles.commentInputRow}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder={t('video.addCommentPlaceholder', 'أضف تعليق...')}
                  placeholderTextColor="#9CA3AF"
                  style={styles.commentInput}
                />
                <TouchableOpacity
                  style={styles.commentSend}
                  onPress={async () => {
                    if (!commentVideoId || !commentText.trim()) return;
                    await createComment.mutateAsync({ videoID: commentVideoId, content: commentText.trim() });
                    setCommentText("");
                  }}
                >
                  <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  page: { height, width, backgroundColor: "#000" },
  fill: { flex: 1 },
  video: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  actions: { position: "absolute", right: 12, bottom: 120, alignItems: "center" },
  actionButton: { alignItems: "center", marginVertical: 8 },
  actionText: { color: "#FFFFFF", marginTop: 4 },
  propertyCard: { position: "absolute", left: 12, bottom: 24, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 12, padding: 8 },
  propertyImage: { width: 44, height: 44, borderRadius: 8 },
  propertyImagePlaceholder: { width: 44, height: 44, borderRadius: 8, backgroundColor: "#EAEAEA" },
  propertyInfo: { marginLeft: 8, maxWidth: width * 0.6 },
  propertyTitle: { color: "#222222", fontWeight: "700" },
  propertyMeta: { color: "#717171", marginTop: 2 },
  commentsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  commentsSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: height * 0.6, paddingBottom: 8 },
  commentsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  commentsTitle: { fontSize: 16, fontWeight: '700', color: '#222222' },
  commentsListPlaceholder: { padding: 16 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  commentInput: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, color: '#111827' },
  commentSend: { backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
});


