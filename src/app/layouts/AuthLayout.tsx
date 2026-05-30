import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, LogBox, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

LogBox.ignoreLogs([
  'InteractionManager has been deprecated',
  'fetch failed',
  'DateTimePicker'
]);

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true })
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.logoContainer}>
            <Image source={require('@/assets/images/mylogo.png')} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {children}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { padding: 24, justifyContent: 'center', flexGrow: 1 },
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 80, height: 80 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 20 }
});