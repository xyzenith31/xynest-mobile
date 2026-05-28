import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthService } from '@/services/AuthService';
import AuthLayout from '@/app/layouts/AuthLayout';

export default function VerificationScreenApp() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; identifier?: string }>();
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const identifier = params.identifier || '';
  const authType = params.type || 'login';
  const handleOtpChange = (text: string) => {
    const cleanText = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    setOtpCode(cleanText);
  };

  const handleVerifySubmit = async () => {
    if (!otpCode.trim()) {
      return Alert.alert('Error', 'Kode verifikasi wajib diisi!');
    }

    setLoading(true);
    try {
      let res;
      if (authType === 'register') {
        res = await AuthService.verifyRegister(identifier, otpCode.trim());
      } else {
        res = await AuthService.verifyLogin(identifier, otpCode.trim());
      }

      if (res && res.success) {
        Alert.alert('Sukses', 'Verifikasi berhasil! Masuk ke aplikasi...');
        router.replace('/screens/other/HomeScreenApp');
      } else {
        Alert.alert('Gagal', res?.error || 'Kode verifikasi salah atau kedaluwarsa.');
      }
    } catch (err) {
      Alert.alert('Error', 'Gagal terhubung ke API server verifikasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!identifier) return;
    setLoading(true);
    try {
      const res = await AuthService.resendOTP(identifier);
      if (res && res.success) {
        Alert.alert('Sukses', res.message || 'Kode verifikasi baru telah dikirim!');
      } else {
        Alert.alert('Gagal', res?.error || 'Gagal mengirim ulang kode.');
      }
    } catch (err) {
      Alert.alert('Error', 'Terjadi kesalahan jaringan saat mengirim ulang OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Verifikasi OTP" 
      subtitle={`Masukkan kode verifikasi alfanumerik yang dikirim ke:\n${identifier}`}
    >
      <View style={styles.form}>
        <TextInput 
          style={styles.input} 
          placeholder="CONTOH: XY123A" 
          placeholderTextColor="#8E8E93" 
          value={otpCode} 
          onChangeText={handleOtpChange} 
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={10}
          textAlign="center"
        />
        
        <TouchableOpacity style={styles.button} onPress={handleVerifySubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Verifikasi & Masuk</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendBtn} onPress={handleResendOtp} disabled={loading}>
          <Text style={styles.resendTxt}>Belum menerima kode? <Text style={styles.link}>Kirim Ulang</Text></Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/screens/auth/LoginScreenApp')} style={styles.backBtn}>
          <Text style={styles.link}>Kembali ke Login</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12, marginTop: 10 },
  input: { backgroundColor: '#F2F2F7', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 10, fontSize: 18, color: '#1C1C1E', fontWeight: 'bold', letterSpacing: 2 },
  button: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  resendBtn: { alignItems: 'center', marginTop: 10 },
  resendTxt: { fontSize: 14, color: '#636366' },
  backBtn: { alignItems: 'center', marginTop: 10 },
  link: { color: '#007AFF', fontWeight: '600' }
});