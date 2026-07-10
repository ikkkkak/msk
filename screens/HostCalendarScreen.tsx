import React, { useState } from "react";
import { ScrollView, View, StyleSheet, TouchableOpacity, Text, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";

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

        {/* Calendar */}
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
            
            {/* Calendar days */}
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
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingImageContainer}>
                <Image source={{ uri: booking.propertyImage }} style={styles.bookingImage} />
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                  <Text style={styles.statusText}>{booking.status}</Text>
                </View>
              </View>
              
              <View style={styles.bookingContent}>
                <Text style={styles.propertyName}>{booking.property}</Text>
                
                <View style={styles.guestInfo}>
                  <Image source={{ uri: booking.guestAvatar }} style={styles.guestAvatar} />
                  <Text style={styles.guestName}>{booking.guest}</Text>
                </View>
                
                <View style={styles.bookingDetails}>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="date-range" size={16} color="#717171" />
                    <Text style={styles.detailText}>
                      {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)} • {booking.nights} nuit{booking.nights > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="group" size={16} color="#717171" />
                    <Text style={styles.detailText}>{booking.guests} voyageur{booking.guests > 1 ? 's' : ''}</Text>
                  </View>
                </View>
                
                <View style={styles.bookingFooter}>
                  <Text style={styles.bookingAmount}>{booking.amount}</Text>
                  <View style={styles.bookingActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <MaterialIcons name="message" size={16} color="#222222" />
                    </TouchableOpacity>
                    {booking.status === 'confirmé' && (
                      <TouchableOpacity style={[styles.actionButton, styles.primaryAction]}>
                        <MaterialIcons name="visibility" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
          ))}
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
  syncButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  calendarNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
  },
  calendarGrid: {
    gap: 16,
  },
  daysOfWeek: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  dayOfWeekText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#717171",
    width: 32,
    textAlign: "center",
  },
  calendarDays: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  calendarDay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  today: {
    backgroundColor: "#222222",
  },
  bookedDay: {
    backgroundColor: "#1F8A70",
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#717171",
  },
  todayText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  bookedDayText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    letterSpacing: -0.5,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    fontSize: 14,
    color: "#222222",
    fontWeight: "600",
    marginRight: 4,
  },
  bookingCard: {
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
  bookingImageContainer: {
    position: "relative",
  },
  bookingImage: {
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
  bookingContent: {
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
  guestInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  guestAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  guestName: {
    fontSize: 14,
    color: "#717171",
    fontWeight: "500",
  },
  bookingDetails: {
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
  bookingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },
  bookingActions: {
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
