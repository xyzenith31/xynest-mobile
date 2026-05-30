import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Animated, Easing } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AuthLayout from '../../layouts/AuthLayout';
import { LoginService } from '@/services/LoginService';
import NotificationInteractive, { NotificationType } from '@/components/ui/NotificationInteractiveApp';

export default function LoginQRCodeScreenApp() {
  const router = useRouter();
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<NotificationType>('info');
  const [notifAction, setNotifAction] = useState<() => void>(() => {});
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef<boolean>(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const triggerAnimation = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      })
    ]).start();
  };

  const showNotification = (title: string, message: string, type: NotificationType, action: () => void) => {
    setNotifTitle(title);
    setNotifMessage(message);
    setNotifType(type);
    setNotifAction(() => action);
    setNotifVisible(true);
  };

  const fetchQRCode = async () => {
    try {
      if (isMounted.current) setIsLoading(true);
      
      const data = await LoginService.generateQRToken();

      if (data.success && data.qr_token) {
        if (isMounted.current) {
          setQrToken(data.qr_token);
          startPolling(data.qr_token);
          triggerAnimation();
        }
      } else {
        if (isMounted.current) {
          showNotification('Gagal Memuat', 'Gagal membuat QR Code, silakan coba lagi.', 'error', fetchQRCode);
        }
      }
    } catch (error) {
      if (isMounted.current) {
        showNotification('Koneksi Terputus', 'Gagal terhubung ke server.', 'warning', fetchQRCode);
      }
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  };

  const startPolling = (token: string) => {
    if (pollingInterval.current) clearInterval(pollingInterval.current);

    pollingInterval.current = setInterval(async () => {
      const result = await LoginService.checkQRStatus(token);

      if (result.isExpired) {
        stopPolling();
        if (isMounted.current) {
          showNotification(
            'Kode Kedaluwarsa',
            'Sesi QR Code Anda telah berakhir. Silakan muat ulang untuk mendapatkan kode baru.',
            'warning',
            () => {
              setNotifVisible(false);
              fetchQRCode(); 
            }
          );
        }
        return;
      }

      if (result.success && result.status === 'AUTHORIZED') {
        stopPolling();
        if (isMounted.current) {
          showNotification(
            'Login Berhasil!',
            'Perangkat Anda telah berhasil diotorisasi. Mengalihkan ke Beranda...',
            'success',
            () => {
              setNotifVisible(false);
              router.replace('/screens/other/HomeScreenApp');
            }
          );
        }
      }
    }, 3000); 
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchQRCode();
    return () => {
      isMounted.current = false;
      stopPolling(); 
    };
  }, []);

  const handleBack = () => {
    setIsExiting(true);
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false, 
          presentation: 'transparentModal', 
          animation: 'none' 
        }} 
      />

      <AuthLayout 
        title="Masuk Tanpa Sandi" 
        subtitle="Gunakan perangkat yang sudah login untuk memindai kode di bawah ini."
        slideDirection="right"
        isExiting={isExiting}
        onExitComplete={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/screens/auth/LoginScreenApp');
          }
        }}
      >
        <View style={styles.container}>
          {isLoading ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Membuat Kode Unik...</Text>
            </View>
          ) : qrToken ? (
            <Animated.View style={[styles.contentWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              
              <View style={styles.qrOuterRing}>
                <View style={styles.qrInner}>
                  <QRCode
                    value={JSON.stringify({ type: 'xy_login', token: qrToken })}
                    size={200}
                    color="#1C1C1E"
                    backgroundColor="transparent"
                  />
                </View>
              </View>

              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionTitle}>Cara Memindai:</Text>
                
                <View style={styles.stepRow}>
                  <View style={styles.iconBox}>
                    <Ionicons name="desktop-outline" size={20} color="#007AFF" />
                  </View>
                  <Text style={styles.stepText}>Buka aplikasi <Text style={styles.boldText}>XyNest</Text> Desktop, Web, atau Mobile.</Text>
                </View>

                <View style={styles.stepRow}>
                  <View style={styles.iconBox}>
                    <Ionicons name="settings-outline" size={20} color="#007AFF" />
                  </View>
                  <Text style={styles.stepText}>Masuk ke menu <Text style={styles.boldText}>Settings</Text> lalu pilih <Text style={styles.boldText}>Device Manager</Text>.</Text>
                </View>

                <View style={styles.stepRow}>
                  <View style={styles.iconBox}>
                    <Ionicons name="scan-outline" size={20} color="#007AFF" />
                  </View>
                  <Text style={styles.stepText}>Ketuk <Text style={styles.boldText}>Scan QR Code</Text> dan arahkan kamera ke layar ini.</Text>
                </View>
              </View>

            </Animated.View>
          ) : null}
        </View>

        <TouchableOpacity style={styles.capsuleBackButton} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back-outline" size={18} color="#007AFF" style={styles.capsuleIcon} />
          <Text style={styles.capsuleButtonText}>Batal & Kembali</Text>
        </TouchableOpacity>

      </AuthLayout>

      <NotificationInteractive 
        visible={notifVisible}
        title={notifTitle}
        message={notifMessage}
        type={notifType}
        buttons={[
          { text: 'Oke, Mengerti', onPress: notifAction }
        ]}
        onDismiss={() => setNotifVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 10, minHeight: 350, },
  loadingWrapper: { alignItems: 'center', justifyContent: 'center', flex: 1, },
  loadingText: { marginTop: 16, color: '#8E8E93', fontSize: 15, fontWeight: '500', },
  contentWrapper: { width: '100%', alignItems: 'center', },
  qrOuterRing: { padding: 16, borderRadius: 32, backgroundColor: '#F2F2F7', marginBottom: 32, },
  qrInner: { padding: 12, backgroundColor: '#FFFFFF', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, },
  instructionsContainer: { width: '100%', paddingHorizontal: 10, },
  instructionTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 16, },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, },
  iconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5F1FF', justifyContent: 'center', alignItems: 'center', marginRight: 14, },
  stepText: { flex: 1, fontSize: 14, color: '#3A3A3C', lineHeight: 20, },
  boldText: { fontWeight: '700', color: '#1C1C1E', },
  capsuleBackButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 28, paddingVertical: 14, paddingHorizontal: 32, backgroundColor: '#E5F1FF', borderRadius: 30, width: '80%', },
  capsuleIcon: { marginRight: 8, },
  capsuleButtonText: { color: '#007AFF', fontSize: 15, fontWeight: '700', }
});