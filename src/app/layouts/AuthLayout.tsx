import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthService } from '@/services/AuthService';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  isVerificationMode?: boolean;
}

export default function AuthLayout({ children, title, subtitle, isVerificationMode = false }: AuthLayoutProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; identifier?: string }>();
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const identifier = params.identifier || '';
  const authType = params.type || 'login';

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      return Alert.alert('Error', 'Masukkan kode OTP terlebih dahulu, bro!');
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
        Alert.alert('Sukses', 'Autentikasi berhasil! Mengalihkan ke Beranda...');
        router.replace('/screens/other/HomeScreenApp');
      } else {
        Alert.alert('Gagal', res?.error || 'Kode OTP salah atau kedaluwarsa.');
      }
    } catch (err) {
      Alert.alert('Error', 'Gagal terhubung ke server verifikasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const res = await AuthService.resendOTP(identifier);
      if (res && res.success) {
        Alert.alert('Sukses', 'Kode OTP baru berhasil dikirim ulang!');
      } else {
        Alert.alert('Gagal', res?.error || 'Gagal mengirim ulang OTP.');
      }
    } catch (err) {
      Alert.alert('Error', 'Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {isVerificationMode ? (
            <View style={styles.form}>
              <Text style={styles.title}>Verifikasi Akun</Text>
              <Text style={styles.subtitle}>
                Masukkan 6 digit kode OTP yang telah dikirimkan ke:{'\n'}
                <Text style={{ fontWeight: 'bold', color: '#1C1C1E' }}>{identifier}</Text>
              </Text>

              <Text style={styles.label}>KODE OTP</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 123456"
                placeholderTextColor="#8E8E93"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus={true}
              />

              <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Verifikasi Sekarang</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendBtn} onPress={handleResendOtp} disabled={loading}>
                <Text style={styles.resendTxt}>Belum menerima kode? <Text style={styles.link}>Kirim Ulang</Text></Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.replace('/screens/auth/LoginScreenApp')} style={styles.switchScreen}>
                <Text style={styles.link}>Kembali ke Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
              {children}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { padding: 20, justifyContent: 'center', flexGrow: 1 },
  card: { backgroundColor: '#FFF', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1E', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#8E8E93', textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  form: { gap: 10 },
  label: { fontSize: 11, fontWeight: '700', color: '#636366', marginTop: 4 },
  input: { backgroundColor: '#F2F2F7', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, fontSize: 14, color: '#1C1C1E', textAlign: 'center', letterSpacing: 3, fontWeight: 'bold' },
  button: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  resendBtn: { alignItems: 'center', marginTop: 14 },
  resendTxt: { fontSize: 13, color: '#636366' },
  switchScreen: { alignItems: 'center', marginTop: 16 },
  link: { color: '#007AFF', fontWeight: '600' }
});