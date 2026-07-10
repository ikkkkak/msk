// import { View, StyleSheet, TouchableOpacity } from "react-native";
// import { Input, Button, Text } from "@ui-kitten/components";
// import * as yup from "yup";
// import { Formik } from "formik";
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

// import { Screen } from "../components/Screen";
// import { ModalHeader } from "../components/ModalHeader";
// import { GoogleButton } from "../components/GoogleButton";
// import { FacebookButton } from "../components/FacebookButton";
// import { AppleButton } from "../components/AppleButton";
// import { OrDivider } from "../components/OrDivider";
// import { PasswordInput } from "../components/PasswordInput";
// import { PhoneInput } from "../components/PhoneInput";
// import { useAuth } from "../hooks/useAuth";

// export const SignUpPhoneScreen = () => {
//   const { nativeRegisterPhone } = useAuth();

//   const validatePhoneNumber = (value: string) => {
//     // Remove all non-digit characters
//     const cleaned = value.replace(/\D/g, '');
    
//     // Check if it's exactly 8 digits for Mauritania
//     if (cleaned.length !== 8) {
//       return false;
//     }
    
//     // Check if it starts with valid Mauritanian prefixes (2, 3, or 4)
//     const firstDigit = cleaned.charAt(0);
//     if (!['2', '3', '4'].includes(firstDigit)) {
//       return false;
//     }
    
//     return true;
//   };

//   return (
//     <KeyboardAwareScrollView bounces={false}>
//       <Screen>
//         <ModalHeader text="habitat" xShown />
//         <View style={styles.container}>
//           <Text category={"h5"} style={styles.header}>
//             Create Account with Phone
//           </Text>
//           <Text category={"s1"} style={styles.subtitle}>
//             Enter your details to get started
//           </Text>
          
//           <Formik
//             initialValues={{
//               firstName: "",
//               lastName: "",
//               phoneNumber: "",
//               password: "",
//             }}
//             validationSchema={yup.object().shape({
//               firstName: yup.string().required("First name is required"),
//               lastName: yup.string().required("Last name is required"),
//               phoneNumber: yup
//                 .string()
//                 .required("Phone number is required")
//                 .test("phone-format", "Mauritanian phone numbers must be 8 digits starting with 2, 3, or 4", validatePhoneNumber),
//               password: yup
//                 .string()
//                 .required("Password is required")
//                 .min(8, "Password must be at least 8 characters"),
//             })}
//             onSubmit={async (values) => {
//               await nativeRegisterPhone(values);
//             }}
//           >
//             {({
//               values,
//               errors,
//               touched,
//               handleChange,
//               handleSubmit,
//               setFieldTouched,
//               setFieldValue,
//             }) => {
//               return (
//                 <>
//                   <Input
//                     style={styles.input}
//                     value={values.firstName}
//                     onChangeText={handleChange("firstName")}
//                     placeholder="Your First Name"
//                     autoCapitalize="words"
//                     textContentType="givenName"
//                     autoComplete="given-name"
//                     autoCorrect={false}
//                     label="First Name"
//                     onBlur={() => setFieldTouched("firstName")}
//                     caption={
//                       touched.firstName && errors.firstName ? errors.firstName : undefined
//                     }
//                     status={touched.firstName && errors.firstName ? "danger" : "basic"}
//                   />
                  
//                   <Input
//                     style={styles.input}
//                     value={values.lastName}
//                     onChangeText={handleChange("lastName")}
//                     placeholder="Your Last Name"
//                     autoCapitalize="words"
//                     textContentType="familyName"
//                     autoComplete="family-name"
//                     autoCorrect={false}
//                     label="Last Name"
//                     onBlur={() => setFieldTouched("lastName")}
//                     caption={
//                       touched.lastName && errors.lastName ? errors.lastName : undefined
//                     }
//                     status={touched.lastName && errors.lastName ? "danger" : "basic"}
//                   />

//                   <PhoneInput
//                     value={values.phoneNumber}
//                     onChangeText={handleChange("phoneNumber")}
//                     onBlur={() => setFieldTouched("phoneNumber")}
//                     placeholder="Enter your phone number"
//                     label="Phone Number"
//                     error={touched.phoneNumber && errors.phoneNumber ? errors.phoneNumber : undefined}
//                   />
                  
//                   <PasswordInput
//                     style={styles.input}
//                     value={values.password}
//                     onChangeText={handleChange("password")}
//                     placeholder="Your Password"
//                     label="Password"
//                     onBlur={() => setFieldTouched("password")}
//                     caption={
//                       touched.password && errors.password
//                         ? errors.password
//                         : undefined
//                     }
//                     status={
//                       touched.password && errors.password ? "danger" : "basic"
//                     }
//                   />

//                   <Button
//                     style={styles.signUpButton}
//                     onPress={() => handleSubmit()}
//                   >
//                     Sign Up
//                   </Button>

//                   <OrDivider style={styles.orContainer} />

