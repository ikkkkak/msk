import React, { useState } from "react";
import { ScrollView, View, StyleSheet, TouchableOpacity, Text, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";

export const UserTripsScreen = () => {
  const [selectedFilter, setSelectedFilter] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

  const trips = [
    {
      id: 1,
      property: "Appartement moderne - Paris",
      propertyImage: "https://via.placeholder.com/80",
      host: "Marie Dubois",
      checkIn: "15 Jan 2024",
      checkOut: "18 Jan 2024",
      status: "confirmé",
      amount: "€320",
      nights: 3,
      guests: 2,
      bookingDate: "10 Jan 2024",
      type: "upcoming",
    },
    {
      id: 2,
      property: "Studio cosy - Lyon",
      propertyImage: "https://via.placeholder.com/80",
      host: "Jean Martin",
      checkIn: "20 Jan 2024",
      checkOut: "22 Jan 2024",
      status: "en attente",
      amount: "€180",
      nights: 2,
      guests: 1,
      bookingDate: "12 Jan 2024",
      type: "upcoming",
    },
    {
      id: 3,
      property: "Maison de charme - Nice",
      propertyImage: "https://via.placeholder.com/80",
      host: "Sophie Bernard",
      checkIn: "25 Jan 2024",
      checkOut: "28 Jan 2024",
      status: "confirmé",
      amount: "€450",
      nights: 3,
      guests: 4,
      bookingDate: "14 Jan 2024",
      type: "upcoming",
    },
    {
      id: 4,
      property: "Loft industriel - Marseille",
      propertyImage: "https://via.placeholder.com/80",
      host: "Pierre Durand",
      checkIn: "30 Jan 2024",
      checkOut: "02 Fév 2024",
      status: "annulé",
      amount: "€280",
      nights: 3,
      guests: 2,
      bookingDate: "16 Jan 2024",
      type: "cancelled",
    },
    {
      id: 5,
      property: "Villa avec piscine - Cannes",
      propertyImage: "https://via.placeholder.com/80",
      host: "Claire Moreau",
      checkIn: "05 Déc 2023",
      checkOut: "08 Déc 2023",
      status: "terminé",
      amount: "€650",
      nights: 3,
      guests: 6,
      bookingDate: "20 Nov 2023",
      type: "past",
    },
  ];

  const filters = [
    { key: 'upcoming', label: 'À venir', count: trips.filter(t => t.type === 'upcoming').length },
    { key: 'past', label: 'Passés', count: trips.filter(t => t.type === 'past').length },
    { key: 'cancelled', label: 'Annulés', count: trips.filter(t => t.type === 'cancelled').length },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmé":
        return "#1F8A70";
      case "en attente":
        return "#FF8C00";
      case "annulé":
        return "#FF5A5F";
      case "terminé":
        return "#4A90E2";
      default:
        return "#717171";
    }
  };

  const getFilteredTrips = () => {
    return trips.filter(trip => trip.type === selectedFilter);
  };

  const filteredTrips = getFilteredTrips();

  return (
    <Screen style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes voyages</Text>
          <Text style={styles.headerSubtitle}>Gérez vos réservations</Text>
        </View>

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
                <Text style={[
                  styles.filterTabText,
                  selectedFilter === filter.key && styles.filterTabTextActive
                ]}>
                  {filter.label}
                </Text>
                <View style={[
                  styles.filterBadge,
                  selectedFilter === filter.key && styles.filterBadgeActive
                ]}>
                  <Text style={[
                    styles.filterBadgeText,
                    selectedFilter === filter.key && styles.filterBadgeTextActive
                  ]}>
                    {filter.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trips List */}
        <View style={styles.section}>
        {filteredTrips.map((trip) => (
          <SimpleCard key={trip.id} style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <View style={styles.propertyImage}>
                  <MaterialIcons name="home" size={24} color="#E5E5E5" />
                </View>
                <View style={styles.tripInfo}>
                  <Text style={styles.propertyName}>{trip.property}</Text>
                  <Text style={styles.hostName}>Hôte: {trip.host}</Text>
                  <View style={styles.tripDates}>
                    <MaterialIcons name="date-range" size={14} color="#717171" />
                    <Text style={styles.dateText}>
                      {trip.checkIn} - {trip.checkOut}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) + "20" }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(trip.status) }]}>
                    {trip.status}
                  </Text>
                </View>
              </View>

              <View style={styles.tripDetails}>
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="nights-stay" size={16} color="#717171" />
                    <Text style={styles.detailText}>{trip.nights} nuit{trip.nights > 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="group" size={16} color="#717171" />
                    <Text style={styles.detailText}>{trip.guests} voyageur{trip.guests > 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="euro" size={16} color="#717171" />
                    <Text style={styles.detailText}>{trip.amount}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.tripActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialIcons name="message" size={16} color="#222222" />
                  <Text style={styles.actionButtonText}>Contacter l'hôte</Text>
                </TouchableOpacity>
                
                {trip.status === 'confirmé' && trip.type === 'upcoming' && (
                  <TouchableOpacity style={[styles.actionButton, styles.primaryAction]}>
                    <MaterialIcons name="visibility" size={16} color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, styles.primaryActionText]}>Voir détails</Text>
                  </TouchableOpacity>
                )}
                
                {trip.status === 'terminé' && (
                  <TouchableOpacity style={[styles.actionButton, styles.reviewButton]}>
                    <MaterialIcons name="star" size={16} color="#222222" />
                    <Text style={styles.actionButtonText}>Laisser un avis</Text>
                  </TouchableOpacity>
                )}
              </View>
            </SimpleCard>
          ))}
        </View>

        {/* Empty State */}
        {filteredTrips.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="flight-takeoff" size={48} color="#E5E5E5" />
            <Text style={styles.emptyStateTitle}>Aucun voyage</Text>
            <Text style={styles.emptyStateText}>
              {selectedFilter === 'upcoming' 
                ? "Vous n'avez pas de voyages à venir"
                : selectedFilter === 'past'
                ? "Vous n'avez pas encore voyagé"
                : "Vous n'avez pas de voyages annulés"
              }
            </Text>
            <TouchableOpacity style={styles.exploreButton}>
              <Text style={styles.exploreButtonText}>Explorer les destinations</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#717171",
  },
  filterContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: "#F7F7F7",
  },
  filterTabActive: {
    backgroundColor: "#222222",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#717171",
    marginRight: 8,
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E5E5E5",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  filterBadgeActive: {
    backgroundColor: "#FFFFFF",
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#717171",
  },
  filterBadgeTextActive: {
    color: "#222222",
  },
  section: {
    padding: 24,
  },
  tripCard: {
    marginBottom: 16,
    padding: 16,
  },
  tripHeader: {
    flexDirection: "row",
    marginBottom: 16,
  },
  propertyImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tripInfo: {
    flex: 1,
    justifyContent: "center",
  },
  propertyName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 4,
  },
  hostName: {
    fontSize: 14,
    color: "#717171",
    marginBottom: 8,
  },
  tripDates: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 14,
    color: "#717171",
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tripDetails: {
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    color: "#717171",
    marginLeft: 4,
  },
  tripActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#F7F7F7",
  },
  primaryAction: {
    backgroundColor: "#222222",
  },
  reviewButton: {
    backgroundColor: "#FFF5E6",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#222222",
    marginLeft: 4,
  },
  primaryActionText: {
    color: "#FFFFFF",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#717171",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#717171",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: "#222222",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
