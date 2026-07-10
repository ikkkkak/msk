import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ListingAiField } from "./ListingAiField";
import { LAI } from "./listingAiTheme";

type Props = {
  value: string;
  onChange: (value: string) => void;
  sectorName?: string;
  disabled?: boolean;
};

export function ListingAiPlotNumberStep({
  value,
  onChange,
  sectorName,
  disabled,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      {sectorName ? (
        <Text style={styles.sector}>
          {t("listingAi.plotNumberSector", {
            defaultValue: "Sector: {{name}}",
            name: sectorName,
          })}
        </Text>
      ) : null}

      <ListingAiField
        label={t("listing.landmark.steps.plotNumber.title", {
          defaultValue: "Plot number",
        })}
        hint={t("listing.landmark.steps.plotNumber.hint", {
          defaultValue: "Must match the cadastre record for your sector.",
        })}
        value={value}
        onChangeText={onChange}
        placeholder={t("listing.landmark.steps.plotNumber.placeholder", {
          defaultValue: "e.g. 502",
        })}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
  sector: {
    fontSize: 13,
    color: LAI.textSecondary,
    marginBottom: 4,
    fontWeight: "500",
  },
});
