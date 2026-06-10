// src/app/_layout.tsx
import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

// Tahan native splash screen agar tidak otomatis hilang sebelum React Native siap memproses index.tsx
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Tentukan warna solid dasar sesuai tema agar tidak memicu blank screen sistem saat transisi
  const themeBackgroundColor = colorScheme === 'dark' ? '#121212' : '#F2F2F7';

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack 
          screenOptions={{ 
            headerShown: false, 
            contentStyle: { backgroundColor: themeBackgroundColor } // Ganti 'transparent' ke warna solid
          }}
        >
          <Stack.Screen 
            name="index" 
            options={{ animation: 'none' }} // Hilangkan animasi masuk awal untuk entry point
          />
          <Stack.Screen 
            name="screens/auth/LoginScreenApp" 
            options={{ animation: 'fade' }} // Gunakan fade transition agar halus tanpa jeda hitam
          />
          <Stack.Screen 
            name="screens/auth/RegisterScreenApp" 
            options={{ 
              presentation: 'transparentModal', 
              animation: 'none' 
            }} 
          />
          <Stack.Screen 
            name="screens/auth/VerificationScreenApp" 
            options={{ animation: 'fade' }} 
          />
          <Stack.Screen 
            name="screens/other/HomeScreenApp" 
            options={{ animation: 'fade' }} // Gunakan fade transition
          />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}