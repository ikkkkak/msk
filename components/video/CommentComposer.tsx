import React, { memo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CaretRight } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { CS } from "./commentSheetTheme";
import { CommentUserAvatar } from "./CommentUserAvatar";
import {
  getCommentUserAvatar,
  getCommentUserName,
} from "../../utils/commentUserDisplay";

type UserLike = {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarURL?: string;
  avatarUrl?: string;
} | null | undefined;

type Props = {
  user: UserLike;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  placeholder?: string;
  onSignIn?: () => void;
};

/** Instagram-style comment composer — avatar + input + Post action. */
export const CommentComposer = memo(function CommentComposer({
  user,
  value,
  onChangeText,
  onSubmit,
  isSubmitting = false,
  placeholder,
  onSignIn,
}: Props) {
  const { t } = useTranslation();
  const canPost = value.trim().length > 0 && !isSubmitting;

  if (!user) {
    return (
      <TouchableOpacity
        style={styles.signInPrompt}
        onPress={onSignIn}
        activeOpacity={0.85}
      >
        <Text style={styles.signInText}>
          {t("video.signInToComment", "Sign in to write comments")}
        </Text>
        <CaretRight size={16} color={CS.muted} weight="bold" />
      </TouchableOpacity>
    );
  }

  const userName = getCommentUserName(user, t("video.anonymous", "User"));
  const userAvatar = getCommentUserAvatar(user);

  return (
    <View style={styles.row}>
      <CommentUserAvatar uri={userAvatar} name={userName} size={34} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={
          placeholder ||
          (t("video.addCommentPlaceholder", "Add a comment...") as string)
        }
        placeholderTextColor={CS.hint}
        style={styles.input}
        multiline
        maxLength={500}
      />
      <TouchableOpacity
        onPress={onSubmit}
        disabled={!canPost}
        activeOpacity={0.7}
        hitSlop={8}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color={CS.link} />
        ) : (
          <Text style={[styles.postBtn, !canPost && styles.postBtnDisabled]}>
            {t("video.post", "Post")}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: CS.text,
    maxHeight: 96,
    paddingVertical: 8,
    lineHeight: 20,
  },
  postBtn: {
    fontSize: 14,
    fontWeight: "700",
    color: CS.link,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  postBtnDisabled: {
    color: CS.linkMuted,
  },
  signInPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  signInText: {
    flex: 1,
    fontSize: 14,
    color: CS.muted,
    fontWeight: "600",
  },
});
