import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput, Alert, Image, ActivityIndicator } from "react-native";
import { Text, Button } from "@ui-kitten/components";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { Formik } from "formik";
import { useState, useRef } from "react";
import * as yup from "yup";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { useTranslation } from "react-i18next";
import { CheckCircle, XCircle, CloudArrowUp } from "phosphor-react-native";

import { Loading } from "../components/Loading";
import { Screen } from "../components/Screen";
import { useEditPropertyQuery } from "../hooks/queries/useEditPropertyQuery";
import { useEditPropertyMutation } from "../hooks/mutations/useEditPropertyMutation";
import { useDeletePropertyImageMutation } from "../hooks/mutations/useDeletePropertyImageMutation";
import { theme } from "../theme";
import { propertyAmenities } from "../constants/propertyAmenities";
import { pickImage } from "../utils/pickImage";
import { pickPropertyImage } from "../utils/pickPropertyImage";
import { useUser } from "../hooks/useUser";
import { SearchAddress } from "../components/SearchAddress";
import { SearchLocation } from "../types/locationIQ";
import { Select } from "../components/Select";
import { bedValues } from "../constants/bedValues";
import { bathValues } from "../constants/bathValues";

export const EditPropertyStepScreen = ({
  route,
}: {
  route: { params: { propertyID: number; step: string } };
}) => {
  const navigation = useNavigation();
  const { user } = useUser();
  const { t } = useTranslation();
  const property = useEditPropertyQuery(route.params.propertyID);
  const editProperty = useEditPropertyMutation();
  const deleteImage = useDeletePropertyImageMutation();
  const propertyData = property.data;
  const step = route.params.step;
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const [searchingLocation, setSearchingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchLocation[]>([]);
  const [location, setLocation] = useState({
    addressLine1: propertyData?.addressLine1 || "",
    city: propertyData?.city || "",
    state: propertyData?.state || "",
    country: propertyData?.country || "",
    lat: propertyData?.lat || 0,
    lng: propertyData?.lng || 0,
  });

  if (property.isFetching || property.isLoading) return <Loading />;

  const getStepTitle = () => {
    const titles: { [key: string]: string } = {
      location: "Localisation du logement",
      type: "Type de logement",
      capacity: "Capacité et configuration",
      pricing: "Prix par nuit",
      title: "Titre de l'annonce",
      description: "Description",
      amenities: "Équipements",
      rules: "Règles de la maison",
      cancellation: "Politique d'annulation",
      photos: "Photos",
    };
    return titles[step] || "Modifier";
  };

  const getInitialValue = () => {
    if (!propertyData) return "";
    
    switch (step) {
      case "title":
        return propertyData.title || "";
      case "description":
        return propertyData.description || "";
      case "pricing":
        return propertyData.nightlyPrice?.toString() || "";
      case "type":
        return propertyData.propertyType || "";
      case "capacity":
        return {
          capacity: propertyData.capacity || 1,
          bedrooms: propertyData.bedrooms || 1,
          beds: propertyData.beds || 1,
          bathrooms: propertyData.bathrooms || 1,
        };
      case "amenities":
        return propertyData.amenities || [];
      case "rules":
        return propertyData.houseRules || "";
      case "cancellation":
        return propertyData.cancellationPolicy || "";
      case "photos":
        return propertyData.images || [];
      default:
        return "";
    }
  };

  const getValidationSchema = () => {
    switch (step) {
      case "title":
        return yup.object().shape({
          value: yup.string().required("Le titre est requis").min(10, "Le titre doit faire au moins 10 caractères"),
        });
      case "description":
        return yup.object().shape({
          value: yup.string().required("La description est requise").min(50, "La description doit faire au moins 50 caractères"),
        });
      case "pricing":
        return yup.object().shape({
          value: yup.string().required("Le prix est requis").matches(/^\d+$/, "Le prix doit être un nombre"),
        });
      default:
        return yup.object().shape({
          value: yup.string(),
        });
    }
  };

  const handleSubmit = (values: { value: string | string[] | any }) => {
    if (!propertyData) return;

    // Helper function to parse JSON strings to arrays
    const parseJsonField = (field: any): any => {
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch {
          return [];
        }
      }
      return field || [];
    };

    // Include all existing property data as base
    const updateData: any = {
      ID: propertyData.ID,
      title: propertyData.title || "",
      propertyType: propertyData.propertyType || "",
      addressLine1: propertyData.addressLine1 || "",
      addressLine2: propertyData.addressLine2 || "",
      city: propertyData.city || "",
      state: propertyData.state || "",
      zip: propertyData.zip || "00000",
      country: propertyData.country || "",
      lat: propertyData.lat || 0,
      lng: propertyData.lng || 0,
      capacity: propertyData.capacity || 1,
      bedrooms: propertyData.bedrooms || 1,
      beds: propertyData.beds || 1,
      bathrooms: propertyData.bathrooms || 1,
      nightlyPrice: propertyData.nightlyPrice || 0,
      currency: propertyData.currency || "MRU",
      cleaningFee: propertyData.cleaningFee || 0,
      serviceFee: propertyData.serviceFee || 0,
      description: propertyData.description || "",
      amenities: parseJsonField(propertyData.amenities),
      houseRules: propertyData.houseRules || "",
      cancellationPolicy: propertyData.cancellationPolicy || "",
      images: parseJsonField(propertyData.images),
      isActive: propertyData.isActive !== undefined ? propertyData.isActive : true,
    };
    
    // Update only the specific field being edited
    switch (step) {
      case "location":
        updateData.addressLine1 = location.addressLine1;
        updateData.city = location.city;
        updateData.state = location.state;
        updateData.country = location.country;
        updateData.lat = location.lat;
        updateData.lng = location.lng;
        break;
      case "type":
        updateData.propertyType = values.value;
        break;
      case "capacity":
        updateData.capacity = values.value.capacity;
        updateData.bedrooms = values.value.bedrooms;
        updateData.beds = values.value.beds;
        updateData.bathrooms = values.value.bathrooms;
        break;
      case "pricing":
        updateData.nightlyPrice = Number(values.value);
        break;
      case "title":
        updateData.title = values.value;
        break;
      case "description":
        updateData.description = values.value;
        break;
      case "amenities":
        updateData.amenities = Array.isArray(values.value) ? values.value : [];
        break;
      case "rules":
        updateData.houseRules = values.value;
        break;
      case "cancellation":
        updateData.cancellationPolicy = values.value;
        break;
      case "photos":
        updateData.images = (Array.isArray(values.value) ? values.value : []).filter(
          (u: string) =>
            typeof u === "string" &&
            (u.startsWith("http://") || u.startsWith("https://")),
        );
        break;
    }

    editProperty.mutate(
      { obj: updateData, propertyID: propertyData.ID },
      {
        onSuccess: () => {
          navigation.goBack();
        },
        onError: (error: unknown) => {
          const msg =
            error instanceof Error
              ? error.message
              : "Impossible de sauvegarder les modifications";
          Alert.alert(t("common.error", "Erreur"), msg);
        },
      }
    );
  };

  const handleLocationPress = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission refusée", "L'accès à la localisation est nécessaire");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocoding
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        setLocation({
          addressLine1: `${address.street || ""} ${address.streetNumber || ""}`.trim(),
          city: address.city || "",
          state: address.region || "",
          country: address.country || "",
          lat: latitude,
          lng: longitude,
        });
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'obtenir votre position");
    }
  };

  const handleSuggestionPress = (suggestion: SearchLocation) => {
    setLocation({
      addressLine1: suggestion.address?.house_number ? 
        `${suggestion.address.house_number} ${suggestion.address.road}` : 
        suggestion.display_name,
      city: suggestion.address?.city || "",
      state: suggestion.address?.state || "",
      country: suggestion.address?.country || "",
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    });
    setSearchingLocation(false);
    setSuggestions([]);
  };

  const renderStepContent = () => {
    switch (step) {
      case "location":
        return (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Où se trouve votre logement ?</Text>
            <Text style={styles.subtitle}>Les voyageurs ne verront que la zone générale jusqu'à la réservation</Text>
            
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleLocationPress}
            >
              <MaterialIcons name="my-location" size={24} color="#222222" />
              <Text style={styles.locationButtonText}>Utiliser ma position actuelle</Text>
            </TouchableOpacity>

            <View style={styles.searchContainer}>
              <SearchAddress
                type="search"
                suggestions={suggestions}
                handleGoBack={() => setSearchingLocation(false)}
                setSuggestions={(item: SearchLocation[] | any[]) => setSuggestions(item as SearchLocation[])}
                handleSuggestionPress={(item: SearchLocation | any) => handleSuggestionPress(item as SearchLocation)}
              />
            </View>

            <View style={styles.locationDisplay}>
              <Text style={styles.locationText}>
                {location.addressLine1 || "Adresse non définie"}
              </Text>
              <Text style={styles.locationSubText}>
                {location.city}, {location.state}, {location.country}
              </Text>
            </View>

            {location.lat !== 0 && location.lng !== 0 && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  region={{
                    latitude: location.lat,
                    longitude: location.lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: location.lat,
                      longitude: location.lng,
                    }}
                  />
                </MapView>
              </View>
            )}

            <Button 
              style={styles.saveButton} 
              onPress={() => handleSubmit({ value: location })}
            >
              Enregistrer
            </Button>
          </View>
        );

      case "type":
        return (
          <Formik
            initialValues={{ value: getInitialValue() }}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue, handleSubmit }) => (
              <View style={styles.formContainer}>
                <Text style={styles.label}>Quel type de logement proposez-vous ?</Text>
                <Text style={styles.subtitle}>Choisissez le type qui correspond le mieux à votre logement</Text>
                <View style={styles.optionsContainer}>
                  {[
                    { 
                      label: "Logement entier", 
                      value: "entire_place",
                      description: "Les voyageurs ont le logement pour eux seuls"
                    },
                    { 
                      label: "Chambre privée", 
                      value: "private_room",
                      description: "Les voyageurs ont leur propre chambre dans un logement partagé"
                    },
                    { 
                      label: "Chambre partagée", 
                      value: "shared_room",
                      description: "Les voyageurs partagent la chambre avec d'autres personnes"
                    },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        values.value === option.value && styles.optionButtonSelected,
                      ]}
                      onPress={() => setFieldValue("value", option.value)}
                    >
                      <View>
                        <Text
                          style={[
                            styles.optionText,
                            values.value === option.value && styles.optionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                        <Text
                          style={[
                            styles.optionDescription,
                            values.value === option.value && styles.optionDescriptionSelected,
                          ]}
                        >
                          {option.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                <Button style={styles.saveButton} onPress={() => handleSubmit()}>
                  Enregistrer
                </Button>
              </View>
            )}
          </Formik>
        );

      case "capacity":
        return (
          <Formik
            initialValues={{ value: getInitialValue() }}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue, handleSubmit }) => (
              <View style={styles.formContainer}>
                <Text style={styles.label}>Combien de voyageurs pouvez-vous accueillir ?</Text>
                <Text style={styles.subtitle}>Décrivez la configuration de votre logement</Text>
                
                <View style={styles.capacityRow}>
                  <View>
                    <Text style={styles.capacityLabel}>Voyageurs</Text>
                    <Text style={styles.capacitySubLabel}>Nombre total de voyageurs</Text>
                  </View>
                  <TextInput
                    style={styles.capacityInput}
                    value={typeof values.value === 'object' && 'capacity' in values.value ? values.value.capacity.toString() : "1"}
                    onChangeText={(text) => setFieldValue("value", { 
                      ...(typeof values.value === 'object' && 'capacity' in values.value ? values.value : { capacity: 1, bedrooms: 1, beds: 1, bathrooms: 1 }), 
                      capacity: parseInt(text) || 1 
                    })}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.capacityRow}>
                  <View>
                    <Text style={styles.capacityLabel}>Chambres</Text>
                    <Text style={styles.capacitySubLabel}>Nombre de chambres</Text>
                  </View>
                  <TextInput
                    style={styles.capacityInput}
                    value={typeof values.value === 'object' && 'bedrooms' in values.value ? values.value.bedrooms.toString() : "1"}
                    onChangeText={(text) => setFieldValue("value", { 
                      ...(typeof values.value === 'object' && 'bedrooms' in values.value ? values.value : { capacity: 1, bedrooms: 1, beds: 1, bathrooms: 1 }), 
                      bedrooms: parseInt(text) || 1 
                    })}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.capacityRow}>
                  <View>
                    <Text style={styles.capacityLabel}>Lits</Text>
                    <Text style={styles.capacitySubLabel}>Nombre de lits</Text>
                  </View>
                  <TextInput
                    style={styles.capacityInput}
                    value={typeof values.value === 'object' && 'beds' in values.value ? values.value.beds.toString() : "1"}
                    onChangeText={(text) => setFieldValue("value", { 
                      ...(typeof values.value === 'object' && 'beds' in values.value ? values.value : { capacity: 1, bedrooms: 1, beds: 1, bathrooms: 1 }), 
                      beds: parseInt(text) || 1 
                    })}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.capacityRow}>
                  <View>
                    <Text style={styles.capacityLabel}>Salles de bain</Text>
                    <Text style={styles.capacitySubLabel}>Nombre de salles de bain</Text>
                  </View>
                  <TextInput
                    style={styles.capacityInput}
                    value={typeof values.value === 'object' && 'bathrooms' in values.value ? values.value.bathrooms.toString() : "1"}
                    onChangeText={(text) => setFieldValue("value", { 
                      ...(typeof values.value === 'object' && 'bathrooms' in values.value ? values.value : { capacity: 1, bedrooms: 1, beds: 1, bathrooms: 1 }), 
                      bathrooms: parseFloat(text) || 1 
                    })}
                    keyboardType="numeric"
                  />
                </View>

                <Button style={styles.saveButton} onPress={() => handleSubmit()}>
                  Enregistrer
                </Button>
              </View>
            )}
          </Formik>
        );

      case "rules":
        return (
          <Formik
            initialValues={{ value: getInitialValue() }}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue, handleSubmit }) => (
              <View style={styles.formContainer}>
                <Text style={styles.label}>Règles de la maison</Text>
                <View style={styles.optionsContainer}>
                  {[
                    { label: "Respect du voisinage (calme après 22h)", value: "quiet_hours" },
                    { label: "Interdiction de fumer", value: "no_smoking" },
                    { label: "Animaux non autorisés", value: "no_pets" },
                    { label: "Pas de fêtes ni d'événements", value: "no_parties" },
                  ].map((rule) => (
                    <TouchableOpacity
                      key={rule.value}
                      style={[
                        styles.optionButton,
                        values.value === rule.value && styles.optionButtonSelected,
                      ]}
                      onPress={() => setFieldValue("value", rule.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          values.value === rule.value && styles.optionTextSelected,
                        ]}
                      >
                        {rule.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Button style={styles.saveButton} onPress={() => handleSubmit()}>
                  Enregistrer
                </Button>
              </View>
            )}
          </Formik>
        );

      case "cancellation":
        return (
          <Formik
            initialValues={{ value: getInitialValue() }}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue, handleSubmit }) => (
              <View style={styles.formContainer}>
                <Text style={styles.label}>Politique d'annulation</Text>
                <View style={styles.optionsContainer}>
                  {[
                    { label: "Flexible — remboursement intégral jusqu'à 24h avant", value: "flexible" },
                    { label: "Modérée — remboursement 50% jusqu'à 5 jours avant", value: "moderate" },
                    { label: "Stricte — non remboursable", value: "strict" },
                  ].map((policy) => (
                    <TouchableOpacity
                      key={policy.value}
                      style={[
                        styles.optionButton,
                        values.value === policy.value && styles.optionButtonSelected,
                      ]}
                      onPress={() => setFieldValue("value", policy.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          values.value === policy.value && styles.optionTextSelected,
                        ]}
                      >
                        {policy.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Button style={styles.saveButton} onPress={() => handleSubmit()}>
                  Enregistrer
                </Button>
              </View>
            )}
          </Formik>
        );

      case "title":
        return (
          <Formik
            initialValues={{ value: getInitialValue() }}
            validationSchema={getValidationSchema()}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
              <View style={styles.formContainer}>
                <Text style={styles.label}>Titre de votre annonce</Text>
                <TextInput
                  style={styles.input}
                  value={typeof values.value === 'string' ? values.value : ""}
                  onChangeText={handleChange("value")}
                  onBlur={handleBlur("value")}
                  placeholder="Ex: Magnifique appartement avec vue sur mer"
                  placeholderTextColor="#999999"
                  multiline
                />
                {touched.value && errors.value && (
                  <Text style={styles.errorText}>{errors.value}</Text>
                )}
                <Button style={styles.saveButton} onPress={() => handleSubmit()}>
                  Enregistrer
                </Button>
              </View>
            )}
          </Formik>
        );

      case "description":
        return (
          <Formik
            initialValues={{ value: getInitialValue() }}
            validationSchema={getValidationSchema()}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
              <View style={styles.formContainer}>
                <Text style={styles.label}>Décrivez votre logement</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={typeof values.value === 'string' ? values.value : ""}
                  onChangeText={handleChange("value")}
                  onBlur={handleBlur("value")}
                  placeholder="Décrivez ce qui rend votre logement unique..."
                  placeholderTextColor="#999999"
                  multiline
                  numberOfLines={6}
                />
                {touched.value && errors.value && (
                  <Text style={styles.errorText}>{errors.value}</Text>
                )}
                <Button style={styles.saveButton} onPress={() => handleSubmit()}>
                  Enregistrer
                </Button>
              </View>
            )}
          </Formik>
        );

      case "pricing":
        return (
          <Formik
            initialValues={{ value: getInitialValue() }}
            validationSchema={getValidationSchema()}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
              <View style={styles.formContainer}>
                <Text style={styles.label}>Quel est votre prix par nuit ?</Text>
                <Text style={styles.subtitle}>Vous pourrez toujours ajuster votre prix plus tard</Text>
                
                <View style={styles.priceContainer}>
                  <Text style={styles.currencySymbol}>MRU</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={typeof values.value === 'string' ? values.value : ""}
                    onChangeText={handleChange("value")}
                    onBlur={handleBlur("value")}
                    placeholder="0"
                    placeholderTextColor="#999999"
                    keyboardType="numeric"
                  />
                </View>
                
                {touched.value && errors.value && (
                  <Text style={styles.errorText}>{errors.value}</Text>
                )}
                
                <View style={styles.priceInfo}>
                  <Text style={styles.priceInfoText}>
                    💡 Commencez par un prix compétitif pour attirer vos premiers voyageurs
                  </Text>
                </View>
                
                <Button style={styles.saveButton} onPress={() => handleSubmit()}>
                  Enregistrer
                </Button>
              </View>
            )}
          </Formik>
        );

      case "amenities":
        return (
          <Formik
            initialValues={{ value: propertyData?.amenities || [] }}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue, handleSubmit }) => (
              <View style={styles.formContainer}>
                <Text style={styles.label}>Équipements disponibles</Text>
                <ScrollView style={styles.amenitiesContainer}>
                  {propertyAmenities.map((amenity) => (
                    <TouchableOpacity
                      key={amenity}
                      style={[
                        styles.amenityChip,
                        values.value.includes(amenity) && styles.amenityChipSelected,
                      ]}
                      onPress={() => {
                        const newAmenities = values.value.includes(amenity)
                          ? values.value.filter((a) => a !== amenity)
                          : [...values.value, amenity];
                        setFieldValue("value", newAmenities);
                      }}
                    >
                      <Text
                        style={[
                          styles.amenityText,
                          values.value.includes(amenity) && styles.amenityTextSelected,
                        ]}
                      >
                        {amenity}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Button style={styles.saveButton} onPress={() => handleSubmit()}>
                  Enregistrer
                </Button>
              </View>
            )}
          </Formik>
        );

      case "photos":
        // Parse images properly - handle both string and array formats
        const parseImages = (images: any): string[] => {
          if (!images) return [];
          if (Array.isArray(images)) return images;
          if (typeof images === 'string') {
            try {
              const parsed = JSON.parse(images);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          }
          return [];
        };

        const initialImages = parseImages(propertyData?.images);

        return (
          <Formik
            initialValues={{ value: initialImages }}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue, handleSubmit }) => {
              const handleAddPhoto = () => {
                pickPropertyImage(
                  values.value, 
                  "value", 
                  setFieldValue, 
                  user?.accessToken,
                  (status, message) => {
                    setUploadStatus(status);
                    if (status === 'error' && message) {
                      Alert.alert(t('editProperty.uploadError', 'Upload Failed'), message);
                    } else if (status === 'success') {
                      // Success feedback handled by image appearing
                      setTimeout(() => setUploadStatus('idle'), 2000);
                    }
                  }
                );
              };

              const isUploading = uploadStatus === 'uploading';
              const photoCount = values.value.length;
              const needsMore = photoCount < 5;

              return (
              <View style={styles.formContainer}>
                <Text style={styles.label}>{t('editProperty.steps.photos', 'Photos')}</Text>
                <Text style={styles.subtitle}>
                  {t('editProperty.addPhotosHint', 'Add at least 5 photos to help guests see your property better')}
                </Text>
                
                {/* Photo Grid - Simplified */}
                <View style={styles.photoGrid}>
                  {values.value.map((image: string, index: number) => {
                    const isValidUrl = image && 
                      (image.startsWith('http://') || 
                       image.startsWith('https://') || 
                       image.startsWith('data:image/'));
                    
                    if (!isValidUrl) return null;

                    const isUploadingThis = isUploading && index === values.value.length - 1 && image.startsWith('data:image/');

                    return (
                      <View key={index} style={styles.photoItem}>
                        <View style={styles.imageContainer}>
                          <Image 
                            source={{ uri: image }} 
                            style={styles.photoImage}
                            onError={() => {}}
                            resizeMode="cover"
                          />
                          {isUploadingThis && (
                            <View style={styles.uploadingOverlay}>
                              <ActivityIndicator size="large" color="#FFFFFF" />
                              <Text style={styles.uploadingText}>
                                {t('editProperty.uploading', 'Uploading...')}
                              </Text>
                            </View>
                          )}
                        </View>
                        <TouchableOpacity
                          style={styles.deletePhotoButton}
                          onPress={() => {
                            const isCoverPhoto = index === 0;
                            Alert.alert(
                              t('editProperty.deletePhoto', 'Delete Photo'),
                              isCoverPhoto 
                                ? t('editProperty.deleteCoverPhoto', 'This is your cover photo. Delete it? The next photo will become the cover.')
                                : t('editProperty.deletePhotoConfirm', 'Delete this photo?'),
                              [
                                { text: t('common.cancel', 'Cancel'), style: "cancel" },
                                {
                                  text: t('common.delete', 'Delete'),
                                  style: "destructive",
                                  onPress: () => {
                                    deleteImage.mutate(
                                      { propertyID: route.params.propertyID, imageURL: image },
                                      {
                                        onSuccess: () => {
                                          const newImages = values.value.filter((_, i) => i !== index);
                                          setFieldValue("value", newImages);
                                        },
                                        onError: () => {
                                          Alert.alert(
                                            t('editProperty.error', 'Error'),
                                            t('editProperty.deleteFailed', 'Could not delete photo. Please try again.')
                                          );
                                        }
                                      }
                                    );
                                  }
                                }
                              ]
                            );
                          }}
                        >
                          <MaterialIcons name="close" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                        {index === 0 && (
                          <View style={styles.coverBadge}>
                            <Text style={styles.coverText}>
                              {t('editProperty.coverPhoto', 'Cover')}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                  
                  {/* Add Photo Button - Simple */}
                  {photoCount < 20 && (
                    <TouchableOpacity
                      style={[styles.addPhotoButton, isUploading && styles.addPhotoButtonDisabled]}
                      onPress={handleAddPhoto}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <ActivityIndicator size="small" color="#717171" />
                          <Text style={styles.addPhotoText}>
                            {t('editProperty.uploading', 'Uploading...')}
                          </Text>
                        </>
                      ) : (
                        <>
                          <MaterialIcons name="add" size={28} color="#717171" />
                          <Text style={styles.addPhotoText}>
                            {t('editProperty.addPhoto', 'Add Photo')}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Simple Photo Count */}
                <View style={styles.photoCountBox}>
                  <Text style={styles.photoCountText}>
                    {photoCount} {photoCount === 1 ? t('editProperty.photoCount', 'photo') : t('editProperty.photoCount_other', 'photos')}
                    {needsMore && (
                      <Text style={styles.photoCountNeeded}>
                        {' • '}{t('editProperty.addMore', 'Add {{count}} more', { count: 5 - photoCount })}
                      </Text>
                    )}
                  </Text>
                </View>

                {/* Warning if less than 5 photos */}
                {needsMore && photoCount > 0 && (
                  <View style={styles.warningBox}>
                    <MaterialIcons name="info" size={18} color="#F59E0B" />
                    <Text style={styles.warningText}>
                      {t('editProperty.recommendedPhotos', 'We recommend adding {{count}} more photos for better visibility', { count: 5 - photoCount })}
                    </Text>
                  </View>
                )}
                
                {/* Save Button - Always visible and enabled if photos exist */}
                <Button 
                  style={[styles.saveButton, photoCount === 0 && styles.saveButtonDisabled]} 
                  onPress={() => handleSubmit()}
                  disabled={photoCount === 0}
                >
                  {photoCount === 0
                    ? t('editProperty.addAtLeastOne', 'Add at least one photo')
                    : t('common.save', 'Save')
                  }
                </Button>
              </View>
              );
            }}
          </Formik>
        );

      default:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Cette section sera bientôt disponible</Text>
          </View>
        );
    }
  };

  return (
    <Screen
    style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#222222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getStepTitle()}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderStepContent()}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 2,
    // elevation: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F7F7F7",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  label: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 16,
    color: "#717171",
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: "400",
  },
  input: {
    fontSize: 20,
    fontWeight: "500",
    color: "#222222",
    paddingVertical: 20,
    paddingHorizontal: 0,
    borderBottomWidth: 2,
    borderBottomColor: "#E5E5E5",
    backgroundColor: "transparent",
    letterSpacing: -0.3,
  },
  textArea: {
    height: 140,
    textAlignVertical: "top",
    fontSize: 18,
    lineHeight: 26,
  },
  errorText: {
    color: "#FF5A5F",
    fontSize: 16,
    marginTop: 12,
    fontWeight: "500",
  },
  saveButton: {
    marginTop: 40,
    backgroundColor: "#222222",
    borderColor: "#222222",
    borderRadius: 12,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  amenitiesContainer: {
    maxHeight: 500,
    marginBottom: 32,
  },
  amenityChip: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E5E5",
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  amenityChipSelected: {
    backgroundColor: "#222222",
    borderColor: "#222222",
  },
  amenityText: {
    fontSize: 18,
    color: "#222222",
    fontWeight: "500",
  },
  amenityTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  addPhotoButton: {
    width: "48%",
    height: 120,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E5E5E5",
    borderStyle: "dashed",
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
    marginBottom: 12,
  },
  addPhotoButtonDisabled: {
    opacity: 0.6,
    borderColor: "#C0C0C0",
  },
  addPhotoText: {
    fontSize: 14,
    color: "#717171",
    marginTop: 8,
    fontWeight: "500",
  },
  // Photo Grid Styles
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  photoItem: {
    width: "48%",
    height: 120,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "visible",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  deletePhotoButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  coverBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  coverText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  photoStats: {
    backgroundColor: "#F7F7F7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  photoStatsText: {
    fontSize: 14,
    color: "#717171",
    textAlign: "center",
    fontWeight: "500",
  },
  photoCountBox: {
    backgroundColor: "#F7F7F7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  photoCountText: {
    fontSize: 15,
    color: "#222222",
    textAlign: "center",
    fontWeight: "500",
  },
  photoCountNeeded: {
    color: "#F59E0B",
    fontWeight: "600",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  reorderInstructions: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  reorderText: {
    fontSize: 14,
    color: "#717171",
    marginLeft: 8,
    flex: 1,
  },
  saveButtonDisabled: {
    backgroundColor: "#E5E5E5",
    borderColor: "#E5E5E5",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationButtonText: {
    fontSize: 18,
    color: "#222222",
    marginLeft: 12,
    fontWeight: "600",
  },
  searchContainer: {
    marginBottom: 24,
  },
  locationDisplay: {
    padding: 24,
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  locationSubText: {
    fontSize: 16,
    color: "#717171",
    fontWeight: "500",
  },
  mapContainer: {
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  map: {
    flex: 1,
  },
  optionsContainer: {
    marginBottom: 32,
  },
  optionButton: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E5E5",
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionButtonSelected: {
    borderColor: "#222222",
    backgroundColor: "#222222",
  },
  optionText: {
    fontSize: 18,
    color: "#222222",
    fontWeight: "500",
    letterSpacing: -0.3,
  },
  optionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  optionDescription: {
    fontSize: 14,
    color: "#717171",
    marginTop: 4,
    lineHeight: 20,
  },
  optionDescriptionSelected: {
    color: "#FFFFFF",
    opacity: 0.9,
  },
  capacityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  capacityLabel: {
    fontSize: 18,
    color: "#222222",
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  capacitySubLabel: {
    fontSize: 14,
    color: "#717171",
    marginTop: 2,
    fontWeight: "400",
  },
  capacityInput: {
    fontSize: 18,
    color: "#222222",
    textAlign: "right",
    minWidth: 80,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    backgroundColor: "#F7F7F7",
    fontWeight: "600",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#E5E5E5",
    paddingVertical: 20,
    marginBottom: 24,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    marginRight: 12,
  },
  priceInput: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    flex: 1,
    paddingVertical: 0,
    letterSpacing: -0.5,
  },
  priceInfo: {
    backgroundColor: "#F7F7F7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  priceInfoText: {
    fontSize: 14,
    color: "#717171",
    lineHeight: 20,
    fontWeight: "500",
  },
});
