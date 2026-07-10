import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import type { ListingAiKind } from "../../types/listingAi";
import { resolveUploadedMediaUrl } from "../../utils/mediaUri";
import { LAI, laiStyles } from "./listingAiTheme";

type Props = {
  kind: ListingAiKind;
  imageUrls: string[];
  videoUrls: string[];
  onAddPhotos: () => void;
  onAddVideo?: () => void;
  onContinueWithout: () => void;
  uploading?: boolean;
};

export function ListingAiMediaPrompt({
  kind,
  imageUrls,
  videoUrls,
  onAddPhotos,
  onAddVideo,
  onContinueWithout,
  uploading,
}: Props) {
  const { t } = useTranslation();
  const hasMedia = imageUrls.length > 0 || videoUrls.length > 0;
  if (hasMedia) return null;

  const showVideo = kind === "sale" || kind === "land";

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {t("listingAi.mediaPromptTitle", {
          defaultValue: "Add photos",
        })}
      </Text>
      <Text style={styles.body}>
        {t("listingAi.mediaPromptBody", {
          defaultValue: "Listings with photos get more views.",
        })}
      </Text>
      <TouchableOpacity
        style={[laiStyles.btnPrimary, uploading && styles.disabled]}
        onPress={onAddPhotos}
        disabled={uploading}
      >
        <Text style={laiStyles.btnPrimaryText}>
          {t("listingAi.mediaPromptAddPhotos", { defaultValue: "Add photos" })}
        </Text>
      </TouchableOpacity>
      {showVideo && onAddVideo ? (
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onAddVideo}
          disabled={uploading}
        >
          <Text style={styles.secondaryBtnText}>
            {t("listingAi.mediaPromptAddVideo", { defaultValue: "Add video" })}
          </Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity onPress={onContinueWithout} disabled={uploading}>
        <Text style={styles.skipText}>
          {t("listingAi.mediaPromptSkip", {
            defaultValue: "Continue without media",
          })}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function ListingAiMediaThumbs({ imageUrls }: { imageUrls: string[] }) {
  if (!imageUrls.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbs}>
      {imageUrls.map((uri, i) => (
        <Image
          key={`${i}-${uri.slice(0, 24)}`}
          source={{ uri: resolveUploadedMediaUrl(uri) }}
          style={styles.thumb}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LAI.border,
    gap: 10,
  },
  title: { fontSize: 15, fontWeight: "600", color: LAI.text },
  body: { fontSize: 14, color: LAI.textSecondary, lineHeight: 20 },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: LAI.border,
    borderRadius: LAI.radius,
  },
  secondaryBtnText: { color: LAI.text, fontSize: 15 },
  skipText: {
    fontSize: 14,
    color: LAI.textSecondary,
    textAlign: "center",
    paddingVertical: 4,
  },
  disabled: { opacity: 0.5 },
  thumbs: { marginBottom: 12 },
  thumb: {
    width: 64,
    height: 64,
    marginRight: 8,
    borderRadius: LAI.radius,
    backgroundColor: LAI.border,
  },
});
