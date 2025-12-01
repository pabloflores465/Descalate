import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import es from './es.json';

const LANGUAGE_STORAGE_KEY = '@descalate_language';

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
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && ['en', 'es'].includes(savedLanguage)) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }
};

export default i18n;
