import React, { useState } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";
import { DemoComponent } from "../components/DemoComponent";
import {
  UsersThreeIcon,
  Calendar,
  MapPin,
  Users,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle
} from "phosphor-react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "../hooks/useUser";
import { endpoints } from "../constants";
import { CancellationModal } from "../components/CancellationModal";
import { useTranslation } from "react-i18next";

export const UserTripsScreen = () => {
  const { t } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState<
    "upcoming" | "past" | "cancelled"
  >("upcoming");
  const [cancellationModalVisible, setCancellationModalVisible] =
    useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const navigation = useNavigation();
  const { user } = useUser();
  const [showDemo, setShowDemo] = useState(false);
  const [demoKey, setDemoKey] = useState(0);
  const isFocused = useIsFocused();

  // Fetch user's reservations
  const {
    data: reservations,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["userReservations", user?.ID],
    queryFn: async () => {
      if (!user?.ID) return [];
      console.log("UserTripsScreen: Fetching reservations for user:", user.ID);
      console.log(
        "UserTripsScreen: API URL:",
        `${endpoints.baseURL}/reservations/user/${user.ID}`
      );
      const res = await fetch(
        `${endpoints.baseURL}/reservations/user/${user.ID}`,
        {
          headers: { Authorization: `Bearer ${user.accessToken}` }
        }
      );
      console.log("UserTripsScreen: API Response status:", res.status);
      if (!res.ok) throw new Error("Failed to fetch reservations");
      const data = await res.json();
      console.log("UserTripsScreen: API Response data:", data);
      return data;
    },
    enabled: !!user?.ID,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5000
  });

  // Demo steps for Trips screen (use existing i18n keys only)
  const demoSteps = [
    {
      title: t("trips.myTrips"),
      description: t("trips.manageReservations"),
      position: { x: 16, y: 70, width: 100, height: 56 }
    },
    {
      title: t("trips.upcoming"),
      description: t("trips.past"),
      position: { x: 20, y: 130, width: 115, height: 52 }
    },
    {
      title: t("trips.cancelled"),
      description: t("trips.exploreProperties"),
      position: { x: 250, y: 130, width: 115, height: 52 }
    }
  ];

  // Auto-show demo once per user (check AsyncStorage)
  React.useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    const checkDemoStatus = async () => {
      try {
        if (!isFocused) return;
        const hasSeenDemo = await AsyncStorage.getItem("hasSeenTripsDemo");
        if (!hasSeenDemo) {
          timer = setTimeout(() => {
            if (isFocused) {
              setDemoKey((k) => k + 1);
              setShowDemo(true);
            }
          }, 800);
        }
      } catch (error) {
        console.error("Error checking demo status:", error);
      }
    };
    if (isFocused) {
      checkDemoStatus();
    } else if (!isFocused && showDemo) {
      setShowDemo(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isFocused, showDemo]);

  // Filter reservations based on selected filter
  const filteredReservations =
    reservations?.filter((reservation: any) => {
      const now = new Date();
      const checkIn = new Date(reservation.checkIn);
      const checkOut = new Date(reservation.checkOut);

      console.log("UserTripsScreen: Filtering reservation:", {
        id: reservation.ID,
        status: reservation.status,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        selectedFilter,
        now: now.toISOString()
      });

      switch (selectedFilter) {
        case "upcoming":
          return (
            checkIn > now &&
            (reservation.status === "confirmed" ||
              reservation.status === "pending")
          );
        case "past":
          return (
            checkOut < now &&
            (reservation.status === "confirmed" ||
              reservation.status === "completed")
          );
        case "cancelled":
          return (
            reservation.status === "cancelled" ||
            reservation.status === "rejected" ||
            reservation.status === "expired"
          );
        default:
          return true;
      }
    }) || [];

  console.log(
    "UserTripsScreen: Filtered reservations count:",
    filteredReservations.length
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "#1F8A70";
      case "pending":
        return "#FF8C00";
      case "cancelled":
      case "rejected":
        return "#FF5A5F";
      case "expired":
        return "#717171";
      default:
        return "#717171";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Cancelled";
      case "rejected":
        return "Rejected";
      case "expired":
        return "Expired";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatCurrency = (amount: number, currency: string = "MRU") => {
    return currency === "MRU" ? `${amount} MRU` : `$${amount.toFixed(2)}`;
  };

  const handleTripPress = (reservation: any) => {
    // Navigate to trip details screen
    (navigation as any).navigate("TripDetails", { reservation });
  };

  const handleCancelPress = (reservation: any) => {
    setSelectedReservation(reservation);
    setCancellationModalVisible(true);
  };

  const canCancelReservation = (reservation: any) => {
    // Can only cancel pending reservations
    return (
      reservation.status === "pending" || reservation.status === "confirmed"
    );
  };

  return (
    <>
      <Screen style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{t("trips.myTrips")}</Text>
              <Text style={styles.headerSubtitle}>
                {t("trips.manageReservations")}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("GroupOnboarding", {
                  experienceId: 1,
                  capacityLeft: 10
                })
              }
              style={styles.searchButton}
            >
              <UsersThreeIcon size={20} color="#222222" weight="duotone" />
              <Text>{t("trips.createGroup")}</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                {
                  key: "upcoming",
                  label: t("trips.upcoming"),
                  count:
                    reservations?.filter((r: any) => {
                      const now = new Date();
                      return (
                        new Date(r.checkIn) > now &&
                        (r.status === "confirmed" || r.status === "pending")
                      );
                    }).length || 0
                },
                {
                  key: "past",
                  label: t("trips.past"),
                  count:
                    reservations?.filter((r: any) => {
                      const now = new Date();
                      return (
                        new Date(r.checkOut) < now &&
                        (r.status === "confirmed" || r.status === "completed")
                      );
                    }).length || 0
                },
                {
                  key: "cancelled",
                  label: t("trips.cancelled"),
                  count:
                    reservations?.filter(
                      (r: any) =>
                        r.status === "cancelled" ||
                        r.status === "rejected" ||
                        r.status === "expired"
                    ).length || 0
                }
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  onPress={() => setSelectedFilter(filter.key as any)}
                  style={[
                    styles.filterTab,
                    selectedFilter === filter.key && styles.filterTabActive
                  ]}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      selectedFilter === filter.key &&
                        styles.filterTabTextActive
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

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t("trips.loading")}</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyState}>
              <XCircle size={48} color="#FF5A5F" weight="duotone" />
              <Text style={styles.emptyStateTitle}>
                {t("trips.errorTitle")}
              </Text>
              <Text style={styles.emptyStateText}>
                {t("trips.errorSubtitle")}
              </Text>
            </View>
          ) : filteredReservations.length === 0 ? (
            <View style={styles.emptyState}>
              {selectedFilter === "upcoming" ? (
                <>
                  <Image
                    source={require("../assets/Calendar.jpg")}
                    style={{}}
                  />
                  {/* Feedback is now a dedicated screen */}
                  {/* <TouchableOpacity onPress={() => navigation.navigate("Welcome")}>
        <Text style={styles.welcomeButtonText}>{t('account.welcome')}</Text>
      </TouchableOpacity> */}
                  <Text style={styles.emptyStateTitle}>
                    {t("trips.noUpcomingTitle")}
                  </Text>
                  <Text style={styles.emptyStateText}>
                    {t("trips.noUpcomingSubtitle")}
                  </Text>
                  <TouchableOpacity
                    style={styles.exploreButton}
                    onPress={() => navigation.navigate("Home")}
                  >
                    <Text style={styles.exploreButtonText}>
                      {t("trips.exploreProperties")}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : selectedFilter === "past" ? (
                <>
                  <Image
                    source={require("../assets/Thumbs-Up.jpg")}
                    style={{}}
                  />
                  <Text style={styles.emptyStateTitle}>
                    {t("trips.noPastTitle")}
                  </Text>
                  <Text style={styles.emptyStateText}>
                    {t("trips.noPastSubtitle")}
                  </Text>
                </>
              ) : (
                <>
                  <Image
                    source={require("../assets/Thumbs-Down.jpg")}
                    style={{}}
                  />
                  <Text style={styles.emptyStateTitle}>
                    {t("trips.noCancelledTitle")}
                  </Text>
                  <Text style={styles.emptyStateText}>
                    {t("trips.noCancelledSubtitle")}
                  </Text>
                </>
              )}
            </View>
          ) : (
            <View style={styles.section}>
              {filteredReservations.map((reservation: any) => (
                <TouchableOpacity
                  key={reservation.ID}
                  style={styles.tripCard}
                  onPress={() => handleTripPress(reservation)}
                  activeOpacity={0.8}
                >
                  <View style={styles.tripImageContainer}>
                    {reservation.property?.images?.[0] ? (
                      <Image
                        source={{ uri: reservation.property.images[0] }}
                        style={styles.tripImage}
                      />
                    ) : (
                      <View
                        style={[styles.tripImage, styles.placeholderImage]}
                      />
                    )}
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
                    {/* Downwoard vertical line */}
                    <View
                      style={{
                        width: 1,
                        height: "80%",
                        backgroundColor: "#E5E5E5",
                        position: "absolute",
                        left: "50%",
                        transform: [{ translateX: -0.5 }],
                        marginTop: "110%"
                      }}
                    />
                  </View>

                  <View style={styles.tripContent}>
                    <Text style={styles.propertyName} numberOfLines={1}>
                      {reservation.property?.title || t("trips.property")}
                    </Text>

                    <View style={styles.hostInfo}>
                      {reservation.property?.host?.avatarURL ? (
                        <Image
                          source={{ uri: reservation.property.host.avatarURL }}
                          style={styles.hostAvatar}
                        />
                      ) : (
                        <View
                          style={[styles.hostAvatar, styles.placeholderAvatar]}
                        />
                      )}
                      <View style={styles.hostDetails}>
                        <Text style={styles.hostName}>
                          {reservation.property?.host?.firstName}{" "}
                          {reservation.property?.host?.lastName}
                        </Text>
                        <Text style={styles.bookingDate}>
                          {t("trips.bookedOn", {
                            date: formatDate(reservation.createdAt)
                          })}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.tripDetails}>
                      <View style={styles.detailRow}>
                        <Calendar size={16} color="#717171" />
                        <Text style={styles.detailText}>
                          {formatDate(reservation.checkIn)} -{" "}
                          {formatDate(reservation.checkOut)}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Users size={16} color="#717171" />
                        <Text style={styles.detailText}>
                          {t("trips.guestsCount", {
                            count: reservation.numGuests
                          })}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MapPin size={16} color="#717171" />
                        <Text style={styles.detailText}>
                          {reservation.property?.city || t("trips.defaultCity")}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.tripFooter}>
                      <Text style={styles.tripAmount}>
                        {formatCurrency(reservation.totalPrice)}
                      </Text>

                      {canCancelReservation(reservation) && (
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => handleCancelPress(reservation)}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons
                            name="cancel"
                            size={16}
                            color="#EF4444"
                          />
                          <Text style={styles.cancelButtonText}>
                            {t("trips.cancel")}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Cancellation Modal */}
        {selectedReservation && (
          <CancellationModal
            visible={cancellationModalVisible}
            onClose={() => {
              setCancellationModalVisible(false);
              setSelectedReservation(null);
            }}
            reservation={selectedReservation}
          />
        )}
      </Screen>
      <DemoComponent
        key={`trips-demo-${demoKey}`}
        visible={showDemo}
        onClose={async () => {
          try {
            await AsyncStorage.setItem("hasSeenTripsDemo", "true");
            setShowDemo(false);
          } catch (error) {
            console.error("Error saving demo status:", error);
            setShowDemo(false);
          }
        }}
        steps={demoSteps}
        screenName="Trips"
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 10,
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
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 10
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 20,
    letterSpacing: -0.5
  },
  tripCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderColor: "#E5E5E5",
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden"
  },
  tripImageContainer: {
    position: "relative"
  },
  tripImage: {
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
  tripContent: {
    flex: 1,
    padding: 16
  },
  propertyName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 8,
    letterSpacing: -0.3
  },
  hostInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  hostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12
  },
  hostDetails: {
    flex: 1
  },
  hostName: {
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
  tripDetails: {
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
  tripFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  tripAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222"
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA"
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#EF4444",
    marginLeft: 4
  },
  tripActions: {
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
  primaryAction: {
    backgroundColor: "#222222"
  },
  cancelAction: {
    backgroundColor: "#FFE5E5"
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
    lineHeight: 20,
    marginBottom: 24
  },
  exploreButton: {
    backgroundColor: "#222222",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12
  },
  exploreButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF"
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  quickActionCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#222222",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    textAlign: "center"
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40
  },
  loadingText: {
    fontSize: 16,
    color: "#717171",
    fontWeight: "500"
  },
  placeholderImage: {
    backgroundColor: "#F2F2F2"
  },
  placeholderAvatar: {
    backgroundColor: "#E0E0E0"
  }
});
