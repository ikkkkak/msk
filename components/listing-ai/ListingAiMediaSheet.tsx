import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "phosphor-react-native";
import type { ListingAiKind } from "../../types/listingAi";
import { LAI, laiStyles } from "./listingAiTheme";

export type ListingAiMediaSheetProps = {
  visible: boolean;
  kind: ListingAiKind;
  uploading?: boolean;
  skipAppliesListing?: boolean;
  onAddPhotos: () => void | Promise<void>;
  onAddVideo?: () => void | Promise<void>;
  onContinueWithout: () => void;
  onClose: () => void;
};

export function ListingAiMediaSheet({
  visible,
  kind,
  uploading = false,
  skipAppliesListing = false,
  onAddPhotos,
  onAddVideo,
  onContinueWithout,
  onClose,
}: ListingAiMediaSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const showVideo = kind === "sale" || kind === "land";

  if (!visible) return null;

  const handlePhotos = () => {
    void (async () => {
      onClose();
      await onAddPhotos();
    })();
  };

  const handleVideo = () => {
    if (!onAddVideo) return;
    void (async () => {
      onClose();
      await onAddVideo();
    })();
  };

  const handleSkip = () => {
    onClose();
    onContinueWithout();
  };

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
      <View
        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
        pointerEvents="box-auto"
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {t("listingAi.mediaPromptTitle", { defaultValue: "Add photos" })}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t("common.close", "Close")}
          >
            <X size={20} color={LAI.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.body}>
          {t("listingAi.mediaPromptConfirm", {
            defaultValue: "Photos help your listing get more views.",
          })}
        </Text>

        <TouchableOpacity
          style={[laiStyles.btnPrimary, uploading && styles.disabled]}
          onPress={handlePhotos}
          disabled={uploading}
          activeOpacity={0.85}
        >
          {uploading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={laiStyles.btnPrimaryText}>
              {t("listingAi.mediaPromptAddPhotos", {
                defaultValue: "Add photos",
              })}
            </Text>
          )}
        </TouchableOpacity>

        {showVideo && onAddVideo ? (
          <TouchableOpacity
            style={[styles.secondaryBtn, uploading && styles.disabled]}
            onPress={handleVideo}
            disabled={uploading}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>
              {t("listingAi.mediaPromptAddVideo", {
                defaultValue: "Add video",
              })}
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleSkip}
          disabled={uploading}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>
            {skipAppliesListing
              ? t("listingAi.mediaPromptSkip", {
                  defaultValue: "Continue without media",
                })
              : t("listingAi.mediaSheetLater", {
                  defaultValue: "Maybe later",
                })}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    elevation: 200,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: LAI.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LAI.border,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: LAI.text,
  },
  body: {
    fontSize: 14,
    color: LAI.textSecondary,
    lineHeight: 20,
    marginBottom: 6,
  },
  secondaryBtn: {
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: LAI.border,
    borderRadius: LAI.radius,
  },
  secondaryBtnText: {
    color: LAI.text,
    fontSize: 15,
    fontWeight: "500",
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    color: LAI.textSecondary,
  },
  disabled: { opacity: 0.55 },
});
