import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ArrowLeft, PaperPlaneTilt, House } from "phosphor-react-native";
import { useRoute } from "@react-navigation/native";
import { RootStackScreenProps } from "../types";
import { useTranslation } from "react-i18next";
import { useUser } from "../hooks/useUser";
import { api } from "../services/api";
import { directMessageEndpoints } from "../constants";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { theme } from "../theme";

const BLACK = "#1A1A1A";
const MUTED = "#666666";
const BORDER = "#F0F0F0";
const SURFACE = "#FFFFFF";
const ACCENT = theme["color-temporary-primary"];

type ContactHostParams = {
  propertyID: number;
  propertyTitle?: string;
  propertyImage?: string;
  hostID: number;
  hostName?: string;
  hostAvatarURL?: string;
  nightlyPrice?: number;
};

export const ContactHostScreen: React.FC<
  RootStackScreenProps<"ContactHost">
> = ({ navigation }) => {
  const route = useRoute();
  const { t } = useTranslation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const params = route.params as ContactHostParams;

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messageInputRef = useRef<TextInput>(null);
  const maxChars = 1000;

  const sendButtonOpacity = useSharedValue(0.45);

  useEffect(() => {
    const timer = setTimeout(() => messageInputRef.current?.focus(), 280);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    sendButtonOpacity.value = withTiming(message.trim().length > 0 ? 1 : 0.45, {
      duration: 180,
    });
  }, [message, sendButtonOpacity]);

  const sendButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sendButtonOpacity.value,
  }));

  const hostName = params.hostName?.trim() || t("contactHost.host", "Host");

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSubmitting) return;

    if (!user?.accessToken) {
      Alert.alert(
        t("contactHost.authRequired", "Authentication required"),
        t(
          "contactHost.pleaseLogin",
          "Please log in to send a message to the host.",
        ),
        [{ text: t("common.ok", "OK") }],
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    try {
      await api.post(directMessageEndpoints.sendMessage(), {
        receiver_id: params.hostID,
        content: trimmed,
        type: "text",
        ref_type: "property",
        ref_id: params.propertyID,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["directMessageConversations"],
        }),
        queryClient.invalidateQueries({ queryKey: ["conversations"] }),
        queryClient.invalidateQueries({ queryKey: ["directMessages"] }),
      ]);
      await queryClient.refetchQueries({
        queryKey: ["directMessageConversations"],
      });

      (navigation as any).navigate("DirectMessage", {
        conversationID: null,
        recipientName: hostName,
        otherUserId: params.hostID,
      });
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      let errorMessage = t(
        "contactHost.errorMessage",
        "Failed to send message. Please try again.",
      );
      if (error?.response?.status === 401) {
        errorMessage = t(
          "contactHost.authError",
          "Please log in to send a message.",
        );
      } else if (error?.response?.status === 404) {
        errorMessage = t(
          "contactHost.notFoundError",
          "The host could not be found.",
        );
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      Alert.alert(t("contactHost.error", "Error"), errorMessage, [
        { text: t("common.ok", "OK") },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t("common.back", "Back")}
          >
            <ArrowLeft size={22} color={BLACK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("contactHost.header", "Contact host")}
          </Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.previewCard}>
            <View style={styles.previewImageWrap}>
              {params.propertyImage ? (
                <Image
                  source={{ uri: params.propertyImage }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.previewImagePlaceholder}>
                  <House size={28} color={MUTED} weight="duotone" />
                </View>
              )}
            </View>
            <View style={styles.previewBody}>
              <Text style={styles.previewTitle} numberOfLines={2}>
                {params.propertyTitle ||
                  t("contactHost.property", "Property")}
              </Text>
              {params.nightlyPrice ? (
                <Text style={styles.previewPrice}>
                  {Number(params.nightlyPrice).toLocaleString()}{" "}
                  <Text style={styles.previewPriceUnit}>
                    {t("common.currencySymbol", "MRU")}{" "}
                    {t("contactHost.perNight", "/ night")}
                  </Text>
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.hostRow}>
            {params.hostAvatarURL ? (
              <Image
                source={{ uri: params.hostAvatarURL }}
                style={styles.hostAvatar}
              />
            ) : (
              <View style={styles.hostAvatarPlaceholder}>
                <Text style={styles.hostAvatarInitial}>
                  {hostName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.hostMeta}>
              <Text style={styles.hostName}>{hostName}</Text>
              <Text style={styles.hostLabel}>
                {t("contactHost.yourHost", "Your host")}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("contactHost.writeMessage", "Write a message")}
            </Text>
            <Text style={styles.sectionHint}>
              {t(
                "contactHost.sendInquiryHint",
                "Introduce yourself and explain what you need. Hosts usually reply within 24 hours.",
              )}
            </Text>

            <View style={styles.inputShell}>
              <TextInput
                ref={messageInputRef}
                style={styles.input}
                placeholder={t(
                  "contactHost.inputPlaceholder",
                  "Introduce yourself and ask any questions",
                )}
                placeholderTextColor={MUTED}
                multiline
                value={message}
                onChangeText={setMessage}
                maxLength={maxChars}
                textAlignVertical="top"
                autoCapitalize="sentences"
              />
              <Text style={styles.charCount}>
                {t("contactHost.charCount", "{{current}} / {{max}}", {
                  current: message.length,
                  max: maxChars,
                })}
              </Text>
            </View>
          </View>

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>
              {t("contactHost.tipsHeading", "Tips")}
            </Text>
            <Text style={styles.tipLine}>
              {t(
                "contactHost.tipDatesGuests",
                "Share your dates and number of guests",
              )}
            </Text>
            <Text style={styles.tipLine}>
              {t(
                "contactHost.tipAmenities",
                "Ask about the home and neighborhood",
              )}
            </Text>
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <Animated.View style={sendButtonAnimatedStyle}>
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!message.trim() || isSubmitting) && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!message.trim() || isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <PaperPlaneTilt size={18} color="#FFF" weight="fill" />
                  <Text style={styles.sendBtnText}>
                    {t("contactHost.send", "Send message")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: BLACK,
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FAFAFA",
    marginBottom: 20,
  },
  previewImageWrap: {
    width: 84,
    height: 84,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#ECECEC",
  },
  previewImage: { width: "100%", height: "100%" },
  previewImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  previewBody: { flex: 1, minWidth: 0 },
  previewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: BLACK,
    lineHeight: 22,
    marginBottom: 6,
  },
  previewPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: ACCENT,
  },
  previewPriceUnit: {
    fontSize: 13,
    fontWeight: "500",
    color: MUTED,
  },
  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  hostAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ECECEC",
  },
  hostAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  hostAvatarInitial: {
    fontSize: 20,
    fontWeight: "700",
    color: BLACK,
  },
  hostMeta: { flex: 1, minWidth: 0 },
  hostName: {
    fontSize: 17,
    fontWeight: "700",
    color: BLACK,
    marginBottom: 2,
  },
  hostLabel: { fontSize: 13, color: MUTED },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: BLACK,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: 14,
    color: MUTED,
    lineHeight: 20,
    marginBottom: 14,
  },
  inputShell: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
    padding: 14,
    minHeight: 160,
  },
  input: {
    fontSize: 15,
    color: BLACK,
    lineHeight: 22,
    minHeight: 120,
    padding: 0,
  },
  charCount: {
    marginTop: 8,
    fontSize: 11,
    color: MUTED,
    textAlign: "right",
  },
  tipsCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FAFAFA",
    padding: 14,
    gap: 6,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: BLACK,
    marginBottom: 4,
  },
  tipLine: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 19,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
    backgroundColor: SURFACE,
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BLACK,
    borderRadius: 10,
    paddingVertical: 15,
  },
  sendBtnDisabled: { backgroundColor: "#D1D5DB" },
  sendBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },
});
