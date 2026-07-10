import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, Dimensions, I18nManager } from 'react-native';
import { RootStackScreenProps } from '../types';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Calendar, Users, CreditCard, Clock, ArrowLeft, ChatsCircle } from 'phosphor-react-native';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

const AirbnbDivider = () => <View style={styles.divider} />;

export const ReservationConfirmationScreen: React.FC<RootStackScreenProps<'ReservationConfirmation'>> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { 
    reservation, 
    propertyTitle, 
    propertyImage, 
    checkIn, 
    checkOut, 
    totalGuests, 
    totalPrice, 
    currency = 'MRU' 
  } = route.params || {};

  const [countdown, setCountdown] = useState<string>('');

  const formatDate = useCallback(
    (dateString: string) => {
      // Airbnb shows locale-style dates, here we keep it EN for demo; in real cases use device locale.
      return new Date(dateString).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }, []
  );
  const formatTime = useCallback(
    (dateString: string) => new Date(dateString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    }), []
  );

  useEffect(() => {
    if (!reservation?.expiresAt) return;
    const end = new Date(reservation.expiresAt).getTime();
    const updateCountdown = () => {
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setCountdown(t('expired'));
      } else {
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setCountdown(t('countdownTime', { hrs, mins }));
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [reservation?.expiresAt, t]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#222" weight="duotone" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('reservationRequest')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Airbnb Check Circle */}
        <View style={styles.topIconContainer}>
          <CheckCircle size={80} color={theme["color-temporary-primary"]} weight="fill" />
        </View>
        <Text style={styles.successTitle}>{t('requestSent')}</Text>
        <Text style={styles.successSubtitle}>
          {t('hostRespond24h')}
        </Text>

        {/* What you can do now section */}
        <View style={styles.inboxSection}>
          <View style={styles.inboxIconBox}>
            <ChatsCircle size={36} color={theme["color-temporary-primary"]} weight="duotone" />
          </View>
          <Text style={styles.inboxSectionTitle}>
            {t('inboxSectionTitle', 'See Owner Responses in Your Inbox')}
          </Text>
          <Text style={styles.inboxSectionDesc}>
            {t(
              'inboxSectionDesc',
              "You can now see messages and owner responses by going to your Inbox and checking for updates there."
            )}
          </Text>
          <TouchableOpacity
            style={styles.inboxButton}
            onPress={() => {
              (navigation as any).navigate('Root', {
                screen: 'Inbox',
                params: { openMessagesTab: true }
              });
            }}
          >
            <Text style={styles.inboxButtonText}>{t('goToInbox', 'Go to Inbox')}</Text>
          </TouchableOpacity>
        </View>
        {/* End of inbox section */}

        <AirbnbDivider />
        {/* Property/Airbnb Card */}
        <View style={styles.propertyCard}>
          <View style={styles.imageContainer}>
            {propertyImage ? (
              <Image
                source={{ uri: propertyImage }}
                style={styles.propertyImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.propertyImage, { backgroundColor: '#EFEFEF' }]} />
            )}
          </View>
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyTitle} numberOfLines={2}>
              {propertyTitle || t('reservation.propertyFallback', 'Property')}
            </Text>
            <Text style={styles.propertyLocation} numberOfLines={1}>
              {t('locationNouakchott')}
            </Text>
          </View>
        </View>
        <AirbnbDivider />

        {/* Reservation Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>{t('reservationDetails')}</Text>
          <View style={styles.detailRow}>
            <Calendar size={20} color={theme["color-temporary-primary"]} />
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>{t('checkIn')}</Text>
              <Text style={styles.detailValue}>{formatDate(checkIn)}</Text>
              <Text style={styles.detailTime}>{formatTime(checkIn)}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Calendar size={20} color={theme["color-temporary-primary"]} />
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>{t('checkOut')}</Text>
              <Text style={styles.detailValue}>{formatDate(checkOut)}</Text>
              <Text style={styles.detailTime}>{formatTime(checkOut)}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Users size={20} color="#717171" />
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>{t('guests')}</Text>
              <Text style={styles.detailValue}>
                {t(totalGuests === 1 ? 'guest' : 'guests', { count: totalGuests })}
              </Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <CreditCard size={20} color="#717171" />
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>{t('total')}</Text>
              <Text style={styles.detailValue}>
                {currency === 'MRU'
                  ? `${totalPrice} MRU`
                  : t('totalWithCurrency', { price: totalPrice?.toFixed(2) ?? '', currency: currency })}
              </Text>
            </View>
          </View>
        </View>

        {/* Pending Host Response */}
        <View style={styles.pendingCard}>
          <View style={styles.pendingHeader}>
            <Clock size={24} color="#FFB400" />
            <Text style={styles.pendingTitle}>{t('pendingResponse')}</Text>
          </View>
          <Text style={styles.pendingDesc}>
            {t('pendingDesc')}
          </Text>
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        </View>
        <AirbnbDivider />
        {/* Next Steps */}
        <View style={styles.nextCard}>
          <Text style={styles.sectionTitle}>{t('whatHappensNext')}</Text>
          <View style={styles.nextStepRow}>
            <View style={styles.nextStepNumber}><Text style={styles.nextStepNumberTxt}>1</Text></View>
            <Text style={styles.nextStepText}>{t('hostReviews')}</Text>
          </View>
          <View style={styles.nextStepRow}>
            <View style={styles.nextStepNumber}><Text style={styles.nextStepNumberTxt}>2</Text></View>
            <Text style={styles.nextStepText}>{t('youReceiveNotif')}</Text>
          </View>
          <View style={styles.nextStepRow}>
            <View style={styles.nextStepNumber}><Text style={styles.nextStepNumberTxt}>3</Text></View>
            {/* <Text style={styles.nextStepText}>{t('ifAcceptedCharged')}</Text> */}
          </View>
        </View>

        {/* Chat Message */}
        <View style={styles.chatCard}>
          <Text style={styles.chatCardTitle}>{t('reservationSentInChat')}</Text>
          <Text style={styles.chatCardBody}>{t('reservationInChatDesc')}</Text>
          <TouchableOpacity
            onPress={() => {
              (navigation as any).navigate('Root', {
                screen: 'Inbox',
                params: { openMessagesTab: true }
              });
            }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>{t('openChat')}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('Root', {
            screen: 'MyReservations',
          })}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>{t('done')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginTop: '8%',
    backgroundColor: '#fff'
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center'
  },
  content: {
    padding: 24,
    paddingBottom: 0
  },
  topIconContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 12,
    textAlign: 'center'
  },
  successSubtitle: {
    fontSize: 16,
    color: '#717171',
    marginTop: 4,
    textAlign: 'center',
    marginBottom: 8
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
    marginHorizontal: -24
  },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#222',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    marginBottom: 0
  },
  imageContainer: { marginRight: 14 },
  propertyImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#EEE'
  },
  propertyInfo: { flex: 1, justifyContent: 'center' },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 2
  },
  propertyLocation: {
    fontSize: 13,
    color: '#6A6A6A',
    marginTop: 1
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    padding: 16,
    marginTop: 20,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
    color: '#222'
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 13,
  },
  detailBody: { marginLeft: 10, flex: 1 },
  detailLabel: { fontSize: 13, color: '#888', marginBottom: 2 },
  detailValue: { fontSize: 15.5, color: '#222', fontWeight: '600' },
  detailTime: { fontSize: 14, color: '#888', marginTop: 1 },
  pendingCard: {
    backgroundColor: '#FFF7F0',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFE4CC',
    padding: 18,
    marginBottom: 14,
    marginTop: 4,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FA8700',
    marginLeft: 7,
  },
  pendingDesc: {
    fontSize: 14,
    color: '#B06C00',
    marginBottom: 10,
    lineHeight: 21,
  },
  countdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 14,
    color: theme["color-temporary-primary"],
    fontWeight: '700',
  },
  nextCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    padding: 17,
    marginBottom: 10,
  },
  nextStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
    marginTop: 2,
  },
  nextStepNumber: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: theme["color-temporary-primary"],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nextStepNumberTxt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFF',
  },
  nextStepText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    flex: 1
  },
  chatCard: {
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FAFAFA',
    marginTop: 16,
    marginBottom: 8,
  },
  chatCardTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#222',
    marginBottom: 3,
  },
  chatCardBody: {
    fontSize: 14,
    color: '#444',
    marginBottom: 14,
  },
  bottomActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  primaryButton: {
    backgroundColor: theme["color-temporary-primary"],
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15.3,
    fontWeight: '700'
  },
  inboxSection: {
    backgroundColor: '#F9F7FE',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEAFF',
    padding: 16,
    marginBottom: 18,
    marginTop: 10,
    alignItems: 'center',
    flexDirection: 'column',
  },
  inboxIconBox: {
    marginBottom: 5,
    padding: 8,
    borderRadius: 100,
    backgroundColor: '#E7E1FE',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center'
  },
  inboxSectionTitle: {
    fontSize: 16,
    color: theme["color-temporary-primary"],
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
    marginTop: 2,
  },
  inboxSectionDesc: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 20,
  },
  inboxButton: {
    backgroundColor: theme["color-temporary-primary"],
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginTop: 4,
  },
  inboxButtonText: {
    color: '#FFF',
    fontSize: 15.1,
    fontWeight: '600'
  },
});

