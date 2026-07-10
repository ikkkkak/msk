// // import { View, StyleSheet, TouchableOpacity } from "react-native";
// // import { Input, Button, Text } from "@ui-kitten/components";
// // import * as yup from "yup";
// // import { Formik } from "formik";
// // import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
// // import { useNavigation } from "@react-navigation/native";
// // import { useTranslation } from "react-i18next";

// // import { Screen } from "../components/Screen";
// // import { ModalHeader } from "../components/ModalHeader";
// // import { GoogleButton } from "../components/GoogleButton";
// // import { FacebookButton } from "../components/FacebookButton";
// // import { AppleButton } from "../components/AppleButton";
// // import { OrDivider } from "../components/OrDivider";
// // import { PasswordInput } from "../components/PasswordInput";
// // import { useAuth } from "../hooks/useAuth";

// // export const SignUpScreen = () => {
// //   const { t } = useTranslation();
// //   const navigation = useNavigation();
// //   const { nativeRegister } = useAuth();

// //   return (
// //     <KeyboardAwareScrollView bounces={false}>
// //       <Screen>
// //         <ModalHeader text="habitat" xShown />
// //         <View style={styles.container}>
// //           <Text category={"h5"} style={styles.header}>
// //             {t('auth.signUp')}
// //           </Text>
// //           <Formik
// //             initialValues={{
// //               firstName: "",
// //               lastName: "",
// //               email: "",
// //               password: "",
// //             }}
// //             validationSchema={yup.object().shape({
// //               firstName: yup.string().required(t('auth.validation.firstNameRequired')),
// //               lastName: yup.string().required(t('auth.validation.lastNameRequired')),
// //               email: yup.string().email().required(t('auth.validation.emailRequired')),
// //               password: yup
// //                 .string()
// //                 .required(t('auth.validation.passwordRequired'))
// //                 .matches(
// //                   /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&-+=()!? "]).{8,128}$/,
// //                   t('auth.validation.passwordComplexity')
// //                 ),
// //             })}
// //             onSubmit={async (values) => {
// //               await nativeRegister(values);
// //             }}
// //           >
// //             {({
// //               values,
// //               errors,
// //               touched,
// //               handleChange,
// //               handleSubmit,
// //               setFieldTouched,
// //               setFieldValue,
// //             }) => {
// //               return (
// //                 <>
// //                   <Input
// //                     style={styles.input}
// //                     value={values.firstName}
// //                     onChangeText={handleChange("firstName")}
// //                     placeholder={t('auth.firstNamePlaceholder')}
// //                     label={t('auth.firstName')}
// //                     autoComplete="name"
// //                     textContentType="givenName"
// //                     onBlur={() => setFieldTouched("firstName")}
// //                     caption={
// //                       touched.firstName && errors.firstName
// //                         ? errors.firstName
// //                         : undefined
// //                     }
// //                     status={
// //                       touched.firstName && errors.firstName ? "danger" : "basic"
// //                     }
// //                   />
// //                   <Input
// //                     style={styles.input}
// //                     value={values.lastName}
// //                     onChangeText={handleChange("lastName")}
// //                     placeholder={t('auth.lastNamePlaceholder')}
// //                     label={t('auth.lastName')}
// //                     textContentType="familyName"
// //                     autoComplete="name"
// //                     onBlur={() => setFieldTouched("lastName")}
// //                     caption={
// //                       touched.lastName && errors.lastName
// //                         ? errors.lastName
// //                         : undefined
// //                     }
// //                     status={
// //                       touched.lastName && errors.lastName ? "danger" : "basic"
// //                     }
// //                   />
// //                   <Input
// //                     style={styles.input}
// //                     value={values.email}
// //                     onChangeText={handleChange("email")}
// //                     placeholder={t('auth.emailPlaceholder')}
// //                     autoCapitalize="none"
// //                     keyboardType="email-address"
// //                     textContentType="emailAddress"
// //                     autoComplete="email"
// //                     autoCorrect={false}
// //                     label={t('auth.email')}
// //                     onBlur={() => setFieldTouched("email")}
// //                     caption={
// //                       touched.email && errors.email ? errors.email : undefined
// //                     }
// //                     status={touched.email && errors.email ? "danger" : "basic"}
// //                   />
// //                   <PasswordInput
// //                     style={styles.input}
// //                     value={values.password}
// //                     onChangeText={handleChange("password")}
// //                     placeholder={t('auth.passwordPlaceholder')}
// //                     label={t('auth.password')}
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

