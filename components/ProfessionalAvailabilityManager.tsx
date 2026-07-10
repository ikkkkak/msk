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
  Switch,
  Platform
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { endpoints } from "../constants";

const { width, height } = Dimensions.get("window");

interface ProfessionalAvailabilityManagerProps {
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

interface DiscountData {
  name: string;
  type: "percentage" | "fixed" | "early_bird" | "last_minute";
  value: number;
  minStay: number;
  maxStay: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export const ProfessionalAvailabilityManager: React.FC<
  ProfessionalAvailabilityManagerProps
> = ({ propertyID, visible, onClose }) => {
  const [selectedTab, setSelectedTab] = useState<
    "calendar" | "pricing" | "discounts" | "blocks"
  >("calendar");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showDateModal, setShowDateModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  // Form states
  const [availabilityForm, setAvailabilityForm] = useState<AvailabilityData>({
    date: "",
    isAvailable: true,
    price: 0,
    minStay: 1,
    maxStay: 0,
    checkInTime: "15:00",
    checkOutTime: "11:00",
    notes: ""
  });

  const [pricingForm, setPricingForm] = useState<PricingData>({
    basePrice: 0,
    weekendPrice: 0,
    weeklyPrice: 0,
    monthlyPrice: 0,
    cleaningFee: 0,
    serviceFee: 0,
    securityDeposit: 0,
    currency: "MRU"
  });

  const [discountForm, setDiscountForm] = useState<DiscountData>({
    name: "",
    type: "percentage",
    value: 0,
    minStay: 1,
    maxStay: 0,
    startDate: "",
    endDate: "",
    isActive: true
  });

  // Fetch availability data
  const { data: availabilityData, refetch: refetchAvailability } = useQuery({
    queryKey: ["property-availability", propertyID],
    queryFn: async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);

      const response = await axios.get(
        `${endpoints.availability}/property/${propertyID}?startDate=${
          startDate.toISOString().split("T")[0]
        }&endDate=${endDate.toISOString().split("T")[0]}`
      );
      return response.data.data || [];
    },
    enabled: visible,
  });

  // Fetch pricing data
  const { data: pricingData, refetch: refetchPricing } = useQuery({
    queryKey: ["property-pricing", propertyID],
    queryFn: async () => {
      const response = await axios.get(
        `${endpoints.availability}/pricing/${propertyID}`
      );
      return response.data.data;
    },
    enabled: visible,
  });

  // Fetch discounts
  const { data: discountsData, refetch: refetchDiscounts } = useQuery({
    queryKey: ["property-discounts", propertyID],
    queryFn: async () => {
      const response = await axios.get(
        `${endpoints.availability}/discounts/${propertyID}`
      );
      return response.data.data || [];
    },
    enabled: visible,
  });

  // Set availability mutation
  const setAvailabilityMutation = useMutation({
    mutationFn: async (data: AvailabilityData) => {
      const response = await axios.post(`${endpoints.availability}/property`, {
        propertyID,
        ...data
      });
      return response.data;
    },
    onSuccess: () => {
      refetchAvailability();
      setShowDateModal(false);
      Alert.alert("Success", "Availability updated successfully!");
    },
    onError: () => {
      Alert.alert("Error", "Failed to update availability. Please try again.");
    }
  });

  // Set pricing mutation
  const setPricingMutation = useMutation({
    mutationFn: async (data: PricingData) => {
      const response = await axios.post(`${endpoints.availability}/pricing`, {
        propertyID,
        ...data
      });
      return response.data;
    },
    onSuccess: () => {
      refetchPricing();
      setShowPricingModal(false);
      Alert.alert("Success", "Pricing updated successfully!");
    },
    onError: () => {
      Alert.alert("Error", "Failed to update pricing. Please try again.");
    }
  });

  // Create discount mutation
  const createDiscountMutation = useMutation({
    mutationFn: async (data: DiscountData) => {
      const response = await axios.post(`${endpoints.availability}/discounts`, {
        propertyID,
        ...data
      });
      return response.data;
    },
    onSuccess: () => {
      refetchDiscounts();
      setShowDiscountModal(false);
      Alert.alert("Success", "Discount created successfully!");
    },
    onError: () => {
      Alert.alert("Error", "Failed to create discount. Please try again.");
    }
  });

