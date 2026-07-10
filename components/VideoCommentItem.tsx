import React, { useState, useEffect, useRef, memo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Text,
} from "react-native";
import { Heart } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { VideoComment } from "../types/video";
import {
  useUpdateVideoCommentMutation,
  useDeleteVideoCommentMutation,
  useLikeVideoCommentMutation,
  useUnlikeVideoCommentMutation,
} from "../hooks/mutations/useVideoMutations";
import * as Haptics from "expo-haptics";
import { useUser } from "../hooks/useUser";
import { CS } from "./video/commentSheetTheme";
import { CommentUserAvatar } from "./video/CommentUserAvatar";
import {
  formatCommentTime,
  getCommentUserAvatar,
  getCommentUserName,
} from "../utils/commentUserDisplay";

interface VideoCommentItemProps {
  comment: VideoComment;
  videoID: number;
  onReply: (commentID: number, userName: string) => void;
  isReply?: boolean;
}

export const VideoCommentItem = memo(function VideoCommentItem({
  comment,
  videoID,
  onReply,
  isReply = false,
}: VideoCommentItemProps) {
  const { t } = useTranslation();
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(false);

  const [localIsLiked, setLocalIsLiked] = useState(() => comment.isLiked || false);
  const [localLikesCount, setLocalLikesCount] = useState(() => {
    const count = comment.likesCount;
    return typeof count === "number" && !isNaN(count) ? count : 0;
  });

  const updateComment = useUpdateVideoCommentMutation();
  const deleteComment = useDeleteVideoCommentMutation();
  const likeComment = useLikeVideoCommentMutation();
  const unlikeComment = useUnlikeVideoCommentMutation();

  const isOwner = user?.ID === comment.userID;
  const isMutatingRef = useRef(false);

  const userName = getCommentUserName(comment.user, t("video.anonymous", "User"));
  const userAvatar = getCommentUserAvatar(comment.user);
  const avatarSize = isReply ? 28 : 36;
  const replies = comment.replies || [];

  useEffect(() => {
    if (isMutatingRef.current) return;
    const newIsLiked = comment.isLiked || false;
    const newLikesCount =
      typeof comment.likesCount === "number" && !isNaN(comment.likesCount)
        ? comment.likesCount
        : 0;
    if (newIsLiked !== localIsLiked) setLocalIsLiked(newIsLiked);
    if (newLikesCount !== localLikesCount) setLocalLikesCount(newLikesCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comment.isLiked, comment.likesCount]);

  const handleLike = async () => {
    if (!user?.ID) {
      Alert.alert(
        t("video.signInRequired", "Sign in required"),
        t("video.signInToLike", "Please sign in to like comments"),
      );
      return;
    }
    if (likeComment.isPending || unlikeComment.isPending || isMutatingRef.current) {
      return;
    }

    isMutatingRef.current = true;
    const wasLiked = localIsLiked;
    const currentCount =
      typeof localLikesCount === "number" && !isNaN(localLikesCount)
        ? localLikesCount
        : typeof comment.likesCount === "number"
          ? comment.likesCount
          : 0;
    const newIsLiked = !wasLiked;
    const newLikesCount = wasLiked
      ? Math.max(0, currentCount - 1)
      : currentCount + 1;

    setLocalIsLiked(newIsLiked);
    setLocalLikesCount(newLikesCount);

    try {
      await Haptics.impactAsync(
        newIsLiked
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light,
      );
    } catch {
      /* optional */
    }

    try {
      const result = wasLiked
        ? await unlikeComment.mutateAsync({ commentID: comment.ID })
        : await likeComment.mutateAsync({ commentID: comment.ID });
      if (
        result &&
        typeof result === "object" &&
        "likesCount" in result &&
        result.likesCount !== undefined
      ) {
        const serverCount =
          typeof result.likesCount === "number" && !isNaN(result.likesCount)
            ? result.likesCount
            : newLikesCount;
        setLocalLikesCount(serverCount);
      }
    } catch (error: any) {
      setLocalIsLiked(wasLiked);
      setLocalLikesCount(currentCount);
      const errorMsg =
        error?.response?.data?.error || error?.message || t("common.error", "Error");
      Alert.alert(t("common.error", "Error"), errorMsg);
    } finally {
      setTimeout(() => {
        isMutatingRef.current = false;
      }, 300);
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    await updateComment.mutateAsync({
      commentID: comment.ID,
      input: { content: editText.trim() },
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      t("video.deleteCommentTitle", "Delete comment"),
      t("video.deleteCommentBody", "Are you sure you want to delete this comment?"),
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        {
          text: t("common.delete", "Delete"),
          style: "destructive",
          onPress: () =>
            deleteComment.mutateAsync({ commentID: comment.ID, videoID }),
        },
      ],
    );
  };

  const postedAt = comment.postedAt || comment.createdAt;

  return (
    <View style={[styles.row, isReply && styles.replyRow]}>
      <CommentUserAvatar uri={userAvatar} name={userName} size={avatarSize} />

      <View style={styles.body}>
        {isEditing ? (
          <View style={styles.editBox}>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              style={styles.editInput}
              multiline
              autoFocus
              maxLength={500}
            />
            <View style={styles.editActions}>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Text style={styles.editCancel}>{t("common.cancel", "Cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEdit}>
                <Text style={styles.editSave}>{t("common.save", "Save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.commentText}>
              <Text style={styles.userName}>{userName} </Text>
              {comment.content}
            </Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{formatCommentTime(postedAt)}</Text>
              {localLikesCount > 0 ? (
                <Text style={styles.metaText}>
                  {localLikesCount}{" "}
                  {localLikesCount === 1
                    ? t("video.likeSingular", "like")
                    : t("video.likePlural", "likes")}
                </Text>
              ) : null}
              <TouchableOpacity
                onPress={() => {
                  if (!user?.ID) {
                    Alert.alert(
                      t("video.signInRequired", "Sign in required"),
                      t("video.signInToReply", "Please sign in to reply"),
                    );
                    return;
                  }
                  onReply(comment.ID, userName);
                }}
                hitSlop={8}
              >
                <Text style={styles.replyLink}>{t("video.reply", "Reply")}</Text>
              </TouchableOpacity>
              {isOwner ? (
                <>
                  <TouchableOpacity onPress={() => setIsEditing(true)} hitSlop={8}>
                    <Text style={styles.ownerAction}>{t("common.edit", "Edit")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDelete} hitSlop={8}>
                    <Text style={[styles.ownerAction, styles.deleteAction]}>
                      {t("common.delete", "Delete")}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}
              {comment.edited ? (
                <Text style={styles.metaText}>{t("video.edited", "Edited")}</Text>
              ) : null}
            </View>

            {!isReply && replies.length > 0 ? (
              <TouchableOpacity
                style={styles.viewRepliesBtn}
                onPress={() => setShowReplies((v) => !v)}
                activeOpacity={0.7}
              >
                <View style={styles.viewRepliesLine} />
                <Text style={styles.viewRepliesText}>
                  {showReplies
                    ? t("video.hideReplies", "Hide replies")
                    : t("video.viewReplies", {
                        count: replies.length,
                        defaultValue: `View ${replies.length} replies`,
                      })}
                </Text>
              </TouchableOpacity>
            ) : null}

            {showReplies && replies.length > 0 ? (
              <View style={styles.repliesList}>
                {replies.map((reply) => (
                  <VideoCommentItem
                    key={reply.ID}
                    comment={reply}
                    videoID={videoID}
                    onReply={onReply}
                    isReply
                  />
                ))}
              </View>
            ) : null}
          </>
        )}
      </View>

      {!isEditing ? (
        <TouchableOpacity
          style={styles.likeBtn}
          onPress={handleLike}
          activeOpacity={0.6}
          hitSlop={10}
        >
          <Heart
            size={14}
            weight={localIsLiked ? "fill" : "regular"}
            color={localIsLiked ? CS.like : CS.muted}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  replyRow: {
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 0,
  },
  body: {
    flex: 1,
    paddingTop: 2,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: CS.text,
  },
  userName: {
    fontWeight: "700",
    color: CS.text,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 14,
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: CS.muted,
    fontWeight: "500",
  },
  replyLink: {
    fontSize: 12,
    color: CS.muted,
    fontWeight: "700",
  },
  ownerAction: {
    fontSize: 12,
    color: CS.muted,
    fontWeight: "600",
  },
  deleteAction: {
    color: CS.danger,
  },
  likeBtn: {
    paddingTop: 4,
    paddingLeft: 4,
  },
  viewRepliesBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  viewRepliesLine: {
    width: 24,
    height: 1,
    backgroundColor: CS.border,
  },
  viewRepliesText: {
    fontSize: 13,
    color: CS.muted,
    fontWeight: "600",
  },
  repliesList: {
    marginTop: 4,
  },
  editBox: {
    backgroundColor: CS.canvas,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: CS.border,
  },
  editInput: {
    fontSize: 14,
    color: CS.text,
    minHeight: 64,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
    marginTop: 8,
  },
  editCancel: {
    fontSize: 14,
    color: CS.muted,
    fontWeight: "600",
  },
  editSave: {
    fontSize: 14,
    color: CS.primary,
    fontWeight: "700",
  },
});
