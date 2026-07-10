import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Text,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { openSettings } from "expo-linking";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUser } from "../hooks/useUser";
import { useNotifications } from "../hooks/useNotifications";
import { useHostShareConsent } from "../hooks/useHostShareConsent";
import { hostShareConsentStorage } from "../constants/hostShareConsentStorage";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "../components/LanguageSelector";
import { useLanguageSelector } from "../hooks/useLanguageSelector";
import { AccountDeletionModal } from "../components/AccountDeletionModal";
import { useAccountDeletion } from "../hooks/useAccountDeletion";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import {
  useBrokerVerificationStatus,
  useUpdateBrokerProfileVisibility,
} from "../hooks/useBrokerVerification";
import { theme } from "../theme";

type SettingsItemProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  showChevron?: boolean;
  onPress?: () => void;
  isDanger?: boolean;
};

function SettingsItem({
  icon,
  title,
  subtitle,
  showChevron = true,
  onPress,
  isDanger = false,
}: SettingsItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={styles.itemContent}>
        <MaterialIcons
          name={icon}
          size={20}
          color={isDanger ? "#EF4444" : "#6B7280"}
          style={styles.itemIcon}
        />
        <View style={styles.itemText}>
          <Text style={[styles.itemTitle, isDanger && styles.dangerText]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.itemSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {showChevron && onPress ? (
        <MaterialIcons
          name="chevron-right"
          size={20}
          color={isDanger ? "#EF4444" : "#9CA3AF"}
        />
      ) : null}
    </TouchableOpacity>
  );
}

type SettingsToggleProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

