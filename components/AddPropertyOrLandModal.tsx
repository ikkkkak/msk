/**
 * AddPropertyOrLandSheet — minimal org-tab bottom sheet
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { Plus, Buildings, MapPin, ArrowRight, X } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "../hooks/useUser";
import { endpoints } from "../constants";

const T = {
  bg: "#FFFFFF",
  surface: "#F7F7F7",
  line: "#E8E8E8",
  ink: "#161616",
  inkMid: "#6B6B6B",
  inkLight: "#9CA3AF"
};

type Step = "type" | "confirm" | "noAgency";
type ListingType = "property" | "land";

interface AddPropertyOrLandSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  organization?: any;
  onJoinAgency?: () => void;
}

interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}

const OptionCard: React.FC<OptionCardProps> = ({
  icon,
  title,
  description,
  onPress
}) => (
  <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.82}>
    <View style={s.cardIcon}>{icon}</View>
    <View style={s.cardText}>
      <Text style={s.cardTitle}>{title}</Text>
      <Text style={s.cardDesc}>{description}</Text>
    </View>
    <ArrowRight size={16} color={T.inkLight} weight="bold" />
  </TouchableOpacity>
);

export const AddPropertyOrLandSheet: React.FC<AddPropertyOrLandSheetProps> = ({
  sheetRef,
  organization,
  onJoinAgency
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [step, setStep] = useState<Step>("type");
  const [selectedType, setSelectedType] = useState<ListingType | null>(null);

  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useUser();

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.35}
      />
    ),
    []
  );

  const dismiss = useCallback(() => {
    sheetRef.current?.dismiss();
  }, [sheetRef]);

  const reset = () => {
    setStep("type");
    setSelectedType(null);
  };

  const { data: canCreateData, isLoading: checking } = useQuery({
    queryKey: ["can-create-personal", user?.ID],
    queryFn: async () => {
      try {
        const res = await axios.get(
          `${endpoints.baseURL}/organization/check-personal-content`,
          { headers: { Authorization: `Bearer ${user?.accessToken}` } }
        );
        return res.data;
      } catch {
        return { can_create_personal: true, organization: null };
      }
    },
    enabled: !!user?.accessToken && sheetOpen,
    retry: false
  });

  const isAgencyMember =
    organization || (canCreateData && !canCreateData.can_create_personal);
  const userOrg = organization || canCreateData?.organization;

  const handleSheetChange = (index: number) => {
    const open = index >= 0;
    setSheetOpen(open);
    if (open && !organization && !canCreateData?.organization) {
      setStep("noAgency");
    }
    if (!open) reset();
  };

  const handleSelectType = (type: ListingType) => {
    setSelectedType(type);
    if (isAgencyMember) {
      setStep("confirm");
    } else {
      navigate(type);
    }
  };

  const navigate = (type?: ListingType) => {
    const target = type || selectedType;
    if (!target) return;
    dismiss();
    setTimeout(() => {
      (navigation as any).navigate(
        target === "property" ? "CreatePropertySale" : "CreateLandmark"
      );
    }, 280);
  };

  const handleJoinAgency = () => {
    dismiss();
    if (onJoinAgency) setTimeout(onJoinAgency, 280);
  };

  const stepTitles: Record<Step, string> = {
    type: t("organization.addPropertyOrLand.title", "Add listing"),
    confirm: t(
      "organization.addPropertyOrLand.confirm.title",
      "Confirm ownership"
    ),
    noAgency: t("organization.addPropertyOrLand.noAgency.title", "Add listing")
  };

  const selectedLabel =
    selectedType === "property"
      ? t(
          "organization.addPropertyOrLand.chooseType.property",
          "Property for sale"
        )
      : t("organization.addPropertyOrLand.chooseType.land", "Land for sale");

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["52%"]}
      enablePanDownToClose
      onChange={handleSheetChange}
      onDismiss={reset}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={s.handle}
      backgroundStyle={s.sheetBg}
    >
      <View style={s.header}>
        <Text style={s.headerTitle}>{stepTitles[step]}</Text>
        <TouchableOpacity
          style={s.headerClose}
          onPress={
            step === "confirm"
              ? () => {
                  setStep("type");
                  setSelectedType(null);
                }
              : dismiss
          }
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {step === "confirm" ? (
            <Text style={s.headerBack}>
              {t("common.back", "Back")}
            </Text>
          ) : (
            <X size={18} color={T.inkMid} weight="bold" />
          )}
        </TouchableOpacity>
      </View>

      <BottomSheetScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {checking ? (
          <View style={s.center}>
            <ActivityIndicator size="small" color={T.ink} />
            <Text style={s.loadingText}>{t("common.loading", "Loading…")}</Text>
          </View>
        ) : step === "noAgency" ? (
          <>
            <Text style={s.lead}>
              {t(
                "organization.addPropertyOrLand.noAgency.subtitle",
                "How would you like to publish this listing?"
              )}
            </Text>
            <OptionCard
              icon={<Plus size={18} color={T.ink} weight="bold" />}
              title={t(
                "organization.addPropertyOrLand.noAgency.personal",
                "Personal account"
              )}
              description={t(
                "organization.addPropertyOrLand.noAgency.personalDescription",
                "List under your own name"
              )}
              onPress={() => setStep("type")}
            />
            <OptionCard
              icon={<Buildings size={18} color={T.ink} weight="duotone" />}
              title={t(
                "organization.addPropertyOrLand.noAgency.joinAgency",
                "Join an agency"
              )}
              description={t(
                "organization.addPropertyOrLand.noAgency.joinAgencyDescription",
                "Publish under an agency profile"
              )}
              onPress={handleJoinAgency}
            />
          </>
        ) : step === "type" ? (
          <>
            <Text style={s.lead}>
              {t(
                "organization.addPropertyOrLand.chooseType.title",
                "What are you listing?"
              )}
            </Text>
            <OptionCard
              icon={<Buildings size={18} color={T.ink} weight="duotone" />}
              title={t(
                "organization.addPropertyOrLand.chooseType.property",
                "Property for sale"
              )}
              description={t(
                "organization.addPropertyOrLand.chooseType.propertyDescription",
                "House, apartment, commercial"
              )}
              onPress={() => handleSelectType("property")}
            />
            <OptionCard
              icon={<MapPin size={18} color={T.ink} weight="duotone" />}
              title={t(
                "organization.addPropertyOrLand.chooseType.land",
                "Land for sale"
              )}
              description={t(
                "organization.addPropertyOrLand.chooseType.landDescription",
                "Plots and development land"
              )}
              onPress={() => handleSelectType("land")}
            />
          </>
        ) : (
          <View style={s.confirmWrap}>
            <View style={s.noteBox}>
              <Text style={s.noteTitle}>
                {t(
                  "organization.addPropertyOrLand.confirm.warningTitle",
                  "Agency listing"
                )}
              </Text>
              <Text style={s.noteBody}>
                {t(
                  "organization.addPropertyOrLand.confirm.warningMessage",
                  "This {{type}} will be registered under {{agencyName}}, not your personal account.",
                  {
                    agencyName:
                      userOrg?.name ||
                      t("organization.yourAgency", "your agency"),
                    type: selectedLabel.toLowerCase()
                  }
                )}
              </Text>
            </View>

            <View style={s.metaRow}>
              <Text style={s.metaLabel}>
                {t("organization.agency", "Agency")}
              </Text>
              <Text style={s.metaValue}>
                {userOrg?.name || t("organization.yourAgency", "Your agency")}
              </Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>
                {t(
                  "organization.addPropertyOrLand.confirm.listingType",
                  "Type"
                )}
              </Text>
              <Text style={s.metaValue}>{selectedLabel}</Text>
            </View>

            <View style={s.actions}>
              <TouchableOpacity
                style={s.btnGhost}
                onPress={() => {
                  setStep("type");
                  setSelectedType(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={s.btnGhostText}>
                  {t("common.cancel", "Cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.btnPrimary}
                onPress={() => navigate()}
                activeOpacity={0.88}
              >
                <Text style={s.btnPrimaryText}>
                  {t(
                    "organization.addPropertyOrLand.confirm.proceed",
                    "Continue"
                  )}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

export const AddPropertyOrLandModal = AddPropertyOrLandSheet;

const s = StyleSheet.create({
  sheetBg: {
    backgroundColor: T.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  handle: {
    backgroundColor: T.line,
    width: 36,
    height: 4
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.line
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: T.ink,
    letterSpacing: -0.3
  },
  headerClose: {
    minWidth: 32,
    alignItems: "flex-end"
  },
  headerBack: {
    fontSize: 14,
    fontWeight: "600",
    color: T.inkMid
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 28 : 20,
    gap: 10
  },
  lead: {
    fontSize: 14,
    color: T.inkMid,
    lineHeight: 20,
    marginBottom: 4
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: T.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line,
    paddingHorizontal: 14,
    paddingVertical: 14
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line
  },
  cardText: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: T.ink,
    marginBottom: 2
  },
  cardDesc: {
    fontSize: 13,
    color: T.inkMid,
    lineHeight: 18
  },
  confirmWrap: { gap: 12 },
  noteBox: {
    backgroundColor: T.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line,
    padding: 14,
    gap: 6
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: T.ink
  },
  noteBody: {
    fontSize: 13,
    color: T.inkMid,
    lineHeight: 19
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.line
  },
  metaLabel: {
    fontSize: 13,
    color: T.inkMid,
    fontWeight: "500"
  },
  metaValue: {
    fontSize: 13,
    color: T.ink,
    fontWeight: "600"
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8
  },
  btnGhost: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line
  },
  btnGhostText: {
    fontSize: 14,
    fontWeight: "600",
    color: T.ink
  },
  btnPrimary: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.ink
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  center: {
    paddingVertical: 28,
    alignItems: "center",
    gap: 10
  },
  loadingText: {
    fontSize: 13,
    color: T.inkMid
  }
});
