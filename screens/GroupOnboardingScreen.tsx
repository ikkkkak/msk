import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  Platform,
} from "react-native";
import Animated, {
  FadeIn,
  LinearTransition,
  SlideInLeft,
  SlideInRight,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft } from "phosphor-react-native";
import { theme } from "../theme";

// --- Animated HeadText component ---
const gap = 10;

interface HeadTextProps {
  text?: string;
  side?: "left" | "right";
  image?: ImageSourcePropType;
}

const HeadText = (props: HeadTextProps) => {
  const { text, side, image } = props;
  const [totalWidth, setTotalWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const width = totalWidth - textWidth - gap;

  const Transition = LinearTransition.delay(1650)
    .springify()
    .damping(18)
    .stiffness(50);

  const LeftSlide = SlideInLeft.delay(1500)
    .springify()
    .damping(18)
    .stiffness(50);
  const RightSlide = SlideInRight.delay(1500)
    .springify()
    .damping(18)
    .stiffness(50);

  return (
    <Animated.View
      entering={FadeIn.delay(1000).springify().damping(18).stiffness(50)}
      layout={Transition}
      onLayout={(event) => {
        setTotalWidth(event.nativeEvent.layout.width);
      }}
      style={styles.headTextContainer}
    >
      {Boolean(width > 0) && side === "left" && (
        <Animated.View
          entering={LeftSlide}
          style={[styles.embedImage, { width }]}
        >
          <Image source={image} style={styles.image} />
        </Animated.View>
      )}
      {Boolean(text) && (
        <Animated.Text
          layout={Transition}
          onLayout={(event) => {
            setTextWidth(event.nativeEvent.layout.width);
          }}
          style={styles.headText}
        >
          {text}
        </Animated.Text>
      )}
      {Boolean(width > 0) && side === "right" && (
        <Animated.View
          entering={RightSlide}
          style={[styles.embedImage, { width }]}
        >
          <Image source={image} style={styles.image} />
        </Animated.View>
      )}
    </Animated.View>
  );
};

// --- ANIMATION SECTION COMPONENT ---
export const GroupOnboardingHeroSection = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.heroSection}>
      <View style={{ gap }}>
        <HeadText
          text={t("groups.onboarding.slides.0.title")}
          side="right"
          image={{uri: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjWfGUwQpa4fCmtz0wp8slbPzkcmZaogK5Xw-gAEqJPn2ZTU_NvxKeBNhUATJNumCDSb_SJwC-btfNC0O_sLu8f2z4TR5MHfQg7uKPUOCxMRjX8oh7kExnssBy14hbyAokAQExnydG372bpNqWx0xgOr0Wlw4bOygJZ_ZIIXtjpWwgNcrZjIxpnt6CgJw/s1024/the%20friends%20experience%20in%20Paris%20-33.jpg'}}
        />
        <HeadText
          text={t("groups.onboarding.slides.1.title")}
          side="right"
          image={{uri: 'https://images.pexels.com/photos/1387037/pexels-photo-1387037.jpeg?cs=srgb&dl=pexels-jefriwibawa-1387037.jpg&fm=jpg'}}
        />
        <HeadText
          text={t("groups.onboarding.slides.2.title")}
          side="left"
          image={{uri: 'https://as2.ftcdn.net/v2/jpg/03/58/88/61/1000_F_358886166_a03e1c6NcTMP2ZAQyVm556lHFcKqIVxj.jpg'}}
        />
        <HeadText text={t("groups.onboarding.slides.3.title")} />
        <HeadText side="right" image={{uri: 'https://cdn.sortiraparis.com/images/80/100423/822190-the-friends-experience-l-experience-immersive-sur-la-serie-friends-a-paris.jpg'}} />
      </View>
    </View>
  );
};

// --- MAIN SCREEN ---
const GroupOnboardingScreen = () => {
  const { top, bottom } = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <View style={[styles.wrapper, { backgroundColor: "#fff" }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          { paddingTop: top + (Platform.OS === "android" ? 8 : 0) },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
          style={styles.backButton}
          hitSlop={{ top: 14, left: 14, bottom: 14, right: 14 }}
          accessibilityRole="button"
          accessibilityLabel={t("common.back", "Back")}
        >
          <ArrowLeft color="#222" size={26} weight="bold" />
        </TouchableOpacity>
        <Text
          style={styles.headerTitle}
          numberOfLines={1}
          ellipsizeMode="tail"
          accessibilityRole="header"
        >
          {t("groups.onboarding.header", "Group Onboarding")}
        </Text>
        {/* Space for centralization */}
        <View style={{ width: 40, height: 40 }} />
      </View>

      {/* Centered Animation */}
      <View style={styles.sectionGrow}>
        <GroupOnboardingHeroSection />
      </View>

      {/* Bottom Fixed Action */}
      <View
        style={[
          styles.bottomArea,
          { paddingBottom: Math.max(bottom, 24) },
        ]}
      >
        <View style={styles.bottomLine} />
        <TouchableOpacity
          style={styles.bottomButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("GroupCreate", {experienceId: 1})}
          accessibilityRole="button"
          accessibilityLabel={t("groups.onboarding.start", "Start Group")}
        >
          <Text style={styles.bottomButtonText}>
            {t("groups.onboarding.start", "Start Group")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GroupOnboardingScreen;

// --- STYLES ---
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#fff",
    width: "100%",
    minHeight: 64,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ECECEC",
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 19,
    fontWeight: Platform.select({ ios: "800", android: "bold", default: "700" }),
    color: "#222",
    letterSpacing: -0.5,
  },
  sectionGrow: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    minHeight: 320,
  },
  heroSection: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    width: "100%",
  },
  // --- Animation/HeadText styles ---
  headTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    justifyContent: "center",
    gap: gap,
    height: 80,
  },
  embedImage: {
    height: 80,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#F4F4F4",
  },
  headText: {
    fontSize: 25,
    fontWeight: "700",
    color: "#0C1824",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  // --- Bottom Button ---
  bottomArea: {
    width: "100%",
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingTop: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 12,
  },
  bottomLine: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
    marginBottom: 16,
  },
  bottomButton: {
    width: "100%",
    backgroundColor: theme['color-temporary-primary'],
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
    letterSpacing: 0,
  },
});