import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCreateReviewMutation } from '../hooks/mutations/useCreateReviewMutation';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  propertyId: number;
  reservationId: number;
  onSuccess: () => void;
}

const { width } = Dimensions.get('window');

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  propertyId,
  reservationId,
  onSuccess,
}) => {
  const [stars, setStars] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  const createReview = useCreateReviewMutation();

  const handleStarPress = (rating: number) => {
    setStars(rating);
  };

  const handleSubmit = async () => {
    if (stars === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }

    try {
      await createReview.mutateAsync({
        propertyId,
        reservationId,
        stars,
        title: title.trim(),
        body: body.trim(),
      });
      
      onSuccess();
      onClose();
      
      // Reset form
      setStars(0);
      setTitle('');
      setBody('');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    }
  };

  const getStarLabel = (rating: number) => {
    const labels = {
      1: 'Poor',
      2: 'Fair', 
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return labels[rating as keyof typeof labels] || '';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#222222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Write a Review</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Rating Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How was your stay?</Text>
            <Text style={styles.sectionSubtitle}>Your overall rating</Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleStarPress(star)}
                  onPressIn={() => setHoveredStar(star)}
                  onPressOut={() => setHoveredStar(0)}
                  style={styles.starButton}
                >
                  <MaterialIcons
                    name="star"
                    size={40}
                    color={
                      star <= (hoveredStar || stars)
                        ? '#FFD700'
                        : '#E0E0E0'
                    }
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            {stars > 0 && (
              <Text style={styles.starLabel}>{getStarLabel(stars)}</Text>
            )}
          </View>

          {/* Title Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add a title</Text>
            <Text style={styles.sectionSubtitle}>Summarize your visit or highlight what you liked</Text>
            
            <TextInput
              style={styles.titleInput}
              placeholder="e.g., Great location, amazing host!"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              multiline
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          {/* Review Body */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tell us more</Text>
            <Text style={styles.sectionSubtitle}>What made your stay special? Any tips for other guests?</Text>
            
            <TextInput
              style={styles.bodyInput}
              placeholder="Share details about your experience..."
              value={body}
              onChangeText={setBody}
              maxLength={1000}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{body.length}/1000</Text>
          </View>

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                stars === 0 && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={stars === 0 || createReview.isPending}
            >
              <Text style={[
                styles.submitButtonText,
                stars === 0 && styles.submitButtonTextDisabled
              ]}>
                {createReview.isPending ? 'Submitting...' : 'Submit Review'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
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
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    fontFamily: 'CircularStd-Medium',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 8,
    fontFamily: 'CircularStd-Medium',
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#717171',
    marginBottom: 20,
    fontFamily: 'CircularStd-Book',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  starLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    textAlign: 'center',
    fontFamily: 'CircularStd-Medium',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    fontFamily: 'CircularStd-Book',
    backgroundColor: '#FAFAFA',
    minHeight: 50,
  },
  bodyInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    fontFamily: 'CircularStd-Book',
    backgroundColor: '#FAFAFA',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#717171',
    textAlign: 'right',
    marginTop: 4,
    fontFamily: 'CircularStd-Book',
  },
  submitSection: {
    marginTop: 32,
    marginBottom: 40,
  },
  submitButton: {
    backgroundColor: '#222222',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'CircularStd-Medium',
  },
  submitButtonTextDisabled: {
    color: '#9E9E9E',
  },
});


