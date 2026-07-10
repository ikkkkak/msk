import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useTranslation } from "react-i18next";
import {
  BellRinging,
  Buildings,
  CurrencyCircleDollar,
  HouseLine,
  MapPinLine,
  Sparkle,
  TrendUp,
} from "phosphor-react-native";

import { upsertDevicePreferences } from "../services/devicePreferences";
import { onboardingStorage } from "../constants/onboardingStorage";
import { getOrCreateDeviceId } from "../utils/deviceId";
import { endpoints } from "../constants";

type InterestKey =
  | "investment"
  | "budget_deals"
  | "family_home"
  | "luxury"
  | "nearby";

const INTERESTS: Array<{ key: InterestKey; label: string; sub: string }> = [
  {
    key: "investment",
    label: "Investment opportunities",
    sub: "Undervalued deals + strong ROI potential",
  },
  { key: "budget_deals", label: "Budget deals", sub: "Best value for price" },
  { key: "family_home", label: "Family homes", sub: "Safe areas + space" },
  { key: "luxury", label: "Luxury", sub: "Premium finishes + top locations" },
  { key: "nearby", label: "Near me", sub: "Local picks (when available)" },
];

const INTEREST_ICON: Record<InterestKey, React.ComponentType<any>> = {
  investment: TrendUp,
  budget_deals: CurrencyCircleDollar,
  family_home: HouseLine,
  luxury: Sparkle,
  nearby: MapPinLine,
};

async function registerPushTokenForDevice() {
  if (!Device.isDevice) return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  const deviceId = await getOrCreateDeviceId();
  if (!token || !deviceId) return;
  // Public endpoint (supports anonymous). Stored server-side on MarketingDevice.
  await fetch(`${endpoints.baseURL}/users/push-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-User-ID": "0" },
    body: JSON.stringify({ token, deviceId }),
  }).catch(() => {});
}

export const DevicePersonalizationModal: React.FC<{
  visible: boolean;
  onDone: () => void;
}> = ({ visible, onDone }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  const selectedKeys = useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected],
  );

  const toggle = (k: string) => {
    setSelected((p) => ({ ...p, [k]: !p[k] }));
  };

  const canContinue = selectedKeys.length > 0 && !busy;

  const handleContinue = async () => {
    if (!canContinue) return;
    setBusy(true);
    try {
      const ob = await onboardingStorage.getPreferences();
      const ok = await upsertDevicePreferences({
        interests: selectedKeys,
        favorite_city_id: ob?.cityId ?? null,
        favorite_city_name: ob?.cityName ?? "",
        favorite_zone_id: ob?.zoneId ?? null,
        favorite_zone_name: ob?.zoneName ?? "",
      });
      if (!ok) {
        setBusy(false);
        return;
      }

      // Ask notifications if not granted yet.
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const r = await Notifications.requestPermissionsAsync();
        if (r.status === "granted") {
          await registerPushTokenForDevice();
        }
      } else {
        await registerPushTokenForDevice();
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
        });
      }
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={s.root}>
        <View style={s.header}>
          <View style={s.headerBadge}>
            <Buildings size={18} color="#0F3D1E" weight="duotone" />
            <BellRinging size={18} color="#0F3D1E" weight="duotone" />
          </View>
          <Text style={s.title}>
            {t("personalize.title", "Help us customize Meskeny for you")}
          </Text>
          <Text style={s.sub}>
            {t(
              "personalize.subtitle",
              "Pick what you’re most interested in. We’ll send smarter suggestions and alerts.",
            )}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        >
          {INTERESTS.map((it) => {
            const on = !!selected[it.key];
            const InterestIcon = INTEREST_ICON[it.key];
            return (
              <TouchableOpacity
                key={it.key}
                style={[s.card, on && s.cardOn]}
                activeOpacity={0.85}
                onPress={() => toggle(it.key)}
              >
                <View style={s.cardTop}>
                  <View style={[s.iconWrap, on && s.iconWrapOn]}>
                    <InterestIcon
                      size={20}
                      color={on ? "#0F3D1E" : "#3F3F46"}
                      weight={on ? "duotone" : "regular"}
                    />
                  </View>
                  <Text style={[s.cardTitle, on && s.cardTitleOn]}>
                    {t(`personalize.interest.${it.key}.title`, it.label)}
                  </Text>
                  <View style={[s.check, on && s.checkOn]}>
                    <Text style={[s.checkText, on && s.checkTextOn]}>
                      {on ? "✓" : ""}
                    </Text>
                  </View>
                </View>
                <Text style={s.cardSub}>
                  {t(`personalize.interest.${it.key}.sub`, it.sub)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity
            style={[s.cta, !canContinue && s.ctaDisabled]}
            activeOpacity={0.9}
            onPress={handleContinue}
            disabled={!canContinue}
          >
            {busy ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={s.ctaText}>
                {t("personalize.continue", "Continue")}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDone}
            disabled={busy}
            activeOpacity={0.7}
            style={s.skip}
          >
            <Text style={s.skipText}>
              {t("personalize.skip", "Not now")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { paddingTop: 64, paddingHorizontal: 20, paddingBottom: 10 },
  headerBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(22,163,74,0.12)",
  },
  title: { fontSize: 26, fontWeight: "800", color: "#0D0D0D", lineHeight: 32 },
  sub: { marginTop: 10, fontSize: 14, color: "#6B6B6B", lineHeight: 20 },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 12 },
  card: {
    borderWidth: 1,
    borderColor: "#EBEBEB",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#FFFFFF",
  },
  cardOn: {
    borderColor: "rgba(22,163,74,0.55)",
    backgroundColor: "rgba(22,163,74,0.06)",
  },
  cardTop: { flexDirection: "row", alignItems: "center" },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "#F4F4F5",
  },
  iconWrapOn: {
    backgroundColor: "rgba(22,163,74,0.16)",
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: "800", color: "#111111" },
  cardTitleOn: { color: "#0F3D1E" },
  cardSub: { marginTop: 6, fontSize: 13, color: "#6B6B6B", lineHeight: 18 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#D7D7D7",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkOn: { backgroundColor: "#16A34A", borderColor: "#16A34A" },
  checkText: { fontSize: 14, color: "#111111", fontWeight: "900" },
  checkTextOn: { color: "#FFFFFF" },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 22,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#EFEFEF",
  },
  cta: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  skip: { alignItems: "center", marginTop: 12 },
  skipText: { color: "#6B6B6B", fontSize: 13, fontWeight: "600" },
});

