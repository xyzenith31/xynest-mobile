import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, LayoutAnimation, UIManager, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from '../../../utils/tools/AppearanceApp';
import { useLanguage, LangCode } from '../../../utils/tools/LanguageApp'; 
import LoadingSpinnerApp from '@/components/ui/LoadingSpinnerApp'; // <-- IMPORT SPINNER

// NOTE: setLayoutAnimationEnabledExperimental is a no-op in React Native New Architecture
// Keeping the check to suppress warnings when using LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    try {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    } catch (e) {
      // Silently fail if New Architecture doesn't support it
    }
  }
}

export default function LanguageScreenApp() {
  const router = useRouter();
  const { theme, accentColor, isDarkMode } = useAppearance();
  const { language, setLanguage, t_language, LANGUAGE_OPTIONS } = useLanguage();
  const [isApplying, setIsApplying] = useState(false); // State Loading
  const t = t_language; 

  const handleLanguageChange = (code: LangCode) => {
    if (language === code) return; 
    setIsApplying(true);
    setTimeout(() => {
      LayoutAnimation.configureNext({
        duration: 300,
        create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
        update: { type: LayoutAnimation.Types.easeInEaseOut },
        delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      });
      setLanguage(code);
      setIsApplying(false);
    }, 400); 
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.5 : 1 }]}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <Text style={[styles.secTitle, { color: theme.subText }]}>{t.preview_title}</Text>
        <View style={[styles.previewContainer, { backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF', borderColor: isDarkMode ? '#2C2C2E' : '#E5E5EA' }]}>
          
          <View style={styles.mockProfileSection}>
            <View style={[styles.mockAvatar, { backgroundColor: `${accentColor}15` }]}>
              <Text style={[styles.mockAvatarText, { color: accentColor }]}>
                {t.mock_fullname.charAt(0)}
              </Text>
            </View>
            <View style={styles.mockProfileInfo}>
              <Text style={[styles.mockFullName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>{t.mock_fullname}</Text>
              <Text style={[styles.mockUsername, { color: '#8E8E93' }]}>{t.mock_username}</Text>
            </View>
          </View>

          <View style={[styles.mockDivider, { backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E5EA' }]} />

          <View style={styles.mockSectionContainer}>
            <Text style={[styles.mockSectionTitle, { color: '#8E8E93' }]}>{t.mock_sec_pref}</Text>
            <View style={styles.mockSettingItem}>
              <View style={styles.mockSettingLeft}>
                <View style={[styles.mockIconBox, { backgroundColor: '#AF52DE15' }]}>
                  <Ionicons name="color-palette" size={14} color="#AF52DE" />
                </View>
                <Text style={[styles.mockSettingText, { color: isDarkMode ? '#FFFFFF' : '#1C1C1E' }]}>{t.mock_item_appearance}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
            </View>
            
            <View style={styles.mockSettingItem}>
              <View style={styles.mockSettingLeft}>
                <View style={[styles.mockIconBox, { backgroundColor: `${accentColor}15` }]}>
                  <Ionicons name="language" size={14} color={accentColor} />
                </View>
                <Text style={[styles.mockSettingText, { color: isDarkMode ? '#FFFFFF' : '#1C1C1E' }]}>{t.mock_item_language}</Text>
              </View>
              <Text style={[styles.mockValueText, { color: '#8E8E93' }]}>{LANGUAGE_OPTIONS.find((l:any) => l.code === language)?.native}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.secTitle, { color: theme.subText, marginTop: 16 }]}>{t.select_msg}</Text>
        <View style={styles.optionsWrapper}>
          {LANGUAGE_OPTIONS.map((lang: any) => {
            const isSelected = language === lang.code;
            return (
              <Pressable 
                key={lang.code}
                onPress={() => handleLanguageChange(lang.code as LangCode)}
                style={({ pressed }) => [
                  styles.langCard,
                  { 
                    backgroundColor: isSelected ? `${accentColor}10` : (isDarkMode ? '#1C1C1E' : '#FFFFFF'),
                    borderColor: isSelected ? accentColor : (isDarkMode ? '#2C2C2E' : '#E5E5EA'),
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
              >
                <View style={styles.langLeft}>
                  <View style={[styles.shortBadge, { backgroundColor: isSelected ? accentColor : (isDarkMode ? '#2C2C2E' : '#F2F2F7') }]}>
                    <Text style={[styles.shortBadgeText, { color: isSelected ? '#FFF' : (isDarkMode ? '#8E8E93' : '#8E8E93') }]}>
                      {lang.short}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.langLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>{lang.label}</Text>
                    <Text style={[styles.langNative, { color: '#8E8E93' }]}>{lang.native}</Text>
                  </View>
                </View>
                
                {isSelected ? (
                  <Ionicons name="checkmark-circle" size={24} color={accentColor} />
                ) : (
                  <Ionicons name="ellipse-outline" size={24} color={isDarkMode ? '#3A3A3C' : '#C7C7CC'} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <LoadingSpinnerApp visible={isApplying} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },
  secTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: 8, marginBottom: 12 },
  previewContainer: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  mockProfileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  mockAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  mockAvatarText: { fontSize: 20, fontWeight: '700' },
  mockProfileInfo: { flex: 1 },
  mockFullName: { fontSize: 16, fontWeight: '700', letterSpacing: -0.4 },
  mockUsername: { fontSize: 13, marginTop: 2 },
  mockDivider: { height: 1, opacity: 0.5, marginBottom: 16 },
  mockSectionContainer: { paddingHorizontal: 4 },
  mockSectionTitle: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  mockSettingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  mockSettingLeft: { flexDirection: 'row', alignItems: 'center' },
  mockIconBox: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  mockSettingText: { fontSize: 14, fontWeight: '500' },
  mockValueText: { fontSize: 14, fontWeight: '400' },
  optionsWrapper: { gap: 10 },
  langCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 18, borderWidth: 1.5 },
  langLeft: { flexDirection: 'row', alignItems: 'center' },
  shortBadge: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  shortBadgeText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  langLabel: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  langNative: { fontSize: 13, fontWeight: '500' },
});