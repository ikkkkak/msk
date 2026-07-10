// import { Text } from "@ui-kitten/components";
// import {
//   View,
//   StyleSheet,
//   TouchableOpacity,
//   Animated,
//   Image,
//   ActivityIndicator,
//   Alert,
//   TextInput,
//   KeyboardAvoidingView,
//   Platform,
//   Keyboard,
// } from "react-native";
// import { Formik } from "formik";
// import { useRef, useState, useEffect } from "react";
// import { MaterialIcons } from "@expo/vector-icons";
// import * as yup from "yup";
// import { useTranslation } from "react-i18next";
// import { useNavigation } from "@react-navigation/native";
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
// import { pickImage, uploadImagesToCloudinary } from "../utils/pickImage";
// import { PhosphorIcon } from "./PhosphorIcon";
// import {
//   usePropertyCategories,
//   useAmenities,
// } from "../hooks/queries/useCategories";
// import { useCitiesQuery, type City } from "../hooks/queries/useCitiesQuery";
// import { useZonesByCity } from "../hooks/queries/useZonesQuery";
// import { useQuartiersByZone } from "../hooks/queries/useQuartiersQuery";

// interface LandListing {
//   title: string;
//   description: string;
//   area: string;
//   areaUnit: "m²" | "hectare";
//   price: string;
//   cleaningFee: string;
//   serviceFee: string;
//   currency: "MRU";
//   landCategoryId: number;
//   city: string;
//   city_id: number;
//   zone: string;
//   zone_id: number;
//   quartier: string;
//   quartier_id: number;
//   amenities: number[];
//   images: string[];
//   hasMap: boolean;
//   lat: string;
//   lng: string;
//   addressLine1: string;
//   state: string;
//   country: string;
//   zip: string;
//   neighborhoodDescription: string;
//   houseRules: string;
//   cancellationPolicy: string;
//   checkInTime: string;
//   checkOutTime: string;
//   bookingMode: "instant" | "manual";
// }

// const standardHouseRules = [
//   { label: "Respect du voisinage (calme après 22h)", value: "quiet_hours" },
//   { label: "Interdiction de fumer", value: "no_smoking" },
//   { label: "Animaux non autorisés", value: "no_pets" },
//   { label: "Pas de fêtes ni d'événements", value: "no_parties" },
// ];

// const cancellationPolicies = [
//   {
//     label: "Flexible — remboursement intégral jusqu'à 24h avant",
//     value: "flexible",
//   },
//   {
//     label: "Modérée — remboursement 50% jusqu'à 5 jours avant",
//     value: "moderate",
//   },
//   { label: "Stricte — non remboursable", value: "strict" },
// ];

// export const AddPropertySection = () => {
//   const { t } = useTranslation();
//   const navigation = useNavigation();
//   const [step, setStep] = useState(0);
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const [showSuccessToast, setShowSuccessToast] = useState(false);
//   const toastAnimation = useRef(new Animated.Value(0)).current;
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Fetch data from backend
//   const { data: landCategories, isLoading: categoriesLoading } =
//     usePropertyCategories();
//   const { data: amenitiesData, isLoading: amenitiesLoading } = useAmenities();
//   const { data: cities, isLoading: citiesLoading } = useCitiesQuery();

//   const [selectedCityId, setSelectedCityId] = useState(0);
//   const [selectedZoneId, setSelectedZoneId] = useState(0);

//   const { data: zones = [], isLoading: zonesLoading } =
//     useZonesByCity(selectedCityId);
//   const { data: quartiers = [], isLoading: quartiersLoading } =
//     useQuartiersByZone(selectedZoneId);

//   const amenities = Array.isArray(amenitiesData) ? amenitiesData : [];

//   const TOTAL_STEPS = 15;

//   useEffect(() => {
//     Animated.timing(fadeAnim, {
//       toValue: 1,
//       duration: 300,
//       useNativeDriver: true,
//     }).start();
//   }, [step]);

//   const showToast = () => {
//     setShowSuccessToast(true);
//     Animated.timing(toastAnimation, {
//       toValue: 1,
//       duration: 300,
//       useNativeDriver: true,
//     }).start();
//   };

//   const hideToast = () => {
//     Animated.timing(toastAnimation, {
//       toValue: 0,
//       duration: 300,
//       useNativeDriver: true,
//     }).start(() => {
//       setShowSuccessToast(false);
//     });
//   };

//   const onSubmit = async (values: LandListing) => {
//     setIsSubmitting(true);
//     try {
//       console.log("🖼️ Uploading images to Cloudinary...");
//       const uploadedImages = await uploadImagesToCloudinary(
//         values.images || []
//       );
//       console.log("✅ Images uploaded:", uploadedImages);

//       const submissionData = {
//         ...values,
//         images: uploadedImages,
//         amenities: values.amenities.map((id) => String(id)),
//       };

