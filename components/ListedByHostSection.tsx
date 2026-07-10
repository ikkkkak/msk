import React from "react";
import {
  Image,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "@ui-kitten/components";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { Buildings, ChatCircle, Envelope, Phone } from "phosphor-react-native";
import OrganizationCard from "./OrganizationCard";
import { BrokerHostProfileCard } from "./broker/BrokerHostProfileCard";
import {
  hostIsVerifiedBroker,
  type BrokerHostData,
} from "./broker/BrokerVerifiedBadge";

const BLACK = "#222222";
const SURFACE = "#FFFFFF";
const MUTED = "#484848";

type ListedByHostSectionProps = {
  sectionStyle?: object;
  data: BrokerHostData;
  onContactHost: () => void;
  onOpenContactOptions?: () => void;
};

function GhostBtn({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
      style={styles.ghostBtn}
      activeOpacity={0.7}
    >
      {icon}
      <Text style={styles.ghostLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ListedByHostSection({
  sectionStyle,
  data,
  onContactHost,
  onOpenContactOptions,
}: ListedByHostSectionProps) {
  const { t } = useTranslation();

  const organization = data?.organization ?? null;
  const owner = data?.owner ?? null;
  const verified = hostIsVerifiedBroker(data);

  return (
    <View style={sectionStyle}>
      <Text style={styles.sectionTitle}>{t("sale.listedBy", "Listed by")}</Text>

      {verified ? (
        <BrokerHostProfileCard
          data={data}
          fallbackName={
            organization?.name?.trim() ||
            [owner?.firstName, owner?.lastName].filter(Boolean).join(" ") ||
            t("sale.host", "Host")
          }
        />
      ) : null}

      {organization ? (
        <>
          <OrganizationCard
            name={organization.name}
            imageUri={organization.banner_image}
            phone={organization.phone}
            email={organization.email}
            website={organization.website}
            whatsapp={organization.whatsapp}
            isVerified={false}
            onMessagePress={onContactHost}
          />
          <TouchableOpacity
            style={styles.contactOptionsBtn}
            onPress={onOpenContactOptions}
            activeOpacity={0.8}
          >
            <Phone size={16} color={BLACK} weight="fill" />
            <Text style={styles.contactOptionsText}>
              {t("sale.contactOptions", "Contact options")}
            </Text>
          </TouchableOpacity>
        </>
      ) : owner ? (
        <>
          {!verified ? (
            <View style={styles.agentCard}>
              {owner.avatarURL ? (
                <Image
                  source={{ uri: owner.avatarURL }}
                  style={styles.agentAvatar}
                />
              ) : (
                <View style={[styles.agentAvatar, styles.agentAvatarFallback]}>
                  <Text style={styles.agentInitial}>
                    {owner.firstName?.charAt(0)?.toUpperCase() || "H"}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.agentName}>
                  {[owner.firstName, owner.lastName]
                    .filter(Boolean)
                    .join(" ") || t("sale.host", "Host")}
                </Text>
                {owner.phoneNumber ? (
                  <View style={styles.agentDetailRow}>
                    <Phone size={13} color={MUTED} />
                    <Text style={styles.agentDetailText}>
                      {owner.phoneNumber}
                    </Text>
                  </View>
                ) : null}
                {owner.email ? (
                  <View style={styles.agentDetailRow}>
                    <Envelope size={13} color={MUTED} />
                    <Text style={styles.agentDetailText}>{owner.email}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          <View style={styles.agentActionsRow}>
            {owner.phoneNumber ? (
              <GhostBtn
                icon={<Phone size={20} color={BLACK} weight="fill" />}
                label={t("sale.call", "Call")}
                onPress={() => Linking.openURL(`tel:${owner.phoneNumber}`)}
              />
            ) : null}
            {owner.email ? (
              <GhostBtn
                icon={<Envelope size={20} color={BLACK} weight="fill" />}
                label={t("sale.email", "Email")}
                onPress={() => Linking.openURL(`mailto:${owner.email}`)}
              />
            ) : null}
            <GhostBtn
              icon={<ChatCircle size={20} color={BLACK} weight="fill" />}
              label={t("sale.messageInApp", "Message in app")}
              onPress={onContactHost}
            />
            <GhostBtn
              icon={<Phone size={20} color={BLACK} weight="fill" />}
              label={t("sale.contactOptionsShort", "Options")}
              onPress={onOpenContactOptions}
            />
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Buildings size={40} color={MUTED} />
          <Text style={styles.emptyTitle}>
            {t("sale.agentInfoUnavailableTitle")}
          </Text>
          <Text style={styles.emptySub}>
            {t("sale.agentInfoUnavailableSubtitle")}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: BLACK,
    marginTop: 24,
    marginBottom: 14,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  agentCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E4DC",
    marginBottom: 12,
  },
  agentAvatar: { width: 52, height: 52, borderRadius: 12 },
  agentAvatarFallback: {
    backgroundColor: BLACK,
    alignItems: "center",
    justifyContent: "center",
  },
  agentInitial: { fontSize: 22, fontWeight: "700", color: "#FFF" },
  agentName: { fontSize: 14, fontWeight: "700", color: BLACK, marginBottom: 4 },
  agentDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 3,
  },
  agentDetailText: { fontSize: 12, color: MUTED },
  agentActionsRow: { flexDirection: "row", gap: 8 },
  ghostBtn: {
    flex: 1,
    alignItems: "center",
    gap: 5,
    paddingVertical: 11,
    paddingHorizontal: 8,
    backgroundColor: SURFACE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E4E0D8",
  },
  ghostLabel: { fontSize: 9, fontWeight: "500", color: "#333" },
  contactOptionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 10,
  },
  contactOptionsText: {
    fontSize: 13,
    fontWeight: "700",
    color: BLACK,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: BLACK,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
});
