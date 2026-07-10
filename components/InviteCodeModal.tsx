/**
 * InviteCodeModal - Clean, Professional Modal for Generating and Displaying Invite Codes
 * Shows the generated code with copy functionality and expiration info
 */

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Text } from "@ui-kitten/components";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming
} from "react-native-reanimated";

import { endpoints } from "../constants";
import { useUser } from "../hooks/useUser";
import { theme } from "../theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface InviteCodeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const InviteCodeModal: React.FC<InviteCodeModalProps> = ({
  visible,
  onClose
}) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [copied, setCopied] = useState(false);

  // Animation values - smooth slide in only
  const backdropOpacity = useSharedValue(0);
  const translateY = useSharedValue(SCREEN_HEIGHT);

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!user?.accessToken) {
        throw new Error("User not authenticated");
      }
      const response = await axios.post(
        `${endpoints.baseURL}/organization/invite-code`,
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
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        t(
          "organization.invite.error",
          "Failed to generate invite code. Please try again."
        );
      Alert.alert(t("organization.invite.errorTitle", "Error"), errorMessage);
    }
  });

  const handleCopy = async () => {
    if (generateMutation.data?.code) {
      await Clipboard.setStringAsync(generateMutation.data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const handleClose = () => {
    if (generateMutation.isLoading) return;
    generateMutation.reset();
    setCopied(false);
    onClose();
  };

  const inviteCode = generateMutation.data?.code;
  const expiresAt = generateMutation.data?.expires_at;

  // Animate on visibility change - smooth slide in, no bounce
  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withTiming(0, { duration: 300 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
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

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <Animated.View
          style={[styles.backdrop, backdropAnimatedStyle]}
          pointerEvents={visible ? "auto" : "none"}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>
        <Animated.View style={[styles.modalContent, contentAnimatedStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {t("organization.invite.title", "Invite Member")}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={generateMutation.isLoading}
            >
              <MaterialIcons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {!inviteCode ? (
              <>
                <Text style={styles.description}>
                  {t(
                    "organization.invite.description",
                    "Generate a secure invite code to share with members. The code will expire in 5 minutes."
                  )}
                </Text>

                {/* Info Box */}
                <View style={styles.infoBox}>
                  <MaterialIcons
                    name="info-outline"
                    size={18}
                    color="#666666"
                  />
                  <Text style={styles.infoText}>
                    {t(
                      "organization.invite.info",
                      "Share this code with the person you want to invite. They can use it to join your organization."
                    )}
                  </Text>
                </View>

                {/* Generate Button */}
                <TouchableOpacity
                  style={[
                    styles.generateButton,
                    generateMutation.isLoading && styles.buttonDisabled
                  ]}
                  onPress={handleGenerate}
                  disabled={generateMutation.isLoading}
                >
                  {generateMutation.isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialIcons name="vpn-key" size={20} color="#FFFFFF" />
                      <Text style={styles.generateButtonText}>
                        {t("organization.invite.generate", "Generate Code")}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.successTitle}>
                  {t(
                    "organization.invite.success.title",
                    "Invite Code Generated!"
                  )}
                </Text>
                <Text style={styles.successDescription}>
                  {t(
                    "organization.invite.success.description",
                    "Share this code with the person you want to invite. It expires in 5 minutes."
                  )}
                </Text>

                {/* Code Display */}
                <View style={styles.codeContainer}>
                  <Text style={styles.codeText} selectable>
                    {inviteCode}
                  </Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={handleCopy}
                  >
                    <MaterialIcons
                      name={copied ? "check" : "content-copy"}
                      size={20}
                      color={copied ? "#00A699" : "#666666"}
                    />
                  </TouchableOpacity>
                </View>

                {copied && (
                  <Text style={styles.copiedText}>
                    {t(
                      "organization.invite.copied",
                      "Code copied to clipboard!"
                    )}
                  </Text>
                )}

                {/* Expiration Info */}
                {expiresAt && (
                  <View style={styles.expiryBox}>
                    <MaterialIcons name="schedule" size={16} color="#FFB400" />
                    <Text style={styles.expiryText}>
                      {t("organization.invite.expires", "Expires in 5 minutes")}
                    </Text>
                  </View>
                )}

                {/* Generate New Button */}
                <TouchableOpacity
                  style={styles.generateNewButton}
                  onPress={handleGenerate}
                  disabled={generateMutation.isLoading}
                >
                  {generateMutation.isLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={theme["color-temporary-primary"]}
                    />
                  ) : (
                    <Text style={styles.generateNewButtonText}>
                      {t(
                        "organization.invite.generateNew",
                        "Generate New Code"
                      )}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.closeFooterButton}
              onPress={handleClose}
              disabled={generateMutation.isLoading}
            >
              <Text style={styles.closeFooterButtonText}>
                {t("common.close", "Close")}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end"
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)"
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 20,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0"
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: -0.3
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center"
  },
  content: {
    padding: 20
  },
  description: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    marginBottom: 20
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8F8F8",
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
    gap: 10
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#666666",
    lineHeight: 16
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    backgroundColor: theme["color-temporary-primary"],
    borderRadius: 12,
    gap: 8
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF"
  },
  buttonDisabled: {
    opacity: 0.5
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
    textAlign: "center"
  },
  successDescription: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 18,
    marginBottom: 24,
    textAlign: "center"
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: theme["color-temporary-primary"],
    borderStyle: "dashed"
  },
  codeText: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: 2,
    fontFamily: "monospace"
  },
  copyButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0"
  },
  copiedText: {
    fontSize: 12,
    color: "#00A699",
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "600"
  },
  expiryBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF9E6",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    gap: 6
  },
  expiryText: {
    fontSize: 12,
    color: "#FFB400",
    fontWeight: "600"
  },
  generateNewButton: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme["color-temporary-primary"]
  },
  generateNewButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme["color-temporary-primary"]
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0"
  },
  closeFooterButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F8F8F8"
  },
  closeFooterButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000"
  }
});
