/**
 * Hoisted cadastre filter BottomSheetModal — always mounted on SearchScreen.
 * Main step uses ScrollView (not empty FlatList) so the sheet works with no filters applied.
 */
import React, { memo, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { CaretRight, CaretLeft, X } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { HabitatPlan, HabitatSector } from "../../types/habitat";
import {
  useCadastreFilterSheet,
  type CadastreFilterSheetRef,
  type CadastreFilterSheetParams,
  type UnifiedRow,
} from "../../hooks/useCadastreFilterSheet";
import { displayPlotNumber, trimLabel } from "./cadastreFilterUtils";

const ROW_H = 56;

type Props = CadastreFilterSheetParams;

const PlanRow = memo(function PlanRow({
  item,
  selected,
  onPress,
}: {
  item: HabitatPlan;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.listRow, selected && styles.listRowSelected]}
      onPress={onPress}
    >
      <Text style={styles.listRowTitle} numberOfLines={1}>
        {item.name_ar || item.name}
      </Text>
      <Text style={styles.listRowSub} numberOfLines={1}>
        {item.code} · {item.name}
      </Text>
    </Pressable>
  );
});

const SectorRow = memo(function SectorRow({
  item,
  selected,
  onPress,
}: {
  item: HabitatSector;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.listRow, selected && styles.listRowSelected]}
      onPress={onPress}
    >
      <Text style={styles.listRowTitle} numberOfLines={1}>
        {item.name_ar || item.name}
      </Text>
      {item.code ? (
        <Text style={styles.listRowSub} numberOfLines={1}>
          {item.code}
        </Text>
      ) : null}
    </Pressable>
  );
});

