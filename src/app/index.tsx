// src/app/index.tsx
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { DeviceService } from '@/services/DeviceService';
import SplashScreenApp from './screens/other/SplashScreenApp';
import * as SplashScreen from 'expo-splash-screen';

export default function RootNavigationIndex() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const checkRedirect = async () => {
      try {
        // Sembunyikan native splash screen di sini karena RootNavigationIndex sudah sukses termuat
        await SplashScreen.hideAsync();

        // Tahan tampilan kustom splash screen selama 2 detik untuk menampilkan animasi desain lu
        const minimumSplashTime = new Promise(resolve => setTimeout(resolve, 2000));
        const sessionCheck = DeviceService.checkSessionValidity();
        
        const [isLoggedIn] = await Promise.all([sessionCheck, minimumSplashTime]);

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

  // Render komponen splash screen buatan lu langsung tanpa jeda
  return <SplashScreenApp />;
}