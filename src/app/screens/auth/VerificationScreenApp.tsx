import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Keyboard, Animated, Easing } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AuthLayout from '../../layouts/AuthLayout';
import { LoginService } from '@/services/auth/LoginService';
import { VerifyService } from '@/services/auth/VerifyService';
import NotificationInteractive, { NotificationType } from '@/components/ui/NotificationInteractiveApp';
import LoadingSpinnerApp from '@/components/ui/LoadingSpinnerApp';

export default function VerificationScreenApp() {
  const router = useRouter();
  const { identifier, type } = useLocalSearchParams<{ identifier: string; type: string }>();
  const [otpCode, setOtpCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<NotificationType>('info');
  const [notifAction, setNotifAction] = useState<() => void>(() => {});
  const textInputRef = useRef<TextInput>(null);
  const otpLength = 6;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.cubic) })
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -8, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    setTimeout(() => textInputRef.current?.focus(), 400);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const showNotification = (title: string, message: string, type: NotificationType, action?: () => void) => {
    setNotifTitle(title);
    setNotifMessage(message);
    setNotifType(type);
    setNotifAction(() => action || (() => setNotifVisible(false)));
    setNotifVisible(true);
  };

  const handleVerifyOTP = async (code: string) => {
    if (code.length !== otpLength) return;
    
    try {
      setIsLoading(true);
      Keyboard.dismiss();

      let result;
      if (type === 'register') {
        result = await VerifyService.verifyRegister(identifier || '', code);
      } else {
        result = await LoginService.verifyLogin(identifier || '', code);
      }

      if (result.success) {
        showNotification(
          'Verifikasi Berhasil',
          'Kode OTP cocok. Selamat datang!',
          'success',
          () => {
            setNotifVisible(false);
            router.replace('/screens/other/HomeScreenApp');
          }
        );
      } else {
        showNotification('Verifikasi Gagal', result.error || result.message || 'Kode OTP tidak valid.', 'error');
        setOtpCode('');
        setTimeout(() => textInputRef.current?.focus(), 500);
      }
    } catch (error: any) {
      showNotification(
        'Koneksi Terputus', 
        'Anda sedang offline atau server tidak merespon. Silakan nyalakan WiFi atau data seluler Anda.', 
        'warning'
      );
      setOtpCode('');
      setTimeout(() => textInputRef.current?.focus(), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    try {
      setIsLoading(true);
      let result;
      if (type === 'register') {
        result = await VerifyService.resendOTP(identifier || '');
      } else {
        result = await LoginService.requestLogin(identifier || '');
      }

      if (result.success) {
        setCountdown(60);
        setCanResend(false);
        showNotification('OTP Dikirim', 'Kode OTP baru telah berhasil dikirim ke perangkat Anda.', 'info');
      } else {
        showNotification('Gagal Kirim', result.error || result.message || 'Gagal mengirim ulang kode OTP.', 'error');
      }
    } catch (error: any) {
      showNotification('Koneksi Terputus', 'Server tidak merespon, pastikan internet stabil.', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const finalCode = cleaned.slice(0, otpLength);
    
    setOtpCode(finalCode);
    if (finalCode.length === otpLength) {
      handleVerifyOTP(finalCode);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'transparentModal', animation: 'none' }} />

      <AuthLayout
        title="Verifikasi OTP"
        subtitle={`Masukkan kode verifikasi unik yang telah kami kirimkan untuk akun ${identifier || ''}`}
        slideDirection="right"
        isExiting={isExiting}
        onExitComplete={() => router.canGoBack() ? router.back() : router.replace('/screens/auth/LoginScreenApp')}
      >
        <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          <Animated.View style={[styles.shieldIconContainer, { transform: [{ translateY: bounceAnim }] }]}>
            <Ionicons name="shield-checkmark" size={54} color="#007AFF" />
            <View style={styles.shieldGlow} />
          </Animated.View>
          
          <View style={styles.otpWrapper}>
            <View style={styles.otpGrid}>
              {Array.from({ length: otpLength }).map((_, index) => {
                const char = otpCode[index];
                const isFocused = index === otpCode.length;
                return (
                  <View 
                    key={index} 
                    style={[styles.otpBox, char ? styles.otpBoxFilled : null, isFocused ? styles.otpBoxFocused : null]}
                  >
                    <Text style={styles.otpText}>{char || ''}</Text>
                    {isFocused && !isLoading && <View style={styles.cursor} />}
                  </View>
                );
              })}
            </View>

            <TextInput
              ref={textInputRef}
              value={otpCode}
              onChangeText={handleInputChange}
              maxLength={otpLength}
              keyboardType="default"
              autoCapitalize="characters"
              textContentType="oneTimeCode" 
              autoComplete="one-time-code"
              style={styles.hiddenInput}
              caretHidden
            />
          </View>

          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity onPress={handleResendOTP} activeOpacity={0.6} style={styles.resendButton}>
                <Ionicons name="refresh-outline" size={16} color="#007AFF" style={styles.resendIcon} />
                <Text style={styles.resendTextActive}>Kirim Ulang Kode OTP</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendTextDisabled}>
                Kirim ulang dalam <Text style={styles.boldTimer}>{countdown} detik</Text>
              </Text>
            )}
          </View>
        </Animated.View>

        <TouchableOpacity style={styles.capsuleBackButton} onPress={() => setIsExiting(true)} activeOpacity={0.7}>
          <Ionicons name="arrow-back-outline" size={18} color="#007AFF" style={styles.capsuleIcon} />
          <Text style={styles.capsuleButtonText}>Batal & Kembali</Text>
        </TouchableOpacity>

      </AuthLayout>
      <LoadingSpinnerApp visible={isLoading} />

      <NotificationInteractive
        visible={notifVisible}
        title={notifTitle}
        message={notifMessage}
        type={notifType}
        buttons={[{ text: 'Oke, Mengerti', onPress: notifAction }]}
        onDismiss={() => setNotifVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 20, width: '100%' },
  shieldIconContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 24, position: 'relative' },
  shieldGlow: { position: 'absolute', width: 60, height: 60, backgroundColor: '#007AFF', borderRadius: 30, opacity: 0.15, zIndex: -1, transform: [{ scale: 1.3 }] },
  otpWrapper: { position: 'relative', width: '100%', alignItems: 'center', marginBottom: 24 },
  otpGrid: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' },
  hiddenInput: { position: 'absolute', width: '100%', height: '100%', opacity: 0 },
  otpBox: { width: 48, height: 56, borderRadius: 12, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', marginHorizontal: 4, borderWidth: 1.5, borderColor: 'transparent', position: 'relative' },
  otpBoxFilled: { backgroundColor: '#FFFFFF', borderColor: '#E5E5EA' },
  otpBoxFocused: { backgroundColor: '#FFFFFF', borderColor: '#007AFF', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 },
  otpText: { fontSize: 22, fontWeight: '700', color: '#1C1C1E' },
  cursor: { position: 'absolute', width: 2, height: 22, backgroundColor: '#007AFF' },
  resendContainer: { marginTop: 8, alignItems: 'center', justifyContent: 'center', height: 40 },
  resendButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  resendIcon: { marginRight: 6 },
  resendTextActive: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
  resendTextDisabled: { color: '#8E8E93', fontSize: 14, fontWeight: '500' },
  boldTimer: { fontWeight: '700', color: '#3A3A3C' },
  capsuleBackButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 40, paddingVertical: 14, paddingHorizontal: 32, backgroundColor: '#E5F1FF', borderRadius: 30, width: '80%' },
  capsuleIcon: { marginRight: 8 },
  capsuleButtonText: { color: '#007AFF', fontSize: 15, fontWeight: '700' }
});