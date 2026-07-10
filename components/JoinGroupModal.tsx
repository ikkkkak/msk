import React, { useState } from 'react';
import { View, StyleSheet, Modal, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Text } from '@ui-kitten/components';
import { X, ShieldCheck, UsersThree, User } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { endpoints } from '../constants';
import { useUser } from '../hooks/useUser';

interface JoinGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({ visible, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const handleCheckCode = async () => {
    if (!code.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${endpoints.baseURL}/groups/invite/${code}`
      );
      setGroup(response.data.group);
    } catch (error: any) {
      console.error('Failed to check invite code:', error);
      setError(error.response?.data?.error || 'Invalid or expired invite code');
      setGroup(null);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!code.trim() || !group) return;

    setIsJoining(true);
    setError(null);

    try {
      await axios.post(
        `${endpoints.baseURL}/groups/invite/join`,
        { code },
        { headers: { Authorization: `Bearer ${user?.accessToken}` } }
      );
      
      onSuccess();
      onClose();
      setCode('');
      setGroup(null);
      setError(null);
    } catch (error: any) {
      console.error('Failed to join group:', error);
      setError(error.response?.data?.error || 'Failed to join group');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('groups.joinGroup', 'Join Group')}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#222" weight="bold" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.subtitle}>{t('groups.enterInviteCode', 'Enter the invite code to join')}</Text>
            
            <TextInput
              style={styles.input}
              placeholder={t('groups.inviteCodePlaceholder', 'Enter invite code')}
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!loading && !isJoining}
            />

            {error && (
              <Text style={styles.error}>{error}</Text>
            )}

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#00A699" />
              </View>
            )}

            {group && !loading && (
              <View style={styles.groupPreview}>
                <View style={styles.groupHeader}>
                  <Image 
                    source={{ uri: 'https://via.placeholder.com/64x64?text=GP' }} 
                    style={styles.groupAvatar}
                  />
                  <View style={styles.groupBadge}>
                    <ShieldCheck size={16} color="#00A699" weight="fill" />
                  </View>
                </View>
                
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupDescription}>{group.description || 'No description'}</Text>
                
                <View style={styles.groupInfo}>
                  <View style={styles.infoItem}>
                    <UsersThree size={18} color="#666" />
                    <Text style={styles.infoText}>{group.member_count} members</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <User size={18} color="#666" />
                    <Text style={styles.infoText}>Owner: {group.owner.name}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
                  onPress={handleJoinGroup}
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.joinButtonText}>{t('groups.joinButton', 'Join Group')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {!loading && !group && (
              <TouchableOpacity
                style={styles.checkButton}
                onPress={handleCheckCode}
                disabled={!code.trim()}
              >
                <Text style={styles.checkButtonText}>{t('groups.checkCode', 'Check Code')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#222222',
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#F8F8F8',
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 12,
  },
  error: {
    color: '#FF5A5F',
    fontSize: 14,
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  checkButton: {
    backgroundColor: '#00A699',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#00A699',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  groupPreview: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F8FAF9',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0F4F1',
  },
  groupHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  groupAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  groupBadge: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 2,
    borderColor: '#00A699',
  },
  groupName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#222222',
    textAlign: 'center',
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  groupInfo: {
    gap: 8,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
  },
  joinButton: {
    backgroundColor: '#00A699',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#00A699',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