const SearchResultRow = memo(function SearchResultRow({
  row,
  onPress,
}: {
  row: UnifiedRow;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  if (row.kind === "plan") {
    const p = row.plan;
    return (
      <Pressable style={styles.listRow} onPress={onPress}>
        <Text style={styles.badge}>{t("habitatCadastre.badgeZone")}</Text>
        <Text style={styles.listRowTitle} numberOfLines={1}>
          {p.name_ar || p.name}
        </Text>
        <Text style={styles.listRowSub} numberOfLines={1}>
          {p.code}
        </Text>
      </Pressable>
    );
  }
  if (row.kind === "sector") {
    const s = row.sector;
    return (
      <Pressable style={styles.listRow} onPress={onPress}>
        <Text style={styles.badge}>{t("habitatCadastre.badgeQuartier")}</Text>
        <Text style={styles.listRowTitle} numberOfLines={1}>
          {s.name_ar || s.name}
        </Text>
        <Text style={styles.listRowSub} numberOfLines={1}>
          {row.plan?.code || row.plan?.name_ar || ""}
        </Text>
      </Pressable>
    );
  }
  const plot = row.plot;
  const isForSale = plot.is_for_sale === true;
  return (
    <Pressable style={styles.listRow} onPress={onPress}>
      <View style={styles.badgeRow}>
        <Text style={styles.badge}>{t("habitatCadastre.badgePlot")}</Text>
        {isForSale ? (
          <Text style={styles.saleBadge}>
            {t("habitatCadastre.badgeForSale", "For sale")}
          </Text>
        ) : null}
      </View>
      <Text style={styles.listRowTitle} numberOfLines={1}>
        {displayPlotNumber(plot.plot_number)}
      </Text>
      <Text style={styles.listRowSub} numberOfLines={1}>
        {[plot.plan?.code, plot.sector?.name_ar || plot.sector?.name]
          .filter(Boolean)
          .join(" · ")}
      </Text>
    </Pressable>
  );
});

function CadastreFilterSheetInner(props: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const listPad = insets.bottom + 16;

  const s = useCadastreFilterSheet(props);

  const sheetTitle = useMemo(() => {
    if (s.step === "zones") return t("habitatCadastre.pickZoneTitle");
    if (s.step === "quartiers") return t("habitatCadastre.pickQuartierTitle");
    return t("habitatCadastre.sheetTitle");
  }, [s.step, t]);

  const backdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    [],
  );

  const {
    step,
    draftPlanId,
    draftSectorId,
    setListSearch,
    applySelection,
    pickZone,
    onSearchRowPress,
  } = s;

  const renderSheetRow = useCallback(
    ({ item }: { item: HabitatPlan | HabitatSector | UnifiedRow }) => {
      if (step === "zones") {
        const plan = item as HabitatPlan;
        return (
          <PlanRow
            item={plan}
            selected={draftPlanId === plan.id}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              pickZone(plan.id);
            }}
          />
        );
      }
      if (step === "quartiers") {
        const sector = item as HabitatSector;
        return (
          <SectorRow
            item={sector}
            selected={draftSectorId === sector.id}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              if (draftPlanId == null) return;
              void applySelection(draftPlanId, sector.id);
            }}
          />
        );
      }
      return (
        <SearchResultRow
          row={item as UnifiedRow}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            void onSearchRowPress(item as UnifiedRow);
          }}
        />
      );
    },
    [step, draftPlanId, draftSectorId, applySelection, pickZone, onSearchRowPress],
  );

  const sheetKeyExtractor = useCallback(
    (item: HabitatPlan | HabitatSector | UnifiedRow, index: number) => {
      if (s.step === "zones") return `z-${(item as HabitatPlan).id}`;
      if (s.step === "quartiers") return `q-${(item as HabitatSector).id}`;
      const row = item as UnifiedRow;
      if (row.kind === "plan") return `p-${row.plan.id}`;
      if (row.kind === "sector") return `s-${row.sector.id}`;
      return `pl-${row.plot.id}-${index}`;
    },
    [s.step],
  );

  const headerBlock = (
    <View style={styles.listHeaderPad}>
      <View style={styles.sheetHeader}>
        <View style={styles.sheetHeaderTop}>
          {s.step !== "main" ? (
            <Pressable
              onPress={s.goBackToMain}
              hitSlop={10}
              style={styles.backBtn}
            >
              <CaretLeft size={20} color="#222222" weight="bold" />
            </Pressable>
          ) : (
            <View style={styles.backBtnPlaceholder} />
          )}
          <Text style={styles.sheetTitleText} numberOfLines={2}>
            {sheetTitle}
          </Text>
          <Pressable onPress={s.closeSheet} hitSlop={12} style={styles.closeBtn}>
            <X size={20} color="#717171" weight="bold" />
          </Pressable>
        </View>
        {s.step === "quartiers" && s.selectedPlan ? (
          <Text style={styles.sheetSubtitle} numberOfLines={1}>
            {s.selectedPlan.name_ar || s.selectedPlan.name}
          </Text>
        ) : null}
      </View>

      {s.step === "main" ? (
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color="#717171" />
          <BottomSheetTextInput
            style={styles.searchInput}
            placeholder={t("habitatCadastre.searchPlaceholder")}
            placeholderTextColor="#B0B0B0"
            value={s.query}
            onChangeText={s.setQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {s.query.length > 0 ? (
            <Pressable onPress={() => s.setQuery("")} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color="#B0B0B0" />
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color="#717171" />
          <BottomSheetTextInput
            style={styles.searchInput}
            placeholder={
              s.step === "zones"
                ? t("habitatCadastre.searchZonePlaceholder")
                : t("habitatCadastre.searchQuartierPlaceholder")
            }
            placeholderTextColor="#B0B0B0"
            value={s.listSearch}
            onChangeText={s.setListSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
        </View>
      )}

      {s.step === "main" && s.isSearchMode ? (
        s.searchQuery.isFetching ? (
          <ActivityIndicator style={styles.searchSpinner} color="#222222" />
        ) : (
          <Text style={styles.searchMeta}>
            {s.searchRows.length > 0
              ? t("habitatCadastre.resultsCount", { count: s.searchRows.length })
              : t("habitatCadastre.noResults")}
          </Text>
        )
      ) : null}

      {s.step === "main" && !s.isSearchMode ? (
        <>
          <Text style={styles.sectionLabel}>
            {t("habitatCadastre.sectionLocation")}
          </Text>
          <View style={styles.optionGroup}>
            <Pressable
              style={styles.optionRow}
              onPress={() => {
                s.setListSearch("");
                s.setStep("zones");
              }}
            >
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionLabel}>
                  {t("habitatCadastre.zoneLabel")}
                </Text>
                <Text style={styles.optionValue} numberOfLines={1}>
                  {s.selectedPlan
                    ? s.selectedPlan.code ||
                      trimLabel(
                        s.selectedPlan.name_ar || s.selectedPlan.name,
                        22,
                      )
                    : t("habitatCadastre.anyZone")}
                </Text>
              </View>
              <CaretRight size={16} color="#717171" weight="bold" />
            </Pressable>
            <View style={styles.optionDivider} />
            <Pressable
              style={[
                styles.optionRow,
                s.draftPlanId == null && styles.optionRowDisabled,
              ]}
              disabled={s.draftPlanId == null}
              onPress={() => {
                s.setListSearch("");
                s.setStep("quartiers");
              }}
            >
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionLabel}>
                  {t("habitatCadastre.quartierLabel")}
                </Text>
                <Text style={styles.optionValue} numberOfLines={1}>
                  {s.draftPlanId == null
                    ? t("habitatCadastre.pickZoneFirst")
                    : s.selectedSector
                      ? s.selectedSector.code ||
                        trimLabel(
                          s.selectedSector.name_ar ||
                            s.selectedSector.name ||
                            "",
                          22,
                        )
                      : t("habitatCadastre.anyQuartier")}
                </Text>
              </View>
              <CaretRight size={16} color="#717171" weight="bold" />
            </Pressable>
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>
            {t("habitatCadastre.plotNumberLabel", "Plot number")}
          </Text>
          <View style={styles.plotSearchRow}>
            <BottomSheetTextInput
              style={styles.plotSearchInput}
              placeholder={t(
                "habitatCadastre.plotNumberPlaceholder",
                "Type a plot number (within this area)…",
              )}
              placeholderTextColor="#B0B0B0"
              value={s.sectorPlotNumber}
              onChangeText={s.setSectorPlotNumber}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              keyboardType="default"
            />
            <Pressable
              style={[
                styles.plotSearchBtn,
                (s.draftSectorId == null || s.sectorPlotSearching) &&
                  styles.plotSearchBtnDisabled,
              ]}
              disabled={s.draftSectorId == null || s.sectorPlotSearching}
              onPress={() => void s.searchPlotInSelectedSector()}
            >
              {s.sectorPlotSearching ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.plotSearchBtnText}>
                  {t("habitatCadastre.plotNumberSearch", "Search plot")}
                </Text>
              )}
            </Pressable>
          </View>

          {s.draftSectorId == null ? (
            <Text style={styles.plotSearchHint}>
              {t(
                "habitatCadastre.plotNumberHintSelectArea",
                "Select an area first to search by plot number.",
              )}
            </Text>
          ) : s.sectorPlotError === "not_found" ? (
            <Text style={styles.plotSearchHint}>
              {t(
                "habitatCadastre.plotNumberNotFound",
                "No plot with this number in this area.",
              )}
            </Text>
          ) : null}

          <Pressable
            style={[
              styles.applyBtn,
              (!s.canApply || s.cadastre.loadingPlots) && styles.applyBtnDisabled,
            ]}
            disabled={!s.canApply || s.cadastre.loadingPlots}
            onPress={s.handleApplyMain}
          >
            {s.cadastre.loadingPlots ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.applyBtnText}>
                {s.draftSectorId != null
                  ? t("habitatCadastre.applyQuartier")
                  : t("habitatCadastre.applyZone")}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={s.handleClear} style={styles.clearLinkWrap}>
            <Text style={styles.clearLink}>
              {t("habitatCadastre.clearAll")}
            </Text>
          </Pressable>
        </>
      ) : null}

      {s.step === "zones" ? (
        <Text style={styles.searchMeta}>
          {t("habitatCadastre.zoneCount", { count: s.zoneListData.length })}
        </Text>
      ) : null}

      {s.step === "quartiers" ? (
        s.sectorsLoading ? (
          <ActivityIndicator style={styles.searchSpinner} color="#222222" />
        ) : (
          <Text style={styles.searchMeta}>
            {t("habitatCadastre.quartierCount", {
              count: s.quartierListData.length,
            })}
          </Text>
        )
      ) : null}
    </View>
  );

  const sheetEmpty =
    s.step === "main" && s.isSearchMode && !s.searchQuery.isFetching ? (
      <Text style={styles.emptyHint}>
        {t("habitatCadastre.emptySearchHint")}
      </Text>
    ) : s.step === "quartiers" && !s.sectorsLoading ? (
      <Text style={styles.emptyHint}>{t("habitatCadastre.pickerEmpty")}</Text>
    ) : null;

  return (
    <BottomSheetModal
      ref={s.sheetRef}
      name="habitatCadastreFilter"
      index={0}
      snapPoints={s.snapPoints}
      enablePanDownToClose
      enableDismissOnClose
      onDismiss={s.handleSheetDismiss}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={backdrop}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.sheetBg}
    >
      {s.useFlatList ? (
        <BottomSheetFlatList
          data={s.sheetListData}
          keyExtractor={sheetKeyExtractor}
          renderItem={renderSheetRow}
          ListHeaderComponent={headerBlock}
          ListEmptyComponent={sheetEmpty}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
          contentContainerStyle={{ paddingBottom: listPad }}
        />
      ) : (
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: listPad }}
        >
          {headerBlock}
        </BottomSheetScrollView>
      )}
    </BottomSheetModal>
  );
}

