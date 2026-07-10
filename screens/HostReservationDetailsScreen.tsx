import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../services/api";
import { endpoints } from "../constants";

export const HostReservationDetailsScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const reservation = route.params?.reservation as any;

  const [remaining, setRemaining] = useState<string>("");
  const [status, setStatus] = useState<string>(
    reservation?.status || "pending"
  );

  const expiresAt = useMemo(
    () => (reservation?.expiresAt ? new Date(reservation.expiresAt) : null),
    [reservation]
  );
  const createdAt = useMemo(
    () => (reservation?.CreatedAt ? new Date(reservation.CreatedAt) : null),
    [reservation]
  );

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const now = new Date().getTime();
      const end = expiresAt.getTime();
      const diff = end - now;
      if (diff <= 0) {
        setRemaining("Expired");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setRemaining(`${hours}h ${minutes}m left to respond`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const updateStatus = useMutation(
    async (next: "confirmed" | "rejected") => {
      return api.patch(
        `${endpoints.baseURL}/apartment/${reservation.ID}/status`,
        { status: next }
      );
    },
    {
      onSuccess: (_res, variables) => {
        setStatus(variables);
      }
    }
  );

  const nights = useMemo(() => {
    if (!reservation?.checkIn || !reservation?.checkOut) return 1;
    const ci = new Date(reservation.checkIn).getTime();
    const co = new Date(reservation.checkOut).getTime();
    const d = Math.max(1, Math.round((co - ci) / (1000 * 60 * 60 * 24)));
    return d;
  }, [reservation]);

  const nightly = reservation?.property?.nightlyPrice || 0;
  const cleaningFee = Math.max(0, Math.round(nightly * 0.02));
  const serviceFee = 0;
  const isPending = status === "pending" && remaining !== "Expired";

  return (
    <View style={styles.container}>
      <View
        style={{
          flex: 1,
          marginTop: "15%"
        }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reservation request</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={{
                  uri:
                    reservation?.property?.images?.[0] ||
                    "https://via.placeholder.com/120"
                }}
                style={styles.cover}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.title} numberOfLines={2}>
                  {reservation?.property?.title}
                </Text>
                <Text style={styles.subtitle}>
                  {reservation?.property?.city}
                </Text>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusPill,
                      status === "confirmed" && styles.statusConfirmed,
                      status === "pending" && styles.statusPending,
                      (status === "cancelled" ||
                        status === "rejected" ||
                        status === "expired") &&
                        styles.statusCancelled
                    ]}
                  >
                    <Text style={styles.statusText}>{status}</Text>
                  </View>
                  {createdAt ? (
                    <Text style={styles.metaSmall}>
                      Requested{" "}
                      {createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric"
                      })}
                    </Text>
                  ) : null}
                </View>
                {isPending ? (
                  <Text style={styles.countdown}>{remaining}</Text>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guest</Text>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Image
                  source={{
                    uri:
                      reservation?.guest?.avatarURL ||
                      "https://via.placeholder.com/64"
                  }}
                  style={styles.avatar}
                />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.guestName}>
                    {reservation?.guest?.firstName}{" "}
                    {reservation?.guest?.lastName}
                  </Text>
                  <Text style={styles.meta}>
                    Guests: {reservation?.numGuests}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dates</Text>
            <Text style={styles.meta}>
              {new Date(reservation.checkIn).toDateString()} -{" "}
              {new Date(reservation.checkOut).toDateString()}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price details</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.meta}>{`${nightly} MRU x ${nights} night${
                nights > 1 ? "s" : ""
              }`}</Text>
              <Text style={styles.metaStrong}>{nightly * nights} MRU</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.meta}>Cleaning fee</Text>
              <Text style={styles.metaStrong}>{cleaningFee} MRU</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.meta}>Service fee</Text>
              <Text style={styles.metaStrong}>{serviceFee} MRU</Text>
            </View>
            <View
              style={{
                height: 1,
                backgroundColor: "#EFEFEF",
                marginVertical: 10
              }}
            />
            <View style={styles.rowBetween}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.total}>
                {Math.round(reservation.totalPrice)} MRU
              </Text>
            </View>
          </View>

          {reservation?.property?.cancellationPolicy ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cancellation policy</Text>
              <Text style={styles.meta}>
                {reservation.property.cancellationPolicy}
              </Text>
            </View>
          ) : null}

          {reservation?.note || reservation?.Note ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Message</Text>
              <Text style={styles.message}>
                {reservation.note || reservation.Note}
              </Text>
            </View>
          ) : null}

          <View style={{ height: 80 }} />
        </ScrollView>

        {isPending ? (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.rejectBtn,
                updateStatus.isLoading && { opacity: 0.5 }
              ]}
              disabled={updateStatus.isLoading}
              onPress={() => updateStatus.mutate("rejected")}
            >
              <Text style={[styles.actionText, { color: "#991B1B" }]}>
                Decline
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.acceptBtn,
                updateStatus.isLoading && { opacity: 0.5 }
              ]}
              disabled={updateStatus.isLoading}
              onPress={() => updateStatus.mutate("confirmed")}
            >
              <Text style={[styles.actionText, { color: "#FFFFFF" }]}>
                {updateStatus.isLoading ? "Please wait…" : "Accept"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.footerStatic}>
            <View style={styles.confirmBanner}>
              <MaterialIcons name="check-circle" size={18} color="#047857" />
              <Text style={styles.confirmText}>
                This reservation was confirmed
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EBEBEB"
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#222222" },
  scroll: { flex: 1 },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1"
  },
  cover: {
    width: 100,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F2F2F2"
  },
  title: { fontSize: 16, fontWeight: "700", color: "#222222" },
  subtitle: { fontSize: 12, color: "#717171", marginTop: 2 },
  countdown: { marginTop: 6, fontSize: 12, color: "#92400E" },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5"
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 6
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EAEAEA"
  },
  guestName: { fontSize: 14, fontWeight: "700", color: "#222222" },
  meta: { fontSize: 13, color: "#717171" },
  message: { fontSize: 14, color: "#222222", lineHeight: 20 },
  total: { fontSize: 18, fontWeight: "700", color: "#222222" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EBEBEB",
    gap: 8
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center"
  },
  rejectBtn: { backgroundColor: "#FEE2E2" },
  acceptBtn: { backgroundColor: "#222222" },
  actionText: { fontSize: 15, fontWeight: "700" },
  statusRow: { flexDirection: "row", alignItems: "center" },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#F5F5F5"
  },
  statusConfirmed: { backgroundColor: "#E2F9E1" },
  statusPending: { backgroundColor: "#FDE68A" },
  statusCancelled: { backgroundColor: "#FEE2E2" },
  statusText: { fontSize: 12, color: "#222222" },
  metaSmall: { fontSize: 12, color: "#717171", marginLeft: 8 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#222222" },
  metaStrong: { fontSize: 16, fontWeight: "700", color: "#222222" },
  footerStatic: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EBEBEB"
  },
  confirmBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E7F5EF",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: "center"
  },
  confirmText: { color: "#047857", fontWeight: "700" }
});

export default HostReservationDetailsScreen;
