// // import { View, StyleSheet, TouchableOpacity } from "react-native";
// // import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
// // import { Text, Button } from "@ui-kitten/components";
// // import * as yup from "yup";
// // import { Formik } from "formik";
// // import { useNavigation } from "@react-navigation/native";

// // import { Screen } from "../components/Screen";
// // import { ModalHeader } from "../components/ModalHeader";
// // import { GoogleButton } from "../components/GoogleButton";
// // import { FacebookButton } from "../components/FacebookButton";
// // import { AppleButton } from "../components/AppleButton";
// // import { PasswordInput } from "../components/PasswordInput";
// // import { OrDivider } from "../components/OrDivider";
// // import { PhoneInput } from "../components/PhoneInput";
// // import { useAuth } from "../hooks/useAuth";

// // export const SignInPhoneScreen = () => {
// //   const navigation = useNavigation();
// //   const { nativeLoginPhone } = useAuth();

// //   const validatePhoneNumber = (value: string) => {
// //     // Remove all non-digit characters
// //     const cleaned = value.replace(/\D/g, '');
    
// //     // Check if it's exactly 8 digits for Mauritania
// //     if (cleaned.length !== 8) {
// //       return false;
// //     }
    
// //     // Check if it starts with valid Mauritanian prefixes (2, 3, or 4)
// //     const firstDigit = cleaned.charAt(0);
// //     if (!['2', '3', '4'].includes(firstDigit)) {
// //       return false;
// //     }
    
// //     return true;
// //   };

// //   return (
// //     <KeyboardAwareScrollView bounces={false}>
// //       <Screen>
// //         <ModalHeader text="habitat" xShown />
// //         <View style={styles.container}>
// //           <Text category={"h5"} style={styles.header}>
// //             Sign In with Phone
// //           </Text>
// //           <Text category={"s1"} style={styles.subtitle}>
// //             Enter your phone number and password to continue
// //           </Text>
          
// //           <Formik
// //             initialValues={{
// //               phoneNumber: "",
// //               password: "",
// //             }}
// //             validationSchema={yup.object().shape({
// //               phoneNumber: yup
// //                 .string()
// //                 .required("Phone number is required")
// //                 .test("phone-format", "Mauritanian phone numbers must be 8 digits starting with 2, 3, or 4", validatePhoneNumber),
// //               password: yup.string().required("Password is required"),
// //             })}
// //             onSubmit={async (values) => {
// //               await nativeLoginPhone(values);
// //             }}
// //           >
// //             {({
// //               values,
// //               errors,
// //               touched,
// //               handleChange,
// //               handleSubmit,
// //               setFieldTouched,
// //             }) => {
// //               return (
// //                 <>
// //                   <PhoneInput
// //                     value={values.phoneNumber}
// //                     onChangeText={handleChange("phoneNumber")}
// //                     onBlur={() => setFieldTouched("phoneNumber")}
// //                     placeholder="Enter your phone number"
// //                     label="Phone Number"
// //                     error={touched.phoneNumber && errors.phoneNumber ? errors.phoneNumber : undefined}
// //                   />

// //                   <PasswordInput
// //                     style={styles.input}
// //                     value={values.password}
// //                     onChangeText={handleChange("password")}
// //                     placeholder="Your Password"
// //                     label="Password"
// //                     onBlur={() => setFieldTouched("password")}
// //                     caption={
// //                       touched.password && errors.password
// //                         ? errors.password
// //                         : undefined
// //                     }
// //                     status={
// //                       touched.password && errors.password ? "danger" : "basic"
// //                     }
// //                   />

// //                   <TouchableOpacity
// //                     style={styles.forgotPasswordContainer}
// //                     onPress={() => navigation.navigate("ForgotPassword")}
// //                   >
// //                     <Text category={"c1"} status={"info"}>
// //                       Forgot your password?
// //                     </Text>
// //                   </TouchableOpacity>

// //                   <Button
// //                     style={styles.signInButton}
// //                     onPress={() => handleSubmit()}
// //                   >
// //                     Sign In
// //                   </Button>

// //                   <OrDivider style={styles.orContainer} />
                  
