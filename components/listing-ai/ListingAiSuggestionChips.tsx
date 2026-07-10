import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import type { ListingAiKind } from "../../types/listingAi";
import { suggestionExamples } from "./listingAiProgress";
import { LAI } from "./listingAiTheme";

type Props = {
  kind: ListingAiKind;
  onSelect: (text: string) => void;
  disabled?: boolean;
};

export function ListingAiSuggestionChips({ kind, onSelect, disabled }: Props) {
  const { t } = useTranslation();
  const examples = suggestionExamples(kind, t);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {t("listingAi.tryExample", { defaultValue: "Examples" })}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {examples.map((ex) => (
          <TouchableOpacity
            key={ex.slice(0, 24)}
            style={[styles.chip, disabled && styles.chipDisabled]}
            onPress={() => onSelect(ex)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText} numberOfLines={2}>
              {ex}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  label: {
    fontSize: 13,
    color: LAI.textSecondary,
    marginBottom: 8,
  },
  chips: { gap: 8, paddingRight: 8 },
  chip: {
    maxWidth: 220,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: LAI.radius,
    borderWidth: 1,
    borderColor: LAI.border,
    backgroundColor: LAI.surface,
  },
  chipDisabled: { opacity: 0.45 },
  chipText: {
    fontSize: 13,
    color: LAI.text,
    lineHeight: 18,
  },
});
