// /**
//  * Create Organization Screen - Modern Airbnb-Style UI
//  * Clean, minimal, step-by-step with max 2 inputs per step
//  */

// import React, { useState } from "react";
// import {
//   StyleSheet,
//   View,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   Image,
//   Modal,
//   TextInput,
//   SafeAreaView,
//   StatusBar
// } from "react-native";
// import { Text } from "@ui-kitten/components";
// import { useNavigation } from "@react-navigation/native";
// import { MaterialIcons } from "@expo/vector-icons";
// import { useTranslation } from "react-i18next";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import axios from "axios";
// import { pickImageNative } from "../utils/nativePhotoPicker";

// import { endpoints } from "../constants";
// import { useUser } from "../hooks/useUser";
// import { SignUpOrSignInScreen } from "./SignUpOrSignInScreen";
// import { Loading } from "../components/Loading";

// const TOTAL_STEPS = 5;

// const BUSINESS_TYPES = [
//   {
//     id: "brokerage",
//     nameKey: "organization.businessTypes.brokerage",
//     icon: "business"
//   },
//   { id: "agency", nameKey: "organization.businessTypes.agency", icon: "store" },
//   {
//     id: "individual",
//     nameKey: "organization.businessTypes.individual",
//     icon: "person"
//   },
//   {
//     id: "developer",
//     nameKey: "organization.businessTypes.developer",
//     icon: "construction"
//   },
//   {
//     id: "management",
//     nameKey: "organization.businessTypes.management",
//     icon: "home-work"
//   }
// ];

// export const CreateOrganizationScreen = () => {
//   const { t } = useTranslation();
//   const navigation = useNavigation();
//   const { user } = useUser();
//   const queryClient = useQueryClient();

//   const [currentStep, setCurrentStep] = useState(1);
//   const [showBusinessTypeModal, setShowBusinessTypeModal] = useState(false);
//   const [bannerImage, setBannerImage] = useState<any>(null);

//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     website: "",
//     phone: "",
//     email: "",
//     address: "",
//     city: "",
//     state: "",
//     country: "Mauritania",
//     postal_code: "",
//     license_number: "000",
//     tax_id: "000",
//     business_type: "",
//     business_type_name: ""
//   });

//   const [errors, setErrors] = useState<Record<string, string>>({});

//   const pickBannerImage = async () => {
//     // Use native picker - no permissions needed
//     const result = await pickImageNative({
//       allowsEditing: true,
//       aspect: [16, 9],
//       quality: 0.8
//     });

//     if (!result.canceled) {
//       setBannerImage(result.assets[0]);
//     }
//   };

//   const nextStep = () => {
//     if (validateCurrentStep()) {
//       setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
//     }
//   };

//   const prevStep = () => {
//     setCurrentStep((prev) => Math.max(prev - 1, 1));
//   };

//   const selectBusinessType = (type: any) => {
//     setFormData((prev) => ({
//       ...prev,
//       business_type: type.id,
//       business_type_name: t(type.nameKey)
//     }));
//     setShowBusinessTypeModal(false);
//     setErrors((prev) => ({ ...prev, business_type: "" }));
//   };

//   const createOrganizationMutation = useMutation({
//     mutationFn: async (data: any) => {
//       const response = await axios.post(endpoints.organization, data, {
//         headers: { Authorization: `Bearer ${user?.accessToken}` }
//       });
//       return response.data;
//     },
//     onSuccess: () => {
//       Alert.alert(
//         t("organization.success"),
//         t("organization.createdSuccessfully"),
//         [
//           {
//             text: t("common.ok"),
//             onPress: () => {
//               queryClient.invalidateQueries({ queryKey: ["user-organization"] });
//               navigation.goBack();
//             }
//           }
//         ]
//       );
//     },
//     onError: (error: any) => {
//       Alert.alert(
//         t("common.error"),
//         error.response?.data?.error || t("organization.createError")
//       );
//     }
//   });

//   const handleInputChange = (field: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//     if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
//   };

//   const validateCurrentStep = () => {
//     const newErrors: Record<string, string> = {};

