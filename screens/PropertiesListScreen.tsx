import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { usePropertiesInfiniteQuery } from "../hooks/queries/usePropertiesInfiniteQuery";
import { Property } from "../types/property";
import { ZillowStylePropertyCard } from "../components/ZillowStylePropertyCard";

export default function PropertiesListScreen() {
  const query = usePropertiesInfiniteQuery(20);
  const navigation = useNavigation<any>();

  const items = useMemo(() => {
    const pages = query.data?.pages ?? [];
    return pages
      .flatMap((p) => p.data)
      .filter((p: any) => p?.isActive !== false);
  }, [query.data]);

  const isInitialEmpty = items.length === 0;
  const isRefreshing = query.isFetching && !query.isFetchingNextPage;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Properties</Text>
        {isRefreshing ? <ActivityIndicator size="small" /> : null}
      </View>

      {query.isError && !isInitialEmpty ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Offline / slow network — showing saved results.
          </Text>
        </View>
      ) : null}

      {query.isError && isInitialEmpty ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Can’t load properties</Text>
          <Text style={styles.errorBody}>
            Check your connection. If you’ve opened this screen before, cached
            results will show instantly next time.
          </Text>
          <Pressable style={styles.retryBtn} onPress={() => query.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.ID)}
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              query.fetchNextPage();
            }
          }}
          ListEmptyComponent={
            query.isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>Loading…</Text>
              </View>
            ) : (
              <View style={styles.loadingBox}>
                <Text style={styles.loadingText}>No results</Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <Row
              item={item}
              onPress={(id) => {
                navigation.navigate("PropertyDetails", { propertyID: id });
              }}
            />
          )}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function Row({
  item,
  onPress,
}: {
  item: Property;
  onPress: (id: number) => void;
}) {
  const propertyData: any = {
    id: (item as any).ID ?? (item as any).id,
    title: item.title ?? "Untitled",
    description: (item as any).description,
    listing_price: (item as any).nightlyPrice ?? (item as any).listing_price,
    price: (item as any).nightlyPrice ?? (item as any).price,
    currency: (item as any).currency ?? "MRU",
    images: (item as any).images ?? [],
    bedrooms: item.bedrooms,
    bathrooms: item.bathrooms,
    square_footage: undefined,
    area: undefined,
    address: (item as any).addressLine1 ?? (item as any).address,
    city: item.city,
    state: item.state,
    country: item.country,
    property_type: (item as any).propertyType ?? (item as any).property_type,
    status: (item as any).status,
    owner: undefined,
    organization: undefined,
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <ZillowStylePropertyCard
        property={propertyData}
        onPress={(id) => onPress(id)}
        isFavorite={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  listContent: { padding: 16, paddingBottom: 24 },
  // (Old row layout removed; we now render `ZillowStylePropertyCard`.)
  loadingBox: { padding: 24, alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 13, color: "#6B7280" },
  footer: { paddingVertical: 16, alignItems: "center" },
  errorBox: { padding: 16 },
  errorTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  errorBody: { marginTop: 6, fontSize: 13, color: "#6B7280" },
  retryBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#111827"
  },
  retryText: { color: "#FFFFFF", fontWeight: "700" },
  banner: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F3F4F6"
  },
  bannerText: { fontSize: 12, color: "#374151", fontWeight: "600" }
});