export default ReservationConfirmationScreen;

/* 
---- TRANSLATIONS ----
Paste this into your ar.json to add the Arabic translations for the used keys.

{
  "reservationRequest": "طلب الحجز",
  "requestSent": "تم إرسال الطلب بنجاح!",
  "hostRespond24h": "تم إرسال طلب الحجز للمُضيف. ستتلقى رداً خلال 24 ساعة.",
  "property": "العقار",
  "locationNouakchott": "نواكشوط، موريتانيا",
  "reservationDetails": "تفاصيل الحجز",
  "checkIn": "تسجيل الوصول",
  "checkOut": "تسجيل المغادرة",
  "guests": "{{count}} ضيوف",
  "guest": "{{count}} ضيف",
  "total": "المجموع",
  "totalWithCurrency": "{{price}} {{currency}}",
  "pendingResponse": "بانتظار رد المضيف",
  "pendingDesc": "طلبك بانتظار رد المضيف. لديه 24 ساعة للقبول أو الرفض.",
  "countdownTime": "{{hrs}}س {{mins}}د متبقي",
  "expired": "انتهت المهلة",
  "whatHappensNext": "ما الذي سيحدث بعد ذلك؟",
  "hostReviews": "المضيف يراجع طلبك",
  "youReceiveNotif": "ستتلقى إشعارًا بقراره",
  "ifAcceptedCharged": "في حال الموافقة سيتم الخصم وتتلقى التأكيد",
  "reservationSentInChat": "تم إرسال الحجز في المحادثة",
  "reservationInChatDesc": "لقد أرسلنا حجزك في محادثة بينك وبين المضيف. يمكنك رؤيته في المحادثة.",
  "openChat": "فتح المحادثة",
  "done": "تم",

  "inboxSectionTitle": "شاهد ردود المالك في صندوق الوارد",
  "inboxSectionDesc": "يمكنك الآن رؤية الرسائل وردود المالك من خلال الذهاب إلى صندوق الوارد الخاص بك ومتابعة المستجدات هناك.",
  "goToInbox": "الانتقال إلى صندوق الوارد"
}
*/
