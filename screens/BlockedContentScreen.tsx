import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  Dimensions,
  Platform
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "../hooks/useUser";
import { Screen } from "../components/Screen";
import { endpoints } from "../constants";
import { api } from "../services/api";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

interface BlockedUser {
  id: number;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  blockedAt: string;
}

interface BlockedProperty {
  id: number;
  title: string;
  images: string[];
  city: string;
  hiddenAt: string;
}

interface BlockedVideo {
  id: number;
  title: string;
  thumbnail: string;
  hiddenAt: string;
}

interface BlockedOrganization {
  id: number;
  name: string;
  logo?: string;
  blockedAt: string;
}

export const BlockedContentScreen = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Check if user is authenticated
  if (!user) {
    return (
      <Screen style={styles.container}>
        <View style={styles.authRequiredContainer}>
          <View style={styles.authRequiredIcon}>
            <MaterialIcons name="lock" size={48} color="#717171" />
          </View>
          <Text style={styles.authRequiredTitle}>Authentication Required</Text>
          <Text style={styles.authRequiredDescription}>
            You need to be logged in to view your blocked content
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => {
              // Navigate to login screen
              // You can implement navigation here
            }}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  // Fetch blocked users
  const {
    data: blockedUsers = [],
    isLoading: loadingUsers,
    refetch: refetchUsers,
    error: blockedUsersError
  } = useQuery(
    ["blockedUsers"],
    async () => {
      const response = await api.get("/user/blocked");
      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
    {
      enabled: !!user,
      staleTime: 2 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (
          error?.response?.status === 401 ||
          error?.message?.includes("Authentication required")
        ) {
          console.log("🔍 Auth error detected, not retrying");
          return false; // Don't retry on auth errors
        }
        return failureCount < 2;
      }
    }
  );

  // Fetch blocked organizations
  const {
    data: blockedOrganizations = [],
    isLoading: loadingOrgs,
    refetch: refetchOrgs,
    error: blockedOrgsError
  } = useQuery(
    ["blockedOrganizations"],
    async () => {
      const response = await api.get("/organization/blocked");
      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
    {
      enabled: !!user,
      staleTime: 2 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401) {
          return false;
        }
        return failureCount < 2;
      }
    }
  );

  // Fetch hidden properties
  const {
    data: hiddenProperties = [],
    isLoading: loadingProperties,
    refetch: refetchProperties,
    error: hiddenPropertiesError
  } = useQuery(
    ["hiddenProperties"],
    async () => {
      const response = await api.get("/user/hidden-properties");
      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
    {
      enabled: !!user,
      staleTime: 2 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (
          error?.response?.status === 401 ||
          error?.message?.includes("Authentication required")
        ) {
          return false; // Don't retry on auth errors
        }
        return failureCount < 2;
      }
    }
  );

  // Fetch hidden videos
  const {
    data: hiddenVideos = [],
    isLoading: loadingVideos,
    refetch: refetchVideos,
    error: hiddenVideosError
  } = useQuery(
    ["hiddenVideos"],
    async () => {
      const response = await api.get("/user/hidden-videos");
      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
    {
      enabled: !!user,
      staleTime: 2 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (
          error?.response?.status === 401 ||
          error?.message?.includes("Authentication required")
        ) {
          return false; // Don't retry on auth errors
        }
        return failureCount < 2;
      }
    }
  );

  // Unblock user mutation
  const unblockUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await api.delete(`/users/${userId}/unblock`);
      return userId;
    },
    onMutate: async (userId: number) => {
      await queryClient.cancelQueries({ queryKey: ["blockedUsers"] });
      const previous = queryClient.getQueryData<any[]>(["blockedUsers"]) || [];
      queryClient.setQueryData<any[]>(["blockedUsers"], (old = []) =>
        old.filter((u: any) => u.id !== userId)
      );
      return { previous };
    },
    onError: (err: any, _vars, context) => {
      // Rollback only on non-404 errors
      const status = err?.response?.status;
      if (status !== 404 && context?.previous) {
        queryClient.setQueryData(["blockedUsers"], context.previous);
      }
      if (status !== 404) {
        Alert.alert(
          t("settings.blockedContentDetails.error"),
          t("settings.blockedContentDetails.unblockFailed")
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
      // Also refresh feeds/lists impacted by blocks
      queryClient.invalidateQueries({ queryKey: ["videoFeed"] });
      queryClient.invalidateQueries({ queryKey: ["publicPropertySales"] });
      queryClient.invalidateQueries({ queryKey: ["publicLandmarks"] });
    },
    onSuccess: () => {
      Alert.alert(
        t("settings.blockedContentDetails.unblockSuccess"),
        t("settings.blockedContentDetails.userUnblocked")
      );
    }
  });

  // Unblock organization mutation
  const unblockOrganizationMutation = useMutation({
    mutationFn: async (orgId: number) => {
      await api.delete(`/organization/${orgId}/unblock`);
      return orgId;
    },
    onMutate: async (orgId: number) => {
      await queryClient.cancelQueries({ queryKey: ["blockedOrganizations"] });
      const previous =
        queryClient.getQueryData<any[]>(["blockedOrganizations"]) || [];
      queryClient.setQueryData<any[]>(["blockedOrganizations"], (old = []) =>
        old.filter((o: any) => o.id !== orgId)
      );
      return { previous };
    },
    onError: (err: any, _vars, context) => {
      const status = err?.response?.status;
      if (status !== 404 && context?.previous) {
        queryClient.setQueryData(["blockedOrganizations"], context.previous);
      }
      if (status !== 404) {
        Alert.alert(
          t("settings.blockedContentDetails.error"),
          t("settings.blockedContentDetails.unblockFailed")
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedOrganizations"] });
      // Immediately refetch public lists so org content reappears
      queryClient.invalidateQueries({ queryKey: ["publicPropertySales"] });
      queryClient.invalidateQueries({ queryKey: ["publicLandmarks"] });
      queryClient.invalidateQueries({ queryKey: ["public-property-sales"] });
    },
    onSuccess: () => {
      Alert.alert(
        t("settings.blockedContentDetails.unblockSuccess"),
        t("settings.blockedContentDetails.userUnblocked")
      );
    }
  });

  // Unhide property mutation
  const unhidePropertyMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      await api.delete(`/properties/${propertyId}/unhide`);
      return propertyId;
    },
    onMutate: async (propertyId: number) => {
      await queryClient.cancelQueries({ queryKey: ["hiddenProperties"] });
      const previous =
        queryClient.getQueryData<any[]>(["hiddenProperties"]) || [];
      queryClient.setQueryData<any[]>(["hiddenProperties"], (old = []) =>
        old.filter((p: any) => p.id !== propertyId)
      );
      return { previous };
    },
    onError: (err: any, _vars, context) => {
      const status = err?.response?.status;
      if (status !== 404 && context?.previous) {
        queryClient.setQueryData(["hiddenProperties"], context.previous);
      }
      if (status !== 404) {
        Alert.alert(
          t("settings.blockedContentDetails.error"),
          t("settings.blockedContentDetails.unhideFailed")
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["hiddenProperties"] });
      // Refresh related discovery lists
      queryClient.invalidateQueries({ queryKey: ["searchProperties"] });
      queryClient.invalidateQueries({ queryKey: ["publicPropertySales"] });
      queryClient.invalidateQueries({ queryKey: ["publicLandmarks"] });
    },
    onSuccess: () => {
      Alert.alert(
        t("settings.blockedContentDetails.unhideSuccess"),
        t("settings.blockedContentDetails.propertyUnhidden")
      );
    }
  });

  // Unhide video mutation
  const unhideVideoMutation = useMutation(
    async (videoId: number) => {
      await api.delete(`/videos/${videoId}/unhide`);
      return videoId;
    },
    {
      onMutate: async (videoId: number) => {
        await queryClient.cancelQueries(["hiddenVideos"]);
        const previous =
          queryClient.getQueryData<any[]>(["hiddenVideos"]) || [];
        queryClient.setQueryData<any[]>(["hiddenVideos"], (old = []) =>
          old.filter((v: any) => v.id !== videoId)
        );
        return { previous };
      },
      onError: (err: any, _vars, context) => {
        const status = err?.response?.status;
        if (status !== 404 && context?.previous) {
          queryClient.setQueryData(["hiddenVideos"], context.previous);
        }
        if (status !== 404) {
          Alert.alert(
            t("settings.blockedContentDetails.error"),
            t("settings.blockedContentDetails.unhideFailed")
          );
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["hiddenVideos"] });
        queryClient.invalidateQueries({ queryKey: ["videoFeed"] });
        // Property and landmark feeds can also embed video content contextually
        queryClient.invalidateQueries({ queryKey: ["publicPropertySales"] });
        queryClient.invalidateQueries({ queryKey: ["publicLandmarks"] });
      },
      onSuccess: () => {
        Alert.alert(
          t("settings.blockedContentDetails.unhideSuccess"),
          t("settings.blockedContentDetails.videoUnhidden")
        );
      }
    }
  );

  const handleUnblockUser = (user: BlockedUser) => {
    Alert.alert(
      t("settings.blockedContentDetails.unblockUser"),
      t("settings.blockedContentDetails.unblockUserConfirm", {
        name: `${user.firstName} ${user.lastName}`
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.unblock"),
          style: "destructive",
          onPress: () => unblockUserMutation.mutate(user.id)
        }
      ]
    );
  };

  const handleUnhideProperty = (property: BlockedProperty) => {
    Alert.alert(
      t("settings.blockedContentDetails.unhideProperty"),
      t("settings.blockedContentDetails.unhidePropertyConfirm", {
        title: property.title
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.unhide"),
          style: "default",
          onPress: () => unhidePropertyMutation.mutate(property.id)
        }
      ]
    );
  };

  const handleUnhideVideo = (video: BlockedVideo) => {
    Alert.alert(
      t("settings.blockedContentDetails.unhideVideo"),
      t("settings.blockedContentDetails.unhideVideoConfirm", {
        title: video.title
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.unhide"),
          style: "default",
          onPress: () => unhideVideoMutation.mutate(video.id)
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchUsers(),
      refetchOrgs(),
      refetchProperties(),
      refetchVideos()
    ]);
    setRefreshing(false);
  };

  const isLoading = loadingUsers || loadingProperties || loadingVideos;
  const navigation = useNavigation();

  return (
    <Screen style={styles.container}>
      {/* ADD A VERY CUSTOM HEADER WITH A BACK BUTTON AND A TITLE AND A SUBTITLE */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 10,
          backgroundColor: "#FFFFFF"
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#222222" />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              color: "#222222",
              marginBottom: 4,
              letterSpacing: -0.3
            }}
          >
            {t("settings.manageBlockedContent")}
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: "#717171", lineHeight: 18 }}>
          {t("settings.manageBlockedContentDescription")}
        </Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Blocked Users Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <MaterialIcons name="person-off" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>
                {t("settings.blockedContentDetails.blockedUsers")}
              </Text>
              <Text style={styles.sectionCount}>
                {blockedUsers.length} blocked
              </Text>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF5A5F" />
              <Text style={styles.loadingText}>
                {t(
                  "settings.blockedContentDetails.loadingBlockedUsers",
                  "Loading blocked users..."
                )}
              </Text>
            </View>
          ) : blockedUsersError ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={32} color="#FF5A5F" />
              <Text style={styles.errorTitle}>
                {t(
                  "settings.blockedContentDetails.failedBlockedUsers",
                  "Failed to load blocked users"
                )}
              </Text>
              <Text style={styles.errorDescription}>
                {blockedUsersError?.response?.status === 401
                  ? t(
                      "settings.blockedContentDetails.loginAgain",
                      "Please log in again to view your blocked content"
                    )
                  : t(
                      "common.somethingWentWrong",
                      "Something went wrong. Please try again."
                    )}
              </Text>
            </View>
          ) : blockedUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <MaterialIcons name="person" size={32} color="#717171" />
              </View>
              <Text style={styles.emptyTitle}>
                {t(
                  "settings.blockedContentDetails.noBlockedUsers",
                  "No blocked users"
                )}
              </Text>
              <Text style={styles.emptyDescription}>
                {t(
                  "settings.blockedContentDetails.noBlockedUsersDesc",
                  "Users you block won't be able to see your content or contact you"
                )}
              </Text>
            </View>
          ) : (
            <View style={styles.cardsContainer}>
              {blockedUsers.map((user: BlockedUser) => (
                <View key={user.id} style={styles.card}>
                  <View style={styles.cardContent}>
                    <View style={styles.cardImageContainer}>
                      {user.profilePicture ? (
                        <Image
                          source={{ uri: user.profilePicture }}
                          style={styles.cardImage}
                        />
                      ) : (
                        <View style={styles.cardImagePlaceholder}>
                          <MaterialIcons
                            name="person"
                            size={20}
                            color="#717171"
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {user.firstName} {user.lastName}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        Blocked {new Date(user.blockedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleUnblockUser(user)}
                      disabled={unblockUserMutation.isLoading}
                    >
                      <MaterialIcons
                        name="person-add"
                        size={14}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Blocked Organizations Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <MaterialIcons name="domain-disabled" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>
                {t(
                  "settings.blockedContentDetails.blockedOrganizations",
                  "Blocked organizations"
                )}
              </Text>
              <Text style={styles.sectionCount}>
                {blockedOrganizations.length} blocked
              </Text>
            </View>
          </View>

          {loadingOrgs ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF5A5F" />
              <Text style={styles.loadingText}>
                {t(
                  "settings.blockedContentDetails.loadingBlockedOrganizations",
                  "Loading blocked organizations..."
                )}
              </Text>
            </View>
          ) : blockedOrgsError ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={32} color="#FF5A5F" />
              <Text style={styles.errorTitle}>
                {t(
                  "settings.blockedContentDetails.failedBlockedOrganizations",
                  "Failed to load blocked organizations"
                )}
              </Text>
            </View>
          ) : blockedOrganizations.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <MaterialIcons name="domain" size={32} color="#717171" />
              </View>
              <Text style={styles.emptyTitle}>
                {t(
                  "settings.blockedContentDetails.noBlockedOrganizations",
                  "No blocked organizations"
                )}
              </Text>
              <Text style={styles.emptyDescription}>
                {t(
                  "settings.blockedContentDetails.noBlockedOrganizationsDesc",
                  "Organizations you block won't appear in your search results"
                )}
              </Text>
            </View>
          ) : (
            <View style={styles.cardsContainer}>
              {blockedOrganizations.map((org: BlockedOrganization) => (
                <View key={org.id} style={styles.card}>
                  <View style={styles.cardContent}>
                    <View style={styles.cardImageContainer}>
                      {org.logo ? (
                        <Image
                          source={{ uri: org.logo }}
                          style={styles.cardImage}
                        />
                      ) : (
                        <View style={styles.cardImagePlaceholder}>
                          <MaterialIcons
                            name="domain"
                            size={24}
                            color="#717171"
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {org.name}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        {t(
                          "settings.blockedContentDetails.blockedOn",
                          "Blocked"
                        )}{" "}
                        {new Date(org.blockedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => unblockOrganizationMutation.mutate(org.id)}
                      disabled={unblockOrganizationMutation.isLoading}
                    >
                      <MaterialIcons
                        name="domain-verification"
                        size={16}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Hidden Properties Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <MaterialIcons name="home-work" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>
                {t("settings.blockedContentDetails.hiddenProperties")}
              </Text>
              <Text style={styles.sectionCount}>
                {hiddenProperties.length} hidden
              </Text>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF5A5F" />
              <Text style={styles.loadingText}>
                {t(
                  "settings.blockedContentDetails.loadingHiddenProperties",
                  "Loading hidden properties..."
                )}
              </Text>
            </View>
          ) : hiddenProperties.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <MaterialIcons name="home" size={32} color="#717171" />
              </View>
              <Text style={styles.emptyTitle}>
                {t(
                  "settings.blockedContentDetails.noHiddenProperties",
                  "No hidden properties"
                )}
              </Text>
              <Text style={styles.emptyDescription}>
                {t(
                  "settings.blockedContentDetails.noHiddenPropertiesDesc",
                  "Properties you hide won't appear in your search results"
                )}
              </Text>
            </View>
          ) : (
            <View style={styles.cardsContainer}>
              {hiddenProperties.map((property: BlockedProperty) => (
                <View key={property.id} style={styles.card}>
                  <View style={styles.cardContent}>
                    <View style={styles.cardImageContainer}>
                      {property.images && property.images.length > 0 ? (
                        <Image
                          source={{ uri: property.images[0] }}
                          style={styles.cardImage}
                        />
                      ) : (
                        <View style={styles.cardImagePlaceholder}>
                          <MaterialIcons
                            name="home"
                            size={20}
                            color="#717171"
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {property.title}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        {property.city} • Hidden{" "}
                        {new Date(property.hiddenAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleUnhideProperty(property)}
                      disabled={unhidePropertyMutation.isLoading}
                    >
                      <MaterialIcons
                        name="visibility"
                        size={14}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Hidden Videos Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <MaterialIcons name="video-library" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>
                {t("settings.blockedContentDetails.hiddenVideos")}
              </Text>
              <Text style={styles.sectionCount}>
                {hiddenVideos.length} hidden
              </Text>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF5A5F" />
              <Text style={styles.loadingText}>
                {t(
                  "settings.blockedContentDetails.loadingHiddenVideos",
                  "Loading hidden videos..."
                )}
              </Text>
            </View>
          ) : hiddenVideos.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <MaterialIcons
                  name="play-circle-filled"
                  size={32}
                  color="#717171"
                />
              </View>
              <Text style={styles.emptyTitle}>
                {t(
                  "settings.blockedContentDetails.noHiddenVideos",
                  "No hidden videos"
                )}
              </Text>
              <Text style={styles.emptyDescription}>
                {t(
                  "settings.blockedContentDetails.noHiddenVideosDesc",
                  "Videos you hide won't appear in your feed"
                )}
              </Text>
            </View>
          ) : (
            <View style={styles.cardsContainer}>
              {hiddenVideos.map((video: BlockedVideo) => (
                <View key={video.id} style={styles.card}>
                  <View style={styles.cardContent}>
                    <View style={styles.cardImageContainer}>
                      {video.thumbnail ? (
                        <Image
                          source={{ uri: video.thumbnail }}
                          style={styles.cardImage}
                        />
                      ) : (
                        <View style={styles.cardImagePlaceholder}>
                          <MaterialIcons
                            name="play-circle-filled"
                            size={20}
                            color="#717171"
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {video.title}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        Hidden {new Date(video.hiddenAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleUnhideVideo(video)}
                      disabled={unhideVideoMutation.isLoading}
                    >
                      <MaterialIcons
                        name="visibility"
                        size={14}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  scrollView: {
    flex: 1
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF"
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#222222",
    marginBottom: 4,
    letterSpacing: -0.3
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#717171",
    lineHeight: 18
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF"
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF5A5F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  sectionTitleContainer: {
    flex: 1
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222222",
    marginBottom: 2,
    letterSpacing: -0.2
  },
  sectionCount: {
    fontSize: 12,
    color: "#717171",
    fontWeight: "600"
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24
  },
  loadingText: {
    fontSize: 13,
    color: "#717171",
    marginLeft: 8
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222222",
    marginBottom: 4
  },
  emptyDescription: {
    fontSize: 13,
    color: "#717171",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16
  },
  cardsContainer: {
    gap: 8
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 0,
    overflow: "hidden"
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  cardImageContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    overflow: "hidden"
  },
  cardImage: {
    width: "100%",
    height: "100%"
  },
  cardImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center"
  },
  cardInfo: {
    flex: 1,
    marginRight: 10
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#222222",
    marginBottom: 2,
    letterSpacing: -0.2
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#717171",
    lineHeight: 16
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 0
  },
  bottomPadding: {
    height: 64
  },
  authRequiredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40
  },
  authRequiredIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24
  },
  authRequiredTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 12,
    textAlign: "center"
  },
  authRequiredDescription: {
    fontSize: 16,
    color: "#717171",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24
  },
  loginButton: {
    backgroundColor: "#222222",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600"
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 40
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    marginTop: 16,
    marginBottom: 8
  },
  errorDescription: {
    fontSize: 16,
    color: "#717171",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F7F7F7"
  }
});