// //                   <GoogleButton
// //                     text="Continue with Google"
// //                     style={styles.button}
// //                     onPress={async () => await googleAuth()}
// //                   />
// //                   <FacebookButton
// //                     text="Continue with Facebook"
// //                     style={styles.button}
// //                     onPress={async () => await facebookAuth()}
// //                   />
// //                   <AppleButton
// //                     type="sign-in"
// //                     onPress={async () => await appleAuth()}
// //                   />

// //                   <View style={styles.switchAuthContainer}>
// //                     <Text category={"c1"} style={styles.switchAuthText}>
// //                       Don't have an account?{" "}
// //                     </Text>
// //                     <TouchableOpacity
// //                       onPress={() => navigation.navigate("SignUpPhone")}
// //                     >
// //                       <Text category={"c1"} status={"info"}>
// //                         Sign up with phone
// //                       </Text>
// //                     </TouchableOpacity>
// //                   </View>

// //                   <View style={styles.switchAuthContainer}>
// //                     <Text category={"c1"} style={styles.switchAuthText}>
// //                       Prefer email?{" "}
// //                     </Text>
// //                     <TouchableOpacity
// //                       onPress={() => navigation.navigate("SignIn")}
// //                     >
// //                       <Text category={"c1"} status={"info"}>
// //                         Sign in with email
// //                       </Text>
// //                     </TouchableOpacity>
// //                   </View>
// //                 </>
// //               );
// //             }}
// //           </Formik>
// //         </View>
// //       </Screen>
// //     </KeyboardAwareScrollView>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: { 
// //     marginHorizontal: 10 
// //   },
// //   header: {
// //     textAlign: "center",
// //     marginVertical: 10,
// //   },
// //   subtitle: {
// //     textAlign: "center",
// //     marginBottom: 20,
// //     color: "#666",
// //   },
// //   input: {
// //     marginTop: 10,
// //   },
// //   forgotPasswordContainer: {
// //     alignSelf: "flex-end",
// //     marginVertical: 3,
// //   },
// //   signInButton: {
// //     marginVertical: 20,
// //   },
// //   orContainer: {
// //     marginVertical: 20,
// //   },
// //   button: {
// //     marginBottom: 10,
// //   },
// //   switchAuthContainer: {
// //     flexDirection: "row",
// //     justifyContent: "center",
// //     alignItems: "center",
// //     marginTop: 15,
// //   },
// //   switchAuthText: {
// //     color: "#666",
// //   },
// // });


// import React, { useState } from "react";
// import { View, StyleSheet, TouchableOpacity, Text, TextInput, StatusBar, Dimensions } from "react-native";
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
// import { useNavigation } from "@react-navigation/native";
// import * as yup from "yup";
// import { Formik } from "formik";
// import { Eye, EyeSlash, Phone, Lock, ArrowLeft, CheckCircle } from "phosphor-react-native";

// import { Screen } from "../components/Screen";
// import { useAuth } from "../hooks/useAuth";
// import { theme } from "../theme";
// import { useTranslation } from "react-i18next";

// const { width } = Dimensions.get('window');

// export const SignInPhoneScreen = () => {
//   const navigation = useNavigation();
//   const { nativeLoginPhone } = useAuth();
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   const validatePhoneNumber = (value: string | undefined) => {
//     if (!value) return false;
    
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

//   const handleSignInWithEmail = () => {
//     navigation.navigate("SignIn");
//   };

//   const handleSignUp = () => {
//     navigation.navigate("SignUpPhone");
//   };
//   const {t} = useTranslation()

//   return (
//     <Screen style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity 
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}
//         >
//           <ArrowLeft size={24} color="#222222" weight="bold" />
//         </TouchableOpacity>
//                     <Text style={styles.headerTitle}>{t('auth.signIn.title')}</Text>
//         <View style={styles.placeholder} />
//       </View>

//       <KeyboardAwareScrollView 
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//       >
//         {/* Main Content */}
//         <View style={styles.content}>
//           <View style={styles.titleContainer}>
//             <Text style={styles.title}>Sign in to Habitat</Text>
//             <Text style={styles.subtitle}>
//               {t('auth.signIn.subtitle')}
//             </Text>
//           </View>

    