//     if (currentStep === 1) {
//       if (!formData.name.trim())
//         newErrors.name = t("organization.nameRequired");
//     } else if (currentStep === 2) {
//       if (!formData.business_type)
//         newErrors.business_type = t("organization.businessTypeRequired");
//     } else if (currentStep === 3) {
//       if (!formData.city.trim())
//         newErrors.city = t("organization.cityRequired");
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = () => {
//     const submitData = { ...formData, banner_image: bannerImage?.uri || null };
//     createOrganizationMutation.mutate(submitData);
//   };

//   if (!user) return <SignUpOrSignInScreen />;
//   if (createOrganizationMutation.isLoading) return <Loading />;

//   // Step configurations
//   const stepConfig = [
//     {
//       title: t(
//         "organization.steps.name.title",
//         "What's your organization called?"
//       ),
//       subtitle: t(
//         "organization.steps.name.subtitle",
//         "Give your organization a memorable name"
//       ),
//       icon: "business"
//     },
//     {
//       title: t("organization.steps.type.title", "What type of business?"),
//       subtitle: t(
//         "organization.steps.type.subtitle",
//         "Select the category that best describes you"
//       ),
//       icon: "category"
//     },
//     {
//       title: t("organization.steps.location.title", "Where are you located?"),
//       subtitle: t(
//         "organization.steps.location.subtitle",
//         "Help clients find you easily"
//       ),
//       icon: "location-on"
//     },
//     {
//       title: t(
//         "organization.steps.contact.title",
//         "How can clients reach you?"
//       ),
//       subtitle: t(
//         "organization.steps.contact.subtitle",
//         "Add your contact information"
//       ),
//       icon: "phone"
//     },
//     {
//       title: t("organization.steps.review.title", "Review & Create"),
//       subtitle: t(
//         "organization.steps.review.subtitle",
//         "Make sure everything looks good"
//       ),
//       icon: "check-circle"
//     }
//   ];

//   const currentConfig = stepConfig[currentStep - 1];

//   const renderStepContent = () => {
//     switch (currentStep) {
//       case 1:
//         return (
//           <View style={styles.inputsContainer}>
//             {/* Banner Upload */}
//             <TouchableOpacity
//               style={styles.bannerContainer}
//               onPress={pickBannerImage}
//               activeOpacity={0.8}
//             >
//               {bannerImage ? (
//                 <Image
//                   source={{ uri: bannerImage.uri }}
//                   style={styles.bannerImage}
//                 />
//               ) : (
//                 <View style={styles.bannerPlaceholder}>
//                   <View style={styles.bannerIconCircle}>
//                     <MaterialIcons
//                       name="add-a-photo"
//                       size={28}
//                       color="#6B7280"
//                     />
//                   </View>
//                   <Text style={styles.bannerText}>
//                     {t("organization.addBanner")}
//                   </Text>
//                   <Text style={styles.bannerHint}>
//                     {t("organization.bannerHint", "Recommended: 1200x675px")}
//                   </Text>
//                 </View>
//               )}
//             </TouchableOpacity>

//             {/* Organization Name */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.inputLabel}>{t("organization.name")}</Text>
//               <TextInput
//                 style={[styles.textInput, errors.name && styles.inputError]}
//                 placeholder={t("organization.namePlaceholder")}
//                 placeholderTextColor="#9CA3AF"
//                 value={formData.name}
//                 onChangeText={(v) => handleInputChange("name", v)}
//               />
//               {errors.name && (
//                 <Text style={styles.errorText}>{errors.name}</Text>
//               )}
//             </View>

//             {/* Description */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.inputLabel}>
//                 {t("organization.description")}
//               </Text>
//               <Text style={styles.inputHint}>
//                 {t(
//                   "organization.descriptionHint",
//                   "Optional - Tell clients about your organization"
//                 )}
//               </Text>
//               <TextInput
//                 style={[styles.textInput, styles.textArea]}
//                 placeholder={t("organization.descriptionPlaceholder")}
//                 placeholderTextColor="#9CA3AF"
//                 value={formData.description}
//                 onChangeText={(v) => handleInputChange("description", v)}
//                 multiline
//                 numberOfLines={4}
//                 textAlignVertical="top"
//               />
//             </View>
//           </View>
//         );

//       case 2:
//         return (
//           <View style={styles.inputsContainer}>
//             <View style={styles.businessTypeGrid}>
//               {BUSINESS_TYPES.map((type) => {
//                 const isSelected = formData.business_type === type.id;
//                 return (
//                   <TouchableOpacity
//                     key={type.id}
//                     style={[
//                       styles.businessTypeCard,
//                       isSelected && styles.businessTypeCardSelected
//                     ]}
//                     onPress={() => selectBusinessType(type)}
//                     activeOpacity={0.7}
//                   >
//                     <View
//                       style={[
//                         styles.businessTypeIconContainer,
//                         isSelected && styles.businessTypeIconSelected
//                       ]}
//                     >
//                       <MaterialIcons
//                         name={type.icon as any}
//                         size={28}
//                         color={isSelected ? "#FFFFFF" : "#374151"}
//                       />
//                     </View>
//                     <Text
//                       style={[
//                         styles.businessTypeLabel,
//                         isSelected && styles.businessTypeLabelSelected
//                       ]}
//                     >
//                       {t(type.nameKey)}
//                     </Text>
//                     {isSelected && (
//                       <View style={styles.checkBadge}>
//                         <MaterialIcons name="check" size={14} color="#FFFFFF" />
//                       </View>
//                     )}
//                   </TouchableOpacity>
//                 );
//               })}
//             </View>
//             {errors.business_type && (
//               <Text style={styles.errorText}>{errors.business_type}</Text>
//             )}
//           </View>
//         );

//       case 3:
//         return (
//           <View style={styles.inputsContainer}>
//             <View style={styles.inputGroup}>
//               <Text style={styles.inputLabel}>{t("organization.city")}</Text>
//               <TextInput
//                 style={[styles.textInput, errors.city && styles.inputError]}
//                 placeholder={t("organization.cityPlaceholder")}
//                 placeholderTextColor="#9CA3AF"
//                 value={formData.city}
//                 onChangeText={(v) => handleInputChange("city", v)}
//               />
//               {errors.city && (
//                 <Text style={styles.errorText}>{errors.city}</Text>
//               )}
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.inputLabel}>
//                 {t("organization.streetAddress")}
//               </Text>
//               <Text style={styles.inputHint}>
//                 {t(
//                   "organization.addressHint",
//                   "Optional - Add your street address"
//                 )}
//               </Text>
//               <TextInput
//                 style={styles.textInput}
//                 placeholder={t("organization.streetAddressPlaceholder")}
//                 placeholderTextColor="#9CA3AF"
//                 value={formData.address}
//                 onChangeText={(v) => handleInputChange("address", v)}
//               />
//             </View>
//           </View>
//         );

