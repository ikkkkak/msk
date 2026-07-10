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
      propertyImage: "https://via.placeholder.com/80x80",
      host: "Marie Dubois",
      hostAvatar: "https://via.placeholder.com/32x32",
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
      propertyImage: "https://via.placeholder.com/80x80",
      host: "Jean Martin",
      hostAvatar: "https://via.placeholder.com/32x32",
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
      propertyImage: "https://via.placeholder.com/80x80",
      host: "Sophie Bernard",
      hostAvatar: "https://via.placeholder.com/32x32",
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
      propertyImage: "https://via.placeholder.com/80x80",
      host: "Pierre Durand",
      hostAvatar: "https://via.placeholder.com/32x32",
      checkIn: "30 Jan 2024",
      checkOut: "02 Fév 2024",
      status: "annulé",
      amount: "€280",
      nights: 3,
      guests: 2,
      bookingDate: "16 Jan 2024",
      type: "cancelled",
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
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Mes voyages</Text>
            <Text style={styles.headerSubtitle}>Gérez vos réservations et voyages</Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <MaterialIcons name="search" size={20} color="#222222" />
          </TouchableOpacity>
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
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripImageContainer}>
                <Image source={{ uri: trip.propertyImage }} style={styles.tripImage} />
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
                  <Text style={styles.statusText}>{trip.status}</Text>
                </View>
              </View>
              
              <View style={styles.tripContent}>
                <Text style={styles.propertyName}>{trip.property}</Text>
                
                <View style={styles.hostInfo}>
                  <Image source={{ uri: trip.hostAvatar }} style={styles.hostAvatar} />
                  <View style={styles.hostDetails}>
                    <Text style={styles.hostName}>Hébergé par {trip.host}</Text>
                    <Text style={styles.bookingDate}>Réservé le {trip.bookingDate}</Text>
                  </View>
                </View>
                
                <View style={styles.tripDetails}>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="date-range" size={16} color="#717171" />
                    <Text style={styles.detailText}>
                      {trip.checkIn} - {trip.checkOut} • {trip.nights} nuit{trip.nights > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="group" size={16} color="#717171" />
                    <Text style={styles.detailText}>{trip.guests} voyageur{trip.guests > 1 ? 's' : ''}</Text>
                  </View>
                </View>
                
                <View style={styles.tripFooter}>
                  <Text style={styles.tripAmount}>{trip.amount}</Text>
                  <View style={styles.tripActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <MaterialIcons name="message" size={16} color="#222222" />
                    </TouchableOpacity>
                    
                    {trip.status === 'confirmé' && (
                      <TouchableOpacity style={[styles.actionButton, styles.primaryAction]}>
                        <MaterialIcons name="star" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                    
                    {trip.status === 'en attente' && (
                      <TouchableOpacity style={[styles.actionButton, styles.cancelAction]}>
                        <MaterialIcons name="close" size={16} color="#FF5A5F" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Empty State */}
        {filteredTrips.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="flight-takeoff" size={48} color="#E5E5E5" />
            <Text style={styles.emptyStateTitle}>
              {selectedFilter === 'upcoming' ? 'Aucun voyage à venir' : 
               selectedFilter === 'past' ? 'Aucun voyage passé' : 'Aucun voyage annulé'}
            </Text>
            <Text style={styles.emptyStateText}>
              {selectedFilter === 'upcoming' ? 'Commencez à planifier votre prochain voyage' : 
               selectedFilter === 'past' ? 'Vos voyages passés apparaîtront ici' : 'Vos voyages annulés apparaîtront ici'}
            </Text>
            {selectedFilter === 'upcoming' && (
              <TouchableOpacity style={styles.exploreButton}>
                <Text style={styles.exploreButtonText}>Explorer les destinations</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard}>
              <View style={styles.quickActionIcon}>
                <MaterialIcons name="search" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Rechercher</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <View style={styles.quickActionIcon}>
                <MaterialIcons name="favorite" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Favoris</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <View style={styles.quickActionIcon}>
                <MaterialIcons name="history" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Historique</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <View style={styles.quickActionIcon}>
                <MaterialIcons name="help" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Aide</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#717171",
    fontWeight: "500",
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  tripCard: {
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
  },
  tripImageContainer: {
    position: "relative",
  },
  tripImage: {
    width: 80,
    height: 80,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  tripContent: {
    flex: 1,
    padding: 16,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  hostInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  hostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  hostDetails: {
    flex: 1,
  },
  hostName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: 12,
    color: "#717171",
    fontWeight: "500",
  },
  tripDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#717171",
    marginLeft: 6,
    fontWeight: "500",
  },
  tripFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tripAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },
  tripActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryAction: {
    backgroundColor: "#222222",
  },
  cancelAction: {
    backgroundColor: "#FFE5E5",
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
    borderRadius: 12,
  },
  exploreButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
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
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#222222",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    textAlign: "center",
  },
});
