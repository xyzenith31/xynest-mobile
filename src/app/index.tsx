import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { DeviceService } from '@/services/auth/DeviceService';
import SplashScreenApp from './screens/other/SplashScreenApp';
import * as SplashScreen from 'expo-splash-screen';

LogBox.ignoreLogs(['setLayoutAnimationEnabledExperimental is currently a no-op']);

const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('setLayoutAnimationEnabledExperimental')) {
    return;
  }
  originalWarn(...args);
};

export default function RootNavigationIndex() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const checkRedirect = async () => {
      try {
        await SplashScreen.hideAsync();

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

  return <SplashScreenApp />;
}