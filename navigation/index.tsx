/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  NavigationContainer,
  DefaultTheme,
  useNavigationContainerRef,
  useNavigation,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { KeyboardProvider } from "react-native-keyboard-controller";
// Removed shared element import
import * as React from "react";
import {
  ColorSchemeName,
  Pressable,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { notificationHandler } from "../utils/notificationHandler";
import { NotificationPermissionManager } from "../components/NotificationPermissionManager";

import { AccountScreen } from "../screens/AccountScreen";
import { UserProfileScreen } from "../screens/UserProfileScreen";
import { SavedScreen } from "../screens/SavedScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { TestScreen } from "../screens/TestScreen";
import { MeskenyGPTLandingScreen } from "../screens/MeskenyGPTLandingScreen";
import { AIChatScreen } from "../screens/AIChatScreen";
import { SearchValueModalScreen } from "../screens/SearchValueModalScreen";
import ContactHostReviewScreen from "../screens/ContactHostReviewScreen";
import { FindLocationsScreen } from "../screens/FindLocationsScreen";
import { SignInScreen } from "../screens/SignInScreen";
import { SignUpScreen } from "../screens/SignUpScreen";
import { SignInPhoneScreen } from "../screens/SignInPhoneScreen";
import { SignUpPhoneScreen } from "../screens/SignUpPhoneScreen";
import { UnifiedAuthScreen } from "../screens/UnifiedAuthScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";
import { ResetPasswordScreen } from "../screens/ResetPasswordScreen";
import { MessagePropertyScreen } from "../screens/MessagePropertyScreen";
import { InboxScreen } from "../screens/InboxScreen";
import {
  AccountTabParamList,
  RootStackParamList,
  RootTabParamList,
  RootTabScreenProps,
} from "../types";
import LinkingConfiguration from "./LinkingConfiguration";
import { theme } from "../theme";
import { SPLASH_BACKGROUND_COLOR } from "../constants";
import { PropertyDetailsScreen } from "../screens/PropertyDetailsScreen";
import { PropertySaleDetailsScreen } from "../screens/PropertySaleDetailsScreen";
import { PropertySaleGoldInsightsScreen } from "../screens/PropertySaleGoldInsightsScreen";
import { ListingGuideScreen } from "../screens/ListingGuideScreen";
import { MyGuideFeedScreen } from "../screens/MyGuideFeedScreen";
import { PropertySaleDetailsScreenNew } from "../screens/PropertySaleDetailsScreenNew";
import { PropertySaleRequestTourScreen } from "../screens/PropertySaleRequestTourScreen";
import PropertySaleMakeOfferScreen from "../screens/PropertySaleMakeOfferScreen";
import { ContactAgentModalScreen } from "../screens/ContactAgentModalScreen";
import { CreateLandmarkScreen } from "../screens/CreateLandmarkScreen";
import { EditLandmarkScreen } from "../screens/EditLandmarkScreen";
import { LandmarkDetailsScreen } from "../screens/LandmarkDetailsScreen";
import LandmarkGuidanceScreen from "../screens/LandmarkGuidanceScreen";
import AddListingGuideScreen from "../screens/AddListingGuideScreen";
import { PropertyAmenitiesScreen } from "../screens/PropertyAmenitiesScreen";
import { AddPropertyScreen } from "../screens/AddPropertyScreen";
import { EditPropertyScreen } from "../screens/EditPropertyScreen";
import { EditPropertyStepScreen } from "../screens/EditPropertyStepScreen";
import { MyPropertiesScreen } from "../screens/MyPropertiesScreen";
import { CreateOrganizationScreen } from "../screens/CreateOrganizationScreen";
import { OrganizationDashboardScreen } from "../screens/OrganizationDashboardScreen";
import { EditOrganizationScreen } from "../screens/EditOrganizationScreen";
import { CreatePropertySaleScreen } from "../screens/CreatePropertySaleScreen";
import { EditPropertySaleScreen } from "../screens/EditPropertySaleScreen";
import { OrganizationsTabScreen } from "../screens/OrganizationsTabScreen";
import { LeaveAgencyScreen } from "../screens/LeaveAgencyScreen";
import { ManageUnitsScreen } from "../screens/ManageUnitsScreen";
import { ReviewScreen } from "../screens/ReviewScreen";
import { useNotifications } from "../hooks/useNotifications";
import { useUser } from "../hooks/useUser";
import { runPushDeviceRegistrationCheck } from "../services/pushDeviceRegistration";
import { AccountSettingsScreen } from "../screens/AccountSettingsScreen";
import { EditAccountInfoScreen } from "../screens/EditAccountInfoScreen";
import { MyStoriesScreen } from "../screens/MyStoriesScreen";
import { BlockedContentScreen } from "../screens/BlockedContentScreen";
import { ConversationsScreen } from "../screens/ConversationsScreen";
import { MessagesScreen } from "../screens/MessagesScreen";
import { DirectMessageScreen } from "../screens/DirectMessageScreen";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { ProfileCreationScreen } from "../screens/ProfileCreationScreen";
import { ProfileVerificationScreen } from "../screens/ProfileVerificationScreen";
import { BrokerVerificationScreen } from "../screens/BrokerVerificationScreen";
import { HostDashboardScreen } from "../screens/HostDashboardScreen";
import { HostListingStudioScreen } from "../screens/HostListingStudioScreen";
import HostSuggestionsScreen from "../screens/HostSuggestionsScreen";
import { HostCalendarScreen } from "../screens/HostCalendarScreen";
import { HostReservationsScreen } from "../screens/HostReservationsScreen";
import { UserTripsScreen } from "../screens/UserTripsScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { VideoFeedScreen } from "../screens/VideoFeedScreen";
import { LikedVideosScreen } from "../screens/LikedVideosScreen";
import { SavedVideosScreen } from "../screens/SavedVideosScreen";
import { CollectionDetailsScreen } from "../screens/CollectionDetailsScreen";
import { useHostMode } from "../contexts/HostModeContext";
import { useUnreadReservationCount } from "../hooks/useUnreadReservationCount";
import { useUnreadMessageCount } from "../hooks/useUnreadMessageCount";
import { useVideoViewTracking } from "../hooks/useVideoViewTracking";
import { ModeTransitionScreen } from "../components/ModeTransitionScreen";
import StoryViewer from "../components/StoryViewer";
import { useStoryViewer } from "../contexts/StoryViewerContext";
import { VideoUploadScreen } from "../screens/VideoUploadScreen";
import { ExperienceCreationScreen } from "../screens/ExperienceCreationScreen";
import { HostExperiencesScreen } from "../screens/HostExperiencesScreen";
import { ProfessionalExperienceDetailsScreen } from "../screens/ProfessionalExperienceDetailsScreen";
import { ExperienceEditScreen } from "../screens/ExperienceEditScreen";
import { ExperienceBookingConfirmationScreen } from "../screens/ExperienceBookingConfirmationScreen";
import { GroupInviteScreen } from "../screens/GroupInviteScreen";
import GroupOnboardingScreen from "../screens/GroupOnboardingScreen";
import GroupCreateScreen from "../screens/GroupCreateScreen";
import GroupMembersScreen from "../screens/GroupMembersScreen";
import MyGroupsScreen from "../screens/MyGroupsScreen";
import GroupChatScreen from "../screens/GroupChatScreen";
import GroupWishlistScreen from "../screens/GroupWishlistScreen";
import GroupSearchScreen from "../screens/GroupSearchScreen";
import { LocationSearchScreen } from "../screens/LocationSearchScreen";
import { PropertyReservationScreen } from "../screens/PropertyReservationScreen";
import { ContactHostScreen } from "../screens/ContactHostScreen";
import ReservationConfirmationScreen from "../screens/ReservationConfirmationScreen";
import TripDetailsScreen from "../screens/TripDetailsScreen";

import {
  House,
  FilmSlate,
  Airplane,
  Heart,
  UserCircle,
  Play,
  ChatCircle,
  ChatCenteredIcon,
  HouseLineIcon,
  UserCheckIcon,
  UserCircleIcon,
  TicketIcon,
  ClipboardTextIcon,
  CalendarDotsIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  UserCheck,
} from "phosphor-react-native";
import HostReservationDetailsScreen from "../screens/HostReservationDetailsScreen";
import FeedbackScreen from "../screens/FeedbackScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import TermsOfServiceScreen from "../screens/TermsOfServiceScreen";
import AboutUsScreen from "../screens/AboutUsScreen";
import WelcomeScreen from "../components/WelcomeScreen";
import TestMap from "../components/TestMap";
import NotificationScreen from "../components/NScreen";
import FilterSheet from "../screens/FilterScreen";
import PropertySaleFilterScreen from "../screens/PropertySaleFilterScreen";
import BedroomsFilterScreen from "../screens/BedroomsFilterScreen";
import BathroomsFilterScreen from "../screens/BathroomsFilterScreen";
import YearBuiltFilterScreen from "../screens/YearBuiltFilterScreen";
import RoomsFilterScreen from "../screens/RoomsFilterScreen";
import CityZoneFilterScreen from "../screens/CityZoneFilterScreen";
import { VideoCommentsScreen } from "../screens/VideoCommentsScreen";
import { PropertySaleVideoCommentsScreen } from "../screens/PropertySaleVideoCommentsScreen";
import { AdminPromotionalVideosScreen } from "../screens/AdminPromotionalVideosScreen";
import { AdminCrashLogsScreen } from "../screens/AdminCrashLogsScreen";
import { NotificationPermissionScreen } from "../screens/NotificationPermissionScreen";
import { AddPropertyOrLandScreen } from "../screens/AddPropertyOrLandScreen";
import { ChoosePropertyOrLandTypeScreen } from "../screens/ChoosePropertyOrLandTypeScreen";
import { PremiumAIButton } from "../components/PremiumAIButton";
import { api } from "../services/api";
import { messagingWs } from "../services/messagingWs";
import { prefetchMessagingInbox } from "../services/messagingInboxPrefetch";
// import { AdminPropertySalesScreen } from "../screens/AdminPropertySalesScreen";

// Global navigation ref for button navigation
import { setRootNavigationRef } from "./rootNavigation";

/** Root window tint — matches native splash so there is no dark flash behind stacks */
const RootNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: SPLASH_BACKGROUND_COLOR,
  },
};

