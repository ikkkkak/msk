/**
 * GenerateInviteCodeModal - Enterprise-Grade Invite Code Generation
 * Professional, compact UI following TikTok/WeChat/Telegram design principles
 * Supports configurable expiry (7/30 days/never) and usage limits (single/10/unlimited)
 */

import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Text } from "@ui-kitten/components";
import { XIcon, CopyIcon, CheckIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring
} from "react-native-reanimated";

import { endpoints } from "../constants";
import { useUser } from "../hooks/useUser";
import Toast from "./CustomToast";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface GenerateInviteCodeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const GenerateInviteCodeModal: React.FC<
  GenerateInviteCodeModalProps
> = ({ visible, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [expiryDays, setExpiryDays] = useState<7 | 30 | 0>(30); // 0 = never expires
  const [maxUses, setMaxUses] = useState<1 | 10 | 0>(0); // 0 = unlimited
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Animation values
  const backdropOpacity = useSharedValue(0);
  const translateY = useSharedValue(SCREEN_HEIGHT);

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!user?.accessToken) {
        throw new Error("User not authenticated");
      }
      const response = await axios.post(
        `${endpoints.baseURL}/organization/invite-code`,
        {
          expiry_days: expiryDays,
          max_uses: maxUses
        },
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );
      return response.data;
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.();
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        t(
          "organization.invite.generateError",
          "Failed to generate invite code. Please try again."
        );
      setToast({ message: errorMessage, type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  });

  // Animate on visibility change - smooth, no bounce
  React.useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withTiming(0, { duration: 300 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
    }
  }, [visible]);

  const handleCopy = async () => {
    if (generateMutation.data?.code) {
      await Clipboard.setStringAsync(generateMutation.data.code);
      setCopied(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    generateMutation.mutate();
  };

  const handleClose = () => {
    if (generateMutation.isPending) return;
    generateMutation.reset();
    setCopied(false);
    onClose();
  };

  const inviteCode = generateMutation.data?.code;
  const currentUses = generateMutation.data?.current_uses || 0;
  const usageLimit = generateMutation.data?.usage_limit || "";
  const expiresIn = generateMutation.data?.expires_in || "";

  // Animated styles
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  const copyButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: copied ? withSpring(1.1) : withSpring(1) }]
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
          style={styles.keyboardAvoidingView}
        >
          <Animated.View style={[styles.modalContent, contentAnimatedStyle]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>
                  {t(
                    "organization.invite.generateTitle",
                    "Generate Invitation Code"
                  )}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  disabled={generateMutation.isPending}
                >
                  <XIcon size={20} weight="bold" color="#000000" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
                {!inviteCode ? (
                  <>
                    {/* Expiry Options */}
                    <View style={styles.section}>
                      <Text style={styles.sectionLabel}>
                        {t("organization.invite.expiryLabel", "Code Expiry")}
                      </Text>
                      <View style={styles.radioGroup}>
                        {[
                          {
                            value: 7,
                            label: t(
                              "organization.invite.expiry7Days",
                              "7 days"
                            )
                          },
                          {
                            value: 30,
                            label: t(
                              "organization.invite.expiry30Days",
                              "30 days"
                            )
                          },
                          {
                            value: 0,
                            label: t(
                              "organization.invite.expiryNever",
                              "Never expires"
                            )
                          }
                        ].map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.radioOption,
                              expiryDays === option.value &&
                                styles.radioOptionActive
                            ]}
                            onPress={() => {
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light
                              );
                              setExpiryDays(option.value as 7 | 30 | 0);
                            }}
                            activeOpacity={0.7}
                          >
                            <View
                              style={[
                                styles.radioCircle,
                                expiryDays === option.value &&
                                  styles.radioCircleActive
                              ]}
                            >
                              {expiryDays === option.value && (
                                <View style={styles.radioCircleInner} />
                              )}
                            </View>
                            <Text
                              style={[
                                styles.radioLabel,
                                expiryDays === option.value &&
                                  styles.radioLabelActive
                              ]}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Usage Limit Options */}
                    <View style={styles.section}>
                      <Text style={styles.sectionLabel}>
                        {t("organization.invite.usageLabel", "Usage Limit")}
                      </Text>
                      <View style={styles.radioGroup}>
                        {[
                          {
                            value: 1,
                            label: t(
                              "organization.invite.usageSingle",
                              "Single use"
                            )
                          },
                          {
                            value: 10,
                            label: t("organization.invite.usage10", "10 uses")
                          },
                          {
                            value: 0,
                            label: t(
                              "organization.invite.usageUnlimited",
                              "Unlimited uses"
                            )
                          }
                        ].map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.radioOption,
                              maxUses === option.value &&
                                styles.radioOptionActive
                            ]}
                            onPress={() => {
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light
                              );
                              setMaxUses(option.value as 1 | 10 | 0);
                            }}
                            activeOpacity={0.7}
                          >
                            <View
                              style={[
                                styles.radioCircle,
                                maxUses === option.value &&
                                  styles.radioCircleActive
                              ]}
                            >
                              {maxUses === option.value && (
                                <View style={styles.radioCircleInner} />
                              )}
                            </View>
                            <Text
                              style={[
                                styles.radioLabel,
                                maxUses === option.value &&
                                  styles.radioLabelActive
                              ]}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Generate Button */}
                    <TouchableOpacity
                      style={[
                        styles.generateButton,
                        generateMutation.isPending && styles.buttonDisabled
                      ]}
                      onPress={handleGenerate}
                      disabled={generateMutation.isPending}
                      activeOpacity={0.8}
                    >
                      {generateMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.generateButtonText}>
                          {t("organization.invite.generate", "Generate Code")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {/* Code Display */}
                    <View style={styles.codeDisplayContainer}>
                      <View style={styles.codeBox}>
                        <Text style={styles.codeText} selectable>
                          {inviteCode}
                        </Text>
                        <Animated.View style={copyButtonStyle}>
                          <TouchableOpacity
                            style={styles.copyButton}
                            onPress={handleCopy}
                            activeOpacity={0.7}
                          >
                            {copied ? (
                              <CheckIcon
                                size={18}
                                weight="bold"
                                color="#10B981"
                              />
                            ) : (
                              <CopyIcon
                                size={18}
                                weight="bold"
                                color="#666666"
                              />
                            )}
                          </TouchableOpacity>
                        </Animated.View>
                      </View>
                      {copied && (
                        <Text style={styles.copiedText}>
                          {t("organization.invite.copied", "Copied!")}
                        </Text>
                      )}
                    </View>

                    {/* Metadata */}
                    <View style={styles.metadataContainer}>
                      <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>
                          {t("organization.invite.expiresLabel", "Expires")}
                        </Text>
                        <Text style={styles.metadataValue}>{expiresIn}</Text>
                      </View>
                      <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>
                          {t(
                            "organization.invite.usageLimitLabel",
                            "Usage limit"
                          )}
                        </Text>
                        <Text style={styles.metadataValue}>{usageLimit}</Text>
                      </View>
                      {maxUses > 0 && (
                        <View style={styles.metadataRow}>
                          <Text style={styles.metadataLabel}>
                            {t(
                              "organization.invite.currentUsesLabel",
                              "Current uses"
                            )}
                          </Text>
                          <Text style={styles.metadataValue}>
                            {currentUses} / {maxUses}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Generate New Button */}
                    <TouchableOpacity
                      style={styles.generateNewButton}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        generateMutation.reset();
                        setCopied(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.generateNewButtonText}>
                        {t(
                          "organization.invite.generateNew",
                          "Generate New Code"
                        )}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.closeButtonFooter}
                onPress={handleClose}
                disabled={generateMutation.isPending}
                activeOpacity={0.8}
              >
                <Text style={styles.closeButtonFooterText}>
                  {t("common.close", "Close")}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(null)}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end"
  },
  keyboardAvoidingView: {
    justifyContent: "flex-end"
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: SCREEN_HEIGHT * 0.75,
    width: "100%"
  },
  scrollView: {
    flexGrow: 0
  },
  scrollViewContent: {
    flexGrow: 0,
    paddingBottom: 20
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0"
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000"
  },
  closeButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center"
  },
  content: {
    padding: 12
  },
  section: {
    marginBottom: 16
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666666",
    marginBottom: 8
  },
  radioGroup: {
    gap: 6
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0"
  },
  radioOptionActive: {
    backgroundColor: "#E8F5E9",
    borderColor: "#10B981"
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#CCCCCC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  radioCircleActive: {
    borderColor: "#10B981"
  },
  radioCircleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981"
  },
  radioLabel: {
    fontSize: 14,
    color: "#000000"
  },
  radioLabelActive: {
    fontWeight: "500",
    color: "#10B981"
  },
  generateButton: {
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#121212"
  },
  generateButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#FFFFFF"
  },
  buttonDisabled: {
    opacity: 0.5
  },
  codeDisplayContainer: {
    marginBottom: 16
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed"
  },
  codeText: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 1.5
  },
  copyButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0"
  },
  copiedText: {
    fontSize: 12,
    color: "#10B981",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500"
  },
  metadataContainer: {
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginBottom: 16,
    gap: 8
  },
  metadataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  metadataLabel: {
    fontSize: 12,
    color: "#666666"
  },
  metadataValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#000000"
  },
  generateNewButton: {
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "rgba(0,0,0,0.06)",
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1
  },
  generateNewButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000"
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0"
  },
  closeButtonFooter: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#F8F8F8"
  },
  closeButtonFooterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000"
  }
});
