import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { endpoints } from "../../constants";
import type { ListingAiDraft } from "../../types/listingAi";
import { LAI, laiStyles } from "./listingAiTheme";

type City = { id: number; name: string; name_ar?: string };
type Zone = { id: number; name: string; name_ar?: string; city_id: number };
type Quartier = { id: number; name: string; name_ar?: string; zone_id: number };

type EditField = "city" | "zone" | "quartier" | null;

type Props = {
  draft: ListingAiDraft;
  onChange: (draft: ListingAiDraft) => void;
};

export function ListingAiReviewLocation({ draft, onChange }: Props) {
  const { t } = useTranslation();
  const [cities, setCities] = useState<City[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
  const [editing, setEditing] = useState<EditField>(null);

  useEffect(() => {
    axios.get(`${endpoints.baseURL}/cities`).then((r) => {
      setCities(r.data?.data || []);
    });
  }, []);

  useEffect(() => {
    if (!draft.city_id) {
      setZones([]);
      return;
    }
    axios
      .get(`${endpoints.baseURL}/cities/${draft.city_id}/zones`)
      .then((r) => setZones(r.data?.data || []));
  }, [draft.city_id]);

  useEffect(() => {
    if (!draft.zone_id) {
      setQuartiers([]);
      return;
    }
    axios
      .get(`${endpoints.baseURL}/cities/zones/${draft.zone_id}/quartiers`)
      .then((r) => setQuartiers(r.data?.data || []));
  }, [draft.zone_id]);

  useEffect(() => {
    if (draft.city_id || !draft.city_name?.trim() || cities.length === 0) return;
    const match = cities.find(
      (c) =>
        c.name.toLowerCase() === draft.city_name!.trim().toLowerCase(),
    );
    if (match) {
      onChange({ ...draft, city_id: match.id, city_name: match.name });
    }
  }, [cities, draft.city_name, draft.city_id]);

  useEffect(() => {
    if (draft.zone_id || !draft.zone_name?.trim() || zones.length === 0) return;
    const match = zones.find(
      (z) =>
        z.name.toLowerCase() === draft.zone_name!.trim().toLowerCase(),
    );
    if (match) {
      onChange({ ...draft, zone_id: match.id, zone_name: match.name });
    }
  }, [zones, draft.zone_name, draft.zone_id]);

  useEffect(() => {
    if (
      draft.quartier_id ||
      !draft.quartier_name?.trim() ||
      quartiers.length === 0
    )
      return;
    const match = quartiers.find(
      (q) =>
        q.name.toLowerCase() === draft.quartier_name!.trim().toLowerCase(),
    );
    if (match) {
      onChange({ ...draft, quartier_id: match.id, quartier_name: match.name });
    }
  }, [quartiers, draft.quartier_name, draft.quartier_id]);

  const pickCity = (c: City) => {
    onChange({
      ...draft,
      city_id: c.id,
      city_name: c.name,
      zone_id: undefined,
      zone_name: "",
      quartier_id: undefined,
      quartier_name: "",
    });
    setEditing("zone");
  };

  const pickZone = (z: Zone) => {
    onChange({
      ...draft,
      zone_id: z.id,
      zone_name: z.name,
      quartier_id: undefined,
      quartier_name: "",
    });
    setEditing(quartiers.length > 0 ? "quartier" : null);
  };

  const pickQuartier = (q: Quartier) => {
    onChange({
      ...draft,
      quartier_id: q.id,
      quartier_name: q.name,
    });
    setEditing(null);
  };

  const toggleEdit = (field: EditField) => {
    setEditing((prev) => (prev === field ? null : field));
  };

  const cityLabel =
    draft.city_name?.trim() ||
    t("listingAi.locationNotSet", { defaultValue: "Not selected" });
  const zoneLabel =
    draft.zone_name?.trim() ||
    t("listingAi.locationNotSet", { defaultValue: "Not selected" });
  const quartierLabel =
    draft.quartier_name?.trim() ||
    t("listingAi.locationOptional", { defaultValue: "Optional" });

  return (
    <View style={styles.section}>
      <Text style={[laiStyles.label, styles.sectionLabel]}>
        {t("listingAi.locationSelectedTitle", {
          defaultValue: "Location",
        })}
      </Text>
      {draft.location_match_confidence ? (
        <Text style={styles.confidence}>
          {t("listingAi.matchConfidence", {
            defaultValue: "Match: {{level}}",
            level: draft.location_match_confidence,
          })}
        </Text>
      ) : null}

      <SelectedRow
        label={t("listingAi.cityPlaceholder", { defaultValue: "City" })}
        value={cityLabel}
        isSet={Boolean(draft.city_id)}
        isEditing={editing === "city"}
        onToggle={() => toggleEdit("city")}
        changeLabel={t("listingAi.locationChange", { defaultValue: "Change" })}
        doneLabel={t("common.done", { defaultValue: "Done" })}
      />
      {editing === "city" ? (
        <PickerList
          items={cities.map((c) => ({
            id: c.id,
            label: c.name,
            active: draft.city_id === c.id,
          }))}
          onPick={(id) => {
            const c = cities.find((x) => x.id === id);
            if (c) pickCity(c);
          }}
        />
      ) : null}

      <SelectedRow
        label={t("listingAi.zonePlaceholder", { defaultValue: "Zone" })}
        value={zoneLabel}
        isSet={Boolean(draft.zone_id)}
        isEditing={editing === "zone"}
        onToggle={() => draft.city_id && toggleEdit("zone")}
        changeLabel={t("listingAi.locationChange", { defaultValue: "Change" })}
        doneLabel={t("common.done", { defaultValue: "Done" })}
        disabled={!draft.city_id}
      />
      {editing === "zone" && draft.city_id ? (
        <PickerList
          items={zones.map((z) => ({
            id: z.id,
            label: z.name,
            active: draft.zone_id === z.id,
          }))}
          onPick={(id) => {
            const z = zones.find((x) => x.id === id);
            if (z) pickZone(z);
          }}
        />
      ) : null}

      <SelectedRow
        label={t("listingAi.quartierPlaceholder", {
          defaultValue: "Sector",
        })}
        value={quartierLabel}
        isSet={Boolean(draft.quartier_id)}
        isEditing={editing === "quartier"}
        onToggle={() => draft.zone_id && toggleEdit("quartier")}
        changeLabel={t("listingAi.locationChange", { defaultValue: "Change" })}
        doneLabel={t("common.done", { defaultValue: "Done" })}
        disabled={!draft.zone_id}
        optional
      />
      {editing === "quartier" && draft.zone_id ? (
        <PickerList
          items={quartiers.map((q) => ({
            id: q.id,
            label: q.name,
            active: draft.quartier_id === q.id,
          }))}
          onPick={(id) => {
            const q = quartiers.find((x) => x.id === id);
            if (q) pickQuartier(q);
          }}
          emptyHint={t("listingAi.noQuartiers", {
            defaultValue: "No sectors for this zone",
          })}
        />
      ) : null}
    </View>
  );
}

function SelectedRow({
  label,
  value,
  isSet,
  isEditing,
  onToggle,
  changeLabel,
  doneLabel,
  disabled,
  optional,
}: {
  label: string;
  value: string;
  isSet: boolean;
  isEditing: boolean;
  onToggle: () => void;
  changeLabel: string;
  doneLabel: string;
  disabled?: boolean;
  optional?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, disabled && styles.rowDisabled]}
      onPress={onToggle}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.rowMain}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text
          style={[
            styles.rowValue,
            !isSet && !optional && styles.rowValueMissing,
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      <Text style={[styles.changeText, isEditing && styles.changeTextActive]}>
        {isEditing ? doneLabel : changeLabel}
      </Text>
    </TouchableOpacity>
  );
}

