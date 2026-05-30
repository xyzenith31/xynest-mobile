import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { DeviceService } from '@/services/DeviceService';

export default function RootNavigationIndex() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const checkRedirect = async () => {
      try {
        const isLoggedIn = await DeviceService.checkSessionValidity();
        if (isLoggedIn) {
          router.replace('/screens/other/HomeScreenApp');
        } else {
          router.replace('/screens/auth/LoginScreenApp');
        }
      } catch (error) {
        console.error("Gagal mengecek sesi:", error);
        router.replace('/screens/auth/LoginScreenApp');
      }
    };

    checkRedirect();
  }, [rootNavigationState?.key]);

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' }
});