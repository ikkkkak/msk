/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */

import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { HostStudioListing } from "./hooks/queries/useHostStudioQuery";

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type RootStackParamList = {
  Root: NavigatorScreenParams<RootTabParamList> | undefined;
  Feedback: undefined;
  Inbox: undefined;
  FindLocations: undefined;
  SignIn: undefined;
  Settings: undefined;
  MyStories: undefined;
  Filter: undefined;
  SearchValueModal: undefined;
  NotificationPermission: undefined;
  ContactHostReview:
    | {
        propertyId: number;
        propertyTitle: string;
        propertyCity?: string;
        propertyImage?: string;
        ownerID: number;
        tenantID: number;
        prefillMessage: string;
        recipientName?: string;
        hostName?: string;
        hostAvatarURL?: string;
      }
    | undefined;
  PropertySaleFilter: undefined;
  BedroomsFilter: undefined;
  BathroomsFilter: undefined;
  YearBuiltFilter: undefined;
  RoomsFilter: undefined;
  CityZoneFilter: undefined;
  BlockedContentScreen: undefined;
  UserProfileScreen: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  AboutUs: undefined;
  Welcome: undefined;
  TestMap: undefined;
  NScreen: undefined;
  TourGuideTest: undefined;
  UnifiedAuth: { returnToPropertyId?: number } | undefined;
  SignUp: undefined;
  SignInPhone: undefined;
  SignUpPhone: undefined;
  PropertyReservation: {
    propertyID: number;
    title?: string;
    price?: number;
    currency?: string;
    cancellationPolicy?: string;
  };
  ContactHost: {
    propertyID: number;
    propertyTitle?: string;
    propertyImage?: string;
    hostID: number;
    hostName?: string;
    hostAvatarURL?: string;
    nightlyPrice?: number;
  };
  HostReservationDetails: { reservation: any };
  ReservationConfirmation: {
    reservation: any;
    propertyTitle?: string;
    propertyImage?: string;
    checkIn: string;
    checkOut: string;
    totalGuests: number;
    totalPrice: number;
    currency?: string;
  };
  TripDetails: {
    reservation: any;
  };
  Saved: undefined;
  ForgotPassword: undefined;
  HostReservations: undefined;
  MyReservations: undefined;
  Messages: undefined;
  VideoFeed: undefined;
  VideoComments: { videoId: number };
  PropertySaleVideoComments: { videoId: number };
  ExperienceBookings: undefined;
  MyProperties: undefined;
  ResetPassword: { token: string };
  PropertyDetails: { propertyID: number };
  PropertySaleRequestTour: {
    propertyID: number;
    propertyTitle?: string;
    listingPrice?: number;
    coverImage?: string;
    address?: string;
    city?: string;
  };
  PropertySaleMakeOffer: {
    propertyID: number;
    propertyTitle?: string;
    listingPrice?: number;
    coverImage?: string;
    address?: string;
    city?: string;
  };
  CreateLandmark: {
    initialRegion?: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    };
  };
  EditLandmark: { landmark: any };
  MessageProperty: { propertyID: number; tour?: boolean };
  AddProperty: undefined;
  EditProperty: { propertyID: number };
  EditPropertyStep: { propertyID: number; step: string };
  ManageUnits: { propertyID: number };
  Review: { propertyID: number; propertyName: string };
  ProfileCreation: undefined;
  ProfileVerification: undefined;
  BrokerVerification: undefined;
  Home: undefined;
  CreatePropertySale: { openAiFlow?: boolean } | undefined;
  EditPropertySale: { propertyId: number };
  PropertySaleDetails: { propertyId: number; initialImageIndex?: number };
  PropertySaleGoldInsights: { propertyId: number };
  ListingGuide: { propertySaleId: number; commentId?: number };
  MyGuideFeed: undefined;
  HostListingStudio: { listing: HostStudioListing };
  PropertyAmenities: undefined;
  CreateOrganization: undefined;
  OrganizationDashboard: undefined;
  EditOrganization: {
    organization: any;
    daysLeft?: {
      name?: number;
      description?: number;
      business_type?: number;
      banner_image?: number;
      logo?: number;
    };
    field?: string;
  };
  LeaveAgency: {
    organization: any;
  };
  AddPropertyOrLand: undefined;
  ChoosePropertyOrLandType: undefined;
  CollectionDetails: { collectionID: number; collectionName: string };
  VideoUpload: undefined;
  LikedVideos: undefined;
  SavedVideos: undefined;
  ExperienceCreation: undefined;
  HostExperiences: undefined;
  ExperienceDetails: { experienceId: number };
  ExperienceEdit: { experienceId: number };
  ExperienceBookingConfirmation: {
    experienceId: number;
    selectedDate: string;
    selectedTime?: string;
  };
  GroupInvite: { experienceId: number; capacityLeft: number };
  GroupOnboarding: { experienceId: number; capacityLeft: number };
  GroupCreate: { experienceId: number; capacityLeft: number };
  GroupMembers: { experienceId: number; groupId: number };
  MyGroups: undefined;
  GroupChat: { groupId: number; title?: string };
  GroupWishlist: { groupId: number; title?: string };
  GroupSearch: undefined;
  LocationSearch: {
    location?: string;
    locationName?: string;
    lat?: number;
    lng?: number;
  };
  DirectMessage: {
    conversationID?: number;
    otherUserId?: number;
    recipientName?: string;
    /** Property sale id — shows listing header + deep links in chat */
    propertyID?: number;
    pendingInitialCard?: {
      caption: string;
      property_id?: number;
      property_type?: "sale" | "rent";
      title: string;
      listing_price?: number;
      currency?: string;
      image_url?: string;
    };
  };
  LandmarkDetails: { landmark?: any; landmarkId?: number };
  LandmarkGuidance: { landmark: any };
  AddListingGuide: undefined;
  AdminPromotionalVideos: undefined;
  TestScreen: undefined;
  MeskenyGPTLanding: undefined;
  AIChatScreen:
    | undefined
    | {
        sharedProperty?: {
          id: number;
          title?: string;
          listing_price?: number;
          address?: string;
          city?: string;
          image?: string;
          type?: "sale" | "rent";
        };
        initialPrompt?: string;
      };
  ContactAgentModal: {
    phone?: string;
    email?: string;
    ownerID?: number;
    organizationName?: string;
    organizationImage?: string;
    organizationWebsite?: string;
    recipientName?: string;
  };
};