// //                   <Button
// //                     style={styles.signUpButton}
// //                     onPress={() => handleSubmit()}
// //                   >
// //                     {t('auth.signUp')}
// //                   </Button>

// //                   <OrDivider style={styles.orContainer} />

// //                   <GoogleButton
// //                     text={t('auth.signUpWithGoogle')}
// //                     style={styles.button}
// //                     onPress={async () => await googleAuth()}
// //                   />
// //                   <FacebookButton
// //                     text={t('auth.signUpWithFacebook')}
// //                     style={styles.button}
// //                     onPress={async () => await facebookAuth()}
// //                   />
// //                   <AppleButton
// //                     type="sign-up"
// //                     onPress={async () => await appleAuth()}
// //                   />

// //                   <View style={styles.switchAuthContainer}>
// //                     <Text category={"c1"} style={styles.switchAuthText}>
// //                       {t('auth.preferPhone')}{" "}
// //                     </Text>
// //                     <TouchableOpacity
// //                       onPress={() => navigation.navigate("SignUpPhone")}
// //                     >
// //                       <Text category={"c1"} status={"info"}>
// //                         {t('auth.signUpWithPhone')}
// //                       </Text>
// //                     </TouchableOpacity>
// //                   </View>

// //                   <View style={styles.switchAuthContainer}>
// //                     <Text category={"c1"} style={styles.switchAuthText}>
// //                       {t('auth.alreadyHaveAccount')}{" "}
// //                     </Text>
// //                     <TouchableOpacity
// //                       onPress={() => navigation.navigate("SignIn")}
// //                     >
// //                       <Text category={"c1"} status={"info"}>
// //                         {t('auth.signInWithEmail')}
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
// //   container: { marginHorizontal: 10 },
// //   header: { textAlign: "center", marginVertical: 20 },
// //   input: {
// //     marginTop: 10,
// //   },
// //   forgotPasswordContainer: { alignItems: "flex-end", marginTop: 5 },
// //   signUpButton: { marginTop: 20 },
// //   orContainer: {
// //     marginVertical: 30,
// //   },
// //   button: { marginBottom: 10 },
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
// import { useTranslation } from "react-i18next";
// import * as yup from "yup";
// import { Formik } from "formik";
// import { Eye, EyeSlash, Envelope, Lock, User, ArrowLeft, CheckCircle } from "phosphor-react-native";

// import { Screen } from "../components/Screen";
// import { ModalHeader } from "../components/ModalHeader";
// import { useAuth } from "../hooks/useAuth";
// import { theme } from "../theme";

// const { width } = Dimensions.get('window');

