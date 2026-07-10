/**
 * JoinAgencyModal - Enterprise-Grade Agency Join Flow
 * Professional, compact UI following TikTok/WeChat/Telegram design principles
 * Includes code validation, agency preview, and confirmation flow
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Dimensions,
  ScrollView,
  Keyboard
} from "react-native";
import { Text } from "@ui-kitten/components";
import { X, Check, Building, Warning, User } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming
} from "react-native-reanimated";

import { endpoints } from "../constants";
import { useUser } from "../hooks/useUser";
import Toast from "./CustomToast";
import { theme } from "../theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface JoinAgencyModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const JoinAgencyModal: React.FC<JoinAgencyModalProps> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [agencyPreview, setAgencyPreview] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedCheckbox, setConfirmedCheckbox] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Animation values
  const backdropOpacity = useSharedValue(0);
  const translateY = useSharedValue(SCREEN_HEIGHT);

  // Auto-format code: uppercase, add dash after "AG-"
  const formatCode = useCallback((text: string): string => {
    // Remove all non-alphanumeric except dashes
    let formatted = text.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    // Ensure "AG-" prefix
    if (formatted.startsWith("AG")) {
      if (formatted.length > 2 && formatted[2] !== "-") {
        formatted = "AG-" + formatted.substring(2);
      } else if (formatted.length === 2) {
        formatted = "AG-";
      }
    } else if (formatted.length > 0 && !formatted.startsWith("AG-")) {
      formatted = "AG-" + formatted;
    }
    // Limit to 10 characters (AG-XXXXXX)
    if (formatted.length > 10) {
      formatted = formatted.substring(0, 10);
    }
    return formatted;
  }, []);

  const handleCodeChange = useCallback(
    (text: string) => {
      const formatted = formatCode(text);
      setCode(formatted);
      setError(null);
      setAgencyPreview(null);
    },
    [formatCode]
  );

  // Validate code format
  const isValidFormat =
    code.length >= 6 && code.startsWith("AG-") && /^AG-[A-Z0-9]{6}$/.test(code);

  // Validate code on server
  const validateMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await axios.get(
        `${endpoints.baseURL}/organization/invite-code/${inviteCode}`,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`
          }
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAgencyPreview(data);
      setError(null);
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        t("organization.join.validateError", "Invalid or expired invite code");
      setError(errorMessage);
      setAgencyPreview(null);
    }
  });

  const handleVerify = useCallback(() => {
    if (!isValidFormat) {
      setError(
        t(
          "organization.join.invalidFormat",
          "Please enter a valid invite code format (e.g., AG-X7K2M9)"
        )
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    validateMutation.mutate(code);
  }, [code, isValidFormat, validateMutation, t]);

  // Join organization
  const joinMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!user?.accessToken) {
        throw new Error("User not authenticated");
      }
      const response = await axios.post(
        `${endpoints.baseURL}/organization/join`,
        { code: inviteCode },
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
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["user-organization"] });
      queryClient.invalidateQueries({ queryKey: ["organizationMembers"] });
      queryClient.invalidateQueries({ queryKey: ["userProperties"] });
      queryClient.invalidateQueries({ queryKey: ["userLandmarks"] });

      setToast({
        message: t("organization.join.success", "Successfully joined agency!"),
        type: "success"
      });
      setTimeout(() => {
        setCode("");
        setAgencyPreview(null);
        setShowConfirmation(false);
        setConfirmedCheckbox(false);
        setError(null);
        onClose();
        onSuccess?.();
      }, 1500);
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        t(
          "organization.join.error",
          "Failed to join organization. Please try again."
        );
      setToast({ message: errorMessage, type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  });

  const handleJoin = useCallback(() => {
    if (!confirmedCheckbox) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    joinMutation.mutate(code);
  }, [code, confirmedCheckbox, joinMutation]);

  const handleOpenConfirmation = useCallback(() => {
    if (!agencyPreview) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowConfirmation(true);
  }, [agencyPreview]);

  const handleClose = useCallback(() => {
    if (validateMutation.isLoading || joinMutation.isLoading) return;
    setCode("");
    setAgencyPreview(null);
    setShowConfirmation(false);
    setConfirmedCheckbox(false);
    setError(null);
    validateMutation.reset();
    joinMutation.reset();
    onClose();
  }, [validateMutation, joinMutation, onClose]);

  // Keyboard listeners
  useEffect(() => {
    if (!visible) return;

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [visible]);

  // Animate on visibility change - smooth, no bounce
  React.useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withTiming(0, { duration: 300 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
      setKeyboardHeight(0);
    }
  }, [visible]);

  // Animated styles
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  if (!visible) return null;

  // Confirmation Modal
  if (showConfirmation) {
    return (
      <Modal
        visible={visible}
        transparent
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
            <Animated.View
              style={[
                styles.modalContent,
                styles.confirmationModal,
                contentAnimatedStyle
              ]}
            >
              <View style={styles.header}>
                <Text style={styles.title}>
                  {t("organization.join.confirmTitle", "Join {{name}}?", {
                    name: agencyPreview?.organization?.name || "Agency"
                  })}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  disabled={joinMutation.isLoading}
                >
                  <X size={20} weight="bold" color="#000000" />
                </TouchableOpacity>
              </View>

              <View style={styles.content}>
                <Text style={styles.warningText}>
                  {t(
                    "organization.join.confirmWarning",
                    "Properties you add after joining will belong to this agency"
                  )}
                </Text>

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      confirmedCheckbox && styles.checkboxChecked
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setConfirmedCheckbox(!confirmedCheckbox);
                    }}
                    activeOpacity={0.7}
                  >
                    {confirmedCheckbox && (
                      <Check size={14} weight="bold" color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>
                    {t(
                      "organization.join.confirmCheckbox",
                      "I understand my future properties will belong to this agency"
                    )}
                  </Text>
                </View>

                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={styles.cancelConfirmButton}
                    onPress={handleClose}
                    disabled={joinMutation.isLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelConfirmButtonText}>
                      {t("common.cancel", "Cancel")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.joinConfirmButton,
                      (!confirmedCheckbox || joinMutation.isLoading) &&
                        styles.buttonDisabled
                    ]}
                    onPress={handleJoin}
                    disabled={!confirmedCheckbox || joinMutation.isLoading}
                    activeOpacity={0.8}
                  >
                    {joinMutation.isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.joinConfirmButtonText}>
                        {t("organization.join.confirmButton", "Confirm & Join")}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  }

  // Main Modal
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
          <Animated.View
            style={[
              styles.modalContent,
              contentAnimatedStyle,
              keyboardHeight > 0 && {
                paddingBottom: keyboardHeight - (Platform.OS === "ios" ? 0 : 20)
              }
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>
                  {t("organization.join.title", "Join an Agency")}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  disabled={validateMutation.isLoading}
                >
                  <X size={20} weight="bold" color="#000000" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
                {/* Code Input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      isValidFormat && styles.inputValid,
                      error && styles.inputError
                    ]}
                    value={code}
                    onChangeText={handleCodeChange}
                    placeholder={t(
                      "organization.join.codePlaceholder",
                      "Enter invitation code (e.g., AG-X7K2M9)"
                    )}
                    placeholderTextColor="#999999"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    editable={
                      !validateMutation.isLoading && !joinMutation.isLoading
                    }
                    maxLength={10}
                  />
                  {isValidFormat && !error && (
                    <View style={styles.checkmarkContainer}>
                      <Check size={20} weight="bold" color="#10B981" />
                    </View>
                  )}
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                {/* Verify Button */}
                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    (!isValidFormat || validateMutation.isLoading) &&
                      styles.buttonDisabled
                  ]}
                  onPress={handleVerify}
                  disabled={!isValidFormat || validateMutation.isLoading}
                  activeOpacity={0.8}
                >
                  {validateMutation.isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.verifyButtonText}>
                      {t("organization.join.verify", "Verify Code")}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Agency Preview Card */}
                {agencyPreview && (
                  <View style={styles.agencyPreviewCard}>
                    <View style={styles.agencyLogoContainer}>
                      {agencyPreview.organization?.logo ? (
                        <Image
                          source={{ uri: agencyPreview.organization.logo }}
                          style={styles.agencyLogo}
                        />
                      ) : (
                        <View style={styles.agencyLogoPlaceholder}>
                          <Building size={24} weight="fill" color="#666666" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.agencyName}>
                      {agencyPreview.organization?.name ||
                        t("organization.unnamedAgency", "Unnamed agency")}
                    </Text>
                    <Text style={styles.agencyOwner}>
                      {t("organization.join.owner", "Owner")}:{" "}
                      {agencyPreview.organization?.owner?.fullName ||
                        `${
                          agencyPreview.organization?.owner?.firstName || ""
                        } ${
                          agencyPreview.organization?.owner?.lastName || ""
                        }`.trim() ||
                        t("organization.unknownOwner", "Unknown")}
                    </Text>
                    <Text style={styles.agencyPropertyCount}>
                      {agencyPreview.organization?.property_count || 0}{" "}
                      {t("organization.join.properties", "properties")}
                    </Text>
                    <View style={styles.warningBox}>
                      <Warning size={16} weight="fill" color="#F59E0B" />
                      <Text style={styles.warningText}>
                        {t(
                          "organization.join.previewWarning",
                          "Properties you add after joining will belong to this agency"
                        )}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.joinPreviewButton}
                      onPress={handleOpenConfirmation}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.joinPreviewButtonText}>
                        {t("organization.join.joinButton", "Join Agency")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={validateMutation.isLoading || joinMutation.isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>
                  {t("common.cancel", "Cancel")}
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
  confirmationModal: {
    maxHeight: SCREEN_HEIGHT * 0.55
  },
  scrollView: {
    flexGrow: 0
  },
  scrollViewContent: {
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
  inputContainer: {
    marginBottom: 12,
    position: "relative"
  },
  input: {
    height: 40,
    backgroundColor: "#F8F8F8",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingRight: 36,
    fontSize: 13,
    color: "#000000",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 0.5
  },
  inputValid: {
    borderColor: "#10B981"
  },
  inputError: {
    borderColor: "#EF4444"
  },
  checkmarkContainer: {
    position: "absolute",
    right: 12,
    top: 12
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginBottom: 12
  },
  verifyButton: {
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#121212",
    marginBottom: 12
  },
  verifyButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#FFFFFF"
  },
  agencyPreviewCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 6
  },
  agencyLogoContainer: {
    marginBottom: 8
  },
  agencyLogo: {
    width: 48,
    height: 48,
    borderRadius: 24
  },
  agencyLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center"
  },
  agencyName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 3,
    textAlign: "center"
  },
  agencyOwner: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 6,
    textAlign: "center"
  },
  agencyPropertyCount: {
    fontSize: 11,
    color: "#999999",
    marginBottom: 8
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEF3C7",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    width: "100%"
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18
  },
  joinPreviewButton: {
    width: "100%",
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#121212"
  },
  joinPreviewButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#FFFFFF"
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 12
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#CCCCCC",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2
  },
  checkboxChecked: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB"
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: "#000000",
    lineHeight: 18
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12
  },
  cancelConfirmButton: {
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#F8F8F8"
  },
  cancelConfirmButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000"
  },
  joinConfirmButton: {
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#121212"
  },
  joinConfirmButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF"
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0"
  },
  cancelButton: {
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#F8F8F8"
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#000000"
  },
  buttonDisabled: {
    opacity: 0.5
  }
});
