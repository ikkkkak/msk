import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
  Dimensions
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useUserQuery } from "../hooks/queries/useUserQuery";
import FormSheet from "../components/FormSheet";
import CustomToast from "../components/CustomToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

const { width } = Dimensions.get("window");

export const UserProfileScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { data: userData, isLoading } = useUserQuery();
  const queryClient = useQueryClient();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "success"
  );

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (updateData: {
      firstName?: string;
      lastName?: string;
      email?: string;
    }) => {
      console.log(
        "📝 Sending update to /user/profile with data:",
        JSON.stringify(updateData)
      );
      const { data } = await api.post("/user/profile", updateData);
      console.log("✅ Update response:", data);
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch user query
      queryClient.invalidateQueries({ queryKey: ["user", userData?.ID] });
    }
  });

  const showToastMessage = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue || "");
  };

  const handleSave = async () => {
    if (!editingField) return;

    // Prepare update data with proper field names
    const updateData: { [key: string]: string } = {};
    if (editingField === "firstName") {
      updateData.firstName = tempValue;
    } else if (editingField === "lastName") {
      updateData.lastName = tempValue;
    } else if (editingField === "email") {
      updateData.email = tempValue;
    }

    console.log("📝 Sending update data:", updateData);

    try {
      const result = await updateUserMutation.mutateAsync(updateData as any);
      console.log("✅ Update successful:", result);
      setEditingField(null);
      setTempValue("");
      showToastMessage(
        t("profile.updatedSuccessfully", "Profile updated successfully")
      );
    } catch (error) {
      console.error("❌ Error updating user:", error);
      showToastMessage(
        t("profile.updateFailed", "Failed to update profile"),
        "error"
      );
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setTempValue("");
  };

  const getFieldLabel = (field: string) => {
    const labels: { [key: string]: string } = {
      firstName: t("profile.firstName", "First Name"),
      lastName: t("profile.lastName", "Last Name"),
      email: t("profile.email", "Email"),
      bio: t("profile.bio", "Bio"),
      location: t("profile.location", "Location"),
      occupation: t("profile.occupation", "Occupation"),
      company: t("profile.company", "Company"),
      website: t("profile.website", "Website"),
      instagram: t("profile.instagram", "Instagram"),
      twitter: t("profile.twitter", "Twitter"),
      linkedin: t("profile.linkedin", "LinkedIn")
    };
    return labels[field] || field;
  };

  const getFieldPlaceholder = (field: string) => {
    const placeholders: { [key: string]: string } = {
      firstName: t("profile.firstNamePlaceholder", "Enter your first name"),
      lastName: t("profile.lastNamePlaceholder", "Enter your last name"),
      email: t("profile.emailPlaceholder", "Enter your email address"),
      bio: t("profile.bioPlaceholder", "Tell us about yourself"),
      location: t("profile.locationPlaceholder", "Where are you based?"),
      occupation: t("profile.occupationPlaceholder", "What do you do?"),
      company: t("profile.companyPlaceholder", "Your company"),
      website: t("profile.websitePlaceholder", "https://yourwebsite.com"),
      instagram: t("profile.instagramPlaceholder", "@yourusername"),
      twitter: t("profile.twitterPlaceholder", "@yourusername"),
      linkedin: t("profile.linkedinPlaceholder", "linkedin.com/in/yourprofile")
    };
    return placeholders[field] || "";
  };

  const ProfileField = ({
    field,
    value,
    icon,
    iconColor = "#222222",
    iconBg = "#F7F7F7",
    multiline = false
  }: {
    field: string;
    value: string;
    icon: string;
    iconColor?: string;
    iconBg?: string;
    multiline?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.fieldRow}
      onPress={() => handleEdit(field, value)}
      activeOpacity={0.7}
    >
      <View style={styles.fieldContent}>
        <View style={[styles.fieldIcon, { backgroundColor: iconBg }]}>
          <MaterialIcons name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={styles.fieldText}>
          <Text style={styles.fieldLabel}>{getFieldLabel(field)}</Text>
          <Text style={styles.fieldValue} numberOfLines={multiline ? 3 : 1}>
            {value || t("profile.notProvided", "Not provided")}
          </Text>
        </View>
      </View>
      <MaterialIcons name="edit" size={20} color="#717171" />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          {t("common.loading", "Loading...")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
        >
          <MaterialIcons name="arrow-back-ios" size={20} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("profile.personalInfo", "Personal Information")}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {userData?.avatarURL ? (
              <Image
                source={{ uri: userData.avatarURL }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="person" size={40} color="#717171" />
              </View>
            )}
            <TouchableOpacity
              style={styles.avatarEditButton}
              onPress={() => handleEdit("avatarURL", userData?.avatarURL || "")}
            >
              <MaterialIcons name="camera-alt" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {userData?.firstName && userData?.lastName
                ? `${userData.firstName} ${userData.lastName}`
                : t("profile.addYourName", "Add your name")}
            </Text>
            <Text style={styles.profileEmail}>
              {userData?.email ||
                t("profile.emailNotAvailable", "Email not available")}
            </Text>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("profile.basicInfo", "Basic Information")}
          </Text>
          <View style={styles.card}>
            <ProfileField
              field="firstName"
              value={userData?.firstName || ""}
              icon="person-outline"
              iconColor="#FF385C"
              iconBg="#FFE8ED"
            />
            <View style={styles.divider} />
            <ProfileField
              field="lastName"
              value={userData?.lastName || ""}
              icon="person-outline"
              iconColor="#FF385C"
              iconBg="#FFE8ED"
            />
            <View style={styles.divider} />
            <ProfileField
              field="email"
              value={userData?.email || ""}
              icon="email"
              iconColor="#00A699"
              iconBg="#E0F7F5"
            />
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Edit Modal */}
      <FormSheet
        visible={editingField !== null}
        onClose={handleCancel}
        title={getFieldLabel(editingField || "")}
      >
        <View style={styles.editContainer}>
          <TextInput
            style={[
              styles.editInput,
              editingField === "bio" && styles.editInputMultiline
            ]}
            value={tempValue}
            onChangeText={setTempValue}
            placeholder={getFieldPlaceholder(editingField || "")}
            placeholderTextColor="#999"
            multiline={editingField === "bio"}
            numberOfLines={editingField === "bio" ? 4 : 1}
            textAlignVertical={editingField === "bio" ? "top" : "center"}
          />

          <View style={styles.editButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>
                {t("common.cancel", "Cancel")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {t("common.save", "Save")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </FormSheet>

      {/* Toast */}
      {showToast && (
        <CustomToast
          message={toastMessage}
          type={toastType}
          duration={3000}
          onHide={() => setShowToast(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF"
  },
  loadingText: {
    fontSize: 16,
    color: "#717171"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: "15%",
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2"
  },
  backButton: {
    paddingRight: 14,
    paddingVertical: 5,
    marginRight: 6
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    flex: 1,
    textAlign: "left"
  },
  headerSpacer: {
    width: 40
  },
  scrollView: {
    flex: 1
  },
  profileHeader: {
    flexDirection: "row",
    padding: 24,
    backgroundColor: "#FFFFFF"
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center"
  },
  avatarEditButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF385C",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  profileInfo: {
    flex: 1,
    justifyContent: "center"
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 4
  },
  profileEmail: {
    fontSize: 16,
    color: "#717171",
    marginBottom: 12
  },
  completionContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  completionBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#F0F0F0",
    borderRadius: 3,
    marginRight: 8
  },
  completionFill: {
    height: "100%",
    backgroundColor: "#FF385C",
    borderRadius: 3
  },
  completionText: {
    fontSize: 12,
    color: "#717171",
    fontWeight: "500"
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 24
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 16
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    overflow: "hidden"
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 72
  },
  fieldContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16
  },
  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16
  },
  fieldText: {
    flex: 1
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#222222",
    marginBottom: 4
  },
  fieldValue: {
    fontSize: 14,
    color: "#717171",
    lineHeight: 20
  },
  divider: {
    height: 1,
    backgroundColor: "#EBEBEB",
    marginLeft: 84
  },
  arrayField: {
    paddingVertical: 16,
    paddingHorizontal: 20
  },
  arrayFieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  arrayValues: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  arrayTag: {
    backgroundColor: "#F7F7F7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  arrayTagText: {
    fontSize: 14,
    color: "#222222",
    fontWeight: "500"
  },
  arrayEmpty: {
    fontSize: 14,
    color: "#717171",
    fontStyle: "italic"
  },
  editContainer: {
    padding: 20
  },
  editInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    color: "#222",
    marginBottom: 20
  },
  editInputMultiline: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12
  },
  editButtons: {
    flexDirection: "row",
    gap: 12
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    alignItems: "center"
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#717171"
  },
  saveButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#222",
    alignItems: "center"
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF"
  },
  bottomSpacer: {
    height: 40
  },
  createProfileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE8ED",
    padding: 24,
    alignItems: "center",
    marginTop: 16
  },
  createProfileTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center"
  },
  createProfileDescription: {
    fontSize: 14,
    color: "#717171",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 20
  },
  createProfileButton: {
    backgroundColor: "#FF385C",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center"
  },
  createProfileButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF"
  }
});
