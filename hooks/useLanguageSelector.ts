import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const useLanguageSelector = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { i18n } = useTranslation();

  const showLanguageSelector = () => setIsVisible(true);
  const hideLanguageSelector = () => setIsVisible(false);

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    hideLanguageSelector();
  };

  const getCurrentLanguage = () => {
    return i18n.language;
  };

  const getCurrentLanguageName = () => {
    const languages = {
      en: 'English',
      fr: 'Français',
      ar: 'العربية',
    };
    return languages[i18n.language as keyof typeof languages] || 'English';
  };

  return {
    isVisible,
    showLanguageSelector,
    hideLanguageSelector,
    changeLanguage,
    getCurrentLanguage,
    getCurrentLanguageName,
  };
};