//       console.log("Submitting land listing:", submissionData);
//       await new Promise((resolve) => setTimeout(resolve, 2000));
//       showToast();
//     } catch (error) {
//       console.error("❌ Error:", error);
//       Alert.alert(
//         "Erreur",
//         "Impossible de publier votre annonce. Veuillez réessayer."
//       );
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const validationSchema = yup.object().shape({
//     title: yup.string().required("Requis"),
//     area: yup.string(),
//     price: yup.string().required("Requis"),
//     city: yup.string().required("Requis"),
//     landCategoryId: yup.number().min(1, "Requis"),
//     addressLine1: yup.string(),
//     state: yup.string(),
//     amenities: yup.array().of(yup.number()),
//     houseRules: yup.string().required("Requis"),
//     checkInTime: yup.string().required("Requis"),
//     checkOutTime: yup.string().required("Requis"),
//     bookingMode: yup.string().oneOf(["instant", "manual"]).required("Requis"),
//   });

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === "ios" ? "padding" : undefined}
//     >
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           onPress={() => navigation.goBack()}
//           style={styles.closeButton}
//         >
//           <MaterialIcons name="close" size={24} color="#222" />
//         </TouchableOpacity>

//         {step > 0 && (
//           <View style={styles.progressContainer}>
//             <View style={styles.progressBar}>
//               <View
//                 style={[
//                   styles.progressFill,
//                   { width: `${(step / TOTAL_STEPS) * 100}%` },
//                 ]}
//               />
//             </View>
//           </View>
//         )}
//       </View>

//       <Formik
//         initialValues={{
//           title: "",
//           description: "",
//           area: "",
//           areaUnit: "m²" as "m²" | "hectare",
//           price: "",
//           cleaningFee: "",
//           serviceFee: "",
//           currency: "MRU" as "MRU",
//           landCategoryId: 0,
//           city: "",
//           city_id: 0,
//           zone: "",
//           zone_id: 0,
//           quartier: "",
//           quartier_id: 0,
//           amenities: [] as number[],
//           images: [] as string[],
//           hasMap: false,
//           lat: "",
//           lng: "",
//           addressLine1: "",
//           state: "",
//           country: "Mauritanie",
//           zip: "",
//           neighborhoodDescription: "",
//           houseRules: "",
//           cancellationPolicy: "",
//           checkInTime: "",
//           checkOutTime: "",
//           bookingMode: "instant" as "instant" | "manual",
//         }}
//         validationSchema={validationSchema}
//         onSubmit={onSubmit}
//       >
//         {({ values, handleSubmit, setFieldValue }) => {
//           const canContinue = () => {
//             switch (step) {
//               case 0:
//                 return true;
//               case 1:
//                 return values.title.trim().length > 0;
//               case 2:
//                 return true;
//               case 3:
//                 return true;
//               case 4:
//                 return values.price.trim().length > 0;
//               case 5:
//                 return values.landCategoryId > 0;
//               case 6:
//                 return values.city.trim().length > 0;
//               case 7:
//                 return (
//                   values.addressLine1.trim().length > 0 &&
//                   values.state.trim().length > 0
//                 );
//               case 8:
//                 return true;
//               case 9:
//                 return values.houseRules.trim().length > 0;
//               case 10:
//                 return true;
//               case 11:
//                 return values.neighborhoodDescription.trim().length > 0;
//               case 12:
//                 return values.checkInTime && values.checkOutTime;
//               case 13:
//                 return true;
//               case 14:
//                 return true;
//               default:
//                 return true;
//             }
//           };

//           return (
//             <>
//               <KeyboardAwareScrollView
//                 style={styles.content}
//                 contentContainerStyle={{ paddingBottom: 20 }}
//                 showsVerticalScrollIndicator={false}
//                 enableOnAndroid={true}
//                 enableAutomaticScroll={true}
//                 extraScrollHeight={100}
//                 keyboardShouldPersistTaps="handled"
//               >
//                 <Animated.View
//                   style={[styles.stepContainer, { opacity: fadeAnim }]}
//                 >
//                   {/* Step 0: Welcome */}
//                   {step === 0 && (
//                     <View style={styles.welcomeStep}>
//                       <MaterialIcons name="landscape" size={56} color="#222" />
//                       <Text style={styles.welcomeTitle}>
//                         Vendez votre terrain
//                       </Text>
//                       <Text style={styles.welcomeSubtitle}>
//                         Un processus simple en quelques étapes
//                       </Text>

//                       <View style={styles.infoBox}>
//                         <MaterialIcons
//                           name="check-circle"
//                           size={18}
//                           color="#4CAF50"
//                         />
//                         <Text style={styles.infoText}>Infos essentielles</Text>
//                       </View>
//                       <View style={styles.infoBox}>
//                         <MaterialIcons
//                           name="location-on"
//                           size={18}
//                           color="#4CAF50"
//                         />
//                         <Text style={styles.infoText}>Localisation</Text>
//                       </View>
//                       <View style={styles.infoBox}>
//                         <MaterialIcons
//                           name="photo-camera"
//                           size={18}
//                           color="#4CAF50"
//                         />
//                         <Text style={styles.infoText}>Photos (optionnel)</Text>
//                       </View>
//                     </View>
//                   )}

//                   {/* Step 1: Title */}
//                   {step === 1 && (
//                     <View style={styles.step}>
//                       <Text style={styles.stepLabel}>
//                         Question 1/{TOTAL_STEPS - 1}
//                       </Text>
//                       <Text style={styles.stepTitle}>Titre de l'annonce</Text>
//                       <Text style={styles.stepHint}>
//                         Attirez l'attention avec un bon titre
//                       </Text>
//                       <TextInput
//                         style={styles.input}
//                         placeholder="ex: Terrain 500m² à Nouakchott"
//                         value={values.title}
//                         onChangeText={(text) => setFieldValue("title", text)}
//                         maxLength={100}
//                         autoFocus
//                       />
//                       <Text style={styles.charCount}>
//                         {values.title.length}/100
//                       </Text>
//                     </View>
//                   )}

//                   {/* Step 2: Description (Optional) */}
//                   {step === 2 && (
//                     <View style={styles.step}>
//                       <View style={styles.stepHeader}>
//                         <Text style={styles.stepLabel}>
//                           Question 2/{TOTAL_STEPS - 1}
//                         </Text>
//                         <View style={styles.badge}>
//                           <Text style={styles.badgeText}>Optionnel</Text>
//                         </View>
//                       </View>
//                       <Text style={styles.stepTitle}>Description</Text>
//                       <Text style={styles.stepHint}>
//                         Décrivez les caractéristiques
//                       </Text>
//                       <TextInput
//                         style={[styles.input, styles.textArea]}
//                         placeholder="Terrain viabilisé, titre foncier..."
//                         value={values.description}
//                         onChangeText={(text) =>
//                           setFieldValue("description", text)
//                         }
//                         multiline
//                         numberOfLines={4}
//                         maxLength={500}
//                       />
//                       <Text style={styles.charCount}>
//                         {values.description.length}/500
//                       </Text>
//                     </View>
//                   )}

//                   {/* Step 3: Area (Optional) */}
//                   {step === 3 && (
//                     <View style={styles.step}>
//                       <View style={styles.stepHeader}>
//                         <Text style={styles.stepLabel}>
//                           Question 3/{TOTAL_STEPS - 1}
//                         </Text>
//                         <View style={styles.badge}>
//                           <Text style={styles.badgeText}>Optionnel</Text>
//                         </View>
//                       </View>
//                       <Text style={styles.stepTitle}>Superficie</Text>
//                       <TextInput
//                         style={styles.bigInput}
//                         placeholder="1000"
//                         value={values.area}
//                         onChangeText={(text) => setFieldValue("area", text)}
//                         keyboardType="numeric"
//                         autoFocus
//                       />
//                       <View style={styles.unitRow}>
//                         <TouchableOpacity
//                           style={[
//                             styles.unitBtn,
//                             values.areaUnit === "m²" && styles.unitBtnActive,
//                           ]}
//                           onPress={() => setFieldValue("areaUnit", "m²")}
//                         >
//                           <Text
//                             style={[
//                               styles.unitText,
//                               values.areaUnit === "m²" && styles.unitTextActive,
//                             ]}
//                           >
//                             m²
//                           </Text>
//                         </TouchableOpacity>
//                         <TouchableOpacity
//                           style={[
//                             styles.unitBtn,
//                             values.areaUnit === "hectare" &&
//                               styles.unitBtnActive,
//                           ]}
//                           onPress={() => setFieldValue("areaUnit", "hectare")}
//                         >
//                           <Text
//                             style={[
//                               styles.unitText,
//                               values.areaUnit === "hectare" &&
//                                 styles.unitTextActive,
//                             ]}
//                           >
//                             hectare
//                           </Text>
//                         </TouchableOpacity>
//                       </View>
//                     </View>
//                   )}

//                   {/* Step 4: Price */}
//                   {step === 4 && (
//                     <View style={styles.step}>
//                       <Text style={styles.stepLabel}>
//                         Question 4/{TOTAL_STEPS - 1}
//                       </Text>
//                       <Text style={styles.stepTitle}>Prix de vente</Text>
//                       <View style={styles.priceRow}>
//                         <TextInput
//                           style={styles.bigInput}
//                           placeholder="5000000"
//                           value={values.price}
//                           onChangeText={(text) => setFieldValue("price", text)}
//                           keyboardType="numeric"
//                           autoFocus
//                         />
//                         <Text style={styles.currency}>MRU</Text>
//                       </View>
//                       <View style={styles.notice}>
//                         <MaterialIcons
//                           name="lightbulb-outline"
//                           size={16}
//                           color="#FF8C00"
//                         />
//                         <Text style={styles.noticeText}>
//                           Recherchez des prix similaires dans votre zone
//                         </Text>
//                       </View>
//                     </View>
//                   )}

//                   {/* Step 5: Land Category */}
//                   {step === 5 && (
//                     <View style={styles.step}>
//                       <Text style={styles.stepLabel}>
//                         Question 5/{TOTAL_STEPS - 1}
//                       </Text>
//                       <Text style={styles.stepTitle}>Type de terrain</Text>
//                       {categoriesLoading ? (
//                         <ActivityIndicator
//                           size="large"
//                           color="#222"
//                           style={{ marginTop: 40 }}
//                         />
//                       ) : (
//                         <View style={styles.grid}>
//                           {landCategories?.map((cat) => (
//                             <TouchableOpacity
//                               key={cat.id}
//                               style={[
//                                 styles.card,
//                                 values.landCategoryId === cat.id &&
//                                   styles.cardActive,
//                               ]}
//                               onPress={() =>
//                                 setFieldValue("landCategoryId", cat.id)
//                               }
//                             >
//                               <PhosphorIcon
//                                 name={cat.icon}
//                                 size={24}
//                                 color={
//                                   values.landCategoryId === cat.id
//                                     ? "#222"
//                                     : "#717171"
//                                 }
//                               />
//                               <Text
//                                 style={[
//                                   styles.cardText,
//                                   values.landCategoryId === cat.id &&
//                                     styles.cardTextActive,
//                                 ]}
//                               >
//                                 {cat.name?.ar || cat.name?.fr}
//                               </Text>
//                             </TouchableOpacity>
//                           ))}
//                         </View>
//                       )}
//                     </View>
//                   )}

//                   {/* Step 6: City */}
//                   {step === 6 && (
//                     <View style={styles.step}>
//                       <Text style={styles.stepLabel}>
//                         Question 6/{TOTAL_STEPS - 1}
//                       </Text>
//                       <Text style={styles.stepTitle}>Ville</Text>
//                       {citiesLoading ? (
//                         <ActivityIndicator
//                           size="large"
//                           color="#222"
//                           style={{ marginTop: 40 }}
//                         />
//                       ) : (
//                         <View style={styles.list}>
//                           {cities?.map((city: City) => (
//                             <TouchableOpacity
//                               key={city.id}
//                               style={[
//                                 styles.listItem,
//                                 values.city_id === city.id &&
//                                   styles.listItemActive,
//                               ]}
//                               onPress={() => {
//                                 setFieldValue("city", city.name);
//                                 setFieldValue("city_id", city.id);
//                                 setFieldValue("zone", "");
//                                 setFieldValue("zone_id", 0);
//                                 setFieldValue("quartier", "");
//                                 setFieldValue("quartier_id", 0);
//                                 setSelectedCityId(city.id);
//                                 setSelectedZoneId(0);
//                               }}
//                             >
//                               <Text
//                                 style={[
//                                   styles.listText,
//                                   values.city_id === city.id &&
//                                     styles.listTextActive,
//                                 ]}
//                               >
//                                 {city.name}
//                               </Text>
//                               {values.city_id === city.id && (
//                                 <MaterialIcons
//                                   name="check"
//                                   size={20}
//                                   color="#222"
//                                 />
//                               )}
//                             </TouchableOpacity>
//                           ))}
//                         </View>
//                       )}
//                     </View>
//                   )}

//                   {/* Step 7: Address - Rue optional, Zone & Quartier from DB */}
//                   {step === 7 && (
//                     <View style={styles.step}>
//                       <Text style={styles.stepLabel}>
//                         Question 7/{TOTAL_STEPS - 1}
//                       </Text>
//                       <Text style={styles.stepTitle}>Adresse</Text>

//                       <View style={styles.form}>
//                         <View style={styles.stepHeader}>
//                           <Text style={styles.label}>Rue</Text>
//                           <View style={styles.badge}>
//                             <Text style={styles.badgeText}>Optionnel</Text>
//                           </View>
//                         </View>
//                         <TextInput
//                           style={styles.inputSmall}
//                           placeholder="123 Rue Principale"
//                           value={values.addressLine1}
//                           onChangeText={(text) =>
//                             setFieldValue("addressLine1", text)
//                           }
//                         />

//                         <Text style={[styles.label, { marginTop: 20 }]}>
//                           Région (Zone)
//                         </Text>
//                         {zonesLoading ? (
//                           <ActivityIndicator
//                             size="small"
//                             color="#222"
//                             style={{ marginVertical: 12 }}
//                           />
//                         ) : (
//                           <View style={styles.list}>
//                             <TouchableOpacity
//                               style={[
//                                 styles.listItem,
//                                 values.zone_id === 0 && styles.listItemActive,
//                               ]}
//                               onPress={() => {
//                                 setFieldValue("zone", "");
//                                 setFieldValue("zone_id", 0);
//                                 setFieldValue("quartier", "");
//                                 setFieldValue("quartier_id", 0);
//                                 setSelectedZoneId(0);
//                               }}
//                             >
//                               <Text
//                                 style={[
//                                   styles.listText,
//                                   values.zone_id === 0 && styles.listTextActive,
//                                 ]}
//                               >
//                                 Passer
//                               </Text>
//                               {values.zone_id === 0 && (
//                                 <MaterialIcons
//                                   name="check"
//                                   size={20}
//                                   color="#222"
//                                 />
//                               )}
//                             </TouchableOpacity>
//                             {zones?.map(
//                               (zone: {
//                                 id: number;
//                                 name: string;
//                                 name_ar: string;
//                               }) => (
//                                 <TouchableOpacity
//                                   key={zone.id}
//                                   style={[
//                                     styles.listItem,
//                                     values.zone_id === zone.id &&
//                                       styles.listItemActive,
//                                   ]}
//                                   onPress={() => {
//                                     setFieldValue("zone", zone.name);
//                                     setFieldValue("zone_id", zone.id);
//                                     setFieldValue("quartier", "");
//                                     setFieldValue("quartier_id", 0);
//                                     setSelectedZoneId(zone.id);
//                                   }}
//                                 >
//                                   <Text
//                                     style={[
//                                       styles.listText,
//                                       values.zone_id === zone.id &&
//                                         styles.listTextActive,
//                                     ]}
//                                   >
//                                     {zone.name}
//                                   </Text>
//                                   {values.zone_id === zone.id && (
//                                     <MaterialIcons
//                                       name="check"
//                                       size={20}
//                                       color="#222"
//                                     />
//                                   )}
//                                 </TouchableOpacity>
//                               )
//                             )}
//                           </View>
//                         )}

//                         <Text style={[styles.label, { marginTop: 20 }]}>
//                           Quartier
//                         </Text>
//                         {quartiersLoading ? (
//                           <ActivityIndicator
//                             size="small"
//                             color="#222"
//                             style={{ marginVertical: 12 }}
//                           />
//                         ) : (
//                           <View style={styles.list}>
//                             <TouchableOpacity
//                               style={[
//                                 styles.listItem,
//                                 values.quartier_id === 0 &&
//                                   styles.listItemActive,
//                               ]}
//                               onPress={() => {
//                                 setFieldValue("quartier", "");
//                                 setFieldValue("quartier_id", 0);
//                               }}
//                             >
//                               <Text
//                                 style={[
//                                   styles.listText,
//                                   values.quartier_id === 0 &&
//                                     styles.listTextActive,
//                                 ]}
//                               >
//                                 Passer
//                               </Text>
//                               {values.quartier_id === 0 && (
//                                 <MaterialIcons
//                                   name="check"
//                                   size={20}
//                                   color="#222"
//                                 />
//                               )}
//                             </TouchableOpacity>
//                             {quartiers?.map(
//                               (q: {
//                                 id: number;
//                                 name: string;
//                                 name_ar: string;
//                               }) => (
//                                 <TouchableOpacity
//                                   key={q.id}
//                                   style={[
//                                     styles.listItem,
//                                     values.quartier_id === q.id &&
//                                       styles.listItemActive,
//                                   ]}
//                                   onPress={() => {
//                                     setFieldValue("quartier", q.name);
//                                     setFieldValue("quartier_id", q.id);
//                                   }}
//                                 >
//                                   <Text
//                                     style={[
//                                       styles.listText,
//                                       values.quartier_id === q.id &&
//                                         styles.listTextActive,
//                                     ]}
//                                   >
//                                     {q.name}
//                                   </Text>
//                                   {values.quartier_id === q.id && (
//                                     <MaterialIcons
//                                       name="check"
//                                       size={20}
//                                       color="#222"
//                                     />
//                                   )}
//                                 </TouchableOpacity>
//                               )
//                             )}
//                           </View>
//                         )}
//                       </View>
//                     </View>
//                   )}

//                   {/* Step 8: Amenities (Optional) */}
//                   {step === 8 && (
//                     <View style={styles.step}>
//                       <View style={styles.stepHeader}>
//                         <Text style={styles.stepLabel}>
//                           Question 8/{TOTAL_STEPS - 1}
//                         </Text>
//                         <View style={styles.badge}>
//                           <Text style={styles.badgeText}>Optionnel</Text>
//                         </View>
//                       </View>
//                       <Text style={styles.stepTitle}>Équipements</Text>
//                       <Text style={styles.stepHint}>
//                         Sélectionnez les équipements disponibles
//                       </Text>
//                       {amenitiesLoading ? (
//                         <ActivityIndicator
//                           size="large"
//                           color="#222"
//                           style={{ marginTop: 40 }}
//                         />
//                       ) : amenities?.length > 0 ? (
//                         <View style={styles.chipGrid}>
//                           {amenities.map(
//                             (amenity: {
//                               id: number;
//                               icon?: string;
//                               name?: { en?: string; fr?: string; ar?: string };
//                             }) => {
//                               const selected = values.amenities.includes(
//                                 amenity.id
//                               );
//                               const label =
//                                 amenity.name?.ar ||
//                                 amenity.name?.fr ||
//                                 amenity.name?.en ||
//                                 "—";
//                               return (
//                                 <TouchableOpacity
//                                   key={amenity.id}
//                                   style={[
//                                     styles.chip,
//                                     selected && styles.chipActive,
//                                   ]}
//                                   onPress={() => {
//                                     const next = selected
//                                       ? values.amenities.filter(
//                                           (id: number) => id !== amenity.id
//                                         )
//                                       : [...values.amenities, amenity.id];
//                                     setFieldValue("amenities", next);
//                                   }}
//                                 >
//                                   <PhosphorIcon
//                                     name={(amenity.icon as any) || "Question"}
//                                     size={16}
//                                     color={selected ? "#222" : "#717171"}
//                                   />
//                                   <Text
//                                     style={[
//                                       styles.chipText,
//                                       selected && styles.chipTextActive,
//                                     ]}
//                                   >
//                                     {label}
//                                   </Text>
//                                 </TouchableOpacity>
//                               );
//                             }
//                           )}
//                         </View>
//                       ) : (
//                         <Text style={[styles.stepHint, { marginTop: 16 }]}>
//                           Aucun équipement disponible pour le moment.
//                         </Text>
//                       )}
//                     </View>
//                   )}

//                   {/* Step 9: House Rules */}
//                   {step === 9 && (
//                     <View style={styles.step}>
//                       <Text style={styles.stepLabel}>
//                         Question 9/{TOTAL_STEPS - 1}
//                       </Text>
//                       <Text style={styles.stepTitle}>Règles</Text>
//                       <View style={styles.list}>
//                         {standardHouseRules.map((rule) => (
//                           <TouchableOpacity
//                             key={rule.value}
//                             style={[
//                               styles.listItem,
//                               values.houseRules === rule.value &&
//                                 styles.listItemActive,
//                             ]}
//                             onPress={() =>
//                               setFieldValue("houseRules", rule.value)
//                             }
//                           >
//                             <Text
//                               style={[
//                                 styles.listText,
//                                 values.houseRules === rule.value &&
//                                   styles.listTextActive,
//                               ]}
//                             >
//                               {rule.label}
//                             </Text>
//                             {values.houseRules === rule.value && (
//                               <MaterialIcons
//                                 name="check"
//                                 size={20}
//                                 color="#222"
//                               />
//                             )}
//                           </TouchableOpacity>
//                         ))}
//                       </View>
//                     </View>
//                   )}

//                   {/* Step 10: Cancellation (Optional) */}
//                   {step === 10 && (
//                     <View style={styles.step}>
//                       <View style={styles.stepHeader}>
//                         <Text style={styles.stepLabel}>
//                           Question 10/{TOTAL_STEPS - 1}
//                         </Text>
//                         <View style={styles.badge}>
//                           <Text style={styles.badgeText}>Optionnel</Text>
//                         </View>
//                       </View>
//                       <Text style={styles.stepTitle}>
//                         Politique d'annulation
//                       </Text>
//                       <View style={styles.list}>
//                         {cancellationPolicies.map((policy) => (
//                           <TouchableOpacity
//                             key={policy.value}
//                             style={[
//                               styles.listItem,
//                               values.cancellationPolicy === policy.value &&
//                                 styles.listItemActive,
//                             ]}
//                             onPress={() =>
//                               setFieldValue("cancellationPolicy", policy.value)
//                             }
//                           >
//                             <Text
//                               style={[
//                                 styles.listText,
//                                 values.cancellationPolicy === policy.value &&
//                                   styles.listTextActive,
//                               ]}
//                             >
//                               {policy.label}
//                             </Text>
//                             {values.cancellationPolicy === policy.value && (
//                               <MaterialIcons
//                                 name="check"
//                                 size={20}
//                                 color="#222"
//                               />
//                             )}
//                           </TouchableOpacity>
//                         ))}
//                       </View>
//                     </View>
//                   )}

//                   {/* Step 11: Neighborhood */}
//                   {step === 11 && (
//                     <View style={styles.step}>
//                       <Text style={styles.stepLabel}>
//                         Question 11/{TOTAL_STEPS - 1}
//                       </Text>
//                       <Text style={styles.stepTitle}>Quartier</Text>
//                       <Text style={styles.stepHint}>Décrivez les environs</Text>
//                       <TextInput
//                         style={[styles.input, styles.textArea]}
//                         placeholder="Restaurants, transports, écoles..."
//                         value={values.neighborhoodDescription}
//                         onChangeText={(text) =>
//                           setFieldValue("neighborhoodDescription", text)
//                         }
//                         multiline
//                         numberOfLines={4}
//                         maxLength={300}
//                       />
//                       <Text style={styles.charCount}>
//                         {values.neighborhoodDescription.length}/300
//                       </Text>
//                     </View>
//                   )}

//                   {/* Step 12: Check-in/out */}
//                   {step === 12 && (
//                     <View style={styles.step}>
//                       <Text style={styles.stepLabel}>
//                         Question 12/{TOTAL_STEPS - 1}
//                       </Text>
//                       <Text style={styles.stepTitle}>Horaires de visite</Text>
//                       <View style={styles.form}>
//                         <Text style={styles.label}>Arrivée</Text>
//                         <View style={styles.timeGrid}>
//                           {[
//                             "09:00",
//                             "10:00",
//                             "11:00",
//                             "14:00",
//                             "15:00",
//                             "16:00",
//                           ].map((time) => (
//                             <TouchableOpacity
//                               key={time}
//                               style={[
//                                 styles.timeChip,
//                                 values.checkInTime === time &&
//                                   styles.timeChipActive,
//                               ]}
//                               onPress={() => setFieldValue("checkInTime", time)}
//                             >
//                               <Text
//                                 style={[
//                                   styles.timeText,
//                                   values.checkInTime === time &&
//                                     styles.timeTextActive,
//                                 ]}
//                               >
//                                 {time}
//                               </Text>
//                             </TouchableOpacity>
//                           ))}
//                         </View>
//                         <Text style={styles.label}>Départ</Text>
//                         <View style={styles.timeGrid}>
//                           {[
//                             "10:00",
//                             "11:00",
//                             "12:00",
//                             "15:00",
//                             "16:00",
//                             "17:00",
//                           ].map((time) => (
//                             <TouchableOpacity
//                               key={time}
//                               style={[
//                                 styles.timeChip,
//                                 values.checkOutTime === time &&
//                                   styles.timeChipActive,
//                               ]}
//                               onPress={() =>
//                                 setFieldValue("checkOutTime", time)
//                               }
//                             >
//                               <Text
//                                 style={[
//                                   styles.timeText,
//                                   values.checkOutTime === time &&
//                                     styles.timeTextActive,
//                                 ]}
//                               >
//                                 {time}
//                               </Text>
//                             </TouchableOpacity>
//                           ))}
//                         </View>
//                       </View>
//                     </View>
//                   )}

//                   {/* Step 13: Photos */}
//                   {step === 13 && (
//                     <View style={styles.step}>
//                       <View style={styles.stepHeader}>
//                         <Text style={styles.stepLabel}>
//                           Question 13/{TOTAL_STEPS - 1}
//                         </Text>
//                         <View style={styles.badge}>
//                           <Text style={styles.badgeText}>Optionnel</Text>
//                         </View>
//                       </View>
//                       <Text style={styles.stepTitle}>Photos</Text>
//                       <Text style={styles.stepHint}>
//                         5x plus de vues avec photos
//                       </Text>
//                       {values.images.length === 0 ? (
//                         <TouchableOpacity
//                           style={styles.uploadBtn}
//                           onPress={async () => {
//                             await pickImage(
//                               values.images,
//                               "images",
//                               (field: string, vals: any) =>
//                                 setFieldValue(field, vals)
//                             );
//                           }}
//                         >
//                           <MaterialIcons
//                             name="add-photo-alternate"
//                             size={40}
//                             color="#B0B0B0"
//                           />
//                           <Text style={styles.uploadText}>
//                             Ajouter des photos
//                           </Text>
//                         </TouchableOpacity>
//                       ) : (
//                         <>
//                           <View style={styles.photoGrid}>
//                             {values.images.map((img, idx) => (
//                               <View key={idx} style={styles.photo}>
//                                 <Image
//                                   source={{ uri: img }}
//                                   style={styles.photoImg}
//                                 />
//                                 <TouchableOpacity
//                                   style={styles.photoRemove}
//                                   onPress={() => {
//                                     setFieldValue(
//                                       "images",
//                                       values.images.filter((_, i) => i !== idx)
//                                     );
//                                   }}
//                                 >
//                                   <MaterialIcons
//                                     name="close"
//                                     size={12}
//                                     color="#FFF"
//                                   />
//                                 </TouchableOpacity>
//                                 {idx === 0 && (
//                                   <View style={styles.mainTag}>
//                                     <Text style={styles.mainTagText}>
//                                       Principal
//                                     </Text>
//                                   </View>
//                                 )}
//                               </View>
//                             ))}
//                             {values.images.length < 10 && (
//                               <TouchableOpacity
//                                 style={styles.photoAdd}
//                                 onPress={async () => {
//                                   await pickImage(
//                                     values.images,
//                                     "images",
//                                     (field: string, vals: any) =>
//                                       setFieldValue(field, vals)
//                                   );
//                                 }}
//                               >
//                                 <MaterialIcons
//                                   name="add"
//                                   size={24}
//                                   color="#717171"
//                                 />
//                               </TouchableOpacity>
//                             )}
//                           </View>
//                           <View style={styles.photoHint}>
//                             <MaterialIcons
//                               name="info-outline"
//                               size={14}
//                               color="#717171"
//                             />
//                             <Text style={styles.photoHintText}>
//                               {values.images.length}/10
//                             </Text>
//                           </View>
//                         </>
//                       )}
//                     </View>
//                   )}

//                   {/* Step 14: Review */}
//                   {step === 14 && (
//                     <View style={styles.step}>
//                       <Text style={styles.stepLabel}>Aperçu</Text>
//                       <Text style={styles.stepTitle}>Vérifiez tout</Text>
//                       <View style={styles.review}>
//                         <View style={styles.reviewRow}>
//                           <Text style={styles.reviewLabel}>Titre</Text>
//                           <Text style={styles.reviewValue}>{values.title}</Text>
//                         </View>
//                         <View style={styles.reviewRow}>
//                           <Text style={styles.reviewLabel}>Superficie</Text>
//                           <Text style={styles.reviewValue}>
//                             {values.area} {values.areaUnit}
//                           </Text>
//                         </View>
//                         <View style={styles.reviewRow}>
//                           <Text style={styles.reviewLabel}>Prix</Text>
//                           <Text style={styles.reviewPrice}>
//                             {values.price} MRU
//                           </Text>
//                         </View>
//                         <View style={styles.reviewRow}>
//                           <Text style={styles.reviewLabel}>Ville</Text>
//                           <Text style={styles.reviewValue}>{values.city}</Text>
//                         </View>
//                         {values.images.length > 0 && (
//                           <View style={styles.reviewRow}>
//                             <Text style={styles.reviewLabel}>Photos</Text>
//                             <Text style={styles.reviewValue}>
//                               {values.images.length}
//                             </Text>
//                           </View>
//                         )}
//                       </View>
//                       <View style={styles.notice}>
//                         <MaterialIcons
//                           name="check-circle"
//                           size={16}
//                           color="#4CAF50"
//                         />
//                         <Text style={styles.noticeText}>Prêt à publier</Text>
//                       </View>
//                     </View>
//                   )}
//                 </Animated.View>
//               </KeyboardAwareScrollView>

//               {/* Bottom Navigation - Stays above keyboard */}
//               <View style={styles.nav}>
//                 {step > 0 && (
//                   <TouchableOpacity
//                     style={styles.btnBack}
//                     onPress={() => {
//                       setStep(step - 1);
//                       fadeAnim.setValue(0);
//                     }}
//                   >
//                     <MaterialIcons name="arrow-back" size={18} color="#222" />
//                     <Text style={styles.btnBackText}>Retour</Text>
//                   </TouchableOpacity>
//                 )}
//                 <TouchableOpacity
//                   style={[
//                     styles.btnNext,
//                     !canContinue() && styles.btnNextDisabled,
//                     step === 0 && styles.btnFull,
//                   ]}
//                   disabled={!canContinue() || isSubmitting}
//                   onPress={() => {
//                     if (step < TOTAL_STEPS - 1) {
//                       setStep(step + 1);
//                       fadeAnim.setValue(0);
//                     } else {
//                       handleSubmit();
//                     }
//                   }}
//                 >
//                   {isSubmitting ? (
//                     <ActivityIndicator color="#FFF" />
//                   ) : (
//                     <>
//                       <Text style={styles.btnNextText}>
//                         {step === 0
//                           ? "Commencer"
//                           : step === TOTAL_STEPS - 1
//                           ? "Publier"
//                           : "Continuer"}
//                       </Text>
//                       <MaterialIcons
//                         name="arrow-forward"
//                         size={18}
//                         color="#FFF"
//                       />
//                     </>
//                   )}
//                 </TouchableOpacity>
//               </View>

//               {/* Success Toast */}
//               {showSuccessToast && (
//                 <Animated.View
//                   style={[
//                     styles.toast,
//                     {
//                       transform: [
//                         {
//                           translateY: toastAnimation.interpolate({
//                             inputRange: [0, 1],
//                             outputRange: [200, 0],
//                           }),
//                         },
//                       ],
//                       opacity: toastAnimation,
//                     },
//                   ]}
//                 >
//                   <MaterialIcons
//                     name="check-circle"
//                     size={40}
//                     color="#4CAF50"
//                   />
//                   <Text style={styles.toastTitle}>Publié !</Text>
//                   <Text style={styles.toastMsg}>
//                     Votre annonce est en ligne
//                   </Text>
//                   <TouchableOpacity
//                     style={styles.toastBtn}
//                     onPress={() => {
//                       hideToast();
//                       navigation.goBack();
//                     }}
//                   >
//                     <Text style={styles.toastBtnText}>Voir l'annonce</Text>
//                   </TouchableOpacity>
//                 </Animated.View>
//               )}
//             </>
//           );
//         }}
//       </Formik>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#FFF" },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingTop: 12,
//     paddingBottom: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F0F0F0",
//   },
//   closeButton: {
//     width: 36,
//     height: 36,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   progressContainer: { flex: 1, marginLeft: 12 },
//   progressBar: { height: 2, backgroundColor: "#F0F0F0", borderRadius: 1 },
//   progressFill: { height: "100%", backgroundColor: "#222", borderRadius: 1 },
//   content: { flex: 1 },
//   stepContainer: { padding: 20, minHeight: 400 },

//   welcomeStep: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingVertical: 60,
//   },
//   welcomeTitle: {
//     fontSize: 28,
//     fontWeight: "700",
//     color: "#222",
//     marginTop: 20,
//     marginBottom: 8,
//   },
//   welcomeSubtitle: {
//     fontSize: 16,
//     color: "#717171",
//     marginBottom: 40,
//     textAlign: "center",
//   },
//   infoBox: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#F8F8F8",
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     marginBottom: 12,
//     width: "100%",
//     maxWidth: 300,
//   },
//   infoText: { fontSize: 15, color: "#222", marginLeft: 12 },

//   step: { flex: 1 },
//   stepHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   stepLabel: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: "#717171",
//     textTransform: "uppercase",
//     letterSpacing: 0.5,
//     marginBottom: 12,
//   },
//   stepTitle: {
//     fontSize: 28,
//     fontWeight: "700",
//     color: "#222",
//     marginBottom: 8,
//   },
//   stepHint: { fontSize: 16, color: "#717171", marginBottom: 24 },
//   badge: {
//     paddingVertical: 4,
//     paddingHorizontal: 10,
//     backgroundColor: "#F0F0F0",
//     borderRadius: 12,
//   },
//   badgeText: { fontSize: 11, fontWeight: "600", color: "#717171" },

//   input: {
//     fontSize: 20,
//     fontWeight: "600",
//     color: "#222",
//     borderBottomWidth: 2,
//     borderBottomColor: "#E0E0E0",
//     paddingVertical: 12,
//     marginBottom: 8,
//   },
//   textArea: { minHeight: 100, textAlignVertical: "top" },
//   charCount: { fontSize: 12, color: "#B0B0B0", textAlign: "right" },

//   bigInput: {
//     fontSize: 40,
//     fontWeight: "700",
//     color: "#222",
//     borderBottomWidth: 2,
//     borderBottomColor: "#E0E0E0",
//     paddingVertical: 12,
//     marginBottom: 20,
//   },
//   unitRow: { flexDirection: "row", gap: 12 },
//   unitBtn: {
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 20,
//     borderWidth: 2,
//     borderColor: "#E0E0E0",
//     backgroundColor: "#FFF",
//   },
//   unitBtnActive: { borderColor: "#222", backgroundColor: "#F7F7F7" },
//   unitText: { fontSize: 15, fontWeight: "600", color: "#717171" },
//   unitTextActive: { color: "#222" },

//   priceRow: {
//     flexDirection: "row",
//     alignItems: "flex-end",
//     borderBottomWidth: 2,
//     borderBottomColor: "#E0E0E0",
//     paddingBottom: 12,
//     marginBottom: 20,
//   },
//   currency: {
//     fontSize: 20,
//     fontWeight: "600",
//     color: "#717171",
//     marginLeft: 12,
//     marginBottom: 4,
//   },

//   notice: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#FFF8E1",
//     padding: 12,
//     borderRadius: 8,
//     borderLeftWidth: 3,
//     borderLeftColor: "#FF8C00",
//     gap: 8,
//     marginTop: 20,
//   },
//   noticeText: { flex: 1, fontSize: 13, color: "#222", lineHeight: 18 },

//   grid: { gap: 12, marginTop: 20 },
//   card: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 2,
//     borderColor: "#E0E0E0",
//     backgroundColor: "#FFF",
//   },
//   cardActive: { borderColor: "#222", backgroundColor: "#F7F7F7" },
//   cardText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#717171",
//     marginLeft: 12,
//   },
//   cardTextActive: { color: "#222" },

//   list: { gap: 10, marginTop: 20 },
//   listItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 2,
//     borderColor: "#E0E0E0",
//     backgroundColor: "#FFF",
//   },
//   listItemActive: { borderColor: "#222", backgroundColor: "#F7F7F7" },
//   listText: { fontSize: 15, color: "#717171", flex: 1 },
//   listTextActive: { color: "#222", fontWeight: "600" },

//   form: { gap: 16, marginTop: 20 },
//   label: { fontSize: 13, fontWeight: "600", color: "#222", marginBottom: 4 },
//   inputSmall: {
//     fontSize: 16,
//     color: "#222",
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//     borderRadius: 8,
//     padding: 12,
//     backgroundColor: "#FAFAFA",
//   },

//   chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 20 },
//   chip: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 20,
//     borderWidth: 2,
//     borderColor: "#E0E0E0",
//     backgroundColor: "#FFF",
//     gap: 6,
//   },
//   chipActive: { borderColor: "#222", backgroundColor: "#F7F7F7" },
//   chipText: { fontSize: 14, color: "#717171" },
//   chipTextActive: { color: "#222", fontWeight: "600" },

//   timeGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 8,
//     marginBottom: 16,
//   },
//   timeChip: {
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 20,
//     borderWidth: 2,
//     borderColor: "#E0E0E0",
//     backgroundColor: "#FFF",
//   },
//   timeChipActive: { borderColor: "#222", backgroundColor: "#F7F7F7" },
//   timeText: { fontSize: 14, fontWeight: "600", color: "#717171" },
//   timeTextActive: { color: "#222" },

//   uploadBtn: {
//     height: 180,
//     borderRadius: 12,
//     borderWidth: 2,
//     borderStyle: "dashed",
//     borderColor: "#D0D0D0",
//     backgroundColor: "#FAFAFA",
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 20,
//   },
//   uploadText: {
//     fontSize: 15,
//     fontWeight: "600",
//     color: "#717171",
//     marginTop: 12,
//   },

//   photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 20 },
//   photo: {
//     width: "48%",
//     aspectRatio: 1,
//     borderRadius: 10,
//     overflow: "hidden",
//     position: "relative",
//   },
//   photoImg: { width: "100%", height: "100%" },
//   photoRemove: {
//     position: "absolute",
//     top: 6,
//     right: 6,
//     width: 22,
//     height: 22,
//     borderRadius: 11,
//     backgroundColor: "rgba(0,0,0,0.7)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   mainTag: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: "rgba(0,0,0,0.7)",
//     paddingVertical: 4,
//   },
//   mainTagText: {
//     color: "#FFF",
//     fontSize: 11,
//     fontWeight: "600",
//     textAlign: "center",
//   },
//   photoAdd: {
//     width: "48%",
//     aspectRatio: 1,
//     borderRadius: 10,
//     borderWidth: 2,
//     borderStyle: "dashed",
//     borderColor: "#D0D0D0",
//     backgroundColor: "#FAFAFA",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   photoHint: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//     marginTop: 12,
//   },
//   photoHintText: { fontSize: 12, color: "#717171" },

//   review: {
//     backgroundColor: "#F8F8F8",
//     borderRadius: 12,
//     padding: 16,
//     gap: 12,
//     marginTop: 20,
//   },
//   reviewRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   reviewLabel: { fontSize: 14, color: "#717171" },
//   reviewValue: { fontSize: 15, fontWeight: "600", color: "#222" },
//   reviewPrice: { fontSize: 18, fontWeight: "700", color: "#222" },

//   nav: {
//     flexDirection: "row",
//     padding: 16,
//     paddingBottom: 24,
//     backgroundColor: "#FFF",
//     borderTopWidth: 1,
//     borderTopColor: "#F0F0F0",
//     gap: 12,
//   },
//   btnBack: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 14,
//     paddingHorizontal: 20,
//     borderRadius: 10,
//     borderWidth: 2,
//     borderColor: "#E0E0E0",
//     gap: 6,
//   },
//   btnBackText: { fontSize: 15, fontWeight: "600", color: "#222" },
//   btnNext: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 14,
//     borderRadius: 10,
//     backgroundColor: "#222",
//     gap: 6,
//   },
//   btnFull: { flex: 1 },
//   btnNextText: { fontSize: 15, fontWeight: "600", color: "#FFF" },
//   btnNextDisabled: { backgroundColor: "#E0E0E0" },

//   toast: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: "#FFF",
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     padding: 28,
//     paddingBottom: 40,
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: -4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 10,
//     elevation: 20,
//   },
//   toastTitle: {
//     fontSize: 24,
//     fontWeight: "700",
//     color: "#222",
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   toastMsg: { fontSize: 15, color: "#717171", marginBottom: 24 },
//   toastBtn: {
//     width: "100%",
//     paddingVertical: 14,
//     borderRadius: 10,
//     backgroundColor: "#4CAF50",
//     alignItems: "center",
//   },
//   toastBtnText: { fontSize: 15, fontWeight: "600", color: "#FFF" },
// });

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { Formik } from "formik";
import * as yup from "yup";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { uploadImagesToCloudinary } from "../utils/pickImage";
import { PhosphorIcon } from "./PhosphorIcon";
import {
  usePropertyCategories,
  useAmenities,
} from "../hooks/queries/useCategories";
import { useCitiesQuery, type City } from "../hooks/queries/useCitiesQuery";
import {
  useCountriesQuery,
  getCountryDisplayName,
} from "../hooks/queries/useCountriesQuery";
import { useZonesByCity } from "../hooks/queries/useZonesQuery";
import { useQuartiersByZone } from "../hooks/queries/useQuartiersQuery";
import { useUser } from "../hooks/useUser";
import { useQueryClient } from "@tanstack/react-query";
import { endpoints } from "../constants";
import { getLocalizedCategoryName } from "../utils/localizedCategoryName";
import { api } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { pickMultipleImagesNative } from "../utils/nativePhotoPicker";
import { AddWithAiFlow } from "./listing-ai/AddWithAiFlow";
import { ListingStartMethodPicker } from "./listing-ai/ListingStartMethodPicker";
import { applyRentListingDraft } from "../utils/listingAiApply";
import type { ListingAiDraft } from "../types/listingAi";
import { RentLocationPicker } from "./rent-listing/RentLocationPicker";
import {
  RentListingVideoPicker,
  RentListingVideoUploadOverlay,
  type RentListingVideoDraft,
} from "./rent-listing/RentListingVideoPicker";
import { uploadRentVideoPipeline } from "../services/videoUploadPipeline";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface LandListing {
  title: string;
  description: string;
  area: string;
  areaUnit: "m²" | "hectare";
  price: string;
  cleaningFee: string;
  serviceFee: string;
  currency: "MRU";
  landCategoryId: number;
  city: string;
  city_id: number;
  zone: string;
  zone_id: number;
  quartier: string;
  quartier_id: number;
  amenities: number[];
  images: string[];
  hasMap: boolean;
  lat: string;
  lng: string;
  addressLine1: string;
  state: string;
  country: string;
  country_id: number;
  zip: string;
  neighborhoodDescription: string;
  houseRules: string;
  cancellationPolicy: string;
  checkInTime: string;
  checkOutTime: string;
  bookingMode: "instant" | "manual";
  /** Optional; serveur uniquement — jamais affiché aux voyageurs. */
  hostPrivateNote: string;
}

export const AddPropertySection = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const navigation = useNavigation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [aiFlowVisible, setAiFlowVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listingVideo, setListingVideo] = useState<RentListingVideoDraft | null>(
    null,
  );
  const [videoUploadPercent, setVideoUploadPercent] = useState(0);
  const [videoUploadPhase, setVideoUploadPhase] = useState<
    "idle" | "uploading" | "processing" | "done"
  >("idle");

  const aiApplyRef = useRef<(draft: ListingAiDraft) => void>(() => {});

  // Fetch data from backend
  const { data: landCategories = [], isLoading: categoriesLoading } =
    usePropertyCategories();
  const { data: amenitiesData = [], isLoading: amenitiesLoading } =
    useAmenities();
  const { data: countries = [], isLoading: countriesLoading } =
    useCountriesQuery();
  const [selectedCountryId, setSelectedCountryId] = useState(0);
  const { data: cities = [], isLoading: citiesLoading } = useCitiesQuery(undefined);

  const [selectedCityId, setSelectedCityId] = useState(0);
  const [selectedZoneId, setSelectedZoneId] = useState(0);

  const { data: zones = [], isLoading: zonesLoading } =
    useZonesByCity(selectedCityId);
  const { data: quartiers = [], isLoading: quartiersLoading } =
    useQuartiersByZone(selectedZoneId);

  const amenities = Array.isArray(amenitiesData) ? amenitiesData : [];

  const defaultCountry = useMemo(
    () => countries.find((c) => c.code === "MR") ?? countries[0],
    [countries],
  );

  useEffect(() => {
    if (defaultCountry?.id && selectedCountryId === 0) {
      setSelectedCountryId(defaultCountry.id);
    }
  }, [defaultCountry?.id, selectedCountryId]);


  const getLocalizedName = (item: any): string =>
    getLocalizedCategoryName(item, currentLanguage || "en");

  const standardHouseRules = useMemo(
    () => [
      {
        label: t("listing.rent.houseRules.quiet_hours", {
          defaultValue: "Respect neighbors (quiet after 10pm)",
        }),
        value: "quiet_hours",
      },
      {
        label: t("listing.rent.houseRules.no_smoking", {
          defaultValue: "No smoking",
        }),
        value: "no_smoking",
      },
      {
        label: t("listing.rent.houseRules.no_pets", {
          defaultValue: "No pets",
        }),
        value: "no_pets",
      },
      {
        label: t("listing.rent.houseRules.no_parties", {
          defaultValue: "No parties or events",
        }),
        value: "no_parties",
      },
    ],
    [t],
  );

  const cancellationPolicies = useMemo(
    () => [
      {
        label: t("listing.rent.cancellation.flexible", {
          defaultValue: "Flexible — full refund up to 24h before",
        }),
        value: "flexible",
      },
      {
        label: t("listing.rent.cancellation.moderate", {
          defaultValue: "Moderate — 50% refund up to 5 days before",
        }),
        value: "moderate",
      },
      {
        label: t("listing.rent.cancellation.strict", {
          defaultValue: "Strict — non-refundable",
        }),
        value: "strict",
      },
    ],
    [t],
  );

  const onSubmit = async (values: LandListing) => {
    if (!user?.accessToken || !user?.ID) {
      Alert.alert(
        t("listing.rent.alerts.errorTitle", { defaultValue: "Error" }),
        t("listing.rent.alerts.mustLogin", {
          defaultValue: "You must be logged in to publish a listing.",
        }),
      );
      return;
    }
    setIsSubmitting(true);
    try {
      console.log("🖼️ Uploading images...");
      const uploadedImages = await uploadImagesToCloudinary(
        values.images || [],
        user.accessToken,
      );
      console.log("✅ Images uploaded:", uploadedImages.length);

      const num = (v: string | number | undefined, fallback: number) => {
        if (v === undefined || v === null) return fallback;
        const n = typeof v === "number" ? v : parseFloat(String(v));
        return Number.isFinite(n) ? n : fallback;
      };

      const payload = {
        hostID: user.ID,
        title: (values.title || "").trim() || "Sans titre",
        description: (values.description || "").trim(),
        propertyType: "entire_place",
        addressLine1: (values.addressLine1 || values.city || "").trim() || (values.city || "Adresse"),
        addressLine2: "",
        city: (values.city || "").trim() || "Nouakchott",
        state: (values.state || "").trim() || "Nouakchott",
        zip: (values.zip || "").trim() || "00000",
        country: (values.country || "").trim() || "Mauritania",
        ...(values.country_id > 0 ? { country_id: values.country_id } : {}),
        ...(values.city_id > 0 ? { city_id: values.city_id } : {}),
        ...(values.zone_id > 0 ? { zone_id: values.zone_id } : {}),
        ...(values.quartier_id > 0 ? { quartier_id: values.quartier_id } : {}),
        lat: num(values.lat, 18.0463),
        lng: num(values.lng, -15.9654),
        capacity: 1,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
        nightlyPrice: num(values.price, 0),
        cleaningFee: num(values.cleaningFee, 0),
        serviceFee: num(values.serviceFee, 0),
        currency: values.currency || "MRU",
        amenities: (values.amenities || []).map((id) => String(id)),
        houseRules: values.houseRules || "",
        cancellationPolicy: values.cancellationPolicy || "flexible",
        images: uploadedImages,
        isActive: true,
        bookingMode: values.bookingMode || "manual",
        neighborhoodDescription: values.neighborhoodDescription || "",
        nearbyAttractions: [],
        checkInTime: values.checkInTime || "15:00",
        checkOutTime: values.checkOutTime || "11:00",
        propertyCategoryId: values.landCategoryId || 0,
        ...(values.hostPrivateNote?.trim()
          ? { hostPrivateNote: values.hostPrivateNote.trim() }
          : {}),
      };

      const response = await api.post("/property", payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 60000,
      });

      if (response.status >= 200 && response.status < 300) {
        const created = response.data as { ID?: number; id?: number };
        const propertyId = Number(created?.ID ?? created?.id ?? 0);

        if (propertyId > 0 && listingVideo?.localUri) {
          setVideoUploadPhase("uploading");
          try {
            await uploadRentVideoPipeline(
              {
                localVideoUri: listingVideo.localUri,
                mime: listingVideo.mime,
                propertyID: propertyId,
                durationSec: listingVideo.durationSec || undefined,
                thumbnailUri: listingVideo.thumbUri || undefined,
                waitForHls: false,
              },
              {
                accessToken: user.accessToken,
                onProgress: (p) => {
                  setVideoUploadPercent(p.percent);
                  if (p.phase === "processing") {
                    setVideoUploadPhase("processing");
                  }
                },
              },
            );
            setVideoUploadPhase("done");
            queryClient.invalidateQueries({ queryKey: ["my-videos"] });
            queryClient.invalidateQueries({ queryKey: ["cursorVideoFeed"] });
          } catch (videoErr) {
            console.error("Listing video upload failed:", videoErr);
            Alert.alert(
              t("listing.rent.alerts.errorTitle", { defaultValue: "Error" }),
              t("listing.rent.alerts.videoUploadFailed", {
                defaultValue:
                  "Your listing was published, but the video could not be uploaded. You can add it from Edit listing → Video.",
              }),
            );
          } finally {
            setVideoUploadPhase("idle");
            setVideoUploadPercent(0);
          }
        }

        queryClient.invalidateQueries({ queryKey: ["myProperties"] });
        Alert.alert(
          t("listing.rent.alerts.successTitle", { defaultValue: "Success" }),
          t("listing.rent.alerts.published", {
            defaultValue: "Your listing was published successfully!",
          }),
          [
            {
              text: t("listing.common.ok", { defaultValue: "OK" }),
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        throw new Error(response.data?.error || "Échec de la publication");
      }
    } catch (error: any) {
      const res = error?.response;
      console.error("❌ Create property error details:", {
        message: error?.message,
        status: res?.status,
        statusText: res?.statusText,
        data: res?.data,
        url: res?.config?.url ?? res?.config?.baseURL,
        method: res?.config?.method,
      });
      if (res?.data) console.log("❌ Server response body:", JSON.stringify(res.data, null, 2));
      if (error?.request && !res) console.log("❌ No response received (network error?). Request:", error.request);
      console.error("❌ Full error object:", error);

      const data = res?.data;
      const msg =
        (typeof data?.error === "string" ? data.error : null) ||
        (data?.detail ? String(data.detail) : null) ||
        error?.message ||
        t("listing.rent.alerts.publishFailed", {
          defaultValue:
            "Could not publish your listing. Check your connection and try again.",
        });
      Alert.alert(t("listing.rent.alerts.errorTitle", { defaultValue: "Error" }), msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validationSchema = yup.object().shape({
    title: yup.string().required(t("listing.common.required", { defaultValue: "Required" })),
    area: yup.string(),
    price: yup.string().required(t("listing.common.required", { defaultValue: "Required" })),
    city: yup.string(),
    landCategoryId: yup.number().min(1, t("listing.common.required", { defaultValue: "Required" })),
    addressLine1: yup.string(),
    state: yup.string(),
    amenities: yup.array().of(yup.number()),
    houseRules: yup.string(),
    checkInTime: yup.string(),
    checkOutTime: yup.string(),
    bookingMode: yup.string().oneOf(["instant", "manual"]),
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Formik
        enableReinitialize
        initialValues={{
          title: "",
          description: "",
          area: "",
          areaUnit: "m²" as "m²" | "hectare",
          price: "",
          cleaningFee: "",
          serviceFee: "",
          currency: "MRU" as "MRU",
          landCategoryId: 0,
          city: "",
          city_id: 0,
          zone: "",
          zone_id: 0,
          quartier: "",
          quartier_id: 0,
          amenities: [] as number[],
          images: [] as string[],
          hasMap: false,
          lat: "",
          lng: "",
          addressLine1: "",
          state: "",
          country: defaultCountry
            ? getCountryDisplayName(defaultCountry, currentLanguage || "en")
            : "Mauritania",
          country_id: defaultCountry?.id ?? 0,
          zip: "",
          neighborhoodDescription: "",
          houseRules: "",
          cancellationPolicy: "",
          checkInTime: "",
          checkOutTime: "",
          bookingMode: "instant" as "instant" | "manual",
          hostPrivateNote: "",
        }}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ values, handleSubmit, setFieldValue }) => {
          const tr = (key: string, fallback: string, vars?: Record<string, unknown>) =>
            t(key, { defaultValue: fallback, ...(vars as object) });

          const pickPhotos = async () => {
            const result = await pickMultipleImagesNative({
              allowsEditing: false,
              base64: true,
              quality: 0.8,
            });
            if (result.canceled || !result.assets || result.assets.length === 0) return;
            const next = result.assets
              .map((asset: any) =>
                asset?.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset?.uri,
              )
              .filter((x: string | undefined) => !!x) as string[];
            if (!next.length) return;
            setFieldValue("images", [...values.images, ...next].slice(0, 10));
          };

          const buildRentDescriptionTemplates = () => {
            const v = values;
            const cat = landCategories.find((c: any) => c.id === v.landCategoryId);
            const typeName = cat ? getLocalizedName(cat) : "";
            const cityName =
              v.city || cities.find((c: City) => c.id === v.city_id)?.name || "";
            const place = [v.zone, cityName].filter(Boolean).join(", ");
            const areaStr = v.area?.trim() ? `${v.area} ${v.areaUnit}` : "";
            const priceStr = v.price?.trim() ? `${v.price} MRU` : "";
            const line1 = [v.title.trim(), typeName].filter(Boolean).join(" • ");
            const bullets = [
              place
                ? tr("listing.common.template.locationLine", "Location: {{place}}", {
                    place,
                  })
                : "",
              areaStr
                ? tr("listing.common.template.areaLine", "Area: {{area}}", {
                    area: areaStr,
                  })
                : "",
              priceStr
                ? tr("listing.common.template.priceLine", "Price: {{price}}", {
                    price: priceStr,
                  })
                : "",
            ].filter(Boolean);
            const intro = place
              ? tr("listing.rent.template.rentIntro", "Comfortable rental in {{place}}.", {
                  place,
                })
              : "";
            return [
              {
                id: "short",
                title: tr("listing.common.template.shortTitle", "Short", {}),
                text: [line1, bullets.slice(0, 2).join("\n")].filter(Boolean).join("\n"),
              },
              {
                id: "family",
                title: tr("listing.common.template.familyTitle", "Family-friendly", {}),
                text: [
                  line1,
                  intro,
                  tr(
                    "listing.rent.template.familyBody",
                    "Calm space, well suited for families or longer stays.",
                    {},
                  ),
                  bullets.join("\n"),
                ]
                  .filter(Boolean)
                  .join("\n"),
              },
              {
                id: "invest",
                title: tr("listing.common.template.investTitle", "Investment", {}),
                text: [
                  line1,
                  tr(
                    "listing.rent.template.investBody",
                    "Good visibility for tenants — practical layout and location.",
                    {},
                  ),
                  bullets.join("\n"),
                ]
                  .filter(Boolean)
                  .join("\n"),
              },
            ].filter((x) => x.text.trim().length > 0);
          };

          const buildNeighborhoodTemplates = () => {
            const v = values;
            const cityName =
              v.city || cities.find((c: City) => c.id === v.city_id)?.name || "";
            const head = [cityName, v.zone, v.quartier].filter(Boolean).join(", ");
            return [
              {
                id: "shops",
                label: tr("listing.rent.neighborhoodChips.shops", "Shops & services", {}),
                text: [
                  head,
                  tr(
                    "listing.rent.neighborhoodTemplate.shops",
                    "Shops and daily needs nearby.",
                    {},
                  ),
                ]
                  .filter(Boolean)
                  .join("\n\n"),
              },
              {
                id: "transport",
                label: tr("listing.rent.neighborhoodChips.transport", "Getting around", {}),
                text: [
                  head,
                  tr(
                    "listing.rent.neighborhoodTemplate.transport",
                    "Public transport and main roads within easy reach.",
                    {},
                  ),
                ]
                  .filter(Boolean)
                  .join("\n\n"),
              },
              {
                id: "calm",
                label: tr("listing.rent.neighborhoodChips.calm", "Peaceful area", {}),
                text: [
                  head,
                  tr(
                    "listing.rent.neighborhoodTemplate.calm",
                    "Quiet neighborhood, suitable for rest and work from home.",
                    {},
                  ),
                ]
                  .filter(Boolean)
                  .join("\n\n"),
              },
            ].filter((x) => x.text.trim().length > 0);
          };

          const STEPS = [
            {
              id: "intro",
              title: tr("listing.rent.steps.intro.title", "Rent out your place", {}),
              subtitle: tr(
                "listing.rent.steps.intro.subtitle",
                "A simple flow in a few steps",
                {},
              ),
              validation: () => true,
              render: () => (
                <View style={styles.introContainer}>
                  <ListingStartMethodPicker
                    headline={tr(
                      "listing.rent.steps.intro.headline",
                      "Ready to rent?",
                      {},
                    )}
                    body={tr(
                      "listing.rent.steps.intro.body",
                      "Creating a rental listing only takes a few minutes.",
                      {},
                    )}
                    onAiPress={() => setAiFlowVisible(true)}
                    onManualPress={() => setCurrentStep(1)}
                  />
                </View>
              ),
            },
            {
              id: "title",
              title: tr("listing.rent.steps.title.title", "Give your listing a title", {}),
              subtitle: tr("listing.rent.steps.title.subtitle", "Required — clear and appealing", {}),
              validation: () => values.title.trim().length >= 10,
              render: () => (
                <View style={styles.focusContainer}>
                  <TextInput
                    style={styles.bigInput}
                    value={values.title}
                    onChangeText={(text) => setFieldValue("title", text)}
                    placeholder={tr(
                      "listing.rent.steps.title.placeholder",
                      "e.g., 2-bedroom apartment downtown",
                      {},
                    )}
                    placeholderTextColor="#B0B0B0"
                    autoFocus
                    maxLength={100}
                  />
                  <Text style={styles.charCount}>
                    {values.title.length}/100
                  </Text>
                  <Text style={styles.hint}>
                    {tr("listing.rent.steps.title.minChars", "At least 10 characters", {})}
                  </Text>
                </View>
              ),
            },
            {
              id: "propertyCategory",
              title: tr("listing.rent.steps.propertyCategory.title", "Property type", {}),
              subtitle: tr(
                "listing.rent.steps.propertyCategory.subtitle",
                "What kind of place is it?",
                {},
              ),
              validation: () => values.landCategoryId > 0,
              render: () => (
                <View style={styles.optionsContainer}>
                  {categoriesLoading ? (
                    <ActivityIndicator
                      size="large"
                      color="#222"
                      style={{ marginTop: 40 }}
                    />
                  ) : (
                    landCategories?.map((cat: any) => {
                      const active = values.landCategoryId === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.optionCard,
                            active && styles.optionCardActive,
                          ]}
                          onPress={() =>
                            setFieldValue("landCategoryId", cat.id)
                          }
                          activeOpacity={0.7}
                        >
                          <PhosphorIcon
                            name={cat.icon}
                            size={28}
                            color={active ? "#222" : "#717171"}
                          />
                          <Text
                            style={[
                              styles.optionText,
                              active && styles.optionTextActive,
                            ]}
                          >
                            {getLocalizedName(cat)}
                          </Text>
                          {active && (
                            <View style={styles.checkBadge}>
                              <MaterialIcons
                                name="check"
                                size={16}
                                color="#FFF"
                              />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              ),
            },
            {
              id: "location",
              title: tr("listing.rent.steps.location.title", "Where is the property?", {}),
              subtitle: tr(
                "listing.rent.steps.location.subtitle",
                "City, zone, and sector are optional — pick what you know",
                {},
              ),
              validation: () => true,
              render: () => (
                <View style={styles.focusContainer}>
                  <RentLocationPicker
                    cities={cities}
                    zones={zones}
                    quartiers={quartiers}
                    citiesLoading={citiesLoading}
                    zonesLoading={zonesLoading}
                    quartiersLoading={quartiersLoading}
                    cityId={values.city_id}
                    zoneId={values.zone_id}
                    quartierId={values.quartier_id}
                    lang={currentLanguage || "en"}
                    labels={{
                      city: tr("listing.rent.steps.city.title", "City", {}),
                      zone: tr("listing.rent.steps.address.zone", "Zone", {}),
                      quartier: tr(
                        "listing.rent.steps.address.quartier",
                        "Sector",
                        {},
                      ),
                      search: tr("listing.common.search", "Search…", {}),
                      zoneOptional: tr(
                        "listing.rent.steps.location.noZone",
                        "No zone — that's OK",
                        {},
                      ),
                      quartierOptional: tr(
                        "listing.rent.steps.location.noQuartier",
                        "No sector — that's OK",
                        {},
                      ),
                      cityOptional: tr(
                        "listing.rent.steps.location.noCity",
                        "No city — that's OK",
                        {},
                      ),
                    }}
                    onCitySelect={(city) => {
                      const picked = city as City;
                      setFieldValue("city", picked.name);
                      setFieldValue("city_id", picked.id);
                      setFieldValue("state", picked.name);
                      if (picked.country_id && picked.country_id > 0) {
                        setFieldValue("country_id", picked.country_id);
                        setSelectedCountryId(picked.country_id);
                      }
                      setFieldValue("zone", "");
                      setFieldValue("zone_id", 0);
                      setFieldValue("quartier", "");
                      setFieldValue("quartier_id", 0);
                      setSelectedCityId(city.id);
                      setSelectedZoneId(0);
                    }}
                    onCityClear={() => {
                      setFieldValue("city", "");
                      setFieldValue("city_id", 0);
                      setFieldValue("zone", "");
                      setFieldValue("zone_id", 0);
                      setFieldValue("quartier", "");
                      setFieldValue("quartier_id", 0);
                      setSelectedCityId(0);
                      setSelectedZoneId(0);
                    }}
                    onZoneSelect={(zone) => {
                      if (!zone) {
                        setFieldValue("zone", "");
                        setFieldValue("zone_id", 0);
                        setFieldValue("quartier", "");
                        setFieldValue("quartier_id", 0);
                        setSelectedZoneId(0);
                        return;
                      }
                      setFieldValue("zone", zone.name);
                      setFieldValue("zone_id", zone.id);
                      setFieldValue("quartier", "");
                      setFieldValue("quartier_id", 0);
                      setSelectedZoneId(zone.id);
                    }}
                    onQuartierSelect={(q) => {
                      if (!q) {
                        setFieldValue("quartier", "");
                        setFieldValue("quartier_id", 0);
                        return;
                      }
                      setFieldValue("quartier", q.name);
                      setFieldValue("quartier_id", q.id);
                    }}
                  />
                  <Text style={[styles.hint, { marginTop: 16 }]}>
                    {tr(
                      "listing.rent.steps.location.streetHint",
                      "Street address is optional — add it on the review step if needed.",
                      {},
                    )}
                  </Text>
                </View>
              ),
            },
            {
              id: "price",
              title: tr("listing.rent.steps.price.title", "Set your monthly rent", {}),
              subtitle: tr("listing.rent.steps.price.subtitle", "Required", {}),
              validation: () =>
                values.price.trim().length > 0 && parseFloat(values.price) > 0,
              render: () => (
                <View style={styles.focusContainer}>
                  <View style={styles.priceInput}>
                    <TextInput
                      style={styles.priceValue}
                      value={values.price}
                      onChangeText={(text) => setFieldValue("price", text)}
                      placeholder={tr("listing.rent.steps.price.placeholder", "50000", {})}
                      placeholderTextColor="#B0B0B0"
                      keyboardType="numeric"
                      autoFocus
                    />
                    <Text style={styles.priceUnit}>
                      {tr("listing.rent.steps.price.unit", "MRU / month", {})}
                    </Text>
                  </View>
                  <Text style={styles.hint}>
                    {tr("listing.rent.steps.price.hint", "Monthly rent", {})}
                  </Text>
                </View>
              ),
            },
            {
              id: "photos",
              title: tr("listing.rent.steps.photos.title", "Add photos", {}),
              subtitle: tr(
                "listing.rent.steps.photos.subtitle",
                "At least one photo — listings with photos get more views",
                {},
              ),
              validation: () => values.images.length >= 1,
              render: () => (
                <View style={styles.focusContainer}>
                  {values.images.length === 0 ? (
                    <TouchableOpacity
                      style={styles.uploadLarge}
                      onPress={pickPhotos}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons
                        name="add-photo-alternate"
                        size={64}
                        color="#B0B0B0"
                      />
                      <Text style={styles.uploadText}>
                        {tr("listing.rent.steps.photos.firstPhoto", "Add your first photo", {})}
                      </Text>
                      <Text style={styles.uploadHint}>
                        {tr("listing.rent.steps.photos.tapUpload", "Tap to upload", {})}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <View style={styles.photoGrid}>
                        {values.images.map((img, idx) => (
                          <View key={idx} style={styles.photoItem}>
                            <Image
                              source={{ uri: img }}
                              style={styles.photoImage}
                            />
                            <TouchableOpacity
                              style={styles.photoRemove}
                              onPress={() => {
                                setFieldValue(
                                  "images",
                                  values.images.filter((_, i) => i !== idx)
                                );
                              }}
                              activeOpacity={0.8}
                            >
                              <MaterialIcons
                                name="close"
                                size={14}
                                color="#FFF"
                              />
                            </TouchableOpacity>
                            {idx === 0 && (
                              <View style={styles.coverBadge}>
                                <MaterialIcons
                                  name="star"
                                  size={12}
                                  color="#FFF"
                                />
                              </View>
                            )}
                          </View>
                        ))}
                        {values.images.length < 10 && (
                          <TouchableOpacity
                            style={styles.photoAdd}
                            onPress={pickPhotos}
                            activeOpacity={0.8}
                          >
                            <MaterialIcons
                              name="add"
                              size={32}
                              color="#717171"
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={styles.hint}>
                        {tr(
                          values.images.length === 1
                            ? "listing.rent.steps.photos.count_one"
                            : "listing.rent.steps.photos.count_other",
                          "{{count}} photo(s) added",
                          { count: values.images.length },
                        )}
                      </Text>
                    </>
                  )}
                </View>
              ),
            },
            {
              id: "video",
              title: tr("listing.rent.steps.video.title", "Add a video", {}),
              subtitle: tr(
                "listing.rent.steps.video.subtitle",
                "Optional — show up in the video feed",
                {},
              ),
              validation: () => true,
              optional: true,
              render: () => (
                <RentListingVideoPicker
                  value={listingVideo}
                  onChange={setListingVideo}
                  labels={{
                    title: tr(
                      "listing.rent.steps.video.pickerTitle",
                      "Property video",
                      {},
                    ),
                    hint: tr(
                      "listing.rent.steps.video.pickerHint",
                      "Rent listings with video get more visibility in the TikTok-style feed.",
                      {},
                    ),
                    optional: tr(
                      "listing.rent.steps.video.optional",
                      "You can skip this step",
                      {},
                    ),
                    pick: tr("listing.rent.steps.video.pick", "Choose video", {}),
                    replace: tr("listing.rent.steps.video.replace", "Replace", {}),
                    remove: tr("listing.rent.steps.video.remove", "Remove", {}),
                    tooLong: tr(
                      "listing.rent.steps.video.tooLong",
                      "Video must be under 5 minutes.",
                      {},
                    ),
                  }}
                />
              ),
            },
            {
              id: "description",
              title: tr("listing.rent.steps.description.title", "Describe your place", {}),
              subtitle: tr(
                "listing.rent.steps.description.subtitle",
                "Optional — what makes it special?",
                {},
              ),
              validation: () => true,
              optional: true,
              render: () => (
                <View style={styles.focusContainer}>
                  <TextInput
                    style={[styles.bigInput, styles.textArea]}
                    value={values.description}
                    onChangeText={(text) => setFieldValue("description", text)}
                    placeholder={tr(
                      "listing.rent.steps.description.placeholder",
                      "Features, amenities, neighborhood…",
                      {},
                    )}
                    placeholderTextColor="#B0B0B0"
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    maxLength={500}
                  />
                  <Text style={styles.charCount}>
                    {values.description.length}/500
                  </Text>
                  <View style={{ marginTop: 16 }}>
                    <Text style={[styles.hint, { fontWeight: "600", color: "#222" }]}>
                      {tr("listing.common.suggestedTemplates", "Suggested", {})}
                    </Text>
                    <View style={styles.chipsWrap}>
                      {buildRentDescriptionTemplates().map((tpl) => (
                        <TouchableOpacity
                          key={tpl.id}
                          style={styles.chip}
                          onPress={() => setFieldValue("description", tpl.text)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.chipText}>{tpl.title}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              ),
            },
            {
              id: "amenities",
              title: tr("listing.rent.steps.amenities.title", "Available amenities", {}),
              subtitle: tr(
                "listing.rent.steps.amenities.subtitle",
                "Optional — tap what applies",
                {},
              ),
              validation: () => true,
              optional: true,
              render: () => (
                <View style={styles.optionsContainer}>
                  {amenitiesLoading ? (
                    <ActivityIndicator
                      size="large"
                      color="#222"
                      style={{ marginTop: 40 }}
                    />
                  ) : amenities?.length > 0 ? (
                    <View style={styles.chipsWrap}>
                      {amenities.map(
                        (amenity: {
                          id: number;
                          icon?: string;
                          name?: { en?: string; fr?: string; ar?: string };
                        }) => {
                          const active = values.amenities.includes(amenity.id);
                          const label = getLocalizedName(amenity);
                          return (
                            <TouchableOpacity
                              key={amenity.id}
                              style={[styles.chip, active && styles.chipActive]}
                              onPress={() => {
                                const next = active
                                  ? values.amenities.filter(
                                      (id: number) => id !== amenity.id
                                    )
                                  : [...values.amenities, amenity.id];
                                setFieldValue("amenities", next);
                              }}
                              activeOpacity={0.7}
                            >
                              <PhosphorIcon
                                name={(amenity.icon as any) || "Question"}
                                size={16}
                                color={active ? "#FFF" : "#717171"}
                              />
                              <Text
                                style={[
                                  styles.chipText,
                                  active && styles.chipTextActive,
                                ]}
                              >
                                {label}
                              </Text>
                            </TouchableOpacity>
                          );
                        }
                      )}
                    </View>
                  ) : (
                    <Text style={styles.hint}>
                      {tr("listing.rent.steps.amenities.empty", "No amenities available right now", {})}
                    </Text>
                  )}
                </View>
              ),
            },
            {
              id: "policies",
              title: tr("listing.rent.steps.policies.title", "Policies & rules", {}),
              subtitle: tr(
                "listing.rent.steps.policies.subtitle",
                "Optional — cancellation and house rules",
                {},
              ),
              validation: () => true,
              optional: true,
              onSkip: () => {
                setFieldValue("houseRules", "");
                setFieldValue("cancellationPolicy", "");
              },
              render: () => (
                <View style={styles.focusContainer}>
                  <Text style={styles.sectionLabel}>
                    {tr("listing.rent.steps.cancellationPolicy.title", "Cancellation policy", {})}
                  </Text>
                  <View style={styles.compactOptions}>
                    {cancellationPolicies.map((policy) => {
                      const active = values.cancellationPolicy === policy.value;
                      return (
                        <TouchableOpacity
                          key={policy.value}
                          style={[
                            styles.compactOption,
                            active && styles.compactOptionActive,
                          ]}
                          onPress={() =>
                            setFieldValue("cancellationPolicy", policy.value)
                          }
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.compactOptionText,
                              active && styles.compactOptionTextActive,
                            ]}
                          >
                            {policy.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={[styles.sectionLabel, { marginTop: 28 }]}>
                    {tr("listing.rent.steps.houseRules.title", "House rules", {})}
                  </Text>
                  <View style={styles.compactOptions}>
                    {standardHouseRules.map((rule) => {
                      const active = values.houseRules === rule.value;
                      return (
                        <TouchableOpacity
                          key={rule.value}
                          style={[
                            styles.compactOption,
                            active && styles.compactOptionActive,
                          ]}
                          onPress={() => setFieldValue("houseRules", rule.value)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.compactOptionText,
                              active && styles.compactOptionTextActive,
                            ]}
                          >
                            {rule.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ),
            },
            {
              id: "visits",
              title: tr("listing.rent.steps.checkInOut.title", "Visit hours", {}),
              subtitle: tr(
                "listing.rent.steps.checkInOut.subtitle",
                "Optional — when can people visit?",
                {},
              ),
              validation: () => true,
              optional: true,
              onSkip: () => {
                setFieldValue("checkInTime", "");
                setFieldValue("checkOutTime", "");
              },
              render: () => (
                <View style={styles.focusContainer}>
                  <Text style={styles.sectionLabel}>
                    {tr("listing.rent.steps.checkInOut.checkIn", "Visit start time", {})}
                  </Text>
                  <View style={styles.timeGrid}>
                    {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map(
                      (time) => {
                        const active = values.checkInTime === time;
                        return (
                          <TouchableOpacity
                            key={time}
                            style={[
                              styles.timeChip,
                              active && styles.timeChipActive,
                            ]}
                            onPress={() => setFieldValue("checkInTime", time)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.timeText,
                                active && styles.timeTextActive,
                              ]}
                            >
                              {time}
                            </Text>
                          </TouchableOpacity>
                        );
                      },
                    )}
                  </View>
                  <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
                    {tr("listing.rent.steps.checkInOut.checkOut", "Visit end time", {})}
                  </Text>
                  <View style={styles.timeGrid}>
                    {["10:00", "11:00", "12:00", "15:00", "16:00", "17:00"].map(
                      (time) => {
                        const active = values.checkOutTime === time;
                        return (
                          <TouchableOpacity
                            key={time}
                            style={[
                              styles.timeChip,
                              active && styles.timeChipActive,
                            ]}
                            onPress={() => setFieldValue("checkOutTime", time)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.timeText,
                                active && styles.timeTextActive,
                              ]}
                            >
                              {time}
                            </Text>
                          </TouchableOpacity>
                        );
                      },
                    )}
                  </View>
                </View>
              ),
            },
            {
              id: "review",
              title: tr("listing.rent.steps.review.title", "Review your listing", {}),
              subtitle: tr("listing.rent.steps.review.subtitle", "Is everything correct?", {}),
              validation: () => true,
              render: () => {
                const selectedCity = cities.find(
                  (c: City) => c.id === values.city_id
                );
                const selectedZone = zones.find(
                  (z: any) => z.id === values.zone_id
                );
                const selectedQuartier = quartiers.find(
                  (q: any) => q.id === values.quartier_id
                );
                const locationParts = [
                  selectedCity?.name || values.city,
                  selectedZone?.name || values.zone,
                  selectedQuartier?.name || values.quartier,
                ].filter(Boolean);
                return (
                  <View style={styles.reviewContainer}>
                    <View style={styles.reviewItem}>
                      <Text style={styles.reviewLabel}>
                        {tr("listing.rent.steps.review.titleLabel", "Title", {})}
                      </Text>
                      <Text style={styles.reviewValue}>
                        {values.title || tr("listing.common.notSet", "Not set", {})}
                      </Text>
                    </View>
                    <View style={styles.reviewItem}>
                      <Text style={styles.reviewLabel}>
                        {tr("listing.rent.steps.review.typeLabel", "Type", {})}
                      </Text>
                      <Text style={styles.reviewValue}>
                        {(() => {
                          const c = landCategories.find(
                            (x: any) => x.id === values.landCategoryId,
                          );
                          return (
                            getLocalizedName(c) ||
                            tr("listing.common.notSet", "Not set", {})
                          );
                        })()}
                      </Text>
                    </View>
                    <View style={styles.reviewItem}>
                      <Text style={styles.reviewLabel}>
                        {tr("listing.rent.steps.review.locationLabel", "Location", {})}
                      </Text>
                      <Text style={styles.reviewValue}>
                        {locationParts.length > 0
                          ? locationParts.join(" · ")
                          : tr("listing.common.notSet", "Not set", {})}
                      </Text>
                    </View>
                    <View style={styles.reviewItem}>
                      <Text style={styles.reviewLabel}>
                        {tr("listing.rent.steps.address.street", "Street", {})}
                      </Text>
                      <TextInput
                        style={styles.reviewInlineInput}
                        placeholder={tr(
                          "listing.rent.steps.address.streetPlaceholder",
                          "Optional — e.g. 123 Main Street",
                          {},
                        )}
                        placeholderTextColor="#A3A3A3"
                        value={values.addressLine1}
                        onChangeText={(text) =>
                          setFieldValue("addressLine1", text)
                        }
                      />
                    </View>
                    <View style={styles.reviewItem}>
                      <Text style={styles.reviewLabel}>
                        {tr("listing.rent.steps.review.priceLabel", "Price", {})}
                      </Text>
                      <Text style={styles.reviewValue}>
                        {values.price
                          ? `${values.price} ${tr(
                              "listing.rent.steps.review.priceUnit",
                              "MRU/month",
                              {},
                            )}`
                          : tr("listing.common.notSet", "Not set", {})}
                      </Text>
                    </View>
                    <View style={styles.reviewItem}>
                      <Text style={styles.reviewLabel}>
                        {tr("listing.rent.steps.review.photosLabel", "Photos", {})}
                      </Text>
                      <Text style={styles.reviewValue}>
                        {tr("listing.rent.steps.review.photosValue", "{{count}} photo(s)", {
                          count: values.images.length,
                        })}
                      </Text>
                    </View>
                    <View style={styles.reviewItem}>
                      <Text style={styles.reviewLabel}>
                        {tr("listing.rent.steps.review.videoLabel", "Video", {})}
                      </Text>
                      <Text style={styles.reviewValue}>
                        {listingVideo
                          ? tr("listing.rent.steps.review.videoAdded", "1 video ready to upload")
                          : tr("listing.rent.steps.review.videoSkipped", "No video")}
                      </Text>
                    </View>
                    <View style={styles.reviewItem}>
                      <Text style={styles.reviewLabel}>
                        {tr(
                          "listing.rent.steps.review.privateNoteLabel",
                          "Private note (you / org only)",
                          {},
                        )}
                      </Text>
                      <Text style={styles.reviewHint}>
                        {tr(
                          "listing.rent.steps.review.privateNoteHint",
                          "Not visible to guests. Optional reminder about this property.",
                          {},
                        )}
                      </Text>
                      <TextInput
                        style={styles.privateNoteInput}
                        placeholder={tr(
                          "listing.rent.steps.review.privateNotePlaceholder",
                          "e.g. access, context…",
                          {},
                        )}
                        placeholderTextColor="#999"
                        multiline
                        maxLength={2000}
                        value={values.hostPrivateNote}
                        onChangeText={(text) =>
                          setFieldValue("hostPrivateNote", text)
                        }
                      />
                    </View>
                    <View style={styles.reviewNote}>
                      <Text style={styles.reviewNoteText}>
                        {tr(
                          "listing.rent.steps.review.tip",
                          "You can edit your listing anytime after publishing",
                          {},
                        )}
                      </Text>
                    </View>
                  </View>
                );
              },
            },
          ];

          const currentStepData = STEPS[currentStep];
          const TOTAL_STEPS = STEPS.length;
          const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;
          const isLastStep = currentStep === TOTAL_STEPS - 1;
          const isOptionalStep = Boolean(
            (currentStepData as { optional?: boolean }).optional,
          );

          const canProceed = () => {
            if (!currentStepData.validation) return true;
            return currentStepData.validation();
          };

          const nextStep = () => {
            if (currentStep < TOTAL_STEPS - 1 && canProceed()) {
              setCurrentStep(currentStep + 1);
            }
          };

          aiApplyRef.current = (draft: ListingAiDraft) => {
            applyRentListingDraft(
              draft,
              setFieldValue,
              setSelectedCityId,
              setSelectedZoneId,
            );
            setAiFlowVisible(false);
            const reviewIdx = STEPS.findIndex((s) => s.id === "review");
            if (reviewIdx >= 0) setCurrentStep(reviewIdx);
            Alert.alert(
              tr("listingAi.doneTitle", "Listing ready", {}),
              tr(
                "listingAi.doneBody",
                "Review the details and publish when you're ready.",
                {},
              ),
            );
          };

          const skipOptionalStep = () => {
            const onSkip = (currentStepData as { onSkip?: () => void }).onSkip;
            if (onSkip) onSkip();
            if (currentStepData.id === "description") {
              setFieldValue("description", "");
            }
            if (currentStepData.id === "video") {
              setListingVideo(null);
            }
            if (currentStepData.id === "amenities") {
              setFieldValue("amenities", []);
            }
            if (currentStep < TOTAL_STEPS - 1) {
              setCurrentStep(currentStep + 1);
            }
          };

          const prevStep = () => {
            if (currentStep > 0) {
              setCurrentStep(currentStep - 1);
            }
          };

          return (
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTopRow}>
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.closeButton}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="close" size={28} color="#222" />
                  </TouchableOpacity>
                  <Text style={styles.headerStepTitle} numberOfLines={1}>
                    {currentStepData.title}
                  </Text>
                </View>
              </View>

              {/* Content */}
              <KeyboardAwareScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                enableOnAndroid={true}
                enableAutomaticScroll={false}
                extraScrollHeight={20}
                keyboardShouldPersistTaps="handled"
                keyboardOpeningTime={0}
              >
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>{currentStepData.title}</Text>
                  {currentStepData.subtitle && (
                    <Text style={styles.stepSubtitle}>
                      {currentStepData.subtitle}
                    </Text>
                  )}
                  <View style={styles.stepBody}>
                    {currentStepData.render()}
                  </View>
                </View>
              </KeyboardAwareScrollView>

              {/* Footer */}
              <View style={styles.footer}>
                <View style={styles.footerProgressBar}>
                  <View
                    style={[styles.footerProgressFill, { width: `${progress}%` }]}
                  />
                </View>
                <Text style={styles.footerSummaryLine} numberOfLines={1}>
                  {tr("listing.common.stepOf", "Step {{current}}/{{total}}", {
                    current: currentStep + 1,
                    total: TOTAL_STEPS,
                  })}
                </Text>
                <View style={styles.footerContent}>
                  {currentStep > 0 && (
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={prevStep}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="arrow-back" size={20} color="#222" />
                    </TouchableOpacity>
                  )}

                  <View style={{ flex: 1 }} />

                  {isOptionalStep && !isLastStep ? (
                    <TouchableOpacity
                      style={styles.notInterestedButton}
                      onPress={skipOptionalStep}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.notInterestedText}>
                        {tr("listing.common.notInterested", "Not interested", {})}
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  {isLastStep ? (
                    <TouchableOpacity
                      style={[
                        styles.nextButton,
                        isSubmitting && styles.nextButtonDisabled,
                      ]}
                      onPress={() => handleSubmit()}
                      disabled={isSubmitting}
                      activeOpacity={0.7}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.nextButtonText}>
                          {tr("listing.common.publish", "Publish", {})}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ) : currentStep === 0 ? null : (
                    <TouchableOpacity
                      style={[
                        styles.nextButton,
                        !canProceed() && styles.nextButtonDisabled,
                      ]}
                      onPress={nextStep}
                      disabled={!canProceed()}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.nextButtonText}>
                        {tr("listing.common.continue", "Continue", {})}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <RentListingVideoUploadOverlay
                visible={
                  isSubmitting &&
                  videoUploadPhase !== "idle" &&
                  Boolean(listingVideo)
                }
                percent={videoUploadPercent}
                message={
                  videoUploadPhase === "processing"
                    ? tr(
                        "listing.rent.steps.video.processing",
                        "Optimizing video for the feed…",
                        {},
                      )
                    : tr(
                        "listing.rent.steps.video.uploading",
                        "Uploading video…",
                        {},
                      )
                }
              />
            </>
          );
        }}
      </Formik>
      <AddWithAiFlow
        visible={aiFlowVisible}
        kind="rent"
        onClose={() => setAiFlowVisible(false)}
        onApply={(draft) => aiApplyRef.current(draft)}
        onPublished={() => {
          setAiFlowVisible(false);
          navigation.goBack();
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F8",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: "#F7F7F8",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
  },
  headerStepTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#717171",
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
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 120,
    flexGrow: 1,
  },
  stepContainer: {
    width: "100%",
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#222",
    marginBottom: 6,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  stepSubtitle: {
    fontSize: 16,
    color: "#717171",
    marginBottom: 20,
    lineHeight: 22,
  },
  stepSummaryRow: {
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EBEBEB",
    gap: 6,
  },
  stepSummaryLine: {
    fontSize: 14,
    color: "#717171",
  },
  stepSummaryNext: {
    fontSize: 14,
    color: "#222",
    fontWeight: "600",
    marginTop: 4,
  },
  stepBody: {
    flex: 1,
  },

  // Intro
  introContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  introEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#222",
    marginBottom: 16,
  },
  introText: {
    fontSize: 16,
    color: "#717171",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  introSteps: {
    width: "100%",
    gap: 20,
  },
  introStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  introStepBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  introStepNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  introStepText: {
    fontSize: 16,
    color: "#222",
    flex: 1,
  },

  // Focus Input
  focusContainer: {
    width: "100%",
  },
  bigInput: {
    fontSize: 20,
    fontWeight: "400",
    color: "#222",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    paddingBottom: 12,
    paddingTop: 8,
    marginBottom: 16,
  },
  textArea: {
    fontSize: 17,
    lineHeight: 26,
    minHeight: 140,
    textAlignVertical: "top",
    borderBottomWidth: 0,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 14,
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  hint: {
    fontSize: 14,
    color: "#717171",
    marginTop: 8,
  },
  charCount: {
    fontSize: 12,
    color: "#B0B0B0",
    textAlign: "right",
    marginTop: 4,
  },
  priceInput: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    paddingBottom: 8,
    marginBottom: 16,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: "400",
    color: "#222",
    flex: 1,
  },
  priceUnit: {
    fontSize: 24,
    fontWeight: "400",
    color: "#717171",
    marginLeft: 12,
    marginBottom: 2,
  },
  unitRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  unitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
  },
  unitBtnActive: {
    backgroundColor: "#222",
    borderColor: "#222",
  },
  unitText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#222",
  },
  unitTextActive: {
    color: "#FFFFFF",
  },

  // Options
  optionsContainer: {
    width: "100%",
    gap: 12,
  },
  optionCard: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    gap: 16,
  },
  optionCardActive: {
    borderColor: "#222",
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#222",
    flex: 1,
  },
  optionTextActive: {
    fontWeight: "600",
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },

  // List Options
  cityList: {
    maxHeight: 400,
    width: "100%",
  },
  accordionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  dropdownHeaderText: {
    fontSize: 15,
    color: "#222",
    fontWeight: "600",
  },
  dropdownHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  dropdownSelectedText: {
    fontSize: 13,
    color: "#444",
    maxWidth: 170,
  },
  dropdownHeaderIcon: {
    fontSize: 12,
    color: "#717171",
    fontWeight: "700",
  },
  dropdownContentWindow: {
    maxHeight: 220,
    paddingTop: 4,
  },
  listOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  listOptionActive: {
    borderColor: "#222",
    borderWidth: 2,
    backgroundColor: "#F7F7F7",
  },
  listOptionText: {
    fontSize: 16,
    color: "#222",
    fontWeight: "400",
  },
  listOptionTextActive: {
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    color: "#C13515",
    textAlign: "center",
    padding: 20,
  },

  // Form sections
  formSection: {
    width: "100%",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
  },
  optionalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
  },
  optionalText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#717171",
  },
  input: {
    fontSize: 16,
    color: "#222",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  list: {
    gap: 10,
    marginTop: 12,
  },

  // Time chips
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  timeChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
  },
  timeChipActive: {
    backgroundColor: "#222",
    borderColor: "#222",
  },
  timeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#222",
  },
  timeTextActive: {
    color: "#FFFFFF",
  },

  // Chips
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-start",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
    gap: 6,
  },
  chipActive: {
    backgroundColor: "#222",
    borderColor: "#222",
  },
  chipText: {
    fontSize: 14,
    color: "#222",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },

  // Photos
  uploadLarge: {
    height: 300,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#DDDDDD",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  uploadText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#717171",
    marginTop: 16,
  },
  uploadHint: {
    fontSize: 14,
    color: "#717171",
    marginTop: 8,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoItem: {
    position: "relative",
    width: (SCREEN_WIDTH - 60) / 2,
    height: (SCREEN_WIDTH - 60) / 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoRemove: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  coverBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "#222",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  photoAdd: {
    width: (SCREEN_WIDTH - 60) / 2,
    height: (SCREEN_WIDTH - 60) / 2,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#DDDDDD",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },

  // Review
  reviewContainer: {
    width: "100%",
    gap: 20,
  },
  reviewItem: {
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
  reviewHint: {
    fontSize: 13,
    color: "#717171",
    marginBottom: 10,
    lineHeight: 18,
  },
  privateNoteInput: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#222",
    textAlignVertical: "top",
    backgroundColor: "#FAFAFA",
  },
  reviewInlineInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#222",
    backgroundColor: "#FFFFFF",
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    marginBottom: 12,
  },
  compactOptions: {
    gap: 8,
  },
  compactOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
  },
  compactOptionActive: {
    borderColor: "#222",
    backgroundColor: "#FAFAFA",
  },
  compactOptionText: {
    fontSize: 15,
    color: "#444",
    lineHeight: 20,
  },
  compactOptionTextActive: {
    color: "#222",
    fontWeight: "600",
  },
  reviewNote: {
    backgroundColor: "#FFF4ED",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  reviewNoteText: {
    fontSize: 14,
    color: "#222",
    lineHeight: 20,
  },

  // Footer
  footer: {
    backgroundColor: "#F7F7F8",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5E5",
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  footerProgressBar: {
    height: 2,
    backgroundColor: "#EBEBEB",
  },
  footerProgressFill: {
    height: "100%",
    backgroundColor: "#222",
  },
  footerSummaryLine: {
    fontSize: 12,
    color: "#717171",
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  notInterestedButton: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  notInterestedText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#717171",
    textDecorationLine: "underline",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    minWidth: 132,
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
