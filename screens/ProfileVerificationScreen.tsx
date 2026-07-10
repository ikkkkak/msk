import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput, Image, Alert } from "react-native";
import { Text, Button } from "@ui-kitten/components";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { Formik } from "formik";
import { useState } from "react";
import * as yup from "yup";

import { Screen } from "../components/Screen";
import { useUser } from "../hooks/useUser";
import { pickImage } from "../utils/pickImage";
import { theme } from "../theme";
import { useSubmitVerificationMutation } from "../hooks/mutations/useSubmitVerificationMutation";

export const ProfileVerificationScreen = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const TOTAL_STEPS = 3;

  const getStepTitle = () => {
    const titles = {
      1: "Vérification d'identité",
      2: "Pièce d'identité",
      3: "Confirmation"
    };
    return titles[step as keyof typeof titles] || "";
  };

  const getStepSubtitle = () => {
    const subtitles = {
      1: "Vérifiez votre identité pour devenir un hôte vérifié et gagner la confiance des voyageurs",
      2: "Prenez une photo claire de votre pièce d'identité officielle",
      3: "Vérifiez vos informations avant de soumettre votre demande de vérification"
    };
    return subtitles[step as keyof typeof subtitles] || "";
  };

  const initialValues = {
    fullName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
    idNumber: "",
    idType: "",
    idFrontImage: "",
    idBackImage: "",
    selfieImage: "",
  };

  const validationSchema = yup.object().shape({
    fullName: yup.string().required("Le nom complet est requis"),
    idNumber: yup.string().required("Le numéro de pièce d'identité est requis"),
    idType: yup.string().required("Le type de pièce d'identité est requis"),
    idFrontImage: yup.string().required("La photo de la pièce d'identité est requise"),
    idBackImage: yup.string().required("La photo du dos de la pièce d'identité est requise"),
    selfieImage: yup.string().required("La photo selfie est requise"),
  });

  const canContinue = (values: any) => {
    switch (step) {
      case 1: return !!values.fullName && !!values.idNumber && !!values.idType;
      case 2: return !!values.idFrontImage && !!values.idBackImage && !!values.selfieImage;
      case 3: return true;
      default: return true;
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

  const submitVerification = useSubmitVerificationMutation();

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      await submitVerification.mutateAsync({
        idType: values.idType,
        idNumber: values.idNumber,
        idFrontImage: values.idFrontImage,
        idBackImage: values.idBackImage,
        selfieImage: values.selfieImage,
      });
      
      Alert.alert(
        "Demande soumise !", 
        "Votre demande de vérification a été soumise avec succès. Nous vous contacterons dans les 24-48 heures.",
        [
          {
            text: "Compris",
            onPress: () => navigation.goBack(),
          }
        ]
      );
    } catch (error) {
      Alert.alert("Erreur", "Impossible de soumettre votre demande. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const idTypes = [
    { label: "Carte d'identité nationale", value: "national_id" },
    { label: "Passeport", value: "passport" },
    { label: "Permis de conduire", value: "drivers_license" },
  ];

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#222222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vérification d'identité</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{step}/{TOTAL_STEPS}</Text>
      </View>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, setFieldValue, handleSubmit }) => (
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>{getStepTitle()}</Text>
              <Text style={styles.stepSubtitle}>{getStepSubtitle()}</Text>

              {/* Step 1: Personal Information */}
              {step === 1 && (
                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Nom complet</Text>
                    <TextInput
                      style={styles.input}
                      value={values.fullName}
                      onChangeText={handleChange("fullName")}
                      onBlur={handleBlur("fullName")}
                      placeholder="Votre nom complet tel qu'il apparaît sur votre pièce d'identité"
                      placeholderTextColor="#999999"
                    />
                    {touched.fullName && errors.fullName && (
                      <Text style={styles.fieldError}>{errors.fullName}</Text>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Type de pièce d'identité</Text>
                    <View style={styles.optionsContainer}>
                      {idTypes.map((type) => (
                        <TouchableOpacity
                          key={type.value}
                          style={[
                            styles.optionButton,
                            values.idType === type.value && styles.optionButtonSelected,
                          ]}
                          onPress={() => setFieldValue("idType", type.value)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              values.idType === type.value && styles.optionTextSelected,
                            ]}
                          >
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {touched.idType && errors.idType && (
                      <Text style={styles.fieldError}>{errors.idType}</Text>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Numéro de pièce d'identité</Text>
                    <TextInput
                      style={styles.input}
                      value={values.idNumber}
                      onChangeText={handleChange("idNumber")}
                      onBlur={handleBlur("idNumber")}
                      placeholder="Entrez le numéro de votre pièce d'identité"
                      placeholderTextColor="#999999"
                    />
                    {touched.idNumber && errors.idNumber && (
                      <Text style={styles.fieldError}>{errors.idNumber}</Text>
                    )}
                  </View>

                  <View style={styles.securityNotice}>
                    <MaterialIcons name="security" size={24} color="#1F8A70" />
                    <View style={styles.securityText}>
                      <Text style={styles.securityTitle}>Vos informations sont sécurisées</Text>
                      <Text style={styles.securityDescription}>
                        Nous utilisons un cryptage de niveau bancaire pour protéger vos données personnelles
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Step 2: Document Photos */}
              {step === 2 && (
                <View style={styles.formContainer}>
                  <View style={styles.photoSection}>
                    <Text style={styles.photoLabel}>Photo de la pièce d'identité (recto)</Text>
                    <TouchableOpacity 
                      style={styles.photoButton}
                      onPress={async () => {
                        await pickImage([], "idFrontImage", (field: string, vals: any) => {
                          setFieldValue(field, vals[0] || "");
                        });
                      }}
                    >
                      {values.idFrontImage ? (
                        <Image source={{ uri: values.idFrontImage }} style={styles.photo} />
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <MaterialIcons name="add-a-photo" size={32} color="#717171" />
                          <Text style={styles.photoText}>Prendre une photo</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    {touched.idFrontImage && errors.idFrontImage && (
                      <Text style={styles.fieldError}>{errors.idFrontImage}</Text>
                    )}
                  </View>

                  <View style={styles.photoSection}>
                    <Text style={styles.photoLabel}>Photo de la pièce d'identité (verso)</Text>
                    <TouchableOpacity 
                      style={styles.photoButton}
                      onPress={async () => {
                        await pickImage([], "idBackImage", (field: string, vals: any) => {
                          setFieldValue(field, vals[0] || "");
                        });
                      }}
                    >
                      {values.idBackImage ? (
                        <Image source={{ uri: values.idBackImage }} style={styles.photo} />
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <MaterialIcons name="add-a-photo" size={32} color="#717171" />
                          <Text style={styles.photoText}>Prendre une photo</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    {touched.idBackImage && errors.idBackImage && (
                      <Text style={styles.fieldError}>{errors.idBackImage}</Text>
                    )}
                  </View>

                  <View style={styles.photoSection}>
                    <Text style={styles.photoLabel}>Photo selfie</Text>
                    <Text style={styles.photoSubtitle}>Prenez un selfie pour confirmer votre identité</Text>
                    <TouchableOpacity 
                      style={styles.photoButton}
                      onPress={async () => {
                        await pickImage([], "selfieImage", (field: string, vals: any) => {
                          setFieldValue(field, vals[0] || "");
                        });
                      }}
                    >
                      {values.selfieImage ? (
                        <Image source={{ uri: values.selfieImage }} style={styles.photo} />
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <MaterialIcons name="face" size={32} color="#717171" />
                          <Text style={styles.photoText}>Prendre un selfie</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    {touched.selfieImage && errors.selfieImage && (
                      <Text style={styles.fieldError}>{errors.selfieImage}</Text>
                    )}
                  </View>

                  <View style={styles.photoGuidelines}>
                    <MaterialIcons name="info" size={20} color="#FF8C00" />
                    <Text style={styles.guidelinesText}>
                      Assurez-vous que toutes les informations sont clairement visibles et que la photo n'est pas floue
                    </Text>
                  </View>
                </View>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 && (
                <View style={styles.formContainer}>
                  <View style={styles.confirmationCard}>
                    <MaterialIcons name="verified-user" size={48} color="#1F8A70" />
                    <Text style={styles.confirmationTitle}>Vérification d'identité</Text>
                    <Text style={styles.confirmationSubtitle}>
                      Votre demande de vérification sera traitée dans les 24-48 heures
                    </Text>
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>Informations soumises :</Text>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Nom complet :</Text>
                      <Text style={styles.infoValue}>{values.fullName}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Type de pièce :</Text>
                      <Text style={styles.infoValue}>
                        {idTypes.find(t => t.value === values.idType)?.label}
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Numéro :</Text>
                      <Text style={styles.infoValue}>{values.idNumber}</Text>
                    </View>
                  </View>

                  <View style={styles.termsContainer}>
                    <MaterialIcons name="check-circle" size={20} color="#1F8A70" />
                    <Text style={styles.termsText}>
                      En soumettant cette demande, vous confirmez que les informations fournies sont exactes et que vous acceptez nos conditions de vérification d'identité.
                    </Text>
                  </View>
                </View>
              )}

              {/* Navigation Buttons */}
              <View style={styles.navigationContainer}>
                {step > 1 && (
                  <TouchableOpacity 
                    style={styles.backButtonNav}
                    onPress={handleBack}
                  >
                    <Text style={styles.backButtonText}>Précédent</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  style={[
                    styles.nextButton,
                    (!canContinue(values) || isSubmitting) && styles.nextButtonDisabled
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
                    <Text style={styles.nextButtonText}>Soumission...</Text>
                  ) : (
                    <Text style={styles.nextButtonText}>
                      {step === TOTAL_STEPS ? "Soumettre la demande" : "Continuer"}
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
    borderBottomColor: "#E5E5E5",
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
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#F7F7F7",
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#E5E5E5",
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: 4,
    backgroundColor: "#222222",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#717171",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  stepContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: "#717171",
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: "400",
  },
  formContainer: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 8,
    letterSpacing: -0.3,
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
    letterSpacing: -0.3,
  },
  optionsContainer: {
    marginBottom: 8,
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E5E5",
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  optionButtonSelected: {
    borderColor: "#222222",
    backgroundColor: "#222222",
  },
  optionText: {
    fontSize: 16,
    color: "#222222",
    fontWeight: "500",
  },
  optionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "#F0F9F4",
    borderRadius: 12,
    marginTop: 16,
  },
  securityText: {
    flex: 1,
    marginLeft: 12,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F8A70",
    marginBottom: 4,
  },
  securityDescription: {
    fontSize: 14,
    color: "#1F8A70",
    lineHeight: 20,
  },
  photoSection: {
    marginBottom: 32,
  },
  photoLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  photoSubtitle: {
    fontSize: 14,
    color: "#717171",
    marginBottom: 16,
    fontWeight: "400",
  },
  photoButton: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F7F7F7",
    borderWidth: 2,
    borderColor: "#E5E5E5",
    borderStyle: "dashed",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  photoText: {
    fontSize: 16,
    color: "#717171",
    marginTop: 8,
    fontWeight: "500",
  },
  photoGuidelines: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    marginTop: 16,
  },
  guidelinesText: {
    flex: 1,
    fontSize: 14,
    color: "#FF8C00",
    lineHeight: 20,
    marginLeft: 12,
  },
  confirmationCard: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F0F9F4",
    borderRadius: 16,
    marginBottom: 32,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F8A70",
    marginTop: 16,
    marginBottom: 8,
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: "#1F8A70",
    textAlign: "center",
    lineHeight: 24,
  },
  infoSection: {
    backgroundColor: "#F7F7F7",
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#717171",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#222222",
    fontWeight: "600",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "#F0F9F4",
    borderRadius: 12,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: "#1F8A70",
    lineHeight: 20,
    marginLeft: 12,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
  },
  backButtonNav: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#F7F7F7",
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
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
    elevation: 4,
  },
  nextButtonDisabled: {
    backgroundColor: "#E5E5E5",
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  fieldError: {
    color: "#FF5A5F",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
});