//                   <GoogleButton
//                     text="Sign up with Google"
//                     style={styles.button}
//                     onPress={async () => await googleAuth()}
//                   />
//                   <FacebookButton
//                     text="Sign up with Facebook"
//                     style={styles.button}
//                     onPress={async () => await facebookAuth()}
//                   />
//                   <AppleButton
//                     type="sign-up"
//                     onPress={async () => await appleAuth()}
//                   />

//                   <View style={styles.switchAuthContainer}>
//                     <Text category={"c1"} style={styles.switchAuthText}>
//                       Already have an account?{" "}
//                     </Text>
//                     <TouchableOpacity
//                       onPress={() => (navigation as any).navigate("SignInPhone")}
//                     >
//                       <Text category={"c1"} status={"info"}>
//                         Sign in with phone
//                       </Text>
//                     </TouchableOpacity>
//                   </View>

//                   <View style={styles.switchAuthContainer}>
//                     <Text category={"c1"} style={styles.switchAuthText}>
//                       Prefer email?{" "}
//                     </Text>
//                     <TouchableOpacity
//                       onPress={() => (navigation as any).navigate("SignUp")}
//                     >
//                       <Text category={"c1"} status={"info"}>
//                         Sign up with email
//                       </Text>
//                     </TouchableOpacity>
//                   </View>
//                 </>
//               );
//             }}
//           </Formik>
//         </View>
//       </Screen>
//     </KeyboardAwareScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { 
//     marginHorizontal: 10 
//   },
//   header: {
//     textAlign: "center",
//     marginVertical: 10,
//   },
//   subtitle: {
//     textAlign: "center",
//     marginBottom: 20,
//     color: "#666",
//   },
//   input: {
//     marginTop: 10,
//   },
//   signUpButton: {
//     marginVertical: 20,
//   },
//   orContainer: {
//     marginVertical: 20,
//   },
//   button: {
//     marginBottom: 10,
//   },
//   switchAuthContainer: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 15,
//   },
//   switchAuthText: {
//     color: "#666",
//   },
// });


import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text, TextInput, StatusBar, Dimensions } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native";
import * as yup from "yup";
import { Formik } from "formik";
import { Eye, EyeSlash, Phone, Lock, User, ArrowLeft, CheckCircle } from "phosphor-react-native";

import { Screen } from "../components/Screen";
import { useAuth } from "../hooks/useAuth";
import { theme } from "../theme";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get('window');

