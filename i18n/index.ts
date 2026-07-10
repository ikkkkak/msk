import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from './locales/en.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
};

// Get device language (only source of truth)
// Handles locale codes like "ar-SA", "fr-FR", "en-US" by checking prefix
const getDeviceLanguage = () => {
  try {
    const locales = Localization.getLocales();
    const deviceLang = locales[0]?.languageCode?.toLowerCase() || 'en';
    
    // Check if it starts with supported language code (handles "ar-SA", "fr-FR", etc.)
    if (deviceLang.startsWith('ar')) return 'ar';
    if (deviceLang.startsWith('fr')) return 'fr';
    if (deviceLang.startsWith('en')) return 'en';
    
    return 'en';
  } catch {
    return 'en';
  }
};

// Language is always the device language
const detectLanguage = () => getDeviceLanguage();

// Initialize i18n with proper configuration
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectLanguage(),
    fallbackLng: 'en',
    debug: __DEV__, // Enable debug in development
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    // Ensure proper loading behavior
    load: 'languageOnly',
    cleanCode: true,
    // Critical: Ensure translations are loaded before app renders
    initImmediate: false,
  });

// Always keep i18n in sync with device language on startup
(async () => {
  const deviceLang = getDeviceLanguage();
  if (deviceLang !== i18n.language) {
    await i18n.changeLanguage(deviceLang);
  }
})();

// Export a function to ensure language is set (now just returns current)
export const ensureLanguageRestored = async () => {
  const deviceLang = getDeviceLanguage();
  if (deviceLang !== i18n.language) {
    await i18n.changeLanguage(deviceLang);
  }
  return i18n.language;
};

export default i18n;