  // Generate calendar days for next 6 months
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);

    for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const availability = availabilityData?.find(
        (item: AvailabilityData) => item.date === dateStr
      );

      days.push({
        date: dateStr,
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        isToday: dateStr === today.toISOString().split("T")[0],
        isPast: d < today,
        availability: availability || {
          isAvailable: true,
          price: pricingData?.basePrice || 0
        }
      });
    }
    return days;
  };

  const handleDatePress = (date: string) => {
    setSelectedDate(date);
    const availability = availabilityData?.find(
      (item: AvailabilityData) => item.date === date
    );
    setAvailabilityForm({
      date,
      isAvailable: availability?.isAvailable ?? true,
      price: availability?.price ?? pricingData?.basePrice ?? 0,
      minStay: availability?.minStay ?? 1,
      maxStay: availability?.maxStay ?? 0,
      checkInTime: availability?.checkInTime ?? "15:00",
      checkOutTime: availability?.checkOutTime ?? "11:00",
      notes: availability?.notes ?? ""
    });
    setShowDateModal(true);
  };

  const handleSaveAvailability = () => {
    if (availabilityForm.price <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price for this date.");
      return;
    }
    setAvailabilityMutation.mutate(availabilityForm);
  };

  const handleSavePricing = () => {
    if (pricingForm.basePrice <= 0) {
      Alert.alert("Invalid Base Price", "Please enter a valid base price.");
      return;
    }
    setPricingMutation.mutate(pricingForm);
  };

  const handleSaveDiscount = () => {
    if (!discountForm.name || discountForm.value <= 0) {
      Alert.alert("Invalid Discount", "Please fill in all required fields.");
      return;
    }
    createDiscountMutation.mutate(discountForm);
  };

  // Calendar Tab Component
  const CalendarTab = () => {
    const days = generateCalendarDays();

    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Availability Calendar</Text>
          <Text style={styles.sectionSubtitle}>
            Tap any date to set availability and pricing
          </Text>
        </View>

        <View style={styles.calendarContainer}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={day.date}
              style={[
                styles.calendarDay,
                day.isToday && styles.todayDay,
                day.isPast && styles.pastDay,
                !day.availability.isAvailable && styles.blockedDay,
                selectedDate === day.date && styles.selectedDay
              ]}
              onPress={() => !day.isPast && handleDatePress(day.date)}
              disabled={day.isPast}
            >
              <Text
                style={[
                  styles.dayText,
                  day.isPast && styles.pastDayText,
                  !day.availability.isAvailable && styles.blockedDayText,
                  selectedDate === day.date && styles.selectedDayText
                ]}
              >
                {day.day}
              </Text>
              {day.availability.isAvailable && (
                <Text style={styles.priceText}>
                  {day.availability.price > 0
                    ? `MRU ${day.availability.price}`
                    : "Free"}
                </Text>
              )}
              {!day.availability.isAvailable && (
                <Text style={styles.blockedText}>Blocked</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#00A699" }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FF5A5F" }]} />
            <Text style={styles.legendText}>Blocked</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#E0E0E0" }]} />
            <Text style={styles.legendText}>Past</Text>
          </View>
        </View>
      </View>
    );
  };

  // Pricing Tab Component
  const PricingTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Pricing Settings</Text>
        <Text style={styles.sectionSubtitle}>
          Set your base rates and additional fees
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => {
          if (pricingData) {
            setPricingForm(pricingData);
          }
          setShowPricingModal(true);
        }}
      >
        <MaterialIcons name="edit" size={20} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>
          {pricingData ? "Edit Pricing" : "Set Up Pricing"}
        </Text>
      </TouchableOpacity>

      {pricingData && (
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Current Pricing</Text>
          <View style={styles.pricingGrid}>
            <View style={styles.pricingItem}>
              <Text style={styles.pricingLabel}>Base Price</Text>
              <Text style={styles.pricingValue}>
                {pricingData.currency} {pricingData.basePrice}/night
              </Text>
            </View>
            {pricingData.weekendPrice > 0 && (
              <View style={styles.pricingItem}>
                <Text style={styles.pricingLabel}>Weekend Price</Text>
                <Text style={styles.pricingValue}>
                  {pricingData.currency} {pricingData.weekendPrice}/night
                </Text>
              </View>
            )}
            {pricingData.weeklyPrice > 0 && (
              <View style={styles.pricingItem}>
                <Text style={styles.pricingLabel}>Weekly Price</Text>
                <Text style={styles.pricingValue}>
                  {pricingData.currency} {pricingData.weeklyPrice}/night
                </Text>
              </View>
            )}
            {pricingData.monthlyPrice > 0 && (
              <View style={styles.pricingItem}>
                <Text style={styles.pricingLabel}>Monthly Price</Text>
                <Text style={styles.pricingValue}>
                  {pricingData.currency} {pricingData.monthlyPrice}/night
                </Text>
              </View>
            )}
          </View>
          <View style={styles.feesSection}>
            <Text style={styles.feesTitle}>Additional Fees</Text>
            <View style={styles.feeItem}>
              <Text style={styles.feeLabel}>Cleaning Fee</Text>
              <Text style={styles.feeValue}>
                {pricingData.currency} {pricingData.cleaningFee}
              </Text>
            </View>
            <View style={styles.feeItem}>
              <Text style={styles.feeLabel}>Service Fee</Text>
              <Text style={styles.feeValue}>
                {pricingData.currency} {pricingData.serviceFee}
              </Text>
            </View>
            <View style={styles.feeItem}>
              <Text style={styles.feeLabel}>Security Deposit</Text>
              <Text style={styles.feeValue}>
                {pricingData.currency} {pricingData.securityDeposit}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  // Discounts Tab Component
  const DiscountsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Discounts & Promotions</Text>
        <Text style={styles.sectionSubtitle}>
          Create special offers to attract more guests
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setShowDiscountModal(true)}
      >
        <MaterialIcons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>Create New Discount</Text>
      </TouchableOpacity>

      {discountsData && discountsData.length > 0 ? (
        <View style={styles.discountsList}>
          {discountsData.map((discount: DiscountData, index: number) => (
            <View key={index} style={styles.discountCard}>
              <View style={styles.discountHeader}>
                <Text style={styles.discountName}>{discount.name}</Text>
                <View
                  style={[
                    styles.discountBadge,
                    {
                      backgroundColor: discount.isActive ? "#00A699" : "#FF5A5F"
                    }
                  ]}
                >
                  <Text style={styles.discountBadgeText}>
                    {discount.isActive ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>
              <Text style={styles.discountType}>
                {discount.type.replace("_", " ").toUpperCase()}
              </Text>
              <Text style={styles.discountValue}>
                {discount.type === "percentage"
                  ? `${discount.value}% off`
                  : `${discount.value} MRU off`}
              </Text>
              <Text style={styles.discountDates}>
                {discount.startDate} - {discount.endDate}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="local-offer" size={48} color="#E0E0E0" />
          <Text style={styles.emptyStateTitle}>No Discounts Yet</Text>
          <Text style={styles.emptyStateText}>
            Create your first discount to attract more guests!
          </Text>
        </View>
      )}
    </View>
  );

  // Blocks Tab Component
  const BlocksTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Block Dates</Text>
        <Text style={styles.sectionSubtitle}>
          Block dates when your property is unavailable
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setShowBlockModal(true)}
      >
        <MaterialIcons name="block" size={20} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>Block Dates</Text>
      </TouchableOpacity>

      <View style={styles.infoCard}>
        <MaterialIcons name="info" size={24} color="#007AFF" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Why block dates?</Text>
          <Text style={styles.infoText}>
            Block dates when your property is unavailable due to maintenance,
            personal use, or other reasons. Guests won't be able to book these
            dates.
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#222222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Availability & Pricing</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tab Bar */}
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

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {selectedTab === "calendar" && <CalendarTab />}
          {selectedTab === "pricing" && <PricingTab />}
          {selectedTab === "discounts" && <DiscountsTab />}
          {selectedTab === "blocks" && <BlocksTab />}
        </ScrollView>

        {/* Date Modal */}
        <Modal visible={showDateModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Set Availability</Text>
                <TouchableOpacity onPress={() => setShowDateModal(false)}>
                  <MaterialIcons name="close" size={24} color="#222222" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalSubtitle}>Date: {selectedDate}</Text>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Available for booking?</Text>
                  <Switch
                    value={availabilityForm.isAvailable}
                    onValueChange={(value) =>
                      setAvailabilityForm({
                        ...availabilityForm,
                        isAvailable: value
                      })
                    }
                    trackColor={{ false: "#FF5A5F", true: "#00A699" }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {availabilityForm.isAvailable && (
                  <>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>
                        Price per night (MRU)
                      </Text>
                      <TextInput
                        style={styles.formInput}
                        value={availabilityForm.price.toString()}
                        onChangeText={(text) =>
                          setAvailabilityForm({
                            ...availabilityForm,
                            price: parseFloat(text) || 0
                          })
                        }
                        keyboardType="numeric"
                        placeholder="Enter price"
                      />
                    </View>

                    <View style={styles.formRow}>
                      <View style={styles.formGroupHalf}>
                        <Text style={styles.formLabel}>Min Stay (nights)</Text>
                        <TextInput
                          style={styles.formInput}
                          value={availabilityForm.minStay.toString()}
                          onChangeText={(text) =>
                            setAvailabilityForm({
                              ...availabilityForm,
                              minStay: parseInt(text) || 1
                            })
                          }
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.formGroupHalf}>
                        <Text style={styles.formLabel}>Max Stay (nights)</Text>
                        <TextInput
                          style={styles.formInput}
                          value={availabilityForm.maxStay.toString()}
                          onChangeText={(text) =>
                            setAvailabilityForm({
                              ...availabilityForm,
                              maxStay: parseInt(text) || 0
                            })
                          }
                          keyboardType="numeric"
                          placeholder="0 = no limit"
                        />
                      </View>
                    </View>

                    <View style={styles.formRow}>
                      <View style={styles.formGroupHalf}>
                        <Text style={styles.formLabel}>Check-in Time</Text>
                        <TextInput
                          style={styles.formInput}
                          value={availabilityForm.checkInTime}
                          onChangeText={(text) =>
                            setAvailabilityForm({
                              ...availabilityForm,
                              checkInTime: text
                            })
                          }
                          placeholder="15:00"
                        />
                      </View>
                      <View style={styles.formGroupHalf}>
                        <Text style={styles.formLabel}>Check-out Time</Text>
                        <TextInput
                          style={styles.formInput}
                          value={availabilityForm.checkOutTime}
                          onChangeText={(text) =>
                            setAvailabilityForm({
                              ...availabilityForm,
                              checkOutTime: text
                            })
                          }
                          placeholder="11:00"
                        />
                      </View>
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Notes (optional)</Text>
                      <TextInput
                        style={[styles.formInput, styles.textArea]}
                        value={availabilityForm.notes}
                        onChangeText={(text) =>
                          setAvailabilityForm({
                            ...availabilityForm,
                            notes: text
                          })
                        }
                        placeholder="Any special notes for this date"
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  </>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setShowDateModal(false)}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleSaveAvailability}
                    disabled={setAvailabilityMutation.isLoading}
                  >
                    <Text style={styles.primaryButtonText}>
                      {setAvailabilityMutation.isLoading ? "Saving..." : "Save"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Pricing Modal */}
        <Modal visible={showPricingModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Set Your Pricing</Text>
                <TouchableOpacity onPress={() => setShowPricingModal(false)}>
                  <MaterialIcons name="close" size={24} color="#222222" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    Base Price per Night (MRU) *
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    value={pricingForm.basePrice.toString()}
                    onChangeText={(text) =>
                      setPricingForm({
                        ...pricingForm,
                        basePrice: parseFloat(text) || 0
                      })
                    }
                    keyboardType="numeric"
                    placeholder="Enter base price"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Weekend Price (MRU)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={pricingForm.weekendPrice.toString()}
                    onChangeText={(text) =>
                      setPricingForm({
                        ...pricingForm,
                        weekendPrice: parseFloat(text) || 0
                      })
                    }
                    keyboardType="numeric"
                    placeholder="Higher price for weekends"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Weekly Price (MRU)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={pricingForm.weeklyPrice.toString()}
                    onChangeText={(text) =>
                      setPricingForm({
                        ...pricingForm,
                        weeklyPrice: parseFloat(text) || 0
                      })
                    }
                    keyboardType="numeric"
                    placeholder="Discount for 7+ nights"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Monthly Price (MRU)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={pricingForm.monthlyPrice.toString()}
                    onChangeText={(text) =>
                      setPricingForm({
                        ...pricingForm,
                        monthlyPrice: parseFloat(text) || 0
                      })
                    }
                    keyboardType="numeric"
                    placeholder="Discount for 30+ nights"
                  />
                </View>

                <View style={styles.feesSection}>
                  <Text style={styles.feesTitle}>Additional Fees</Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Cleaning Fee (MRU)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={pricingForm.cleaningFee.toString()}
                      onChangeText={(text) =>
                        setPricingForm({
                          ...pricingForm,
                          cleaningFee: parseFloat(text) || 0
                        })
                      }
                      keyboardType="numeric"
                      placeholder="One-time cleaning fee"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Service Fee (MRU)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={pricingForm.serviceFee.toString()}
                      onChangeText={(text) =>
                        setPricingForm({
                          ...pricingForm,
                          serviceFee: parseFloat(text) || 0
                        })
                      }
                      keyboardType="numeric"
                      placeholder="Platform service fee"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Security Deposit (MRU)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={pricingForm.securityDeposit.toString()}
                      onChangeText={(text) =>
                        setPricingForm({
                          ...pricingForm,
                          securityDeposit: parseFloat(text) || 0
                        })
                      }
                      keyboardType="numeric"
                      placeholder="Refundable security deposit"
                    />
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setShowPricingModal(false)}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleSavePricing}
                    disabled={setPricingMutation.isLoading}
                  >
                    <Text style={styles.primaryButtonText}>
                      {setPricingMutation.isLoading
                        ? "Saving..."
                        : "Save Pricing"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    paddingTop: Platform.OS === "ios" ? 50 : 16
  },
  closeButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222"
  },
  placeholder: {
    width: 40
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#F8F8F8",
    paddingHorizontal: 20
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent"
  },
  activeTab: {
    borderBottomColor: "#007AFF"
  },
  tabText: {
    fontSize: 14,
    color: "#717171",
    marginLeft: 6,
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
    padding: 20
  },
  sectionHeader: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8
  },
  sectionSubtitle: {
    fontSize: 16,
    color: "#717171",
    lineHeight: 22
  },
  calendarContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24
  },
  calendarDay: {
    width: (width - 80) / 7 - 2,
    aspectRatio: 1,
    margin: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#E5E5E5"
  },
  todayDay: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF"
  },
  pastDay: {
    backgroundColor: "#F0F0F0",
    borderColor: "#E0E0E0"
  },
  blockedDay: {
    backgroundColor: "#FF5A5F",
    borderColor: "#FF5A5F"
  },
  selectedDay: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF"
  },
  dayText: {
    fontSize: 16,
    color: "#222222",
    fontWeight: "600"
  },
  pastDayText: {
    color: "#A0A0A0"
  },
  blockedDayText: {
    color: "#FFFFFF"
  },
  selectedDayText: {
    color: "#FFFFFF"
  },
  priceText: {
    fontSize: 10,
    color: "#00A699",
    fontWeight: "500",
    marginTop: 2
  },
  blockedText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "500",
    marginTop: 2
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 32
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
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginRight: 12,
    alignItems: "center"
  },
  secondaryButtonText: {
    fontSize: 16,
    color: "#717171",
    fontWeight: "600"
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    padding: 20,
    marginTop: 16
  },
  infoContent: {
    flex: 1,
    marginLeft: 16
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 8
  },
  infoText: {
    fontSize: 14,
    color: "#717171",
    lineHeight: 20
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 16
  },
  pricingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  pricingItem: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5"
  },
  pricingLabel: {
    fontSize: 14,
    color: "#717171",
    marginBottom: 4
  },
  pricingValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222"
  },
  feesSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5"
  },
  feesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 16
  },
  feeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12
  },
  feeLabel: {
    fontSize: 14,
    color: "#717171"
  },
  feeValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222"
  },
  discountsList: {
    marginTop: 16
  },
  discountCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5"
  },
  discountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  discountName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222"
  },
  discountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  discountBadgeText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600"
  },
  discountType: {
    fontSize: 12,
    color: "#717171",
    textTransform: "uppercase",
    marginBottom: 4
  },
  discountValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#00A699",
    marginBottom: 4
  },
  discountDates: {
    fontSize: 14,
    color: "#717171"
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    marginTop: 16,
    marginBottom: 8
  },
  emptyStateText: {
    fontSize: 14,
    color: "#717171",
    textAlign: "center",
    lineHeight: 20
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5"
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222"
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#717171",
    marginBottom: 24
  },
  modalContent: {
    padding: 20
  },
  formGroup: {
    marginBottom: 20
  },
  formGroupHalf: {
    flex: 1,
    marginBottom: 20
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 8
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#FFFFFF"
  },
  textArea: {
    height: 80,
    textAlignVertical: "top"
  },
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24
  }
});
