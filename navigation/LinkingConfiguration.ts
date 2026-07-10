/**
 * Learn more about deep linking with React Navigation
 * https://reactnavigation.org/docs/deep-linking
 * https://reactnavigation.org/docs/configuring-links
 */

import { LinkingOptions } from "@react-navigation/native";
import * as Linking from "expo-linking";

import { MESKENY_WEB_ORIGIN } from "../utils/propertySaleShare";
import { RootStackParamList } from "../types";

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/"), MESKENY_WEB_ORIGIN, "https://www.meskeny.com"],
  config: {
    screens: {
      Root: {
        screens: {
          Search: "search",
          Saved: "saved",
          AccountRoot: {
            initialRouteName: "account" as any,
            screens: {
              Account: "account",
              Settings: "settings",
              Conversations: "conversations",
              Messages: { path: "messages/:conversationID/:recipientName" },
            },
          },
        },
      },
      FindLocations: "findlocations",
      ForgotPassword: "forgotpassword",
      MessageProperty: { path: "messageproperty/:propertyID" },
      PropertyDetails: "propertydetails",
      PropertySaleDetails: {
        path: "property-sale/:propertyId",
        parse: { propertyId: Number },
      },
      ListingGuide: {
        path: "listing/:propertySaleId/guide/:commentId",
        parse: {
          propertySaleId: Number,
          commentId: Number,
        },
      },
      MyGuideFeed: "guide",
      ResetPassword: { path: "resetpassword/:token" },
      SignIn: "signin",
      SignUp: "signup",
      SignInPhone: "signin-phone",
      SignUpPhone: "signup-phone",
    },
  },
};

export default linking;
