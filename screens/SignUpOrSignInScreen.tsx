import { View, StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";
import LottieView from "lottie-react-native";

import { Screen } from "../components/Screen";
import { SignUpAndSignInButtons } from "../components/SignUpAndSignInButtons";

export const SignUpOrSignInScreen = () => {
  const { t } = useTranslation();

  return (
    <Screen>
      <View style={styles.container}>
        <LottieView
          autoPlay
          style={styles.lottie}
          source={require("../assets/lotties/AddProperty.json")}
        />

        <Text style={styles.title}>
          {t(
            "account.signUpOrSignIn.title",
            "Create an account or sign in",
          )}
        </Text>
        <Text style={styles.subtitle}>
          {t(
            "account.signUpOrSignIn.subtitle",
            "Sign in to manage your listings, upload videos, and access host tools.",
          )}
        </Text>

        <SignUpAndSignInButtons />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
  },
  lottie: {
    marginBottom: 40,
    height: 250,
    width: 250,
    alignSelf: "center",
  },
  title: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#161616",
    letterSpacing: -0.3,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 15,
    color: "#6B6B6B",
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
});
