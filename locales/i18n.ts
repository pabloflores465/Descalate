import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import es from './es.json';
import { STORAGE_KEYS } from '@/constants/storage-keys';

const resources = {
  en: { translation: en },
  es: { translation: es },
};

const getDeviceLanguage = (): string => {
  const locale = Localization.getLocales()[0]?.languageCode;
  if (locale && ['en', 'es'].includes(locale)) {
    return locale;
  }
  return 'es';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

// Load saved language preference
export const initializeLanguage = async (): Promise<void> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (savedLanguage && ['en', 'es'].includes(savedLanguage)) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    // Silently fail - will use default language
  }
};

export default i18n;
