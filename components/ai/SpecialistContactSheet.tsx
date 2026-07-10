import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { Text } from "@ui-kitten/components";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import { X, Headset } from "phosphor-react-native";
import Toast from "../CustomToast";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    email: string;
    phone: string;
    note: string;
  }) => Promise<void>;
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
};

export function SpecialistContactSheet({
  visible,
  onClose,
  onSubmit,
  defaultName = "",
  defaultEmail = "",
  defaultPhone = "",
}: Props) {
  const { t } = useTranslation();
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["58%", "88%"], []);

  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (visible) {
      setName(defaultName);
      setEmail(defaultEmail);
      setPhone(defaultPhone);
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible, defaultName, defaultEmail, defaultPhone]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.35}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedEmail && !trimmedPhone) {
      setToast({
        message: t(
          "modelX46.escalation.contactRequired",
          "Please add an email or phone number so we can reach you.",
        ),
        type: "error",
      });
      return;
    }
    Keyboard.dismiss();
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: trimmedEmail,
        phone: trimmedPhone,
        note: note.trim(),
      });
      setToast({
        message: t(
          "modelX46.escalation.requestSent",
          "Request sent — a specialist will contact you soon.",
        ),
        type: "success",
      });
      setTimeout(() => {
        onClose();
      }, 900);
    } catch {
      setToast({
        message: t(
          "modelX46.escalation.requestFailed",
          "Could not send your request. Please try again.",
        ),
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backdropComponent={renderBackdrop}
        onDismiss={onClose}
        handleIndicatorStyle={styles.handle}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <Headset size={22} color="#059669" weight="fill" />
              <Text style={styles.title}>
                {t("modelX46.escalation.sheetTitle", "Talk to a specialist")}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <X size={22} color="#666" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            {t(
              "modelX46.escalation.sheetSubtitle",
              "Share how we can reach you. Our team will follow up by email or phone.",
            )}
          </Text>

          <Text style={styles.label}>{t("common.name", "Name")}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t("modelX46.escalation.namePlaceholder", "Your name")}
            autoCapitalize="words"
          />

          <Text style={styles.label}>{t("common.email", "Email")}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>{t("common.phone", "Phone")}</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+222 ..."
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>
            {t("modelX46.escalation.noteLabel", "What do you need help with?")}
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={note}
            onChangeText={setNote}
            placeholder={t(
              "modelX46.escalation.notePlaceholder",
              "Briefly describe your question…",
            )}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>
                {t("modelX46.escalation.submitRequest", "Send request")}
              </Text>
            )}
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheetModal>
      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(null)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  handle: { backgroundColor: "#D1D5DB", width: 40 },
  content: { paddingHorizontal: 20, paddingBottom: 36 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 18, fontWeight: "700", color: "#111" },
  subtitle: { fontSize: 13, color: "#666", lineHeight: 18, marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#444",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: "#111",
    backgroundColor: "#FAFAFA",
  },
  textArea: { minHeight: 88, paddingTop: 11 },
  submitBtn: {
    marginTop: 20,
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
