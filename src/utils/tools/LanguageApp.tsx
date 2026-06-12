import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { languageDict, LANGUAGE_OPTIONS } from '../language/LanguageScreenAppLanguage';
import { appearanceDict } from '../language/AppearanceScreenAppLanguage';

export type LangCode = 'id' | 'en' | 'zh' | 'ja' | 'th' | 'vi';

interface LanguageContextType {
  language: LangCode;
  setLanguage: (lang: LangCode) => void;
  loading: boolean;
  LANGUAGE_OPTIONS: typeof LANGUAGE_OPTIONS;
  t_language: any;
  t_appearance: any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LANGUAGE_STORAGE_KEY = '@xynest_app_language';

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, _setLanguage] = useState<LangCode>('id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLang !== null) {
          _setLanguage(savedLang as LangCode);
        }
      } catch (error) {
        console.error('Gagal memuat preferensi bahasa:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedLanguage();
  }, []);

  const setLanguage = async (lang: LangCode) => {
    _setLanguage(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (error) {
      console.error('Gagal menyimpan konfigurasi bahasa:', error);
    }
  };

  const t_language = languageDict[language] || languageDict['id'];
  const t_appearance = appearanceDict[language] || appearanceDict['id'];

  if (loading) return null;

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      loading,
      LANGUAGE_OPTIONS,
      t_language,
      t_appearance,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};