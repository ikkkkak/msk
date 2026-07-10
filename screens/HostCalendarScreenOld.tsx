import React, { useState } from "react";
import { ScrollView, View, StyleSheet, TouchableOpacity, Text, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";
import { SimpleCard } from "../components/SimpleCard";

export const HostCalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  const currentMonth = selectedDate.toLocaleDateString('fr-FR', { 
    month: 'long', 
    year: 'numeric' 
  });

  const bookings = [
    {
      id: 1,
      property: "Appartement moderne - Paris",
      propertyImage: "https://via.placeholder.com/60x60",
      guest: "Marie Dubois",
      guestAvatar: "https://via.placeholder.com/32x32",
      checkIn: new Date(2024, 0, 15),
      checkOut: new Date(2024, 0, 18),
      status: "confirmé",
      amount: "€320",
      nights: 3,
      guests: 2,
    },
    {
      id: 2,
      property: "Studio cosy - Lyon",
      propertyImage: "https://via.placeholder.com/60x60",
      guest: "Jean Martin",
      guestAvatar: "https://via.placeholder.com/32x32",
      checkIn: new Date(2024, 0, 20),
      checkOut: new Date(2024, 0, 22),
      status: "en attente",
      amount: "€180",
      nights: 2,
      guests: 1,
    },
    {
      id: 3,
      property: "Maison de charme - Nice",
      propertyImage: "https://via.placeholder.com/60x60",
      guest: "Sophie Bernard",
      guestAvatar: "https://via.placeholder.com/32x32",
      checkIn: new Date(2024, 0, 25),
      checkOut: new Date(2024, 0, 28),
      status: "confirmé",
      amount: "€450",
      nights: 3,
      guests: 4,
    },
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getUpcomingBookings = () => {
    const today = new Date();
    return bookings.filter(booking => booking.checkIn >= today);
  };

  const upcomingBookings = getUpcomingBookings();

  return (
    <Screen style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Calendrier</Text>
            <Text style={styles.headerSubtitle}>{currentMonth}</Text>
          </View>
          <TouchableOpacity style={styles.syncButton}>
            <MaterialIcons name="sync" size={20} color="#222222" />
          </TouchableOpacity>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.viewModeContainer}>
          <View style={styles.viewModeToggle}>
            {(['month', 'week', 'day'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.viewModeButton,
                  viewMode === mode && styles.viewModeButtonActive
                ]}
                onPress={() => setViewMode(mode)}
              >
                <Text style={[
                  styles.viewModeText,
                  viewMode === mode && styles.viewModeTextActive
                ]}>
                  {mode === 'month' ? 'Mois' : mode === 'week' ? 'Semaine' : 'Jour'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Calendar Placeholder */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity style={styles.calendarNavButton}>
              <MaterialIcons name="chevron-left" size={20} color="#222222" />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>{currentMonth}</Text>
            <TouchableOpacity style={styles.calendarNavButton}>
              <MaterialIcons name="chevron-right" size={20} color="#222222" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.calendarGrid}>
            {/* Days of week */}
            <View style={styles.daysOfWeek}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                <Text key={index} style={styles.dayOfWeekText}>{day}</Text>
              ))}
            </View>
            
            {/* Calendar days placeholder */}
            <View style={styles.calendarDays}>
              {Array.from({ length: 35 }, (_, i) => (
                <View key={i} style={[
                  styles.calendarDay,
                  i === 14 && styles.today,
                  i >= 10 && i <= 12 && styles.bookedDay,
                  i >= 15 && i <= 17 && styles.bookedDay,
                ]}>
                  <Text style={[
                    styles.calendarDayText,
                    i === 14 && styles.todayText,
                    i >= 10 && i <= 12 && styles.bookedDayText,
                    i >= 15 && i <= 17 && styles.bookedDayText,
                  ]}>
                    {i + 1}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Upcoming Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Prochaines réservations</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>Voir tout</Text>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#222222" />
            </TouchableOpacity>
          </View>

          {upcomingBookings.map((booking) => (
            <SimpleCard key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <Text style={styles.propertyName}>{booking.property}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + "20" }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                    {booking.status}
                  </Text>
                </View>
              </View>
              
              <View style={styles.bookingDetails}>
                <View style={styles.bookingRow}>
                  <MaterialIcons name="person" size={16} color="#717171" />
                  <Text style={styles.bookingText}>{booking.guest}</Text>
                </View>
                <View style={styles.bookingRow}>
                  <MaterialIcons name="date-range" size={16} color="#717171" />
                  <Text style={styles.bookingText}>
                    {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                  </Text>
                </View>
                <View style={styles.bookingRow}>
                  <MaterialIcons name="euro" size={16} color="#717171" />
                  <Text style={styles.bookingText}>{booking.amount}</Text>
                </View>
              </View>

              <View style={styles.bookingActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialIcons name="message" size={16} color="#222222" />
                  <Text style={styles.actionButtonText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.primaryAction]}>
                  <MaterialIcons name="check" size={16} color="#FFFFFF" />
                  <Text style={[styles.actionButtonText, styles.primaryActionText]}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </SimpleCard>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <MaterialIcons name="block" size={24} color="#222222" />
              <Text style={styles.quickActionText}>Bloquer des dates</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <MaterialIcons name="edit" size={24} color="#222222" />
              <Text style={styles.quickActionText}>Modifier prix</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <MaterialIcons name="sync" size={24} color="#222222" />
              <Text style={styles.quickActionText}>Synchroniser</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <MaterialIcons name="download" size={24} color="#222222" />
              <Text style={styles.quickActionText}>Exporter</Text>
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
  viewModeContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  viewModeToggle: {
    flexDirection: "row",
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  viewModeButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#717171",
  },
  viewModeTextActive: {
    color: "#222222",
  },
  calendarCard: {
    margin: 16,
    padding: 20,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  calendarNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
  },
  calendarPlaceholder: {
    alignItems: "center",
    paddingVertical: 40,
  },
  calendarPlaceholderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#717171",
    marginTop: 12,
  },
  calendarPlaceholderSubtext: {
    fontSize: 14,
    color: "#717171",
    marginTop: 4,
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
  },
  seeAllText: {
    fontSize: 16,
    color: "#222222",
    fontWeight: "600",
  },
  bookingCard: {
    marginBottom: 12,
    padding: 16,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  bookingDetails: {
    gap: 8,
    marginBottom: 16,
  },
  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bookingText: {
    fontSize: 14,
    color: "#717171",
    marginLeft: 8,
  },
  bookingActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F7F7F7",
  },
  primaryAction: {
    backgroundColor: "#222222",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    marginLeft: 6,
  },
  primaryActionText: {
    color: "#FFFFFF",
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  quickAction: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    marginTop: 8,
    textAlign: "center",
  },
});
