import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ShieldCheck, X } from "phosphor-react-native";
import { theme } from "../theme";

const PRIMARY = theme["color-temporary-primary"] as string;
/** Fully hidden above the safe area before slide-in */
const HIDDEN_Y = -130;
const ENTRANCE_DELAY_MS = 520;

type Props = {
  visible: boolean;
  onOpenSheet: () => void;
  onDismiss: () => void;
};

export function HostShareConsentToast({
  visible,
  onOpenSheet,
  onDismiss,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);
  const translateY = useRef(new Animated.Value(HIDDEN_Y)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const entranceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runEntrance = () => {
    translateY.setValue(HIDDEN_Y);
    opacity.setValue(0);
    scale.setValue(0.96);

    entranceTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 68,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }, ENTRANCE_DELAY_MS);
  };

  const runExit = (onDone?: () => void) => {
    if (entranceTimer.current) {
      clearTimeout(entranceTimer.current);
      entranceTimer.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: HIDDEN_Y,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.96,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onDone?.();
    });
  };

  useEffect(() => {
    if (visible) {
      setMounted(true);
      runEntrance();
    } else if (mounted) {
      runExit(() => setMounted(false));
    }

    return () => {
      if (entranceTimer.current) {
        clearTimeout(entranceTimer.current);
        entranceTimer.current = null;
      }
    };
  }, [visible]);

  if (!mounted) return null;

  return (
    <View
      style={[styles.host, { top: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.card,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <View style={styles.contentRow}>
          <ShieldCheck size={22} color={PRIMARY} weight="duotone" />
          <View style={styles.textCol}>
            <Text style={styles.title} numberOfLines={2}>
              {t(
                "hostShareConsent.toastTitle",
                "Share minimal info with hosts?",
              )}
            </Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {t(
                "hostShareConsent.toastSubtitle",
                "One host at a time · minimal details only.",
              )}
            </Text>
          </View>
        </View>

        <View style={styles.actionsCol}>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={onOpenSheet}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={t("hostShareConsent.toastView", "View")}
          >
            <Text style={styles.viewBtnText}>
              {t("hostShareConsent.toastView", "View")}
            </Text>
          </TouchableOpacity>
          {/* <TouchableOpacity
            onPress={onDismiss}
            hitSlop={10}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel={t("common.close", "Close")}
          >
            <X size={16} color="#9CA3AF" weight="bold" />
          </TouchableOpacity> */}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9998,
    elevation: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 10,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 14,
      },
      android: { elevation: 8 },
    }),
  },
  contentRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 19,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  actionsCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  viewBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 0,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  viewBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
