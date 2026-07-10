// import React, { useState } from "react";
// import { View, StyleSheet, TouchableOpacity, Text, TextInput, StatusBar, Dimensions } from "react-native";
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
// import { useNavigation } from "@react-navigation/native";
// import { useTranslation } from "react-i18next";
// import * as yup from "yup";
// import { Formik } from "formik";
// import { Eye, EyeSlash, Envelope, Lock, ArrowLeft, CheckCircle } from "phosphor-react-native";

// import { Screen } from "../components/Screen";
// import { useAuth } from "../hooks/useAuth";
// import { theme } from "../theme";

// const { width } = Dimensions.get('window');

// export const SignInScreen = () => {
//   const { t } = useTranslation();
//   const navigation = useNavigation();
//   const { nativeLogin } = useAuth();
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   const handleSignInWithPhone = () => {
//     navigation.navigate("SignInPhone");
//   };

//   const handleSignUp = () => {
//     navigation.navigate("SignUp");
//   };

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
//             <Text style={styles.title}>{t('auth.signIn.title')}</Text>
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

//           {/* Email Sign In Form */}
//           <Formik
//             initialValues={{
//               email: "",
//               password: "",
//             }}
//                         validationSchema={yup.object().shape({
//                           email: yup.string().email(t('auth.signIn.validation.emailInvalid')).required(t('auth.signIn.validation.emailRequired')),
//                           password: yup.string().required(t('auth.signIn.validation.passwordRequired')),
//                         })}
//             onSubmit={async (values) => {
//               setIsLoading(true);
//               try {
//                 await nativeLogin(values);
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
//                 {/* Email Field */}
//                 <View style={styles.fieldContainer}>
//                               <Text style={styles.fieldLabel}>{t('auth.signIn.email')}</Text>
//                   <View style={[
//                     styles.inputContainer,
//                     touched.email && errors.email && styles.inputError
//                   ]}>
//                     <Envelope size={20} color="#717171" weight="regular" />
//                     <TextInput
//                       style={styles.textInput}
//                       value={values.email}
//                       onChangeText={handleChange("email")}
//                                   placeholder={t('auth.signIn.emailPlaceholder')}
//                       placeholderTextColor="#A0A0A0"
//                       autoCapitalize="none"
//                       keyboardType="email-address"
//                       textContentType="emailAddress"
//                       autoComplete="email"
//                       autoCorrect={false}
//                       onBlur={() => setFieldTouched("email")}
//                     />
//                   </View>
//                   {touched.email && errors.email && (
//                     <Text style={styles.errorText}>{errors.email}</Text>
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
//               onPress={handleSignInWithPhone}
//             >
//                           <Text style={styles.alternativeButtonText}>
//                             {t('auth.signIn.signInWithPhone')}
//                           </Text>
//             </TouchableOpacity>
//           </View>

//           {/* Sign Up Link */}
//           <View style={styles.footerContainer}>
//             <TouchableOpacity onPress={() => navigation.navigate('SignUp')} activeOpacity={0.7}>
//               <Text style={styles.footerText}>
//                 {t('auth.signIn.dontHaveAccount')} <Text style={{ color: '#00A699', fontWeight: 'bold' }}>{t('auth.signIn.signUp')}</Text>
//               </Text>
//             </TouchableOpacity>
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
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { Formik } from "formik";
import { Eye, EyeSlash, ArrowLeft } from "phosphor-react-native";

import { Screen } from "../components/Screen";
import { useAuth } from "../hooks/useAuth";
import { theme } from "../theme";

const { width } = Dimensions.get('window');

export const SignInScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { nativeLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
              email: "",
              password: "",
            }}
            validationSchema={yup.object().shape({
              email: yup.string().email(t('auth.signIn.validation.emailInvalid')).required(t('auth.signIn.validation.emailRequired')),
              password: yup.string().required(t('auth.signIn.validation.passwordRequired')),
            })}
            onSubmit={async (values) => {
              setIsLoading(true);
              try {
                await nativeLogin(values);
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
                {/* Email Input - Borderless */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      touched.email && errors.email && styles.inputError
                    ]}
                    value={values.email}
                    onChangeText={handleChange("email")}
                    placeholder={t('auth.signIn.emailPlaceholder')}
                    placeholderTextColor="#AAAAAA"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    autoCorrect={false}
                    onBlur={() => setFieldTouched("email")}
                  />
                  {touched.email && errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
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
              onPress={() => navigation.navigate("SignInPhone")}
              activeOpacity={0.6}
            >
              <Text style={styles.alternativeText}>
                {t('auth.signIn.signInWithPhone')}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              onPress={() => navigation.navigate('SignUp')}
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