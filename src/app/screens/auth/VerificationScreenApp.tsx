import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LoginService } from '@/services/LoginService';
import { VerifyService } from '@/services/VerifyService';
import AuthLayout from '@/app/layouts/AuthLayout';

export default function VerificationScreenApp() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; identifier?: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [loading, setLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false); 
  const identifier = params.identifier || '';
  const authType = params.type || 'login';
  const handleOtpChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    if (cleanText.length > 1) {
      const pastedData = cleanText.split('').slice(0, 6);
      const newOtp = ['', '', '', '', '', ''];
      pastedData.forEach((char, i) => { newOtp[i] = char; });
      setOtp(newOtp);
      const lastFilled = pastedData.length - 1;
      if (lastFilled >= 0 && lastFilled < 6) {
        inputRefs.current[lastFilled]?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanText;
    setOtp(newOtp);

    if (cleanText && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifySubmit = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      return Alert.alert('Error', 'Kode verifikasi belum lengkap (6 digit)!');
    }

    Keyboard.dismiss();
    setLoading(true);
    try {
      let res;
      if (authType === 'register') {
        res = await VerifyService.verifyRegister(identifier, otpCode);
      } else {
        res = await LoginService.verifyLogin(identifier, otpCode);
      }

      if (res && res.success) {
        setLoading(false);
        router.replace('/screens/other/HomeScreenApp');
      } else {
        Alert.alert('Gagal', res?.error || 'Kode verifikasi salah atau kedaluwarsa.');
        setLoading(false);
      }
    } catch (err) {
      Alert.alert('Error', 'Gagal terhubung ke API server verifikasi.');
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const res = await VerifyService.resendOTP(identifier);
      if (res && res.success) {
        Alert.alert('Sukses', res.message || 'Kode verifikasi baru telah dikirim ulang!');
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus(); 
      } else {
        Alert.alert('Gagal', res?.error || 'Gagal mengirim ulang kode OTP.');
      }
    } catch (err) {
      Alert.alert('Error', 'Gagal terhubung ke server saat kirim ulang OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = useCallback(() => setIsExiting(true), []);
  const handleExitComplete = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/screens/auth/LoginScreenApp');
    }
  }, [router]);

  return (
    <AuthLayout
      slideDirection="right"
      isExiting={isExiting} 
      onExitComplete={handleExitComplete}
      title="Verifikasi OTP"
      subtitle={`Masukkan 6 digit kode yang telah kami kirimkan ke\n${identifier}`}
    >
      <View style={styles.container}>
        <View style={styles.iconWrapper}>
          <Ionicons name="shield-checkmark" size={64} color="#007AFF" />
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }} 
              style={[
                styles.capsule, 
                digit ? styles.capsuleActive : styles.capsuleInactive
              ]}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="default" 
              autoCapitalize="characters"
              maxLength={6} 
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleVerifySubmit} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Verifikasi Akun</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendBtn} onPress={handleResendOtp} disabled={loading} activeOpacity={0.7}>
          <Text style={styles.resendTxt}>Belum menerima kode? <Text style={styles.link}>Kirim Ulang</Text></Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGoBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back-outline" size={16} color="#007AFF" style={styles.backIcon} />
          <Text style={styles.link}>Kembali</Text>
        </TouchableOpacity>
        
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10 },
  iconWrapper: { alignItems: 'center', marginBottom: 24 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  capsule: { width: 48, height: 56, borderRadius: 14, fontSize: 22, fontWeight: '700', color: '#1C1C1E',borderWidth: 1.5,},
  capsuleInactive: { backgroundColor: '#F2F2F7',borderColor: '#E5E5EA',},
  capsuleActive: { backgroundColor: '#E5F1FF',borderColor: '#007AFF', },
  button: { backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 25, alignItems: 'center',shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  resendBtn: { alignItems: 'center', marginTop: 24 },
  resendTxt: { fontSize: 14, color: '#636366' },
  link: { color: '#007AFF', fontWeight: 'bold' },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  backIcon: { marginRight: 6 }
});