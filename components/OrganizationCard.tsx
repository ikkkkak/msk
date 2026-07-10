import React from "react";
import { Image, Linking, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import {
  Buildings,
  ChatCircle,
  CheckCircle,
  Envelope,
  Globe,
  Phone,
  WhatsappLogo,
  SealCheck,
} from "phosphor-react-native";

type OrganizationCardProps = {
  name?: string | null;
  imageUri?: string | null;
  location?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  whatsapp?: string | null;
  isVerified?: boolean;
  brokerId?: string | null;
  onMessagePress?: () => void;
  style?: any;
};

function ActionBtn({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.78}
      style={styles.actionBtn}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
    >
      {icon}
      <Text style={styles.actionTxt}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function OrganizationCard({
  name,
  imageUri,
  location,
  phone,
  email,
  website,
  whatsapp,
  isVerified,
  brokerId,
  onMessagePress,
  style,
}: OrganizationCardProps) {
  const { t } = useTranslation();
  const displayName = name?.trim() || t("common.organization", "Organization");
  const waNumber = (whatsapp || phone || "").replace(/\D/g, "");

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.headRow}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Buildings size={20} color="#FFFFFF" weight="fill" />
          </View>
        )}

        <View style={styles.headBody}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            {isVerified ? (
              <View style={styles.verifiedPill}>
                <SealCheck size={11} color="#008489" weight="fill" />
                <Text style={styles.verifiedText}>
                  {t("broker.verifiedShort", "Verified")}
                </Text>
              </View>
            ) : null}
          </View>

          {isVerified && brokerId?.trim() ? (
            <Text style={styles.brokerIdLine}>{brokerId.trim()}</Text>
          ) : null}

          {location ? (
            <Text style={styles.location} numberOfLines={1}>
              {location}
            </Text>
          ) : null}

          {!!phone && (
            <View style={styles.metaRow}>
              <Phone size={13} color="#5A5A5A" />
              <Text style={styles.metaText}>{phone}</Text>
            </View>
          )}
          {!!email && (
            <View style={styles.metaRow}>
              <Envelope size={13} color="#5A5A5A" />
              <Text style={styles.metaText} numberOfLines={1}>
                {email}
              </Text>
            </View>
          )}
          {!!website && (
            <View style={styles.metaRow}>
              <Globe size={13} color="#5A5A5A" />
              <Text style={styles.metaText} numberOfLines={1}>
                {website}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionsRow}>
        {!!phone && (
          <ActionBtn
            icon={<Phone size={18} color="#1F1F1F" weight="fill" />}
            label={t("sale.call", "Call")}
            onPress={() => Linking.openURL(`tel:${phone}`).catch(() => {})}
          />
        )}
        {!!email && (
          <ActionBtn
            icon={<Envelope size={18} color="#1F1F1F" weight="fill" />}
            label={t("sale.email", "Email")}
            onPress={() => Linking.openURL(`mailto:${email}`).catch(() => {})}
          />
        )}
        {!!onMessagePress && (
          <ActionBtn
            icon={<ChatCircle size={18} color="#1F1F1F" weight="fill" />}
            label={t("sale.contactHost", "Message")}
            onPress={onMessagePress}
          />
        )}
        {!!waNumber && (
          <ActionBtn
            icon={<WhatsappLogo size={18} color="#25D366" weight="fill" />}
            label={t("sale.whatsapp", "WhatsApp")}
            onPress={() => Linking.openURL(`https://wa.me/${waNumber}`).catch(() => {})}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: "#EBEDF0",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: "#F4F5F6",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F1F1F",
  },
  headBody: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#008489",
  },
  brokerIdLine: {
    fontSize: 12,
    fontWeight: "500",
    color: "#717171",
    fontVariant: ["tabular-nums"],
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
    color: "#777777",
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    flex: 1,
    fontSize: 12.5,
    color: "#404040",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 7,
  },
  actionTxt: {
    fontSize: 10.5,
    color: "#2B2B2B",
    fontWeight: "600",
  },
});
