import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

interface HostAccessGateProps {
  isHostMode: boolean;
  onSwitchToHost: () => void;
  children: React.ReactNode;
}

export const HostAccessGate: React.FC<HostAccessGateProps> = ({
  isHostMode,
  onSwitchToHost,
  children,
}) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = React.useState(false);

  const handlePress = () => {
    if (!isHostMode) {
      setShowModal(true);
    }
  };

  const handleSwitchToHost = () => {
    setShowModal(false);
    onSwitchToHost();
  };

  if (isHostMode) {
    return <>{children}</>;
  }

  return (
    <>
      <TouchableOpacity
        style={styles.gateContainer}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.gateContent}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="home" size={32} color="#222222" />
          </View>
          <Text style={styles.gateTitle}>
            {t("account.hostAccess.gateTitle")}
          </Text>
          <Text style={styles.gateDescription}>
            {t("account.hostAccess.gateDescription")}
          </Text>
          <View style={styles.switchButton}>
            <MaterialIcons name="swap-horiz" size={20} color="#FFFFFF" />
            <Text style={styles.switchButtonText}>
              {t("account.hostAccess.enableHostMode")}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="home" size={48} color="#222222" />
              <Text style={styles.modalTitle}>
                {t("account.hostAccess.modalTitle")}
              </Text>
              <Text style={styles.modalDescription}>
                {t("account.hostAccess.modalDescription")}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleSwitchToHost}
              >
                <Text style={styles.confirmButtonText}>
                  {t("account.hostAccess.enableHostMode")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  gateContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gateContent: {
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  gateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
    textAlign: "center",
  },
  gateDescription: {
    fontSize: 16,
    color: "#717171",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  switchButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222222",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  switchButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    marginTop: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 16,
    color: "#717171",
    textAlign: "center",
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#717171",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#222222",
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
