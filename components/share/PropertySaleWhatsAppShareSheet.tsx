/**
 * Preview + capture a branded 4K horizontal listing card for WhatsApp groups.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  InteractionManager,
} from "react-native";
import { X, ShareNetwork } from "phosphor-react-native";
import { captureRef } from "react-native-view-shot";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { PropertySaleWhatsAppShareCard } from "./PropertySaleWhatsAppShareCard";
import {
  WHATSAPP_SHARE_CARD_H,
  WHATSAPP_SHARE_CARD_W,
  WHATSAPP_SHARE_CARD_EXPORT_H,
  WHATSAPP_SHARE_CARD_EXPORT_W,
  SHARE_CARD_CAPTURE_DELAY_MS,
  buildPropertySaleShareCaption,
  normalizeShareFileUri,
  pickPropertySaleShareImages,
  type PropertySaleSharePayload,
} from "../../utils/propertySaleShare";
import { trackWhatsAppShareEvent } from "../../services/whatsappShareAnalytics";

const PREVIEW_SCALE =
  (Dimensions.get("window").width - 48) / WHATSAPP_SHARE_CARD_W;

function waitForNextFrames(count = 2): Promise<void> {
  return new Promise((resolve) => {
    let remaining = count;
    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

type Props = {
  visible: boolean;
  onClose: () => void;
  property: PropertySaleSharePayload | null;
};

export function PropertySaleWhatsAppShareSheet({
  visible,
  onClose,
  property,
}: Props) {
  const { t } = useTranslation();
  const captureRefView = useRef<View>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);
  const [captureReady, setCaptureReady] = useState(false);

  useEffect(() => {
    if (!visible || !property) {
      setImagesReady(false);
      setCaptureReady(false);
      return;
    }
    trackWhatsAppShareEvent({
      propertySaleId: property.id,
      event: "sheet_opened",
      propertyTitle: property.title,
    });
    let cancelled = false;
    setImagesReady(false);
    setCaptureReady(false);
    const urls = pickPropertySaleShareImages(property.images, 4);
    void (async () => {
      try {
        await Promise.all(urls.map((uri) => Image.prefetch(uri)));
      } catch {
        /* best-effort prefetch */
      }
      if (!cancelled) {
        setImagesReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, property]);

  useEffect(() => {
    if (!imagesReady) {
      setCaptureReady(false);
      return;
    }
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      void waitForNextFrames(2).then(() => {
        if (!cancelled) setCaptureReady(true);
      });
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [imagesReady]);

  const captureCardImage = useCallback(async (): Promise<string> => {
    if (!captureRefView.current) {
      throw new Error("capture view not mounted");
    }
    await waitForNextFrames(2);
    await new Promise((r) => setTimeout(r, SHARE_CARD_CAPTURE_DELAY_MS));

    const captureOptions = {
      format: "png" as const,
      quality: 1,
      result: "tmpfile" as const,
    };

    try {
      return await captureRef(captureRefView, {
        ...captureOptions,
        width: WHATSAPP_SHARE_CARD_EXPORT_W,
        height: WHATSAPP_SHARE_CARD_EXPORT_H,
      });
    } catch {
      // Fallback if 4K bitmap exceeds device limits.
      return captureRef(captureRefView, {
        ...captureOptions,
        width: 2160,
        height: 1136,
      });
    }
  }, []);

  const shareCard = useCallback(async () => {
    if (!property || !captureReady) return;
    trackWhatsAppShareEvent({
      propertySaleId: property.id,
      event: "share_started",
      propertyTitle: property.title,
    });
    try {
      setIsGenerating(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const uri = await captureCardImage();
      const shareUri = normalizeShareFileUri(uri);
      const caption = buildPropertySaleShareCaption(property);

      const sharePayload =
        Platform.OS === "ios"
          ? { url: shareUri, message: caption }
          : { url: shareUri, message: caption };

      const result = await Share.share(sharePayload);
      if (result.action === Share.dismissedAction) {
        trackWhatsAppShareEvent({
          propertySaleId: property.id,
          event: "share_dismissed",
          propertyTitle: property.title,
        });
        return;
      }
      trackWhatsAppShareEvent({
        propertySaleId: property.id,
        event: "share_completed",
        propertyTitle: property.title,
      });
    } catch (err) {
      trackWhatsAppShareEvent({
        propertySaleId: property.id,
        event: "share_failed",
        propertyTitle: property.title,
      });
      if (__DEV__) {
        console.warn("[PropertySaleWhatsAppShareSheet] share failed:", err);
      }
      Alert.alert(
        t("common.error", "Error"),
        t(
          "propertySaleDetails.shareCard.shareError",
          "Could not create the share card. Try again.",
        ),
      );
    } finally {
      setIsGenerating(false);
    }
  }, [captureCardImage, captureReady, property, t]);

  if (!property) return null;

  const canShare = imagesReady && captureReady && !isGenerating;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <X size={22} color="#111827" weight="bold" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("propertySaleDetails.shareCard.title", "Share listing card")}
          </Text>
          <View style={styles.iconBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!imagesReady ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#111827" />
              <Text style={styles.loadingText}>
                {t(
                  "propertySaleDetails.shareCard.preparing",
                  "Preparing high-resolution photos…",
                )}
              </Text>
            </View>
          ) : null}

          <View style={styles.previewFrame}>
            <View
              style={[
                styles.previewScaled,
                { transform: [{ scale: PREVIEW_SCALE }] },
              ]}
            >
              <PropertySaleWhatsAppShareCard property={property} />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.shareBtn, !canShare && styles.shareBtnDisabled]}
            onPress={() => void shareCard()}
            disabled={!canShare}
          >
            {isGenerating ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <ShareNetwork size={20} color="#FFFFFF" weight="bold" />
            )}
            <Text style={styles.shareBtnText}>
              {isGenerating
                ? t("common.generating", "Generating…")
                : !imagesReady || !captureReady
                  ? t(
                      "propertySaleDetails.shareCard.preparing",
                      "Preparing high-resolution photos…",
                    )
                  : t(
                      "propertySaleDetails.shareCard.shareWhatsApp",
                      "Share to WhatsApp",
                    )}
            </Text>
          </TouchableOpacity>
        </View>

        {captureReady ? (
          <View style={styles.captureHost} pointerEvents="none">
            <View
              ref={captureRefView}
              collapsable={false}
              style={styles.captureFrame}
            >
              <PropertySaleWhatsAppShareCard property={property} />
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    marginBottom: 16,
    textAlign: "center",
  },
  loadingWrap: {
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#6B7280",
  },
  previewFrame: {
    alignSelf: "center",
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    width: WHATSAPP_SHARE_CARD_W * PREVIEW_SCALE,
    height: WHATSAPP_SHARE_CARD_H * PREVIEW_SCALE,
  },
  previewScaled: {
    width: WHATSAPP_SHARE_CARD_W,
    height: WHATSAPP_SHARE_CARD_H,
    transformOrigin: "top left",
  },
  exportHint: {
    marginTop: 12,
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingVertical: 16,
  },
  shareBtnDisabled: {
    opacity: 0.7,
  },
  shareBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  captureHost: {
    position: "absolute",
    top: 0,
    left: 0,
    opacity: 0.02,
    zIndex: -1,
  },
  captureFrame: {
    width: WHATSAPP_SHARE_CARD_W,
    height: WHATSAPP_SHARE_CARD_H,
  },
});

export default PropertySaleWhatsAppShareSheet;
