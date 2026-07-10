/**
 * PropertyCardWithQuery.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Property card backed by TanStack Query. Deterministic, robust fetch pipeline.
 *
 * • Query key: ['property', propertyId]
 * • Skeleton while loading; cached poster while retrying
 * • Explicit error UI - never silent empty state
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import {
  ZillowStylePropertyCard,
  type PropertyData,
} from "./ZillowStylePropertyCard";
import { ZillowStylePropertyCardSkeleton } from "./ZillowStylePropertyCard";
import { usePropertyCardQuery } from "../hooks/queries/usePropertyCardQuery";

/** If the list payload already has enough for the card UI, skip N+1 GET /public/:id (critical on 3G). */
function listItemEnoughForCard(p: PropertyData | undefined): boolean {
  if (!p || !(Number((p as any).id) > 0)) return false;
  const title = String(p.title ?? "").trim();
  if (title.length < 1) return false;
  const imgs = Array.isArray(p.images) ? p.images : [];
  const vids = (p as any).videos;
  const hasVideo =
    !!(p as any).video_url ||
    !!(p as any).videoUrl ||
    !!(p as any).video ||
    (Array.isArray(vids) && vids.length > 0);
  return imgs.length > 0 || hasVideo;
}

export interface PropertyCardWithQueryProps {
  propertyId: number;
  /** From list response - hydrate cache for instant render */
  initialProperty?: PropertyData;
  onPress: (id: number, initialImageIndex?: number) => void;
  onCall?: (phone?: string) => void;
  onEmail?: (email?: string) => void;
  onWhatsApp?: (phone?: string) => void;
  onFavorite?: (id: number) => void;
  isFavorite?: boolean;
}

export const PropertyCardWithQuery: React.FC<PropertyCardWithQueryProps> =
  React.memo(
    ({
      propertyId,
      initialProperty,
      onPress,
      onCall,
      onEmail,
      onWhatsApp,
      onFavorite,
      isFavorite,
    }) => {
      const skipDetailFetch = listItemEnoughForCard(initialProperty);

      const {
        data: property,
        isLoading,
        isError,
        error,
        isFetching,
        refetch,
      } = usePropertyCardQuery(propertyId, {
        enabled: !!propertyId && propertyId > 0 && !skipDetailFetch,
        initialData: skipDetailFetch ? undefined : (initialProperty as any),
      });

      const displayProperty = skipDetailFetch
        ? initialProperty
        : ((property as PropertyData | undefined) ?? initialProperty);
      const showSkeleton =
        !displayProperty &&
        !skipDetailFetch &&
        (isLoading || (isFetching && !property));

      if (showSkeleton) {
        return (
          <View style={styles.container}>
            <ZillowStylePropertyCardSkeleton delay={0} />
          </View>
        );
      }

      if (isError && !displayProperty) {
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {error?.message ?? "Failed to load property"}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => refetch()}
              activeOpacity={0.8}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        );
      }

      if (!displayProperty) {
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No data</Text>
          </View>
        );
      }

      return (
        <View style={styles.container}>
          <ZillowStylePropertyCard
            property={displayProperty as unknown as PropertyData}
            onPress={onPress}
            onCall={onCall}
            onEmail={onEmail}
            onWhatsApp={onWhatsApp}
            onFavorite={onFavorite}
            isFavorite={isFavorite}
            listingKind="sale"
          />
        </View>
      );
    },
  );

const styles = StyleSheet.create({
  container: { marginVertical: 0 },
  errorContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 24,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    fontSize: 14,
    color: "#991B1B",
    marginBottom: 12,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
