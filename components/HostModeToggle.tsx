import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { HouseIcon, UserIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";

interface HostModeToggleProps {
  isHostMode: boolean;
  onToggle: (isHost: boolean) => void;
  disabled?: boolean;
}

export const HostModeToggle: React.FC<HostModeToggleProps> = ({
  isHostMode,
  onToggle,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const slideAnimation = React.useRef(new Animated.Value(isHostMode ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: isHostMode ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isHostMode]);

  const handleToggle = (mode: boolean) => {
    if (!disabled) {
      onToggle(mode);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.toggleContainer, disabled && styles.disabledContainer]}>
        {/* Background Slider */}
        <Animated.View
          style={[
            styles.slider,
            {
              transform: [
                {
                  translateX: slideAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 120], // Half the width of toggle container
                  }),
                },
              ],
            },
          ]}
        />
        
        {/* User Mode Button */}
        <TouchableOpacity
          style={[styles.toggleButton, isHostMode && styles.inactiveButton]}
          onPress={() => handleToggle(false)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <UserIcon
            size={20}
            color={isHostMode ? "#717171" : "#FFFFFF"}
          />
          <Text style={[styles.buttonText, isHostMode && styles.inactiveText]}>
            {t("account.mode.guest", "Guest")}
          </Text>
        </TouchableOpacity>

        {/* Host Mode Button */}
        <TouchableOpacity
          style={[styles.toggleButton, !isHostMode && styles.inactiveButton]}
          onPress={() => handleToggle(true)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <HouseIcon
            size={20}
            color={!isHostMode ? "#717171" : "#FFFFFF"}
          />
          <Text style={[styles.buttonText, !isHostMode && styles.inactiveText]}>
            {t("account.mode.host", "Host")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F7F7F7",
    borderRadius: 25,
    padding: 4,
    width: 240,
    height: 50,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  slider: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 112, // Half width minus padding
    height: 42,
    backgroundColor: "#222222",
    borderRadius: 21,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 21,
    zIndex: 1,
  },
  inactiveButton: {
    // No special styling for inactive state
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
    letterSpacing: -0.3,
  },
  inactiveText: {
    color: "#717171",
  },
});