//           {/* Divider */}
//           <View style={styles.dividerContainer}>
//             <View style={styles.dividerLine} />
//             <Text style={styles.dividerText}>or</Text>
//             <View style={styles.dividerLine} />
//           </View>

//           {/* Phone Sign In Form */}
//           <Formik
//             initialValues={{
//               phoneNumber: "",
//               password: "",
//             }}
//                         validationSchema={yup.object().shape({
//                           phoneNumber: yup
//                             .string()
//                             .required(t('auth.signIn.validation.phoneRequired'))
//                             .test('phone-format', t('auth.signIn.validation.phoneFormat'), validatePhoneNumber),
//                           password: yup.string().required(t('auth.signIn.validation.passwordRequired')),
//                         })}
//             onSubmit={async (values) => {
//               setIsLoading(true);
//               try {
//                 await nativeLoginPhone(values);
//               } finally {
//                 setIsLoading(false);
//               }
//             }}
//           >
//             {({
//               values,
//               errors,
//               touched,
//               handleChange,
//               handleSubmit,
//               setFieldTouched,
//             }) => (
//               <View style={styles.formContainer}>
//                 {/* Phone Field */}
//                 <View style={styles.fieldContainer}>
//                               <Text style={styles.fieldLabel}>{t('auth.signIn.phoneNumber')}</Text>
//                   <View style={[
//                     styles.inputContainer,
//                     touched.phoneNumber && errors.phoneNumber && styles.inputError
//                   ]}>
//                     <Phone size={20} color="#717171" weight="regular" />
//                     <TextInput
//                       style={styles.textInput}
//                       value={values.phoneNumber}
//                       onChangeText={handleChange("phoneNumber")}
//                                   placeholder={t('auth.signIn.phonePlaceholder')}
//                       placeholderTextColor="#A0A0A0"
//                       keyboardType="phone-pad"
//                       textContentType="telephoneNumber"
//                       autoComplete="tel"
//                       onBlur={() => setFieldTouched("phoneNumber")}
//                     />
//                   </View>
//                   {touched.phoneNumber && errors.phoneNumber && (
//                     <Text style={styles.errorText}>{errors.phoneNumber}</Text>
//                   )}
//                 </View>

//                 {/* Password Field */}
//                 <View style={styles.fieldContainer}>
//                               <Text style={styles.fieldLabel}>{t('auth.signIn.password')}</Text>
//                   <View style={[
//                     styles.inputContainer,
//                     touched.password && errors.password && styles.inputError
//                   ]}>
//                     <Lock size={20} color="#717171" weight="regular" />
//                     <TextInput
//                       style={styles.textInput}
//                       value={values.password}
//                       onChangeText={handleChange("password")}
//                                   placeholder={t('auth.signIn.passwordPlaceholder')}
//                       placeholderTextColor="#A0A0A0"
//                       secureTextEntry={!showPassword}
//                       textContentType="password"
//                       autoComplete="current-password"
//                       onBlur={() => setFieldTouched("password")}
//                     />
//                     <TouchableOpacity
//                       onPress={() => setShowPassword(!showPassword)}
//                       style={styles.eyeButton}
//                     >
//                       {showPassword ? (
//                         <EyeSlash size={20} color="#717171" weight="regular" />
//                       ) : (
//                         <Eye size={20} color="#717171" weight="regular" />
//                       )}
//                     </TouchableOpacity>
//                   </View>
//                   {touched.password && errors.password && (
//                     <Text style={styles.errorText}>{errors.password}</Text>
//                   )}
//                 </View>

//                 {/* Forgot Password */}
//                 <TouchableOpacity
//                   style={styles.forgotPasswordContainer}
//                   onPress={() => navigation.navigate("ForgotPassword")}
//                 >
//                               <Text style={styles.forgotPasswordText}>
//                                 {t('auth.signIn.forgotPassword')}
//                               </Text>
//                 </TouchableOpacity>

