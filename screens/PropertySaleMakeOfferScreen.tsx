import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text } from "@ui-kitten/components";
import axios from "axios";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { CheckCircle } from "phosphor-react-native";

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
  LDChip,
  LDHintCard,
  ld,
} from "../components/listing/listingDetailsUi";

const formatNumber = (value: number, locale: string) => {
  try {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
      value,
    );
  } catch {
    return value.toLocaleString();
  }
};

const parseAmount = (value: string) => {
  const digits = value.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
};

const PropertySaleMakeOfferScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const { t, i18n } = useTranslation();

  const { propertyID, propertyTitle, listingPrice, coverImage } =
    route?.params || {};
  const offerLocale = i18n.language?.toLowerCase().startsWith("fr")
    ? "fr-FR"
    : "en-US";

  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const amountNumeric = useMemo(() => parseAmount(amount), [amount]);
  const askingPrice = listingPrice
    ? formatNumber(Number(listingPrice), offerLocale)
    : null;

  const handleAmountChange = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, "");
    if (!digitsOnly) {
      setAmount("");
      return;
    }
    setAmount(formatNumber(Number(digitsOnly), offerLocale));
  };

  const suggestions = useMemo(() => {
    if (!listingPrice || listingPrice <= 0) return [];
    const base = Number(listingPrice);
    return [
      { key: "match", label: t("offers.match", "Match"), value: base },
      { key: "below", label: "-5%", value: Math.round(base * 0.95) },
      { key: "above", label: "+2%", value: Math.round(base * 1.02) },
    ];
  }, [listingPrice, t]);

  const submit = async () => {
    if (!user?.accessToken) {
      setToast({
        message: t("auth.loginToContinue", "Please log in"),
        type: "error",
      });
      return;
    }
    if (!amountNumeric || amountNumeric <= 0) {
      setToast({
        message: t("offers.amountRequired", "Enter an amount"),
        type: "error",
      });
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        `${endpoints.propertySales}/${propertyID}/offers`,
        { amount: amountNumeric, message: message.trim() || undefined },
        {
          headers: { Authorization: `Bearer ${user.accessToken}` },
          timeout: 20000,
        },
      );
      setToast({
        message: t("offers.success", "Offer sent!"),
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
          title={t("offers.title", "Make an offer")}
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[ld.contentPad, ld.contentPadScroll]}
        >
          <LDPropertyContextCard
            title={propertyTitle}
            priceLabel={askingPrice ? ` ${askingPrice} MRU` : undefined}
            imageUri={coverImage}
          />

          <LDSectionTitle title={t("offers.yourOffer", "Your offer")} />
          <View style={ld.amountRow}>
            <Text style={ld.currency}>MRU</Text>
            <TextInput
              placeholder="0"
              placeholderTextColor="#C7C7CC"
              style={ld.amountInput}
              keyboardType="numeric"
              value={amount}
              onChangeText={handleAmountChange}
              maxLength={15}
            />
          </View>
          {askingPrice ? (
            <Text style={{ fontSize: 13, color: LD.muted, marginBottom: 16 }}>
              {t("offers.listingPrice", "Listing price")}: {askingPrice} MRU
            </Text>
          ) : null}

          {suggestions.length > 0 && (
            <View style={[ld.chipRow, { marginBottom: 20 }]}>
              {suggestions.map((s) => (
                <LDChip
                  key={s.key}
                  label={s.label}
                  selected={amountNumeric > 0 && amountNumeric === s.value}
                  onPress={() => setAmount(formatNumber(s.value, offerLocale))}
                />
              ))}
            </View>
          )}

          <LDSectionTitle
            title={t("offers.messageLabel", "Message (optional)")}
          />
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            placeholder={
              t(
                "offers.messagePlaceholder",
                "Add a personal note for the owner...",
              ) as string
            }
            placeholderTextColor="#9CA3AF"
            style={ld.textArea}
          />

          <LDHintCard
            text={t("offers.infoHint", "The owner will be notified instantly")}
            icon={<CheckCircle size={18} color={LD.accent} weight="fill" />}
          />
        </ScrollView>

        <LDBottomBar>
          <LDActionButton
            label={
              loading
                ? t("common.loading", "Sending...")
                : t("offers.submit", "Send offer")
            }
            onPress={submit}
            loading={loading}
            variant="primary"
          />
        </LDBottomBar>
      </KeyboardAvoidingView>

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

export default PropertySaleMakeOfferScreen;
