import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type LocItem = { id: number; name: string; name_ar?: string; country_id?: number };

type Props = {
  cities: LocItem[];
  zones: LocItem[];
  quartiers: LocItem[];
  citiesLoading?: boolean;
  zonesLoading?: boolean;
  quartiersLoading?: boolean;
  cityId: number;
  zoneId: number;
  quartierId: number;
  onCitySelect: (city: LocItem) => void;
  onCityClear?: () => void;
  onZoneSelect: (zone: LocItem | null) => void;
  onQuartierSelect: (quartier: LocItem | null) => void;
  lang?: string;
  labels?: {
    city?: string;
    zone?: string;
    quartier?: string;
    search?: string;
    zoneOptional?: string;
    quartierOptional?: string;
    cityOptional?: string;
    pickCityFirst?: string;
    pickZoneFirst?: string;
  };
};

function locLabel(item: LocItem, lang: string) {
  if (lang === "ar") return item.name_ar || item.name;
  return item.name || item.name_ar || "—";
}

function filterItems(items: LocItem[], q: string, lang: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) =>
    locLabel(item, lang).toLowerCase().includes(needle),
  );
}

export function RentLocationPicker({
  cities,
  zones,
  quartiers,
  citiesLoading,
  zonesLoading,
  quartiersLoading,
  cityId,
  zoneId,
  quartierId,
  onCitySelect,
  onCityClear,
  onZoneSelect,
  onQuartierSelect,
  lang = "en",
  labels = {},
}: Props) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<"city" | "zone" | "quartier">("city");

  const cityLabel = labels.city ?? "City";
  const zoneLabel = labels.zone ?? "Zone";
  const quartierLabel = labels.quartier ?? "Sector";

  const activeLevel = useMemo(() => {
    if (cityId <= 0) return "city";
    if (level === "quartier" && zoneId > 0) return "quartier";
    if (level === "zone" || zoneId <= 0) return zoneId > 0 ? level : "zone";
    return "zone";
  }, [cityId, zoneId, level]);

  const listItems = useMemo(() => {
    if (activeLevel === "city") return filterItems(cities, search, lang);
    if (activeLevel === "zone") return filterItems(zones, search, lang);
    return filterItems(quartiers, search, lang);
  }, [activeLevel, cities, zones, quartiers, search, lang]);

  const selectedCity = cities.find((c) => c.id === cityId);
  const selectedZone = zones.find((z) => z.id === zoneId);
  const selectedQuartier = quartiers.find((q) => q.id === quartierId);

  return (
    <View style={styles.wrap}>
      <View style={styles.breadcrumb}>
        <TouchableOpacity
          style={[styles.crumb, cityId > 0 && styles.crumbDone]}
          onPress={() => {
            setLevel("city");
            setSearch("");
          }}
        >
          <Text style={[styles.crumbText, cityId > 0 && styles.crumbTextActive]}>
            {selectedCity ? locLabel(selectedCity, lang) : cityLabel}
          </Text>
        </TouchableOpacity>
        {cityId > 0 ? (
          <>
            <MaterialIcons name="chevron-right" size={18} color="#C4C4C4" />
            <TouchableOpacity
              style={[styles.crumb, zoneId > 0 && styles.crumbDone]}
              onPress={() => {
                setLevel("zone");
                setSearch("");
              }}
            >
              <Text
                style={[styles.crumbText, zoneId > 0 && styles.crumbTextActive]}
              >
                {selectedZone
                  ? locLabel(selectedZone, lang)
                  : zoneLabel}
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
        {zoneId > 0 ? (
          <>
            <MaterialIcons name="chevron-right" size={18} color="#C4C4C4" />
            <TouchableOpacity
              style={styles.crumb}
              onPress={() => {
                setLevel("quartier");
                setSearch("");
              }}
            >
              <Text
                style={[
                  styles.crumbText,
                  quartierId > 0 && styles.crumbTextActive,
                ]}
              >
                {selectedQuartier
                  ? locLabel(selectedQuartier, lang)
                  : quartierLabel}
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      <TextInput
        style={styles.search}
        placeholder={labels.search ?? "Search…"}
        placeholderTextColor="#A3A3A3"
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {activeLevel === "city" && citiesLoading ? (
        <ActivityIndicator style={styles.loader} color="#222" />
      ) : activeLevel === "zone" && zonesLoading ? (
        <ActivityIndicator style={styles.loader} color="#222" />
      ) : activeLevel === "quartier" && quartiersLoading ? (
        <ActivityIndicator style={styles.loader} color="#222" />
      ) : (
        <ScrollView
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {activeLevel === "city" ? (
            <TouchableOpacity
              style={styles.rowMuted}
              onPress={() => {
                onCityClear?.();
                setSearch("");
              }}
            >
              <Text style={styles.rowMutedText}>
                {labels.cityOptional ?? "No city — continue"}
              </Text>
            </TouchableOpacity>
          ) : null}
          {activeLevel === "zone" && cityId > 0 ? (
            <TouchableOpacity
              style={styles.rowMuted}
              onPress={() => {
                onZoneSelect(null);
                setSearch("");
              }}
            >
              <Text style={styles.rowMutedText}>
                {labels.zoneOptional ?? "No zone — continue"}
              </Text>
            </TouchableOpacity>
          ) : null}
          {activeLevel === "quartier" && zoneId > 0 ? (
            <TouchableOpacity
              style={styles.rowMuted}
              onPress={() => {
                onQuartierSelect(null);
                setSearch("");
              }}
            >
              <Text style={styles.rowMutedText}>
                {labels.quartierOptional ?? "No sector — continue"}
              </Text>
            </TouchableOpacity>
          ) : null}

          {listItems.map((item) => {
            const active =
              (activeLevel === "city" && cityId === item.id) ||
              (activeLevel === "zone" && zoneId === item.id) ||
              (activeLevel === "quartier" && quartierId === item.id);
            return (
              <TouchableOpacity
                key={`${activeLevel}-${item.id}`}
                style={[styles.row, active && styles.rowActive]}
                onPress={() => {
                  if (activeLevel === "city") {
                    onCitySelect(item);
                    setLevel("zone");
                    setSearch("");
                  } else if (activeLevel === "zone") {
                    onZoneSelect(item);
                    setLevel("quartier");
                    setSearch("");
                  } else {
                    onQuartierSelect(item);
                    setSearch("");
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.rowText, active && styles.rowTextActive]}>
                  {locLabel(item, lang)}
                </Text>
                {active ? (
                  <MaterialIcons name="check" size={20} color="#222" />
                ) : null}
              </TouchableOpacity>
            );
          })}

          {listItems.length === 0 ? (
            <Text style={styles.empty}>
              {activeLevel === "zone" && cityId <= 0
                ? labels.pickCityFirst ?? "Pick a city first"
                : activeLevel === "quartier" && zoneId <= 0
                  ? labels.pickZoneFirst ?? "Pick a zone first"
                  : "—"}
            </Text>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 280 },
  breadcrumb: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  crumb: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EFEFEF",
  },
  crumbDone: { backgroundColor: "#E8E8E8" },
  crumbText: { fontSize: 13, color: "#717171", fontWeight: "500" },
  crumbTextActive: { color: "#222", fontWeight: "600" },
  search: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5E5",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#222",
    marginBottom: 12,
  },
  list: { maxHeight: 340 },
  loader: { marginTop: 32 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EBEBEB",
  },
  rowActive: { backgroundColor: "#FAFAFA" },
  rowText: { fontSize: 16, color: "#222", flex: 1 },
  rowTextActive: { fontWeight: "600" },
  rowMuted: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  rowMutedText: {
    fontSize: 15,
    color: "#717171",
    fontWeight: "500",
  },
  empty: {
    textAlign: "center",
    color: "#A3A3A3",
    marginTop: 24,
    fontSize: 14,
  },
});
