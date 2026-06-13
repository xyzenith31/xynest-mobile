import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView, MotiText } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useAppearance } from '@/utils/tools/AppearanceApp';
import { useLanguage } from '@/utils/tools/LanguageApp';

export default function NotFoundScreenApp() {
  const router = useRouter();
  const { theme, isDarkMode, accentColor } = useAppearance();
  const { t_notFound } = useLanguage();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Icon Animasi Minimalis */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 800 }}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${accentColor}15` }]}>
          <Ionicons name="alert-circle-outline" size={64} color={accentColor} />
        </View>
      </MotiView>

      {/* Teks Animasi */}
      <MotiText
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 300, duration: 600 }}
        style={[styles.title, { color: theme.text }]}
      >
        {t_notFound.title}
      </MotiText>

      <MotiText
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 500, duration: 600 }}
        style={[styles.description, { color: theme.subText }]}
      >
        {t_notFound.description}
      </MotiText>

      {/* Button Modern */}
      <MotiView
        from={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 700, type: 'spring' }}
      >
        <Pressable 
          style={[styles.button, { backgroundColor: accentColor }]}
          onPress={() => router.replace('/')} 
        >
          <Text style={styles.buttonText}>{t_notFound.button_back}</Text>
        </Pressable>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});