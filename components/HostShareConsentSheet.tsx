import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import { ShieldCheck, X } from "phosphor-react-native";
import { theme } from "../theme";

const PRIMARY = theme["color-temporary-primary"] as string;

export type HostShareConsentSheetProps = {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  saving: boolean;
  hasDecided: boolean;
  accepted: boolean;
  maxBuyersPerProperty: number;
  errorKey?: string | null;
  onAccept: () => void | Promise<void>;
  onDecline: () => void | Promise<void>;
  onClose: () => void;
};

export function HostShareConsentSheet({
  sheetRef,
  saving,
  hasDecided,
  accepted,
  maxBuyersPerProperty,
  errorKey,
  onAccept,
  onDecline,
  onClose,
}: HostShareConsentSheetProps) {
  const { t } = useTranslation();
  const snapPoints = useMemo(() => ["70%", "78%"], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
      />
    ),
    [],
  );

  const acceptLabel = !hasDecided
    ? t("hostShareConsent.acceptShort", "Yes, share info")
    : accepted
      ? t("hostShareConsent.keepOn", "Keep sharing on")
      : t("hostShareConsent.turnOn", "Turn on sharing");

  const declineLabel = !hasDecided
    ? t("hostShareConsent.decline", "No thanks")
    : accepted
      ? t("hostShareConsent.turnOff", "Turn off sharing")
      : t("hostShareConsent.keepOff", "Keep sharing off");

  const handleDecline = () => {
    if (hasDecided && !accepted) {
      onClose();
      return;
    }
    onDecline();
  };

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
        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            <ShieldCheck size={28} color={PRIMARY} weight="duotone" />
          </View>
          {/* <TouchableOpacity
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t("common.close", "Close")}
          >
            <X size={22} color="#6B7280" />
          </TouchableOpacity> */}
        </View>

        <Text style={styles.title}>
          {t("hostShareConsent.sheetTitle", "Share with property hosts?")}
        </Text>
        <Text style={styles.body}>
          {t(
            "hostShareConsent.sheetBody",
            "If you opt in, Meskeny may show a minimal profile to one host at a time when your search activity matches a listing. We never share your phone or email in suggestions.",
          )}
        </Text>

        <View style={styles.bulletList}>
          <Text style={styles.bullet}>
            {t(
              "hostShareConsent.bulletMinimal",
              "Minimal details only (e.g. first name and match signals).",
            )}
          </Text>
          <Text style={styles.bullet}>
            {t(
              "hostShareConsent.bulletOneHost",
              "One host at a time — not shared with multiple hosts.",
            )}
          </Text>
          <Text style={styles.bullet}>
            {t(
              "hostShareConsent.bulletPerListing",
              "Up to {{count}} buyers per listing; each listing is handled separately.",
              { count: maxBuyersPerProperty },
            )}
          </Text>
          <Text style={styles.bullet}>
            {t(
              "hostShareConsent.bulletOptOut",
              "You can change this anytime in Settings.",
            )}
          </Text>
        </View>

        {hasDecided ? (
          <Text style={[styles.statusOn, !accepted && styles.statusOff]}>
            {accepted
              ? t("hostShareConsent.statusOn", "Sharing is enabled")
              : t("hostShareConsent.statusOff", "Sharing is disabled")}
          </Text>
        ) : null}

        {errorKey ? (
          <Text style={styles.errorText}>
            {t(
              "hostShareConsent.saveError",
              "Could not save your choice. Please try again.",
            )}
          </Text>
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.acceptBtn,
              saving && styles.btnDisabled,
            ]}
            onPress={onAccept}
            disabled={saving}
            activeOpacity={0.88}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.acceptBtnText} numberOfLines={2}>
                {acceptLabel}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.declineBtn,
              saving && styles.btnDisabled,
            ]}
            onPress={handleDecline}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.declineBtnText} numberOfLines={2}>
              {declineLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    backgroundColor: "#D1D5DB",
    width: 40,
  },
  content: {
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === "ios" ? 36 : 28,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF4EE",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: "#4B5563",
    marginBottom: 16,
  },
  bulletList: {
    gap: 10,
    marginBottom: 20,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
  },
  statusOn: {
    fontSize: 13,
    fontWeight: "600",
    color: PRIMARY,
    marginBottom: 12,
  },
  statusOff: {
    color: "#6B7280",
  },
  errorText: {
    fontSize: 13,
    color: "#DC2626",
    marginBottom: 12,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: "row",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D1D5DB",
    overflow: "hidden",
  },
  actionBtn: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
  },
  acceptBtn: {
    backgroundColor: PRIMARY,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#D1D5DB",
  },
  acceptBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  declineBtn: {
    backgroundColor: "#F3F4F6",
  },
  declineBtnText: {
    color: "#4B5563",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  btnDisabled: {
    opacity: 0.65,
  },
});
