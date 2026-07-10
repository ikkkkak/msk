import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Platform
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ExpoCalendar from "expo-calendar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { endpoints } from "../constants";

const { width } = Dimensions.get("window");

interface PropertyAvailabilityManagerProps {
  propertyID: number;
  visible: boolean;
  onClose: () => void;
}

interface AvailabilityData {
  date: string;
  isAvailable: boolean;
  price: number;
  minStay: number;
  maxStay: number;
  checkInTime: string;
  checkOutTime: string;
  notes: string;
}

interface PricingData {
  basePrice: number;
  weekendPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  cleaningFee: number;
  serviceFee: number;
  securityDeposit: number;
  currency: string;
}

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export const PropertyAvailabilityManager: React.FC<
  PropertyAvailabilityManagerProps
> = ({ propertyID, visible, onClose }) => {
  const [selectedTab, setSelectedTab] = useState<
    "calendar" | "pricing" | "discounts" | "blocks"
  >("calendar");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showDateModal, setShowDateModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  // Expo Calendar state
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [calendarPermission, setCalendarPermission] = useState<boolean>(false);
  const [calendarId, setCalendarId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch availability data
  const { data: availabilityData, refetch: refetchAvailability } = useQuery(
    ["property-availability", propertyID],
    async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      const response = await axios.get(
        `${
          endpoints.availability
        }/property/${propertyID}?startDate=${formatDate(
          startDate
        )}&endDate=${formatDate(endDate)}`
      );
      return response.data.data || [];
    },
    { enabled: visible }
  );

  // Fetch pricing data
  const { data: pricingData, refetch: refetchPricing } = useQuery(
    ["property-pricing", propertyID],
    async () => {
      const response = await axios.get(
        `${endpoints.availability}/pricing/${propertyID}`
      );
      return response.data.data;
    },
    { enabled: visible }
  );

  // Set single date availability
  const setAvailabilityMutation = useMutation(
    async (data: AvailabilityData) => {
      const response = await axios.post(`${endpoints.availability}/property`, {
        propertyID,
        date: data.date,
        isAvailable: data.isAvailable,
        price: data.price,
        minStay: data.minStay,
        maxStay: data.maxStay,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        notes: data.notes
      });
      return response.data;
    },
    {
      onSuccess: () => {
        refetchAvailability();
        setShowDateModal(false);
        Alert.alert("Success", "Availability updated successfully");
      },
      onError: (error) => {
        Alert.alert("Error", "Failed to update availability");
      }
    }
  );

  // Set pricing
  const setPricingMutation = useMutation(
    async (data: PricingData) => {
      const response = await axios.post(`${endpoints.availability}/pricing`, {
        propertyID,
        ...data
      });
      return response.data;
    },
    {
      onSuccess: () => {
        refetchPricing();
        setShowPricingModal(false);
        Alert.alert("Success", "Pricing updated successfully");
      },
      onError: (error) => {
        Alert.alert("Error", "Failed to update pricing");
      }
    }
  );

  // Expo Calendar: Request permission and get default calendar
  useEffect(() => {
    if (!visible) return;
    (async () => {
      const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
      setCalendarPermission(status === "granted");
      if (status === "granted") {
        const calendars = await ExpoCalendar.getCalendarsAsync(
          ExpoCalendar.EntityTypes.EVENT
        );
        // Try to find a writable calendar
        const defaultCalendar =
          calendars.find((cal) => cal.allowsModifications) || calendars[0];
        if (defaultCalendar) {
          setCalendarId(defaultCalendar.id);
        }
      }
    })();
  }, [visible]);

  // Fetch events for the next 3 months
  useEffect(() => {
    if (!calendarPermission || !calendarId) return;
    (async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);
      try {
        const events = await ExpoCalendar.getEventsAsync(
          [calendarId],
          startDate,
          endDate
        );
        setCalendarEvents(events);
      } catch (e) {
        setCalendarEvents([]);
      }
    })();
  }, [calendarPermission, calendarId, visible]);

  // Helper to get events for a specific date
  const getEventsForDate = (dateString: string) => {
    return calendarEvents.filter((ev) => {
      const evDate = new Date(ev.startDate);
      return formatDate(evDate) === dateString;
    });
  };

  // CalendarTab using Expo Calendar events (read-only)
  const CalendarTab = () => {
    // Show a simple grid of days for the next 30 days as a demo
    const today = new Date();
    const days: { date: string; events: any[] }[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = formatDate(d);
      days.push({
        date: dateStr,
        events: getEventsForDate(dateStr)
      });
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.calendarTitle}>
          Upcoming 30 Days (from device calendar)
        </Text>
        <View style={styles.calendarGrid}>
          {days.map(({ date, events }) => (
            <TouchableOpacity
              key={date}
              style={[
                styles.calendarDay,
                selectedDate === date && styles.selectedDay,
                events.length > 0 && styles.hasEventDay
              ]}
              onPress={() => {
                setSelectedDate(date);
                setShowDateModal(true);
              }}
            >
              <Text style={styles.calendarDayText}>{date.slice(-2)}</Text>
              {events.length > 0 && <View style={styles.eventDot} />}
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#00A699" }]} />
            <Text style={styles.legendText}>Event</Text>
          </View>
        </View>
        {selectedDate && showDateModal && (
          <Modal
            visible={showDateModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDateModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Events on {selectedDate}</Text>
                {getEventsForDate(selectedDate).length === 0 ? (
                  <Text style={styles.noEventsText}>No events</Text>
                ) : (
                  getEventsForDate(selectedDate).map((ev) => (
                    <View key={ev.id} style={styles.eventItem}>
                      <Text style={styles.eventTitle}>
                        {ev.title || "(No Title)"}
                      </Text>
                      <Text style={styles.eventTime}>
                        {new Date(ev.startDate).toLocaleTimeString()} -{" "}
                        {new Date(ev.endDate).toLocaleTimeString()}
                      </Text>
                    </View>
                  ))
                )}
                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => setShowDateModal(false)}
                >
                  <Text style={styles.closeModalButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  };

  const PricingTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => setShowPricingModal(true)}
      >
        <MaterialIcons name="edit" size={20} color="#FFFFFF" />
        <Text style={styles.actionButtonText}>Edit Pricing</Text>
      </TouchableOpacity>

      {pricingData && (
        <View style={styles.pricingCard}>
          <Text style={styles.pricingTitle}>Current Pricing</Text>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Base Price:</Text>
            <Text style={styles.pricingValue}>
              {pricingData.currency} {pricingData.basePrice}/night
            </Text>
          </View>
          {pricingData.weekendPrice > 0 && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Weekend Price:</Text>
              <Text style={styles.pricingValue}>
                {pricingData.currency} {pricingData.weekendPrice}/night
              </Text>
            </View>
          )}
          {pricingData.weeklyPrice > 0 && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Weekly Price:</Text>
              <Text style={styles.pricingValue}>
                {pricingData.currency} {pricingData.weeklyPrice}/night
              </Text>
            </View>
          )}
          {pricingData.monthlyPrice > 0 && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Monthly Price:</Text>
              <Text style={styles.pricingValue}>
                {pricingData.currency} {pricingData.monthlyPrice}/night
              </Text>
            </View>
          )}
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Cleaning Fee:</Text>
            <Text style={styles.pricingValue}>
              {pricingData.currency} {pricingData.cleaningFee}
            </Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Service Fee:</Text>
            <Text style={styles.pricingValue}>
              {pricingData.currency} {pricingData.serviceFee}
            </Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Security Deposit:</Text>
            <Text style={styles.pricingValue}>
              {pricingData.currency} {pricingData.securityDeposit}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#222222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Availability & Pricing</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "calendar" && styles.activeTab]}
            onPress={() => setSelectedTab("calendar")}
          >
            <MaterialIcons
              name="calendar-today"
              size={20}
              color={selectedTab === "calendar" ? "#007AFF" : "#717171"}
            />
            <Text
              style={[
                styles.tabText,
                selectedTab === "calendar" && styles.activeTabText
              ]}
            >
              Calendar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "pricing" && styles.activeTab]}
            onPress={() => setSelectedTab("pricing")}
          >
            <MaterialIcons
              name="attach-money"
              size={20}
              color={selectedTab === "pricing" ? "#007AFF" : "#717171"}
            />
            <Text
              style={[
                styles.tabText,
                selectedTab === "pricing" && styles.activeTabText
              ]}
            >
              Pricing
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === "discounts" && styles.activeTab
            ]}
            onPress={() => setSelectedTab("discounts")}
          >
            <MaterialIcons
              name="local-offer"
              size={20}
              color={selectedTab === "discounts" ? "#007AFF" : "#717171"}
            />
            <Text
              style={[
                styles.tabText,
                selectedTab === "discounts" && styles.activeTabText
              ]}
            >
              Discounts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "blocks" && styles.activeTab]}
            onPress={() => setSelectedTab("blocks")}
          >
            <MaterialIcons
              name="block"
              size={20}
              color={selectedTab === "blocks" ? "#007AFF" : "#717171"}
            />
            <Text
              style={[
                styles.tabText,
                selectedTab === "blocks" && styles.activeTabText
              ]}
            >
              Blocks
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {selectedTab === "calendar" && <CalendarTab />}
          {selectedTab === "pricing" && <PricingTab />}
          {selectedTab === "discounts" && (
            <Text style={styles.comingSoon}>Discounts coming soon!</Text>
          )}
          {selectedTab === "blocks" && (
            <Text style={styles.comingSoon}>Date blocking coming soon!</Text>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5"
  },
  closeButton: {
    padding: 4
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222"
  },
  placeholder: {
    width: 32
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#F8F8F8",
    paddingHorizontal: 16
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent"
  },
  activeTab: {
    borderBottomColor: "#007AFF"
  },
  tabText: {
    fontSize: 14,
    color: "#717171",
    marginLeft: 4,
    fontWeight: "500"
  },
  activeTabText: {
    color: "#007AFF",
    fontWeight: "600"
  },
  content: {
    flex: 1
  },
  tabContent: {
    padding: 16
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#222222",
    textAlign: "center"
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start"
  },
  calendarDay: {
    width: (width - 32) / 7 - 2,
    aspectRatio: 1,
    margin: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    position: "relative"
  },
  selectedDay: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF"
  },
  hasEventDay: {
    borderColor: "#00A699"
  },
  calendarDayText: {
    fontSize: 16,
    color: "#222222",
    fontWeight: "500"
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00A699",
    position: "absolute",
    bottom: 6,
    left: "50%",
    marginLeft: -4
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 24
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center"
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  legendText: {
    fontSize: 14,
    color: "#717171"
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8
  },
  pricingCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 16
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 16
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5"
  },
  pricingLabel: {
    fontSize: 16,
    color: "#717171"
  },
  pricingValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222"
  },
  comingSoon: {
    fontSize: 16,
    color: "#717171",
    textAlign: "center",
    marginTop: 40
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 24,
    width: "80%",
    alignItems: "center"
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#222222"
  },
  noEventsText: {
    fontSize: 16,
    color: "#717171",
    marginBottom: 12
  },
  eventItem: {
    marginBottom: 10,
    alignItems: "center"
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#222222"
  },
  eventTime: {
    fontSize: 14,
    color: "#717171"
  },
  closeModalButton: {
    marginTop: 16,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24
  },
  closeModalButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16
  }
});
