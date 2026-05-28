import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="screens/auth/LoginScreenApp" />
          <Stack.Screen name="screens/auth/RegisterScreenApp" />
          <Stack.Screen name="screens/other/HomeScreenApp" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}