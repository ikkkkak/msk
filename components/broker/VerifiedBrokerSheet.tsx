import React, { useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Text } from "@ui-kitten/components";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import { SealCheck } from "phosphor-react-native";
import { trustColors as c } from "../trust/trustTokens";
import type { BrokerVerificationStatus } from "../../hooks/useBrokerVerification";

export type VerifiedBrokerSheetProps = {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  status?: BrokerVerificationStatus | null;
  onClose: () => void;
  onOpenSettings?: () => void;
};

/**
 * Lightweight confirmation when a verified host taps their badge on Account.
 */
export function VerifiedBrokerSheet({
  sheetRef,
  status,
  onClose,
  onOpenSettings,
}: VerifiedBrokerSheetProps) {
  const { t } = useTranslation();
  const snapPoints = useMemo(() => ["52%"], []);
  const brokerId = status?.broker_id?.trim();

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.sheetBg}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconRing}>
          <SealCheck size={36} color={c.accent} weight="fill" />
        </View>

        <Text style={styles.title}>
          {t("broker.sheet.verifiedTitle", "You're verified")}
        </Text>
        <Text style={styles.lead}>
          {t(
            "broker.sheet.verifiedLead",
            "Meskeny confirmed your identity. Buyers see your verified status on listings.",
          )}
        </Text>

        {brokerId ? (
          <View style={styles.idCard}>
            <Text style={styles.idLabel}>
              {t("broker.sheet.brokerIdLabel", "Your broker ID")}
            </Text>
            <Text style={styles.idValue}>{brokerId}</Text>
          </View>
        ) : null}

        <View style={styles.bullets}>
          <Text style={styles.bullet}>
            {t(
              "broker.sheet.bulletListings",
              "Verified badge on sale, rent, and landmark listings",
            )}
          </Text>
          <Text style={styles.bullet}>
            {t(
              "broker.sheet.bulletSearch",
              "Higher visibility in search results",
            )}
          </Text>
          <Text style={styles.bullet}>
            {t(
              "broker.sheet.bulletPrivacy",
              "Control photo and name visibility in Account settings",
            )}
          </Text>
        </View>

        {onOpenSettings ? (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onOpenSettings}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>
              {t("broker.sheet.openSettings", "Listing privacy settings")}
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onClose}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryBtnText}>
            {t("common.gotIt", "Got it")}
          </Text>
        </TouchableOpacity>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  handle: {
    width: 36,
    height: 4,
    backgroundColor: c.line,
  },
  sheetBg: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 36 : 28,
    alignItems: "center",
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: c.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: c.ink,
    letterSpacing: -0.35,
    textAlign: "center",
    marginBottom: 8,
  },
  lead: {
    fontSize: 15,
    fontWeight: "400",
    color: c.muted,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 20,
    maxWidth: 320,
  },
  idCard: {
    alignSelf: "stretch",
    backgroundColor: c.accentSoft,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.line,
  },
  idLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: c.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  idValue: {
    fontSize: 16,
    fontWeight: "600",
    color: c.ink,
    fontVariant: ["tabular-nums"],
  },
  bullets: {
    alignSelf: "stretch",
    gap: 10,
    marginBottom: 24,
  },
  bullet: {
    fontSize: 14,
    color: c.body,
    lineHeight: 20,
    paddingLeft: 4,
  },
  secondaryBtn: {
    alignSelf: "stretch",
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: c.accent,
    textDecorationLine: "underline",
  },
  primaryBtn: {
    alignSelf: "stretch",
    backgroundColor: c.ink,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
