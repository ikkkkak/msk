import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  RefreshControl,
  ActivityIndicator
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "../hooks/useUser";
import { endpoints } from "../constants";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";

export const HostReservationsScreen = () => {
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "confirmed" | "pending" | "cancelled"
  >("pending");
  const { user } = useUser();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Mark all pending property reservations as viewed when screen opens
  useEffect(() => {
    if (propertyReservations.length > 0) {
      const unviewedReservations = propertyReservations.filter(
        (reservation: any) =>
          reservation.status === "pending" && !reservation.hostViewed
      );

      // Mark each unviewed reservation as viewed
      unviewedReservations.forEach(async (reservation: any) => {
        try {
          await api.patch(`/apartment/${reservation.ID}/mark-viewed`);
        } catch (error) {
          console.error("Failed to mark reservation as viewed:", error);
        }
      });

      // Invalidate the query to refresh the badge count
      if (unviewedReservations.length > 0) {
        queryClient.invalidateQueries({ queryKey: "host-reservations" });
      }
    }
  }, [propertyReservations, queryClient]);

  // Fetch property reservations
  const {
    data: propertyReservations = [],
    isLoading: loadingProperties,
    refetch: refetchProperties
  } = useQuery({
    queryKey: ["hostPropertyReservations"],
    queryFn: async () => {
      if (!user?.accessToken) return [];

      const response = await fetch(
        `${endpoints.baseURL}/apartment/host/reservations`,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch property reservations");
      }
      const data = await response.json();
      // Normalize to array
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.reservations)) return data.reservations;
      if (Array.isArray(data?.items)) return data.items;
      return [];
    },
    enabled: !!user?.accessToken,
    refetchOnWindowFocus: true
  });

  // Fetch experience reservations
  const {
    data: experienceReservations = [],
    isLoading: loadingExperiences,
    refetch: refetchExperiences
  } = useQuery({
    queryKey: ["hostExperienceReservations"],
    queryFn: async () => {
      if (!user?.accessToken) return [];

      const response = await fetch(
        `${endpoints.baseURL}/experience/host-bookings`,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch experience reservations");
      }
      const data = await response.json();
      // Normalize to array
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.bookings)) return data.bookings;
      if (Array.isArray(data?.items)) return data.items;
      return [];
    },
    enabled: !!user?.accessToken,
    refetchOnWindowFocus: true
  });

  const currentReservations = Array.isArray(propertyReservations)
    ? propertyReservations
    : Array.isArray((propertyReservations as any)?.data)
    ? (propertyReservations as any).data
    : Array.isArray((propertyReservations as any)?.reservations)
    ? (propertyReservations as any).reservations
    : Array.isArray((propertyReservations as any)?.items)
    ? (propertyReservations as any).items
    : [];
  const isLoading = loadingProperties;

  const filters = [
    {
      key: "all",
      label: t("reservations.filters.all"),
      count: currentReservations.length
    },
    {
      key: "confirmed",
      label: t("reservations.filters.confirmed"),
      count: currentReservations.filter(
        (r: any) => r.status === "confirmed" || r.status === "confirmé"
      ).length
    },
    {
      key: "pending",
      label: t("reservations.filters.pending"),
      count: currentReservations.filter(
        (r: any) => r.status === "pending" || r.status === "en attente"
      ).length
    },
    {
      key: "cancelled",
      label: t("reservations.filters.cancelled"),
      count: currentReservations.filter(
        (r: any) => r.status === "cancelled" || r.status === "annulé"
      ).length
    }
  ];

  const handleRefresh = () => {
    refetchProperties();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
      case "confirmé":
        return "#1F8A70";
      case "pending":
      case "en attente":
        return "#FF8C00";
      case "cancelled":
      case "annulé":
        return "#FF5A5F";
      default:
        return "#717171";
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "Confirmé";
      case "pending":
        return "En attente";
      case "cancelled":
        return "Annulé";
      default:
        return status;
    }
  };

  const getFilteredReservations = () => {
    if (selectedFilter === "all") return currentReservations;
    return currentReservations.filter((reservation: any) => {
      const status = reservation.status?.toLowerCase();
      switch (selectedFilter) {
        case "confirmed":
          return status === "confirmed" || status === "confirmé";
        case "pending":
          return status === "pending" || status === "en attente";
        case "cancelled":
          return status === "cancelled" || status === "annulé";
        default:
          return true;
      }
    });
  };

  const filteredReservations = getFilteredReservations();

  return (
    <View style={styles.container}>
      <View
        style={{
          marginTop: "15%"
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t("reservations.title")}</Text>
            <Text style={styles.headerSubtitle}>
              {t("reservations.manageProperties")}
            </Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <MaterialIcons name="search" size={20} color="#222222" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#FF385C"
          />
        }
      >
        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterTab,
                  selectedFilter === filter.key && styles.filterTabActive
                ]}
                onPress={() => setSelectedFilter(filter.key as any)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === filter.key && styles.filterTabTextActive
                  ]}
                >
                  {filter.label}
                </Text>
                <View
                  style={[
                    styles.filterBadge,
                    selectedFilter === filter.key && styles.filterBadgeActive
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBadgeText,
                      selectedFilter === filter.key &&
                        styles.filterBadgeTextActive
                    ]}
                  >
                    {filter.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF385C" />
            <Text style={styles.loadingText}>{t("reservations.loading")}</Text>
          </View>
        )}

        {/* Reservations List */}
        {!isLoading && (
          <View style={styles.section}>
            {filteredReservations.map((reservation: any) => {
              const isNewReservation =
                reservation.status === "pending" && !reservation.hostViewed;

              return (
                <TouchableOpacity
                  key={reservation.ID || reservation.id}
                  style={[
                    styles.reservationCard,
                    isNewReservation && styles.newReservationCard
                  ]}
                  activeOpacity={0.85}
                  onPress={() => {
                    (navigation as any).navigate("HostReservationDetails", {
                      reservation
                    });
                  }}
                >
                  <View style={styles.reservationImageContainer}>
                    <Image
                      source={{
                        uri:
                          reservation.property?.images?.[0] ||
                          reservation.property?.imageURL ||
                          "https://via.placeholder.com/80x80"
                      }}
                      style={styles.reservationImage}
                    />
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(reservation.status) }
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {getStatusText(reservation.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.reservationContent}>
                    <Text style={styles.propertyName}>
                      {reservation.property?.title ||
                        reservation.property?.name ||
                        "Property"}
                    </Text>

                    <View style={styles.guestInfo}>
                      <Image
                        source={{
                          uri:
                            reservation.guest?.avatarURL ||
                            reservation.guest?.avatar ||
                            "https://via.placeholder.com/32x32"
                        }}
                        style={styles.guestAvatar}
                      />
                      <View style={styles.guestDetails}>
                        <Text style={styles.guestName}>
                          {reservation.guest?.firstName &&
                          reservation.guest?.lastName
                            ? `${reservation.guest.firstName} ${reservation.guest.lastName}`
                            : reservation.guest?.name || "Invité"}
                        </Text>
                        <Text style={styles.bookingDate}>
                          Réservé le{" "}
                          {new Date(
                            reservation.CreatedAt || reservation.createdAt
                          ).toLocaleDateString("fr-FR")}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.reservationDetails}>
                      <View style={styles.detailRow}>
                        <MaterialIcons
                          name="date-range"
                          size={16}
                          color="#717171"
                        />
                        <Text style={styles.detailText}>
                          {`${new Date(
                            reservation.checkIn || reservation.startDate
                          ).toLocaleDateString("fr-FR")} - ${new Date(
                            reservation.checkOut || reservation.endDate
                          ).toLocaleDateString("fr-FR")} • ${
                            reservation.nights ||
                            Math.ceil(
                              (new Date(
                                reservation.checkOut || reservation.endDate
                              ).getTime() -
                                new Date(
                                  reservation.checkIn || reservation.startDate
                                ).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          } nuit${(reservation.nights || 1) > 1 ? "s" : ""}`}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialIcons name="group" size={16} color="#717171" />
                        <Text style={styles.detailText}>
                          {`${
                            reservation.numGuests || reservation.guests || 1
                          } voyageur${
                            (reservation.numGuests || reservation.guests || 1) >
                            1
                              ? "s"
                              : ""
                          }`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.reservationFooter}>
                      <Text style={styles.reservationAmount}>
                        {reservation.totalPrice ||
                          reservation.price ||
                          reservation.amount}{" "}
                        MRU
                      </Text>
                    </View>
                  </View>

                  {/* NEW indicator for unviewed reservations */}
                  {isNewReservation && (
                    <View style={styles.newIndicator}>
                      <Text style={styles.newIndicatorText}>جديد</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {!isLoading && filteredReservations.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="inbox" size={48} color="#E5E5E5" />
            <Text style={styles.emptyStateTitle}>
              {t("reservations.emptyTitle")}
            </Text>
            <Text style={styles.emptyStateText}>
              {selectedFilter === "all"
                ? t("reservations.emptyAllProperties")
                : t("reservations.emptyFiltered", {
                    label: filters
                      .find((f) => f.key === selectedFilter)
                      ?.label.toLowerCase()
                  })}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5"
  },
  headerContent: {
    flex: 1
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 2,
    letterSpacing: -0.5
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#717171",
    fontWeight: "500"
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center"
  },
  tabContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5"
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 8
  },
  mainTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: "#F7F7F7"
  },
  mainTabActive: {
    backgroundColor: "#222222"
  },
  mainTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#717171",
    marginLeft: 8
  },
  mainTabTextActive: {
    color: "#FFFFFF"
  },
  filterContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: "#F7F7F7"
  },
  filterTabActive: {
    backgroundColor: "#222222"
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#717171",
    marginRight: 8
  },
  filterTabTextActive: {
    color: "#FFFFFF"
  },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E5E5E5",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6
  },
  filterBadgeActive: {
    backgroundColor: "#FFFFFF"
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#717171"
  },
  filterBadgeTextActive: {
    color: "#222222"
  },
  section: {
    padding: 24
  },
  reservationCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
    position: "relative"
  },
  newReservationCard: {
    borderWidth: 2,
    borderColor: "#FF385C",
    backgroundColor: "#FFF5F5"
  },
  reservationImageContainer: {
    position: "relative"
  },
  reservationImage: {
    width: 80,
    height: 80,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF"
  },
  reservationContent: {
    flex: 1,
    padding: 16
  },
  propertyName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 12,
    letterSpacing: -0.3
  },
  guestInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  guestAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12
  },
  guestDetails: {
    flex: 1
  },
  guestName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 2
  },
  bookingDate: {
    fontSize: 12,
    color: "#717171",
    fontWeight: "500"
  },
  reservationDetails: {
    marginBottom: 12
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4
  },
  detailText: {
    fontSize: 13,
    color: "#717171",
    marginLeft: 6,
    fontWeight: "500"
  },
  reservationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  reservationAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222"
  },
  reservationActions: {
    flexDirection: "row",
    gap: 8
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center"
  },
  acceptButton: {
    backgroundColor: "#1F8A70"
  },
  declineButton: {
    backgroundColor: "#FFE5E5"
  },
  primaryAction: {
    backgroundColor: "#222222"
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#222222",
    marginLeft: 4
  },
  acceptButtonText: {
    color: "#FFFFFF"
  },
  declineButtonText: {
    color: "#FF5A5F"
  },
  primaryActionText: {
    color: "#FFFFFF"
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#717171",
    marginTop: 16,
    marginBottom: 8
  },
  emptyStateText: {
    fontSize: 14,
    color: "#717171",
    textAlign: "center",
    lineHeight: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60
  },
  loadingText: {
    fontSize: 16,
    color: "#717171",
    marginTop: 16,
    fontWeight: "500"
  },
  newIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FF385C",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1
  },
  newIndicatorText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF"
  }
});
