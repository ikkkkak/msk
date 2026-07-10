import React, { useMemo, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity
} from "react-native";
import { Text } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import { ZillowStylePropertyCard } from "../../components/ZillowStylePropertyCard";

interface PropertySaleItem {
  id: number;
  title?: string;
  images?: string[];
  [key: string]: any;
}

interface Props {
  items?: PropertySaleItem[] | { items: PropertySaleItem[] };
  onPress?: (id: number) => void;
  onCall?: (phone?: string) => void;
  onEmail?: (website?: string) => void;
  onFavorite?: (id: number) => void;
  favorites?: number[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  /** When false, render mapped items instead of FlatList (useful when inside another ScrollView) */
  useFlatList?: boolean;
}

/**
 * Professional, minimal PropertySaleList replacement
 * - Uses FlatList for performance
 * - Clear loading / error / empty states
 * - Renders `ZillowStylePropertyCard` for each item
 */
export default function PropertySaleList(props: Props) {
  const {
    items,
    onPress,
    onCall,
    onEmail,
    onFavorite,
    favorites = [],
    isLoading = false,
    error = null,
    emptyMessage,
    useFlatList = true
  } = props;

  const { t } = useTranslation();

  const data: PropertySaleItem[] = useMemo(() => {
    if (Array.isArray(items)) return items as PropertySaleItem[];
    if (
      items &&
      typeof items === "object" &&
      Array.isArray((items as any).items)
    ) {
      return (items as any).items as PropertySaleItem[];
    }
    return [];
  }, [items]);

  const ITEM_HEIGHT = 420; // estimated fixed height for getItemLayout

  const CardItem = useCallback(
    ({ item, index }: { item: PropertySaleItem; index: number }) => {
      const id = (item as any)?.id ?? (item as any)?.ID ?? index;
      return (
        <View style={styles.cardWrap}>
          <TouchableOpacity activeOpacity={0.98} onPress={() => onPress?.(id)}>
            <ZillowStylePropertyCard
              property={item as any}
              onPress={() => onPress?.(id)}
              onCall={onCall}
              onEmail={onEmail}
              onFavorite={onFavorite}
              isFavorite={favorites.includes(id)}
            />
          </TouchableOpacity>
        </View>
      );
    },
    [onPress, onCall, onEmail, onFavorite, favorites]
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#111827" />
        <Text style={styles.loadingText}>
          {t("propertySaleList.loading", "Loading properties...")}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          {t("propertySaleList.errorTitle", "Error")}
        </Text>
        <Text style={styles.errorMessage}>{String(error)}</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🏠</Text>
        <Text style={styles.emptyTitle}>
          {t("propertySaleList.emptyTitle", "No properties found")}
        </Text>
        <Text style={styles.emptyMessage}>
          {emptyMessage ||
            t("propertySaleList.emptyMessage", "Try broadening your filters.")}
        </Text>
      </View>
    );
  }

  // Use memoized CardItem via useCallback above to avoid re-creating render function
  // If the list is embedded inside another scrollable (e.g. BottomSheetScrollView), avoid nested FlatList
  if (!useFlatList) {
    return (
      <View style={styles.list}>
        {data.map((item, index) => {
          const id = (item as any)?.id ?? (item as any)?.ID ?? index;
          return (
            <View key={`${id}-${index}`} style={styles.cardWrap}>
              <TouchableOpacity
                activeOpacity={0.98}
                onPress={() => onPress?.(id)}
              >
                <ZillowStylePropertyCard
                  property={item as any}
                  onPress={() => onPress?.(id)}
                  onCall={onCall}
                  onEmail={onEmail}
                  onFavorite={onFavorite}
                  isFavorite={favorites.includes(id)}
                />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item, idx) =>
        `${(item as any)?.id ?? (item as any)?.ID ?? idx}`
      }
      renderItem={CardItem}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      initialNumToRender={4}
      maxToRenderPerBatch={6}
      windowSize={9}
      removeClippedSubviews={true}
      updateCellsBatchingPeriod={50}
      getItemLayout={(_data, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index
      })}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    width: "100%",
    padding: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  loadingText: { marginTop: 8, color: "#374151" },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#DC2626",
    marginBottom: 6
  },
  errorMessage: { color: "#6B7280", textAlign: "center" },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6
  },
  emptyMessage: { textAlign: "center", color: "#6B7280", maxWidth: 300 },
  list: { paddingVertical: 8, paddingHorizontal: 12 },
  cardWrap: { marginBottom: 12 }
});
