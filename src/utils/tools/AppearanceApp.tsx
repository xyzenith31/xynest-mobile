import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'system' | 'light' | 'dark';
type TextSize = 'small' | 'medium' | 'large';

interface AppearanceContextType {
  themeMode: ThemeMode;
  setThemeMode: (val: ThemeMode) => void;
  isDarkMode: boolean;
  accentColor: string;
  setAccentColor: (val: string) => void;
  textSize: TextSize;
  setTextSize: (val: TextSize) => void;
  theme: any;
  loading: boolean;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

const THEME_MODE_KEY = '@xynest_theme_mode_v2';
const ACCENT_STORAGE_KEY = '@xynest_accent_color';
const TEXT_SIZE_STORAGE_KEY = '@xynest_text_size';

export const AppearanceProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, _setThemeMode] = useState<ThemeMode>('system');
  const [accentColor, _setAccentColor] = useState('#007AFF');
  const [textSize, _setTextSize] = useState<TextSize>('medium');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem(THEME_MODE_KEY);
        const savedAccent = await AsyncStorage.getItem(ACCENT_STORAGE_KEY);
        const savedTextSize = await AsyncStorage.getItem(TEXT_SIZE_STORAGE_KEY);

        if (savedThemeMode) _setThemeMode(savedThemeMode as ThemeMode);
        if (savedAccent) _setAccentColor(savedAccent);
        if (savedTextSize) _setTextSize(savedTextSize as TextSize);
      } catch (error) {
        console.error('Gagal memuat preferensi tampilan:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedSettings();
  }, []);

  const setThemeMode = async (val: ThemeMode) => {
    _setThemeMode(val);
    try { await AsyncStorage.setItem(THEME_MODE_KEY, val); } catch (e) {}
  };

  const setAccentColor = async (val: string) => {
    _setAccentColor(val);
    try { await AsyncStorage.setItem(ACCENT_STORAGE_KEY, val); } catch (e) {}
  };

  const setTextSize = async (val: TextSize) => {
    _setTextSize(val);
    try { await AsyncStorage.setItem(TEXT_SIZE_STORAGE_KEY, val); } catch (e) {}
  };

  const isDarkMode = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';

  const theme = {
    bg: isDarkMode ? '#000000' : '#F8F9FA',
    surface: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#111827',
    subText: isDarkMode ? '#9CA3AF' : '#6B7280',
    border: isDarkMode ? '#262626' : '#E5E7EB',
    chatIncoming: isDarkMode ? '#262626' : '#EAEAEA',
    chatIncomingText: isDarkMode ? '#FFFFFF' : '#000000'
  };

  // Render children immediately so screens can show their own loading UI while appearance settings load
  // (previously returned null here which prevented per-screen spinner from showing on mount)

  return (
    <AppearanceContext.Provider value={{ themeMode, setThemeMode, isDarkMode, accentColor, setAccentColor, textSize, setTextSize, theme, loading }}>
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = () => {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('useAppearance must be used within AppearanceProvider');
  return context;
};