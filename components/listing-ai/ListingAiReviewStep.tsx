import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import type { ListingAiDraft, ListingAiKind } from "../../types/listingAi";
import { LISTING_AI_PAPER_TYPES } from "./listingAiConstants";
import { ListingAiReviewLocation } from "./ListingAiReviewLocation";
import { ListingAiField } from "./ListingAiField";
import { LAI, laiStyles } from "./listingAiTheme";

type Props = {
  kind: ListingAiKind;
  draft: ListingAiDraft;
  onChange: (draft: ListingAiDraft) => void;
  paperTypes: string[];
  onPaperTypesChange: (papers: string[]) => void;
  skipPapers: boolean;
  onSkipPapersChange: (skip: boolean) => void;
};

export function ListingAiReviewStep({
  kind,
  draft,
  onChange,
  paperTypes,
  onPaperTypesChange,
  onSkipPapersChange,
}: Props) {
  const { t } = useTranslation();
  const showPapers = kind === "sale" || kind === "land";

  const togglePaper = (p: string) => {
    const next = paperTypes.includes(p)
      ? paperTypes.filter((x) => x !== p)
      : [...paperTypes, p];
    onPaperTypesChange(next);
    onSkipPapersChange(next.length === 0);
  };

  return (
    <View style={styles.content}>
      {kind === "land" ? (
        <ListingAiField
          label={t("listingAi.reviewPlotNumber", {
            defaultValue: "Plot number",
          })}
          value={draft.plot_number ?? ""}
          onChangeText={(plot_number) => onChange({ ...draft, plot_number })}
          placeholder={t("listing.landmark.steps.plotNumber.placeholder", {
            defaultValue: "e.g. 502",
          })}
          autoCapitalize="none"
          autoCorrect={false}
        />
      ) : null}

      <ListingAiField
        label={t("listingAi.reviewListingTitle", { defaultValue: "Title" })}
        value={draft.title}
        onChangeText={(title) => onChange({ ...draft, title })}
        multiline
      />

      <ListingAiField
        label={t("listingAi.reviewDescription", { defaultValue: "Description" })}
        value={draft.description}
        onChangeText={(description) => onChange({ ...draft, description })}
        multiline
        style={laiStyles.fieldMultiline}
      />

      <ListingAiReviewLocation draft={draft} onChange={onChange} />

      {showPapers ? (
        <View style={styles.papersSection}>
          <Text style={laiStyles.label}>
            {t("listingAi.papersTitle", { defaultValue: "Property papers" })}
            {" · "}
            <Text style={styles.optional}>
              {t("listingAi.papersOptional", { defaultValue: "Optional" })}
            </Text>
          </Text>
          <Text style={styles.papersSub}>
            {t("listingAi.papersCredibility", {
              defaultValue:
                "Declaring papers can improve credibility and search ranking.",
            })}
          </Text>
          <View style={styles.chips}>
            {LISTING_AI_PAPER_TYPES.map((p) => (
              <Chip
                key={p}
                label={t(`listingAi.paperTypes.${p}`, p.replace(/_/g, " "))}
                active={paperTypes.includes(p)}
                onPress={() => togglePaper(p)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[laiStyles.chip, active && laiStyles.chipActive]}
    >
      <Text style={[laiStyles.chipText, active && laiStyles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 8 },
  papersSection: {
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LAI.border,
  },
  optional: {
    fontWeight: "400",
    color: LAI.textMuted,
  },
  papersSub: {
    fontSize: 13,
    color: LAI.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