//       case 4:
//         return (
//           <View style={styles.inputsContainer}>
//             <View style={styles.inputGroup}>
//               <Text style={styles.inputLabel}>{t("organization.phone")}</Text>
//               <TextInput
//                 style={styles.textInput}
//                 placeholder={t("organization.phonePlaceholder")}
//                 placeholderTextColor="#9CA3AF"
//                 value={formData.phone}
//                 onChangeText={(v) => handleInputChange("phone", v)}
//                 keyboardType="phone-pad"
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.inputLabel}>{t("organization.email")}</Text>
//               <TextInput
//                 style={styles.textInput}
//                 placeholder={t("organization.emailPlaceholder")}
//                 placeholderTextColor="#9CA3AF"
//                 value={formData.email}
//                 onChangeText={(v) => handleInputChange("email", v)}
//                 keyboardType="email-address"
//                 autoCapitalize="none"
//               />
//             </View>
//           </View>
//         );

//       case 5:
//         return (
//           <View style={styles.inputsContainer}>
//             <View style={styles.reviewCard}>
//               {bannerImage ? (
//                 <Image
//                   source={{ uri: bannerImage.uri }}
//                   style={styles.reviewBanner}
//                 />
//               ) : (
//                 <View style={styles.reviewBannerPlaceholder}>
//                   <MaterialIcons name="business" size={40} color="#D1D5DB" />
//                 </View>
//               )}
//               <View style={styles.reviewContent}>
//                 <Text style={styles.reviewName}>
//                   {formData.name ||
//                     t("organization.noName", "Organization Name")}
//                 </Text>
//                 <View style={styles.reviewBadge}>
//                   <Text style={styles.reviewBadgeText}>
//                     {formData.business_type_name ||
//                       t("organization.selectType", "Select Type")}
//                   </Text>
//                 </View>
//                 {formData.city && (
//                   <View style={styles.reviewRow}>
//                     <MaterialIcons
//                       name="location-on"
//                       size={16}
//                       color="#6B7280"
//                     />
//                     <Text style={styles.reviewText}>
//                       {formData.city}
//                       {formData.address ? `, ${formData.address}` : ""}
//                     </Text>
//                   </View>
//                 )}
//                 {formData.phone && (
//                   <View style={styles.reviewRow}>
//                     <MaterialIcons name="phone" size={16} color="#6B7280" />
//                     <Text style={styles.reviewText}>{formData.phone}</Text>
//                   </View>
//                 )}
//                 {formData.email && (
//                   <View style={styles.reviewRow}>
//                     <MaterialIcons name="email" size={16} color="#6B7280" />
//                     <Text style={styles.reviewText}>{formData.email}</Text>
//                   </View>
//                 )}
//               </View>
//             </View>

//             <View style={styles.infoBox}>
//               <MaterialIcons name="info-outline" size={20} color="#0369A1" />
//               <Text style={styles.infoText}>{t("organization.infoText")}</Text>
//             </View>
//           </View>
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : undefined}
//         style={styles.flex}
//       >
//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity
//             style={styles.closeBtn}
//             onPress={() => navigation.goBack()}
//           >
//             <MaterialIcons name="close" size={24} color="#111827" />
//           </TouchableOpacity>

