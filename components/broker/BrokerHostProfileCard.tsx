import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { Text } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import { User as UserIcon } from "phosphor-react-native";
import {
  BrokerVerifiedBadge,
  brokerAvatarUri,
  brokerDisplayName,
  brokerIdFromHost,
  brokerProfileVisible,
  hostIsVerifiedBroker,
  resolveBrokerPerson,
  type BrokerHostData,
} from "./BrokerVerifiedBadge";
import { trustColors as c } from "../trust/trustTokens";

type Props = {
  data: BrokerHostData;
  fallbackName?: string;
  compact?: boolean;
  showLanguages?: boolean;
};

/**
 * Host identity row for verified brokers — Airbnb-scale typography, clear verification line.
 */
export function BrokerHostProfileCard({
  data,
  fallbackName,
  compact,
  showLanguages = true,
}: Props) {
  const { t } = useTranslation();
  const verified = hostIsVerifiedBroker(data);
  const person = resolveBrokerPerson(data);
  const brokerId = brokerIdFromHost(data);
  const showProfile = brokerProfileVisible(person);
  const name = brokerDisplayName(
    person,
    fallbackName ?? t("sale.host", "Host"),
  );
  const avatar = brokerAvatarUri(person);
  const languages = person?.broker_spoken_languages;

  if (!verified) {
    return null;
  }

  const avatarSize = compact ? 48 : 56;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {showProfile ? (
        <View style={styles.row}>
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={[
                styles.avatar,
                { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
              ]}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarFallback,
                { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
              ]}
            >
              <UserIcon size={compact ? 20 : 24} color="#FFF" weight="fill" />
            </View>
          )}
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={2}>
              {name}
            </Text>
            <BrokerVerifiedBadge
              brokerId={brokerId}
              variant="micro"
              showId
            />
            {showLanguages &&
            Array.isArray(languages) &&
            languages.length > 0 ? (
              <Text style={styles.languages} numberOfLines={2}>
                {t("broker.languagesSpoken", "Speaks")}{" "}
                {languages
                  .slice(0, 5)
                  .map((lang) => t(`broker.lang.${lang}`, lang))
                  .join(" · ")}
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={styles.hiddenBlock}>
          <BrokerVerifiedBadge brokerId={brokerId} variant="inline" showId />
          <Text style={styles.hiddenHint}>
            {t(
              "broker.profileHiddenPublic",
              "Photo hidden by broker preference. Identity and license are still verified.",
            )}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.line,
  },
  wrapCompact: {
    marginBottom: 12,
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  avatar: {
    backgroundColor: "#F3F4F6",
  },
  avatarFallback: {
    backgroundColor: c.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: c.ink,
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  languages: {
    fontSize: 12,
    fontWeight: "400",
    color: c.muted,
    lineHeight: 16,
    marginTop: 2,
  },
  hiddenBlock: {
    gap: 6,
  },
  hiddenHint: {
    fontSize: 12,
    color: c.muted,
    lineHeight: 17,
  },
});
