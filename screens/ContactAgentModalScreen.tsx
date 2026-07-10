import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Phone, Envelope, ChatCircle, CaretRight, Buildings } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';

interface ContactAgentModalParams {
  phone?: string;
  email?: string;
  ownerID?: number;
  organizationName?: string;
  organizationImage?: string;
  organizationWebsite?: string;
  recipientName?: string;
}

export const ContactAgentModalScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  
  const params = (route.params as ContactAgentModalParams) || {};

  const handleClose = () => {
    Haptics.selectionAsync();
    navigation.goBack();
  };

  const handlePhonePress = () => {
    if (params.phone) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.goBack();
      Linking.openURL(`tel:${params.phone}`);
    }
  };

  const handleEmailPress = () => {
    if (params.email) {
      Haptics.selectionAsync();
      navigation.goBack();
      Linking.openURL(`mailto:${params.email}`);
    }
  };

  const handleMessagePress = () => {
    Haptics.selectionAsync();
    navigation.goBack();
    if (params.ownerID) {
      (navigation as any).navigate('DirectMessage', {
        conversationID: 0,
        otherUserId: params.ownerID,
        recipientName: params.recipientName || params.organizationName || 'Agent',
      });
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>{t('sale.contactAgent')}</Text>
            <Text style={styles.modalSubtitle}>{t('sale.howToContact')}</Text>
          </View>
          
          {/* Contact Options */}
          <View style={styles.modalOptions}>
            {/* Phone Option - Highlighted */}
            {params.phone && (
              <Pressable
                style={styles.contactOptionHighlighted}
                onPress={handlePhonePress}
              >
                <View style={styles.contactOptionIconBg}>
                  <Phone size={24} color="#FFF" weight="fill" />
                </View>
                <View style={styles.contactOptionContent}>
                  <Text style={styles.contactOptionTitle}>{t('sale.call')}</Text>
                  <Text style={styles.contactOptionValue}>{params.phone}</Text>
                </View>
                <CaretRight size={20} color="#9CA3AF" />
              </Pressable>
            )}
            
            {/* Email Option */}
            {params.email && (
              <Pressable
                style={styles.contactOptionRow}
                onPress={handleEmailPress}
              >
                <View style={[styles.contactOptionIconBg, { backgroundColor: '#3B82F6' }]}>
                  <Envelope size={24} color="#FFF" weight="fill" />
                </View>
                <View style={styles.contactOptionContent}>
                  <Text style={styles.contactOptionTitle}>{t('sale.email')}</Text>
                  <Text style={styles.contactOptionValue} numberOfLines={1}>{params.email}</Text>
                </View>
                <CaretRight size={20} color="#9CA3AF" />
              </Pressable>
            )}
            
            {/* Message Option */}
            {params.ownerID && (
              <Pressable
                style={styles.contactOptionRow}
                onPress={handleMessagePress}
              >
                <View style={[styles.contactOptionIconBg, { backgroundColor: '#8B5CF6' }]}>
                  <ChatCircle size={24} color="#FFF" weight="fill" />
                </View>
                <View style={styles.contactOptionContent}>
                  <Text style={styles.contactOptionTitle}>{t('sale.message')}</Text>
                  <Text style={styles.contactOptionValue}>{t('sale.messageSubtitle')}</Text>
                </View>
                <CaretRight size={20} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
          
          {/* Organization Info */}
          {(params.organizationName || params.organizationImage) && (
            <View style={styles.orgInfo}>
              {params.organizationImage ? (
                <Image source={{ uri: params.organizationImage }} style={styles.orgAvatar} />
              ) : (
                <View style={[styles.orgAvatar, styles.orgAvatarEmpty]}>
                  <Buildings size={20} color="#9CA3AF" />
                </View>
              )}
              <View style={styles.orgDetails}>
                <Text style={styles.orgName}>{params.organizationName || 'Real Estate'}</Text>
                {params.organizationWebsite && (
                  <Text style={styles.orgWebsite} numberOfLines={1}>{params.organizationWebsite}</Text>
                )}
              </View>
            </View>
          )}
          
          {/* Close Button */}
          <SafeAreaView edges={['bottom']}>
            <Pressable
              style={styles.modalCloseBtn}
              onPress={handleClose}
            >
              <Text style={styles.modalCloseBtnText}>{t('common.close')}</Text>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    justifyContent: 'space-between',
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
  modalOptions: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  contactOptionHighlighted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  contactOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  contactOptionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  contactOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  contactOptionValue: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 1,
  },
  orgInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  orgAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  orgAvatarEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgDetails: {
    flex: 1,
    marginLeft: 10,
  },
  orgName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  orgWebsite: {
    fontSize: 12,
    color: theme['color-temporary-primary'],
    marginTop: 1,
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

