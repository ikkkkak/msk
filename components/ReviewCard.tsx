import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ReviewCardProps {
  review: {
    id: number;
    userID: number;
    stars: number;
    title: string;
    body: string;
    createdAt: string;
    user: {
      firstName: string;
      lastName: string;
      avatarURL: string;
    };
    isVerified: boolean;
  };
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <MaterialIcons
        key={index}
        name="star"
        size={14}
        color={index < rating ? '#FFD700' : '#E0E0E0'}
      />
    ));
  };

  return (
    <View style={styles.container}>
      {/* User Info */}
      <View style={styles.userInfo}>
        <Image
          source={{ uri: review.user.avatarURL || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <View style={styles.userDetails}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>
              {review.user.firstName} {review.user.lastName}
            </Text>
            {review.isVerified && (
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={12} color="#008489" />
              </View>
            )}
          </View>
          <View style={styles.ratingRow}>
            <View style={styles.stars}>
              {renderStars(review.stars)}
            </View>
            <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
          </View>
        </View>
      </View>

      {/* Review Content */}
      <View style={styles.content}>
        {review.title && (
          <Text style={styles.title}>{review.title}</Text>
        )}
        {review.body && (
          <Text style={styles.body}>{review.body}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    fontFamily: 'CircularStd-Medium',
  },
  verifiedBadge: {
    marginLeft: 6,
    backgroundColor: '#E8F5E8',
    borderRadius: 10,
    padding: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stars: {
    flexDirection: 'row',
  },
  date: {
    fontSize: 12,
    color: '#717171',
    fontFamily: 'CircularStd-Book',
  },
  content: {
    marginLeft: 52, // Align with user details
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 8,
    fontFamily: 'CircularStd-Medium',
  },
  body: {
    fontSize: 14,
    color: '#484848',
    lineHeight: 20,
    fontFamily: 'CircularStd-Book',
  },
});