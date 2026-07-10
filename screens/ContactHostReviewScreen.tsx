import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { endpoints, directMessageEndpoints } from '../constants';
import { useUser } from '../hooks/useUser';

type RouteParams = {
  propertyID: number;
  propertyId?: number;
  propertyTitle: string;
  propertyCity?: string;
  propertyImage?: string;
  hostID: number;
  ownerID?: number;
  tenantID?: number;
  prefillMessage?: string;
  recipientName?: string;
  hostName?: string;
  hostAvatarURL?: string;
  nightlyPrice?: number;
};

export default function ContactHostReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params || {}) as any as RouteParams;
  const { t } = useTranslation();
  const { user } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract property ID (handle both propertyID and propertyId)
  const propertyID = params.propertyID || params.propertyId;
  const hostID = params.hostID || params.ownerID;

  // Default message
  const defaultMessage = t('contactHost.defaultMessage', "Hi! I'm interested in your property. Can we discuss?");
  const [messageText, setMessageText] = useState(params.prefillMessage || defaultMessage);

  const handleSend = async () => {
    if (submitting || !messageText.trim() || !user) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Send direct message with property reference
      const payload = {
        receiver_id: hostID,
        content: messageText.trim(),
        type: 'text',
        ref_type: 'property',
        ref_id: propertyID,
      };

      console.log('📤 Sending direct message:', payload);
      
      await api.post(directMessageEndpoints.sendMessage(), payload, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });

      console.log('✅ Message sent successfully');

      // Navigate directly to DirectMessage screen with the host
      (navigation as any).replace('DirectMessage', {
        conversationID: null, // No conversation ID for direct messages
        otherUserId: hostID,
        recipientName: params.hostName || params.recipientName || 'Host',
      });
    } catch (e: any) {
      console.error('❌ Failed to send message:', e);
      setError(e?.response?.data?.error || e?.message || 'Failed to contact host. Please try again.');
      setSubmitting(false);
    }
  };

  // --- Airbnb-Style UI Design ---

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#fff' }}
      keyboardVerticalOffset={72}
    >
      <View style={styles2.header}>
        <TouchableOpacity
          onPress={() => (navigation as any).goBack()}
          style={styles2.headerBtn}
          hitSlop={{ top:10, left:10, right:10, bottom:10 }}
        >
          <MaterialIcons name="close" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={styles2.headerTitle}>
          {t('contactHost.header', 'Contact host')}
        </Text>
        <View style={{width: 44}} />
      </View>

      <ScrollView contentContainerStyle={styles2.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles2.pageTitle}>
          {t('contactHost.pageTitle', 'Message the host to start your reservation')}
        </Text>
        
        {/* Property Card */}
        <View style={styles2.propertyCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {params.propertyImage ? (
              <Image source={{ uri: params.propertyImage }} style={styles2.propertyThumb} />
            ) : (
              <View style={[styles2.propertyThumb, {backgroundColor:'#EEE', justifyContent:'center', alignItems:'center'}]}>
                <MaterialIcons name="image" size={20} color="#AAA" />
              </View>
            )}
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles2.propertyName} numberOfLines={1}>{params.propertyTitle}</Text>
              {!!params.propertyCity && (
                <Text style={styles2.propertyCity} numberOfLines={1}>{params.propertyCity}</Text>
              )}
              {!!params.nightlyPrice && (
                <Text style={styles2.propertyPrice}>
                  {params.nightlyPrice.toLocaleString()} MRU{t('contactHost.perNight', '/night')}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Host Card */}
        <View style={styles2.hostCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {params.hostAvatarURL ? (
              <Image source={{ uri: params.hostAvatarURL }} style={styles2.hostAvatar} />
            ) : (
              <View style={[styles2.hostAvatar, {backgroundColor:'#EEE', justifyContent:'center', alignItems:'center'}]}>
                <MaterialIcons name="person" size={20} color="#AAA" />
              </View>
            )}
            <View style={{ marginLeft: 12 }}>
              <Text style={styles2.hostName} numberOfLines={1}>{params.hostName || params.recipientName || 'Host'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                <MaterialIcons name="verified-user" size={14} color="#00a699" style={{ marginRight:2 }} />
                <Text style={styles2.hostMeta}>
                  {t('contactHost.hostMeta', 'Verified host')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Message Box */}
        <View style={styles2.messageEditCard}>
          <Text style={styles2.sectionLabel}>
            {t('contactHost.messageLabel', 'Message')}
          </Text>
          <View style={[
            styles2.messageBox,
            { borderColor: !!error ? '#dd4b39' : '#dce0e0' }
          ]}>
            <TextInput
              style={styles2.messageInput}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={450}
              placeholder={t('contactHost.inputPlaceholder', 'Introduce yourself and ask any questions')}
              editable={!submitting}
              placeholderTextColor="#aaa"
              textAlignVertical="top"
              selectionColor="#222"
              blurOnSubmit={false}
            />
            <Text style={styles2.charCount}>{messageText.length}/450</Text>
          </View>
        </View>
        <Text style={styles2.disclaimerText}>
          {t('contactHost.noticeInfo', "For your safety, only communicate through the app. We'll send this message to the host.")}
        </Text>

        {!!error && <Text style={styles2.errorMsg}>{error}</Text>}

        <View style={{height: 60}} />
      </ScrollView>

      <View style={styles2.footer}>
        <TouchableOpacity
          style={[styles2.sendBtn, submitting ? {opacity: 0.5} : null]}
          disabled={submitting || !messageText.trim()}
          onPress={handleSend}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles2.sendBtnText}>
              {t('contactHost.cta', 'Send message')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles2 = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
    paddingBottom: 18,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ededed',
    backgroundColor: '#fff',
    elevation: 2,
    zIndex: 99,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ededed',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    letterSpacing: 0,
  },
  scrollContent: {
    padding: 0,
    backgroundColor: '#fff',
  },
  pageTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#222',
    textAlign: 'left',
    marginTop: 24,
    marginHorizontal: 18,
    marginBottom: 20,
  },

  // Property card Airbnb-style
  propertyCard: {
    backgroundColor: '#fafbfb',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eef1f1',
    marginBottom: 14,
    padding: 13,
    shadowColor: "#f5f5f5",
    elevation: 0,
  },
  propertyThumb: {
    width: 54,
    height: 54,
    borderRadius: 11,
    backgroundColor: '#f5f5f5',
  },
  propertyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  propertyCity: {
    fontSize: 13,
    color: '#666',
    marginTop: 1,
  },
  propertyPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginTop: 4,
  },

  hostCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eef1f1",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 13,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#f5f5f5",
    elevation: 0,
  },
  hostAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f1f1f1',
  },
  hostName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 1,
  },
  hostMeta: {
    fontSize: 13,
    color: '#12a595',
    marginLeft: 2,
    fontWeight: '600',
  },

  messageEditCard: {
    backgroundColor: "#fff",
    borderWidth: 0,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    paddingTop: 2,
  },
  sectionLabel: {
    fontSize: 14,
    color: "#4d4d4d",
    fontWeight: "600",
    letterSpacing: .1,
    marginBottom: 9,
    marginLeft: 1,
  },
  messageBox: {
    borderWidth: 1.25,
    backgroundColor: "#fafbfb",
    borderColor: "#dce0e0",
    borderRadius: 11,
    minHeight: 88,
    padding: 11,
    justifyContent: 'flex-start',
    position: 'relative',
  },
  messageInput: {
    color: '#2d2d2d',
    fontSize: 15.5,
    fontWeight: '500',
    minHeight: 56,
    maxHeight: 120,
    textAlignVertical: 'top',
    flex: 1,
    padding: 0,
  },
  charCount: {
    position: 'absolute',
    right: 10,
    bottom: 9,
    fontSize: 13,
    color: '#adb0b1',
  },
  disclaimerText: {
    color: "#7e7e7e",
    fontSize: 13.2,
    marginTop: 18,
    marginHorizontal: 20,
    textAlign: "left",
    marginBottom: 2,
  },
  errorMsg: {
    color: '#cc1818',
    fontWeight: '600',
    fontSize: 14.1,
    marginHorizontal: 18,
    marginVertical: 9,
    textAlign: "left",
  },
  footer: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: '#ececec',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    width: "100%",
  },
  sendBtn: {
    backgroundColor: "#222",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  sendBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16.2,
    letterSpacing: 0,
  }
});

