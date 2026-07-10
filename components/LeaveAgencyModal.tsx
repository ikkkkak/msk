/**
 * LeaveAgencyModal - Professional Modal for Leaving an Agency
 * Security-first implementation with clear warnings
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  Keyboard
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "../hooks/useUser";
import { endpoints } from "../constants";
import { theme } from "../theme";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useAnimatedKeyboard
} from "react-native-reanimated";

interface LeaveAgencyModalProps {
  visible: boolean;
  onClose: () => void;
  organization: any;
  onSuccess?: () => void;
}

export const LeaveAgencyModal: React.FC<LeaveAgencyModalProps> = ({
  visible,
  onClose,
  organization,
  onSuccess
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [confirmText, setConfirmText] = useState("");

  // Get confirmation text based on current language
  const getConfirmText = () => {
    const lang = i18n.language || "en";
    if (lang.startsWith("ar")) return "مغادرة";
    if (lang.startsWith("fr")) return "QUITTER";
    return "LEAVE";
  };

  const requiredConfirmText = getConfirmText();

  const leaveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.accessToken) {
        throw new Error("User not authenticated");
      }
      const response = await axios.post(
        `${endpoints.baseURL}/organization/leave`,
        {},
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
      // Invalidate all organization-related queries
      queryClient.invalidateQueries({ queryKey: ["user-organization"] });
      queryClient.invalidateQueries({ queryKey: ["user-properties"] });
      queryClient.invalidateQueries({ queryKey: ["user-landmarks"] });
      queryClient.invalidateQueries({ queryKey: ["can-create-personal"] });

      Alert.alert(
        t("organization.leave.success.title", "Left Successfully"),
        t(
          "organization.leave.success.message",
          "You have successfully left the organization."
        ),
        [
          {
            text: t("common.ok", "OK"),
            onPress: () => {
              setConfirmText("");
              onClose();
              onSuccess?.();
            }
          }
        ]
      );
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        t(
          "organization.leave.error.message",
          "Failed to leave organization. Please try again."
        );
      Alert.alert(t("organization.leave.error.title", "Error"), errorMessage);
    }
  });

  const handleLeave = () => {
    // Language-aware confirmation text
    const confirmTextTrimmed = confirmText.trim();
    const isValid =
      confirmTextTrimmed.toLowerCase() === requiredConfirmText.toLowerCase();

    if (!isValid) {
      Alert.alert(
        t("organization.leave.error.title", "Error"),
        t(
          "organization.leave.error.confirmText",
          'Please type "{{confirmText}}" to confirm.',
          {
            confirmText: requiredConfirmText
          }
        )
      );
      return;
    }

    Alert.alert(
      t("organization.leave.confirm.title", "Leave Organization?"),
      t(
        "organization.leave.confirm.message",
        "Are you sure you want to leave {{agencyName}}? You will lose access to all agency properties and data.",
        {
          agencyName: organization?.name || t("organization.yourAgency")
        }
      ),
      [
        {
          text: t("common.cancel", "Cancel"),
          style: "cancel"
        },
        {
          text: t("organization.leave.confirm.button", "Leave"),
          style: "destructive",
          onPress: () => {
            leaveMutation.mutate();
          }
        }
      ]
    );
  };

  const slideY = useSharedValue(300);
  const opacity = useSharedValue(0);
  const keyboard = useAnimatedKeyboard();

  React.useEffect(() => {
    if (visible) {
      slideY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      slideY.value = withTiming(300, { duration: 250 });
      opacity.value = withTiming(0, { duration: 200 });
      setConfirmText("");
      Keyboard.dismiss();
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));

  const modalStyle = useAnimatedStyle(() => {
    // Push modal up when keyboard appears
    let offset = 0;
    try {
      if (keyboard?.height && keyboard?.progress) {
        const keyboardHeight = keyboard.height.value || 0;
        const keyboardProgress = keyboard.progress.value || 0;
        offset = keyboardHeight * keyboardProgress;
      }
    } catch (error) {
      // Fallback if keyboard API is not available
      offset = 0;
    }

    return {
      transform: [{ translateY: slideY.value - offset }],
      width: "100%"
    };
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, backdropStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View style={[styles.modalContainer, modalStyle]}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {t("organization.leave.title", "Leave Organization")}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={leaveMutation.isLoading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons
                name="close"
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.warningBox}>
              <MaterialIcons name="warning" size={32} color={COLORS.warning} />
              <Text style={styles.warningTitle}>
                {t("organization.leave.warning.title", "Important Notice")}
              </Text>
              <Text style={styles.warningText}>
                {t(
                  "organization.leave.warning.message",
                  "Leaving {{agencyName}} will:",
                  {
                    agencyName:
                      organization?.name || t("organization.yourAgency")
                  }
                )}
              </Text>
              <View style={styles.consequencesList}>
                <View style={styles.consequenceItem}>
                  <MaterialIcons
                    name="remove-circle"
                    size={16}
                    color={COLORS.warning}
                  />
                  <Text style={styles.consequenceText}>
                    {t(
                      "organization.leave.warning.consequence1",
                      "Remove your access to all agency properties and data"
                    )}
                  </Text>
                </View>
                <View style={styles.consequenceItem}>
                  <MaterialIcons
                    name="remove-circle"
                    size={16}
                    color={COLORS.warning}
                  />
                  <Text style={styles.consequenceText}>
                    {t(
                      "organization.leave.warning.consequence2",
                      "Prevent you from creating new properties under this agency"
                    )}
                  </Text>
                </View>
                <View style={styles.consequenceItem}>
                  <MaterialIcons
                    name="remove-circle"
                    size={16}
                    color={COLORS.warning}
                  />
                  <Text style={styles.consequenceText}>
                    {t(
                      "organization.leave.warning.consequence3",
                      "Allow you to create personal properties again"
                    )}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.agencyInfo}>
              <View style={styles.agencyInfoRow}>
                <MaterialIcons name="business" size={20} color={COLORS.text} />
                <Text style={styles.agencyName}>
                  {organization?.name || t("organization.yourAgency")}
                </Text>
              </View>
              {organization?.business_type && (
                <View style={styles.agencyInfoRow}>
                  <MaterialIcons
                    name="category"
                    size={18}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.agencyType}>
                    {t(
                      `organization.businessTypes.${organization.business_type}`,
                      organization.business_type
                    )}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.confirmSection}>
              <Text style={styles.confirmLabel}>
                {t(
                  "organization.leave.confirm.label",
                  'Type "{{confirmText}}" to confirm:',
                  {
                    confirmText: requiredConfirmText
                  }
                )}
              </Text>
              <TextInput
                style={[
                  styles.confirmInput,
                  confirmText.trim().toLowerCase() ===
                    requiredConfirmText.toLowerCase() &&
                    styles.confirmInputValid
                ]}
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder={`${t(
                  "organization.leave.confirm.placeholder",
                  "Type"
                )} "${requiredConfirmText}" ${t(
                  "organization.leave.confirm.placeholderSuffix",
                  "to confirm..."
                )}`}
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!leaveMutation.isLoading}
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (
                    confirmText.trim().toLowerCase() ===
                    requiredConfirmText.toLowerCase()
                  ) {
                    handleLeave();
                  }
                }}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  leaveMutation.isLoading && styles.buttonDisabled
                ]}
                onPress={onClose}
                disabled={leaveMutation.isLoading}
              >
                <Text style={styles.cancelButtonText}>
                  {t("common.cancel", "Cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.leaveButton,
                  (leaveMutation.isLoading ||
                    confirmText.trim().toLowerCase() !==
                      requiredConfirmText.toLowerCase()) &&
                    styles.buttonDisabled
                ]}
                onPress={handleLeave}
                disabled={
                  leaveMutation.isLoading ||
                  confirmText.trim().toLowerCase() !==
                    requiredConfirmText.toLowerCase()
                }
              >
                {leaveMutation.isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.leaveButtonText}>
                    {t("organization.leave.button", "Leave")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const COLORS = {
  background: "#FFFFFF",
  text: "#222222",
  textSecondary: "#717171",
  border: "#E0E0E0",
  accent: theme["color-temporary-primary"],
  warning: "#FF6B00",
  danger: "#DC2626",
  cardBackground: "#F8F8F8"
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end"
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: "100%",
    maxHeight: "90%",
    minHeight: "60%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginHorizontal: 12,
    letterSpacing: -0.3
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardBackground,
    justifyContent: "center",
    alignItems: "center"
  },
  scrollView: {
    flex: 1,
    width: "100%"
  },
  scrollContent: {
    padding: 16,
    gap: 20,
    paddingBottom: 20,
    flexGrow: 1
  },
  content: {
    padding: 16,
    gap: 20
  },
  warningBox: {
    backgroundColor: "#FFF4E6",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.warning + "30",
    alignItems: "center"
  },
  warningTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.warning,
    marginTop: 8,
    marginBottom: 12,
    textAlign: "center"
  },
  warningText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center"
  },
  consequencesList: {
    width: "100%",
    gap: 10,
    marginTop: 8
  },
  consequenceItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10
  },
  consequenceText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18
  },
  agencyInfo: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    gap: 12
  },
  agencyInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  agencyName: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "600"
  },
  agencyType: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500"
  },
  confirmSection: {
    gap: 8
  },
  confirmLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text
  },
  confirmInput: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: "500",
    minHeight: 48
  },
  confirmInputValid: {
    color: COLORS.text,
    fontWeight: "600",
    borderColor: COLORS.accent
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.cardBackground,
    alignItems: "center",
    justifyContent: "center"
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text
  },
  leaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center"
  },
  leaveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF"
  },
  buttonDisabled: {
    opacity: 0.5
  }
});
