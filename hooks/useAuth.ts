import { useNavigation } from "@react-navigation/native";
import * as AuthSession from "expo-auth-session";
import * as Facebook from "expo-auth-session/providers/facebook";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect } from "react";

import {
  appleLoginOrRegister,
  facebookLoginOrRegister,
  facebookLoginWithCode,
  googleLoginOrRegister,
  loginUser,
  loginUserPhone,
  registerUser,
  registerUserPhone,
} from "../services/user";
import { User } from "../types/user";
import { useUser } from "./useUser";
import { useLoading } from "./useLoading";
import { consumePostAuthPropertyDetailsRoute } from "../utils/authReturnNavigation";
import { useToast } from "../context/ToastContext";
import i18n from "../i18n";

const AUTH_TOAST_MS = 480;

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

type AuthToastEvent = "login" | "signup";

function authToastMessage(user: User, event: AuthToastEvent): string {
  if (event === "signup") {
    return i18n.t(
      "auth.toast.accountCreated",
      "Account created successfully!",
    );
  }
  const name = user.firstName?.trim();
  if (name) {
    return i18n.t("auth.toast.welcomeBack", {
      name,
      defaultValue: `Welcome back, ${name}!`,
    });
  }
  return i18n.t("auth.toast.welcomeBackGeneric", "Welcome back!");
}

export const useAuth = () => {
  const [_, googleResponse, googleAuth] = Google.useAuthRequest({
    expoClientId:
      "1080382822276-eqklp58m1q9fl85m7aj89n1ofp8bdj7p.apps.googleusercontent.com",
    iosClientId:
      "1080382822276-a0ms51p5cfc523bivhchs8nk04u2scq0.apps.googleusercontent.com",
    androidClientId:
      "1080382822276-dqohv9donltabnijor1uun2765hstr4v.apps.googleusercontent.com",
    webClientId: "GOOGLE_GUID.apps.googleusercontent.com",
    selectAccount: true,
  });

  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: "723313165600806",
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  useEffect(() => {
    async function loginUserWithGoogle(access_token: string) {
      try {
        setLoading(true);

        const user = await googleLoginOrRegister(access_token);
        handleSignInUser(user);
      } catch (error) {
        handleAuthError();
      } finally {
        setLoading(false);
      }
    }

    if (googleResponse?.type === "success") {
      const { access_token } = googleResponse.params;
      void loginUserWithGoogle(access_token);
    }
  }, [googleResponse]);

  const { login } = useUser();
  const navigation = useNavigation();
  const { setLoading } = useLoading();
  const { showToast } = useToast();

  const handleSignInUser = async (
    user?: User | null,
    toastEvent?: AuthToastEvent,
  ) => {
    if (!user) return;

    if (toastEvent) {
      showToast(authToastMessage(user, toastEvent), "success");
      await delay(AUTH_TOAST_MS);
    }

    await login(user);
    const postAuth = consumePostAuthPropertyDetailsRoute();
    try {
      if (postAuth) {
        (navigation as any).reset({
          index: 1,
          routes: [{ name: "Root" }, postAuth],
        });
      } else {
        (navigation as any).reset({
          index: 0,
          routes: [{ name: "Root" }],
        });
      }
    } catch (error) {
      console.error("Navigation error:", error);
      (navigation as any).goBack();
    }
  };

  const handleAuthError = () => alert("Unable to authorize");

  const nativeRegister = async (values: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    try {
      setLoading(true);

      const user = await registerUser(
        values.firstName,
        values.lastName,
        values.email,
        values.password
      );
      await handleSignInUser(user, "signup");
    } catch (error) {
      handleAuthError();
    } finally {
      setLoading(false);
    }
  };

  const nativeLogin = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);

      const user = await loginUser(values.email, values.password);
      await handleSignInUser(user, "login");
    } catch (error) {
      handleAuthError();
    } finally {
      setLoading(false);
    }
  };

  const nativeRegisterPhone = async (values: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    password: string;
  }) => {
    try {
      setLoading(true);

      const user = await registerUserPhone(
        values.firstName,
        values.lastName,
        values.phoneNumber,
        values.password
      );
      await handleSignInUser(user, "signup");
    } catch (error) {
      handleAuthError();
    } finally {
      setLoading(false);
    }
  };

  const nativeLoginPhone = async (values: { phoneNumber: string; password: string }) => {
    try {
      setLoading(true);

      const user = await loginUserPhone(values.phoneNumber, values.password);
      await handleSignInUser(user, "login");
    } catch (error) {
      handleAuthError();
    } finally {
      setLoading(false);
    }
  };

  const facebookAuth = async () => {
    try {
      const response = await fbPromptAsync();
      if (response.type === "success") {
        setLoading(true);
        const { code, access_token } = response.params;
        let user: User | undefined;

        if (code && fbRequest?.redirectUri) {
          user = await facebookLoginWithCode({
            code,
            code_verifier: fbRequest.codeVerifier ?? undefined,
            redirect_uri: fbRequest.redirectUri,
          });
        } else if (access_token) {
          user = await facebookLoginOrRegister(access_token);
        }

        if (user) await handleSignInUser(user);
      }
    } catch (error) {
      handleAuthError();
    } finally {
      setLoading(false);
    }
  };

  const appleAuth = async () => {
    try {
      const { identityToken } = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });

      if (identityToken) {
        setLoading(true);

        const user = await appleLoginOrRegister(identityToken);
        await handleSignInUser(user);
      }
    } catch (error) {
      handleAuthError();
    } finally {
      setLoading(false);
    }
  };

  return { 
    nativeRegister, 
    nativeLogin, 
    nativeRegisterPhone, 
    nativeLoginPhone, 
    facebookAuth, 
    googleAuth, 
    appleAuth 
  };
};