//           {/* Progress Dots */}
//           <View style={styles.progressDots}>
//             {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
//               <View
//                 key={i}
//                 style={[styles.dot, i + 1 <= currentStep && styles.dotActive]}
//               />
//             ))}
//           </View>

//           <View style={styles.headerSpacer} />
//         </View>

//         <ScrollView
//           style={styles.scrollView}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//         >
//           {/* Step Header */}
//           <View style={styles.stepHeader}>
//             <View style={styles.stepIconContainer}>
//               <MaterialIcons
//                 name={currentConfig.icon as any}
//                 size={32}
//                 color="#111827"
//               />
//             </View>
//             <Text style={styles.stepTitle}>{currentConfig.title}</Text>
//             <Text style={styles.stepSubtitle}>{currentConfig.subtitle}</Text>
//           </View>

//           {/* Step Content */}
//           {renderStepContent()}

//           <View style={{ height: 120 }} />
//         </ScrollView>

//         {/* Footer Navigation */}
//         <View style={styles.footer}>
//           <View style={styles.footerInner}>
//             {currentStep > 1 ? (
//               <TouchableOpacity style={styles.backBtn} onPress={prevStep}>
//                 <MaterialIcons name="arrow-back" size={20} color="#374151" />
//                 <Text style={styles.backBtnText}>{t("common.back")}</Text>
//               </TouchableOpacity>
//             ) : (
//               <View style={styles.backBtn} />
//             )}

//             <TouchableOpacity
//               style={styles.nextBtn}
//               onPress={currentStep === TOTAL_STEPS ? handleSubmit : nextStep}
//               activeOpacity={0.8}
//             >
//               <Text style={styles.nextBtnText}>
//                 {currentStep === TOTAL_STEPS
//                   ? t("organization.create", "Create")
//                   : t("common.next")}
//               </Text>
//               {currentStep < TOTAL_STEPS && (
//                 <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
//               )}
//             </TouchableOpacity>
//           </View>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#FFFFFF" },
//   flex: { flex: 1 },

//   // Header
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F3F4F6"
//   },
//   closeBtn: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "#F3F4F6",
//     alignItems: "center",
//     justifyContent: "center"
//   },
//   progressDots: {
//     flexDirection: "row",
//     gap: 6
//   },
//   dot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: "#E5E7EB"
//   },
//   dotActive: {
//     backgroundColor: "#111827",
//     width: 24
//   },
//   headerSpacer: { width: 40 },

//   // Scroll
//   scrollView: { flex: 1 },

//   // Step Header
//   stepHeader: {
//     paddingHorizontal: 24,
//     paddingTop: 32,
//     paddingBottom: 24
//   },
//   stepIconContainer: {
//     width: 64,
//     height: 64,
//     borderRadius: 32,
//     backgroundColor: "#F3F4F6",
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 20
//   },
//   stepTitle: {
//     fontSize: 28,
//     fontWeight: "700",
//     color: "#111827",
//     marginBottom: 8,
//     letterSpacing: -0.5
//   },
//   stepSubtitle: {
//     fontSize: 16,
//     color: "#6B7280",
//     lineHeight: 24
//   },

//   // Inputs Container
//   inputsContainer: {
//     paddingHorizontal: 24
//   },

//   // Input Group
//   inputGroup: {
//     marginBottom: 24
//   },
//   inputLabel: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#374151",
//     marginBottom: 8
//   },
//   inputHint: {
//     fontSize: 13,
//     color: "#9CA3AF",
//     marginBottom: 8
//   },
//   textInput: {
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     fontSize: 16,
//     color: "#111827",
//     backgroundColor: "#FFFFFF"
//   },
//   textArea: {
//     minHeight: 100,
//     paddingTop: 16
//   },
//   inputError: {
//     borderColor: "#EF4444"
//   },
//   errorText: {
//     fontSize: 13,
//     color: "#EF4444",
//     marginTop: 6
//   },

//   // Banner
//   bannerContainer: {
//     height: 160,
//     borderRadius: 16,
//     marginBottom: 24,
//     overflow: "hidden"
//   },
//   bannerImage: {
//     width: "100%",
//     height: "100%"
//   },
//   bannerPlaceholder: {
//     flex: 1,
//     backgroundColor: "#F9FAFB",
//     borderWidth: 2,
//     borderColor: "#E5E7EB",
//     borderStyle: "dashed",
//     borderRadius: 16,
//     alignItems: "center",
//     justifyContent: "center"
//   },
//   bannerIconCircle: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: "#F3F4F6",
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 12
//   },
//   bannerText: {
//     fontSize: 15,
//     fontWeight: "600",
//     color: "#374151",
//     marginBottom: 4
//   },
//   bannerHint: {
//     fontSize: 13,
//     color: "#9CA3AF"
//   },

