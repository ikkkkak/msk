import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal,
  Animated as RNAnimated,
  Image,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { Formik } from "formik";
import { Eye, EyeSlash, ArrowLeft } from "phosphor-react-native";

import { Screen } from "../components/Screen";
import { useAuth } from "../hooks/useAuth";
import { checkUserExists } from "../services/user";
import {
  getApiErrorUserMessage,
  logApiError,
  pingApiHealth,
} from "../utils/apiError";
import {
  abandonPostAuthReturn,
  setPostAuthReturnToPropertyDetails,
} from "../utils/authReturnNavigation";

const { width } = Dimensions.get("window");

type AuthFlow = "initial" | "login" | "signup";

export const UnifiedAuthScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const returnToPropertyId = (route.params as { returnToPropertyId?: number })
    ?.returnToPropertyId;
  const { nativeLogin, nativeLoginPhone, nativeRegister, nativeRegisterPhone } =
    useAuth();

  useEffect(() => {
    if (typeof returnToPropertyId === "number") {
      setPostAuthReturnToPropertyDetails(returnToPropertyId);
    }
    return () => {
      if (typeof returnToPropertyId === "number") {
        abandonPostAuthReturn(returnToPropertyId);
      }
    };
  }, [returnToPropertyId]);

  const [selectedTab, setSelectedTab] = useState<"email" | "phone">("email");
  const [authFlow, setAuthFlow] = useState<AuthFlow>("initial");
  const [isChecking, setIsChecking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [identifierType, setIdentifierType] = useState<"email" | "phone">(
    "email",
  );

  const [emailIdentifier, setEmailIdentifier] = useState("");
  const [phoneIdentifier, setPhoneIdentifier] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingIdentifier, setPendingIdentifier] = useState("");
  const [pendingType, setPendingType] = useState<"email" | "phone">("email");

  // Refs
  const passwordInputRef = useRef<TextInput | null>(null);
  const firstNameInputRef = useRef<TextInput | null>(null);

  // Animated values for floating labels
  const emailLabelAnim = useRef(new RNAnimated.Value(0)).current;
  const phoneLabelAnim = useRef(new RNAnimated.Value(0)).current;
  const flowSlideAnim = useRef(new RNAnimated.Value(0)).current;
  const tabOpacityAnim = useRef(new RNAnimated.Value(1)).current;

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length === 8 && ["2", "3", "4"].includes(cleaned.charAt(0));
  };

  const handleTabSelect = (tab: "email" | "phone") => {
    if (authFlow !== "initial") return; // Disable tab switching after flow starts
    setSelectedTab(tab);
    setIdentifierType(tab);
  };

  const handleEmailChange = (value: string) => {
    setEmailIdentifier(value);
    setIdentifier(value);

    RNAnimated.timing(emailLabelAnim, {
      toValue: value.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    RNAnimated.timing(tabOpacityAnim, {
      toValue: value.length > 0 ? 0.5 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePhoneChange = (value: string) => {
    const cleanValue = value.replace(/^\+222\s*/, "").replace(/\D/g, "");
    setPhoneIdentifier(cleanValue);
    setIdentifier(cleanValue);

    RNAnimated.timing(phoneLabelAnim, {
      toValue: cleanValue.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    RNAnimated.timing(tabOpacityAnim, {
      toValue: cleanValue.length > 0 ? 0.5 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleIdentifierSubmit = () => {
    const currentValue =
      selectedTab === "email" ? emailIdentifier : phoneIdentifier;
    if (!currentValue.trim() || !acceptedTerms) return;

    const isValid =
      selectedTab === "email"
        ? validateEmail(currentValue.trim())
        : validatePhone(currentValue.trim());

    if (!isValid) {
      Alert.alert(
        t("auth.error.title", "Error"),
        selectedTab === "email"
          ? t("auth.validation.emailInvalid", "Please enter a valid email")
          : t(
              "auth.validation.phoneInvalid",
              "Please enter a valid 8-digit phone number",
            ),
      );
      return;
    }

    const normalizedValue =
      selectedTab === "phone"
        ? currentValue.replace(/\D/g, "")
        : currentValue.toLowerCase().trim();

    setPendingIdentifier(normalizedValue);
    setPendingType(selectedTab);
    setShowConfirmModal(true);
  };

  const handleConfirmIdentifier = async () => {
    setShowConfirmModal(false);
    setIsChecking(true);

    try {
      // Security: Constant time delay to prevent enumeration
      const MIN_DELAY = 800;
      const start = Date.now();

      setIdentifier(pendingIdentifier);
      setIdentifierType(pendingType);

      const health = await pingApiHealth(5000);
      if (!health.ok) {
        logApiError("auth.health", new Error(health.message), {
          type: health.code,
          url: health.url,
          latencyMs: health.latencyMs,
        });
        Alert.alert(
          t("apiErrors.serverUnreachableTitle", "Connection problem"),
          t(
            "apiErrors.NET_NO_RESPONSE",
            "Unable to connect right now. Check your internet connection and try again.",
          ),
        );
        return;
      }

      const result = await checkUserExists(
        pendingType === "email" ? pendingIdentifier : undefined,
        pendingType === "phone" ? pendingIdentifier : undefined,
      );

      const elapsed = Date.now() - start;
      if (elapsed < MIN_DELAY) {
        await new Promise((resolve) =>
          setTimeout(resolve, MIN_DELAY - elapsed),
        );
      }

      // Slide down animation
      RNAnimated.spring(flowSlideAnim, {
        toValue: 1,
        damping: 20,
        stiffness: 200,
        useNativeDriver: true,
      }).start();

      if (result?.exists) {
        // User exists - login flow
        setAuthFlow("login");
        // Auto-focus password field
        setTimeout(() => {
          passwordInputRef.current?.focus();
        }, 300);
      } else {
        // User doesn't exist - signup flow
        setAuthFlow("signup");
        // Auto-focus first name field
        setTimeout(() => {
          firstNameInputRef.current?.focus();
        }, 300);
      }
    } catch (error: unknown) {
      const parsed = logApiError("auth.checkUser", error);
      Alert.alert(
        t("auth.error.title", "Error"),
        getApiErrorUserMessage(parsed, t),
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleBack = () => {
    if (authFlow !== "initial") {
      // Reset to initial state with animation
      RNAnimated.timing(flowSlideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setAuthFlow("initial");
        setIdentifier("");
        setPendingIdentifier("");
        setShowPassword(false);
      });
    } else {
      navigation.goBack();
    }
  };

  const handleLogin = async (password: string) => {
    setIsLoading(true);
    try {
      if (identifierType === "email") {
        await nativeLogin({ email: identifier, password });
      } else {
        await nativeLoginPhone({ phoneNumber: identifier, password });
      }
    } catch (error: any) {
      // Security: Generic error message to prevent enumeration
      Alert.alert(
        t("auth.error.title", "Error"),
        t(
          "auth.error.invalidCredentials",
          "Invalid credentials. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (values: {
    firstName: string;
    lastName: string;
    password: string;
  }) => {
    setIsLoading(true);
    try {
      if (identifierType === "email") {
        await nativeRegister({
          firstName: values.firstName,
          lastName: values.lastName,
          email: identifier,
          password: values.password,
        });
      } else {
        await nativeRegisterPhone({
          firstName: values.firstName,
          lastName: values.lastName,
          phoneNumber: identifier,
          password: values.password,
        });
      }
    } catch (error: any) {
      Alert.alert(
        t("auth.error.title", "Error"),
        t("auth.error.signup", "Unable to create account. Please try again."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Animated styles
  const emailLabelStyle = {
    position: "absolute" as const,
    left: 0,
    top: emailLabelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 0],
    }),
    fontSize: emailLabelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: "#717171",
  };

  const phoneLabelStyle = {
    position: "absolute" as const,
    left: 0,
    top: phoneLabelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 0],
    }),
    fontSize: phoneLabelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: "#717171",
  };

  const flowContainerStyle = {
    opacity: flowSlideAnim,
    transform: [
      {
        translateY: flowSlideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0],
        }),
      },
    ],
  };

  return (
    <Screen style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Minimal Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.6}
        >
          <ArrowLeft size={20} color="#000000" weight="regular" />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={require("../assets/logo.png")}
            style={styles.logo}
            resizeMode="cover"
          />
        </View>
        <View style={styles.content}>
          {/* Welcome Section with Logo - Only show on initial flow */}

          {authFlow === "initial" && (
            <View style={styles.welcomeSection}>
              <View style={styles.welcomeContent}>
                <Text style={styles.welcomeMessage}>
                  <Text style={styles.welcomeMessage}>
                    {t(
                      "auth.welcomeMessage",
                      "YOU CAN GET WHAT YOU ARE LOOKING FOR IN SECONDS !!",
                    )}
                  </Text>
                </Text>
              </View>
            </View>
          )}

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {authFlow === "login"
                ? t("auth.signIn.title", "Welcome back")
                : authFlow === "signup"
                  ? t("auth.signUp.title", "Create account")
                  : ""}
            </Text>
          </View>

          {/* Initial Input Section */}
          {authFlow === "initial" && (
            <View style={styles.formContainer}>
              {/* Tabs */}
              <RNAnimated.View
                style={[styles.tabContainer, { opacity: tabOpacityAnim }]}
              >
                <TouchableOpacity
                  style={[
                    styles.tab,
                    selectedTab === "email" && styles.activeTab,
                  ]}
                  onPress={() => handleTabSelect("email")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selectedTab === "email" && styles.activeTabText,
                    ]}
                  >
                    {t("auth.email", "Email")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    selectedTab === "phone" && styles.activeTab,
                  ]}
                  onPress={() => handleTabSelect("phone")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selectedTab === "phone" && styles.activeTabText,
                    ]}
                  >
                    {t("auth.phone", "Phone")}
                  </Text>
                </TouchableOpacity>
              </RNAnimated.View>

              {/* Input Field */}
              <View style={styles.inputWrapper}>
                {selectedTab === "phone" ? (
                  <View style={styles.phoneInputOuter}>
                    <RNAnimated.Text style={phoneLabelStyle}>
                      {t("auth.phone", "Phone")}
                    </RNAnimated.Text>
                    <View style={styles.phoneInputContainer}>
                      <View style={styles.phonePrefix}>
                        <Text style={styles.phonePrefixText}>+222</Text>
                      </View>
                      <TextInput
                        style={[styles.input, styles.phoneInput]}
                        value={phoneIdentifier}
                        onChangeText={handlePhoneChange}
                        placeholder=""
                        keyboardType="phone-pad"
                        maxLength={8}
                        autoCorrect={false}
                        editable={!isChecking}
                        onFocus={() => {
                          RNAnimated.timing(phoneLabelAnim, {
                            toValue: 1,
                            duration: 200,
                            useNativeDriver: false,
                          }).start();
                        }}
                        onBlur={() => {
                          if (!phoneIdentifier) {
                            RNAnimated.timing(phoneLabelAnim, {
                              toValue: 0,
                              duration: 200,
                              useNativeDriver: false,
                            }).start();
                          }
                        }}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.inputOuter}>
                    <RNAnimated.Text style={emailLabelStyle}>
                      {t("auth.email", "Email")}
                    </RNAnimated.Text>
                    <TextInput
                      style={styles.input}
                      value={emailIdentifier}
                      onChangeText={handleEmailChange}
                      placeholder=""
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                      editable={!isChecking}
                      onFocus={() => {
                        RNAnimated.timing(emailLabelAnim, {
                          toValue: 1,
                          duration: 200,
                          useNativeDriver: false,
                        }).start();
                      }}
                      onBlur={() => {
                        if (!emailIdentifier) {
                          RNAnimated.timing(emailLabelAnim, {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: false,
                          }).start();
                        }
                      }}
                    />
                  </View>
                )}
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (isChecking ||
                    !(selectedTab === "email"
                      ? emailIdentifier.trim()
                      : phoneIdentifier.trim()) ||
                    !acceptedTerms) &&
                    styles.buttonDisabled,
                ]}
                onPress={handleIdentifierSubmit}
                disabled={
                  isChecking ||
                  !(selectedTab === "email"
                    ? emailIdentifier.trim()
                    : phoneIdentifier.trim()) ||
                  !acceptedTerms
                }
                activeOpacity={0.8}
              >
                {isChecking ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {t("auth.continue", "Continue")}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Terms Checkbox */}
              <View style={styles.termsRow}>
                <TouchableOpacity
                  onPress={() => setAcceptedTerms((prev) => !prev)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      acceptedTerms && styles.checkboxChecked,
                    ]}
                  >
                    {acceptedTerms && <View style={styles.checkboxInner} />}
                  </View>
                </TouchableOpacity>
                <Text style={styles.termsLabel}>
                  {t("auth.iAgree", "I agree to")}{" "}
                  <Text
                    style={styles.termsLink}
                    onPress={() =>
                      (navigation as any).navigate("PrivacyPolicy")
                    }
                  >
                    {t("auth.privacyPolicy", "Privacy Policy")}
                  </Text>{" "}
                  {t("auth.and", "&")}{" "}
                  <Text
                    style={styles.termsLink}
                    onPress={() =>
                      (navigation as any).navigate("TermsOfService")
                    }
                  >
                    {t("auth.termsOfService", "Terms")}
                  </Text>
                </Text>
              </View>
            </View>
          )}

          {/* Login Flow */}
          {authFlow === "login" && (
            <RNAnimated.View style={flowContainerStyle}>
              <View style={styles.identifierDisplay}>
                <Text style={styles.identifierLabel}>
                  {identifierType === "email"
                    ? t("auth.email", "Email")
                    : t("auth.phone", "Phone")}
                </Text>
                <Text style={styles.identifierValue}>
                  {identifierType === "phone"
                    ? `+222 ${identifier}`
                    : identifier}
                </Text>
              </View>

              <Formik
                initialValues={{ password: "" }}
                validationSchema={yup.object().shape({
                  password: yup
                    .string()
                    .required(
                      t(
                        "auth.signIn.validation.passwordRequired",
                        "Password required",
                      ),
                    ),
                })}
                onSubmit={async (values) => {
                  await handleLogin(values.password);
                }}
              >
                {({
                  values,
                  errors,
                  touched,
                  handleChange,
                  handleSubmit,
                  setFieldTouched,
                }) => (
                  <View style={styles.formContainer}>
                    <View style={styles.inputWrapper}>
                      <View style={styles.passwordContainer}>
                        <TextInput
                          style={[
                            styles.input,
                            styles.passwordInput,
                            touched.password &&
                              errors.password &&
                              styles.inputError,
                          ]}
                          value={values.password}
                          onChangeText={handleChange("password")}
                          placeholder={t(
                            "auth.signIn.passwordPlaceholder",
                            "Password",
                          )}
                          placeholderTextColor="#AAAAAA"
                          secureTextEntry={!showPassword}
                          textContentType="password"
                          autoComplete="current-password"
                          onBlur={() => setFieldTouched("password")}
                          ref={passwordInputRef}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeIcon}
                          activeOpacity={0.6}
                        >
                          {showPassword ? (
                            <EyeSlash
                              size={18}
                              color="#AAAAAA"
                              weight="regular"
                            />
                          ) : (
                            <Eye size={18} color="#AAAAAA" weight="regular" />
                          )}
                        </TouchableOpacity>
                      </View>
                      {touched.password && errors.password && (
                        <Text style={styles.errorText}>{errors.password}</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        isLoading && styles.buttonDisabled,
                      ]}
                      onPress={() => handleSubmit()}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          {t("auth.signIn.signIn", "Sign in")}
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        (navigation as any).navigate("ForgotPassword")
                      }
                      activeOpacity={0.6}
                      style={styles.forgotPassword}
                    >
                      <Text style={styles.forgotText}>
                        {t("auth.signIn.forgotPassword", "Forgot password?")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Formik>
            </RNAnimated.View>
          )}

          {/* Signup Flow */}
          {authFlow === "signup" && (
            <RNAnimated.View style={flowContainerStyle}>
              <View style={styles.identifierDisplay}>
                <Text style={styles.identifierLabel}>
                  {identifierType === "email"
                    ? t("auth.email", "Email")
                    : t("auth.phone", "Phone")}
                </Text>
                <Text style={styles.identifierValue}>
                  {identifierType === "phone"
                    ? `+222 ${identifier}`
                    : identifier}
                </Text>
              </View>

              <Formik
                initialValues={{
                  firstName: "",
                  lastName: "",
                  password: "",
                }}
                validationSchema={yup.object().shape({
                  firstName: yup
                    .string()
                    .required(
                      t(
                        "auth.signUp.validation.firstNameRequired",
                        "First name required",
                      ),
                    ),
                  lastName: yup
                    .string()
                    .required(
                      t(
                        "auth.signUp.validation.lastNameRequired",
                        "Last name required",
                      ),
                    ),
                  password: yup
                    .string()
                    .required(
                      t(
                        "auth.signUp.validation.passwordRequired",
                        "Password required",
                      ),
                    )
                    .min(
                      8,
                      t(
                        "auth.signUp.validation.passwordMinLength",
                        "Password must be at least 8 characters",
                      ),
                    ),
                })}
                onSubmit={async (values) => {
                  await handleSignup(values);
                }}
              >
                {({
                  values,
                  errors,
                  touched,
                  handleChange,
                  handleSubmit,
                  setFieldTouched,
                }) => (
                  <View style={styles.formContainer}>
                    <View style={styles.nameRow}>
                      <View style={styles.nameField}>
                        <TextInput
                          style={[
                            styles.input,
                            touched.firstName &&
                              errors.firstName &&
                              styles.inputError,
                          ]}
                          value={values.firstName}
                          onChangeText={handleChange("firstName")}
                          placeholder={t(
                            "auth.signUp.firstNamePlaceholder",
                            "First name",
                          )}
                          placeholderTextColor="#AAAAAA"
                          autoCapitalize="words"
                          textContentType="givenName"
                          onBlur={() => setFieldTouched("firstName")}
                          ref={firstNameInputRef}
                        />
                        {touched.firstName && errors.firstName && (
                          <Text style={styles.errorText}>
                            {errors.firstName}
                          </Text>
                        )}
                      </View>

                      <View style={[styles.nameField, styles.nameFieldLast]}>
                        <TextInput
                          style={[
                            styles.input,
                            touched.lastName &&
                              errors.lastName &&
                              styles.inputError,
                          ]}
                          value={values.lastName}
                          onChangeText={handleChange("lastName")}
                          placeholder={t(
                            "auth.signUp.lastNamePlaceholder",
                            "Last name",
                          )}
                          placeholderTextColor="#AAAAAA"
                          autoCapitalize="words"
                          textContentType="familyName"
                          onBlur={() => setFieldTouched("lastName")}
                        />
                        {touched.lastName && errors.lastName && (
                          <Text style={styles.errorText}>
                            {errors.lastName}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.inputWrapper}>
                      <View style={styles.passwordContainer}>
                        <TextInput
                          style={[
                            styles.input,
                            styles.passwordInput,
                            touched.password &&
                              errors.password &&
                              styles.inputError,
                          ]}
                          value={values.password}
                          onChangeText={handleChange("password")}
                          placeholder={t(
                            "auth.signUp.passwordPlaceholder",
                            "Password (min. 8 characters)",
                          )}
                          placeholderTextColor="#AAAAAA"
                          secureTextEntry={!showPassword}
                          textContentType="newPassword"
                          autoComplete="new-password"
                          onBlur={() => setFieldTouched("password")}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeIcon}
                          activeOpacity={0.6}
                        >
                          {showPassword ? (
                            <EyeSlash
                              size={18}
                              color="#AAAAAA"
                              weight="regular"
                            />
                          ) : (
                            <Eye size={18} color="#AAAAAA" weight="regular" />
                          )}
                        </TouchableOpacity>
                      </View>
                      {touched.password && errors.password && (
                        <Text style={styles.errorText}>{errors.password}</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        isLoading && styles.buttonDisabled,
                      ]}
                      onPress={() => handleSubmit()}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          {t("auth.signUp.createAccount", "Create account")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </Formik>
            </RNAnimated.View>
          )}
        </View>
      </KeyboardAwareScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {t("auth.confirmIdentifierTitle", "Confirm your information")}
            </Text>
            <View style={styles.modalIdentifierBox}>
              <Text style={styles.modalIdentifierText}>
                {pendingType === "phone"
                  ? `+222 ${pendingIdentifier}`
                  : pendingIdentifier}
              </Text>
            </View>
            <Text style={styles.modalMessage}>
              {pendingType === "email"
                ? t("auth.confirmEmailMessage", "Is this your email address?")
                : t("auth.confirmPhoneMessage", "Is this your phone number?")}
            </Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowConfirmModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonSecondaryText}>
                  {t("auth.common.edit", "Edit")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleConfirmIdentifier}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonPrimaryText}>
                  {t("auth.common.confirm", "Confirm")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
  },
  welcomeSection: {
    alignItems: "center",
  },
  welcomeContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 12,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  welcomeMessage: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    textAlign: "left",
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  titleContainer: {
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: -0.5,
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputOuter: {
    position: "relative",
    paddingTop: 18,
  },
  input: {
    fontSize: 16,
    color: "#000000",
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  inputError: {
    borderBottomColor: "#FF3B30",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: "absolute",
    right: 0,
    top: 12,
    padding: 4,
  },
  errorText: {
    fontSize: 11,
    color: "#FF3B30",
    marginTop: 6,
  },
  nameRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  nameField: {
    flex: 1,
  },
  nameFieldLast: {
    marginLeft: 12,
  },
  primaryButton: {
    backgroundColor: "#000000",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  forgotPassword: {
    alignSelf: "center",
    marginTop: 16,
  },
  forgotText: {
    fontSize: 13,
    color: "#000000",
    fontWeight: "500",
  },
  identifierDisplay: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  identifierLabel: {
    fontSize: 12,
    color: "#717171",
    marginBottom: 4,
    fontWeight: "500",
  },
  identifierValue: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#717171",
  },
  activeTabText: {
    color: "#000000",
    fontWeight: "600",
  },
  phoneInputOuter: {
    position: "relative",
    paddingTop: 18,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  phonePrefix: {
    paddingRight: 12,
    paddingVertical: 14,
  },
  phonePrefixText: {
    fontSize: 16,
    color: "#717171",
    fontWeight: "600",
  },
  phoneInput: {
    flex: 1,
    borderBottomWidth: 0,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#CCCCCC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
  },
  checkboxChecked: {
    borderColor: "#000000",
    backgroundColor: "#000000",
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
  termsLabel: {
    flex: 1,
    fontSize: 12,
    color: "#717171",
    lineHeight: 18,
  },
  termsLink: {
    textDecorationLine: "underline",
    color: "#000000",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 16,
    textAlign: "center",
  },
  modalIdentifierBox: {
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  modalIdentifierText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    letterSpacing: 0.3,
  },
  modalMessage: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalButtonSecondary: {
    backgroundColor: "#F2F2F2",
  },
  modalButtonPrimary: {
    backgroundColor: "#000000",
  },
  modalButtonSecondaryText: {
    fontSize: 15,
    color: "#000000",
    fontWeight: "600",
  },
  modalButtonPrimaryText: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