// export const SignUpScreen = () => {
//   const { t } = useTranslation();
//   const navigation = useNavigation();
//   const { nativeRegister } = useAuth();
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   const handleSignUpWithPhone = () => {
//     navigation.navigate("SignUpPhone");
//   };

//   const handleSignIn = () => {
//     navigation.navigate("SignIn");
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
//                     <Text style={styles.headerTitle}>{t('auth.signUp.title')}</Text>
//         <View style={styles.placeholder} />
//       </View>

//       <KeyboardAwareScrollView 
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//       >
//         {/* Main Content */}
//         <View style={styles.content}>
//           <View style={styles.titleContainer}>
//             <Text style={styles.title}>Join Habitat</Text>
//             <Text style={styles.subtitle}>
//               {t('auth.signUp.subtitle')}
//             </Text>
//           </View>


//           {/* Email Sign Up Form */}
//           <Formik
//             initialValues={{
//               firstName: "",
//               lastName: "",
//               email: "",
//               password: "",
//             }}
//                         validationSchema={yup.object().shape({
//                           firstName: yup.string().required(t('auth.signUp.validation.firstNameRequired')),
//                           lastName: yup.string().required(t('auth.signUp.validation.lastNameRequired')),
//                           email: yup.string().email(t('auth.signUp.validation.emailInvalid')).required(t('auth.signUp.validation.emailRequired')),
//                           password: yup
//                             .string()
//                             .required(t('auth.signUp.validation.passwordRequired'))
//                             .min(8, t('auth.signUp.validation.passwordMinLength')),
//                         })}
//             onSubmit={async (values) => {
//               setIsLoading(true);
//               try {
//                 await nativeRegister(values);
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
//                 {/* Name Fields */}
//                 <View style={styles.nameRow}>
//                               <View style={styles.nameField}>
//                                 <Text style={styles.fieldLabel}>{t('auth.signUp.firstName')}</Text>
//                     <View style={[
//                       styles.inputContainer,
//                       touched.firstName && errors.firstName && styles.inputError
//                     ]}>
//                       <User size={20} color="#717171" weight="regular" />
//                       <TextInput
//                         style={styles.textInput}
//                         value={values.firstName}
//                         onChangeText={handleChange("firstName")}
//                                     placeholder={t('auth.signUp.firstNamePlaceholder')}
//                         placeholderTextColor="#A0A0A0"
//                         autoCapitalize="words"
//                         textContentType="givenName"
//                         onBlur={() => setFieldTouched("firstName")}
//                       />
//                     </View>
//                     {touched.firstName && errors.firstName && (
//                       <Text style={styles.errorText}>{errors.firstName}</Text>
//                     )}
//                   </View>

//                   <View style={styles.nameField}>
//                                 <Text style={styles.fieldLabel}>{t('auth.signUp.lastName')}</Text>
//                     <View style={[
//                       styles.inputContainer,
//                       touched.lastName && errors.lastName && styles.inputError
//                     ]}>
//                       <User size={20} color="#717171" weight="regular" />
//                       <TextInput
//                         style={styles.textInput}
//                         value={values.lastName}
//                         onChangeText={handleChange("lastName")}
//                                     placeholder={t('auth.signUp.lastNamePlaceholder')}
//                         placeholderTextColor="#A0A0A0"
//                         autoCapitalize="words"
//                         textContentType="familyName"
//                         onBlur={() => setFieldTouched("lastName")}
//                       />
//                     </View>
//                     {touched.lastName && errors.lastName && (
//                       <Text style={styles.errorText}>{errors.lastName}</Text>
//                     )}
//                   </View>
//                 </View>

//                 {/* Email Field */}
//                 <View style={styles.fieldContainer}>
//                               <Text style={styles.fieldLabel}>{t('auth.signUp.email')}</Text>
//                   <View style={[
//                     styles.inputContainer,
//                     touched.email && errors.email && styles.inputError
//                   ]}>
//                     <Envelope size={20} color="#717171" weight="regular" />
//                     <TextInput
//                       style={styles.textInput}
//                       value={values.email}
//                       onChangeText={handleChange("email")}
//                                   placeholder={t('auth.signUp.emailPlaceholder')}
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
//                               <Text style={styles.fieldLabel}>{t('auth.signUp.password')}</Text>
//                   <View style={[
//                     styles.inputContainer,
//                     touched.password && errors.password && styles.inputError
//                   ]}>
//                     <Lock size={20} color="#717171" weight="regular" />
//                     <TextInput
//                       style={styles.textInput}
//                       value={values.password}
//                       onChangeText={handleChange("password")}
//                                   placeholder={t('auth.signUp.passwordPlaceholder')}
//                       placeholderTextColor="#A0A0A0"
//                       secureTextEntry={!showPassword}
//                       textContentType="newPassword"
//                       autoComplete="new-password"
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

//                 {/* Sign Up Button */}
//                 <TouchableOpacity
//                   style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
//                   onPress={() => handleSubmit()}
//                   disabled={isLoading}
//                 >
//                               <Text style={styles.signUpButtonText}>
//                                 {isLoading ? t('auth.signUp.creatingAccount') : t('auth.signUp.createAccount')}
//                               </Text>
//                 </TouchableOpacity>

//                 {/* Terms */}
//                             <Text style={styles.termsText}>
//                               {t('auth.signUp.terms')} {t('auth.signUp.termsOfService')} {t('auth.signUp.and')} {t('auth.signUp.privacyPolicy')}
//                             </Text>
//               </View>
//             )}
//           </Formik>

//           {/* Alternative Options */}
//           <View style={styles.alternativeContainer}>
//             <TouchableOpacity
//               style={styles.alternativeButton}
//               onPress={handleSignUpWithPhone}
//             >
//                           <Text style={styles.alternativeButtonText}>
//                             {t('auth.signUp.signUpWithPhone')}
//                           </Text>
//             </TouchableOpacity>
//           </View>

//           {/* Sign In Link */}
//           <View style={styles.footerContainer}>
//                         <Text style={styles.footerText}>
//                           {t('auth.signUp.alreadyHaveAccount')} {t('auth.signUp.signIn')}
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
//   nameRow: {
//     flexDirection: 'row',
//     marginBottom: 20,
//   },
//   nameField: {
//     flex: 1,
//     marginRight: 12,
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
//   signUpButton: {
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
//   signUpButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#FFFFFF',
//   },
//   termsText: {
//     fontSize: 12,
//     color: '#717171',
//     textAlign: 'center',
//     lineHeight: 18,
//     paddingHorizontal: 20,
//   },
//   linkText: {
//     color: theme['color-temporary-primary'],
//     fontWeight: '600',
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

export const SignUpScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { nativeRegister } = useAuth();
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
            <Text style={styles.title}>{t('auth.signUp.title')}</Text>
          </View>

          {/* Clean Form */}
          <Formik
            initialValues={{
              firstName: "",
              lastName: "",
              email: "",
              password: "",
            }}
            validationSchema={yup.object().shape({
              firstName: yup.string().required(t('auth.signUp.validation.firstNameRequired')),
              lastName: yup.string().required(t('auth.signUp.validation.lastNameRequired')),
              email: yup.string().email(t('auth.signUp.validation.emailInvalid')).required(t('auth.signUp.validation.emailRequired')),
              password: yup
                .string()
                .required(t('auth.signUp.validation.passwordRequired'))
                .min(8, t('auth.signUp.validation.passwordMinLength')),
            })}
            onSubmit={async (values) => {
              setIsLoading(true);
              try {
                await nativeRegister(values);
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
                {/* Name Fields - Side by Side */}
                <View style={styles.nameRow}>
                  <View style={styles.nameField}>
                    <TextInput
                      style={[
                        styles.input,
                        touched.firstName && errors.firstName && styles.inputError
                      ]}
                      value={values.firstName}
                      onChangeText={handleChange("firstName")}
                      placeholder={t('auth.signUp.firstNamePlaceholder')}
                      placeholderTextColor="#AAAAAA"
                      autoCapitalize="words"
                      textContentType="givenName"
                      onBlur={() => setFieldTouched("firstName")}
                    />
                    {touched.firstName && errors.firstName && (
                      <Text style={styles.errorText}>{errors.firstName}</Text>
                    )}
                  </View>

                  <View style={[styles.nameField, styles.nameFieldLast]}>
                    <TextInput
                      style={[
                        styles.input,
                        touched.lastName && errors.lastName && styles.inputError
                      ]}
                      value={values.lastName}
                      onChangeText={handleChange("lastName")}
                      placeholder={t('auth.signUp.lastNamePlaceholder')}
                      placeholderTextColor="#AAAAAA"
                      autoCapitalize="words"
                      textContentType="familyName"
                      onBlur={() => setFieldTouched("lastName")}
                    />
                    {touched.lastName && errors.lastName && (
                      <Text style={styles.errorText}>{errors.lastName}</Text>
                    )}
                  </View>
                </View>

                {/* Email Input - Borderless */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      touched.email && errors.email && styles.inputError
                    ]}
                    value={values.email}
                    onChangeText={handleChange("email")}
                    placeholder={t('auth.signUp.emailPlaceholder')}
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
                      placeholder={t('auth.signUp.passwordPlaceholder')}
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

                {/* Sign Up Button - Bold & Simple */}
                <TouchableOpacity
                  style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
                  onPress={() => handleSubmit()}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.signUpButtonText}>
                    {isLoading ? t('auth.signUp.creatingAccount') : t('auth.signUp.createAccount')}
                  </Text>
                </TouchableOpacity>

                {/* Terms - Minimal */}
                <Text style={styles.termsText}>
                  {t('auth.signUp.terms')} {t('auth.signUp.termsOfService')} {t('auth.signUp.and')} {t('auth.signUp.privacyPolicy')}
                </Text>
              </View>
            )}
          </Formik>

          {/* Bottom Options - Spaced Out */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              onPress={() => navigation.navigate("SignUpPhone")}
              activeOpacity={0.6}
            >
              <Text style={styles.alternativeText}>
                {t('auth.signUp.signUpWithPhone')}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              onPress={() => navigation.navigate('SignIn')}
              activeOpacity={0.6}
            >
              <Text style={styles.signUpText}>
                {t('auth.signUp.alreadyHaveAccount')} <Text style={styles.signUpLink}>{t('auth.signUp.signIn')}</Text>
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
  nameRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  nameField: {
    flex: 1,
  },
  nameFieldLast: {
    marginLeft: 12,
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
  signUpButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  signUpButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  termsText: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 16,
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