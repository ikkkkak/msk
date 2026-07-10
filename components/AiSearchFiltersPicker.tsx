import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Check } from "phosphor-react-native";
import { publicApi } from "../services/api";
import { updateAgentFilters } from "../services/agentFiltersService";
import { AI_CHAT as C } from "./agent/aiChatTheme";

type Option = { id: number; name: string };

type PickerValues = {
  cityId: number;
  cityName: string;
  zoneId: number;
  zoneName: string;
  quartierId: number | null;
  quartierName: string | null;
  minPriceMRU: number | null;
  maxPriceMRU: number | null;
};

type Props = {
  onFindSuggestions: (promptText: string) => void;
  disabled?: boolean;
  sessionId?: string;
  anonSessionId?: string;
};

export default function AiSearchFiltersPicker({
  onFindSuggestions,
  disabled = false,
  sessionId,
  anonSessionId,
}: Props) {
  const [step, setStep] = useState<"city" | "zone" | "quartier" | "price">(
    "city",
  );

  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingQuartiers, setLoadingQuartiers] = useState(false);

  const [cities, setCities] = useState<Option[]>([]);
  const [zones, setZones] = useState<Option[]>([]);
  const [quartiers, setQuartiers] = useState<Option[]>([]);

  const [city, setCity] = useState<Option | null>(null);
  const [zone, setZone] = useState<Option | null>(null);
  const [quartier, setQuartier] = useState<Option | null>(null);

  const [minInput, setMinInput] = useState<string>("");
  const [maxInput, setMaxInput] = useState<string>("");
  const [budgetPreset, setBudgetPreset] = useState<
    "any" | "low" | "mid" | "high" | "custom"
  >("any");

  const pricePreset = useMemo(() => {
    // Values tuned for MRU scale.
    switch (budgetPreset) {
      case "low":
        return { min: 0, max: 100000 };
      case "mid":
        return { min: 100000, max: 300000 };
      case "high":
        return { min: 300000, max: null as number | null };
      case "custom": {
        const min = Number(minInput);
        const max = Number(maxInput);
        return {
          min: Number.isFinite(min) && min > 0 ? min : null,
          max: Number.isFinite(max) && max > 0 ? max : null,
        };
      }
      case "any":
      default:
        return { min: null as number | null, max: null as number | null };
    }
  }, [budgetPreset, minInput, maxInput]);

  const hasQuartierOptions = quartiers.length > 0;

  useEffect(() => {
    if (step !== "city") return;
    let cancelled = false;
    const run = async () => {
      setLoadingCities(true);
      try {
        const res = await publicApi.get("/cities");
        const list = (res.data?.data ?? res.data?.cities ?? res.data ?? []) as any[];
        if (cancelled) return;
        setCities(
          list
            .map((x: any) => ({
              id: Number(x.id),
              name: String(x.name ?? x.city_name ?? x.title ?? ""),
            }))
            .filter((x: any) => x.id && x.name),
        );
      } catch {
        if (!cancelled) setCities([]);
      } finally {
        if (!cancelled) setLoadingCities(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [step]);

  useEffect(() => {
    if (step !== "zone") return;
    if (!city?.id) return;
    let cancelled = false;
    const run = async () => {
      setLoadingZones(true);
      try {
        const res = await publicApi.get(`/cities/${city.id}/zones`);
        const list = (res.data?.data ?? res.data?.zones ?? res.data ?? []) as any[];
        if (cancelled) return;
        setZones(
          list
            .map((x: any) => ({
              id: Number(x.id),
              name: String(x.name ?? x.zone_name ?? x.title ?? ""),
            }))
            .filter((x: any) => x.id && x.name),
        );
      } catch {
        if (!cancelled) setZones([]);
      } finally {
        if (!cancelled) setLoadingZones(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [step, city?.id]);

  useEffect(() => {
    if (step !== "quartier") return;
    if (!zone?.id) return;
    let cancelled = false;
    const run = async () => {
      setLoadingQuartiers(true);
      try {
        const res = await publicApi.get(`/cities/zones/${zone.id}/quartiers`);
        const list = (res.data?.data ?? res.data?.quartiers ?? res.data ?? []) as any[];
        if (cancelled) return;
        setQuartiers(
          list
            .map((x: any) => ({
              id: Number(x.id),
              name: String(x.name ?? x.quartier_name ?? x.title ?? ""),
            }))
            .filter((x: any) => x.id && x.name),
        );
      } catch {
        if (!cancelled) setQuartiers([]);
      } finally {
        if (!cancelled) setLoadingQuartiers(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [step, zone?.id]);

  const canContinueCity = !!city?.id;
  const canContinueZone = !!zone?.id;

  const values: PickerValues | null = city && zone
    ? {
        cityId: city.id,
        cityName: city.name,
        zoneId: zone.id,
        zoneName: zone.name,
        quartierId: quartier ? quartier.id : null,
        quartierName: quartier ? quartier.name : null,
        minPriceMRU: pricePreset.min,
        maxPriceMRU: pricePreset.max,
      }
    : null;

  const buildPrompt = (v: PickerValues) => {
    const min = v.minPriceMRU ?? null;
    const max = v.maxPriceMRU ?? null;

    // Convert open-ended/custom ranges to a [min..max] interval
    // because the backend DB query uses BETWEEN for budget.
    let budgetMin = min ?? 0;
    let budgetMax = max ?? 0;
    if (min != null && max == null) budgetMax = min * 2;
    if (min == null && max != null) budgetMin = Math.max(0, Math.round(max / 2));

    const quartierName = v.quartierName ?? "";

    // Deterministic machine block so the server can parse it reliably.
    // Frontend sends this text, server extracts values and performs DB search.
    return (
      `[MESKENY_PICKER]\n` +
      `city_name=${v.cityName}\n` +
      `zone_name=${v.zoneName}\n` +
      `quartier_name=${quartierName}\n` +
      `budget_min_mru=${budgetMin}\n` +
      `budget_max_mru=${budgetMax}\n` +
      `[/MESKENY_PICKER]`
    );
  };

  const submit = async (v?: PickerValues | null) => {
    const vv = v ?? values;
    if (!vv) return;
    await updateAgentFilters({
      sessionId,
      anonSessionId,
      city: vv.cityName,
      zone: vv.zoneName,
      quartier: vv.quartierName ?? undefined,
      minPrice: vv.minPriceMRU ?? undefined,
      maxPrice: vv.maxPriceMRU ?? undefined,
    });
    onFindSuggestions(buildPrompt(vv));
  };

  const steps = useMemo(
    () =>
      [
        { key: "city" as const, label: "City" },
        { key: "zone" as const, label: "Zone" },
        { key: "quartier" as const, label: "Quartier" },
        { key: "price" as const, label: "Budget" },
      ] as const,
    [],
  );

  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <View style={styles.root}>
      <View style={styles.breadcrumb}>
        {steps.map((s, i) => {
          const active = s.key === step;
          const done = i < stepIndex;
          return (
            <View key={s.key} style={styles.breadcrumbItem}>
              {i > 0 ? (
                <Text style={styles.breadcrumbSep}>›</Text>
              ) : null}
              <Text
                style={[
                  styles.breadcrumbLabel,
                  active && styles.breadcrumbLabelActive,
                  done && styles.breadcrumbLabelDone,
                ]}
              >
                {s.label}
              </Text>
            </View>
          );
        })}
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === "city" && (
          <>
            {loadingCities ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={C.textSub} />
                <Text style={styles.loadingText}>Loading cities…</Text>
              </View>
            ) : (
              <FlatList
                data={cities}
                keyExtractor={(it) => String(it.id)}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                scrollEnabled={false}
                renderItem={({ item }) => {
                  const active = city?.id === item.id;
                  return (
                    <Pressable
                      onPress={() => setCity(item)}
                      style={styles.listItem}
                      disabled={disabled}
                    >
                      <Text
                        style={[
                          styles.listItemText,
                          active && styles.listItemTextActive,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {active ? (
                        <Check size={16} color={C.text} weight="bold" />
                      ) : null}
                    </Pressable>
                  );
                }}
              />
            )}

          </>
        )}

        {step === "zone" && (
          <>
            {loadingZones ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={C.textSub} />
                <Text style={styles.loadingText}>Loading zones…</Text>
              </View>
            ) : (
              <FlatList
                data={zones}
                keyExtractor={(it) => String(it.id)}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                scrollEnabled={false}
                renderItem={({ item }) => {
                  const active = zone?.id === item.id;
                  return (
                    <Pressable
                      onPress={() => setZone(item)}
                      style={styles.listItem}
                      disabled={disabled}
                    >
                      <Text
                        style={[
                          styles.listItemText,
                          active && styles.listItemTextActive,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {active ? (
                        <Check size={16} color={C.text} weight="bold" />
                      ) : null}
                    </Pressable>
                  );
                }}
              />
            )}

          </>
        )}

        {step === "quartier" && (
          <>
            {loadingQuartiers ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={C.textSub} />
                <Text style={styles.loadingText}>Loading quartier…</Text>
              </View>
            ) : !hasQuartierOptions ? (
              <View style={styles.noOptionsWrap}>
                <Text style={styles.noOptionsTitle}>No quartiers found</Text>
                <Text style={styles.noOptionsSub}>
                  You can skip this step.
                </Text>
              </View>
            ) : (
              <FlatList
                data={quartiers}
                keyExtractor={(it) => String(it.id)}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                scrollEnabled={false}
                renderItem={({ item }) => {
                  const active = quartier?.id === item.id;
                  return (
                    <Pressable
                      onPress={() => setQuartier(item)}
                      style={styles.listItem}
                      disabled={disabled}
                    >
                      <Text
                        style={[
                          styles.listItemText,
                          active && styles.listItemTextActive,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {active ? (
                        <Check size={16} color={C.text} weight="bold" />
                      ) : null}
                    </Pressable>
                  );
                }}
              />
            )}

          </>
        )}

        {step === "price" && (
          <>
            <View style={styles.presetsRow}>
              {[
                ["any", "Any"],
                ["low", "Under 100k"],
                ["mid", "100k - 300k"],
                ["high", "300k+"],
              ].map(([key, label]) => {
                const k = key as any;
                const active = budgetPreset === k;
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      setBudgetPreset(k);
                      if (k !== "custom") {
                        setMinInput("");
                        setMaxInput("");
                      }
                    }}
                    style={[
                      styles.presetChip,
                      active ? styles.presetChipActive : null,
                    ]}
                    disabled={disabled}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        active && styles.presetChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}

              <Pressable
                onPress={() => setBudgetPreset("custom")}
                style={[
                  styles.presetChip,
                  budgetPreset === "custom" ? styles.presetChipActive : null,
                ]}
                disabled={disabled}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    budgetPreset === "custom" &&
                      styles.presetChipTextActive,
                  ]}
                >
                  Custom
                </Text>
              </Pressable>
            </View>

            {budgetPreset === "custom" && (
              <View style={styles.customRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Min MRU (optional)"
                  keyboardType="numeric"
                  value={minInput}
                  onChangeText={(t) =>
                    setMinInput(t.replace(/[^\d]/g, ""))
                  }
                  editable={!disabled}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Max MRU (optional)"
                  keyboardType="numeric"
                  value={maxInput}
                  onChangeText={(t) =>
                    setMaxInput(t.replace(/[^\d]/g, ""))
                  }
                  editable={!disabled}
                />
              </View>
            )}

          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step === "city" ? (
          <Pressable
            onPress={() => {
              if (!canContinueCity || !city) return;
              setStep("zone");
            }}
            disabled={disabled || !canContinueCity}
            style={[
              styles.primaryBtn,
              styles.footerPrimaryBtn,
              (!canContinueCity || disabled) && styles.primaryBtnDisabled,
            ]}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
          </Pressable>
        ) : null}

        {step === "zone" ? (
          <Pressable
            onPress={() => {
              if (!canContinueZone || !zone) return;
              setStep("quartier");
            }}
            disabled={disabled || !canContinueZone}
            style={[
              styles.primaryBtn,
              styles.footerPrimaryBtn,
              (!canContinueZone || disabled) && styles.primaryBtnDisabled,
            ]}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
          </Pressable>
        ) : null}

        {step === "quartier" ? (
          <View style={styles.twoBtnRow}>
            <Pressable
              onPress={() => {
                setQuartier(null);
                setStep("price");
              }}
              disabled={disabled}
              style={[
                styles.secondaryBtn,
                disabled && styles.primaryBtnDisabled,
              ]}
            >
              <Text style={styles.secondaryBtnText}>Skip quartier</Text>
            </Pressable>
            <Pressable
              onPress={() => setStep("price")}
              disabled={disabled}
              style={[
                styles.primaryBtn,
                disabled && styles.primaryBtnDisabled,
              ]}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
            </Pressable>
          </View>
        ) : null}

        {step === "price" ? (
          <View style={styles.twoBtnRow}>
            <Pressable
              onPress={() => {
                setBudgetPreset("any");
                setMinInput("");
                setMaxInput("");
                if (!city || !zone) return;
                submit({
                  cityId: city.id,
                  cityName: city.name,
                  zoneId: zone.id,
                  zoneName: zone.name,
                  quartierId: quartier ? quartier.id : null,
                  quartierName: quartier ? quartier.name : null,
                  minPriceMRU: null,
                  maxPriceMRU: null,
                });
              }}
              disabled={disabled}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Skip budget</Text>
            </Pressable>
            <Pressable
              onPress={() => submit()}
              disabled={disabled || !values}
              style={[
                styles.primaryBtn,
                disabled && styles.primaryBtnDisabled,
              ]}
            >
              <Text style={styles.primaryBtnText}>Find suggestions</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.borderSoft,
    borderRadius: C.radius.lg,
    backgroundColor: C.surface,
    overflow: "hidden",
  },
  breadcrumb: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 2,
    marginBottom: 0,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.borderSoft,
  },
  breadcrumbItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  breadcrumbSep: {
    fontSize: 12,
    color: C.textMuted,
    marginHorizontal: 4,
  },
  breadcrumbLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: C.textMuted,
  },
  breadcrumbLabelActive: {
    color: C.text,
    fontWeight: "600",
  },
  breadcrumbLabelDone: {
    color: C.textSub,
  },

  scrollArea: {
    maxHeight: 280,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.borderSoft,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: C.surface,
  },
  footerPrimaryBtn: {
    flex: undefined,
    width: "100%",
  },

  list: {},
  listContent: { paddingBottom: 4 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.borderSoft,
  },
  listItemText: { fontSize: 15, color: C.text, fontWeight: "400", flex: 1 },
  listItemTextActive: { fontWeight: "600" },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
  },
  loadingText: { color: C.textSub, fontWeight: "400", fontSize: 14 },

  bottomRow: { marginTop: 14 },
  twoBtnRow: { flexDirection: "row", gap: 8, marginTop: 14 },

  qSkipRow: { alignItems: "flex-end", marginBottom: 4 },
  qSkipText: { color: C.textSub, fontWeight: "500", fontSize: 13 },

  primaryBtn: {
    flex: 1,
    backgroundColor: C.primary,
    paddingVertical: 11,
    borderRadius: C.radius.pill,
    alignItems: "center",
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: C.primaryText, fontWeight: "600", fontSize: 14 },

  secondaryBtn: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    backgroundColor: C.bg,
    paddingVertical: 11,
    borderRadius: C.radius.pill,
    alignItems: "center",
  },
  secondaryBtnText: { color: C.text, fontWeight: "500", fontSize: 14 },

  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: C.radius.pill,
    backgroundColor: C.bgChip,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.borderSoft,
  },
  presetChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  presetChipText: { fontSize: 13, fontWeight: "500", color: C.text },
  presetChipTextActive: { color: C.primaryText },

  customRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    borderRadius: C.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: C.bgMuted,
    fontSize: 14,
    color: C.text,
    fontWeight: "400",
  },

  noOptionsWrap: { alignItems: "center", paddingVertical: 20, gap: 6 },
  noOptionsTitle: { fontSize: 14, fontWeight: "600", color: C.text },
  noOptionsSub: { fontSize: 13, fontWeight: "400", color: C.textSub },
});

