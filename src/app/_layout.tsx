import React from 'react';
import { LogBox } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AppearanceProvider } from '../utils/tools/AppearanceApp';
import { LanguageProvider } from '../utils/tools/LanguageApp';

SplashScreen.preventAutoHideAsync();
LogBox.ignoreLogs(['setLayoutAnimationEnabledExperimental is currently a no-op']);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const themeBackgroundColor = colorScheme === 'dark' ? '#121212' : '#F2F2F7';

  return (
    <SafeAreaProvider>
      <AppearanceProvider>
        <LanguageProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack 
              screenOptions={{ 
                headerShown: false, 
                contentStyle: { backgroundColor: themeBackgroundColor }
              }}
            >
              <Stack.Screen 
                name="index" 
                options={{ animation: 'none' }} 
              />
              <Stack.Screen 
                name="screens/auth/LoginScreenApp" 
                options={{ animation: 'fade' }} 
              />
              <Stack.Screen 
                name="screens/auth/RegisterScreenApp" 
                options={{ presentation: 'transparentModal', animation: 'none' }} 
              />
              <Stack.Screen 
                name="screens/auth/VerificationScreenApp" 
                options={{ animation: 'fade' }} 
              />
              <Stack.Screen 
                name="screens/other/HomeScreenApp" 
                options={{ animation: 'fade' }} 
              />
            </Stack>
          </ThemeProvider>
        </LanguageProvider>
      </AppearanceProvider>
    </SafeAreaProvider>
  );
}