//   // Business Type Grid
//   businessTypeGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 12
//   },
//   businessTypeCard: {
//     width: "47%",
//     backgroundColor: "#F9FAFB",
//     borderRadius: 16,
//     padding: 20,
//     alignItems: "center",
//     borderWidth: 2,
//     borderColor: "transparent",
//     position: "relative"
//   },
//   businessTypeCardSelected: {
//     backgroundColor: "#F0FDF4",
//     borderColor: "#10B981"
//   },
//   businessTypeIconContainer: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: "#FFFFFF",
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 12
//   },
//   businessTypeIconSelected: {
//     backgroundColor: "#10B981"
//   },
//   businessTypeLabel: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#374151",
//     textAlign: "center"
//   },
//   businessTypeLabelSelected: {
//     color: "#065F46"
//   },
//   checkBadge: {
//     position: "absolute",
//     top: 12,
//     right: 12,
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     backgroundColor: "#10B981",
//     alignItems: "center",
//     justifyContent: "center"
//   },

//   // Review Card
//   reviewCard: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//     overflow: "hidden",
//     marginBottom: 20
//   },
//   reviewBanner: {
//     width: "100%",
//     height: 120
//   },
//   reviewBannerPlaceholder: {
//     width: "100%",
//     height: 120,
//     backgroundColor: "#F3F4F6",
//     alignItems: "center",
//     justifyContent: "center"
//   },
//   reviewContent: {
//     padding: 20
//   },
//   reviewName: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#111827",
//     marginBottom: 8
//   },
//   reviewBadge: {
//     alignSelf: "flex-start",
//     backgroundColor: "#ECFDF5",
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//     marginBottom: 16
//   },
//   reviewBadgeText: {
//     fontSize: 13,
//     fontWeight: "600",
//     color: "#059669"
//   },
//   reviewRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 8
//   },
//   reviewText: {
//     fontSize: 14,
//     color: "#6B7280",
//     marginLeft: 8
//   },

//   // Info Box
//   infoBox: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     backgroundColor: "#EFF6FF",
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 20
//   },
//   infoText: {
//     flex: 1,
//     fontSize: 14,
//     color: "#1E40AF",
//     marginLeft: 12,
//     lineHeight: 20
//   },

//   // Footer
//   footer: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: "#FFFFFF",
//     borderTopWidth: 1,
//     borderTopColor: "#F3F4F6",
//     paddingBottom: Platform.OS === "ios" ? 34 : 20
//   },
//   footerInner: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 24,
//     paddingTop: 16
//   },
//   backBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     minWidth: 80
//   },
//   backBtnText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#374151",
//     marginLeft: 4
//   },
//   nextBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#111827",
//     paddingVertical: 16,
//     paddingHorizontal: 32,
//     borderRadius: 12,
//     gap: 8
//   },
//   nextBtnText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#FFFFFF"
//   }
// });

// export default CreateOrganizationScreen;


