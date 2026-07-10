import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { EscalationStatus } from "../../hooks/useAIEscalation";

interface Props {
  escalation: EscalationStatus;
  onRequestAgent?: () => void;
  showRequestButton?: boolean;
}

export const EscalationBanner: React.FC<Props> = ({
  escalation,
  onRequestAgent,
  showRequestButton = false,
}) => {
  const { t } = useTranslation();
  const bodyKey =
    escalation.urgency === "urgent"
      ? "modelX46.escalation.urgent"
      : escalation.urgency === "high"
        ? "modelX46.escalation.high"
        : "modelX46.escalation.default";

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        {t("modelX46.escalation.bannerTitle", "Connecting you with a specialist")}
      </Text>
      <Text style={styles.subtitle}>
        {t(bodyKey, t("modelX46.escalation.default"))}
      </Text>
      <Text style={styles.status}>
        {t(`modelX46.escalation.status${capitalize(escalation.status)}`, escalation.status)}
      </Text>
      {showRequestButton && onRequestAgent ? (
        <TouchableOpacity style={styles.btn} onPress={onRequestAgent}>
          <Text style={styles.btnText}>
            {t("modelX46.escalation.requestAgent", "Talk to a specialist")}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

function capitalize(s: string) {
  if (!s) return "Pending";
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#1a1a2e",
  },
  title: { color: "#fff", fontWeight: "700", fontSize: 15 },
  subtitle: { color: "#cbd5e1", marginTop: 6, fontSize: 13, lineHeight: 18 },
  status: { color: "#94a3b8", marginTop: 8, fontSize: 12 },
  btn: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#DA8050",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
});
