import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  Platform,
  TextInput,
  Modal,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Text as RNText,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Text } from "@ui-kitten/components";
import axios from "axios";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Calendar, VideoCamera, CheckCircle, X } from "phosphor-react-native";

import { endpoints } from "../constants";
import { useUser } from "../hooks/useUser";
import Toast from "../components/CustomToast";
import {
  LD,
  LDNavHeader,
  LDPropertyContextCard,
  LDSectionTitle,
  LDBottomBar,
  LDActionButton,
  LDSelectOption,
  LDChip,
  LDHintCard,
  ld,
} from "../components/listing/listingDetailsUi";

type TourType = "in_person" | "video";

const formatDate = (date: Date | null, locale: string) => {
  if (!date) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return date.toDateString();
  }
};

const formatTime = (date: Date | null, locale: string) => {
  if (!date) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
  }
};

export const PropertySaleRequestTourScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const { t, i18n } = useTranslation();

  const { propertyID, propertyTitle, listingPrice, coverImage } =
    route?.params || {};

  const [tourType, setTourType] = useState<TourType>("in_person");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const quickSlots = useMemo(() => {
    const now = new Date();
    const slots: { label: string; date: Date }[] = [];
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    slots.push({
      label: `${t("common.tomorrow", "Tomorrow")} 10:00`,
      date: tomorrow,
    });
    const tomorrowAfternoon = new Date(now);
    tomorrowAfternoon.setDate(now.getDate() + 1);
    tomorrowAfternoon.setHours(15, 0, 0, 0);
    slots.push({
      label: `${t("common.tomorrow", "Tomorrow")} 15:00`,
      date: tomorrowAfternoon,
    });
    const dayAfter = new Date(now);
    dayAfter.setDate(now.getDate() + 2);
    dayAfter.setHours(11, 0, 0, 0);
    slots.push({
      label: formatDate(dayAfter, i18n.language),
      date: dayAfter,
    });
    return slots;
  }, [t, i18n.language]);

  const ensureDateForTime = () => {
    if (selectedDate) return selectedDate;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow;
  };

  const onPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setPickerMode(null);
    if (event.type === "dismissed" || !date) return;
    setSelectedDate((prev) => {
      if (!prev) return date;
      if (pickerMode === "date") {
        const next = new Date(prev);
        next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        return next;
      }
      if (pickerMode === "time") {
        const next = new Date(prev);
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
        return next;
      }
      return date;
    });
  };

  const formattedDate = formatDate(selectedDate, i18n.language);
  const formattedTime = formatTime(selectedDate, i18n.language);
  const priceLabel =
    listingPrice != null
      ? `MRU ${Number(listingPrice).toLocaleString("fr-MR")}`
      : undefined;

  const submit = async () => {
    if (!user?.accessToken) {
      setToast({
        message: t("auth.loginToContinue", "Please log in"),
        type: "error",
      });
      return;
    }
    if (!selectedDate) {
      setToast({
        message: t("tours.validation.dateRequired", "Choose a date"),
        type: "error",
      });
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        `${endpoints.baseURL}/property-tours/property/${propertyID}`,
        {
          tour_date: selectedDate.toISOString(),
          tour_time: `${selectedDate.getHours().toString().padStart(2, "0")}:${selectedDate.getMinutes().toString().padStart(2, "0")}`,
          duration: 60,
          tour_type: tourType,
          customer_notes: note.trim() || undefined,
        },
        {
          headers: { Authorization: `Bearer ${user.accessToken}` },
          timeout: 20000,
        },
      );
      setToast({
        message: t("tours.successMessage", "Tour requested!"),
        type: "success",
      });
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "Root",
              params: {
                screen: "AccountRoot",
                params: { screen: "Messages" },
              },
            },
          ],
        });
      }, 600);
    } catch (error: any) {
      setToast({
        message:
          error?.response?.data?.message ||
          t("common.somethingWrong", "Something went wrong"),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={ld.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <LDNavHeader
          title={t("tours.requestTitle", "Request a tour")}
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[ld.contentPad, ld.contentPadScroll]}
        >
        <LDPropertyContextCard
          title={propertyTitle}
          priceLabel={priceLabel}
          imageUri={coverImage}
        />

        <LDSectionTitle title={t("tours.tourType", "Tour type")} />
        <View style={ld.selectRow}>
          <LDSelectOption
            label={t("tours.inPerson", "In person")}
            selected={tourType === "in_person"}
            onPress={() => setTourType("in_person")}
            icon={
              <Calendar
                size={20}
                color={tourType === "in_person" ? LD.accent : "#444"}
                weight="duotone"
              />
            }
          />
          <LDSelectOption
            label={t("tours.video", "Video")}
            selected={tourType === "video"}
            onPress={() => setTourType("video")}
            icon={
              <VideoCamera
                size={20}
                color={tourType === "video" ? LD.accent : "#444"}
                weight="duotone"
              />
            }
          />
        </View>

        <LDSectionTitle title={t("tours.dateTime", "Date & time")} />
        <View style={ld.fieldRow}>
          <TouchableOpacity
            style={[ld.fieldBox, formattedDate && ld.fieldBoxActive]}
            onPress={() => setPickerMode("date")}
            activeOpacity={0.8}
          >
            <Text style={ld.fieldLabel}>{t("tours.date", "Date")}</Text>
            <Text
              style={[
                ld.fieldValue,
                !formattedDate && ld.fieldPlaceholder,
              ]}
            >
              {formattedDate || t("tours.selectDate", "Select")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[ld.fieldBox, formattedTime && ld.fieldBoxActive]}
            onPress={() => {
              setSelectedDate((prev) => prev ?? ensureDateForTime());
              setPickerMode("time");
            }}
            activeOpacity={0.8}
          >
            <Text style={ld.fieldLabel}>{t("tours.time", "Time")}</Text>
            <Text
              style={[
                ld.fieldValue,
                !formattedTime && ld.fieldPlaceholder,
              ]}
            >
              {formattedTime || t("tours.selectTime", "Select")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[ld.chipRow, { marginTop: 14, marginBottom: 8 }]}>
          {quickSlots.map((slot, i) => {
            const isActive =
              selectedDate &&
              Math.abs(selectedDate.getTime() - slot.date.getTime()) <
                5 * 60 * 1000;
            return (
              <LDChip
                key={i}
                label={slot.label}
                selected={!!isActive}
                onPress={() => setSelectedDate(slot.date)}
              />
            );
          })}
        </View>

        <LDSectionTitle title={t("tours.notes", "Notes (optional)")} />
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          placeholder={
            t(
              "tours.notesPlaceholder",
              "Anything the host should know...",
            ) as string
          }
          placeholderTextColor="#9CA3AF"
          style={ld.textArea}
        />

        <LDHintCard
          text={t(
            "tours.responseTimeHint",
            "Usually responds within an hour",
          )}
          icon={<CheckCircle size={18} color={LD.accent} weight="fill" />}
        />
      </ScrollView>

      <LDBottomBar>
        <LDActionButton
          label={
            loading
              ? t("common.loading", "Sending...")
              : t("tours.submitRequest", "Request tour")
          }
          onPress={submit}
          loading={loading}
          variant="primary"
        />
      </LDBottomBar>
      </KeyboardAvoidingView>

      {pickerMode && Platform.OS === "ios" && (
        <Modal visible transparent animationType="slide">
          <Pressable
            style={ld.pickerBackdrop}
            onPress={() => setPickerMode(null)}
          />
          <View style={ld.pickerSheet}>
            <View style={ld.pickerHandle} />
            <View style={ld.pickerHeader}>
              <Text style={ld.pickerTitle}>
                {pickerMode === "date"
                  ? t("tours.selectDate", "Select date")
                  : t("tours.selectTime", "Select time")}
              </Text>
              <Pressable
                style={ld.pickerClose}
                onPress={() => setPickerMode(null)}
              >
                <X size={16} color={LD.black} weight="bold" />
              </Pressable>
            </View>
            <DateTimePicker
              value={selectedDate ?? ensureDateForTime()}
              mode={pickerMode}
              display="spinner"
              onChange={onPickerChange}
              minimumDate={new Date()}
              textColor={LD.black}
              style={ld.picker}
            />
            <TouchableOpacity
              style={ld.pickerDone}
              onPress={() => setPickerMode(null)}
            >
              <RNText style={ld.pickerDoneText}>{t("common.done", "Done")}</RNText>
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {pickerMode && Platform.OS === "android" && (
        <DateTimePicker
          value={selectedDate ?? ensureDateForTime()}
          mode={pickerMode}
          display="default"
          onChange={onPickerChange}
          minimumDate={new Date()}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(null)}
        />
      )}
    </View>
  );
};

export default PropertySaleRequestTourScreen;
