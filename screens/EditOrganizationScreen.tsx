/**
 * Edit agency — calm Airbnb-style form: header save, clear sections, no duplicate CTAs.
 */

import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { pickImageNative } from "../utils/nativePhotoPicker";
import {
  Buildings,
  Camera,
  Check,
  Image as ImageIcon,
  Lock,
} from "phosphor-react-native";
import { endpoints } from "../constants";
import { useUser } from "../hooks/useUser";
import { Loading } from "../components/Loading";
import CustomToast from "../components/CustomToast";
import { OrgScreenHeader } from "../components/organization/OrgScreenHeader";
import { orgTheme as c } from "../components/organization/orgTheme";

const BUSINESS_TYPES = [
  { id: "brokerage", nameKey: "organization.businessTypes.brokerage" },
  { id: "agency", nameKey: "organization.businessTypes.agency" },
  { id: "individual", nameKey: "organization.businessTypes.individual" },
  { id: "developer", nameKey: "organization.businessTypes.developer" },
] as const;

function lockHint(t: TFunction, daysLeft: number | undefined): string | undefined {
  if (!daysLeft || daysLeft <= 0) return undefined;
  return t("organization.editableInDays", "Editable in {{count}} days", {
    count: daysLeft,
  });
}

function FieldLabel({
  label,
  hint,
  locked,
}: {
  label: string;
  hint?: string;
  locked?: boolean;
}) {
  return (
    <View style={styles.labelWrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {locked ? <Lock size={12} color={c.muted} /> : null}
      </View>
      {hint ? <Text style={styles.labelHint}>{hint}</Text> : null}
    </View>
  );
}

export const EditOrganizationScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const { organization, daysLeft } = (route.params as any) || {};

  const [formData, setFormData] = useState({
    name: organization?.name || "",
    description: organization?.description || "",
    business_type: organization?.business_type || "",
    banner_image: organization?.banner_image || "",
    logo: organization?.logo || "",
  });

  const [uploading, setUploading] = useState<"logo" | "banner_image" | null>(
    null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ visible: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ visible: true, message, type });
  };

  const pickImage = useCallback(
    async (field: "banner_image" | "logo") => {
      const locked = (daysLeft?.[field] || 0) > 0;
      if (locked) {
        Alert.alert(
          t("organization.editLockedTitle", "Editing restricted"),
          lockHint(t, daysLeft?.[field]) ??
            t(
              "organization.editLockedBody",
              "This can only be changed every 30 days.",
            ),
        );
        return;
      }
      try {
        setUploading(field);
        const result = await pickImageNative({
          allowsEditing: true,
          aspect: field === "banner_image" ? [16, 9] : [1, 1],
          quality: 0.85,
          base64: true,
        });
        if (result.canceled || !result.assets?.length) return;
        const asset = result.assets[0];
        if (!asset.base64) {
          Alert.alert(
            t("common.error", "Error"),
            t("organization.imageReadError", "Unable to read the selected image."),
          );
          return;
        }
        const base64Data = `data:image/jpeg;base64,${asset.base64}`;
        const response = await fetch(`${endpoints.baseURL}/upload-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.accessToken}`,
          },
          body: JSON.stringify({
            image: base64Data,
            publicId: `org_${field}_${Date.now()}`,
          }),
        });
        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();
        if (data.url) {
          setFormData((prev) => ({ ...prev, [field]: data.url }));
        }
      } catch {
        Alert.alert(
          t("organization.uploadFailedTitle", "Upload failed"),
          t(
            "organization.uploadFailedBody",
            "Please try again with a different photo.",
          ),
        );
      } finally {
        setUploading(null);
      }
    },
    [daysLeft, t, user?.accessToken],
  );

  const updateOrgMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await axios.put(endpoints.organization, data, {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-organization"] });
      queryClient.invalidateQueries({ queryKey: ["organization-members"] });
      showToast(
        t("organization.updateSuccess", "Agency profile updated."),
        "success",
      );
      setTimeout(() => navigation.goBack(), 600);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        t("organization.updateFailed", "Could not save. Please try again.");
      showToast(msg, "error");
    },
  });

  const handleSave = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = t("organization.nameRequired", "Name is required.");
    }
    if (!formData.business_type) {
      newErrors.business_type = t(
        "organization.typeRequired",
        "Select a business type.",
      );
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: Record<string, string> = {};
    const keys = [
      "name",
      "description",
      "business_type",
      "banner_image",
      "logo",
    ] as const;
    for (const key of keys) {
      const changed = formData[key] !== (organization?.[key] ?? "");
      const unlocked = !daysLeft?.[key] || daysLeft[key] === 0;
      if (changed && unlocked) payload[key] = formData[key];
    }

    if (!Object.keys(payload).length) {
      Alert.alert(
        t("organization.noChangesTitle", "No changes"),
        t(
          "organization.noChangesBody",
          "Nothing eligible to save, or fields are still on cooldown.",
        ),
      );
      return;
    }

    updateOrgMutation.mutate(payload);
  }, [formData, organization, daysLeft, t, updateOrgMutation]);

  const saving = updateOrgMutation.isPending;

  if (!user) return <Loading />;

  if (!organization) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" />
        <OrgScreenHeader
          title={t("organization.editAgency", "Edit agency")}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.empty}>
          <Buildings size={40} color={c.muted} />
          <Text style={styles.emptyText}>
            {t("organization.notFound", "Agency not found")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const bannerLocked = (daysLeft?.banner_image || 0) > 0;
  const logoLocked = (daysLeft?.logo || 0) > 0;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <OrgScreenHeader
          title={t("organization.editAgency", "Edit agency")}
          onBack={() => navigation.goBack()}
          onSave={handleSave}
          saveLabel={t("common.save", "Save")}
          saveLoading={saving}
        />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.lead}>
            {t(
              "organization.editLead",
              "Update how buyers see your agency on listings.",
            )}
          </Text>

          {/* Photos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("organization.photosSection", "Photos")}
            </Text>

            <TouchableOpacity
              style={styles.coverCard}
              onPress={() => pickImage("banner_image")}
              disabled={!!uploading || bannerLocked}
              activeOpacity={0.9}
            >
              {formData.banner_image ? (
                <Image
                  source={{ uri: formData.banner_image }}
                  style={styles.coverImg}
                />
              ) : (
                <View style={styles.coverEmpty}>
                  <ImageIcon size={28} color={c.muted} />
                </View>
              )}
              {uploading === "banner_image" ? (
                <View style={styles.mediaBusy}>
                  <ActivityIndicator color="#FFF" />
                </View>
              ) : bannerLocked ? (
                <View style={styles.mediaBusy}>
                  <Lock size={18} color="#FFF" weight="bold" />
                </View>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => pickImage("banner_image")}
              disabled={bannerLocked || !!uploading}
              style={styles.changeLink}
            >
              <Text style={styles.changeLinkText}>
                {formData.banner_image
                  ? t("organization.changeCover", "Change cover photo")
                  : t("organization.addCover", "Add cover photo")}
              </Text>
            </TouchableOpacity>
            {bannerLocked ? (
              <Text style={styles.cooldown}>
                {lockHint(t, daysLeft?.banner_image)}
              </Text>
            ) : null}

            <View style={styles.logoRow}>
              <TouchableOpacity
                style={styles.logoCard}
                onPress={() => pickImage("logo")}
                disabled={!!uploading || logoLocked}
                activeOpacity={0.9}
              >
                {formData.logo ? (
                  <Image source={{ uri: formData.logo }} style={styles.logoImg} />
                ) : (
                  <View style={styles.logoEmpty}>
                    <Buildings size={24} color={c.muted} />
                  </View>
                )}
                {uploading === "logo" ? (
                  <View style={styles.mediaBusy}>
                    <ActivityIndicator color="#FFF" size="small" />
                  </View>
                ) : logoLocked ? (
                  <View style={styles.mediaBusy}>
                    <Lock size={14} color="#FFF" weight="bold" />
                  </View>
                ) : !logoLocked && !uploading ? (
                  <View style={styles.logoCam}>
                    <Camera size={12} color="#FFF" weight="bold" />
                  </View>
                ) : null}
              </TouchableOpacity>
              <View style={styles.logoMeta}>
                <Text style={styles.logoTitle}>
                  {t("organization.logoTitle", "Logo")}
                </Text>
                <Text style={styles.logoSub}>
                  {t(
                    "organization.logoSub",
                    "Square image, shown on your agency card.",
                  )}
                </Text>
                <TouchableOpacity
                  onPress={() => pickImage("logo")}
                  disabled={logoLocked || !!uploading}
                >
                  <Text style={styles.changeLinkText}>
                    {formData.logo
                      ? t("organization.changeLogo", "Change logo")
                      : t("organization.addLogo", "Add logo")}
                  </Text>
                </TouchableOpacity>
                {logoLocked ? (
                  <Text style={styles.cooldown}>
                    {lockHint(t, daysLeft?.logo)}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("organization.detailsSection", "Details")}
            </Text>

            <View style={styles.field}>
              <FieldLabel
                label={t("organization.nameLabel", "Agency name")}
                hint={lockHint(t, daysLeft?.name)}
                locked={(daysLeft?.name || 0) > 0}
              />
              <TextInput
                style={[
                  styles.input,
                  errors.name && styles.inputError,
                  (daysLeft?.name || 0) > 0 && styles.inputDisabled,
                ]}
                value={formData.name}
                onChangeText={(v) => {
                  setFormData((p) => ({ ...p, name: v }));
                  setErrors((p) => ({ ...p, name: "" }));
                }}
                placeholder={t(
                  "organization.namePlaceholder",
                  "Your agency name",
                )}
                placeholderTextColor={c.muted}
                editable={(daysLeft?.name || 0) === 0}
                autoCapitalize="words"
              />
              {errors.name ? (
                <Text style={styles.errorText}>{errors.name}</Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <FieldLabel
                label={t("organization.descriptionLabel", "About")}
                hint={
                  lockHint(t, daysLeft?.description) ??
                  t("organization.descriptionOptional", "Optional")
                }
                locked={(daysLeft?.description || 0) > 0}
              />
              <TextInput
                style={[
                  styles.input,
                  styles.inputArea,
                  (daysLeft?.description || 0) > 0 && styles.inputDisabled,
                ]}
                value={formData.description}
                onChangeText={(v) =>
                  setFormData((p) => ({ ...p, description: v }))
                }
                placeholder={t(
                  "organization.descriptionPlaceholder",
                  "Tell buyers about your agency…",
                )}
                placeholderTextColor={c.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={(daysLeft?.description || 0) === 0}
              />
            </View>

            <View style={styles.field}>
              <FieldLabel
                label={t("organization.businessType", "Business type")}
                hint={lockHint(t, daysLeft?.business_type)}
                locked={(daysLeft?.business_type || 0) > 0}
              />
              <View style={styles.typeList}>
                {BUSINESS_TYPES.map((type) => {
                  const active = formData.business_type === type.id;
                  const locked = (daysLeft?.business_type || 0) > 0;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[styles.typeRow, active && styles.typeRowOn]}
                      onPress={() => {
                        if (locked) return;
                        setFormData((p) => ({
                          ...p,
                          business_type: type.id,
                        }));
                        setErrors((p) => ({ ...p, business_type: "" }));
                      }}
                      disabled={locked}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.typeRowText,
                          active && styles.typeRowTextOn,
                        ]}
                      >
                        {t(type.nameKey, type.id)}
                      </Text>
                      {active ? (
                        <Check size={18} color={c.accent} weight="bold" />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.business_type ? (
                <Text style={styles.errorText}>{errors.business_type}</Text>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {toast.visible ? (
        <CustomToast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onHide={() => setToast((p) => ({ ...p, visible: false }))}
        />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.bg,
  },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  lead: {
    fontSize: 15,
    color: c.muted,
    lineHeight: 22,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: c.ink,
    letterSpacing: -0.25,
    marginBottom: 16,
  },
  coverCard: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.line,
  },
  coverImg: { width: "100%", height: "100%" },
  coverEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaBusy: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  changeLink: {
    alignSelf: "flex-start",
    marginTop: 10,
  },
  changeLinkText: {
    fontSize: 15,
    fontWeight: "600",
    color: c.accent,
    textDecorationLine: "underline",
  },
  cooldown: {
    fontSize: 12,
    color: c.muted,
    marginTop: 4,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.line,
  },
  logoCard: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.line,
  },
  logoImg: { width: "100%", height: "100%" },
  logoEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoCam: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: c.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  logoMeta: {
    flex: 1,
    gap: 4,
    paddingTop: 4,
  },
  logoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: c.ink,
  },
  logoSub: {
    fontSize: 13,
    color: c.muted,
    lineHeight: 18,
    marginBottom: 4,
  },
  field: {
    marginBottom: 22,
  },
  labelWrap: {
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: c.ink,
  },
  labelHint: {
    fontSize: 12,
    color: c.muted,
    marginTop: 2,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: c.ink,
    backgroundColor: c.bg,
  },
  inputArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  inputError: {
    borderColor: c.error,
  },
  inputDisabled: {
    backgroundColor: c.surface,
    color: c.muted,
  },
  errorText: {
    fontSize: 12,
    color: c.error,
    marginTop: 6,
  },
  typeList: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.line,
    overflow: "hidden",
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: c.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.line,
  },
  typeRowOn: {
    backgroundColor: c.accentSoft,
  },
  typeRowText: {
    fontSize: 15,
    color: c.body,
    fontWeight: "500",
  },
  typeRowTextOn: {
    color: c.accent,
    fontWeight: "600",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: c.muted,
  },
});

export default EditOrganizationScreen;
