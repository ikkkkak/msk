import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import type { QuickReply } from "../../services/aiService";
import {
  buildCombinedClarificationReply,
  splitClarificationReplies,
} from "../../utils/aiChatDisplay";
import { AI_CHAT as C } from "./aiChatTheme";

type Props = {
  replies: QuickReply[];
  disabled?: boolean;
  onSelect: (action: string) => void;
};

function Chip({
  label,
  onPress,
  disabled,
  selected,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function AiSearchIntentPanel({ replies, disabled, onSelect }: Props) {
  const { t } = useTranslation();
  const { purpose, types } = splitClarificationReplies(replies);
  const [selectedPurpose, setSelectedPurpose] = useState<QuickReply | null>(
    null,
  );

  useEffect(() => {
    setSelectedPurpose(null);
  }, [replies]);

  if (!purpose.length && !types.length) return null;

  const needsBoth = purpose.length > 0 && types.length > 0;

  const handlePurpose = (reply: QuickReply) => {
    if (needsBoth) {
      setSelectedPurpose(reply);
      return;
    }
    onSelect(reply.action);
  };

  const handleType = (reply: QuickReply) => {
    if (selectedPurpose) {
      onSelect(buildCombinedClarificationReply(selectedPurpose, reply));
      setSelectedPurpose(null);
      return;
    }
    onSelect(reply.action);
  };

  return (
    <View style={styles.root}>
      {purpose.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("aiChat.rentOrBuy", "Rent or buy?")}
          </Text>
          <View style={styles.chipRow}>
            {purpose.map((r) => (
              <Chip
                key={r.id}
                label={
                  r.text.replace(/^[^\w\u0600-\u06FF]+/, "").trim() || r.text
                }
                disabled={disabled}
                selected={selectedPurpose?.id === r.id}
                onPress={() => handlePurpose(r)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {types.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {needsBoth && !selectedPurpose
              ? t("aiChat.choosePurposeFirst", "Choose rent or buy first")
              : needsBoth && selectedPurpose
                ? t("aiChat.chooseTypeNext", "Now choose property type")
                : t("aiChat.propertyType", "Property type")}
          </Text>
          <View style={styles.chipRow}>
            {types.map((r) => (
              <Chip
                key={r.id}
                label={r.text}
                disabled={disabled || (needsBoth && !selectedPurpose)}
                onPress={() => handleType(r)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 10,
    gap: 14,
  },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: C.textMuted,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: C.radius.pill,
    backgroundColor: C.bgChip,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.borderSoft,
  },
  chipPressed: {
    backgroundColor: C.bgChipHover,
  },
  chipSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: C.text,
  },
  chipTextSelected: {
    color: C.primaryText,
  },
  disabled: { opacity: 0.45 },
});