function SettingsToggle({
  icon,
  title,
  subtitle,
  checked,
  onChange,
  disabled = false,
}: SettingsToggleProps) {
  return (
    <View style={styles.settingsItem}>
      <View style={styles.itemContent}>
        <MaterialIcons
          name={icon}
          size={20}
          color="#6B7280"
          style={styles.itemIcon}
        />
        <View style={styles.itemText}>
          <Text style={styles.itemTitle}>{title}</Text>
          {subtitle ? (
            <Text style={styles.itemSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <Switch
        value={checked}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: "#E5E7EB", true: "#EC4899" }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E5E7EB"
      />
    </View>
  );
}

type NotificationToggleProps = {
  title: string;
  subtitle: string;
  preferenceKey: keyof NotificationPreferences;
  preferences: NotificationPreferences;
  allowsNotifications: boolean;
  onChange: (key: keyof NotificationPreferences, value: boolean) => void;
  isLast?: boolean;
};

type NotificationPreferences = {
  reservations: boolean;
  messages: boolean;
  propertyUpdates: boolean;
  experienceBookings: boolean;
  videoInteractions: boolean;
  reminders: boolean;
};

function NotificationToggle({
  title,
  subtitle,
  preferenceKey,
  preferences,
  allowsNotifications,
  onChange,
  isLast = false,
}: NotificationToggleProps) {
  return (
    <View
      style={[styles.notificationToggle, !isLast && styles.notificationBorder]}
    >
      <View style={styles.notificationText}>
        <Text style={styles.notificationTitle}>{title}</Text>
        <Text style={styles.notificationSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={preferences[preferenceKey] && allowsNotifications}
        onValueChange={(checked) => onChange(preferenceKey, checked)}
        disabled={!allowsNotifications}
        trackColor={{
          false: "#E5E7EB",
          true: theme["color-temporary-primary"],
        }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E5E7EB"
      />
    </View>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.sectionCard}>{children}</View>;
}

export const AccountSettingsScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, setAllowsNotifications } = useUser();
  const { registerForPushNotificationsAsync } = useNotifications();
  const {
    showLanguageSelector,
    hideLanguageSelector,
    getCurrentLanguageName,
    isVisible,
  } = useLanguageSelector();
  const { deleteAccount, isDeleting } = useAccountDeletion();
  const navigation = useNavigation();
  const isLoggedIn = Boolean(user?.ID);
  const hostShareConsent = useHostShareConsent(isLoggedIn);
  const { data: brokerStatus } = useBrokerVerificationStatus(isLoggedIn);
  const updateBrokerProfileVisibility = useUpdateBrokerProfileVisibility();
  const isVerifiedBroker = !!brokerStatus?.is_verified;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>({
      reservations: true,
      messages: true,
      propertyUpdates: true,
      experienceBookings: true,
      videoInteractions: true,
      reminders: true,
    });
  const [isToggling, setIsToggling] = useState(false);

  const notificationsChanged = async (checked: boolean) => {
    if (isToggling || user?.allowsNotifications === checked) return;

    setIsToggling(true);

    try {
      if (!checked) {
        await setAllowsNotifications(false);
        return;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            t("accountSettings.permissionRequired", "Permission required"),
            t(
              "accountSettings.permissionRequiredMessage",
              "Allow notifications in your device settings to enable push alerts.",
            ),
            [
              { text: t("common.cancel", "Cancel") },
              {
                text: t("accountSettings.openSettings", "Open settings"),
                onPress: openSettings,
              },
            ],
          );
          return;
        }
      }

      await setAllowsNotifications(true);

      try {
        await registerForPushNotificationsAsync(false, false);
      } catch (tokenError) {
        console.error("Token generation failed:", tokenError);
      }
    } catch (error) {
      console.error("Notification toggle failed:", error);
      Alert.alert(
        t("accountSettings.notificationError", "Notification error"),
        t(
          "accountSettings.notificationErrorMessage",
          "Could not update notification settings. Please try again.",
        ),
        [{ text: t("common.ok", "OK") }],
      );
    } finally {
      setIsToggling(false);
    }
  };

  const updatePreference = (
    key: keyof NotificationPreferences,
    value: boolean,
  ) => {
    setNotificationPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const onBrokerProfileVisibilityToggle = async (checked: boolean) => {
    if (!isVerifiedBroker || updateBrokerProfileVisibility.isPending) return;
    try {
      await updateBrokerProfileVisibility.mutateAsync(checked);
    } catch {
      Alert.alert(
        t("common.error", "Error"),
        t(
          "broker.settingsSaveError",
          "Could not save your broker profile preference. Please try again.",
        ),
      );
    }
  };

  const onHostShareToggle = async (checked: boolean) => {
    if (!user?.ID || hostShareConsent.saving) return;
    try {
      await hostShareConsent.setConsent(checked);
      if (checked) {
        await hostShareConsentStorage.setToastDismissed(user.ID, false);
      }
    } catch {
      Alert.alert(
        t("common.error", "Error"),
        t(
          "hostShareConsent.saveError",
          "Could not save your choice. Please try again.",
        ),
      );
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const success = await deleteAccount();
      if (success) setShowDeleteModal(false);
    } catch (error) {
      console.error("Account deletion failed:", error);
    }
  };

  const clearStorageForTesting = async () => {
    Alert.alert(
      t("accountSettings.clearStorageTitle", "Clear storage for testing"),
      t(
        "accountSettings.clearStorageMessage",
        "This clears language and onboarding data. Continue?",
      ),
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        {
          text: t("accountSettings.clear", "Clear"),
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("appLanguage");
              await AsyncStorage.removeItem("hasSeenOnboarding");
              await AsyncStorage.removeItem("onboardingCompleted");
              Alert.alert(
                t("accountSettings.storageCleared", "Storage cleared"),
                t(
                  "accountSettings.storageClearedMessage",
                  "Restart the app to see changes.",
                ),
                [{ text: t("common.ok", "OK") }],
              );
            } catch {
              Alert.alert(
                t("common.error", "Error"),
                t(
                  "accountSettings.clearStorageError",
                  "Failed to clear storage.",
                ),
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t("common.back", "Back")}
        >
          <MaterialIcons name="arrow-back-ios" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("accountSettings.title", "Settings & privacy")}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>
          {t("accountSettings.sectionAccount", "Account")}
        </Text>
        <SectionCard>
          <SettingsItem
            icon="person-outline"
            title={t("common.personalInfo", "Personal information")}
            subtitle={t("common.editYourProfile", "Edit your profile")}
            onPress={() => (navigation as any).navigate("EditAccountInfo")}
          />
          <View style={styles.itemDivider} />
          <SettingsItem
            icon="phone"
            title={t("common.phoneNumber", "Phone number")}
            subtitle={
              user?.phoneNumber ||
              t(
                "common.addPhoneIfSignedUpWithEmail",
                "Add phone (if you signed up with email)",
              )
            }
            onPress={() => (navigation as any).navigate("EditAccountInfo")}
          />
          <View style={styles.itemDivider} />
          <SettingsItem
            icon="language"
            title={t("common.Language", "Language")}
            subtitle={getCurrentLanguageName()}
            onPress={showLanguageSelector}
          />
        </SectionCard>
        <Text style={styles.infoText}>
          {t(
            "accountSettings.languageHint",
            "Choose the language you prefer inside Meskeny.",
          )}
        </Text>

        {isLoggedIn ? (
          <>
            <Text style={styles.sectionLabel}>
              {t("accountSettings.sectionPrivacy", "Privacy")}
            </Text>
            <SectionCard>
              <SettingsToggle
                icon="verified-user"
                title={t(
                  "hostShareConsent.settingsTitle",
                  "Share with property hosts",
                )}
                subtitle={t(
                  "hostShareConsent.settingsSubtitle",
                  "Allow minimal profile sharing with one host at a time when your search matches a listing.",
                )}
                checked={hostShareConsent.accepted}
                onChange={onHostShareToggle}
                disabled={hostShareConsent.loading || hostShareConsent.saving}
              />
              {isVerifiedBroker ? (
                <>
                  <View style={styles.itemDivider} />
                  <SettingsToggle
                    icon="badge"
                    title={t(
                      "broker.showProfileOnListingsTitle",
                      "Show photo & name on listings",
                    )}
                    subtitle={t(
                      "broker.showProfileOnListingsSubtitle",
                      "When off, buyers still see your verified broker badge and ID on property and landmark pages.",
                    )}
                    checked={brokerStatus?.show_profile_on_listings !== false}
                    onChange={onBrokerProfileVisibilityToggle}
                    disabled={updateBrokerProfileVisibility.isPending}
                  />
                </>
              ) : null}
              <View style={styles.itemDivider} />
              <SettingsItem
                icon="block"
                title={t("common.blockedContent", "Blocked content")}
                subtitle={t(
                  "common.manageBlockedUsersAndContent",
                  "Manage blocked users and content",
                )}
                onPress={() =>
                  (navigation as any).navigate("BlockedContentScreen")
                }
              />
            </SectionCard>
          </>
        ) : null}

        <Text style={styles.sectionLabel}>
          {t("accountSettings.sectionNotifications", "Notifications")}
        </Text>
        <SectionCard>
          <SettingsToggle
            icon="notifications-none"
            title={t("common.pushNotifications", "Push notifications")}
            subtitle={t(
              "common.getImportantUpdatesAboutYourBookings",
              "Get important updates about your bookings",
            )}
            checked={!!user?.allowsNotifications && !isToggling}
            onChange={notificationsChanged}
            disabled={isToggling}
          />
          <View style={styles.itemDivider} />
          <SettingsItem
            icon="settings"
            title={t(
              "common.manageNotificationPermissions",
              "Manage permissions",
            )}
            subtitle={t(
              "common.viewNotificationPermissionScreen",
              "View notification settings",
            )}
            onPress={() =>
              (navigation as any).navigate("NotificationPermission")
            }
          />
        </SectionCard>

        {user?.allowsNotifications ? (
          <SectionCard>
            <Text style={styles.notificationCardTitle}>
              {t(
                "common.chooseWhatYouWantToBeNotifiedAbout",
                "Choose what you want to be notified about",
              )}
            </Text>
            <NotificationToggle
              title={t("common.reservationsAndTrips", "Reservations & trips")}
              subtitle={t(
                "common.bookingConfirmationsCheckInsAndUpdates",
                "Booking confirmations, check-ins and updates",
              )}
              preferenceKey="reservations"
              preferences={notificationPreferences}
              allowsNotifications={!!user?.allowsNotifications}
              onChange={updatePreference}
            />
            <NotificationToggle
              title={t("common.messages", "Messages")}
              subtitle={t(
                "common.messagesFromHostsAndGuests",
                "Messages from hosts and guests",
              )}
              preferenceKey="messages"
              preferences={notificationPreferences}
              allowsNotifications={!!user?.allowsNotifications}
              onChange={updatePreference}
            />
            <NotificationToggle
              title={t("common.propertyUpdates", "Property updates")}
              subtitle={t(
                "common.changesToYourListingsAndHosting",
                "Changes to your listings and hosting",
              )}
              preferenceKey="propertyUpdates"
              preferences={notificationPreferences}
              allowsNotifications={!!user?.allowsNotifications}
              onChange={updatePreference}
            />
            <NotificationToggle
              title={t("common.experiences", "Experiences")}
              subtitle={t(
                "common.activityBookingsAndUpdates",
                "Activity bookings and updates",
              )}
              preferenceKey="experienceBookings"
              preferences={notificationPreferences}
              allowsNotifications={!!user?.allowsNotifications}
              onChange={updatePreference}
            />
            <NotificationToggle
              title={t("common.videoInteractions", "Video interactions")}
              subtitle={t(
                "common.liveToursAndVirtualExperiences",
                "Live tours and virtual experiences",
              )}
              preferenceKey="videoInteractions"
              preferences={notificationPreferences}
              allowsNotifications={!!user?.allowsNotifications}
              onChange={updatePreference}
            />
            <NotificationToggle
              title={t("common.reminders", "Reminders")}
              subtitle={t(
                "common.importantDatesAndDeadlines",
                "Important dates and deadlines",
              )}
              preferenceKey="reminders"
              preferences={notificationPreferences}
              allowsNotifications={!!user?.allowsNotifications}
              onChange={updatePreference}
              isLast
            />
          </SectionCard>
        ) : null}

        {(user?.role === "admin" || user?.role === "super_admin") && (
          <>
            <Text style={styles.sectionLabel}>
              {t("accountSettings.sectionAdmin", "Admin")}
            </Text>
            <SectionCard>
              <SettingsItem
                icon="video-library"
                title={t(
                  "accountSettings.promotionalVideos",
                  "Promotional videos",
                )}
                subtitle={t(
                  "accountSettings.promotionalVideosSub",
                  "Manage app demo and tutorial videos",
                )}
                onPress={() =>
                  (navigation as any).navigate("AdminPromotionalVideos")
                }
              />
            </SectionCard>
          </>
        )}

        {__DEV__ ? (
          <>
            <Text style={styles.sectionLabel}>
              {t("accountSettings.sectionDeveloper", "Developer")}
            </Text>
            <SectionCard>
              <SettingsItem
                icon="developer-mode"
                title={t("common.resetAppState", "Reset app state")}
                subtitle={t(
                  "common.clearLanguageAndOnboardingData",
                  "Clear language and onboarding data",
                )}
                onPress={clearStorageForTesting}
              />
            </SectionCard>
          </>
        ) : null}

        <Text style={styles.sectionLabel}>
          {t("accountSettings.sectionAccountManagement", "Account management")}
        </Text>
        <SectionCard>
          <SettingsItem
            icon="delete-outline"
            title={t("common.deleteAccount", "Delete account")}
            subtitle={t(
              "common.permanentlyDeleteYourAccountAndAllData",
              "Permanently delete your account and all data",
            )}
            onPress={() => setShowDeleteModal(true)}
            isDanger
            showChevron={false}
          />
        </SectionCard>
        <Text style={styles.dangerHint}>
          {t(
            "common.thisActionCannotBeUndoneAllYourBookingsMessagesAndAccountDataWillBePermanentlyDeleted",
            "This action cannot be undone. All your bookings, messages and account data will be permanently deleted.",
          )}
        </Text>

        <View style={styles.supportBox}>
          <MaterialIcons name="support-agent" size={18} color="#9CA3AF" />
          <Text style={styles.supportText}>{t("common.needHelp", "Need help?")}</Text>
        </View>
      </ScrollView>

      <LanguageSelector visible={isVisible} onClose={hideLanguageSelector} />
      <AccountDeletionModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeleting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  sectionCard: {
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D1D5DB",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  itemDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
    marginLeft: 46,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  itemIcon: {
    marginRight: 12,
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  itemSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
    lineHeight: 17,
  },
  dangerText: {
    color: "#EF4444",
  },
  infoText: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  notificationCardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  notificationToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  notificationBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  notificationText: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  notificationSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    lineHeight: 17,
  },
  dangerHint: {
    fontSize: 12,
    color: "#B91C1C",
    lineHeight: 18,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  supportBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 8,
  },
  supportText: {
    fontSize: 14,
    color: "#6B7280",
  },
});