//                 {/* Sign In Button */}
//                 <TouchableOpacity
//                   style={[styles.signInButton, isLoading && styles.buttonDisabled]}
//                   onPress={() => handleSubmit()}
//                   disabled={isLoading}
//                 >
//                               <Text style={styles.signInButtonText}>
//                                 {isLoading ? t('auth.signIn.signingIn') : t('auth.signIn.signIn')}
//                               </Text>
//                 </TouchableOpacity>
//               </View>
//             )}
//           </Formik>

//           {/* Alternative Options */}
//           <View style={styles.alternativeContainer}>
//             <TouchableOpacity
//               style={styles.alternativeButton}
//               onPress={handleSignInWithEmail}
//             >
//                           <Text style={styles.alternativeButtonText}>
//                             {t('auth.signIn.signInWithEmail')}
//                           </Text>
//             </TouchableOpacity>
//           </View>

//           {/* Sign Up Link */}
//           <View style={styles.footerContainer}>
//                         <Text style={styles.footerText}>
//                           {t('auth.signIn.dontHaveAccount')} {t('auth.signIn.signUp')}
//                         </Text>
//           </View>
//         </View>
//       </KeyboardAwareScrollView>
//     </Screen>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F0F0F0',
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#F8F8F8',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#222222',
//   },
//   placeholder: {
//     width: 40,
//   },
//   scrollContent: {
//     flexGrow: 1,
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: 24,
//   },
//   titleContainer: {
//     marginTop: 32,
//     marginBottom: 32,
//   },
//   title: {
//     fontSize: 32,
//     fontWeight: '700',
//     color: '#222222',
//     marginBottom: 8,
//     letterSpacing: -0.5,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#717171',
//     lineHeight: 24,
//   },
//   socialContainer: {
//     marginBottom: 24,
//   },
//   socialButton: {
//     marginBottom: 12,
//   },
//   dividerContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 24,
//   },
//   dividerLine: {
//     flex: 1,
//     height: 1,
//     backgroundColor: '#E0E0E0',
//   },
//   dividerText: {
//     marginHorizontal: 16,
//     fontSize: 14,
//     color: '#717171',
//     fontWeight: '500',
//   },
//   formContainer: {
//     marginBottom: 24,
//   },
//   fieldContainer: {
//     marginBottom: 20,
//   },
//   fieldLabel: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#222222',
//     marginBottom: 8,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F8F8F8',
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//   },
//   inputError: {
//     borderColor: '#FF5A5F',
//     backgroundColor: '#FFF5F5',
//   },
//   textInput: {
//     flex: 1,
//     fontSize: 16,
//     color: '#222222',
//     marginLeft: 12,
//     padding: 0,
//   },
//   eyeButton: {
//     padding: 4,
//   },
//   errorText: {
//     fontSize: 12,
//     color: '#FF5A5F',
//     marginTop: 4,
//     marginLeft: 4,
//   },
//   forgotPasswordContainer: {
//     alignItems: 'flex-end',
//     marginTop: 4,
//     marginBottom: 16,
//   },
//   forgotPasswordText: {
//     fontSize: 14,
//     color: theme['color-temporary-primary'],
//     fontWeight: '600',
//   },
//   signInButton: {
//     backgroundColor: theme['color-temporary-primary'],
//     borderRadius: 12,
//     paddingVertical: 16,
//     alignItems: 'center',
//     marginTop: 8,
//     marginBottom: 16,
//   },
//   buttonDisabled: {
//     backgroundColor: '#C0C0C0',
//   },
//   signInButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#FFFFFF',
//   },
//   alternativeContainer: {
//     marginBottom: 24,
//   },
//   alternativeButton: {
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     borderRadius: 12,
//     paddingVertical: 16,
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//   },
//   alternativeButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#222222',
//   },
//   footerContainer: {
//     alignItems: 'center',
//     paddingBottom: 40,
//   },
//   footerText: {
//     fontSize: 14,
//     color: '#717171',
//   },
//   footerLink: {
//     fontSize: 14,
//     color: theme['color-temporary-primary'],
//     fontWeight: '600',
//   },
// });


import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text, TextInput, StatusBar, Dimensions } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native";
import * as yup from "yup";
import { Formik } from "formik";
import { Eye, EyeSlash, ArrowLeft } from "phosphor-react-native";

