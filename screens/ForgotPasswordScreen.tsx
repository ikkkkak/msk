import { StyleSheet } from "react-native";
import { Input, Button, Text } from "@ui-kitten/components";
import * as yup from "yup";
import { Formik } from "formik";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Screen } from "../components/Screen";
import { ModalHeader } from "../components/ModalHeader";
import { useLoading } from "../hooks/useLoading";
import { forgotPassword } from "../services/user";

export const ForgotPasswordScreen = () => {
  const { t } = useTranslation();
  const [emailSent, setEmailSent] = useState(false);
  const { setLoading } = useLoading();

  const handleSubmit = async (values: { email: string }) => {
    try {
      setLoading(true);
      const emailSent = await forgotPassword(values.email);
      if (emailSent?.emailSent) setEmailSent(true);
    } catch (error) {
      alert("Error placing email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView bounces={false}>
      <Screen style={styles.container}>
        <ModalHeader text="habitat" xShown />
        {emailSent ? (
          <>
            <Text category={"h5"} style={styles.header}>
              {t('forgotPassword.emailSent')}
            </Text>
            <Text>
              {t('forgotPassword.emailSentMessage')}
            </Text>
          </>
        ) : (
          <>
            <Text category={"h5"} style={styles.header}>
              {t('forgotPassword.title')}
            </Text>
            <Text>
              {t('forgotPassword.subtitle')}
              password.
            </Text>
            <Formik
              initialValues={{
                email: "",
              }}
              validationSchema={yup.object().shape({
                email: yup.string().email().required(t('auth.validation.emailRequired')),
              })}
              onSubmit={handleSubmit}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleSubmit,
                isSubmitting,
                setFieldTouched,
                setFieldValue,
              }) => {
                return (
                  <>
                    <Input
                      style={styles.input}
                      value={values.email}
                      onChangeText={handleChange("email")}
                      placeholder={t('auth.emailPlaceholder')}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      label={t('auth.email')}
                      onBlur={() => setFieldTouched("email")}
                      caption={
                        touched.email && errors.email ? errors.email : undefined
                      }
                      status={
                        touched.email && errors.email ? "danger" : "basic"
                      }
                    />

                    <Button
                      style={styles.button}
                      onPress={() => handleSubmit()}
                    >
                      {t('common.continue')}
                    </Button>
                  </>
                );
              }}
            </Formik>
          </>
        )}
      </Screen>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  container: { marginHorizontal: 10 },
  header: { textAlign: "center", marginVertical: 20 },
  button: { marginTop: 20 },
  input: {
    marginTop: 10,
  },
});