function PickerList({
  items,
  onPick,
  emptyHint,
}: {
  items: { id: number; label: string; active: boolean }[];
  onPick: (id: number) => void;
  emptyHint?: string;
}) {
  if (items.length === 0) {
    return emptyHint ? (
      <Text style={styles.emptyHint}>{emptyHint}</Text>
    ) : null;
  }
  return (
    <View style={styles.picker}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.pickerItem, item.active && styles.pickerItemActive]}
          onPress={() => onPick(item.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.pickerItemText,
              item.active && styles.pickerItemTextActive,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: LAI.border,
    borderRadius: LAI.radius,
    backgroundColor: LAI.surface,
    overflow: "hidden",
  },
  sectionLabel: {
    paddingHorizontal: 12,
    paddingTop: 12,
    marginBottom: 0,
  },
  confidence: {
    fontSize: 12,
    color: LAI.textSecondary,
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LAI.border,
  },
  rowDisabled: { opacity: 0.4 },
  rowMain: { flex: 1, marginRight: 12 },
  rowLabel: {
    fontSize: 12,
    color: LAI.textSecondary,
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: "500",
    color: LAI.text,
  },
  rowValueMissing: {
    color: LAI.danger,
  },
  changeText: {
    fontSize: 13,
    fontWeight: "500",
    color: LAI.textSecondary,
  },
  changeTextActive: {
    color: LAI.text,
    fontWeight: "600",
  },
  picker: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LAI.border,
    backgroundColor: LAI.surface,
  },
  pickerItem: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LAI.border,
  },
  pickerItemActive: {},
  pickerItemText: {
    fontSize: 14,
    color: LAI.text,
  },
  pickerItemTextActive: {
    fontWeight: "600",
  },
  emptyHint: {
    fontSize: 13,
    color: LAI.textMuted,
    padding: 12,
  },
});
