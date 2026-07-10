import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { RootStackScreenProps } from '../types';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  MapPin, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Phone, 
  ChatCircle,
  Star,
  Share
} from 'phosphor-react-native';

export const TripDetailsScreen: React.FC<RootStackScreenProps<'TripDetails'>> = ({ route, navigation }) => {
  const { reservation } = route.params;
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (reservation?.status === 'pending' && reservation?.expiresAt) {
      const end = new Date(reservation.expiresAt).getTime();
      const updateCountdown = () => {
        const now = Date.now();
        const diff = end - now;
        if (diff <= 0) {
          setCountdown('Expired');
        } else {
          const hrs = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setCountdown(`${hrs}h ${mins}m remaining`);
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 60000);
      return () => clearInterval(interval);
    }
  }, [reservation?.expiresAt, reservation?.status]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string = 'MRU') => {
    return currency === 'MRU' ? `${amount} MRU` : `$${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "#1F8A70";
      case "pending":
        return "#FF8C00";
      case "cancelled":
      case "rejected":
        return "#FF5A5F";
      case "expired":
        return "#717171";
      default:
        return "#717171";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "pending":
        return "Pending Host Response";
      case "cancelled":
        return "Cancelled";
      case "rejected":
        return "Rejected";
      case "expired":
        return "Expired";
      default:
        return status;
    }
  };

  const handleCancelReservation = () => {
    Alert.alert(
      'Cancel Reservation',
      'Are you sure you want to cancel this reservation? This action cannot be undone.',
      [
        { text: 'Keep Reservation', style: 'cancel' },
        { 
          text: 'Cancel Reservation', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement cancel reservation API call
            Alert.alert('Reservation Cancelled', 'Your reservation has been cancelled.');
          }
        }
      ]
    );
  };

  const handleContactHost = () => {
    // TODO: Navigate to chat with host
    Alert.alert('Contact Host', 'Opening chat with host...');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#222222" weight="duotone" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Share size={24} color="#222222" weight="duotone" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Property Card */}
        <View style={styles.propertyCard}>
          <View style={styles.propertyImageContainer}>
            {reservation?.property?.images?.[0] ? (
              <Image 
                source={{ uri: reservation.property.images[0] }} 
                style={styles.propertyImage}
              />
            ) : (
              <View style={[styles.propertyImage, styles.placeholderImage]} />
            )}
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(reservation?.status) }
            ]}>
              <Text style={styles.statusText}>
                {getStatusText(reservation?.status)}
              </Text>
            </View>
          </View>
          
          <View style={styles.propertyDetails}>
            <Text style={styles.propertyTitle}>
              {reservation?.property?.title || 'Property'}
            </Text>
            <View style={styles.propertyMeta}>
              <MapPin size={16} color="#717171" />
              <Text style={styles.propertyLocation}>
                {reservation?.property?.city || 'Nouakchott'}, Mauritania
              </Text>
            </View>
            {reservation?.property?.rating && (
              <View style={styles.ratingContainer}>
                <Star size={16} color="#FFB400" weight="fill" />
                <Text style={styles.ratingText}>
                  {reservation.property.rating.toFixed(1)}
                </Text>
                <Text style={styles.reviewsText}>
                  ({reservation.property.reviewsCount || 0} reviews)
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Host Information */}
        <View style={styles.hostCard}>
          <Text style={styles.sectionTitle}>Host Information</Text>
          <View style={styles.hostInfo}>
            {reservation?.property?.host?.avatarURL ? (
              <Image 
                source={{ uri: reservation.property.host.avatarURL }} 
                style={styles.hostAvatar}
              />
            ) : (
              <View style={[styles.hostAvatar, styles.placeholderAvatar]} />
            )}
            <View style={styles.hostDetails}>
              <Text style={styles.hostName}>
                {reservation?.property?.host?.firstName} {reservation?.property?.host?.lastName}
              </Text>
              <Text style={styles.hostJoined}>
                Joined {new Date(reservation?.property?.host?.createdAt || '').getFullYear()}
              </Text>
            </View>
            <View style={styles.hostActions}>
              <TouchableOpacity style={styles.contactButton} onPress={handleContactHost}>
                <ChatCircle size={20} color="#00A699" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactButton}>
                <Phone size={20} color="#00A699" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Calendar size={20} color="#717171" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Check-in</Text>
              <Text style={styles.detailValue}>{formatDate(reservation?.checkIn)}</Text>
              <Text style={styles.detailTime}>{formatTime(reservation?.checkIn)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Calendar size={20} color="#717171" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Check-out</Text>
              <Text style={styles.detailValue}>{formatDate(reservation?.checkOut)}</Text>
              <Text style={styles.detailTime}>{formatTime(reservation?.checkOut)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Users size={20} color="#717171" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Guests</Text>
              <Text style={styles.detailValue}>
                {reservation?.numGuests} {reservation?.numGuests === 1 ? 'guest' : 'guests'}
              </Text>
            </View>
          </View>

          {reservation?.note && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <ChatCircle size={20} color="#717171" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Message to Host</Text>
                <Text style={styles.detailValue}>{reservation.note}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Price Breakdown */}
        <View style={styles.priceCard}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total</Text>
            <Text style={styles.priceValue}>
              {formatCurrency(reservation?.totalPrice)}
            </Text>
          </View>
          
        </View>

        {/* Status Information */}
        {reservation?.status === 'pending' && countdown && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Clock size={24} color="#FF8C00" />
              <Text style={styles.statusTitle}>Waiting for Host Response</Text>
            </View>
            <Text style={styles.statusDescription}>
              The host has 24 hours to respond to your request. You'll be notified of their decision.
            </Text>
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsCard}>
          {reservation?.status === 'pending' && (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelReservation}
            >
              <XCircle size={20} color="#FF5A5F" />
              <Text style={styles.cancelButtonText}>Cancel Request</Text>
            </TouchableOpacity>
          )}
          
          {reservation?.status === 'confirmed' && (
            <TouchableOpacity style={styles.primaryButton}>
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>View Property</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginTop: '15%',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
  },
  shareButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  propertyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 20,
    marginBottom: 20,
  },
  propertyImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  propertyImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  placeholderImage: {
    backgroundColor: '#F2F2F2',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  propertyDetails: {
    marginTop: 12,
  },
  propertyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 8,
  },
  propertyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#717171',
    marginLeft: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 14,
    color: '#717171',
    marginLeft: 4,
  },
  hostCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 16,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  placeholderAvatar: {
    backgroundColor: '#E0E0E0',
  },
  hostDetails: {
    flex: 1,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 4,
  },
  hostJoined: {
    fontSize: 14,
    color: '#717171',
  },
  hostActions: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 20,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#717171',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 2,
  },
  detailTime: {
    fontSize: 14,
    color: '#717171',
  },
  priceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 20,
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
  },
  priceNote: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  priceNoteText: {
    fontSize: 14,
    color: '#717171',
    lineHeight: 20,
  },
  statusCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE4CC',
    padding: 20,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8C00',
    marginLeft: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#B8860B',
    lineHeight: 20,
    marginBottom: 12,
  },
  countdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8C00',
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 20,
    marginBottom: 20,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5A5F',
    marginLeft: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00A699',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default TripDetailsScreen;

