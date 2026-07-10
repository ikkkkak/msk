import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export const ChoosePropertyOrLandTypeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleProperty = () => {
    // Close this screen first (slide down), then navigate
    navigation.goBack();
    setTimeout(() => {
      (navigation as any).navigate('CreatePropertySale');
    }, 300); // Wait for slide down animation
  };

  const handleLand = () => {
    // Close this screen first (slide down), then navigate
    navigation.goBack();
    setTimeout(() => {
      (navigation as any).navigate('CreateLandmark');
    }, 300); // Wait for slide down animation
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="close" size={24} color="#717171" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {t('organization.addPropertyOrLand.chooseType.title', 'What would you like to add?')}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {t('organization.addPropertyOrLand.chooseType.message', 'Select the type of listing you want to create')}
        </Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {/* Property Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleProperty}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, styles.propertyIconContainer]}>
              <MaterialIcons name="home" size={32} color="#00A699" />
            </View>
            <Text style={styles.optionTitle}>
              {t('organization.addPropertyOrLand.chooseType.property', 'Property for Sale')}
            </Text>
            <Text style={styles.optionDescription}>
              {t('organization.addPropertyOrLand.chooseType.propertyDescription', 'List houses, apartments, commercial buildings, and other properties')}
            </Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={16} color="#00A699" />
                <Text style={styles.featureText}>
                  {t('organization.addPropertyOrLand.chooseType.propertyFeature1', 'Houses & Apartments')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={16} color="#00A699" />
                <Text style={styles.featureText}>
                  {t('organization.addPropertyOrLand.chooseType.propertyFeature2', 'Commercial Buildings')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={16} color="#00A699" />
                <Text style={styles.featureText}>
                  {t('organization.addPropertyOrLand.chooseType.propertyFeature3', 'Detailed listings with photos')}
                </Text>
              </View>
            </View>
            <View style={styles.arrowContainer}>
              <MaterialIcons name="arrow-forward" size={20} color="#00A699" />
            </View>
          </TouchableOpacity>

          {/* Land Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleLand}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, styles.landIconContainer]}>
              <MaterialIcons name="landscape" size={32} color="#FF385C" />
            </View>
            <Text style={styles.optionTitle}>
              {t('organization.addPropertyOrLand.chooseType.land', 'Land for Sale')}
            </Text>
            <Text style={styles.optionDescription}>
              {t('organization.addPropertyOrLand.chooseType.landDescription', 'List land plots, vacant lots, and development sites')}
            </Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={16} color="#FF385C" />
                <Text style={styles.featureText}>
                  {t('organization.addPropertyOrLand.chooseType.landFeature1', 'Land Plots & Vacant Lots')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={16} color="#FF385C" />
                <Text style={styles.featureText}>
                  {t('organization.addPropertyOrLand.chooseType.landFeature2', 'Development Sites')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={16} color="#FF385C" />
                <Text style={styles.featureText}>
                  {t('organization.addPropertyOrLand.chooseType.landFeature3', 'Map-based boundaries')}
                </Text>
              </View>
            </View>
            <View style={styles.arrowContainer}>
              <MaterialIcons name="arrow-forward" size={20} color="#FF385C" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222222',
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginHorizontal: 16,
  },
  placeholder: {
    width: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#717171',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    lineHeight: 22,
  },
  optionsContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#EBEBEB',
    padding: 20,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  propertyIconContainer: {
    backgroundColor: '#F0FFF4',
  },
  landIconContainer: {
    backgroundColor: '#FFF0F5',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  optionDescription: {
    fontSize: 15,
    color: '#717171',
    marginBottom: 16,
    lineHeight: 22,
  },
  featuresList: {
    gap: 12,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#222222',
    flex: 1,
    lineHeight: 20,
  },
  arrowContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
});