export const SignUpPhoneScreen = () => {
  const navigation = useNavigation();
  const { nativeRegisterPhone } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePhoneNumber = (value: string | undefined) => {
    if (!value) return false;
    
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Check if it's exactly 8 digits for Mauritania
    if (cleaned.length !== 8) {
      return false;
    }
    
    // Check if it starts with valid Mauritanian prefixes (2, 3, or 4)
    const firstDigit = cleaned.charAt(0);
    if (!['2', '3', '4'].includes(firstDigit)) {
      return false;
    }
    
    return true;
  };

  const handleSignUpWithEmail = () => {
    navigation.navigate("SignUp");
  };

  const handleSignIn = () => {
    navigation.navigate("SignInPhone");
  };
  const {t} = useTranslation()

  return (
    <Screen style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#222222" weight="bold" />
        </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('auth.signUp.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAwareScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Content */}
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Join Habitat</Text>
            <Text style={styles.subtitle}>
              {t('auth.signUp.subtitle')}
            </Text>
          </View>

     

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Phone Sign Up Form */}
          <Formik
            initialValues={{
              firstName: "",
              lastName: "",
              phoneNumber: "",
              password: "",
            }}
                        validationSchema={yup.object().shape({
                          firstName: yup.string().required(t('auth.signUp.validation.firstNameRequired')),
                          lastName: yup.string().required(t('auth.signUp.validation.lastNameRequired')),
                          phoneNumber: yup
                            .string()
                            .required(t('auth.signUp.validation.phoneRequired'))
                            .test("phone-format", t('auth.signUp.validation.phoneFormat'), validatePhoneNumber),
                          password: yup
                            .string()
                            .required(t('auth.signUp.validation.passwordRequired'))
                            .min(8, t('auth.signUp.validation.passwordMinLength')),
                        })}
            onSubmit={async (values) => {
              setIsLoading(true);
              try {
                await nativeRegisterPhone(values);
              } finally {
                setIsLoading(false);
              }
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
                {/* Name Fields */}
                <View style={styles.nameRow}>
                  <View style={styles.nameField}>
                                <Text style={styles.fieldLabel}>{t('auth.signUp.firstName')}</Text>
                    <View style={[
                      styles.inputContainer,
                      touched.firstName && errors.firstName && styles.inputError
                    ]}>
                      <User size={20} color="#717171" weight="regular" />
                      <TextInput
                        style={styles.textInput}
                        value={values.firstName}
                        onChangeText={handleChange("firstName")}
                                    placeholder={t('auth.signUp.firstNamePlaceholder')}
                        placeholderTextColor="#A0A0A0"
                        autoCapitalize="words"
                        textContentType="givenName"
                        onBlur={() => setFieldTouched("firstName")}
                      />
                    </View>
                    {touched.firstName && errors.firstName && (
                      <Text style={styles.errorText}>{errors.firstName}</Text>
                    )}
                  </View>

                  <View style={styles.nameField}>
                                <Text style={styles.fieldLabel}>{t('auth.signUp.lastName')}</Text>
                    <View style={[
                      styles.inputContainer,
                      touched.lastName && errors.lastName && styles.inputError
                    ]}>
                      <User size={20} color="#717171" weight="regular" />
                      <TextInput
                        style={styles.textInput}
                        value={values.lastName}
                        onChangeText={handleChange("lastName")}
                                    placeholder={t('auth.signUp.lastNamePlaceholder')}
                        placeholderTextColor="#A0A0A0"
                        autoCapitalize="words"
                        textContentType="familyName"
                        onBlur={() => setFieldTouched("lastName")}
                      />
                    </View>
                    {touched.lastName && errors.lastName && (
                      <Text style={styles.errorText}>{errors.lastName}</Text>
                    )}
                  </View>
                </View>

                {/* Phone Field */}
                <View style={styles.fieldContainer}>
                              <Text style={styles.fieldLabel}>{t('auth.signUp.phoneNumber')}</Text>
                  <View style={[
                    styles.inputContainer,
                    touched.phoneNumber && errors.phoneNumber && styles.inputError
                  ]}>
                    <Phone size={20} color="#717171" weight="regular" />
                    <TextInput
                      style={styles.textInput}
                      value={values.phoneNumber}
                      onChangeText={handleChange("phoneNumber")}
                                  placeholder={t('auth.signUp.phonePlaceholder')}
                      placeholderTextColor="#A0A0A0"
                      keyboardType="phone-pad"
                      textContentType="telephoneNumber"
                      autoComplete="tel"
                      onBlur={() => setFieldTouched("phoneNumber")}
                    />
                  </View>
                  {touched.phoneNumber && errors.phoneNumber && (
                    <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                  )}
                </View>

                {/* Password Field */}
                <View style={styles.fieldContainer}>
                              <Text style={styles.fieldLabel}>{t('auth.signUp.password')}</Text>
                  <View style={[
                    styles.inputContainer,
                    touched.password && errors.password && styles.inputError
                  ]}>
                    <Lock size={20} color="#717171" weight="regular" />
                    <TextInput
                      style={styles.textInput}
                      value={values.password}
                      onChangeText={handleChange("password")}
                                  placeholder={t('auth.signUp.passwordPlaceholder')}
                      placeholderTextColor="#A0A0A0"
                      secureTextEntry={!showPassword}
                      textContentType="newPassword"
                      autoComplete="new-password"
                      onBlur={() => setFieldTouched("password")}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      {showPassword ? (
                        <EyeSlash size={20} color="#717171" weight="regular" />
                      ) : (
                        <Eye size={20} color="#717171" weight="regular" />
                      )}
                    </TouchableOpacity>
                  </View>
                  {touched.password && errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}
                </View>

                {/* Sign Up Button */}
                <TouchableOpacity
                  style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
                  onPress={() => handleSubmit()}
                  disabled={isLoading}
                >
                              <Text style={styles.signUpButtonText}>
                                {isLoading ? t('auth.signUp.creatingAccount') : t('auth.signUp.createAccount')}
                              </Text>
                </TouchableOpacity>

                {/* Terms */}
                            <Text style={styles.termsText}>
                              {t('auth.signUp.terms')} {t('auth.signUp.termsOfService')} {t('auth.signUp.and')} {t('auth.signUp.privacyPolicy')}
                            </Text>
              </View>
            )}
          </Formik>

          {/* Alternative Options */}
          <View style={styles.alternativeContainer}>
            <TouchableOpacity
              style={styles.alternativeButton}
              onPress={handleSignUpWithEmail}
            >
                          <Text style={styles.alternativeButtonText}>
                            {t('auth.signUp.signUpWithEmail')}
                          </Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>
                          {t('auth.signUp.alreadyHaveAccount')} {t('auth.signUp.signIn')}
                        </Text>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleContainer: {
    marginTop: 32,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#717171',
    lineHeight: 24,
  },
  socialContainer: {
    marginBottom: 24,
  },
  socialButton: {
    marginBottom: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#717171',
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  nameField: {
    flex: 1,
    marginRight: 12,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputError: {
    borderColor: '#FF5A5F',
    backgroundColor: '#FFF5F5',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#222222',
    marginLeft: 12,
    padding: 0,
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF5A5F',
    marginTop: 4,
    marginLeft: 4,
  },
  signUpButton: {
    backgroundColor: theme['color-temporary-primary'],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#C0C0C0',
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  termsText: {
    fontSize: 12,
    color: '#717171',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  linkText: {
    color: theme['color-temporary-primary'],
    fontWeight: '600',
  },
  alternativeContainer: {
    marginBottom: 24,
  },
  alternativeButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  alternativeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  footerContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#717171',
  },
  footerLink: {
    fontSize: 14,
    color: theme['color-temporary-primary'],
    fontWeight: '600',
  },
});