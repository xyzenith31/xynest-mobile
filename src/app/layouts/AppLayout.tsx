import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, AppState, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DeviceService } from '@/services/DeviceService';
import { authDb } from '@/databases/AuthDatabase';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  scrollable?: boolean;
}

export default function AppLayout({ children, title, scrollable = true }: AppLayoutProps) {
  const router = useRouter();
  const isCheckingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      if (isCheckingRef.current) return;
      
      const token = await authDb.getToken();
      if (!token) return;

      isCheckingRef.current = true;
      try {
        const sessionStatus = await DeviceService.checkSessionValidity();
        
        if (sessionStatus === false && isMounted) {
          await authDb.clearSession();
          Alert.alert(
            "Sesi Berakhir", 
            "Sesi Anda di perangkat ini telah dihapus atau berakhir. Anda harus masuk kembali.",
            [{ text: "OK", onPress: () => router.replace('/screens/auth/LoginScreenApp') }]
          );
        }
      } catch (err: any) {
        console.log("Error network/server saat mengecek sesi (akan dianggap offline):", err);
      } finally {
        if (isMounted) isCheckingRef.current = false;
      }
    };

    checkSession();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkSession();
      }
    });

    const interval = setInterval(() => {
      if (isMounted) checkSession();
    }, 3000);

    return () => {
      isMounted = false;
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  const content = scrollable ? (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E' },
  scroll: { padding: 24, flexGrow: 1 },
  content: { padding: 24, flex: 1 },
});