import { Screen } from "../components/Screen";
import { useAuth } from "../hooks/useAuth";
import { theme } from "../theme";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get('window');

export const SignInPhoneScreen = () => {
  const navigation = useNavigation();
  const { nativeLoginPhone } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

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

  return (
    <Screen style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Minimal Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
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
        <View style={styles.content}>
          {/* Minimal Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('auth.signIn.title')}</Text>
          </View>

          {/* Clean Form */}
          <Formik
            initialValues={{
              phoneNumber: "",
              password: "",
            }}
            validationSchema={yup.object().shape({
              phoneNumber: yup
                .string()
                .required(t('auth.signIn.validation.phoneRequired'))
                .test('phone-format', t('auth.signIn.validation.phoneFormat'), validatePhoneNumber),
              password: yup.string().required(t('auth.signIn.validation.passwordRequired')),
            })}
            onSubmit={async (values) => {
              setIsLoading(true);
              try {
                await nativeLoginPhone(values);
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
                {/* Phone Input - Borderless */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      touched.phoneNumber && errors.phoneNumber && styles.inputError
                    ]}
                    value={values.phoneNumber}
                    onChangeText={handleChange("phoneNumber")}
                    placeholder={t('auth.signIn.phonePlaceholder')}
                    placeholderTextColor="#AAAAAA"
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                    onBlur={() => setFieldTouched("phoneNumber")}
                  />
                  {touched.phoneNumber && errors.phoneNumber && (
                    <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                  )}
                </View>

                {/* Password Input - Borderless */}
                <View style={styles.inputWrapper}>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.passwordInput,
                        touched.password && errors.password && styles.inputError
                      ]}
                      value={values.password}
                      onChangeText={handleChange("password")}
                      placeholder={t('auth.signIn.passwordPlaceholder')}
                      placeholderTextColor="#AAAAAA"
                      secureTextEntry={!showPassword}
                      textContentType="password"
                      autoComplete="current-password"
                      onBlur={() => setFieldTouched("password")}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                      activeOpacity={0.6}
                    >
                      {showPassword ? (
                        <EyeSlash size={18} color="#AAAAAA" weight="regular" />
                      ) : (
                        <Eye size={18} color="#AAAAAA" weight="regular" />
                      )}
                    </TouchableOpacity>
                  </View>
                  {touched.password && errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}
                </View>

                {/* Forgot Password - Minimal */}
                <TouchableOpacity
                  onPress={() => navigation.navigate("ForgotPassword")}
                  activeOpacity={0.6}
                  style={styles.forgotPassword}
                >
                  <Text style={styles.forgotText}>
                    {t('auth.signIn.forgotPassword')}
                  </Text>
                </TouchableOpacity>

                {/* Sign In Button - Bold & Simple */}
                <TouchableOpacity
                  style={[styles.signInButton, isLoading && styles.buttonDisabled]}
                  onPress={() => handleSubmit()}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.signInButtonText}>
                    {isLoading ? t('auth.signIn.signingIn') : t('auth.signIn.signIn')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Formik>

          {/* Bottom Options - Spaced Out */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              onPress={() => navigation.navigate("SignIn")}
              activeOpacity={0.6}
            >
              <Text style={styles.alternativeText}>
                {t('auth.signIn.signInWithEmail')}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              onPress={() => navigation.navigate('SignUpPhone')}
              activeOpacity={0.6}
            >
              <Text style={styles.signUpText}>
                {t('auth.signIn.dontHaveAccount')} <Text style={styles.signUpLink}>{t('auth.signIn.signUp')}</Text>
              </Text>
            </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  titleContainer: {
    marginTop: 40,
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  formContainer: {
    marginBottom: 'auto',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  input: {
    fontSize: 16,
    color: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  inputError: {
    borderBottomColor: '#FF3B30',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 0,
    top: 12,
    padding: 4,
  },
  errorText: {
    fontSize: 11,
    color: '#FF3B30',
    marginTop: 6,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 32,
  },
  forgotText: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  signInButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  bottomSection: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  alternativeText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 24,
  },
  signUpText: {
    fontSize: 13,
    color: '#666666',
  },
  signUpLink: {
    color: '#000000',
    fontWeight: '600',
  },
});