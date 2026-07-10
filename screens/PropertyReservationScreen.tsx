import React, { JSX, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Switch
} from "react-native";
// Removed native DateTimePicker in favor of custom grid calendar
import { RootStackScreenProps } from "../types";
import { MaterialIcons } from "@expo/vector-icons";
import { useCreateReservation } from "../hooks/queries/useReservations";
import { useUserProfile } from "../hooks/queries/useUserProfile";
import { usePropertyAvailability } from "../hooks/queries/usePropertyAvailability";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserQuery } from "../hooks/queries/useUserQuery";
import { Alert } from "react-native";
import { endpoints } from "../constants";
import { theme } from "../theme";
import { useTranslation } from "react-i18next";
import { useUser } from "../hooks/useUser";
import { useNotifications } from "../hooks/useNotifications";
import BottomSheetForm from "../components/FormSheet";
import Toast from "../components/CustomToast";

export const PropertyReservationScreen: React.FC<
  RootStackScreenProps<"PropertyReservation">
> = ({ route, navigation }) => {
  const {
    propertyID,
    title,
    price,
    currency,
    cancellationPolicy,
    imageURL,
    rating,
    reviewsCount
  } = (route.params as any) || {};
  const { t } = useTranslation();
  const [checkIn, setCheckIn] = useState<Date>(new Date());
  const [checkOut, setCheckOut] = useState<Date>(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  );
  const [adults, setAdults] = useState<number>(1);
  const [kids, setKids] = useState<number>(0);
  const [note, setNote] = useState<string>("");
  const { data: userProfile } = useUserProfile();
  const [pendingReservation, setPendingReservation] = useState<any>(null);
  const [countdown, setCountdown] = useState<string>("");
  const [showDatesSheet, setShowDatesSheet] = useState<boolean>(false);
  const [showGuestsSheet, setShowGuestsSheet] = useState<boolean>(false);
  const [showNoteSheet, setShowNoteSheet] = useState<boolean>(false);
  const [noteInputHeight, setNoteInputHeight] = useState<number>(120);
  const [paymentMethod, setPaymentMethod] = useState<"Sedad" | "Bankily">(
    "Sedad"
  );

  const totalGuests = useMemo(() => adults + kids, [adults, kids]);
  const createReservation = useCreateReservation(propertyID || 0);
  const qc = useQueryClient();
  const { data: availability } = usePropertyAvailability(propertyID || 0);
  const { data: propertyReservations } = useQuery<any[]>({
    queryKey: ["propertyReservations", propertyID],
    queryFn: async () => {
      if (!propertyID) return [];
      const res = await fetch(
        `${endpoints.baseURL}/apartment/property/${propertyID}`
      );
      if (!res.ok) throw new Error("Failed to fetch property reservations");
      return res.json();
    },
    enabled: !!propertyID,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5000
  } as any);
  const { data: fullUserData } = useUserQuery();
  const { data: propertyDetails } = useQuery({
    queryKey: ["property", propertyID],
    queryFn: async () => {
      if (!propertyID) return null;
      const res = await fetch(
        `${endpoints.baseURL}/apartment/property/${propertyID}`
      );
      if (!res.ok) throw new Error("Failed to fetch property details");
      return res.json();
    },
    enabled: !!propertyID
  });
  const [verifyModalVisible, setVerifyModalVisible] = useState<boolean>(false);
  const [verifyModalType, setVerifyModalType] = useState<
    "pending" | "required"
  >("required");
  const [policyAccepted, setPolicyAccepted] = useState<boolean>(false);
  const [showPolicyModal, setShowPolicyModal] = useState<boolean>(false);
  const [showNotificationSheet, setShowNotificationSheet] =
    useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [showToast, setShowToast] = useState<boolean>(false);
  const screenWidth = Dimensions.get("window").width;
  const dayCellSize = (screenWidth - 32) / 7 - 2;

  // Get user data to check notifications
  const { user, setAllowsNotifications } = useUser();
  const { registerForPushNotificationsAsync } = useNotifications();

  // Check notifications on screen entry
  useEffect(() => {
    const checkOnEntry = () => {
      console.log("🚪 SCREEN ENTERED - Checking notifications...");
      const hasNotificationEnabled = user?.allowsNotifications;
      const hasPushToken = user?.pushToken && user.pushToken.length > 0;

      console.log("🚪 allowsNotifications:", hasNotificationEnabled);
      console.log("🚪 hasPushToken:", hasPushToken);

      if (!hasNotificationEnabled || !hasPushToken) {
        console.log("⚠️ Notifications missing - showing sheet on entry");
        setShowNotificationSheet(true);
      }
    };

    // Wait a bit for user data to load
    const timer = setTimeout(checkOnEntry, 500);
    return () => clearTimeout(timer);
  }, [user]); // Only run when user data changes

  // Debug: Log when notification sheet changes
  useEffect(() => {
    console.log("📊 NOTIFICATION SHEET STATE CHANGED:", showNotificationSheet);
    if (showNotificationSheet) {
      console.log("📊 Sheet is now VISIBLE");
      console.log("📊 Current user state:", user);
      console.log("📊 User allowsNotifications:", user?.allowsNotifications);
      console.log("📊 User pushToken:", user?.pushToken);
    } else {
      console.log("📊 Sheet is now HIDDEN");
    }
  }, [showNotificationSheet, user]);

  // Check if user has notifications enabled
  const checkNotifications = () => {
    console.log("🔍 CHECKING NOTIFICATIONS...");
    console.log("🔍 User:", user);
    console.log("🔍 allowsNotifications:", user?.allowsNotifications);
    console.log("🔍 pushToken:", user?.pushToken);

    const hasNotificationEnabled = user?.allowsNotifications;
    const hasPushToken = user?.pushToken && user.pushToken.length > 0;

    console.log("🔍 hasNotificationEnabled:", hasNotificationEnabled);
    console.log("🔍 hasPushToken:", hasPushToken);

    if (!hasNotificationEnabled || !hasPushToken) {
      console.log("⚠️ Notifications missing - showing sheet");
      setShowNotificationSheet(true);
      return false;
    }
    console.log("✅ Notifications enabled");
    return true;
  };

  const handleEnableNotifications = async () => {
    console.log("🚀 ENABLING NOTIFICATIONS...");
    try {
      console.log("📱 Step 1: Setting allowsNotifications to true...");
      await setAllowsNotifications(true);

      console.log("📱 Step 2: Registering for push notifications...");
      const token = await registerForPushNotificationsAsync(true, true);
      console.log("📱 NEW PUSH TOKEN RECEIVED:", token);

      // Refresh user data to get updated push token
      console.log("📱 Step 3: Waiting for user data to update...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("📱 Step 4: User data after update:", user);
      console.log("📱 Step 5: Push token after update:", user?.pushToken);

      setShowNotificationSheet(false);
      console.log("✅ Notifications enabled successfully");
      setToastMessage(t("notifications.enabledSuccess"));
      setToastType("success");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("❌ Failed to enable notifications:", error);
      setToastMessage(t("notifications.enabledError"));
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const blockedDates = useMemo(() => {
    const set = new Set<string>();

    // Block from availability API (PropertyAvailability table where is_available = false)
    (availability || []).forEach((a: any) => {
      try {
        const d = new Date(a.date);
        const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate())
          .toISOString()
          .split("T")[0];
        if (a.isAvailable === false) {
          set.add(iso);
        }
      } catch (e) {
        console.log("Error processing availability:", e);
      }
    });

    // Block from confirmed/pending reservations in DB (this is the main issue!)
    (propertyReservations || []).forEach((r: any) => {
      const st = (r.status || "").toLowerCase();
      console.log(
        `Reservation ${r.ID}: status=${st}, checkIn=${r.checkIn}, checkOut=${r.checkOut}`
      );
      // Only block confirmed and pending reservations
      if (st === "confirmed" || st === "pending") {
        try {
          const start = new Date(r.checkIn);
          const end = new Date(r.checkOut);
          console.log(
            `Blocking dates from ${start.toISOString()} to ${end.toISOString()}`
          );
          for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate())
              .toISOString()
              .split("T")[0];
            set.add(iso);
          }
        } catch (e) {
          console.log("Error processing reservation:", e);
        }
      }
    });

    console.log("Blocked dates:", Array.from(set));
    return set;
  }, [availability, propertyReservations]);

  const isUnavailable = (d: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cmp = new Date(d);
    cmp.setHours(0, 0, 0, 0);
    if (cmp < today) return true;
    const iso = cmp.toISOString().split("T")[0];
    return blockedDates.has(iso);
  };

  const [tempCheckIn, setTempCheckIn] = useState<Date | null>(null);
  const [tempCheckOut, setTempCheckOut] = useState<Date | null>(null);

  const handleSelectDay = (d: Date) => {
    if (isUnavailable(d)) return;
    if (!tempCheckIn || (tempCheckIn && tempCheckOut)) {
      setTempCheckIn(d);
      setTempCheckOut(null);
      return;
    }
    if (tempCheckIn && !tempCheckOut) {
      if (d <= tempCheckIn) {
        setTempCheckIn(d);
        return;
      }
      // ensure all days in range are available
      const cursor = new Date(tempCheckIn);
      let ok = true;
      while (cursor < d) {
        const next = new Date(cursor);
        next.setDate(next.getDate() + 1);
        if (isUnavailable(next)) {
          ok = false;
          break;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      if (!ok) return;
      setTempCheckOut(d);
      // Instant-save: apply to summary and close sheet
      setCheckIn(tempCheckIn);
      setCheckOut(d);
      setShowDatesSheet(false);
    }
  };

  // profile loading handled by hook

  useEffect(() => {
    if (!pendingReservation?.expiresAt) return;
    const end = new Date(pendingReservation.expiresAt).getTime();
    const id = setInterval(() => {
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setCountdown("Expired");
        clearInterval(id);
      } else {
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setCountdown(`${hrs}h ${mins}m remaining`);
      }
    }, 60000);
    // initial tick
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) setCountdown("Expired");
    else {
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown(`${hrs}h ${mins}m remaining`);
    }
    return () => clearInterval(id);
  }, [pendingReservation?.expiresAt]);

  console.log(userProfile);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          marginTop: "15%"
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8, marginRight: 8 }}
        >
          <MaterialIcons name="arrow-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#222" }}>
          {t("reservation.requestToBook")}
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header card */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#EAEAEA",
            borderRadius: 12,
            padding: 10,
            backgroundColor: "#FFFFFF"
          }}
        >
          {imageURL ? (
            <Image
              source={{ uri: imageURL }}
              style={{
                width: 72,
                height: 72,
                borderRadius: 8,
                marginRight: 12,
                backgroundColor: "#F2F2F2"
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 8,
                marginRight: 12,
                backgroundColor: "#F2F2F2"
              }}
            />
          )}
          <View style={{ flex: 1, minHeight: 72, justifyContent: "center" }}>
            {title ? (
              <Text
                style={{ fontSize: 15, fontWeight: "700", color: "#222" }}
                numberOfLines={2}
              >
                {title}
              </Text>
            ) : null}
            {typeof rating === "number" ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 6
                }}
              >
                <MaterialIcons name="star" size={14} color="#FFB400" />
                <Text
                  style={{
                    marginLeft: 4,
                    fontSize: 12,
                    color: "#222",
                    fontWeight: "600"
                  }}
                >
                  {rating.toFixed(2)}
                </Text>
                <Text style={{ marginLeft: 6, fontSize: 12, color: "#777" }}>
                  ({reviewsCount || 0})
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <Text style={{ marginTop: 8, fontSize: 12, color: "#777" }}>
          {t("reservation.protectionNotice")}
        </Text>

        {/* Your trip summary */}
        <View style={{ marginTop: 16, paddingVertical: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#222" }}>
            {t("reservation.yourTrip")}
          </Text>
          <View
            style={{
              marginTop: 8,
              borderWidth: 1,
              borderColor: "#EAEAEA",
              borderRadius: 12,
              overflow: "hidden"
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 12,
                paddingVertical: 14
              }}
            >
              <View>
                <Text
                  style={{ fontSize: 14, color: "#222", fontWeight: "600" }}
                >
                  {t("common.dates")}
                </Text>
                <Text style={{ marginTop: 2, fontSize: 13, color: "#555" }}>
                  {checkIn.toDateString()} – {checkOut.toDateString()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  try {
                    qc.invalidateQueries({
                      queryKey: ["propertyAvailability", propertyID as any]
                    });
                  } catch {}
                  setShowDatesSheet(true);
                }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: "#EAEAEA",
                  borderRadius: 8
                }}
              >
                <Text
                  style={{ fontSize: 12, fontWeight: "700", color: "#222" }}
                >
                  {t("common.edit")}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 1, backgroundColor: "#F1F1F1" }} />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 12,
                paddingVertical: 14
              }}
            >
              <View>
                <Text
                  style={{ fontSize: 14, color: "#222", fontWeight: "600" }}
                >
                  {t("common.guests")}
                </Text>
                <Text style={{ marginTop: 2, fontSize: 13, color: "#555" }}>
                  {totalGuests}{" "}
                  {totalGuests === 1
                    ? t("reservation.guestSingular")
                    : t("reservation.guestPlural")}
                  {kids > 0 ? `, ${kids} ${t("reservation.infants")}` : ""}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowGuestsSheet(true)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: "#EAEAEA",
                  borderRadius: 8
                }}
              >
                <Text
                  style={{ fontSize: 12, fontWeight: "700", color: "#222" }}
                >
                  {t("common.edit")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Price details */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#222" }}>
            {t("reservation.priceDetails")}
          </Text>
          {(() => {
            const ms = checkOut.getTime() - checkIn.getTime();
            const nights = Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
            const nightly = typeof price === "number" ? price : 0;
            const cleaningFee = Math.max(0, Math.round(nightly * 0.02));
            const serviceFee = 0;
            const total = nightly * nights + cleaningFee + serviceFee;
            return (
              <View
                style={{
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: "#EAEAEA",
                  borderRadius: 12,
                  padding: 12
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8
                  }}
                >
                  <Text style={{ color: "#444" }}>{`${nightly} x ${nights} ${
                    nights > 1
                      ? t("reservation.nights")
                      : t("reservation.night")
                  }`}</Text>
                  <Text style={{ color: "#222", fontWeight: "600" }}>{`${
                    nightly * nights
                  } MRU`}</Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8
                  }}
                >
                  <Text style={{ color: "#444" }}>
                    {t("reservation.cleaningFee")}
                  </Text>
                  <Text
                    style={{ color: "#222", fontWeight: "600" }}
                  >{`${cleaningFee} MRU`}</Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8
                  }}
                >
                  <Text style={{ color: "#444" }}>
                    {t("reservation.serviceFee")}
                  </Text>
                  <Text
                    style={{ color: "#222", fontWeight: "600" }}
                  >{`${serviceFee} MRU`}</Text>
                </View>
                <View
                  style={{
                    height: 1,
                    backgroundColor: "#F1F1F1",
                    marginVertical: 8
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between"
                  }}
                >
                  <Text style={{ color: "#222", fontWeight: "700" }}>
                    {t("common.total")}
                  </Text>
                  <Text
                    style={{ color: "#222", fontWeight: "700" }}
                  >{`${total} MRU`}</Text>
                </View>
              </View>
            );
          })()}
        </View>

        {/* Pay with */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#222" }}>
            {t("reservation.payWith")}
          </Text>
          <View
            style={{
              marginTop: 8,
              borderWidth: 1,
              borderColor: "#EAEAEA",
              borderRadius: 12
            }}
          >
            <TouchableOpacity
              onPress={() => setPaymentMethod && setPaymentMethod("Sedad")}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 14
              }}
            >
              <Text style={{ color: "#222" }}>{t("reservations.Sedad")}</Text>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: "#222",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {paymentMethod === "Sedad" ? (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#222"
                    }}
                  />
                ) : null}
              </View>
            </TouchableOpacity>
            <View style={{ height: 1, backgroundColor: "#F1F1F1" }} />
            <TouchableOpacity
              onPress={() => setPaymentMethod && setPaymentMethod("Bankily")}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 14
              }}
            >
              <Text style={{ color: "#222" }}>{t("reservations.Bankily")}</Text>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: "#222",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {paymentMethod === "Bankily" ? (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#222"
                    }}
                  />
                ) : null}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Required for your trip */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#222" }}>
            {t("reservation.requiredForTrip")}
          </Text>
          <View
            style={{
              marginTop: 8,
              borderWidth: 1,
              borderColor: "#EAEAEA",
              borderRadius: 12,
              overflow: "hidden"
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 12,
                paddingVertical: 14
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text
                  style={{ fontSize: 14, color: "#222", fontWeight: "600" }}
                >
                  {t("reservation.messageHost")}
                </Text>
                <Text style={{ marginTop: 2, fontSize: 12, color: "#777" }}>
                  {t("reservation.messageHostHint")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowNoteSheet(true)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: "#EAEAEA",
                  borderRadius: 8
                }}
              >
                <Text
                  style={{ fontSize: 12, fontWeight: "700", color: "#222" }}
                >
                  {note ? t("common.edit") : t("common.add")}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 1, backgroundColor: "#F1F1F1" }} />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 12,
                paddingVertical: 14
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flex: 1,
                  paddingRight: 12
                }}
              >
                {userProfile?.profile?.avatarURL ? (
                  <Image
                    source={{ uri: userProfile.profile.avatarURL }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      marginRight: 10
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      marginRight: 10,
                      backgroundColor: "#EAEAEA"
                    }}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 14, color: "#222", fontWeight: "600" }}
                  >
                    {t("account.profile")}
                  </Text>
                  <Text style={{ marginTop: 2, fontSize: 12, color: "#777" }}>
                    {userProfile
                      ? `${userProfile.profile.firstName || ""} ${
                          userProfile.profile.lastName || ""
                        }`.trim()
                      : t("account.notSet")}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Cancellation policy card */}
        <View
          style={{
            marginTop: 16,
            borderWidth: 1,
            borderColor: "#EAEAEA",
            borderRadius: 12,
            padding: 12
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#222" }}>
            {t("reservation.cancellationPolicy")}
          </Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: "#555" }}>
            {cancellationPolicy || t("reservation.cancellationPolicyHint")}
          </Text>
        </View>

        {/* 24h acceptance disclaimer */}
        <View
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: "#EAEAEA",
            borderRadius: 12,
            padding: 12,
            backgroundColor: "#FAFAFA"
          }}
        >
          <Text style={{ fontSize: 13, color: "#222" }}>
            {t("reservation.hostAcceptanceDisclaimer")}
          </Text>
        </View>

        {/* Policy Acceptance Section */}
        {/* {propertyDetails && (
          <View style={{ marginTop: 16, borderWidth: 1, borderColor: '#EAEAEA', borderRadius: 12, padding: 16, backgroundColor: '#FFFFFF' }}>
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}
              onPress={() => setShowPolicyModal(true)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#222' }}>{t('reservation.hostPolicyCompliance')}</Text>
              <MaterialIcons name="keyboard-arrow-right" size={24} color="#484848" />
            </TouchableOpacity>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: '#484848', marginBottom: 8 }}>
                {(() => {
                  const policies = [
                    propertyDetails.secureCompoundAcknowledged,
                    propertyDetails.equipmentViolationPolicyAccepted,
                    propertyDetails.userSafetyPolicyAccepted,
                    propertyDetails.propertyPolicyAccepted
                  ];
                  const acceptedCount = policies.filter(Boolean).length;
                  const totalCount = policies.length;
                  return `${acceptedCount}/${totalCount} ${t('reservation.policiesAccepted')}`;
                })()}
              </Text>
              <View style={[
                { 
                  paddingHorizontal: 12, 
                  paddingVertical: 6, 
                  borderRadius: 16, 
                  alignSelf: 'flex-start' 
                },
                { backgroundColor: (() => {
                  const policies = [
                    propertyDetails.secureCompoundAcknowledged,
                    propertyDetails.equipmentViolationPolicyAccepted,
                    propertyDetails.userSafetyPolicyAccepted,
                    propertyDetails.propertyPolicyAccepted
                  ];
                  const acceptedCount = policies.filter(Boolean).length;
                  return acceptedCount === policies.length ? '#E8F5E8' : 
                         acceptedCount > 0 ? '#FFF3E0' : '#FFEBEE';
                })() }
              ]}>
                <Text style={[
                  { fontSize: 12, fontWeight: '600' },
                  { color: (() => {
                    const policies = [
                      propertyDetails.secureCompoundAcknowledged,
                      propertyDetails.equipmentViolationPolicyAccepted,
                      propertyDetails.userSafetyPolicyAccepted,
                      propertyDetails.propertyPolicyAccepted
                    ];
                    const acceptedCount = policies.filter(Boolean).length;
                    return acceptedCount === policies.length ? '#2E7D32' : 
                           acceptedCount > 0 ? '#F57C00' : '#D32F2F';
                  })() }
                ]}>
                  {(() => {
                    const policies = [
                      propertyDetails.secureCompoundAcknowledged,
                      propertyDetails.equipmentViolationPolicyAccepted,
                      propertyDetails.userSafetyPolicyAccepted,
                      propertyDetails.propertyPolicyAccepted
                    ];
                    const acceptedCount = policies.filter(Boolean).length;
                    return acceptedCount === policies.length ? 'Fully Compliant' : 
                           acceptedCount > 0 ? 'Partially Compliant' : 'Not Compliant';
                  })()}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: '#F0F0F0'
              }}
              onPress={() => setPolicyAccepted(!policyAccepted)}
              activeOpacity={0.7}
            >
              <MaterialIcons 
                name={policyAccepted ? "check-box" : "check-box-outline-blank"} 
                size={24} 
                color={policyAccepted ? "#FF385C" : "#CCCCCC"} 
              />
              <Text style={{ 
                marginLeft: 12, 
                fontSize: 14, 
                color: '#222',
                flex: 1,
                lineHeight: 20
              }}>
                {t('reservation.policyComplianceText')}
              </Text>
            </TouchableOpacity>
          </View>
        )} */}

        {/* Stepper */}
        {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
          {['Dates','Guests','Note','Review'].map((label, idx) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: step >= idx ? '#FF385C' : '#EAEAEA', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: step >= idx ? '#fff' : '#666', fontSize: 12 }}>{idx+1}</Text>
              </View>
              <Text style={{ marginHorizontal: 6, color: step === idx ? '#222' : '#888', fontWeight: step === idx ? '700' : '500' }}>{label}</Text>
              {idx < 3 && <View style={{ width: 24, height: 1, backgroundColor: '#EAEAEA' }} />}
            </View>
          ))}
        </View> */}

        {pendingReservation ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: "#EAEAEA",
              borderRadius: 10,
              padding: 12,
              backgroundColor: "#FAFAFA",
              marginTop: 8
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#222" }}>
              {t("reservation.requestSent")}
            </Text>
            <Text style={{ marginTop: 4, color: "#444" }}>
              {t("reservation.status")}: {pendingReservation.status}
            </Text>
            <Text style={{ marginTop: 2, color: "#666" }}>
              {countdown || t("reservation.calculating")}
            </Text>
            {pendingReservation.totalPrice && (
              <Text style={{ marginTop: 4, color: "#222", fontWeight: "600" }}>
                {t("common.total")}:{" "}
                {currency === "MRU"
                  ? `${pendingReservation.totalPrice} MRU`
                  : `$${pendingReservation.totalPrice.toFixed(2)}`}
              </Text>
            )}
            {pendingReservation.property && (
              <Text style={{ marginTop: 2, color: "#666", fontSize: 12 }}>
                {t("reservation.property")}: {pendingReservation.property.title}
              </Text>
            )}
          </View>
        ) : null}

        <View style={{ height: 80 }} />
      </ScrollView>

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#EBEBEB"
        }}
      >
        {pendingReservation ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              backgroundColor: "#222",
              borderRadius: 10,
              paddingVertical: 14,
              alignItems: "center"
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              {t("common.close")}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={async () => {
              if (!propertyID) return;

              // Server-side availability validation before creating reservation
              try {
                console.log("Validating dates:", {
                  checkIn: checkIn.toISOString(),
                  checkOut: checkOut.toISOString(),
                  propertyID
                });
                const validateRes = await fetch(
                  `${endpoints.baseURL}/apartment/property/${propertyID}/validate`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      checkIn: checkIn.toISOString(),
                      checkOut: checkOut.toISOString()
                    })
                  }
                );
                console.log("Validation response status:", validateRes.status);
                if (!validateRes.ok) {
                  const err = await validateRes.json().catch(() => ({} as any));
                  console.log("Validation failed:", err);
                  Alert.alert(
                    "Dates not available",
                    err?.message || "Please choose different dates."
                  );
                  return;
                }
                console.log("Validation passed");
              } catch (e) {
                console.log("Validation error:", e);
                Alert.alert(
                  "Validation failed",
                  "Unable to validate availability. Please try again."
                );
                return;
              }
              createReservation.mutate(
                {
                  checkIn: checkIn.toISOString(),
                  checkOut: checkOut.toISOString(),
                  numGuests: totalGuests,
                  note
                },
                {
                  onSuccess: (res: any) => {
                    console.log("Reservation created:", res);
                    // Navigate to confirmation screen instead of showing pending state
                    (navigation as any).navigate("ReservationConfirmation", {
                      reservation: res,
                      propertyTitle: title,
                      propertyImage: imageURL,
                      checkIn: checkIn.toISOString(),
                      checkOut: checkOut.toISOString(),
                      totalGuests: totalGuests,
                      totalPrice: res.totalPrice,
                      currency: currency
                    });
                  },
                  onError: (error: any) => {
                    console.error("Reservation creation failed:", error);
                    Alert.alert(
                      "Error",
                      "Failed to create reservation. Please try again."
                    );
                  }
                }
              );
            }}
            style={{
              backgroundColor: theme["color-temporary-primary"],
              borderRadius: 10,
              paddingVertical: 14,
              alignItems: "center"
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              {t("reservation.requestToBook")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Dates Bottom Sheet */}
      <Modal
        visible={showDatesSheet}
        transparent
        animationType="none"
        onRequestClose={() => setShowDatesSheet(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.12)"
          }}
        >
          <View
            style={{
              height: "80%",
              backgroundColor: "#fff",
              padding: 16,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16
            }}
          >
            <View style={{ alignItems: "center", paddingBottom: 6 }}>
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#E0E0E0"
                }}
              />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#222" }}>
              {t("reservation.editDates")}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 12, color: "#777" }}>
              {t("reservation.editDatesHint")}
            </Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ marginTop: 12 }}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {(() => {
                const months: JSX.Element[] = [];
                const start = new Date();
                start.setDate(1);
                // Show 6 months ahead for better planning
                for (let m = 0; m < 6; m++) {
                  const month = new Date(
                    start.getFullYear(),
                    start.getMonth() + m,
                    1
                  );
                  const monthStartWeekday = new Date(month).getDay();
                  const daysInMonth = new Date(
                    month.getFullYear(),
                    month.getMonth() + 1,
                    0
                  ).getDate();
                  const cells: JSX.Element[] = [];
                  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
                  cells.push(
                    <View
                      key={`wd-${m}`}
                      style={{
                        width: "100%",
                        flexDirection: "row",
                        marginBottom: 4
                      }}
                    >
                      {weekdays.map((wd, i) => (
                        <View
                          key={`w-${m}-${i}`}
                          style={{
                            width: dayCellSize,
                            height: 18,
                            margin: 1,
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <Text style={{ fontSize: 11, color: "#999" }}>
                            {wd}
                          </Text>
                        </View>
                      ))}
                    </View>
                  );
                  for (let i = 0; i < monthStartWeekday; i++) {
                    cells.push(
                      <View
                        key={`pad-${m}-${i}`}
                        style={{
                          width: dayCellSize,
                          height: dayCellSize,
                          margin: 1
                        }}
                      />
                    );
                  }
                  for (let d = 1; d <= daysInMonth; d++) {
                    const date = new Date(
                      month.getFullYear(),
                      month.getMonth(),
                      d
                    );
                    const disabled = isUnavailable(date);
                    const iso = new Date(
                      date.getFullYear(),
                      date.getMonth(),
                      date.getDate()
                    )
                      .toISOString()
                      .split("T")[0];
                    const isBlocked = blockedDates.has(iso);
                    const selected =
                      (tempCheckIn &&
                        date.toDateString() === tempCheckIn.toDateString()) ||
                      (tempCheckOut &&
                        date.toDateString() === tempCheckOut.toDateString());
                    const inRange =
                      tempCheckIn &&
                      tempCheckOut &&
                      date > tempCheckIn &&
                      date < tempCheckOut;
                    cells.push(
                      <TouchableOpacity
                        key={`d-${m}-${d}`}
                        disabled={disabled}
                        onPress={() => handleSelectDay(date)}
                        style={{
                          width: dayCellSize,
                          height: dayCellSize,
                          margin: 1,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 8,
                          backgroundColor: selected
                            ? "#FF385C"
                            : inRange
                            ? "#FFE7EC"
                            : "#F8F8F8",
                          borderWidth: 1,
                          borderColor: disabled
                            ? "#EEE"
                            : selected
                            ? "#FF385C"
                            : "#E5E5E5",
                          opacity: disabled ? 0.4 : 1
                        }}
                      >
                        <Text
                          style={{
                            color: selected ? "#fff" : "#222",
                            fontWeight: "600",
                            textDecorationLine: isBlocked
                              ? ("line-through" as any)
                              : "none"
                          }}
                        >
                          {d}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                  months.push(
                    <View key={`month-${m}`} style={{ marginBottom: 12 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: "#222",
                          marginBottom: 8
                        }}
                      >
                        {month.toLocaleString(undefined, {
                          month: "long",
                          year: "numeric"
                        })}
                      </Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {cells}
                      </View>
                    </View>
                  );
                }
                return <View>{months}</View>;
              })()}
            </ScrollView>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 16
              }}
            >
              <TouchableOpacity
                onPress={() => setShowDatesSheet(false)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#EAEAEA",
                  marginRight: 8
                }}
              >
                <Text style={{ color: "#222", fontWeight: "700" }}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDatesSheet(false)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  backgroundColor: "#000"
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {t("common.save")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Verification Modal */}
      <Modal
        visible={verifyModalVisible}
        transparent
        animationType="none"
        onRequestClose={() => setVerifyModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.12)"
          }}
        >
          <View
            style={{
              height: "50%",
              backgroundColor: "#fff",
              padding: 16,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16
            }}
          >
            <View style={{ alignItems: "center", paddingBottom: 6 }}>
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#E0E0E0"
                }}
              />
            </View>
            <View
              style={{ alignItems: "center", marginTop: 8, marginBottom: 6 }}
            >
              {verifyModalType === "pending" ? (
                <MaterialIcons
                  name="hourglass-empty"
                  size={48}
                  color="#FF8C00"
                />
              ) : (
                <MaterialIcons name="verified-user" size={48} color="#FF385C" />
              )}
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#222",
                textAlign: "center"
              }}
            >
              {verifyModalType === "pending"
                ? "Verification pending"
                : "Verification required"}
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 14,
                color: "#555",
                textAlign: "center"
              }}
            >
              {verifyModalType === "pending"
                ? "Your identity verification is being processed. You can request to book once it is approved."
                : "Please verify your identity before requesting to book."}
            </Text>
            <View style={{ flex: 1 }} />
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                onPress={() => setVerifyModalVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#EAEAEA",
                  alignItems: "center",
                  marginRight: 8
                }}
              >
                <Text style={{ color: "#222", fontWeight: "700" }}>
                  {verifyModalType === "pending" ? "OK" : "Later"}
                </Text>
              </TouchableOpacity>
              {verifyModalType === "pending" ? (
                <TouchableOpacity
                  onPress={() => {
                    setVerifyModalVisible(false);
                    (navigation as any).navigate("AccountRoot", {
                      screen: "Account"
                    });
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 10,
                    backgroundColor: "#222",
                    alignItems: "center",
                    marginLeft: 8
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    {t("common.viewStatus")}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setVerifyModalVisible(false);
                    (navigation as any).navigate("ProfileVerification");
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 10,
                    backgroundColor: "#FF385C",
                    alignItems: "center",
                    marginLeft: 8
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    {t("reservation.verifyNow")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Guests Bottom Sheet */}
      <Modal
        visible={showGuestsSheet}
        transparent
        animationType="none"
        onRequestClose={() => setShowGuestsSheet(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.12)"
          }}
        >
          <View
            style={{
              height: "80%",
              backgroundColor: "#fff",
              padding: 16,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#222" }}>
              {t("reservation.editGuests")}
            </Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ marginTop: 12 }}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              <View
                style={{
                  backgroundColor: "#F7F7F7",
                  borderRadius: 10,
                  padding: 12
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10
                  }}
                >
                  <Text style={{ fontSize: 15, color: "#222" }}>
                    {t("reservation.adults")}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                      onPress={() => setAdults(Math.max(1, adults - 1))}
                      style={{ padding: 8 }}
                    >
                      <MaterialIcons
                        name="remove-circle-outline"
                        size={22}
                        color="#222"
                      />
                    </TouchableOpacity>
                    <Text
                      style={{ width: 28, textAlign: "center", fontSize: 16 }}
                    >
                      {adults}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setAdults(adults + 1)}
                      style={{ padding: 8 }}
                    >
                      <MaterialIcons
                        name="add-circle-outline"
                        size={22}
                        color="#222"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <View
                  style={{
                    height: 1,
                    backgroundColor: "#EAEAEA",
                    marginVertical: 8
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <Text style={{ fontSize: 15, color: "#222" }}>
                    {t("reservation.kids")}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                      onPress={() => setKids(Math.max(0, kids - 1))}
                      style={{ padding: 8 }}
                    >
                      <MaterialIcons
                        name="remove-circle-outline"
                        size={22}
                        color="#222"
                      />
                    </TouchableOpacity>
                    <Text
                      style={{ width: 28, textAlign: "center", fontSize: 16 }}
                    >
                      {kids}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setKids(kids + 1)}
                      style={{ padding: 8 }}
                    >
                      <MaterialIcons
                        name="add-circle-outline"
                        size={22}
                        color="#222"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 16
              }}
            >
              <TouchableOpacity
                onPress={() => setShowGuestsSheet(false)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#EAEAEA",
                  marginRight: 8
                }}
              >
                <Text style={{ color: "#222", fontWeight: "700" }}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowGuestsSheet(false)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  backgroundColor: "#FF385C"
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {t("common.save")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Note Bottom Sheet */}
      <Modal
        visible={showNoteSheet}
        transparent
        animationType="none"
        onRequestClose={() => setShowNoteSheet(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              backgroundColor: "rgba(0,0,0,0.12)"
            }}
          >
            <View
              style={{
                height: "80%",
                backgroundColor: "#fff",
                padding: 16,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#222" }}>
                {t("reservation.messageHost")}
              </Text>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: "#E3E3E3",
                    borderRadius: 10,
                    marginTop: 12
                  }}
                >
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder={t("reservation.notePlaceholder")}
                    multiline
                    numberOfLines={5}
                    onContentSizeChange={(e) => {
                      const h = Math.min(
                        240,
                        Math.max(120, e.nativeEvent.contentSize.height)
                      );
                      setNoteInputHeight(h);
                    }}
                    style={{
                      height: noteInputHeight,
                      maxHeight: 240,
                      padding: 12,
                      fontSize: 15,
                      textAlignVertical: "top" as any
                    }}
                  />
                </View>
              </ScrollView>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  marginTop: 8
                }}
              >
                <TouchableOpacity
                  onPress={() => setShowNoteSheet(false)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#EAEAEA",
                    marginRight: 8
                  }}
                >
                  <Text style={{ color: "#222", fontWeight: "700" }}>
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowNoteSheet(false)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    backgroundColor: "#FF385C"
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    {t("common.save")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Policy Details Modal */}
      {propertyDetails && (
        <Modal
          visible={showPolicyModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPolicyModal(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              backgroundColor: "rgba(0,0,0,0.5)"
            }}
          >
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                height: "85%",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 5
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 24,
                  paddingTop: 20,
                  paddingBottom: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: "#EBEBEB"
                }}
              >
                <Text
                  style={{ fontSize: 18, fontWeight: "700", color: "#222222" }}
                >
                  {t("reservation.hostPolicyCompliance")}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowPolicyModal(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#F7F7F7",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  <MaterialIcons name="close" size={24} color="#484848" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Secure Compound Policy */}
                <View
                  style={{
                    marginBottom: 24,
                    paddingBottom: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F0F0F0"
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      marginBottom: 12
                    }}
                  >
                    <MaterialIcons
                      name="security"
                      size={24}
                      color={
                        propertyDetails.secureCompoundAcknowledged
                          ? "#008489"
                          : "#FF6B35"
                      }
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "#222222",
                          marginBottom: 4
                        }}
                      >
                        {t("reservation.secureCompoundPolicy")}
                      </Text>
                      <Text
                        style={[
                          { fontSize: 14, fontWeight: "500" },
                          {
                            color: propertyDetails.secureCompoundAcknowledged
                              ? "#008489"
                              : "#FF6B35"
                          }
                        ]}
                      >
                        {propertyDetails.secureCompoundAcknowledged
                          ? "✅ Acknowledged"
                          : "❌ Not Acknowledged"}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#484848",
                      lineHeight: 20,
                      marginLeft: 36
                    }}
                  >
                    {t("reservation.secureCompoundPolicyDescription")}
                  </Text>
                </View>

                {/* Equipment Violation Policy */}
                <View
                  style={{
                    marginBottom: 24,
                    paddingBottom: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F0F0F0"
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      marginBottom: 12
                    }}
                  >
                    <MaterialIcons
                      name="build"
                      size={24}
                      color={
                        propertyDetails.equipmentViolationPolicyAccepted
                          ? "#008489"
                          : "#FF6B35"
                      }
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "#222222",
                          marginBottom: 4
                        }}
                      >
                        {t("reservation.equipmentViolationPolicy")}
                      </Text>
                      <Text
                        style={[
                          { fontSize: 14, fontWeight: "500" },
                          {
                            color:
                              propertyDetails.equipmentViolationPolicyAccepted
                                ? "#008489"
                                : "#FF6B35"
                          }
                        ]}
                      >
                        {propertyDetails.equipmentViolationPolicyAccepted
                          ? "✅ Accepted"
                          : "❌ Not Accepted"}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#484848",
                      lineHeight: 20,
                      marginLeft: 36
                    }}
                  >
                    {t("reservation.equipmentViolationPolicyDescription")}
                  </Text>
                </View>

                {/* User Safety Policy */}
                <View
                  style={{
                    marginBottom: 24,
                    paddingBottom: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F0F0F0"
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      marginBottom: 12
                    }}
                  >
                    <MaterialIcons
                      name="safety-check"
                      size={24}
                      color={
                        propertyDetails.userSafetyPolicyAccepted
                          ? "#008489"
                          : "#FF6B35"
                      }
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "#222222",
                          marginBottom: 4
                        }}
                      >
                        {t("reservation.userSafetyPolicy")}
                      </Text>
                      <Text
                        style={[
                          { fontSize: 14, fontWeight: "500" },
                          {
                            color: propertyDetails.userSafetyPolicyAccepted
                              ? "#008489"
                              : "#FF6B35"
                          }
                        ]}
                      >
                        {propertyDetails.userSafetyPolicyAccepted
                          ? "✅ Accepted"
                          : "❌ Not Accepted"}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#484848",
                      lineHeight: 20,
                      marginLeft: 36
                    }}
                  >
                    {t("reservation.userSafetyPolicyDescription")}
                  </Text>
                </View>

                {/* Property Policy */}
                <View
                  style={{
                    marginBottom: 24,
                    paddingBottom: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F0F0F0"
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      marginBottom: 12
                    }}
                  >
                    <MaterialIcons
                      name="home"
                      size={24}
                      color={
                        propertyDetails.propertyPolicyAccepted
                          ? "#008489"
                          : "#FF6B35"
                      }
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "#222222",
                          marginBottom: 4
                        }}
                      >
                        {t("reservation.propertyPolicy")}
                      </Text>
                      <Text
                        style={[
                          { fontSize: 14, fontWeight: "500" },
                          {
                            color: propertyDetails.propertyPolicyAccepted
                              ? "#008489"
                              : "#FF6B35"
                          }
                        ]}
                      >
                        {propertyDetails.propertyPolicyAccepted
                          ? "✅ Accepted"
                          : "❌ Not Accepted"}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#484848",
                      lineHeight: 20,
                      marginLeft: 36
                    }}
                  >
                    {t("reservation.propertyPolicyDescription")}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Notification Enable FormSheet - Airbnb Style */}
      <BottomSheetForm
        visible={showNotificationSheet}
        onClose={() => setShowNotificationSheet(false)}
        title="Stay Updated"
        height={Dimensions.get("window").height * 0.7}
      >
        <View style={{ padding: 20 }}>
          {/* Icon */}
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: theme["color-temporary-primary"] + "20",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <MaterialIcons
                name="notifications-active"
                size={32}
                color={theme["color-temporary-primary"]}
              />
            </View>
          </View>

          {/* Message */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#222",
              textAlign: "center",
              marginBottom: 12
            }}
          >
            Get notified about your booking
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#666",
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 20
            }}
          >
            We'll send you updates about your reservation and create a
            conversation between you and the host so you can communicate
            directly.
          </Text>

          {/* Toggle Switch - Compact */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: "#F7F7F7",
              borderRadius: 12
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "500", color: "#222" }}>
              Push notifications
            </Text>
            <Switch
              value={user?.allowsNotifications || false}
              onValueChange={(value) => {
                if (value) {
                  handleEnableNotifications();
                } else {
                  setAllowsNotifications(false);
                }
              }}
              trackColor={{
                false: "#cccccc",
                true: theme["color-temporary-primary"]
              }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={
              user?.allowsNotifications
                ? () => setShowNotificationSheet(false)
                : handleEnableNotifications
            }
            style={{
              backgroundColor: theme["color-temporary-primary"],
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: "center",
              shadowColor: theme["color-temporary-primary"],
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4
            }}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
              {user?.allowsNotifications ? "Continue" : "Enable Notifications"}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetForm>

      {/* Toast Messages */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onHide={() => setShowToast(false)}
        />
      )}
    </View>
  );
};

export default PropertyReservationScreen;