export default function Navigation({
  colorScheme,
}: {
  colorScheme: ColorSchemeName;
}) {
  const { isHostMode, isTransitioning } = useHostMode();
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    setRootNavigationRef(navigationRef);
    return () => setRootNavigationRef(null);
  }, [navigationRef]);

  useEffect(() => {
    // CRITICAL: Wrap in try-catch to prevent crashes
    try {
      // Setup notification handlers
      notificationHandler.setNavigation(navigationRef);
      notificationHandler.setupNotificationHandlers();

      // Handle initial notification if app was opened from notification
      notificationHandler.handleInitialNotification();
    } catch (error) {
      console.error("❌ Failed to setup notification handlers:", error);
    }
  }, [navigationRef]); // CRITICAL: Include navigationRef in dependencies

  return (
    <View style={{ flex: 1, backgroundColor: SPLASH_BACKGROUND_COLOR }}>
      <KeyboardProvider>
        <NavigationContainer
          ref={navigationRef}
          linking={LinkingConfiguration}
          theme={RootNavigationTheme}
        >
          <RootNavigator />
        </NavigationContainer>
      </KeyboardProvider>
      {/* Global Mode Transition Screen - covers entire app */}
      {isTransitioning && (
        <ModeTransitionScreen
          isHostMode={isHostMode}
          onComplete={() => {
            // Transition completed, the screen will automatically hide
          }}
        />
      )}
    </View>
  );
}

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { handleNotificationResponse } = useNotifications();
  const { user, addPushToken } = useUser();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set notification handler first (no async, safe to call multiple times)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Set up notification response listener
    const responseListener =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse,
      );

    // Register for push notifications ONLY if:
    // 1. User is authenticated (user exists)
    // 2. User explicitly allows notifications (allowsNotifications === true)
    // 3. User has a valid ID
    // 4. Permission is ALREADY granted (never request permission automatically)
    // This prevents notification requests for unauthenticated users and prevents auto-requesting
    const registerTimer = setTimeout(async () => {
      if (user && user.ID && user.allowsNotifications === true) {
        // CRITICAL: Check permission status FIRST before attempting registration
        // Never request permission automatically - only register if already granted
        try {
          const { status } = await Notifications.getPermissionsAsync();
          if (status === "granted") {
            console.log(
              "📱 Auto-registering notifications for authenticated user (permission already granted):",
              user.ID,
            );
            runPushDeviceRegistrationCheck(user, addPushToken).catch(
              (error) => {
                console.warn(
                  "⚠️ Auto-registration failed (non-critical):",
                  error,
                );
              },
            );
          } else {
            console.log(
              "⏭️ Skipping auto-registration - permission not granted yet:",
              {
                status,
                userId: user.ID,
                allowsNotifications: user.allowsNotifications,
                message:
                  "User must grant permission via NotificationPermissionScreen first",
              },
            );
          }
        } catch (error) {
          console.warn(
            "⚠️ Failed to check permission status for auto-registration:",
            error,
          );
        }
      } else {
        console.log("⏭️ Skipping notification registration:", {
          hasUser: !!user,
          hasUserId: !!(user && user.ID),
          allowsNotifications: user?.allowsNotifications,
          reason: !user
            ? "No user"
            : !user.ID
              ? "No user ID"
              : user.allowsNotifications !== true
                ? "Notifications not allowed"
                : "Unknown",
        });
      }
    }, 2000); // Increased delay to ensure app is fully initialized

    return () => {
      clearTimeout(registerTimer);
      if (responseListener) {
        responseListener.remove();
      }
    };
  }, [user]); // Re-run if user changes

  // Prewarm unread/message data as soon as user session is available.
  // This makes bottom-tab badge and inbox state appear immediately on app mount.
  useEffect(() => {
    if (!user?.ID || !user?.accessToken) return;

    // Ensure ws is connected early so unread invalidations arrive in real time.
    messagingWs.connect(user.accessToken);

    void prefetchMessagingInbox(queryClient, {
      ID: user.ID,
      accessToken: user.accessToken,
    });
  }, [queryClient, user?.ID, user?.accessToken]);

  return (
    <>
      <Stack.Navigator>
        <Stack.Screen
          name="Root"
          component={BottomTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PropertySaleFilter"
          component={PropertySaleFilterScreen}
          options={{
            sheetCornerRadius: 30,
            presentation: "formSheet",
            sheetAllowedDetents: "all",
            headerShown: false,
            sheetExpandsWhenScrolledToEdge: true,
          }}
        />
        <Stack.Screen
          name="BedroomsFilter"
          component={BedroomsFilterScreen}
          options={{
            sheetCornerRadius: 30,
            presentation: "formSheet",
            sheetAllowedDetents: "all",
            headerShown: false,
            sheetExpandsWhenScrolledToEdge: true,
          }}
        />
        <Stack.Screen
          name="BathroomsFilter"
          component={BathroomsFilterScreen}
          options={{
            sheetCornerRadius: 30,
            presentation: "formSheet",
            sheetAllowedDetents: "all",
            headerShown: false,
            sheetExpandsWhenScrolledToEdge: true,
          }}
        />
        <Stack.Screen
          name="YearBuiltFilter"
          component={YearBuiltFilterScreen}
          options={{
            sheetCornerRadius: 30,
            presentation: "formSheet",
            sheetAllowedDetents: "all",
            sheetGrabberVisible: true,
            headerShown: false,
            sheetExpandsWhenScrolledToEdge: true,
          }}
        />
        <Stack.Screen
          name="RoomsFilter"
          component={RoomsFilterScreen}
          options={{
            sheetCornerRadius: 30,
            presentation: "formSheet",
            sheetAllowedDetents: "all",
            sheetGrabberVisible: true,
            headerShown: false,
            sheetExpandsWhenScrolledToEdge: true,
          }}
        />
        <Stack.Screen
          name="CityZoneFilter"
          component={CityZoneFilterScreen}
          options={{
            sheetCornerRadius: 30,
            presentation: "formSheet",
            sheetAllowedDetents: "all",
            headerShown: false,
            sheetExpandsWhenScrolledToEdge: true,
          }}
        />
        <Stack.Screen
          name="VideoComments"
          component={VideoCommentsScreen}
          options={{
            sheetCornerRadius: 30,
            presentation: "formSheet",
            sheetAllowedDetents: "all",
            headerShown: false,
            sheetExpandsWhenScrolledToEdge: true,
          }}
        />
        <Stack.Screen
          name="PropertySaleVideoComments"
          component={PropertySaleVideoCommentsScreen}
          options={{
            sheetCornerRadius: 30,
            presentation: "formSheet",
            sheetAllowedDetents: "all",
            headerShown: false,
            sheetExpandsWhenScrolledToEdge: true,
          }}
        />
        <Stack.Screen
          name="DirectMessage"
          component={DirectMessageScreen}
          options={{ headerShown: false }}
        />
        {/* PropertyAmenities not in RootStackParamList; hidden from stack to satisfy types */}
        {/* PropertySaleDetails not in RootStackParamList; open via its actual route if needed */}
        {/* Inbox is a bottom tab, not a stack screen */}
        {/* AdminPropertySales screen temporarily disabled (screen not implemented) */}

        <Stack.Group screenOptions={{}}>
          <Stack.Screen
            name="FindLocations"
            component={FindLocationsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UnifiedAuth"
            component={UnifiedAuthScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignInPhone"
            component={SignInPhoneScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUpPhone"
            component={SignUpPhoneScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ResetPassword"
            component={ResetPasswordScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PropertyDetails"
            component={PropertyDetailsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PropertySaleRequestTour"
            component={PropertySaleRequestTourScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PropertySaleMakeOffer"
            component={PropertySaleMakeOfferScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ContactAgentModal"
            component={ContactAgentModalScreen}
            options={{
              presentation: "transparentModal",
              animation: "none",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="CreateLandmark"
            component={CreateLandmarkScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditLandmark"
            component={EditLandmarkScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LandmarkDetails"
            component={LandmarkDetailsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LandmarkGuidance"
            component={LandmarkGuidanceScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddListingGuide"
            component={AddListingGuideScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MessageProperty"
            component={MessagePropertyScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddProperty"
            component={AddPropertyScreen}
            options={{ headerShown: false }}
          />
          {/* Remove screens not present in RootStackParamList to satisfy types */}
          <Stack.Screen
            name="EditProperty"
            component={EditPropertyScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditPropertyStep"
            component={EditPropertyStepScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MyProperties"
            component={MyPropertiesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ManageUnits"
            component={ManageUnitsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Review"
            component={ReviewScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProfileCreation"
            component={ProfileCreationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProfileVerification"
            component={ProfileVerificationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="BrokerVerification"
            component={BrokerVerificationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CollectionDetails"
            component={CollectionDetailsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VideoUpload"
            component={VideoUploadScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LikedVideos"
            component={LikedVideosScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SavedVideos"
            component={SavedVideosScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ExperienceCreation"
            component={ExperienceCreationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HostExperiences"
            component={HostExperiencesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ExperienceDetails"
            component={ProfessionalExperienceDetailsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ExperienceEdit"
            component={ExperienceEditScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ExperienceBookingConfirmation"
            component={ExperienceBookingConfirmationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GroupOnboarding"
            component={GroupOnboardingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GroupCreate"
            component={GroupCreateScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GroupInvite"
            component={GroupInviteScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GroupMembers"
            component={GroupMembersScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MyGroups"
            component={MyGroupsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GroupChat"
            component={GroupChatScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GroupWishlist"
            component={GroupWishlistScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GroupSearch"
            component={GroupSearchScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LocationSearch"
            component={LocationSearchScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PropertyReservation"
            component={PropertyReservationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ContactHost"
            component={ContactHostScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ReservationConfirmation"
            component={ReservationConfirmationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TripDetails"
            component={TripDetailsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HostReservationDetails"
            component={HostReservationDetailsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Saved"
            component={SavedScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Feedback"
            component={FeedbackScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PrivacyPolicy"
            component={PrivacyPolicyScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TermsOfService"
            component={TermsOfServiceScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AboutUs"
            component={AboutUsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Settings"
            component={AccountSettingsScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="EditAccountInfo"
            component={EditAccountInfoScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MyStories"
            component={MyStoriesScreen}
            options={{
              presentation: "modal",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="BlockedContentScreen"
            component={BlockedContentScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="UserProfileScreen"
            component={UserProfileScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="CreatePropertySale"
            component={CreatePropertySaleScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditPropertySale"
            component={EditPropertySaleScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PropertySaleDetails"
            component={PropertySaleDetailsScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="PropertySaleGoldInsights"
            component={PropertySaleGoldInsightsScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="ListingGuide"
            component={ListingGuideScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MyGuideFeed"
            component={MyGuideFeedScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HostListingStudio"
            component={HostListingStudioScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PropertyAmenities"
            component={PropertyAmenitiesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CreateOrganization"
            component={CreateOrganizationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OrganizationDashboard"
            component={OrganizationDashboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditOrganization"
            component={EditOrganizationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LeaveAgency"
            component={LeaveAgencyScreen}
            options={{
              presentation: "modal",
              headerShown: false,
              animation:
                Platform.OS === "ios" ? "default" : "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TestMap"
            component={TestMap}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NScreen"
            component={NotificationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Filter"
            component={FilterSheet}
            options={{
              sheetCornerRadius: 30,
              presentation: "formSheet",
              sheetAllowedDetents: "all",
              headerShown: false,
              sheetExpandsWhenScrolledToEdge: true,
            }}
          />
          <Stack.Screen
            name="SearchValueModal"
            component={SearchValueModalScreen}
            options={{
              sheetCornerRadius: 30,
              presentation: "formSheet",
              sheetAllowedDetents: "all",
              headerShown: false,
              sheetExpandsWhenScrolledToEdge: true,
              sheetGrabberVisible: true,
            }}
          />
          <Stack.Screen
            name="NotificationPermission"
            component={NotificationPermissionScreen}
            options={{
              presentation: "fullScreenModal",
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="AddPropertyOrLand"
            component={AddPropertyOrLandScreen}
            options={{
              sheetCornerRadius: 30,
              presentation: "formSheet",
              headerShown: false,
              sheetExpandsWhenScrolledToEdge: true,
              sheetGrabberVisible: true,
            }}
          />
          <Stack.Screen
            name="ChoosePropertyOrLandType"
            component={ChoosePropertyOrLandTypeScreen}
            options={{
              sheetCornerRadius: 30,
              presentation: "formSheet",
              headerShown: false,
              sheetExpandsWhenScrolledToEdge: true,
              sheetGrabberVisible: true,
            }}
          />
          <Stack.Screen
            name="ContactHostReview"
            component={ContactHostReviewScreen}
            options={{
              presentation: "fullScreenModal",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="AdminPromotionalVideos"
            component={AdminPromotionalVideosScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TestScreen"
            component={TestScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MeskenyGPTLanding"
            component={MeskenyGPTLandingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AIChatScreen"
            component={AIChatScreen}
            options={{ headerShown: false }}
          />
        </Stack.Group>
      </Stack.Navigator>
      {/* Global StoryViewer - covers entire screen including bottom tabs */}
      <GlobalStoryViewer />
      {/* DISABLED: Never show notification permission modal automatically on app entry */}
      {/* <NotificationPermissionManager /> */}
    </>
  );
}

// Global StoryViewer component that overlays everything including bottom tabs
function GlobalStoryViewer() {
  const { viewerOpen, viewerData, closeViewer } = useStoryViewer();

  if (!viewerOpen || !viewerData) {
    return null;
  }

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        elevation: 99999,
        pointerEvents: viewerOpen ? "auto" : "none",
      }}
    >
      <StoryViewer
        username={viewerData.username}
        avatarURL={viewerData.avatarURL}
        clips={viewerData.clips}
        origin={viewerData.origin}
        onClose={closeViewer}
        onStoryViewed={viewerData.onViewed}
      />
    </View>
  );
}

/**
 * A bottom tab navigator displays tab buttons on the bottom of the display to switch screens.
 * https://reactnavigation.org/docs/bottom-tab-navigator
 */

const BottomTab = createBottomTabNavigator<RootTabParamList>();

function BottomTabNavigator() {
  const { isHostMode, isLoading, isTransitioning } = useHostMode();
  const { t } = useTranslation();
  const { unreadCount } = useUnreadMessageCount();
  const { unreadCount: unreadReservationCount } = useUnreadReservationCount();
  const { hasUnseenVideos, unseenCount, newestVideoPreview } =
    useVideoViewTracking();

  if (isLoading) {
    // Show loading state or default user tabs
    return (
      <BottomTab.Navigator
        key="loading-mode"
        initialRouteName="Search"
        screenOptions={{
          tabBarActiveTintColor: theme["color-primary-500"],
          lazy: true,
        }}
      >
        <BottomTab.Screen
          name="Search"
          component={SearchScreen}
          options={{
            headerShown: true,
            header: () => null, // Custom header handled in SearchScreen
            tabBarLabel: t("navigation.search", "Search"),
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="magnify" color={color} />
            ),
          }}
        />
        {/* <BottomTab.Screen
          name="Saved"
          component={SavedScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="heart-outline" color={color} />
            ),
          }}
        /> */}
        <BottomTab.Screen
          name="AccountRoot"
          component={AccountStack}
          options={{
            headerShown: false,
            tabBarLabel: t("navigation.profile", "Account"),
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="account-circle-outline" color={color} />
            ),
          }}
        />
      </BottomTab.Navigator>
    );
  }

  if (isHostMode) {
    // Host Mode Tabs
    return (
      <BottomTab.Navigator
        key="host-mode"
        initialRouteName="HostDashboard"
        screenOptions={{
          tabBarActiveTintColor: theme["color-temporary-primary"],
          lazy: true,
        }}
      >
        <BottomTab.Screen
          name="HostDashboard"
          component={HostDashboardScreen}
          options={{
            headerShown: false,
            tabBarLabel: t("dashboard.headerTitle", "Dashboard"),
            tabBarIcon: ({ color }) => <ClipboardTextIcon color={color} />,
          }}
        />
        {/* <BottomTab.Screen
          name="HostCalendar"
          component={HostCalendarScreen}
          options={{
            headerShown: false,
            tabBarLabel: "Calendrier",
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="calendar" color={color} />
            ),
          }}
        /> */}
        {/* <BottomTab.Screen
          name="HostReservations"
          component={HostReservationsScreen}
          options={{
            headerShown: false,
            tabBarLabel: t('reservations.title', 'Reservations'),
            tabBarBadge: unreadReservationCount > 0 ? unreadReservationCount : undefined,
            tabBarIcon: ({ color }) => (
              <TicketIcon  color={color} />
            ),
          }}
        /> */}
        <BottomTab.Screen
          name="MyProperties"
          component={MyPropertiesScreen}
          options={{
            headerShown: false,
            tabBarLabel: t("organization.tabs.properties", "Properties"),
            tabBarIcon: ({ color }) => <HouseLineIcon color={color} />,
          }}
        />
        <BottomTab.Screen
          name="HostSuggestions"
          component={HostSuggestionsScreen}
          options={{
            headerShown: false,
            tabBarLabel: t("hostSuggestions.tab", "Suggestions"),
            tabBarIcon: ({ color }) => (
              <UserCheck size={20} color={color} weight="duotone" />
            ),
          }}
        />
        <BottomTab.Screen
          name="Organizations"
          component={OrganizationsTabScreen}
          options={{
            headerShown: false,
            tabBarLabel: t("organization.tabTitle", "Organizations"),
            tabBarIcon: ({ color }) => (
              <BuildingOfficeIcon size={20} color={color} />
            ),
          }}
        />
        <BottomTab.Screen
          name="AccountRoot"
          component={AccountStack}
          options={{
            headerShown: false,
            tabBarLabel: t("navigation.profile", "Account"),
            tabBarIcon: ({ color }) => <UserCircleIcon color={color} />,
          }}
        />
      </BottomTab.Navigator>
    );
  }

  // User Mode Tabs
  // return (
  //   <BottomTab.Navigator
  //     key="user-mode"
  //     initialRouteName="Search"
  //     screenOptions={{
  //       tabBarActiveTintColor: theme["color-primary-500"],
  //     }}
  //   >
  //     <BottomTab.Screen
  //       name="Search"
  //       component={SearchScreen}
  //       options={{
  //         headerShown: false,
  //         tabBarLabel: "Accueil",
  //         tabBarIcon: ({ color }) => (
  //           <TabBarIcon name="home" color={color} />
  //         ),
  //       }}
  //     />
  //     <BottomTab.Screen
  //       name="Videos"
  //       component={VideoFeedScreen}
  //       options={{
  //         headerShown: false,
  //         tabBarLabel: "Vidéos",
  //         tabBarIcon: ({ color }) => (
  //           <TabBarIcon name="movie-open-outline" color={color} />
  //         ),
  //       }}
  //     />
  //     <BottomTab.Screen
  //       name="UserTrips"
  //       component={UserTripsScreen}
  //       options={{
  //         headerShown: false,
  //         tabBarLabel: "Voyages",
  //         tabBarIcon: ({ color }) => (
  //           <TabBarIcon name="airplane" color={color} />
  //         ),
  //       }}
  //     />
  //     <BottomTab.Screen
  //       name="Saved"
  //       component={SavedScreen}
  //       options={{
  //         headerShown: false,
  //         tabBarLabel: "Favoris",
  //         tabBarIcon: ({ color }) => (
  //           <TabBarIcon name="heart-outline" color={color} />
  //         ),
  //       }}
  //     />
  //     <BottomTab.Screen
  //       name="AccountRoot"
  //       component={AccountStack}
  //       options={{
  //         headerShown: false,
  //         tabBarLabel: "Compte",
  //         tabBarIcon: ({ color }) => (
  //           <TabBarIcon name="account-circle-outline" color={color} />
  //         ),
  //       }}
  //     />
  //   </BottomTab.Navigator>
  // );
  return (
    <BottomTab.Navigator
      key="user-mode"
      initialRouteName="Search"
      screenOptions={{
        tabBarActiveTintColor: theme["color-temporary-primary"], // Active: theme color
        tabBarInactiveTintColor: "#A0A0A0", // Inactive: gray
        lazy: true,
      }}
    >
      <BottomTab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          headerShown: false,
          tabBarLabel: t("navigation.home", "Home"),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
          tabBarIcon: ({ color }) => (
            <MagnifyingGlassIcon size={28} color={color} weight="duotone" />
          ),
        }}
      />
      <BottomTab.Screen
        name="Videos"
        component={VideoFeedScreen}
        options={{
          tabBarActiveTintColor: "#FFFFFF",
          headerShown: false,
          tabBarLabel: t("Bottomtabs.videos"),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
          tabBarBadge: undefined, // We use custom badge component instead
          tabBarIcon: ({ color }) => {
            // Dynamic import to avoid circular dependencies
            const {
              AnimatedVideoTabIcon,
            } = require("../components/AnimatedVideoTabIcon");
            const { VideoTabBadge } = require("../components/VideoTabBadge");
            return (
              <View style={{ position: "relative", width: 28, height: 28 }}>
                <AnimatedVideoTabIcon
                  color={color}
                  hasUnseenVideos={hasUnseenVideos}
                  previewVideoUrl={newestVideoPreview?.video_url}
                  previewThumbnailUrl={newestVideoPreview?.thumbnail_url}
                />
                {hasUnseenVideos && <VideoTabBadge count={unseenCount || 1} />}
              </View>
            );
          },
          tabBarStyle: {
            backgroundColor: "#000",
          },
        }}
      />

      <BottomTab.Screen
        name="Saved"
        component={SavedScreen}
        options={{
          headerShown: false,
          tabBarLabel: t("navigation.saved"),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
          tabBarIcon: ({ color }) => (
            <Heart size={28} color={color} weight="duotone" />
          ),
        }}
      />
      <BottomTab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{
          headerShown: false,
          tabBarLabel: t("inbox.title"),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
            tabBarBadge:
              unreadCount > 0
                ? unreadCount > 99
                  ? t("common.badgeOverflow", "99+")
                  : unreadCount
                : undefined,
            tabBarBadgeStyle:
              unreadCount > 0
                ? {
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    paddingHorizontal: 4,
                    backgroundColor: "#FF3B30",
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: "700",
                    position: "absolute",
                    top: 2,
                    right: 14,
                  }
                : undefined,
          tabBarIcon: ({ color }) => (
            <ChatCenteredIcon size={28} color={color} weight="duotone" />
          ),
        }}
      />
      <BottomTab.Screen
        name="AccountRoot"
        component={AccountStack}
        options={({ route }) => {
          const nested = getFocusedRouteNameFromRoute(route) ?? "Account";
          return {
            headerShown: false,
            tabBarLabel: t("navigation.profile"),
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: "500",
            },
            tabBarIcon: ({ color }) => (
              <UserCircle size={28} color={color} weight="duotone" />
            ),
          };
        }}
      />
      {/* <BottomTab.Screen
        name="CustomButton"
        component={() => <View />}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            console.log('Custom button pressed!');
          },
        }}
        options={{
          headerShown: false,
          tabBarLabel: '',
          tabBarIcon: () => null,
          tabBarButton: () => {
            return (
              <PremiumAIButton
                onPress={() => {
                  console.log('AI button pressed!');
                  if (globalNavigationRef?.current) {
                    globalNavigationRef.current.navigate('MeskenyGPTLanding');
                  }
                }}
              />
            );
          },
        }}
      /> */}
    </BottomTab.Navigator>
  );
}

const AccountStackNavigator = createNativeStackNavigator<AccountTabParamList>();
const AccountStack = () => (
  <AccountStackNavigator.Navigator initialRouteName="Account">
    <AccountStackNavigator.Screen
      name="Account"
      component={AccountScreen}
      options={{ headerShown: false }}
    />
    <AccountStackNavigator.Screen
      name="UserTrips"
      component={UserTripsScreen}
      options={{
        headerShown: false,
      }}
    />
    {/* <AccountStackNavigator.Screen
      name="DirectMessage"
      component={DirectMessageScreen}
      options={({ route }) => ({
        headerBackTitle: "Back",
        headerTitle: (route?.params as any)?.recipientName || "",
        contentStyle: { backgroundColor: "#FFFFFF" },
      })}
    /> */}
  </AccountStackNavigator.Navigator>
);

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
}) {
  return (
    <MaterialCommunityIcons size={30} style={{ marginBottom: -3 }} {...props} />
  );
}

const styles = StyleSheet.create({
  // Styles removed - PremiumAIButton is now a separate component
});
