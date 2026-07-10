import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import type { IconProps } from "phosphor-react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  House,
  Key,
  MapPin,
  CaretRight,
  Buildings,
  User,
  Check,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { useUser } from "../../hooks/useUser";
import { endpoints } from "../../constants";
import {
  hostOnboardingStorage,
  type HostListingType,
} from "../../constants/hostOnboardingStorage";

type Step =
  | "listingType"
  | "agencyQuestion"
  | "createAgencyPrompt"
  | "agencyAssign"
  | "personalConfirm";

export type HostOnboardingSheetRef = {
  open: () => void;
};

type Props = {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  /** Unique modal name when multiple screens mount this sheet (tab navigator keeps tabs alive). */
  modalName?: string;
};

export function HostOnboardingSheet({
  sheetRef,
  modalName = "hostOnboarding",
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useUser();

  const [step, setStep] = useState<Step>("listingType");
  const [listingType, setListingType] = useState<HostListingType | null>(null);
  const [isAgency, setIsAgency] = useState<boolean | null>(null);
  const [assignToAgency, setAssignToAgency] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const snapPoints = useMemo(() => ["78%", "94%"], []);

  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ["user-organization", user?.ID],
    queryFn: async () => {
      const r = await axios.get(endpoints.organization, {
        headers: { Authorization: `Bearer ${user!.accessToken}` },
        timeout: 10000,
      });
      return r?.data?.organization ?? null;
    },
    enabled: !!user?.accessToken && sheetOpen,
    staleTime: 30_000,
  });

  const backdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
        pressBehavior="close"
      />
    ),
    [],
  );

  const resetFlow = useCallback(() => {
    setStep("listingType");
    setListingType(null);
    setIsAgency(null);
    setAssignToAgency(true);
    setTermsAccepted(false);
  }, []);

  const dismiss = useCallback(() => {
    sheetRef.current?.dismiss();
  }, [sheetRef]);

  useEffect(() => {
    if (!sheetOpen) return;
    void hostOnboardingStorage.load().then((draft) => {
      if (draft.listingType) setListingType(draft.listingType);
      if (draft.isAgency != null) setIsAgency(draft.isAgency);
      setAssignToAgency(draft.assignToAgency);
      setTermsAccepted(draft.termsAccepted);
    });
  }, [sheetOpen]);

  const persist = useCallback(
    async (patch: Parameters<typeof hostOnboardingStorage.save>[0]) => {
      await hostOnboardingStorage.save(patch);
    },
    [],
  );

  const navigateToCreate = useCallback(() => {
    dismiss();
    if (listingType === "sale") {
      navigation.navigate("CreatePropertySale");
    } else if (listingType === "rent") {
      navigation.navigate("AddProperty");
    } else if (listingType === "land") {
      navigation.navigate("CreateLandmark");
    }
  }, [dismiss, navigation, listingType]);

  const finishFlow = useCallback(async () => {
    await persist({
      listingType,
      isAgency,
      assignToAgency: isAgency ? assignToAgency : false,
      termsAccepted,
      completedAt: new Date().toISOString(),
    });
    navigateToCreate();
  }, [
    listingType,
    isAgency,
    assignToAgency,
    termsAccepted,
    persist,
    navigateToCreate,
  ]);

  const onSelectListingType = async (type: HostListingType) => {
    Haptics.selectionAsync().catch(() => {});
    setListingType(type);
    await persist({ listingType: type });
    setStep("agencyQuestion");
  };

  const onAgencyAnswer = async (agency: boolean) => {
    Haptics.selectionAsync().catch(() => {});
    setIsAgency(agency);
    await persist({ isAgency: agency });
    if (!agency) {
      setStep("personalConfirm");
      return;
    }
    if (organization) {
      setStep("agencyAssign");
    } else {
      setStep("createAgencyPrompt");
    }
  };

  const listingOptions = useMemo(
    () =>
      [
        {
          type: "sale" as const,
          icon: House,
          label: t("hostOnboarding.listingSale"),
          sub: t("hostOnboarding.listingSaleSub"),
        },
        {
          type: "rent" as const,
          icon: Key,
          label: t("hostOnboarding.listingRent"),
          sub: t("hostOnboarding.listingRentSub"),
        },
        {
          type: "land" as const,
          icon: MapPin,
          label: t("hostOnboarding.listingLand"),
          sub: t("hostOnboarding.listingLandSub"),
        },
      ] as const,
    [t],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      name={modalName}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onDismiss={() => {
        setSheetOpen(false);
        resetFlow();
      }}
      onChange={(index) => setSheetOpen(index >= 0)}
      backdropComponent={backdrop}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.sheetBg}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === "listingType" ? (
          <>
            <Text style={styles.title}>{t("hostOnboarding.sheetTitle")}</Text>
            <Text style={styles.subtitle}>{t("hostOnboarding.sheetSubtitle")}</Text>
            <View style={styles.optionsStack}>
              {listingOptions.map((opt) => (
                <MassiveOptionCard
                  key={opt.type}
                  icon={opt.icon}
                  label={opt.label}
                  subtitle={opt.sub}
                  active={listingType === opt.type}
                  onPress={() => void onSelectListingType(opt.type)}
                />
              ))}
            </View>
          </>
        ) : null}

        {step === "agencyQuestion" ? (
          <>
            <Pressable onPress={() => setStep("listingType")} hitSlop={8}>
              <Text style={styles.backLink}>{t("hostOnboarding.back")}</Text>
            </Pressable>
            <Text style={styles.title}>{t("hostOnboarding.agencyQuestion")}</Text>
            <Text style={styles.subtitle}>
              {t("hostOnboarding.agencyQuestionSub")}
            </Text>
            <View style={styles.optionsStack}>
              <MassiveOptionCard
                icon={Buildings}
                label={t("hostOnboarding.agencyYes")}
                onPress={() => void onAgencyAnswer(true)}
              />
              <MassiveOptionCard
                icon={User}
                label={t("hostOnboarding.agencyNo")}
                onPress={() => void onAgencyAnswer(false)}
              />
            </View>
          </>
        ) : null}

        {step === "createAgencyPrompt" ? (
          <>
            <Pressable onPress={() => setStep("agencyQuestion")} hitSlop={8}>
              <Text style={styles.backLink}>{t("hostOnboarding.back")}</Text>
            </Pressable>
            <Text style={styles.title}>{t("hostOnboarding.createAgencyTitle")}</Text>
            <Text style={styles.subtitle}>
              {t("hostOnboarding.createAgencySub")}
            </Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => {
                void persist({ listingType, isAgency: true });
                dismiss();
                navigation.navigate("CreateOrganization");
              }}
            >
              <Text style={styles.primaryBtnText}>
                {t("hostOnboarding.createAgencyCta")}
              </Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => {
                setIsAgency(false);
                void persist({ isAgency: false });
                setStep("personalConfirm");
              }}
            >
              <Text style={styles.secondaryBtnText}>
                {t("hostOnboarding.personalInstead")}
              </Text>
            </Pressable>
          </>
        ) : null}

        {step === "agencyAssign" ? (
          <>
            <Pressable onPress={() => setStep("agencyQuestion")} hitSlop={8}>
              <Text style={styles.backLink}>{t("hostOnboarding.back")}</Text>
            </Pressable>
            <Text style={styles.title}>{t("hostOnboarding.assignTitle")}</Text>
            {orgLoading ? (
              <ActivityIndicator style={{ marginVertical: 24 }} color="#222" />
            ) : organization ? (
              <View style={styles.agencyCard}>
                {organization.logo_url ? (
                  <View style={styles.agencyLogo} />
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={styles.agencyName} numberOfLines={1}>
                    {organization.name}
                  </Text>
                  <Text style={styles.agencyMeta} numberOfLines={1}>
                    {organization.business_type ||
                      t("hostOnboarding.agencyDefaultType")}
                  </Text>
                </View>
              </View>
            ) : null}
            <Pressable
              style={styles.checkRow}
              onPress={() => {
                const next = !assignToAgency;
                setAssignToAgency(next);
                void persist({ assignToAgency: next });
              }}
            >
              <View
                style={[styles.checkbox, assignToAgency && styles.checkboxOn]}
              >
                {assignToAgency ? (
                  <Check size={18} color="#FFFFFF" weight="bold" />
                ) : null}
              </View>
              <Text style={styles.checkLabel}>
                {t("hostOnboarding.assignToAgency", {
                  name: organization?.name ?? "",
                })}
              </Text>
            </Pressable>
            <Pressable
              style={styles.checkRow}
              onPress={() => {
                const next = !termsAccepted;
                setTermsAccepted(next);
                void persist({ termsAccepted: next });
              }}
            >
              <View
                style={[styles.checkbox, termsAccepted && styles.checkboxOn]}
              >
                {termsAccepted ? (
                  <Check size={18} color="#FFFFFF" weight="bold" />
                ) : null}
              </View>
              <Text style={styles.checkLabel}>
                {t("hostOnboarding.termsLabel")}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.primaryBtn,
                !termsAccepted && styles.primaryBtnDisabled,
              ]}
              disabled={!termsAccepted}
              onPress={() => void finishFlow()}
            >
              <Text style={styles.primaryBtnText}>
                {t("hostOnboarding.continue")}
              </Text>
            </Pressable>
          </>
        ) : null}

        {step === "personalConfirm" ? (
          <>
            <Pressable
              onPress={() => setStep(isAgency ? "agencyQuestion" : "agencyQuestion")}
              hitSlop={8}
            >
              <Text style={styles.backLink}>{t("hostOnboarding.back")}</Text>
            </Pressable>
            <Text style={styles.title}>{t("hostOnboarding.personalTitle")}</Text>
            <Text style={styles.subtitle}>
              {t("hostOnboarding.personalSub")}
            </Text>
            <Pressable
              style={styles.checkRow}
              onPress={() => {
                const next = !termsAccepted;
                setTermsAccepted(next);
                void persist({ termsAccepted: next });
              }}
            >
              <View
                style={[styles.checkbox, termsAccepted && styles.checkboxOn]}
              >
                {termsAccepted ? (
                  <Check size={18} color="#FFFFFF" weight="bold" />
                ) : null}
              </View>
              <Text style={styles.checkLabel}>
                {t("hostOnboarding.termsPersonal")}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.primaryBtn,
                !termsAccepted && styles.primaryBtnDisabled,
              ]}
              disabled={!termsAccepted}
              onPress={() => void finishFlow()}
            >
              <Text style={styles.primaryBtnText}>
                {t("hostOnboarding.continueListing")}
              </Text>
            </Pressable>
          </>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

