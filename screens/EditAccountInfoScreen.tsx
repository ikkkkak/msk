import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useUser } from "../hooks/useUser";
import { useNavigation } from "@react-navigation/native";

const PHONE_REGEX = /^[234]\d{7}$/; // Mauritanian: 8 digits starting with 2, 3, or 4

export const EditAccountInfoScreen = () => {
  const { user, updatePhoneNumber } = useUser();
  const navigation = useNavigation();
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPhone(user?.phoneNumber?.replace(/\D/g, "") || "");
  }, [user?.phoneNumber]);

  const handleSave = async () => {
    setError(null);
    const trimmed = phone.replace(/\D/g, "").trim();

    if (trimmed && !PHONE_REGEX.test(trimmed)) {
      setError("Invalid phone. Use 8 digits starting with 2, 3, or 4 (e.g. 22123456).");
      return;
    }

    setSaving(true);
    try {
      await updatePhoneNumber(trimmed || null);
      Alert.alert("Success", trimmed ? "Phone number saved." : "Phone number removed.");
      navigation.goBack();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update. Please try again.";
      setError(msg);
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  const displayEmail = user?.email || "—";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back-ios" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account info</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{displayEmail}</Text>
          <Text style={styles.hint}>Your sign-in email</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone number (optional)</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 22123456"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            maxLength={12}
            editable={!saving}
          />
          <Text style={styles.hint}>
            Add a Mauritanian number (8 digits, starts with 2, 3, or 4) if you signed up with email.
          </Text>
          {error ? <Text style={styles.errText}>{error}</Text> : null}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#000", flex: 1, textAlign: "center" },
  headerSpacer: { width: 40 },
  content: { padding: 24 },
  field: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  value: { fontSize: 16, color: "#111", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111",
  },
  hint: { fontSize: 12, color: "#6B7280", marginTop: 6 },
  errText: { fontSize: 12, color: "#DC2626", marginTop: 6 },
  saveBtn: {
    backgroundColor: "#222",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
