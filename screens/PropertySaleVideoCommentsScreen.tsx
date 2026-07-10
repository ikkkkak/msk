import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Keyboard,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, ChatCircle } from "phosphor-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { usePropertySaleVideoCommentsQuery } from "../hooks/queries/usePropertySaleVideoCommentsQuery";
import { useCreatePropertySaleVideoCommentMutation } from "../hooks/mutations/usePropertySaleVideoMutations";
import { PropertySaleVideoCommentItem } from "../components/PropertySaleVideoCommentItem";
import { CommentComposer } from "../components/video/CommentComposer";
import { useUser } from "../hooks/useUser";
import { CS } from "../components/video/commentSheetTheme";
import { PropertySaleVideoComment } from "../types/propertySaleVideo";

interface PropertySaleVideoCommentsScreenParams {
  videoId: number;
}

export const PropertySaleVideoCommentsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useUser();
  const params = route.params as PropertySaleVideoCommentsScreenParams;
  const videoId = params?.videoId || 0;

  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    commentID: number;
    userName: string;
  } | null>(null);

  const { data: commentsData, isLoading: commentsLoading } =
    usePropertySaleVideoCommentsQuery(videoId);
  const comments: PropertySaleVideoComment[] = commentsData ?? [];
  const createComment = useCreatePropertySaleVideoCommentMutation();

  const handleReply = (commentID: number, userName: string) => {
    if (!user) {
      (navigation as any).navigate("UnifiedAuth");
      return;
    }
    setReplyingTo({ commentID, userName });
  };

  const handleSendComment = async () => {
    if (!user) {
      (navigation as any).navigate("UnifiedAuth");
      return;
    }
    if (createComment.isPending || !commentText.trim() || !videoId) return;

    const content = commentText.trim();
    const parentID = replyingTo?.commentID;
    const savedReply = replyingTo;
    setCommentText("");
    setReplyingTo(null);
    Keyboard.dismiss();

    try {
      await createComment.mutateAsync({
        videoID: videoId,
        content,
        parentID,
      });
    } catch {
      setCommentText(content);
      if (parentID && savedReply) setReplyingTo(savedReply);
    }
  };

  const renderItem = ({ item }: { item: PropertySaleVideoComment }) => (
    <PropertySaleVideoCommentItem
      comment={item}
      videoID={videoId}
      onReply={handleReply}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.sheetHandle} />
        <View style={styles.header}>
          <View style={styles.headerSide} />
          <Text style={styles.commentsCount}>
            {t("video.commentsTitle", {
              count: comments.length,
              defaultValue: `Comments · ${comments.length}`,
            })}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
            activeOpacity={0.75}
          >
            <X size={18} color={CS.text} weight="bold" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {commentsLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={CS.primary} />
          <Text style={styles.loadingText}>
            {t("video.loadingComments", "Loading comments...")}
          </Text>
        </View>
      ) : comments.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <ChatCircle size={36} color={CS.muted} weight="duotone" />
          </View>
          <Text style={styles.emptyText}>
            {t("video.noComments", "No comments yet")}
          </Text>
          <Text style={styles.emptySubtext}>
            {t("video.beFirstToComment", "Start the conversation.")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => String(item.ID)}
          renderItem={renderItem}
          style={styles.commentsList}
          contentContainerStyle={styles.commentsContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}

      {replyingTo && user ? (
        <View style={styles.replyBar}>
          <Text style={styles.replyText} numberOfLines={1}>
            {t("video.replyTo", {
              userName: replyingTo.userName,
              defaultValue: `Replying to ${replyingTo.userName}`,
            })}
          </Text>
          <TouchableOpacity
            onPress={() => setReplyingTo(null)}
            style={styles.cancelReply}
            hitSlop={8}
          >
            <X size={14} color={CS.muted} weight="bold" />
          </TouchableOpacity>
        </View>
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <SafeAreaView edges={["bottom"]} style={styles.inputSafe}>
          <View style={styles.inputDivider} />
          <CommentComposer
            user={user}
            value={commentText}
            onChangeText={setCommentText}
            onSubmit={handleSendComment}
            isSubmitting={createComment.isPending}
            placeholder={
              replyingTo
                ? (t("video.replyPlaceholder", {
                    userName: replyingTo.userName,
                  }) as string)
                : undefined
            }
            onSignIn={() => {
              navigation.goBack();
              (navigation as any).navigate("UnifiedAuth");
            }}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CS.surface },
  headerSafe: {
    backgroundColor: CS.surface,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#DBDBDB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CS.border,
  },
  headerSide: { width: 40 },
  commentsCount: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: CS.text,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingVertical: 40,
  },
  loadingText: { color: CS.muted, fontSize: 14 },
  commentsList: { flex: 1 },
  commentsContent: { paddingBottom: 8, flexGrow: 1 },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 72,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: CS.canvas,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: CS.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: CS.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: CS.canvas,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CS.border,
    gap: 12,
  },
  replyText: {
    flex: 1,
    fontSize: 13,
    color: CS.muted,
    fontWeight: "600",
  },
  cancelReply: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  inputSafe: {
    backgroundColor: CS.surface,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  inputDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: CS.border,
    marginBottom: 8,
    marginHorizontal: -16,
  },
});
