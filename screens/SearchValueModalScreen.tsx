import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SearchValueModalScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const handleClose = async () => {
    try {
      await AsyncStorage.setItem('hasSeenSearchValueModal', 'true');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving value modal status:', error);
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* <LinearGradient
        colors={['#411E18', '#ce9d8c', '#411E18']}
        start={{ x: 1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      > */}

      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {t('search.valueModal.title')}
        </Text>
        <Text style={styles.description}>
          {t('search.valueModal.description')}
        </Text>
        <LinearGradient
        colors={['#411E18','#411E18', '#ce9d8c','#ce9d8c', '#411E18', '#411E18', ]}
        start={{ x: 1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LottieView
          source={require("../assets/lotties/3D-Isometric-Smart-Living-Room.json")}
          autoPlay
          loop
          style={styles.lottieAnimation}
        />
        </LinearGradient>
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
            <Text style={styles.benefitText}>
              {t('search.valueModal.benefit2')}
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
            <Text style={styles.benefitText}>
              {t('search.valueModal.benefit3')}
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
            <Text style={styles.benefitText}>
              {t('search.valueModal.benefit4')}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.8}
        >
          <Text style={styles.closeButtonText}>
            {t('search.valueModal.continue')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#411E18', // Brown background
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieAnimation: {
    width: 400,
    height: 400,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    opacity: 0.95,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  benefitText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginTop: 20,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
  },
});