export type CadastreFilterSheetProps = CadastreFilterSheetParams & {
  sheetRef?: React.Ref<CadastreFilterSheetRef | null>;
};

/** Single hoisted filter sheet — mount once on SearchScreen. */
export function CadastreFilterSheet({
  sheetRef,
  ...rest
}: CadastreFilterSheetProps) {
  return <CadastreFilterSheetInner {...rest} imperativeRef={sheetRef} />;
}

export type { CadastreFilterSheetRef };

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handle: {
    backgroundColor: "#DDDDDD",
    width: 36,
    height: 4,
  },
  listHeaderPad: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  sheetHeader: {
    marginBottom: 12,
  },
  sheetHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnPlaceholder: {
    width: 36,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitleText: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: "#717171",
    marginTop: 6,
    marginLeft: 44,
    fontWeight: "500",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 11 : 10,
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#222222",
    padding: 0,
    minHeight: 22,
  },
  searchMeta: {
    fontSize: 12,
    color: "#717171",
    marginBottom: 8,
    fontWeight: "500",
  },
  searchSpinner: {
    marginVertical: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#717171",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  optionGroup: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#EBEBEB",
    overflow: "hidden",
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: ROW_H,
  },
  optionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#EBEBEB",
    marginLeft: 16,
  },
  optionRowDisabled: {
    opacity: 0.45,
  },
  optionTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  optionLabel: {
    fontSize: 11,
    color: "#717171",
    marginBottom: 2,
    fontWeight: "500",
  },
  optionValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222222",
  },
  applyBtn: {
    backgroundColor: "#222222",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  applyBtnDisabled: {
    opacity: 0.4,
  },
  applyBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  clearLinkWrap: {
    alignItems: "center",
    paddingVertical: 8,
  },
  clearLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#717171",
    textDecorationLine: "underline",
  },
  plotSearchRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 6,
  },
  plotSearchInput: {
    flex: 1,
    fontSize: 15,
    color: "#222222",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    minHeight: 44,
  },
  plotSearchBtn: {
    backgroundColor: "#222222",
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 98,
  },
  plotSearchBtnDisabled: {
    opacity: 0.45,
  },
  plotSearchBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  plotSearchHint: {
    fontSize: 12,
    color: "#717171",
    marginBottom: 10,
    fontWeight: "500",
  },
  listRow: {
    height: ROW_H,
    justifyContent: "center",
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F0",
  },
  listRowSelected: {
    backgroundColor: "#F7F7F7",
  },
  listRowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222222",
  },
  listRowSub: {
    fontSize: 12,
    color: "#717171",
    marginTop: 2,
  },
  badge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#717171",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  saleBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DC2626",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  emptyHint: {
    textAlign: "center",
    color: "#717171",
    marginTop: 16,
    marginHorizontal: 20,
    fontSize: 14,
    lineHeight: 20,
  },
});