export type RootStackScreenProps<Screen extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, Screen>;

export type RootTabParamList = {
  // User Mode Tabs
  Search: SearchScreenParams | undefined;
  Videos: undefined;
  UserTrips: undefined;
  Inbox: undefined;
  Notifications: undefined;
  Messages: undefined;
  Invites: undefined;
  Saved: undefined;
  Organizations: undefined;
  AccountRoot: NavigatorScreenParams<AccountTabParamList> | undefined;
  CustomButton: undefined;

  // Host Mode Tabs
  HostDashboard: undefined;
  HostCalendar: undefined;
  HostReservations: undefined;
  MyProperties: undefined;
  HostSuggestions: undefined;
};

export type AccountTabParamList = {
  Account: undefined;
  Settings: undefined;
  UserTrips: undefined;
  DirectMessage: {
    conversationID?: number;
    otherUserId?: number;
    recipientName?: string;
    /** Property sale id — shows listing header + deep links in chat */
    propertyID?: number;
    pendingInitialCard?: {
      caption: string;
      property_id?: number;
      property_type?: "sale" | "rent";
      title: string;
      listing_price?: number;
      currency?: string;
      image_url?: string;
    };
  };
};

export type RootTabScreenProps<Screen extends keyof RootTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<RootTabParamList, Screen>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type SearchScreenParams = {
  location: string;
  boundingBox: string[];
  lat: string;
  lon: string;
};
