import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from '../../../utils/tools/AppearanceApp';
import { useLanguage, LangCode } from '../../../utils/tools/LanguageApp'; 

export default function LanguageScreenApp() {
  const router = useRouter();
  const { theme, accentColor } = useAppearance();
  const { language, setLanguage, t_language, LANGUAGE_OPTIONS } = useLanguage();
  const t = t_language; 

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.5 : 1 }]}>
          <Ionicons name="arrow-back" size={24} color={accentColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.subText, { color: theme.subText }]}>{t.select_msg}</Text>
        
        <View style={[styles.listContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {LANGUAGE_OPTIONS.map((lang: any, index: number) => (
            <React.Fragment key={lang.code}>
              <Pressable 
                onPress={() => setLanguage(lang.code as LangCode)}
                style={({ pressed }) => [styles.langRow, { backgroundColor: pressed ? `${accentColor}10` : 'transparent' }]}
              >
                <View style={styles.langLeft}>
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <View>
                    <Text style={[styles.langLabel, { color: theme.text }]}>{lang.label}</Text>
                    <Text style={[styles.langNative, { color: theme.subText }]}>{lang.native}</Text>
                  </View>
                </View>
                {language === lang.code && (
                  <Ionicons name="checkmark-circle" size={22} color={accentColor} />
                )}
              </Pressable>
              {index < LANGUAGE_OPTIONS.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 12, paddingHorizontal: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { padding: 16 },
  subText: { fontSize: 13, marginBottom: 12, marginLeft: 8 },
  listContainer: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16 },
  langLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  flag: { fontSize: 24 },
  langLabel: { fontSize: 16, fontWeight: '600' },
  langNative: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginLeft: 54 }
});