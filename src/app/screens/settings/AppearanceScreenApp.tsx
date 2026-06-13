import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, Pressable, LayoutAnimation, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from '../../../utils/tools/AppearanceApp';
import { useLanguage } from '../../../utils/tools/LanguageApp';
import LoadingSpinnerApp from '../../../components/ui/LoadingSpinnerApp';

const ACCENT_COLORS = [
  '#007AFF', '#34C759', '#AF52DE', '#FF9500', '#FF2D55', '#5AC8FA', '#FFCC00', '#5856D6', '#FF3B30', '#10B981',
  '#EF4444', '#F97316', '#F59E0B', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF'
];

export default function AppearanceScreenApp() {
  const router = useRouter();
  
  const { themeMode, setThemeMode, isDarkMode, accentColor, setAccentColor, textSize, setTextSize, theme, loading: appearanceLoading } = useAppearance();
  const { t_appearance } = useLanguage();
  const [chatBgImage, setChatBgImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // State untuk mengontrol spinner
  const t = t_appearance;

  const TEXT_SIZES = [
    { id: 'small', label: t.size_small, size: 12, iconSize: 14 },
    { id: 'medium', label: `${t.size_medium} (Default)`, size: 15, iconSize: 18 },
    { id: 'large', label: t.size_large, size: 18, iconSize: 22 }
  ];

  const currentTextSize = TEXT_SIZES.find(txt => txt.id === textSize)?.size || 15;
  const sidebarTextSize = currentTextSize > 15 ? 11 : 10; 

  const handleThemeChange = useCallback(async (mode: 'system' | 'light' | 'dark') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsLoading(true);
    await setThemeMode(mode);
    setIsLoading(false);
  }, [setThemeMode]);

  const handleTextSizeChange = useCallback(async (id: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsLoading(true);
    await setTextSize(id);
    setIsLoading(false);
  }, [setTextSize]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, 
      aspect: [9, 16], 
      quality: 0.4,
    });
    
    if (!result.canceled) {
      setIsLoading(true);
      
      setTimeout(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setChatBgImage(result.assets[0].uri);
        setIsLoading(false);
      }, 600);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.5 : 1 }]}>
          <Ionicons name="arrow-back" size={24} color={accentColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.secTitle, { color: theme.subText }]}>{t.preview_title}</Text>
        <View style={[styles.previewContainer, { borderColor: theme.border, backgroundColor: isDarkMode ? '#1A1A1A' : '#E5DDD5' }]}>
          <View style={[styles.sidebarPreview, { backgroundColor: theme.surface, borderRightColor: theme.border }]}>
            <View style={styles.sidebarHeader}>
              <View style={[styles.sidebarAvatar, { backgroundColor: `${accentColor}20` }]}>
                <Ionicons name="person" size={18} color={accentColor} />
              </View>
              <View style={[styles.mockTextLine, { backgroundColor: theme.text, width: 45, marginTop: 8 }]} />
              <View style={[styles.mockTextLine, { backgroundColor: theme.subText, width: 30, marginTop: 4, height: 4 }]} />
            </View>
            
            <View style={styles.sidebarMenu}>
              <View style={[styles.sidebarItem, { backgroundColor: `${accentColor}15` }]}>
                <Ionicons name="home" size={14} color={accentColor} />
                <Text style={[styles.sidebarItemText, { color: accentColor, fontSize: sidebarTextSize }]} numberOfLines={1}>{t.preview_home}</Text>
              </View>
              <View style={styles.sidebarItem}>
                <Ionicons name="person-outline" size={14} color={theme.subText} />
                <Text style={[styles.sidebarItemText, { color: theme.text, fontSize: sidebarTextSize }]} numberOfLines={1}>{t.preview_profile}</Text>
              </View>
              <View style={styles.sidebarItem}>
                <Ionicons name="settings-outline" size={14} color={theme.subText} />
                <Text style={[styles.sidebarItemText, { color: theme.text, fontSize: sidebarTextSize }]} numberOfLines={1}>{t.preview_settings}</Text>
              </View>
            </View>
          </View>

          <ImageBackground source={chatBgImage ? { uri: chatBgImage } : undefined} style={styles.previewBg}>
            <View style={[styles.bubble, styles.bubbleIn, { backgroundColor: theme.chatIncoming }]}>
              <Text style={{ fontSize: currentTextSize, color: theme.chatIncomingText }}>{t.preview_msg1}</Text>
            </View>
            <View style={[styles.bubble, styles.bubbleOut, { backgroundColor: accentColor }]}>
              <Text style={{ fontSize: currentTextSize, color: '#FFFFFF' }}>{t.preview_msg2}</Text>
            </View>
          </ImageBackground>
        </View>

        <Text style={[styles.secTitle, { color: theme.subText, marginTop: 24 }]}>{t.mode_title}</Text>
        <View style={[styles.rowGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable onPress={() => handleThemeChange('system')} style={[styles.modeTab, themeMode === 'system' && { backgroundColor: `${accentColor}12` }]}>
            <Ionicons name="phone-portrait-outline" size={20} color={themeMode === 'system' ? accentColor : theme.subText} />
            <Text style={[styles.modeText, { color: themeMode === 'system' ? accentColor : theme.text, fontWeight: themeMode === 'system' ? '600' : '400' }]}>Otomatis</Text>
          </Pressable>
          <View style={[styles.vDivider, { backgroundColor: theme.border }]} />
          
          <Pressable onPress={() => handleThemeChange('light')} style={[styles.modeTab, themeMode === 'light' && { backgroundColor: `${accentColor}12` }]}>
            <Ionicons name="sunny" size={20} color={themeMode === 'light' ? accentColor : theme.subText} />
            <Text style={[styles.modeText, { color: themeMode === 'light' ? accentColor : theme.text, fontWeight: themeMode === 'light' ? '600' : '400' }]}>{t.mode_light}</Text>
          </Pressable>
          <View style={[styles.vDivider, { backgroundColor: theme.border }]} />
          
          <Pressable onPress={() => handleThemeChange('dark')} style={[styles.modeTab, themeMode === 'dark' && { backgroundColor: `${accentColor}12` }]}>
            <Ionicons name="moon" size={20} color={themeMode === 'dark' ? accentColor : theme.subText} />
            <Text style={[styles.modeText, { color: themeMode === 'dark' ? accentColor : theme.text, fontWeight: themeMode === 'dark' ? '600' : '400' }]}>{t.mode_dark}</Text>
          </Pressable>
        </View>

        <Text style={[styles.secTitle, { color: theme.subText, marginTop: 24 }]}>{t.accent_title}</Text>
        <View style={[styles.rowGroup, { backgroundColor: theme.surface, borderColor: theme.border, paddingVertical: 14 }]}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={ACCENT_COLORS}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            renderItem={({ item }) => (
              <Pressable onPress={async () => { setIsLoading(true); await setAccentColor(item); setIsLoading(false); }} style={[styles.colorRing, accentColor === item && { borderColor: item }]}>
                <View style={[styles.colorDot, { backgroundColor: item, justifyContent: 'center', alignItems: 'center' }]}>
                  {accentColor === item && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </View>
              </Pressable>
            )}
          />
        </View>

        <Text style={[styles.secTitle, { color: theme.subText, marginTop: 24 }]}>{t.size_title}</Text>
        <View style={[styles.rowGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {TEXT_SIZES.map((txt, idx) => (
            <React.Fragment key={txt.id}>
              <Pressable onPress={() => handleTextSizeChange(txt.id)} style={styles.sizeTab}>
                <Text style={{ fontSize: txt.iconSize, fontWeight: '700', color: textSize === txt.id ? accentColor : theme.subText, marginBottom: 4 }}>Aa</Text>
                <Text style={{ fontSize: 13, fontWeight: textSize === txt.id ? '600' : '400', color: textSize === txt.id ? accentColor : theme.text }}>{txt.label}</Text>
                {textSize === txt.id && <View style={[styles.activeIndicator, { backgroundColor: accentColor }]} />}
              </Pressable>
              {idx < TEXT_SIZES.length - 1 && <View style={[styles.vDivider, { backgroundColor: theme.border }]} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={[styles.secTitle, { color: theme.subText, marginTop: 24 }]}>{t.wall_title}</Text>
        <Pressable onPress={pickImage} style={[styles.rowGroup, styles.wallpaperRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.wallpaperLeft}>
            <View style={[styles.iconSquare, { backgroundColor: `${accentColor}12` }]}>
              <Ionicons name="image" size={20} color={accentColor} />
            </View>
            <View>
              <Text style={[styles.wallTitle, { color: theme.text }]}>{t.wall_change}</Text>
              <Text style={{ fontSize: 12, color: theme.subText, marginTop: 2 }}>{chatBgImage ? t.wall_custom : t.wall_default}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.subText} />
        </Pressable>

      </ScrollView>
      <LoadingSpinnerApp visible={appearanceLoading || isLoading} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 12, paddingHorizontal: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 10 },
  secTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginLeft: 8, marginBottom: 8 },
  previewContainer: { height: 210, borderRadius: 20, overflow: 'hidden', borderWidth: 1, flexDirection: 'row' },
  sidebarPreview: { width: '33%', borderRightWidth: 1, paddingTop: 16, paddingBottom: 12 },
  sidebarHeader: { alignItems: 'center', marginBottom: 16 },
  sidebarAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  mockTextLine: { height: 6, borderRadius: 3 },
  sidebarMenu: { paddingHorizontal: 8, gap: 4 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, borderRadius: 8, gap: 6 },
  sidebarItemText: { fontWeight: '600', flexShrink: 1 },
  previewBg: { flex: 1, padding: 12, justifyContent: 'center', gap: 10 },
  bubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, maxWidth: '85%' },
  bubbleIn: { alignSelf: 'flex-start', borderTopLeftRadius: 4 },
  bubbleOut: { alignSelf: 'flex-end', borderTopRightRadius: 4 },
  rowGroup: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  modeTab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, flexDirection: 'column', gap: 6 },
  modeText: { fontSize: 13 },
  vDivider: { width: 1, height: '100%' },
  colorRing: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  sizeTab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, position: 'relative' },
  activeIndicator: { position: 'absolute', bottom: 0, width: 24, height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  wallpaperRow: { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16 },
  wallpaperLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconSquare: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  wallTitle: { fontSize: 15, fontWeight: '600' }
});