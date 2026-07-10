import { useTranslation } from 'react-i18next';

/**
 * Safe translation hook that provides fallbacks for missing translations
 * This prevents the app from crashing when translations are not loaded
 */
export const useSafeTranslation = () => {
  const { t, i18n, ready } = useTranslation();

  const safeT = (key: string, options?: any): string => {
    try {
      if (!ready || !i18n.exists(key)) {
        // Return a fallback or the key itself if translation is missing
        return options?.fallback || key.split('.').pop() || key;
      }
      return t(key, options);
    } catch (error) {
      console.warn(`Translation error for key "${key}":`, error);
      return options?.fallback || key.split('.').pop() || key;
    }
  };

  return {
    t: safeT,
    i18n,
    ready,
  };
};