type MassiveOptionCardProps = {
  icon: React.ComponentType<IconProps>;
  label: string;
  subtitle?: string;
  active?: boolean;
  onPress: () => void;
};

function MassiveOptionCard({
  icon: Icon,
  label,
  subtitle,
  active,
  onPress,
}: MassiveOptionCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.massiveCard,
        active && styles.massiveCardActive,
        pressed && styles.massiveCardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.massiveIconWrap}>
        <Icon size={34} color="#222222" weight="duotone" />
      </View>
      <View style={styles.massiveText}>
        <Text style={styles.massiveTitle}>{label}</Text>
        {subtitle ? (
          <Text style={styles.massiveSub} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <CaretRight size={24} color="#717171" weight="bold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handle: { backgroundColor: "#DDDDDD", width: 40, height: 5, borderRadius: 3 },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#222222",
    letterSpacing: -0.5,
    marginBottom: 10,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: "#717171",
    lineHeight: 24,
    marginBottom: 28,
  },
  backLink: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 16,
    textDecorationLine: "underline",
  },
  optionsStack: {
    gap: 16,
  },
  massiveCard: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 96,
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    backgroundColor: "#FAFAFA",
    gap: 18,
  },
  massiveCardActive: {
    borderColor: "#222222",
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
  },
  massiveCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  massiveIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5E5",
  },
  massiveText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  massiveTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    letterSpacing: -0.25,
    lineHeight: 26,
  },
  massiveSub: {
    fontSize: 15,
    color: "#717171",
    marginTop: 6,
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: "#222222",
    minHeight: 58,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  secondaryBtn: {
    minHeight: 52,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#717171",
    textDecorationLine: "underline",
  },
  agencyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#F7F7F7",
    marginBottom: 20,
    minHeight: 88,
  },
  agencyLogo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#E5E5E5",
  },
  agencyName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    letterSpacing: -0.2,
  },
  agencyMeta: {
    fontSize: 15,
    color: "#717171",
    marginTop: 4,
    lineHeight: 20,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 18,
    paddingVertical: 4,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#CCCCCC",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxOn: {
    backgroundColor: "#222222",
    borderColor: "#222222",
  },
  checkLabel: {
    flex: 1,
    fontSize: 16,
    color: "#222222",
    lineHeight: 24,
    fontWeight: "500",
  },
});
