import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  BookOpenUser,
  Camera,
  IdentificationCard,
} from "phosphor-react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { pickImageNative } from "../utils/nativePhotoPicker";
import { BrokerVerificationStatusView } from "../components/broker/BrokerVerificationStatusView";
import { trustColors as c } from "../components/trust/trustTokens";
import {
  brokerVerificationErrorMessage,
  uploadBrokerImage,
  useBrokerVerificationStatus,
  useSubmitBrokerVerification,
  type BrokerIdDocType,
} from "../hooks/useBrokerVerification";

const TOTAL = 4;

const LANGUAGE_OPTIONS = [
  { key: "ar", label: "Arabic" },
  { key: "fr", label: "French" },
  { key: "en", label: "English" },
  { key: "hassaniya", label: "Hassaniya" },
  { key: "wolof", label: "Wolof" },
  { key: "pulaar", label: "Pulaar" },
  { key: "soninke", label: "Soninke" },
];

async function toDataUrl(uri: string, base64?: string): Promise<string> {
  if (base64?.startsWith("data:")) return base64;
  if (base64) return `data:image/jpeg;base64,${base64}`;
  const Enc: any = (FileSystem as any).EncodingType;
  const b64 = await FileSystem.readAsStringAsync(uri, {
    encoding: Enc?.Base64 || "base64",
  });
  return `data:image/jpeg;base64,${b64}`;
}

