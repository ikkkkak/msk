import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPinLine, Bell } from 'phosphor-react-native';

interface LocationOptInModalProps {
  visible: boolean;
  onEnable: () => void;
  onSkip: () => void;
  isProcessing?: boolean;
}

const { width } = Dimensions.get('window');

export const LocationOptInModal: React.FC<LocationOptInModalProps> = ({
  visible,
  onEnable,
  onSkip,
  isProcessing = false,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconRow}>
            <MapPinLine size={40} color="#111827" weight="fill" />
            <Bell size={24} color="#4B5563" weight="bold" />
          </View>
          <Text style={styles.title}>{t('notifications.locationOptIn.title', 'Enable location-based alerts')}</Text>
          <Text style={styles.subtitle}>{t('notifications.locationOptIn.subtitle', 'Turn on location access to get alerts about nearby properties that match your interests.')}</Text>

          <View style={styles.benefits}>
            <Text style={styles.benefitText}>• {t('notifications.locationOptIn.benefit1', 'See what’s trending in your area first')}</Text>
            <Text style={styles.benefitText}>• {t('notifications.locationOptIn.benefit2', 'Get smarter recommendations based on where you are')}</Text>
            <Text style={styles.benefitText}>• {t('notifications.locationOptIn.benefit3', 'You’re in full control—change this anytime')}</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, isProcessing && styles.disabledButton]}
            onPress={onEnable}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>{t('notifications.locationOptIn.enableCta', 'Enable location alerts')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onSkip}
            disabled={isProcessing}
          >
            <Text style={styles.secondaryButtonText}>{t('notifications.locationOptIn.laterCta', 'Maybe later')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: width * 0.9,
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 18,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 20,
  },
  benefits: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  benefitText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#111827',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.65,
  },
});


