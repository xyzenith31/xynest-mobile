import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '@/services/AuthService';

export default function RootNavigationIndex() {
  const router = useRouter();

  useEffect(() => {
    const checkRedirect = async () => {
      const isLoggedIn = await AuthService.checkSessionValidity();
      if (isLoggedIn) {
        router.replace('/screens/other/HomeScreenApp');
      } else {
        router.replace('/screens/auth/LoginScreenApp');
      }
    };
    checkRedirect();
  }, []);

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' }
});