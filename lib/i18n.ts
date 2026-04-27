import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/i18n/en.json';
import zh from '@/i18n/zh.json';

const STORAGE_KEY = 'app-language';

function detectInitialLanguage(): 'en' | 'zh' {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return code === 'zh' ? 'zh' : 'en';
}

export async function initI18n() {
  let stored: string | null = null;
  try {
    stored = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  const initialLng = stored === 'zh' || stored === 'en' ? stored : detectInitialLanguage();

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    lng: initialLng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });
}

export async function setLanguage(lang: 'en' | 'zh') {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

export default i18n;
