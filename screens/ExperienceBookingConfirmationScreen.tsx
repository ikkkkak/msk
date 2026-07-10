import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { endpoints } from "../constants";
import { useUser } from "../hooks/useUser";
import { useMyGroups } from "../hooks/queries/useExperienceInvites";
import { useCreateExperienceBooking } from "../hooks/queries/useExperienceBooking";
import { TextInput } from "react-native";

// Types based on actual API response
interface Experience {
  id: number;
  title: string;
  description: string;
  city: string;
  duration: number;
  groupSize: number;
  pricePerPerson: number;
  photos: Array<{ url: string; caption?: string; order: number }>;
  host: {
    id: number;
    firstName: string;
    lastName: string;
    avatarURL: string;
  };
  startTime: string;
  endTime: string;
  language: string;
  focus: string;
  activityLevel: string;
  difficultyLevel: string;
}

interface Group {
  id: number;
  name: string;
  description?: string;
  photoURL?: string;
  members: Array<{
    ID: number;
    UserID: number;
    user: {
      ID: number;
      firstName: string;
      lastName: string;
      avatarURL: string;
    };
  }>;
  ownerID: number;
  privacy: string;
  experience?: {
    id: number;
    title: string;
    city: string;
  };
}

interface RouteParams {
  experienceId: number;
  selectedDate: string;
  selectedTime?: string;
}

export const ExperienceBookingConfirmationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { experienceId, selectedDate, selectedTime } =
    route.params as RouteParams;

  // Hooks
  const { user } = useUser();
  const {
    data: groups,
    isLoading: groupsLoading,
    error: groupsError,
    refetch: refetchGroups
  } = useMyGroups();
  const createBookingMutation = useCreateExperienceBooking();

  // State
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [bookingNotes, setBookingNotes] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch experience details
  const {
    data: experience,
    isLoading: experienceLoading,
    error: experienceError,
    refetch: refetchExperience
  } = useQuery<Experience>(
    ["experience-details", experienceId],
    async () => {
      if (!experienceId) {
        throw new Error("Experience ID is required");
      }

      console.log("Fetching experience with ID:", experienceId);
      console.log(
        "Experience endpoint:",
        `${endpoints.experiences}/${experienceId}`
      );
      console.log("User access token exists:", !!user?.accessToken);

      // Use direct fetch to avoid auth issues
      try {
        console.log("Fetching experience using direct fetch...");
        const response = await fetch(
          `${endpoints.experiences}/${experienceId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Experience response:", data);

        // Handle different response structures
        if (data && typeof data === "object") {
          return data.experience || data.data || data;
        }

        throw new Error("Invalid response structure");
      } catch (error: any) {
        console.error("Error fetching experience:", error);
        throw error;
      }
    },
    {
      enabled: !!experienceId,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000
    }
  );

  // Handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchExperience(), refetchGroups()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchExperience, refetchGroups]);

  // Force refresh groups when component mounts
  React.useEffect(() => {
    if (groups && groups.length > 0) {
      refetchGroups();
    }
  }, []);

  const handleGroupSelect = useCallback(
    (group: Group) => {
      setSelectedGroup(group);
      setShowGroupSelector(false);
      // Reset participant count to group size if it exceeds
      if (
        group?.members &&
        Array.isArray(group.members) &&
        participantCount > group.members.length
      ) {
        setParticipantCount(group.members.length);
      }
    },
    [participantCount]
  );

  const handleParticipantCountChange = useCallback(
    (count: number) => {
      if (count < 1) return;
      if (
        selectedGroup &&
        selectedGroup.members &&
        Array.isArray(selectedGroup.members) &&
        count > selectedGroup.members.length
      ) {
        Alert.alert(
          "Invalid Count",
          "You cannot select more participants than group members."
        );
        return;
      }
      setParticipantCount(count);
    },
    [selectedGroup]
  );

  const handleBooking = useCallback(() => {
    if (!selectedGroup) {
      Alert.alert("Group Required", "Please select a group for this booking.");
      return;
    }

    if (!user?.ID) {
      Alert.alert(
        "Authentication Required",
        "Please sign in to make a booking."
      );
      return;
    }

    if (!experience) {
      Alert.alert("Error", "Experience details not available.");
      return;
    }

    const groupSize = experience.groupSize || 0;
    if (participantCount > groupSize) {
      Alert.alert(
        "Group Too Large",
        `This experience can only accommodate ${groupSize} participants. Your group has ${participantCount} members.`
      );
      return;
    }

    const bookingData = {
      experienceId,
      groupId: selectedGroup.id,
      participantCount,
      selectedDate,
      selectedTime: selectedTime || "",
      notes: bookingNotes,
      userId: user.ID
    };

    createBookingMutation.mutate(bookingData, {
      onSuccess: async (data) => {
        // Server automatically sends booking ticket to group chat
        console.log(
          "Booking created successfully, server will send ticket to group chat"
        );

        // Show success modal
        setShowSuccessModal(true);
      },
      onError: (error: any) => {
        const errorMessage =
          error.response?.data?.message ||
          "Failed to create booking. Please try again.";
        Alert.alert("Booking Failed", errorMessage);
      }
    });
  }, [
    selectedGroup,
    user,
    experience,
    participantCount,
    selectedDate,
    selectedTime,
    bookingNotes,
    createBookingMutation,
    navigation
  ]);

  // Computed values
  const getRemainingSpots = useCallback(() => {
    if (!experience) return 0;
    const groupSize = experience.groupSize || 0;
    return Math.max(0, groupSize - participantCount);
  }, [experience, participantCount]);

  const getTotalPrice = useCallback(() => {
    if (!experience) return 0;
    const pricePerPerson = experience.pricePerPerson || 0;
    return pricePerPerson * participantCount;
  }, [experience, participantCount]);

  // Loading state
  if (experienceLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading experience details...</Text>
      </View>
    );
  }

  // Error state
  if (experienceError) {
    const errorMessage =
      experienceError.message || "Something went wrong. Please try again.";
    const isNetworkError =
      errorMessage.includes("Network Error") || errorMessage.includes("403");

    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorTitle}>Failed to load experience</Text>
        <Text style={styles.errorMessage}>
          {isNetworkError
            ? "Unable to connect to server. Please check your internet connection and try again."
            : errorMessage}
        </Text>
        <Text style={styles.debugText}>Experience ID: {experienceId}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => refetchExperience()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No experience found
  if (!experience || typeof experience !== "object" || experience === null) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="search-off" size={64} color="#8E8E93" />
        <Text style={styles.errorTitle}>Experience not found</Text>
        <Text style={styles.errorMessage}>
          The experience you're looking for doesn't exist or has been removed.
        </Text>
        <Text style={styles.debugText}>
          Experience data: {JSON.stringify(experience)}
        </Text>
        <Text style={styles.debugText}>
          Experience type: {typeof experience}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => refetchExperience()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Additional safety check
  if (!experience || typeof experience !== "object" || experience === null) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={64} color="#FF3B30" />
        <Text style={styles.errorTitle}>Invalid Experience Data</Text>
        <Text style={styles.errorMessage}>
          The experience data is invalid or corrupted.
        </Text>
        <Text style={styles.debugText}>Data: {JSON.stringify(experience)}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => refetchExperience()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#222222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Booking</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Experience Card */}
        <View style={styles.experienceCard}>
          <Image
            source={{
              uri:
                experience?.photos?.[0]?.url ||
                "https://via.placeholder.com/400x200"
            }}
            style={styles.experienceImage}
            resizeMode="cover"
          />
          <View style={styles.experienceInfo}>
            <Text style={styles.experienceLocation}>
              {experience?.city || "Unknown City"}
            </Text>
            <Text style={styles.experienceTitle}>
              {experience?.title || "Unknown Experience"}
            </Text>
            <View style={styles.experienceMeta}>
              <View style={styles.metaItem}>
                <MaterialIcons name="schedule" size={16} color="#717171" />
                <Text style={styles.metaText}>
                  {experience?.duration || 0} minutes
                </Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="people" size={16} color="#717171" />
                <Text style={styles.metaText}>
                  Max {experience?.groupSize || 0} people
                </Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="star" size={16} color="#FFD700" />
                <Text style={styles.metaText}>4.8 (24 reviews)</Text>
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Price per person</Text>
              <Text style={styles.priceAmount}>
                {experience?.pricePerPerson || 0} MRU
              </Text>
            </View>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.bookingDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{selectedDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>
                {selectedTime ||
                  `${experience?.startTime || "09:00"} - ${
                    experience?.endTime || "12:00"
                  }`}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Participants</Text>
              <Text style={styles.detailValue}>{participantCount} people</Text>
            </View>
          </View>
        </View>

        {/* Group Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Group</Text>
          <TouchableOpacity
            style={styles.groupSelector}
            onPress={() => setShowGroupSelector(true)}
          >
            {selectedGroup ? (
              <View style={styles.selectedGroup}>
                <Image
                  source={{
                    uri:
                      selectedGroup.photoURL ||
                      selectedGroup.members?.[0]?.user?.avatarURL ||
                      "https://via.placeholder.com/40"
                  }}
                  style={styles.groupImage}
                />
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>
                    {selectedGroup.name || "Unknown Group"}
                  </Text>
                  <Text style={styles.groupMembers}>
                    {selectedGroup.members?.length || 0} members
                  </Text>
                </View>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color="#717171"
                />
              </View>
            ) : (
              <View style={styles.placeholderGroup}>
                <MaterialIcons name="group-add" size={24} color="#717171" />
                <Text style={styles.placeholderText}>Select a group</Text>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color="#717171"
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Member Avatars */}
          {selectedGroup &&
            selectedGroup.members &&
            selectedGroup.members.length > 0 && (
              <View style={styles.memberAvatarsContainer}>
                <Text style={styles.memberAvatarsTitle}>Group Members</Text>
                <View style={styles.memberAvatars}>
                  {selectedGroup.members.slice(0, 6).map((member, index) => {
                    console.log(`Rendering member ${index}:`, member);
                    console.log(`Member user object:`, member.user);
                    console.log(
                      `Member user avatarURL:`,
                      member.user?.avatarURL
                    );
                    console.log(
                      `Member user firstName:`,
                      member.user?.firstName
                    );
                    console.log(`Member user lastName:`, member.user?.lastName);
                    return (
                      <View
                        key={member.ID}
                        style={styles.memberAvatarContainer}
                      >
                        <Image
                          source={{
                            uri:
                              member.user?.avatarURL ||
                              "https://via.placeholder.com/32"
                          }}
                          style={styles.memberAvatar}
                          onError={(error) =>
                            console.log("Image load error:", error)
                          }
                          onLoad={() =>
                            console.log("Image loaded successfully")
                          }
                        />
                        {index === 5 && selectedGroup.members.length > 6 && (
                          <View style={styles.moreMembersOverlay}>
                            <Text style={styles.moreMembersText}>
                              +{selectedGroup.members.length - 6}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
        </View>

        {/* Participant Count */}
        {selectedGroup && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Number of Participants</Text>
            <View style={styles.participantSelector}>
              <TouchableOpacity
                style={[
                  styles.countButton,
                  participantCount <= 1 && styles.disabledButton
                ]}
                onPress={() =>
                  handleParticipantCountChange(participantCount - 1)
                }
                disabled={participantCount <= 1}
              >
                <MaterialIcons
                  name="remove"
                  size={20}
                  color={participantCount <= 1 ? "#C7C7CC" : "#222222"}
                />
              </TouchableOpacity>
              <Text style={styles.participantCount}>{participantCount}</Text>
              <TouchableOpacity
                style={[
                  styles.countButton,
                  participantCount >= (selectedGroup.members?.length || 0) &&
                    styles.disabledButton
                ]}
                onPress={() =>
                  handleParticipantCountChange(participantCount + 1)
                }
                disabled={
                  participantCount >= (selectedGroup.members?.length || 0)
                }
              >
                <MaterialIcons
                  name="add"
                  size={20}
                  color={
                    participantCount >= (selectedGroup.members?.length || 0)
                      ? "#C7C7CC"
                      : "#222222"
                  }
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.participantHint}>
              {getRemainingSpots()} spots remaining
            </Text>
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Requests (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Any special requests or notes for the host..."
            value={bookingNotes}
            onChangeText={setBookingNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Price Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Summary</Text>
          <View style={styles.priceSummary}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {experience?.pricePerPerson || 0} MRU × {participantCount}{" "}
                people
              </Text>
              <Text style={styles.priceValue}>{getTotalPrice()} MRU</Text>
            </View>

            {/* Individual Member Payments */}
            {selectedGroup &&
              selectedGroup.members &&
              selectedGroup.members.length > 0 && (
                <View style={styles.memberPaymentsContainer}>
                  <Text style={styles.memberPaymentsTitle}>
                    Payment per Member
                  </Text>
                  {selectedGroup.members
                    .slice(0, participantCount)
                    .map((member, index) => {
                      console.log(`Payment member ${index}:`, member);
                      console.log(`Payment member user:`, member.user);
                      console.log(
                        `Payment member name:`,
                        `${member.user?.firstName || "Unknown"} ${
                          member.user?.lastName || ""
                        }`
                      );
                      return (
                        <View key={member.ID} style={styles.memberPaymentRow}>
                          <View style={styles.memberPaymentInfo}>
                            <Image
                              source={{
                                uri:
                                  member.user?.avatarURL ||
                                  "https://via.placeholder.com/24"
                              }}
                              style={styles.memberPaymentAvatar}
                            />
                            <Text style={styles.memberPaymentName}>
                              {member.user?.firstName || "Unknown"}{" "}
                              {member.user?.lastName || ""}
                            </Text>
                          </View>
                          <Text style={styles.memberPaymentAmount}>
                            {experience?.pricePerPerson || 0} MRU
                          </Text>
                        </View>
                      );
                    })}
                  {selectedGroup.members.length > participantCount && (
                    <View style={styles.memberPaymentRow}>
                      <Text style={styles.memberPaymentNote}>
                        +{selectedGroup.members.length - participantCount} more
                        members not participating
                      </Text>
                    </View>
                  )}
                </View>
              )}

            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{getTotalPrice()} MRU</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Book Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!selectedGroup || createBookingMutation.isLoading) &&
              styles.disabledButton
          ]}
          onPress={handleBooking}
          disabled={!selectedGroup || createBookingMutation.isLoading}
        >
          {createBookingMutation.isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.bookButtonText}>
              Book Experience - {getTotalPrice()} MRU
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Group Selector Modal */}
      <Modal
        visible={showGroupSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGroupSelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowGroupSelector(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Group</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            {groupsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading groups...</Text>
              </View>
            ) : groupsError ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="error-outline" size={64} color="#FF3B30" />
                <Text style={styles.emptyTitle}>Failed to load groups</Text>
                <Text style={styles.emptyMessage}>
                  {groupsError.message ||
                    "Unable to load your groups. Please try again."}
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => refetchGroups()}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : groups && Array.isArray(groups) && groups.length > 0 ? (
              groups.map((group: Group) => (
                <TouchableOpacity
                  key={group.id}
                  style={styles.groupItem}
                  onPress={() => handleGroupSelect(group)}
                >
                  <Image
                    source={{
                      uri:
                        group.photoURL ||
                        group.members?.[0]?.user?.avatarURL ||
                        "https://via.placeholder.com/40"
                    }}
                    style={styles.groupImage}
                  />
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>
                      {group.name || "Unknown Group"}
                    </Text>
                    <Text style={styles.groupMembers}>
                      {group.members?.length || 0} members
                    </Text>
                    {group.members && group.members.length > 0 && (
                      <View style={styles.modalMemberAvatars}>
                        {group.members.slice(0, 4).map((member) => (
                          <Image
                            key={member.ID}
                            source={{
                              uri:
                                member.user?.avatarURL ||
                                "https://via.placeholder.com/24"
                            }}
                            style={styles.modalMemberAvatar}
                          />
                        ))}
                        {group.members.length > 4 && (
                          <View style={styles.modalMoreMembers}>
                            <Text style={styles.modalMoreMembersText}>
                              +{group.members.length - 4}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                  {selectedGroup?.id === group.id && (
                    <MaterialIcons name="check" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="group" size={64} color="#C7C7CC" />
                <Text style={styles.emptyTitle}>No groups found</Text>
                <Text style={styles.emptyMessage}>
                  Create a group first to book this experience.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Success Modal */}
      {showSuccessModal && (
        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.successModalOverlay}>
            <View style={styles.successModal}>
              <View style={styles.successIconContainer}>
                <MaterialIcons name="check-circle" size={64} color="#4CAF50" />
              </View>
              <Text style={styles.successTitle}>Booking Confirmed! 🎉</Text>
              <Text style={styles.successMessage}>
                Your experience booking has been confirmed and a booking ticket
                has been automatically sent to your group chat.
              </Text>
              <View style={styles.successDetails}>
                <Text style={styles.successDetailText}>
                  <Text style={styles.successDetailLabel}>Experience:</Text>{" "}
                  {experience?.title || "Unknown"}
                </Text>
                <Text style={styles.successDetailText}>
                  <Text style={styles.successDetailLabel}>Date:</Text>{" "}
                  {selectedDate}
                </Text>
                <Text style={styles.successDetailText}>
                  <Text style={styles.successDetailLabel}>Participants:</Text>{" "}
                  {participantCount} people
                </Text>
                <Text style={styles.successDetailText}>
                  <Text style={styles.successDetailLabel}>Total:</Text>{" "}
                  {getTotalPrice()} MRU
                </Text>
              </View>
              <TouchableOpacity
                style={styles.successButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.successButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    marginTop: "15%"
  },
  backButton: {
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
  content: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#717171"
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222222",
    marginTop: 16,
    marginBottom: 8
  },
  errorMessage: {
    fontSize: 16,
    color: "#717171",
    textAlign: "center",
    marginBottom: 24
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600"
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600"
  },
  debugText: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 8,
    textAlign: "center"
  },
  experienceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    margin: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
    borderColor: "#E5E5E5",
    borderWidth: 1
  },
  experienceImage: {
    width: "100%",
    height: 200
  },
  experienceInfo: {
    padding: 20
  },
  experienceLocation: {
    fontSize: 14,
    color: "#717171",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  experienceTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 12,
    lineHeight: 28
  },
  experienceMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center"
  },
  metaText: {
    fontSize: 14,
    color: "#717171",
    marginLeft: 4
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5"
  },
  priceLabel: {
    fontSize: 16,
    color: "#717171"
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222"
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 16
  },
  bookingDetails: {
    gap: 12
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  detailLabel: {
    fontSize: 16,
    color: "#717171"
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#222222"
  },
  groupSelector: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 16
  },
  selectedGroup: {
    flexDirection: "row",
    alignItems: "center"
  },
  groupImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12
  },
  groupInfo: {
    flex: 1
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222"
  },
  groupMembers: {
    fontSize: 14,
    color: "#717171"
  },
  placeholderGroup: {
    flexDirection: "row",
    alignItems: "center"
  },
  placeholderText: {
    fontSize: 16,
    color: "#717171",
    marginLeft: 12,
    flex: 1
  },
  participantSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },
  countButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center"
  },
  disabledButton: {
    opacity: 0.5
  },
  participantCount: {
    fontSize: 24,
    fontWeight: "600",
    color: "#222222",
    marginHorizontal: 20
  },
  participantHint: {
    fontSize: 14,
    color: "#717171",
    textAlign: "center"
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#222222",
    minHeight: 80
  },
  priceSummary: {
    gap: 12
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  priceValue: {
    fontSize: 16,
    color: "#222222"
  },
  totalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5"
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222"
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222"
  },
  footer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5"
  },
  bookButton: {
    backgroundColor: "#222222",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center"
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600"
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA"
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5"
  },
  cancelText: {
    fontSize: 16,
    color: "#007AFF"
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222"
  },
  modalContent: {
    flex: 1
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5"
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    marginTop: 16,
    marginBottom: 8
  },
  emptyMessage: {
    fontSize: 16,
    color: "#717171",
    textAlign: "center"
  },
  memberAvatarsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5"
  },
  memberAvatarsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 12
  },
  memberAvatars: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  memberAvatarContainer: {
    position: "relative"
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  moreMembersOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  moreMembersText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600"
  },
  modalMemberAvatars: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4
  },
  modalMemberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5"
  },
  modalMoreMembers: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center"
  },
  modalMoreMembersText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#717171"
  },
  memberPaymentsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5"
  },
  memberPaymentsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 12
  },
  memberPaymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0"
  },
  memberPaymentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  memberPaymentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5"
  },
  memberPaymentName: {
    fontSize: 14,
    color: "#222222",
    fontWeight: "500"
  },
  memberPaymentAmount: {
    fontSize: 14,
    color: "#222222",
    fontWeight: "600"
  },
  memberPaymentNote: {
    fontSize: 12,
    color: "#717171",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  successModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8
  },
  successIconContainer: {
    marginBottom: 16
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222222",
    textAlign: "center",
    marginBottom: 12
  },
  successMessage: {
    fontSize: 16,
    color: "#717171",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20
  },
  successDetails: {
    width: "100%",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24
  },
  successDetailText: {
    fontSize: 14,
    color: "#222222",
    marginBottom: 8,
    lineHeight: 20
  },
  successDetailLabel: {
    fontWeight: "600",
    color: "#222222"
  },
  successButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120
  },
  successButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center"
  }
});
