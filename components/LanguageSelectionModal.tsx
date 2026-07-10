import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, GlobeSimpleIcon, ArrowRightIcon } from 'phosphor-react-native';

interface LanguageSelectionModalProps {
  visible: boolean;
  onLanguageSelected: (language: string) => void;
}

// Clean, small, no flags, minimal, accessible, explainable = inspired by Airbnb DS
const LANGUAGES = [
  {
    code: 'fr',
    name: 'Français',
    nativeName: 'Français',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
  },
  {
    code: 'ar',
    name: 'العربية',
    nativeName: 'العربية',
  },
];

export const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({
  visible,
  onLanguageSelected,
}) => {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState('fr'); // default to French

  const handleContinue = () => {
    if (onLanguageSelected) {
      onLanguageSelected(selectedLanguage);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="formSheet"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <View style={styles.overlay}>
        <View style={styles.wrapper}>
          {/* ICON HEADER */}
          <View style={styles.iconCircle}>
            <GlobeSimpleIcon size={36} color="#FF385C" weight="duotone" />
          </View>
          {/* TITLE */}
          <Text style={styles.headerText}>
            {t('language.chooseLabel', 'Choose your language')}
          </Text>
          <Text style={styles.subText}>
            {t(
              'language.chooseHint',
              'Select your preferred language to continue using Habitat'
            )}
          </Text>

          {/* OPTIONS */}
          <View style={styles.optionsList}>
            {LANGUAGES.map((lang) => {
              const selected = selectedLanguage === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => setSelectedLanguage(lang.code)}
                  style={[
                    styles.optionRow,
                    selected && styles.optionRowSelected,
                  ]}
                  accessibilityRole="button"
                  activeOpacity={0.75}
                >
                  <View style={styles.textColumn}>
                    <Text
                      style={[
                        styles.optionMain,
                        selected && styles.selectedMain,
                      ]}
                    >
                      {lang.nativeName}
                    </Text>
                    <Text
                      style={[
                        styles.optionSecondary,
                        selected && styles.selectedSecondary,
                      ]}
                    >
                      {lang.name}
                    </Text>
                  </View>
                  {selected ? (
                    <CheckCircleIcon
                      size={18}
                      color="#FF385C"
                      weight="fill"
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* BUTTON */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleContinue}
            accessibilityRole="button"
            accessibilityLabel={t('language.cta', 'Continue')}
            activeOpacity={selectedLanguage ? 0.8 : 1}
            disabled={!selectedLanguage}
          >
            <Text style={styles.ctaText}>
              {t('language.cta', 'Continue')}
            </Text>
            <ArrowRightIcon size={16} color="#FF385C" weight="bold" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Airbnb-systemy, neutral colors, reduced paddings & font sizes, no flags, no shadow, focus ring simulated by color
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(250,250,250,0.97)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    width: 340,
    backgroundColor: '#FFF',
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 18,
    minHeight: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ebebeb',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAEBEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 2,
  },
  headerText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'System',
  },
  subText: {
    fontSize: 13,
    color: '#717171',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 2,
    fontFamily: 'System',
  },
  optionsList: {
    width: '100%',
    marginBottom: 22,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#ebebeb',
    minHeight: 40,
  },
  optionRowSelected: {
    backgroundColor: '#FFF2F7',
    borderColor: '#FF385C',
  },
  textColumn: {
    flex: 1,
  },
  optionMain: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    fontFamily: 'System',
  },
  optionSecondary: {
    fontSize: 11,
    color: '#868686',
    fontFamily: 'System',
  },
  selectedMain: {
    color: '#FF385C',
  },
  selectedSecondary: {
    color: '#FF385C',
    fontWeight: '500',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FF385C',
    borderRadius: 11,
    paddingHorizontal: 18,
    paddingVertical: 7,
    minHeight: 32,
  },
  ctaText: {
    color: '#FF385C',
    fontWeight: '700',
    fontSize: 15,
    marginRight: 6,
    fontFamily: 'System',
  },
});

