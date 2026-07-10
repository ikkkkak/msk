/**
 * UpdateRoleModal - Clean, Professional Modal for Updating Member Roles
 * Allows organization owners/admins to change member roles
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
import { Text } from "@ui-kitten/components";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

interface UpdateRoleModalProps {
  visible: boolean;
  onClose: () => void;
  member: {
    id: number;
    user?: {
      firstName?: string;
      lastName?: string;
      email?: string;
    };
    role?: string;
  } | null;
  onSuccess?: () => void;
}

const ROLES = ["admin", "manager", "editor", "viewer"] as const;
type Role = (typeof ROLES)[number];

export const UpdateRoleModal: React.FC<UpdateRoleModalProps> = ({
  visible,
  onClose,
  member,
  onSuccess
}) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<Role>("viewer");

  // Animation values - smooth slide in only
  const backdropOpacity = useSharedValue(0);
  const translateY = useSharedValue(SCREEN_HEIGHT);

  // Update selected role when member changes
  useEffect(() => {
    if (member?.role && ROLES.includes(member.role as Role)) {
      setSelectedRole(member.role as Role);
    }
  }, [member]);

  // Animate modal appearance - smooth slide in, no bounce
  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withTiming(0, { duration: 300 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
    }
  }, [visible]);

  const updateRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      if (!user?.accessToken || !member?.id) {
        throw new Error("User not authenticated or member not selected");
      }
      const response = await axios.patch(
        `${endpoints.baseURL}/organization/members/${member.id}/role`,
        { role },
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
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["organization-members"] });
      queryClient.invalidateQueries({ queryKey: ["user-organization"] });

      Alert.alert(
        t("organization.updateRole.success", "Role Updated"),
        t(
          "organization.updateRole.successMessage",
          "Member role has been updated successfully."
        ),
        [
          {
            text: t("common.ok", "OK"),
            onPress: () => {
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
          "organization.updateRole.errorMessage",
          "Failed to update member role. Please try again."
        );
      Alert.alert(t("organization.updateRole.error", "Error"), errorMessage);
    }
  });

  const handleUpdate = () => {
    if (!selectedRole || selectedRole === member?.role) {
      Alert.alert(
        t("organization.updateRole.error", "Error"),
        t(
          "organization.updateRole.errorMessage",
          "Please select a different role."
        )
      );
      return;
    }
    updateRoleMutation.mutate(selectedRole);
  };

  const handleClose = () => {
    if (updateRoleMutation.isPending) return;
    updateRoleMutation.reset();
    setSelectedRole("viewer");
    onClose();
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  if (!member) return null;

  const memberName = member.user
    ? `${member.user.firstName || ""} ${member.user.lastName || ""}`.trim() ||
      member.user.email
    : "Member";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View style={[styles.modal, modalStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {t("organization.updateRole.title", "Update Member Role")}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={updateRoleMutation.isPending}
            >
              <MaterialIcons
                name="close"
                size={24}
                color={updateRoleMutation.isPending ? "#CCCCCC" : "#222222"}
              />
            </TouchableOpacity>
          </View>

          {/* Member Info */}
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{memberName}</Text>
            {member.user?.email && (
              <Text style={styles.memberEmail}>{member.user.email}</Text>
            )}
            <Text style={styles.currentRole}>
              {t("common.current", "Current")}{" "}
              {t("organization.updateRole.selectRole", "Role")}:{" "}
              <Text style={styles.currentRoleValue}>
                {t(`organization.roles.${member.role || "viewer"}`)}
              </Text>
            </Text>
          </View>

          {/* Role Selection */}
          <View style={styles.roleSection}>
            <Text style={styles.roleLabel}>
              {t("organization.updateRole.selectRole", "Select Role")}
            </Text>
            <View style={styles.rolesList}>
              {ROLES.map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleButton,
                    selectedRole === role && styles.roleButtonSelected
                  ]}
                  onPress={() => setSelectedRole(role)}
                  disabled={
                    updateRoleMutation.isPending || role === member.role
                  }
                >
                  <View style={styles.roleButtonContent}>
                    <View
                      style={[
                        styles.radioButton,
                        selectedRole === role && styles.radioButtonSelected
                      ]}
                    >
                      {selectedRole === role && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.roleButtonText,
                        selectedRole === role && styles.roleButtonTextSelected,
                        role === member.role && styles.roleButtonTextDisabled
                      ]}
                    >
                      {t(`organization.roles.${role}`)}
                    </Text>
                    {role === member.role && (
                      <Text style={styles.currentBadge}>
                        ({t("common.current", "Current")})
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                updateRoleMutation.isPending && styles.buttonDisabled
              ]}
              onPress={handleClose}
              disabled={updateRoleMutation.isPending}
            >
              <Text style={styles.cancelButtonText}>
                {t("common.cancel", "Cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.updateButton,
                (updateRoleMutation.isPending ||
                  selectedRole === member.role) &&
                  styles.buttonDisabled
              ]}
              onPress={handleUpdate}
              disabled={
                updateRoleMutation.isPending || selectedRole === member.role
              }
            >
              {updateRoleMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.updateButtonText}>
                  {t("organization.updateRole.update", "Update Role")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end"
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    maxHeight: SCREEN_HEIGHT * 0.85
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    flex: 1
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center"
  },
  memberInfo: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0"
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 4
  },
  memberEmail: {
    fontSize: 13,
    color: "#717171",
    marginBottom: 8
  },
  currentRole: {
    fontSize: 13,
    color: "#717171"
  },
  currentRoleValue: {
    fontWeight: "600",
    color: "#222222"
  },
  roleSection: {
    marginBottom: 24
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 12
  },
  rolesList: {
    gap: 8
  },
  roleButton: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: "transparent"
  },
  roleButtonSelected: {
    backgroundColor: "#F0F7FF",
    borderColor: theme["color-temporary-primary"]
  },
  roleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center"
  },
  radioButtonSelected: {
    borderColor: theme["color-temporary-primary"]
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme["color-temporary-primary"]
  },
  roleButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#222222"
  },
  roleButtonTextSelected: {
    fontWeight: "600",
    color: theme["color-temporary-primary"]
  },
  roleButtonTextDisabled: {
    color: "#999999"
  },
  currentBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: "#717171",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  actions: {
    flexDirection: "row",
    gap: 12
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222222"
  },
  updateButton: {
    flex: 1,
    backgroundColor: theme["color-temporary-primary"],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  updateButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF"
  },
  buttonDisabled: {
    opacity: 0.5
  }
});
