import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

interface ContactAgentModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

export const ContactAgentModal: React.FC<ContactAgentModalProps> = ({
  onClose,
  children,
}) => {
  const { t } = useTranslation();

  const handleClose = () => {
    Haptics.selectionAsync();
    onClose();
  };

  return (
    <Pressable style={styles.backdrop} onPress={handleClose}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>{t('sale.contactAgent')}</Text>
            <Text style={styles.modalSubtitle}>{t('sale.howToContact')}</Text>
          </View>
          
          {/* Content - Children */}
          <View style={styles.modalContent}>
            {children}
          </View>
          
          {/* Close Button */}
          <Pressable
            style={styles.modalCloseBtn}
            onPress={handleClose}
          >
            <Text style={styles.modalCloseBtnText}>{t('common.close')}</Text>
          </Pressable>
        </Pressable>
      </SafeAreaView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 0,
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  modalCloseBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  modalCloseBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
});

