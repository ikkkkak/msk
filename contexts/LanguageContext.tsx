import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import * as Localization from 'expo-localization';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => Promise<void>; // no-op, kept for compatibility
  isLanguageReady: boolean;
  showLanguageModal: boolean; // always false now
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isLanguageReady, setIsLanguageReady] = useState<boolean>(false);
  const showLanguageModal = false; // no modal, language follows device

  // Initialize once — do NOT depend on `i18n` (unstable reference → infinite changeLanguage loop).
  useEffect(() => {
    let isMounted = true;

    const waitForInitialization = async () => {
      if (i18n.isInitialized) return;

      await new Promise<void>((resolve) => {
        let settled = false;
        const timeout = setTimeout(() => {
          if (settled) return;
          settled = true;
          i18n.off('initialized', handleInitialized);
          resolve();
        }, 800);

        const handleInitialized = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          i18n.off('initialized', handleInitialized);
          resolve();
        };
        i18n.on('initialized', handleInitialized);
      });
    };

    const initializeLanguage = async () => {
      try {
        await waitForInitialization();

        const locales = Localization.getLocales();
        const deviceLang =
          locales && locales.length > 0
            ? locales[0].languageCode || 'en'
            : 'en';
        const deviceLangLower = deviceLang.toLowerCase();

        let normalized: string;
        if (deviceLangLower.startsWith('ar')) {
          normalized = 'ar';
        } else if (deviceLangLower.startsWith('fr')) {
          normalized = 'fr';
        } else {
          normalized = 'en';
        }

        if (i18n.language !== normalized) {
          await i18n.changeLanguage(normalized);
        }
        if (!isMounted) return;
        setCurrentLanguage(normalized);
        setIsLanguageReady(true);
      } catch (error) {
        console.error('❌ Failed to initialize language context:', error);
        if (!isMounted) return;
        setCurrentLanguage('en');
        setIsLanguageReady(true);
      }
    };

    void initializeLanguage();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- i18n singleton; [i18n] retriggers changeLanguage in a loop
  }, []);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeLanguage = useCallback(async (_language: string) => {
    // Language follows device settings
  }, []);

  const value = useMemo<LanguageContextType>(
    () => ({
      currentLanguage,
      changeLanguage,
      isLanguageReady,
      showLanguageModal: false,
    }),
    [currentLanguage, changeLanguage, isLanguageReady],
  );


  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
