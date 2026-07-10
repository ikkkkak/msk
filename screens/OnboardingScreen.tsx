/**
 * ONBOARDING — FINAL v5
 *
 * NavBar:   back button fades + slides in from left (translateX),
 *           pill stays right — NO width layout animation
 *
 * Step 2:   two accordion panels, each with animated maxHeight
 *           city collapses → zone auto-unfolds, show scrollbar,
 *           tap city header to re-open and change selection
 *
 * Step 3:   pill fills full bar until typing starts
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  ArrowLeft,
  ArrowRight,
  CaretDown,
  Compass,
  Eye,
  EyeSlash,
  Heart,
  House,
  Key,
  MapPin,
  MapTrifold,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import axios from "axios";
import { useUser } from "../hooks/useUser";
import {
  checkUserExists,
  loginUser,
  loginUserPhone,
  registerUser,
  registerUserPhone,
} from "../services/user";
import {
  OnboardingIntent,
  onboardingStorage,
} from "../constants/onboardingStorage";
import { endpoints } from "../constants";

const { height: SH } = Dimensions.get("window");
const STEP_ACCOUNT = 3;
const EO = Easing.out(Easing.cubic);
const EIO = Easing.inOut(Easing.cubic);
const DUR = 380;
const PANEL_H = 220; // max height of each accordion panel list

// ─────────────────────────────────────────────────────────────────────────────
// AccordionPanel — animated open/close with real height animation
// ─────────────────────────────────────────────────────────────────────────────
interface AccordionPanelProps {
  label: string;
  value: string; // selected display value, e.g. city name
  isOpen: boolean;
  onToggle: () => void;
  loading: boolean;
  children: React.ReactNode;
  disabled?: boolean; // grayed out (zone before city selected)
}
function AccordionPanel({
  label,
  value,
  isOpen,
  onToggle,
  loading,
  children,
  disabled = false,
}: AccordionPanelProps) {
  const panelH = useSharedValue(0);
  const caretRot = useSharedValue(0);

  useEffect(() => {
    panelH.value = withTiming(isOpen ? PANEL_H : 0, {
      duration: DUR,
      easing: EIO,
    });
    caretRot.value = withTiming(isOpen ? 180 : 0, {
      duration: DUR,
      easing: EIO,
    });
  }, [isOpen]);

  const listStyle = useAnimatedStyle(() => ({
    height: panelH.value,
    overflow: "hidden" as const,
  }));
  const caretStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${caretRot.value}deg` }],
  }));

  return (
    <View style={[ap.wrap, disabled && ap.wrapDisabled]}>
      {/* Header row */}
      <TouchableOpacity
        style={ap.header}
        onPress={disabled ? undefined : onToggle}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <View style={ap.headerLeft}>
          <Text style={[ap.headerLabel, disabled && ap.headerLabelDisabled]}>
            {label}
          </Text>
          {!!value && !disabled && <Text style={ap.headerValue}>{value}</Text>}
        </View>
        {!disabled && (
          <Animated.View style={caretStyle}>
            <CaretDown size={14} color="#888" weight="bold" />
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Divider — only visible when open */}
      {isOpen && <View style={ap.divider} />}

      {/* Animated content */}
      <Animated.View style={listStyle}>
        {loading ? (
          <View style={ap.loadBox}>
            <ActivityIndicator color="#1A1A1A" />
          </View>
        ) : (
          <ScrollView
            style={ap.scroll}
            showsVerticalScrollIndicator
            indicatorStyle="black"
            nestedScrollEnabled
            contentContainerStyle={ap.scrollContent}
          >
            {children}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}
const ap = StyleSheet.create({
  wrap: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#EBEBEB",
    overflow: "hidden",
    marginBottom: 14,
  },
  wrapDisabled: { opacity: 0.4 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  headerLeft: { flex: 1, gap: 2 },
  headerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#AAA",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  headerLabelDisabled: { color: "#CCC" },
  headerValue: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  divider: { height: 1, backgroundColor: "#F0F0EE", marginHorizontal: 18 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 12 },
  loadBox: { paddingVertical: 24, alignItems: "center" },
});

// ─────────────────────────────────────────────────────────────────────────────
// LocationRow — inside accordion
// ─────────────────────────────────────────────────────────────────────────────
function LocationRow({
  name,
  selected,
  onPress,
}: {
  name: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[lr.row, selected && lr.rowOn]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={lr.left}>
        <View style={[lr.dot, selected && lr.dotOn]}>
          <MapPin size={11} color={selected ? "#FFF" : "#AAA"} weight="fill" />
        </View>
        <Text style={[lr.name, selected && lr.nameOn]}>{name}</Text>
      </View>
      {selected && (
        <View style={lr.check}>
          <Text style={lr.checkMark}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
const lr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderRadius: 10,
    marginBottom: 2,
  },
  rowOn: {
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 12,
    marginHorizontal: -4,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F3F1",
    alignItems: "center",
    justifyContent: "center",
  },
  dotOn: { backgroundColor: "rgba(255,255,255,0.15)" },
  name: { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
  nameOn: { color: "#FFF" },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: { color: "#FFF", fontSize: 12, fontWeight: "800" },
});

// ─────────────────────────────────────────────────────────────────────────────
// NavBar — back fades/slides in, pill is always flex:1 on right
// ─────────────────────────────────────────────────────────────────────────────
interface NavBarProps {
  showBack?: boolean;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  bottomInset?: number;
}
function NavBar({
  showBack = false,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  nextLoading = false,
  bottomInset = 0,
}: NavBarProps) {
  const backOp = useSharedValue(showBack ? 1 : 0);
  const backTx = useSharedValue(showBack ? 0 : -16);

  useEffect(() => {
    backOp.value = withTiming(showBack ? 1 : 0, { duration: 360, easing: EIO });
    backTx.value = withTiming(showBack ? 0 : -16, {
      duration: 360,
      easing: EIO,
    });
  }, [showBack]);

  const backStyle = useAnimatedStyle(() => ({
    opacity: backOp.value,
    transform: [{ translateX: backTx.value }],
  }));

  return (
    <View style={[nb.wrap, { paddingBottom: Math.max(bottomInset + 4, 14) }]}>
      <View style={nb.bar}>
        {/* Back circle — fades + slides from left */}
        {showBack && (
          <>
            <Animated.View style={[nb.backWrap, backStyle]}>
              <TouchableOpacity
                style={nb.circle}
                onPress={onBack}
                activeOpacity={0.72}
                disabled={!showBack}
              >
                <ArrowLeft size={17} color="#444" weight="bold" />
              </TouchableOpacity>
            </Animated.View>
            <View style={{ width: 8 }} />
          </>
        )}

        {/* Pill — always fills remaining space */}
        <TouchableOpacity
          style={[nb.pill, nextDisabled && nb.pillOff]}
          onPress={onNext}
          disabled={nextDisabled || nextLoading}
          activeOpacity={0.83}
        >
          {nextLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Text style={nb.pillTxt}>{nextLabel}</Text>
              <ArrowRight size={15} color="#FFF" weight="bold" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
const nb = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 0 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 100,
    padding: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.11,
    shadowRadius: 24,
    elevation: 14,
  },
  backWrap: {
    // fixed size so it never shifts layout — just fades in place
    width: 46,
    height: 46,
    flexShrink: 0,
  },
  circle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F2F2F0",
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 100,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 7,
    minHeight: 46,
  },
  pillOff: { opacity: 0.3 },
  pillTxt: { fontSize: 15, fontWeight: "700", color: "#FFF" },
});

// ─────────────────────────────────────────────────────────────────────────────
// Misc reused
// ─────────────────────────────────────────────────────────────────────────────
function Ghost({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={g.ghost} activeOpacity={0.6}>
      <Text style={g.ghostTxt}>{label}</Text>
    </TouchableOpacity>
  );
}
function IdPill({ type, value }: { type: "email" | "phone"; value: string }) {
  return (
    <View style={g.idPill}>
      <Text style={g.idLabel}>{type === "phone" ? "Phone" : "Email"}</Text>
      <Text style={g.idValue}>
        {type === "phone" ? `+222 ${value}` : value}
      </Text>
    </View>
  );
}
function CardInner({
  title,
  uri,
  price,
  meta,
}: {
  title: string;
  uri: any;
  price: string;
  meta: string;
}) {
  return (
    <>
      <View style={ci.head}>
        <Text style={ci.title}>{title}</Text>
        <Heart size={14} color="#D16024" weight="fill" />
      </View>
      <Image source={uri} style={ci.img} resizeMode="cover" />
      <View style={ci.foot}>
        <Text style={ci.price}>{price}</Text>
        <Text style={ci.meta}>{meta}</Text>
      </View>
    </>
  );
}
const ci = StyleSheet.create({
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingTop: 9,
    paddingBottom: 5,
  },
  title: { fontSize: 12, fontWeight: "700", color: "#222" },
  img: { width: "100%", height: 90 },
  foot: { paddingHorizontal: 11, paddingVertical: 9 },
  price: { fontSize: 13, fontWeight: "700", color: "#222" },
  meta: { fontSize: 10.5, color: "#AAA", marginTop: 1 },
});

const INTENTS: {
  key: OnboardingIntent;
  Icon: any;
  title: string;
  sub: string;
}[] = [
  {
    key: "rent",
    Icon: House,
    title: "I'm looking to rent",
    sub: "Find a home to rent",
  },
  { key: "buy", Icon: Key, title: "I want to buy", sub: "Purchase a property" },
  {
    key: "land",
    Icon: MapTrifold,
    title: "I need land",
    sub: "Buy or rent a plot",
  },
  {
    key: "explore",
    Icon: Compass,
    title: "Just exploring",
    sub: "Browsing what's available",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const { login } = useUser();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [storageChecked, setStorageChecked] = useState(false);
  const [intent, setIntent] = useState<OnboardingIntent | null>(null);

  const [cities, setCities] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [cityId, setCityId] = useState<number | null>(null);
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);

  // Accordion open state
  const [cityOpen, setCityOpen] = useState(true);
  const [zoneOpen, setZoneOpen] = useState(false);

  const [authTab, setAuthTab] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [authFlow, setAuthFlow] = useState<"initial" | "login" | "signup">(
    "initial",
  );
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [pending, setPending] = useState<{
    value: string;
    type: "email" | "phone";
  } | null>(null);

  // Step-0 anim
  const logoOp = useSharedValue(0);
  const logoSc = useSharedValue(1);
  const logoY = useSharedValue(0);
  const txtOp = useSharedValue(0);
  const txtY = useSharedValue(0);
  const c1Op = useSharedValue(0);
  const c1Y = useSharedValue(60);
  const c2Op = useSharedValue(0);
  const c2Y = useSharedValue(60);
  const stepPr = useSharedValue(0);

  // Storage
  useEffect(() => {
    (async () => {
      try {
        if (await onboardingStorage.getSeen()) {
          onComplete();
          return;
        }
      } catch {}
      setStorageChecked(true);
    })();
  }, [onComplete]);

  // Step 0 sequence
  useEffect(() => {
    if (!storageChecked || step !== 0) return;
    setTimeout(() => {
      logoOp.value = withTiming(1, { duration: 480, easing: EO });
    }, 180);
    setTimeout(() => {
      logoSc.value = withTiming(0.44, { duration: 820, easing: EIO });
      logoY.value = withTiming(-SH * 0.6, { duration: 820, easing: EIO });
    }, 1050);
    setTimeout(() => {
      txtOp.value = withTiming(1, { duration: 440, easing: EO });
    }, 1460);
    setTimeout(() => {
      txtY.value = withTiming(-SH * 0.135, { duration: 660, easing: EIO });
    }, 2040);
    setTimeout(() => {
      c1Op.value = withTiming(1, { duration: 520, easing: EO });
      c1Y.value = withTiming(-40, { duration: 520, easing: EO }); // Push card 1 more up
    }, 2640);
    setTimeout(() => {
      c2Op.value = withTiming(1, { duration: 520, easing: EO });
      c2Y.value = withTiming(-40, { duration: 520, easing: EO }); // Push card 2 more up
    }, 2870);
  }, [storageChecked, step]);

  // Step fade
  useEffect(() => {
    if (step === 0) return;
    stepPr.value = 0;
    const t = setTimeout(() => {
      stepPr.value = withTiming(1, { duration: 300, easing: EO });
    }, 40);
    return () => clearTimeout(t);
  }, [step]);

  // Reset accordion when entering step 2
  useEffect(() => {
    if (step === 2) {
      setCityOpen(true);
      setZoneOpen(false);
    }
  }, [step]);

  // Data
  useEffect(() => {
    if (step !== 2 || cities.length > 0) return;
    (async () => {
      setLoadingCities(true);
      try {
        const r = await axios.get(`${endpoints.baseURL}/cities`);
        setCities(r.data?.data || []);
      } catch {
        setCities([]);
      }
      setLoadingCities(false);
    })();
  }, [step]);

  useEffect(() => {
    if (!cityId) {
      setZones([]);
      setZoneId(null);
      setZoneOpen(false);
      return;
    }
    (async () => {
      setLoadingZones(true);
      try {
        const r = await axios.get(
          `${endpoints.baseURL}/cities/${cityId}/zones`,
        );
        setZones(r.data?.data || []);
      } catch {
        setZones([]);
      }
      setLoadingZones(false);
    })();
  }, [cityId]);

  // Anim styles
  const logoSt = useAnimatedStyle(() => ({
    opacity: logoOp.value,
    transform: [{ scale: logoSc.value }, { translateY: logoY.value }],
  }));
  const txtSt = useAnimatedStyle(() => ({
    opacity: txtOp.value,
    transform: [{ translateY: txtY.value }],
  }));
  const c1St = useAnimatedStyle(() => ({
    opacity: c1Op.value,
    transform: [{ translateY: c1Y.value }],
  }));
  const c2St = useAnimatedStyle(() => ({
    opacity: c2Op.value,
    transform: [{ translateY: c2Y.value }],
  }));
  const fadeUp = useAnimatedStyle(() => ({
    opacity: stepPr.value,
    transform: [{ translateY: interpolate(stepPr.value, [0, 1], [22, 0]) }],
  }));

  // Helpers
  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const goNext = useCallback(() => {
    haptic();
    setStep((s) => Math.min(s + 1, STEP_ACCOUNT));
  }, []);
  const goBack = useCallback(() => {
    haptic();
    setStep((s) => Math.max(s - 1, 0));
  }, []);
  const skipAcc = useCallback(() => {
    haptic();
    setStep(STEP_ACCOUNT);
  }, []);

  const finish = useCallback(async () => {
    const city = cities.find((c) => c.id === cityId);
    const zone = zones.find((z) => z.id === zoneId);
    await onboardingStorage.setSeen();
    await onboardingStorage.setPreferences({
      intent: intent ?? "explore",
      cityId: cityId ?? null,
      zoneId: zoneId ?? null,
      quartierId: null,
      cityName: city?.name || "",
      zoneName: zone?.name || "",
      quartierName: "",
      propertyType: "",
    });
  }, [intent, cityId, zoneId, cities, zones]);

  const skipAll = useCallback(async () => {
    haptic();
    try {
      await finish();
    } catch {}
    onComplete();
  }, [finish, onComplete]);

  // City selection — closes city panel, opens zone panel
  const handleCitySelect = useCallback((id: number | null, name: string) => {
    haptic();
    setCityId(id);
    setZoneId(null);
    if (id !== null) {
      // smooth: close city after brief delay, then zone opens
      setTimeout(() => setCityOpen(false), 120);
      setTimeout(() => setZoneOpen(true), 200);
    }
  }, []);

  // Auth
  const curEmail = email.trim();
  const curPhone = phone.replace(/\D/g, "");
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(curEmail);
  const validPhone =
    curPhone.length === 8 && ["2", "3", "4"].includes(curPhone.charAt(0));
  const hasId = authTab === "email" ? !!curEmail : !!curPhone;
  const isValid = authTab === "email" ? validEmail : validPhone;

  const continueAuth = useCallback(async () => {
    if (!hasId || !acceptedTerms || !isValid) return;
    const value = authTab === "email" ? curEmail.toLowerCase() : curPhone;
    setPending({ value, type: authTab });
    setIsChecking(true);
    try {
      const start = Date.now();
      const res = await checkUserExists(
        authTab === "email" ? value : undefined,
        authTab === "phone" ? value : undefined,
      );
      const gap = Date.now() - start;
      if (gap < 800) await new Promise((r) => setTimeout(r, 800 - gap));
      setAuthFlow(res?.exists ? "login" : "signup");
    } catch {
      Alert.alert("Error", "Could not verify. Please try again.");
    } finally {
      setIsChecking(false);
    }
  }, [hasId, acceptedTerms, isValid, authTab, curEmail, curPhone]);

  const doLogin = useCallback(async () => {
    if (!pending?.value || !password.trim()) return;
    setIsLoading(true);
    try {
      const user =
        pending.type === "email"
          ? await loginUser(pending.value, password)
          : await loginUserPhone(pending.value, password);
      if (user) {
        await login(user);
        await finish();
        onComplete();
      }
    } catch (e: any) {
      Alert.alert("Wrong password", e?.response?.data?.error || "Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [password, login, onComplete, finish, pending]);

  const doSignup = useCallback(async () => {
    if (
      !pending?.value ||
      !firstName.trim() ||
      !lastName.trim() ||
      !password.trim()
    )
      return;
    setIsLoading(true);
    try {
      const user =
        pending.type === "email"
          ? await registerUser(
              firstName.trim(),
              lastName.trim(),
              pending.value,
              password,
            )
          : await registerUserPhone(
              firstName.trim(),
              lastName.trim(),
              pending.value,
              password,
            );
      if (user) {
        await login(user);
        await finish();
        onComplete();
      }
    } catch (e: any) {
      Alert.alert("Sign up failed", e?.response?.data?.error || "Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [firstName, lastName, password, login, onComplete, finish, pending]);

  const resetAuth = useCallback(() => {
    setAuthFlow("initial");
    setPassword("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setPending(null);
  }, []);

  if (!storageChecked) return <View style={g.root} />;

  const btmPad = Math.max(insets.bottom, 16);

  const Dots = () => (
    <View style={[g.dots, { top: insets.top + 18, right: 24 }]}>
      {[0, 1, 2, STEP_ACCOUNT].map((i) => (
        <View key={i} style={[g.dot, step === i && g.dotOn]} />
      ))}
    </View>
  );

  // city/zone display names
  const selectedCityName =
    cityId === null
      ? cityId === null && cities.length > 0
        ? ""
        : ""
      : cities.find((c) => c.id === cityId)?.name || "";
  const selectedZoneName =
    zoneId === null ? "" : zones.find((z) => z.id === zoneId)?.name || "";

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <View style={[g.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAF8" />
      <Dots />

      {/* ═══ STEP 0 ═══ */}
      {step === 0 && (
        <View style={g.screen}>
          <View style={g.stage}>
            <Animated.View style={[g.logoWrap, logoSt]}>
              <Image
                source={require("../assets/logo.png")}
                style={g.logoImg}
                resizeMode="contain"
              />
            </Animated.View>
            <Animated.View style={[g.textWrap, txtSt]}>
              <Text style={g.wTitle}>
                Welcome to <Text style={g.accent}>Meskeny</Text>
              </Text>
              <Text style={g.wSub}>Find your perfect place in Mauritania</Text>
            </Animated.View>
            {/* Cards — fanned from center */}
            <Animated.View style={[g.cardAbsL, c1St]}>
              <View style={g.card1}>
                <CardInner
                  title="House for sale"
                  uri={require("../assets/onboarding/1.avif")}
                  price="899,000 MRU"
                  meta="3 beds · House"
                />
              </View>
            </Animated.View>
            <Animated.View style={[g.cardAbsR, c2St]}>
              <View style={g.card2}>
                <CardInner
                  title="Land for sale"
                  uri={require("../assets/land.jpg")}
                  price="723,000 MRU"
                  meta="4 beds · Land"
                />
              </View>
            </Animated.View>
          </View>
          <View style={{ paddingBottom: btmPad }}>
            <NavBar showBack={false} nextLabel="Get started" onNext={goNext} />
            <Ghost label="I'll skip for now" onPress={skipAcc} />
          </View>
        </View>
      )}

      {/* ═══ STEP 1 — Intent ═══ */}
      {step === 1 && (
        <View style={g.screen}>
          <Animated.View style={[g.fill, fadeUp]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={g.scrollPad}
            >
              <Text style={g.bigQ}>
                What are you{"\n"}
                <Text style={g.accent}>here for?</Text>
              </Text>
              <Text style={g.bigSub}>Pick what fits you best</Text>
              <View style={g.intentList}>
                {INTENTS.map(({ key, Icon, title, sub }) => {
                  const on = intent === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[g.iRow, on && g.iRowOn]}
                      onPress={() => {
                        haptic();
                        setIntent(key);
                      }}
                      activeOpacity={0.76}
                    >
                      <View style={[g.iIcon, on && g.iIconOn]}>
                        <Icon size={20} color={on ? "#FFF" : "#333"} />
                      </View>
                      <View style={g.iLabels}>
                        <Text style={[g.iTitle, on && g.iTitleOn]}>
                          {title}
                        </Text>
                        <Text style={[g.iSub, on && g.iSubOn]}>{sub}</Text>
                      </View>
                      <View style={[g.radio, on && g.radioOn]}>
                        {on && <View style={g.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </Animated.View>
          <View style={{ paddingBottom: btmPad }}>
            <NavBar
              showBack
              onBack={goBack}
              onNext={goNext}
              nextDisabled={!intent}
            />
            <Ghost label="Skip this step" onPress={skipAcc} />
          </View>
        </View>
      )}

      {/* ═══ STEP 2 — Location ═══ */}
      {step === 2 && (
        <View style={g.screen}>
          <Animated.View style={[g.fill, fadeUp]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={g.scrollPad}
            >
              <Text style={g.bigQ}>
                Where do you{"\n"}
                <Text style={g.accent}>want to look?</Text>
              </Text>
              <Text style={g.bigSub}>
                We'll show listings nearest to you first
              </Text>

              {/* City accordion */}
              <AccordionPanel
                label="City"
                value={selectedCityName}
                isOpen={cityOpen}
                onToggle={() => setCityOpen((o) => !o)}
                loading={loadingCities}
              >
                {[
                  { id: null as number | null, name: "Anywhere" },
                  ...cities,
                ].map((city) => (
                  <LocationRow
                    key={city.id ?? "any"}
                    name={city.name}
                    selected={cityId === city.id}
                    onPress={() => handleCitySelect(city.id, city.name)}
                  />
                ))}
              </AccordionPanel>

              {/* Zone accordion — only rendered once city is chosen */}
              {cityId !== null && (
                <AccordionPanel
                  label="Neighbourhood"
                  value={selectedZoneName}
                  isOpen={zoneOpen}
                  onToggle={() => setZoneOpen((o) => !o)}
                  loading={loadingZones}
                >
                  {[
                    { id: null as number | null, name: "Anywhere" },
                    ...zones,
                  ].map((zone) => (
                    <LocationRow
                      key={zone.id ?? "any"}
                      name={zone.name}
                      selected={zoneId === zone.id}
                      onPress={() => {
                        haptic();
                        setZoneId(zone.id);
                      }}
                    />
                  ))}
                </AccordionPanel>
              )}
            </ScrollView>
          </Animated.View>
          <View style={{ paddingBottom: btmPad }}>
            <NavBar showBack onBack={goBack} onNext={goNext} />
            <Ghost label="Skip this step" onPress={skipAcc} />
          </View>
        </View>
      )}

      {/* ═══ STEP 3 — Account ═══ */}
      {step === STEP_ACCOUNT && (
        <KeyboardAvoidingView
          style={g.screen}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <ScrollView
            contentContainerStyle={g.authPad}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={fadeUp}>
              {authFlow === "initial" && (
                <>
                  <Text style={g.bigQ}>
                    Create your{"\n"}
                    <Text style={g.accent}>account</Text>
                  </Text>
                  <Text style={g.bigSub}>
                    Save searches &amp; favourite listings
                  </Text>

                  <View style={g.tabs}>
                    {(["email", "phone"] as const).map((tab) => (
                      <TouchableOpacity
                        key={tab}
                        style={[g.tab, authTab === tab && g.tabOn]}
                        onPress={() => setAuthTab(tab)}
                      >
                        <Text style={[g.tabTxt, authTab === tab && g.tabTxtOn]}>
                          {tab === "email" ? "Email address" : "Phone number"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {authTab === "email" ? (
                    <TextInput
                      style={g.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="name@example.com"
                      placeholderTextColor="#C0C0C0"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  ) : (
                    <View style={g.phoneWrap}>
                      <View style={g.phonePfx}>
                        <Text style={g.phonePfxTxt}>+222</Text>
                      </View>
                      <TextInput
                        style={g.phoneInput}
                        value={phone}
                        onChangeText={(v) =>
                          setPhone(v.replace(/\D/g, "").slice(0, 8))
                        }
                        placeholder="2X XX XX XX"
                        placeholderTextColor="#C0C0C0"
                        keyboardType="phone-pad"
                        maxLength={8}
                      />
                    </View>
                  )}

                  {hasId && (
                    <TouchableOpacity
                      style={g.termsRow}
                      onPress={() => setAcceptedTerms((v) => !v)}
                      activeOpacity={0.8}
                    >
                      <View style={[g.chk, acceptedTerms && g.chkOn]}>
                        {acceptedTerms && <Text style={g.chkMark}>✓</Text>}
                      </View>
                      <Text style={g.termsTxt}>
                        I agree to the{" "}
                        <Text style={g.termsLink}>Terms of Service</Text> and{" "}
                        <Text style={g.termsLink}>Privacy Policy</Text>
                      </Text>
                    </TouchableOpacity>
                  )}

                  <View style={{ paddingBottom: btmPad }}>
                    <NavBar
                      // Always allow going back from the account step.
                      showBack
                      onBack={goBack}
                      onNext={continueAuth}
                      nextLabel="Continue"
                      nextDisabled={!hasId || !acceptedTerms || !isValid}
                      nextLoading={isChecking}
                    />
                    <Ghost label="Continue without account" onPress={skipAll} />
                  </View>
                </>
              )}

              {authFlow === "login" && (
                <>
                  <Text style={g.bigQ}>
                    Welcome{"\n"}
                    <Text style={g.accent}>back 👋</Text>
                  </Text>
                  <IdPill
                    type={pending?.type ?? "email"}
                    value={pending?.value ?? ""}
                  />
                  <View style={g.inputEye}>
                    <TextInput
                      style={g.inputInner}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Your password"
                      placeholderTextColor="#C0C0C0"
                      secureTextEntry={!showPwd}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPwd((v) => !v)}
                      style={g.eyeBtn}
                    >
                      {showPwd ? (
                        <EyeSlash size={19} color="#C0C0C0" />
                      ) : (
                        <Eye size={19} color="#C0C0C0" />
                      )}
                    </TouchableOpacity>
                  </View>
                  <View style={{ paddingBottom: btmPad }}>
                    <NavBar
                      showBack
                      onBack={resetAuth}
                      onNext={doLogin}
                      nextLabel="Sign in"
                      nextDisabled={!password.trim()}
                      nextLoading={isLoading}
                    />
                  </View>
                </>
              )}

              {authFlow === "signup" && (
                <>
                  <Text style={g.bigQ}>
                    Let's set{"\n"}
                    <Text style={g.accent}>you up ✨</Text>
                  </Text>
                  <IdPill
                    type={pending?.type ?? "email"}
                    value={pending?.value ?? ""}
                  />
                  <View style={g.nameRow}>
                    <TextInput
                      style={[g.input, g.inputHalf]}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="First name"
                      placeholderTextColor="#C0C0C0"
                      autoCapitalize="words"
                    />
                    <TextInput
                      style={[g.input, g.inputHalf]}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Last name"
                      placeholderTextColor="#C0C0C0"
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={g.inputEye}>
                    <TextInput
                      style={g.inputInner}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Create a password"
                      placeholderTextColor="#C0C0C0"
                      secureTextEntry={!showPwd}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPwd((v) => !v)}
                      style={g.eyeBtn}
                    >
                      {showPwd ? (
                        <EyeSlash size={19} color="#C0C0C0" />
                      ) : (
                        <Eye size={19} color="#C0C0C0" />
                      )}
                    </TouchableOpacity>
                  </View>
                  <View style={{ paddingBottom: btmPad }}>
                    <NavBar
                      showBack
                      onBack={resetAuth}
                      onNext={doSignup}
                      nextLabel="Create account"
                      nextDisabled={
                        !firstName.trim() ||
                        !lastName.trim() ||
                        !password.trim()
                      }
                      nextLoading={isLoading}
                    />
                  </View>
                </>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Global styles
// ─────────────────────────────────────────────────────────────────────────────
const g = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAF8" },
  screen: { flex: 1, paddingHorizontal: 20 },
  fill: { flex: 1 },

  dots: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    zIndex: 100,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#DDD" },
  dotOn: { width: 20, borderRadius: 3, backgroundColor: "#1A1A1A" },

  // Step 0
  stage: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: { width: 118, height: 118, borderRadius: 24 },
  textWrap: {
    position: "absolute",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  wTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1A1A1A",
    textAlign: "center",
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  wSub: {
    marginTop: 7,
    fontSize: 15,
    color: "#BBB",
    textAlign: "center",
    fontWeight: "400",
  },
  accent: {
    color: "#D16024",
    textDecorationLine: "underline",
    textDecorationColor: "#D16024",
  },

  card1: {
    width: 162,
    backgroundColor: "#FFF",
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    transform: [{ rotate: "-20deg" }],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 8,
  },
  card2: {
    width: 162,
    backgroundColor: "#FFF",
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    transform: [{ rotate: "20deg" }],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 8,
  },
  cardAbsL: {
    position: "absolute",
    left: "60%" as any,
    bottom: 80,
    marginLeft: -176,
    zIndex: 2,
  },
  cardAbsR: {
    position: "absolute",
    left: "40%" as any,
    bottom: 80,
    marginLeft: 14,
    zIndex: 1,
  },

  ghost: { alignItems: "center", paddingVertical: 12 },
  ghostTxt: { fontSize: 13, fontWeight: "500", color: "#C0C0C0" },

  bigQ: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.9,
    lineHeight: 40,
    marginBottom: 6,
  },
  bigSub: {
    fontSize: 15,
    color: "#BBB",
    lineHeight: 22,
    fontWeight: "400",
    marginBottom: 26,
  },

  scrollPad: { paddingTop: 20, paddingBottom: 16 },
  authPad: { paddingTop: 52, paddingBottom: 40 },

  intentList: { gap: 10 },
  iRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#EBEBEB",
    gap: 13,
  },
  iRowOn: { borderColor: "#1A1A1A", backgroundColor: "#1A1A1A" },
  iIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: "#F3F3F1",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iIconOn: { backgroundColor: "rgba(255,255,255,0.13)" },
  iLabels: { flex: 1 },
  iTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  iTitleOn: { color: "#FFF" },
  iSub: { fontSize: 12, color: "#AAA", marginTop: 2 },
  iSubOn: { color: "rgba(255,255,255,0.5)" },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#DDD",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioOn: { borderColor: "#FFF", backgroundColor: "rgba(255,255,255,0.18)" },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFF" },

  // Auth
  tabs: {
    flexDirection: "row",
    backgroundColor: "#F0F0EE",
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  tab: { flex: 1, paddingVertical: 11, alignItems: "center", borderRadius: 10 },
  tabOn: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabTxt: { fontSize: 14, fontWeight: "600", color: "#AAA" },
  tabTxtOn: { color: "#1A1A1A" },

  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1A1A1A",
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
  },
  inputHalf: { flex: 1, marginBottom: 0 },
  nameRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  inputEye: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  inputInner: { flex: 1, paddingVertical: 15, fontSize: 16, color: "#1A1A1A" },
  eyeBtn: { padding: 6 },
  phoneWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    marginBottom: 12,
    overflow: "hidden",
  },
  phonePfx: {
    paddingHorizontal: 14,
    paddingVertical: 15,
    backgroundColor: "#F5F5F3",
    borderRightWidth: 1.5,
    borderRightColor: "#E8E8E8",
  },
  phonePfxTxt: { fontSize: 15, fontWeight: "600", color: "#888" },
  phoneInput: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#1A1A1A",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 11,
  },
  chk: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CCC",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  chkOn: { backgroundColor: "#1A1A1A", borderColor: "#1A1A1A" },
  chkMark: { color: "#FFF", fontSize: 11, fontWeight: "800" },
  termsTxt: { flex: 1, fontSize: 13, color: "#AAA", lineHeight: 20 },
  termsLink: {
    color: "#1A1A1A",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  idPill: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
  },
  idLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#AAA",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  idValue: { fontSize: 16, fontWeight: "600", color: "#1A1A1A" },
});
