import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert
} from "react-native";
import { Text, Button } from "@ui-kitten/components";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { Formik } from "formik";
import { useState, useRef } from "react";
import * as yup from "yup";
import { useTranslation } from "react-i18next";

import { Screen } from "../components/Screen";
import { useUser } from "../hooks/useUser";
import { useHostProfile } from "../hooks/useHostProfile";
import { pickImage } from "../utils/pickImage";
import { theme } from "../theme";
import { useUpdateUserProfileMutation } from "../hooks/mutations/useUpdateUserProfileMutation";
import { useCreateOrUpdateProfile } from "../hooks/queries/useUserProfile";
import { useQueryClient } from "@tanstack/react-query";

export const ProfileCreationScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useUser();
  const { profile, updateProfile, isLoading } = useHostProfile();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const TOTAL_STEPS = 4;

  const getStepTitle = () => {
    const titles = {
      1: t("profile.steps.profilePhoto"),
      2: t("profile.steps.personalInfo"),
      3: t("profile.steps.aboutYou"),
      4: t("profile.steps.languages")
    };
    return titles[step as keyof typeof titles] || "";
  };

  const getStepSubtitle = () => {
    const subtitles = {
      1: t("profile.steps.profilePhotoSubtitle"),
      2: t("profile.steps.personalInfoSubtitle"),
      3: t("profile.steps.aboutYouSubtitle"),
      4: t("profile.steps.languagesSubtitle")
    };
    return subtitles[step as keyof typeof subtitles] || "";
  };

  const languages = [
    "Français",
    "Anglais",
    "Arabe",
    "Espagnol",
    "Italien",
    "Allemand",
    "Portugais",
    "Russe",
    "Chinois",
    "Japonais",
    "Coréen",
    "Hindi"
  ];

  const initialValues = {
    avatarURL: profile.avatarURL || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    dateOfBirth: user?.dateOfBirth || "",
    bio: profile.bio || "",
    languages: profile.languages || []
  };

  const validationSchema = yup.object().shape({
    avatarURL: yup.string().required(t("profile.validation.avatarRequired")),
    firstName: yup
      .string()
      .required(t("profile.validation.firstNameRequired"))
      .min(2, t("profile.validation.firstNameMinLength")),
    lastName: yup
      .string()
      .required(t("profile.validation.lastNameRequired"))
      .min(2, t("profile.validation.lastNameMinLength")),
    dateOfBirth: yup
      .string()
      .required(t("profile.validation.dateOfBirthRequired")),
    bio: yup
      .string()
      .required(t("profile.validation.bioRequired"))
      .min(50, t("profile.validation.bioMinLength")),
    languages: yup.array().min(1, t("profile.validation.languagesRequired"))
  });

  const canContinue = (values: any) => {
    switch (step) {
      case 1:
        return !!values.avatarURL;
      case 2:
        return !!values.firstName && !!values.lastName && !!values.dateOfBirth;
      case 3:
        return !!values.bio && values.bio.length >= 50;
      case 4:
        return values.languages && values.languages.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const updateUserProfile = useUpdateUserProfileMutation();
  const createOrUpdateProfile = useCreateOrUpdateProfile();

  const handleSubmit = async (values: any) => {
    if (!user) return;

    console.log("ProfileCreation - Submitting values:", values);
    console.log(
      "ProfileCreation - FirstName:",
      values.firstName,
      "LastName:",
      values.lastName
    );

    setIsSubmitting(true);
    try {
      // Use new profile system
      const profileData = {
        firstName: values.firstName,
        lastName: values.lastName,
        avatarURL: values.avatarURL,
        dateOfBirth: values.dateOfBirth,
        bio: values.bio,
        languages: values.languages,
        skills: [],
        location: values.location || "",
        interests: values.interests || [],
        occupation: values.occupation || "",
        company: values.company || "",
        website: values.website || "",
        instagram: values.instagram || "",
        twitter: values.twitter || "",
        linkedin: values.linkedin || "",
        travelStyle: values.travelStyle || "",
        accommodationType: values.accommodationType || "",
        isPublic: true
      };

      console.log("ProfileCreation - Sending to new profile API:", profileData);

      await createOrUpdateProfile.mutateAsync(profileData);

      // Also update local profile
      await updateProfile({
        avatarURL: values.avatarURL,
        firstName: values.firstName,
        lastName: values.lastName,
        dateOfBirth: values.dateOfBirth,
        bio: values.bio,
        languages: values.languages
      });

      // Invalidate user queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["profileStatus"] });

      Alert.alert(t("profile.success.title"), t("profile.success.message"), [
        {
          text: t("common.continue"),
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      Alert.alert(t("common.error"), t("profile.error.saveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#222222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("profile.creation.title")}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(step / TOTAL_STEPS) * 100}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {step}/{TOTAL_STEPS}
        </Text>
      </View>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          setFieldValue,
          handleSubmit
        }) => (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>{getStepTitle()}</Text>
              <Text style={styles.stepSubtitle}>{getStepSubtitle()}</Text>

              {/* Step 1: Profile Photo */}
              {step === 1 && (
                <View style={styles.photoContainer}>
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={async () => {
                      await pickImage(
                        [],
                        "avatarURL",
                        (field: string, vals: any) => {
                          setFieldValue(field, vals[0] || "");
                        }
                      );
                    }}
                  >
                    {values.avatarURL ? (
                      <Image
                        source={{ uri: values.avatarURL }}
                        style={styles.photo}
                      />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <MaterialIcons
                          name="camera-alt"
                          size={48}
                          color="#717171"
                        />
                        <Text style={styles.photoText}>
                          {t("profile.creation.addPhoto", "Ajouter une photo")}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {touched.avatarURL && errors.avatarURL && (
                    <Text style={styles.errorText}>{errors.avatarURL}</Text>
                  )}
                </View>
              )}

              {/* Step 2: Personal Information */}
              {step === 2 && (
                <View style={styles.formContainer}>
                  <View style={styles.nameRow}>
                    <View style={styles.nameInputContainer}>
                      <Text style={styles.inputLabel}>
                        {t("profile.creation.firstName", "Prénom")}
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={values.firstName}
                        onChangeText={handleChange("firstName")}
                        onBlur={handleBlur("firstName")}
                        placeholder={t(
                          "profile.creation.firstNamePlaceholder",
                          "Votre prénom"
                        )}
                        placeholderTextColor="#999999"
                      />
                      {touched.firstName && errors.firstName && (
                        <Text style={styles.fieldError}>
                          {errors.firstName}
                        </Text>
                      )}
                    </View>
                    <View style={styles.nameInputContainer}>
                      <Text style={styles.inputLabel}>
                        {t("profile.creation.lastName", "Nom")}
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={values.lastName}
                        onChangeText={handleChange("lastName")}
                        onBlur={handleBlur("lastName")}
                        placeholder={t(
                          "profile.creation.lastNamePlaceholder",
                          "Votre nom"
                        )}
                        placeholderTextColor="#999999"
                      />
                      {touched.lastName && errors.lastName && (
                        <Text style={styles.fieldError}>{errors.lastName}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>
                      {t("profile.creation.dateOfBirth", "Date de naissance")}
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={values.dateOfBirth}
                      onChangeText={handleChange("dateOfBirth")}
                      onBlur={handleBlur("dateOfBirth")}
                      placeholder={t(
                        "profile.creation.dateOfBirthPlaceholder",
                        "JJ/MM/AAAA"
                      )}
                      placeholderTextColor="#999999"
                    />
                    {touched.dateOfBirth && errors.dateOfBirth && (
                      <Text style={styles.fieldError}>
                        {errors.dateOfBirth}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Step 3: Bio */}
              {step === 3 && (
                <View style={styles.formContainer}>
                  <Text style={styles.inputLabel}>
                    {t("profile.creation.bio", "Parlez de vous")}
                  </Text>
                  <TextInput
                    style={[styles.input, styles.bioInput]}
                    value={values.bio}
                    onChangeText={handleChange("bio")}
                    onBlur={handleBlur("bio")}
                    placeholder={t(
                      "profile.creation.bioPlaceholder",
                      "Décrivez-vous, vos passions, votre expérience d'hôte... (minimum 50 caractères)"
                    )}
                    placeholderTextColor="#999999"
                    multiline
                    numberOfLines={6}
                    maxLength={500}
                  />
                  <Text style={styles.charCount}>{values.bio.length}/500</Text>
                  {touched.bio && errors.bio && (
                    <Text style={styles.fieldError}>{errors.bio}</Text>
                  )}
                </View>
              )}

              {/* Step 4: Languages */}
              {step === 4 && (
                <View style={styles.formContainer}>
                  <Text style={styles.inputLabel}>
                    {t("profile.creation.languages", "Langues parlées")}
                  </Text>
                  <Text style={styles.languageSubtitle}>
                    {t(
                      "profile.creation.languagesSubtitle",
                      "Sélectionnez toutes les langues que vous parlez"
                    )}
                  </Text>
                  <View style={styles.languagesContainer}>
                    {languages.map((language) => {
                      const isSelected = values.languages.includes(language);
                      return (
                        <TouchableOpacity
                          key={language}
                          style={[
                            styles.languageChip,
                            isSelected && styles.languageChipSelected
                          ]}
                          onPress={() => {
                            const newLanguages = isSelected
                              ? values.languages.filter(
                                  (l: string) => l !== language
                                )
                              : [...values.languages, language];
                            setFieldValue("languages", newLanguages);
                          }}
                        >
                          <Text
                            style={[
                              styles.languageText,
                              isSelected && styles.languageTextSelected
                            ]}
                          >
                            {language}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {touched.languages && errors.languages && (
                    <Text style={styles.fieldError}>{errors.languages}</Text>
                  )}
                </View>
              )}

              {/* Navigation Buttons */}
              <View style={styles.navigationContainer}>
                {step > 1 && (
                  <TouchableOpacity
                    style={styles.backButtonNav}
                    onPress={handleBack}
                  >
                    <Text style={styles.backButtonText}>
                      {t("profile.creation.previous", "Précédent")}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    (!canContinue(values) || isSubmitting) &&
                      styles.nextButtonDisabled
                  ]}
                  disabled={!canContinue(values) || isSubmitting}
                  onPress={() => {
                    if (step === TOTAL_STEPS) {
                      handleSubmit();
                    } else {
                      handleNext();
                    }
                  }}
                >
                  {isSubmitting ? (
                    <Text style={styles.nextButtonText}>
                      {t("profile.creation.creating", "Création...")}
                    </Text>
                  ) : (
                    <Text style={styles.nextButtonText}>
                      {step === TOTAL_STEPS
                        ? t("profile.creation.createProfile", "Créer le profil")
                        : t("profile.creation.continue", "Continuer")}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </Formik>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5"
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F7F7F7"
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    letterSpacing: -0.5
  },
  placeholder: {
    width: 40
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#F7F7F7"
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#E5E5E5",
    borderRadius: 2,
    marginRight: 12
  },
  progressFill: {
    height: 4,
    backgroundColor: "#222222",
    borderRadius: 2
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#717171"
  },
  content: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 40
  },
  stepContainer: {
    paddingHorizontal: 24,
    paddingTop: 32
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
    letterSpacing: -0.8
  },
  stepSubtitle: {
    fontSize: 16,
    color: "#717171",
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: "400"
  },
  photoContainer: {
    alignItems: "center",
    marginBottom: 32
  },
  photoButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    backgroundColor: "#F7F7F7"
  },
  photo: {
    width: "100%",
    height: "100%"
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  photoText: {
    fontSize: 14,
    color: "#717171",
    marginTop: 8,
    fontWeight: "500"
  },
  formContainer: {
    marginBottom: 32
  },
  nameRow: {
    flexDirection: "row",
    marginBottom: 24
  },
  nameInputContainer: {
    flex: 1,
    marginRight: 12
  },
  inputContainer: {
    marginBottom: 24
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 8,
    letterSpacing: -0.3
  },
  languageSubtitle: {
    fontSize: 14,
    color: "#717171",
    marginBottom: 16,
    fontWeight: "400"
  },
  input: {
    fontSize: 18,
    fontWeight: "500",
    color: "#222222",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    letterSpacing: -0.3
  },
  bioInput: {
    height: 120,
    textAlignVertical: "top",
    fontSize: 16,
    lineHeight: 24
  },
  charCount: {
    fontSize: 12,
    color: "#717171",
    textAlign: "right",
    marginTop: 4
  },
  languagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16
  },
  languageChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#E5E5E5",
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#FFFFFF"
  },
  languageChipSelected: {
    backgroundColor: "#222222",
    borderColor: "#222222"
  },
  languageText: {
    fontSize: 16,
    color: "#222222",
    fontWeight: "500"
  },
  languageTextSelected: {
    color: "#FFFFFF"
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40
  },
  backButtonNav: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#F7F7F7"
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222"
  },
  nextButton: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#222222",
    alignItems: "center",
    marginLeft: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  nextButtonDisabled: {
    backgroundColor: "#E5E5E5",
    shadowOpacity: 0,
    elevation: 0
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.3
  },
  errorText: {
    color: "#FF5A5F",
    fontSize: 14,
    marginTop: 8,
    fontWeight: "500"
  },
  fieldError: {
    color: "#FF5A5F",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500"
  }
});