/**
 * Create Organization Screen — Airbnb-style step flow
 * Matches CreateLandmarkScreen / CreatePropertySaleScreen design system exactly:
 *   • 32px bottom-border focused inputs
 *   • Intro screen with numbered step circles
 *   • Option cards (#DDDDDD border → #222 active)
 *   • #D16024 checkmarks
 *   • Thin #222 progress bar
 *   • Back (underlined) / Next (#222 pill) footer
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { pickImageNative } from "../utils/nativePhotoPicker";
import { endpoints } from "../constants";
import { useUser } from "../hooks/useUser";
import { SignUpOrSignInScreen } from "./SignUpOrSignInScreen";
import { Loading } from "../components/Loading";

const { width } = Dimensions.get("window");

// ─── Business type options ────────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { id: "brokerage", nameKey: "organization.businessTypes.brokerage", icon: "business" },
  { id: "agency", nameKey: "organization.businessTypes.agency", icon: "store" },
  { id: "individual", nameKey: "organization.businessTypes.individual", icon: "person" },
  { id: "developer", nameKey: "organization.businessTypes.developer", icon: "construction" },
  { id: "management", nameKey: "organization.businessTypes.management", icon: "home-work" },
];

export const CreateOrganizationScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0); // 0-indexed like other screens
  const [bannerImage, setBannerImage] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    country: "Mauritania",
    business_type: "",
    business_type_name: "",
  });

  // ─── Mutation ───────────────────────────────────────────────────────────────
  const createOrganizationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(endpoints.organization, data, {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
      });
      return response.data;
    },
    onSuccess: () => {
      Alert.alert(
        t("organization.success", "Success"),
        t("organization.createdSuccessfully", "Your organization has been created!"),
        [
          {
            text: t("common.ok", "OK"),
            onPress: () => {
              queryClient.invalidateQueries({ queryKey: ["user-organization"] });
              navigation.goBack();
            },
          },
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert(
        t("common.error", "Error"),
        error.response?.data?.error || t("organization.createError", "Failed to create organization.")
      );
    },
  });

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const pickBannerImage = async () => {
    const result = await pickImageNative({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setBannerImage(result.assets[0]);
    }
  };

  const handleSubmit = () => {
    createOrganizationMutation.mutate({
      ...formData,
      banner_image: bannerImage?.uri || null,
    });
  };

  // ─── Guards ─────────────────────────────────────────────────────────────────
  if (!user) return <SignUpOrSignInScreen />;
  if (createOrganizationMutation.isLoading) return <Loading />;

  // ─── Steps ──────────────────────────────────────────────────────────────────
  const STEPS = [
    // 0 — INTRO
    {
      title: t("organization.steps.intro.title", "Let's get started"),
      subtitle: t("organization.steps.intro.subtitle", "We'll help you set up your organization in a few simple steps"),
      validation: () => true,
      render: () => (
        <View style={styles.introContainer}>
          <View style={styles.introIcon}>
            <MaterialIcons name="business" size={48} color="#D16024" />
          </View>
          <Text style={styles.introTitle}>
            {t("organization.introTitle", "Create your organization")}
          </Text>
          <Text style={styles.introText}>
            {t(
              "organization.introBody",
              "Set up your professional profile so clients can find and trust your business."
            )}
          </Text>
          <View style={styles.introSteps}>
            {[
              t("organization.introStep1", "Tell us about your organization"),
              t("organization.introStep2", "Choose your business type"),
              t("organization.introStep3", "Add location & contact info"),
            ].map((label, i) => (
              <View key={i} style={styles.introStep}>
                <View style={styles.introStepNumber}>
                  <Text style={styles.introStepNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.introStepText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      ),
    },

    // 1 — NAME (single focused input)
    {
      title: t("organization.steps.name.title", "What's your organization called?"),
      subtitle: t("organization.steps.name.subtitle", "This helps clients find and recognize your business"),
      validation: () => formData.name.trim().length > 0,
      render: () => (
        <View style={styles.focusedInputContainer}>
          <TextInput
            style={styles.focusedInput}
            value={formData.name}
            onChangeText={(v) => handleInputChange("name", v)}
            placeholder={t("organization.namePlaceholder", "e.g., Al-Nour Real Estate")}
            placeholderTextColor="#B0B0B0"
            autoFocus
          />
          <Text style={styles.inputHint}>
            {t("organization.nameHint", "Choose a clear, memorable name")}
          </Text>
        </View>
      ),
    },

    // 2 — DESCRIPTION (optional)
    {
      title: t("organization.steps.desc.title", "Tell clients about your organization"),
      subtitle: t("organization.steps.desc.subtitle", "What makes your business special?"),
      validation: () => true, // optional
      render: () => (
        <View style={styles.focusedInputContainer}>
          <TextInput
            style={[styles.focusedInput, styles.focusedTextArea]}
            value={formData.description}
            onChangeText={(v) => handleInputChange("description", v)}
            placeholder={t(
              "organization.descPlaceholder",
              "Describe your services, experience, and what sets you apart..."
            )}
            placeholderTextColor="#B0B0B0"
            autoFocus
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <Text style={styles.inputHint}>
            {t("organization.descHint", "Optional — but helps attract more clients")}
          </Text>
        </View>
      ),
    },

    // 3 — BANNER + BUSINESS TYPE
    {
      title: t("organization.steps.type.title", "What type of business is this?"),
      subtitle: t("organization.steps.type.subtitle", "Select the category that best describes you"),
      validation: () => formData.business_type.length > 0,
      render: () => (
        <View>
          {/* Banner upload — compact */}
          <TouchableOpacity style={styles.bannerUpload} onPress={pickBannerImage} activeOpacity={0.8}>
            {bannerImage ? (
              <Image source={{ uri: bannerImage.uri }} style={styles.bannerImage} />
            ) : (
              <View style={styles.bannerPlaceholder}>
                <MaterialIcons name="add-a-photo" size={32} color="#B0B0B0" />
                <Text style={styles.bannerPlaceholderText}>
                  {t("organization.addBanner", "Add a banner photo")}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Business type cards */}
          <View style={styles.optionsContainer}>
            {BUSINESS_TYPES.map((type) => {
              const active = formData.business_type === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.optionCard, active && styles.optionCardActive]}
                  activeOpacity={0.7}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      business_type: active ? "" : type.id,
                      business_type_name: active ? "" : t(type.nameKey),
                    }))
                  }
                >
                  <MaterialIcons
                    name={type.icon as any}
                    size={28}
                    color={active ? "#D16024" : "#717171"}
                  />
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {t(type.nameKey)}
                  </Text>
                  {active && (
                    <View style={styles.checkMark}>
                      <MaterialIcons name="check" size={16} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ),
    },

    // 4 — CITY (single focused input, required)
    {
      title: t("organization.steps.location.title", "Where are you located?"),
      subtitle: t("organization.steps.location.subtitle", "Help clients find you easily"),
      validation: () => formData.city.trim().length > 0,
      render: () => (
        <View style={styles.focusedInputContainer}>
          <TextInput
            style={styles.focusedInput}
            value={formData.city}
            onChangeText={(v) => handleInputChange("city", v)}
            placeholder={t("organization.cityPlaceholder", "e.g., Nouakchott")}
            placeholderTextColor="#B0B0B0"
            autoFocus
          />
          <Text style={styles.inputHint}>
            {t("organization.cityHint", "Enter the city where your office is located")}
          </Text>
        </View>
      ),
    },

    // 5 — ADDRESS (optional)
    {
      title: t("organization.steps.address.title", "What's your street address?"),
      subtitle: t("organization.steps.address.subtitle", "So clients can visit you in person"),
      validation: () => true, // optional
      render: () => (
        <View style={styles.focusedInputContainer}>
          <TextInput
            style={styles.focusedInput}
            value={formData.address}
            onChangeText={(v) => handleInputChange("address", v)}
            placeholder={t("organization.addressPlaceholder", "e.g., Rue des Fleurs, Bloc A")}
            placeholderTextColor="#B0B0B0"
            autoFocus
          />
          <Text style={styles.inputHint}>
            {t("organization.addressHint", "Optional — skip if you prefer not to share")}
          </Text>
        </View>
      ),
    },

    // 6 — PHONE
    {
      title: t("organization.steps.phone.title", "What's your phone number?"),
      subtitle: t("organization.steps.phone.subtitle", "Clients will use this to reach you"),
      validation: () => true, // optional
      render: () => (
        <View style={styles.focusedInputContainer}>
          <TextInput
            style={styles.focusedInput}
            value={formData.phone}
            onChangeText={(v) => handleInputChange("phone", v)}
            placeholder={t("organization.phonePlaceholder", "e.g., +222 1234 5678")}
            placeholderTextColor="#B0B0B0"
            keyboardType="phone-pad"
            autoFocus
          />
          <Text style={styles.inputHint}>
            {t("organization.phoneHint", "Optional — add your best contact number")}
          </Text>
        </View>
      ),
    },

    // 7 — EMAIL
    {
      title: t("organization.steps.email.title", "What's your email address?"),
      subtitle: t("organization.steps.email.subtitle", "For inquiries and communication"),
      validation: () => true, // optional
      render: () => (
        <View style={styles.focusedInputContainer}>
          <TextInput
            style={styles.focusedInput}
            value={formData.email}
            onChangeText={(v) => handleInputChange("email", v)}
            placeholder={t("organization.emailPlaceholder", "e.g., contact@yourorg.com")}
            placeholderTextColor="#B0B0B0"
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
          />
          <Text style={styles.inputHint}>
            {t("organization.emailHint", "Optional — clients can use this to email you")}
          </Text>
        </View>
      ),
    },

    // 8 — REVIEW
    {
      title: t("organization.steps.review.title", "Review your organization"),
      subtitle: t("organization.steps.review.subtitle", "Everything look good?"),
      validation: () => true,
      render: () => (
        <View style={styles.reviewContainer}>
          {/* Banner preview */}
          {bannerImage && (
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>{t("organization.banner", "Banner")}</Text>
              <Image source={{ uri: bannerImage.uri }} style={styles.reviewBanner} />
            </View>
          )}

          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>{t("organization.name", "Name")}</Text>
            <Text style={styles.reviewValue}>{formData.name || t("common.notSet", "Not set")}</Text>
          </View>

          {formData.description ? (
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>{t("organization.description", "Description")}</Text>
              <Text style={styles.reviewValue}>{formData.description}</Text>
            </View>
          ) : null}

          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>{t("organization.businessType", "Business Type")}</Text>
            <Text style={styles.reviewValue}>
              {formData.business_type_name || t("common.notSet", "Not set")}
            </Text>
          </View>

          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>{t("organization.location", "Location")}</Text>
            <Text style={styles.reviewValue}>
              {formData.city || t("common.notSet", "Not set")}
              {formData.address ? ` — ${formData.address}` : ""}
            </Text>
          </View>

          {formData.phone ? (
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>{t("organization.phone", "Phone")}</Text>
              <Text style={styles.reviewValue}>{formData.phone}</Text>
            </View>
          ) : null}

          {formData.email ? (
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>{t("organization.email", "Email")}</Text>
              <Text style={styles.reviewValue}>{formData.email}</Text>
            </View>
          ) : null}

          <View style={styles.reviewNote}>
            <MaterialIcons name="info-outline" size={20} color="#D16024" />
            <Text style={styles.reviewNoteText}>
              {t("organization.reviewNote", "You can edit your organization details anytime after creation")}
            </Text>
          </View>
        </View>
      ),
    },
  ];

  // ─── Navigation ─────────────────────────────────────────────────────────────
  const currentStepData = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const isLastStep = currentStep === STEPS.length - 1;

  const canProceed = currentStepData.validation();

  const nextStep = () => {
    if (canProceed && currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1);
  };
  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header — close + progress bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <MaterialIcons name="close" size={28} color="#222" />
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepTitle}>{currentStepData.title}</Text>
        <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>
        <View style={styles.stepBody}>{currentStepData.render()}</View>
      </ScrollView>

      {/* Footer — Back / Next */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          {currentStep > 0 ? (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <MaterialIcons name="arrow-back" size={24} color="#222" />
              <Text style={styles.backButtonText}>{t("common.back", "Back")}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
            onPress={isLastStep ? handleSubmit : nextStep}
            disabled={!canProceed}
          >
            {createOrganizationMutation.isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.nextButtonText}>
                {isLastStep ? t("organization.create", "Create") : t("common.next", "Next")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── Styles (mirrors CreateLandmarkScreen exactly) ───────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // ── Header ──
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    marginBottom: 12,
  },
  progressBar: {
    height: 2,
    backgroundColor: "#EBEBEB",
    borderRadius: 1,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#222",
    borderRadius: 1,
  },

  // ── Scroll ──
  content: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },

  // ── Step header ──
  stepTitle: {
    fontSize: 32,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
    lineHeight: 40,
  },
  stepSubtitle: {
    fontSize: 18,
    color: "#717171",
    marginBottom: 32,
    lineHeight: 26,
  },
  stepBody: { flex: 1 },

  // ── Intro ──
  introContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  introIcon: { marginBottom: 24 },
  introTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#222",
    marginBottom: 16,
    textAlign: "center",
  },
  introText: {
    fontSize: 16,
    color: "#717171",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  introSteps: { width: "100%", gap: 20 },
  introStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  introStepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  introStepNumberText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  introStepText: {
    fontSize: 16,
    color: "#222",
    flex: 1,
  },

  // ── Focused input (single large input per step) ──
  focusedInputContainer: { width: "100%" },
  focusedInput: {
    fontSize: 32,
    fontWeight: "400",
    color: "#222",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    paddingBottom: 8,
    marginBottom: 16,
  },
  focusedTextArea: {
    fontSize: 18,
    lineHeight: 28,
    minHeight: 140,
    textAlignVertical: "top",
  },
  inputHint: {
    fontSize: 14,
    color: "#717171",
    lineHeight: 20,
  },

  // ── Option cards (business types) ──
  optionsContainer: {
    width: "100%",
    gap: 12,
    marginTop: 24,
  },
  optionCard: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    gap: 16,
  },
  optionCardActive: {
    borderColor: "#222",
    borderWidth: 2,
    backgroundColor: "#F7F7F7",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#222",
    flex: 1,
  },
  optionTextActive: { fontWeight: "600" },
  checkMark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#D16024",
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Banner upload (compact, inline with business type step) ──
  bannerUpload: {
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerPlaceholder: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#DDDDDD",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  bannerPlaceholderText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#717171",
  },

  // ── Review ──
  reviewContainer: {
    width: "100%",
    gap: 20,
  },
  reviewSection: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EBEBEB",
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#717171",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  reviewValue: {
    fontSize: 16,
    color: "#222",
    fontWeight: "400",
  },
  reviewBanner: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginTop: 4,
  },
  reviewNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF4ED",
    padding: 16,
    borderRadius: 8,
    gap: 12,
    marginTop: 8,
  },
  reviewNoteText: {
    flex: 1,
    fontSize: 14,
    color: "#222",
    lineHeight: 20,
  },

  // ── Footer ──
  footer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EBEBEB",
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    textDecorationLine: "underline",
  },
  nextButton: {
    backgroundColor: "#222",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  nextButtonDisabled: {
    backgroundColor: "#DDDDDD",
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default CreateOrganizationScreen;