export const BrokerVerificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { data: status, isLoading: statusLoading } = useBrokerVerificationStatus();
  const submit = useSubmitBrokerVerification();
  const [forceApply, setForceApply] = useState(false);

  const [step, setStep] = useState(1);
  const [profilePhoto, setProfilePhoto] = useState("");
  const [idDocType, setIdDocType] = useState<BrokerIdDocType | null>(null);
  const [idFront, setIdFront] = useState("");
  const [idBack, setIdBack] = useState("");
  const [license, setLicense] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const verified = !!status?.is_verified || status?.status === "approved";
  const pending = status?.status === "pending";
  const rejected = status?.status === "rejected";

  const pick = useCallback(
    async (field: "profile" | "idFront" | "idBack" | "license") => {
      setUploading(true);
      try {
        const r = await pickImageNative({
          allowsEditing: field === "profile",
          aspect: field === "profile" ? [1, 1] : [4, 3],
          quality: 0.85,
          base64: true,
        });
        if (r.canceled || !r.assets?.length) return;
        const a = r.assets[0] as { uri?: string; base64?: string };
        const dataUrl = await toDataUrl(a.uri || "", a.base64);
        const url = await uploadBrokerImage(dataUrl);
        if (field === "profile") setProfilePhoto(url);
        else if (field === "idFront") setIdFront(url);
        else if (field === "idBack") setIdBack(url);
        else setLicense(url);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
          () => {},
        );
      } catch (e: unknown) {
        Alert.alert(
          t("broker.errors.uploadTitle", "Upload failed"),
          brokerVerificationErrorMessage(e),
        );
      } finally {
        setUploading(false);
      }
    },
    [t],
  );

  const identityComplete = useMemo(() => {
    if (!idDocType) return false;
    if (idDocType === "passport") return !!idFront;
    return !!idFront && !!idBack;
  }, [idDocType, idFront, idBack]);

  const canNext = useMemo(() => {
    if (step === 1) return true;
    if (step === 2) return !!profilePhoto;
    if (step === 3) return languages.length > 0;
    if (step === 4) return identityComplete;
    return false;
  }, [step, profilePhoto, languages, identityComplete]);

  if (statusLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={c.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (status && !forceApply && (verified || pending || rejected)) {
    return (
      <BrokerVerificationStatusView
        status={status}
        onBack={goBack}
        onRetry={rejected ? () => setForceApply(true) : undefined}
      />
    );
  }

  const selectDocType = (type: BrokerIdDocType) => {
    setIdDocType(type);
    setIdFront("");
    setIdBack("");
  };

  const toggleLang = (key: string) => {
    setLanguages((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const onSubmit = async () => {
    if (!idDocType) return;
    try {
      await submit.mutateAsync({
        profile_photo_url: profilePhoto,
        id_type: idDocType,
        id_front_image: idFront,
        ...(idDocType === "national_id" ? { id_back_image: idBack } : {}),
        license_url: license || undefined,
        spoken_languages: languages,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      goBack();
    } catch (e: unknown) {
      Alert.alert(
        t("broker.errors.submitTitle", "Could not submit"),
        brokerVerificationErrorMessage(e),
      );
    }
  };

  const renderPhotoSlot = (
    label: string,
    uri: string,
    onPick: () => void,
    optional?: boolean,
  ) => (
    <TouchableOpacity
      style={styles.photoSlot}
      onPress={onPick}
      disabled={uploading}
      activeOpacity={0.85}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.photoPreview} />
      ) : (
        <View style={styles.photoEmpty}>
          <Camera size={26} color={c.muted} />
          <Text style={styles.photoEmptyText}>
            {optional ? `${label} (${t("common.optional", "optional")})` : label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const stepTitle =
    step === 1
      ? t("broker.step1.title", "Verify your identity")
      : step === 2
        ? t("broker.step2.title", "Profile photo")
        : step === 3
          ? t("broker.step3.title", "Languages")
          : t("broker.step4.title", "ID document");

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={22} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {stepTitle}
        </Text>
        <Text style={styles.stepLabel}>
          {step}/{TOTAL}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { width: `${(step / TOTAL) * 100}%` }]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View style={styles.block}>
            <Text style={styles.title}>
              {t("broker.step1.title", "Verify your identity")}
            </Text>
            <Text style={styles.body}>
              {t(
                "broker.step1.body",
                "A quick check unlocks your verified badge on listings. We review applications within 24–48 hours.",
              )}
            </Text>
            <View style={styles.checklist}>
              <Text style={styles.checkItem}>
                {t("broker.step1.check1", "1. Professional profile photo")}
              </Text>
              <Text style={styles.checkItem}>
                {t("broker.step1.check2", "2. Languages you speak with clients")}
              </Text>
              <Text style={styles.checkItem}>
                {t("broker.step1.check3", "3. Passport or national ID")}
              </Text>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.block}>
            <Text style={styles.body}>
              {t(
                "broker.step2.body",
                "Use a clear headshot with your face visible. This may appear on your listings.",
              )}
            </Text>
            {renderPhotoSlot(
              t("broker.step2.addPhoto", "Add photo"),
              profilePhoto,
              () => pick("profile"),
            )}
          </View>
        )}

        {step === 3 && (
          <View style={styles.block}>
            <Text style={styles.body}>
              {t(
                "broker.step3.body",
                "Select every language you can use with buyers.",
              )}
            </Text>
            <View style={styles.chips}>
              {LANGUAGE_OPTIONS.map((opt) => {
                const on = languages.includes(opt.key);
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.chip, on && styles.chipOn]}
                    onPress={() => toggleLang(opt.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>
                      {t(`broker.lang.${opt.key}`, opt.label)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.block}>
            <Text style={styles.body}>
              {t(
                "broker.step4.body",
                "Choose your document type. Photos should be sharp and readable.",
              )}
            </Text>

            <View style={styles.docTypeRow}>
              <TouchableOpacity
                style={[
                  styles.docTypeCard,
                  idDocType === "passport" && styles.docTypeCardOn,
                ]}
                onPress={() => selectDocType("passport")}
                activeOpacity={0.85}
              >
                <BookOpenUser
                  size={26}
                  color={idDocType === "passport" ? c.accent : c.muted}
                  weight="duotone"
                />
                <Text
                  style={[
                    styles.docTypeTitle,
                    idDocType === "passport" && styles.docTypeTitleOn,
                  ]}
                >
                  {t("broker.step4.passport", "Passport")}
                </Text>
                <Text style={styles.docTypeSub}>
                  {t("broker.step4.passportHint", "1 photo")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.docTypeCard,
                  idDocType === "national_id" && styles.docTypeCardOn,
                ]}
                onPress={() => selectDocType("national_id")}
                activeOpacity={0.85}
              >
                <IdentificationCard
                  size={26}
                  color={idDocType === "national_id" ? c.accent : c.muted}
                  weight="duotone"
                />
                <Text
                  style={[
                    styles.docTypeTitle,
                    idDocType === "national_id" && styles.docTypeTitleOn,
                  ]}
                >
                  {t("broker.step4.idCard", "National ID")}
                </Text>
                <Text style={styles.docTypeSub}>
                  {t("broker.step4.idCardHint", "Front + back")}
                </Text>
              </TouchableOpacity>
            </View>

            {idDocType === "passport" && (
              <>
                <Text style={styles.uploadHint}>
                  {t(
                    "broker.step4.passportUpload",
                    "Photo of the information page.",
                  )}
                </Text>
                {renderPhotoSlot(
                  t("broker.step4.passportPhoto", "Passport photo"),
                  idFront,
                  () => pick("idFront"),
                )}
              </>
            )}

            {idDocType === "national_id" && (
              <>
                <Text style={styles.uploadHint}>
                  {t("broker.step4.idCardUpload", "Front and back of your card.")}
                </Text>
                {renderPhotoSlot(
                  t("broker.step4.idFront", "Front"),
                  idFront,
                  () => pick("idFront"),
                )}
                {renderPhotoSlot(
                  t("broker.step4.idBack", "Back"),
                  idBack,
                  () => pick("idBack"),
                )}
              </>
            )}

            {renderPhotoSlot(
              t("broker.step4.license", "Broker license"),
              license,
              () => pick("license"),
              true,
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 ? (
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => setStep((s) => s - 1)}
          >
            <Text style={styles.backLinkText}>{t("common.back", "Back")}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backLink} />
        )}
        <TouchableOpacity
          style={[
            styles.nextBtn,
            (!canNext || uploading || submit.isPending) && styles.nextBtnOff,
          ]}
          disabled={!canNext || uploading || submit.isPending}
          onPress={() => {
            if (step < TOTAL) setStep((s) => s + 1);
            else void onSubmit();
          }}
          activeOpacity={0.88}
        >
          {uploading || submit.isPending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.nextBtnText}>
              {step < TOTAL
                ? t("common.continue", "Continue")
                : t("broker.submit", "Submit")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.surface },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: c.ink,
    letterSpacing: -0.2,
  },
  stepLabel: { fontSize: 13, fontWeight: "500", color: c.muted },
  progressTrack: {
    height: 2,
    backgroundColor: c.line,
    marginHorizontal: 20,
  },
  progressFill: { height: 2, backgroundColor: c.accent },
  scroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
  block: { gap: 14 },
  title: {
    fontSize: 26,
    fontWeight: "600",
    color: c.ink,
    letterSpacing: -0.4,
  },
  body: { fontSize: 15, color: c.muted, lineHeight: 22 },
  checklist: {
    marginTop: 8,
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: c.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.line,
  },
  checkItem: { fontSize: 14, color: c.body, lineHeight: 20 },
  docTypeRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  docTypeCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.line,
    backgroundColor: c.surface,
    gap: 6,
  },
  docTypeCardOn: {
    borderColor: c.accent,
    backgroundColor: c.accentSoft,
  },
  docTypeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: c.body,
    textAlign: "center",
  },
  docTypeTitleOn: { color: c.accent },
  docTypeSub: { fontSize: 12, color: c.muted },
  uploadHint: { fontSize: 13, color: c.muted, lineHeight: 18 },
  photoSlot: {
    marginTop: 6,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.line,
  },
  photoPreview: { width: "100%", height: 200, backgroundColor: c.surface },
  photoEmpty: {
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: c.surface,
  },
  photoEmptyText: { fontSize: 14, color: c.muted, fontWeight: "500" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.line,
    backgroundColor: c.surface,
  },
  chipOn: {
    borderColor: c.accent,
    backgroundColor: c.accentSoft,
  },
  chipText: { fontSize: 14, fontWeight: "500", color: c.body },
  chipTextOn: { color: c.accent, fontWeight: "600" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.line,
    backgroundColor: c.surface,
  },
  backLink: { minWidth: 72, justifyContent: "center" },
  backLinkText: { fontSize: 15, fontWeight: "600", color: c.muted },
  nextBtn: {
    flex: 1,
    backgroundColor: c.ink,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  nextBtnOff: { opacity: 0.4 },
  nextBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
