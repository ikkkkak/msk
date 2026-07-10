import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCancelReservationMutation } from '../hooks/mutations/useCancelReservationMutation';

interface CancellationModalProps {
  visible: boolean;
  onClose: () => void;
  reservation: {
    ID: number;
    property: {
      title: string;
      cancellationPolicy: string;
    };
    checkIn: string;
    totalPrice: number;
    currency: string;
    status: string;
  };
}

export const CancellationModal: React.FC<CancellationModalProps> = ({
  visible,
  onClose,
  reservation,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const cancelMutation = useCancelReservationMutation();

  const getCancellationPolicyDetails = (policy: string) => {
    switch (policy) {
      case 'flexible':
        return {
          title: 'Flexible',
          description: 'Full refund if cancelled 24+ hours before check-in',
          icon: 'check-circle',
          color: '#10B981',
        };
      case 'moderate':
        return {
          title: 'Moderate',
          description: 'Full refund if cancelled 5+ days before check-in, 50% refund if cancelled 1-4 days before',
          icon: 'warning',
          color: '#F59E0B',
        };
      case 'strict':
        return {
          title: 'Strict',
          description: '50% refund if cancelled 7+ days before check-in',
          icon: 'error',
          color: '#EF4444',
        };
      default:
        return {
          title: 'Flexible',
          description: 'Full refund if cancelled 24+ hours before check-in',
          icon: 'check-circle',
          color: '#10B981',
        };
    }
  };

  const calculateRefundInfo = () => {
    const now = new Date();
    const checkIn = new Date(reservation.checkIn);
    const daysUntilCheckIn = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const policy = reservation.property.cancellationPolicy;

    switch (policy) {
      case 'flexible':
        if (daysUntilCheckIn >= 1) {
          return {
            canCancel: true,
            refundAmount: reservation.totalPrice,
            refundPercentage: 100,
            message: `Full refund - ${daysUntilCheckIn} days until check-in`,
          };
        }
        return {
          canCancel: false,
          refundAmount: 0,
          refundPercentage: 0,
          message: 'No refund - less than 24 hours until check-in',
        };

      case 'moderate':
        if (daysUntilCheckIn >= 5) {
          return {
            canCancel: true,
            refundAmount: reservation.totalPrice,
            refundPercentage: 100,
            message: `Full refund - ${daysUntilCheckIn} days until check-in`,
          };
        }
        if (daysUntilCheckIn >= 1) {
          return {
            canCancel: true,
            refundAmount: reservation.totalPrice * 0.5,
            refundPercentage: 50,
            message: `50% refund - ${daysUntilCheckIn} days until check-in`,
          };
        }
        return {
          canCancel: false,
          refundAmount: 0,
          refundPercentage: 0,
          message: 'No refund - less than 24 hours until check-in',
        };

      case 'strict':
        if (daysUntilCheckIn >= 7) {
          return {
            canCancel: true,
            refundAmount: reservation.totalPrice * 0.5,
            refundPercentage: 50,
            message: `50% refund - ${daysUntilCheckIn} days until check-in`,
          };
        }
        return {
          canCancel: false,
          refundAmount: 0,
          refundPercentage: 0,
          message: 'No refund - less than 7 days until check-in',
        };

      default:
        if (daysUntilCheckIn >= 1) {
          return {
            canCancel: true,
            refundAmount: reservation.totalPrice,
            refundPercentage: 100,
            message: `Full refund - ${daysUntilCheckIn} days until check-in`,
          };
        }
        return {
          canCancel: false,
          refundAmount: 0,
          refundPercentage: 0,
          message: 'No refund - less than 24 hours until check-in',
        };
    }
  };

  const policyDetails = getCancellationPolicyDetails(reservation.property.cancellationPolicy);
  const refundInfo = calculateRefundInfo();

  const handleCancel = async () => {
    if (reservation.status === 'confirmed' || reservation.status === 'completed') {
      Alert.alert(
        'Cannot Cancel',
        'This reservation has been confirmed and cannot be cancelled.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!refundInfo.canCancel) {
      Alert.alert(
        'Cannot Cancel',
        refundInfo.message,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Cancel Reservation',
      `Are you sure you want to cancel your reservation for ${reservation.property.title}? ${refundInfo.message}`,
      [
        { text: 'Keep Reservation', style: 'cancel' },
        {
          text: 'Cancel Reservation',
          style: 'destructive',
          onPress: async () => {
            setIsConfirming(true);
            try {
              await cancelMutation.mutateAsync(reservation.ID);
              Alert.alert(
                'Reservation Cancelled',
                `Your reservation has been cancelled. Refund: ${refundInfo.refundAmount.toFixed(2)} ${reservation.currency}`,
                [{ text: 'OK', onPress: onClose }]
              );
            } catch (error) {
              Alert.alert(
                'Cancellation Failed',
                error instanceof Error ? error.message : 'Failed to cancel reservation',
                [{ text: 'OK' }]
              );
            } finally {
              setIsConfirming(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Cancel Reservation</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.propertyTitle}>{reservation.property.title}</Text>
            
            <View style={styles.policySection}>
              <View style={styles.policyHeader}>
                <MaterialIcons 
                  name={policyDetails.icon as any} 
                  size={20} 
                  color={policyDetails.color} 
                />
                <Text style={styles.policyTitle}>{policyDetails.title} Cancellation Policy</Text>
              </View>
              <Text style={styles.policyDescription}>{policyDetails.description}</Text>
            </View>

            {reservation.status === 'confirmed' || reservation.status === 'completed' ? (
              <View style={styles.warningSection}>
                <MaterialIcons name="warning" size={20} color="#EF4444" />
                <Text style={styles.warningText}>
                  This reservation has been confirmed and cannot be cancelled.
                </Text>
              </View>
            ) : !refundInfo.canCancel ? (
              <View style={styles.warningSection}>
                <MaterialIcons name="info" size={20} color="#F59E0B" />
                <Text style={styles.warningText}>
                  {refundInfo.message}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Keep Reservation</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.confirmButton,
                (!refundInfo.canCancel || reservation.status === 'confirmed' || reservation.status === 'completed') && styles.disabledButton
              ]} 
              onPress={handleCancel}
              disabled={!refundInfo.canCancel || reservation.status === 'confirmed' || reservation.status === 'completed' || isConfirming}
            >
              {isConfirming ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Cancel Reservation</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 16,
  },
  policySection: {
    marginBottom: 20,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginLeft: 8,
  },
  policyDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  refundSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  refundTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  refundInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  refundAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  refundPercentage: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  refundMessage: {
    fontSize: 13,
    color: '#666',
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    color: '#EF4444',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#E5E5E5',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

