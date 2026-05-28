import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '@/services/AuthService';
import AuthLayout from '@/app/layouts/AuthLayout';

export default function LoginScreenApp() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    if (!identifier.trim()) return Alert.alert('Error', 'Input wajib diisi, bro!');
    setLoading(true);
    try {
      const res = await AuthService.requestLogin(identifier.trim());
      if (res.success) { Alert.alert('Sukses', res.message); setStep(2); }
      else { Alert.alert('Gagal', res.error || 'Identitas tidak ditemukan.'); }
    } catch (err) { Alert.alert('Error', 'Gagal terhubung ke API server.'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) return Alert.alert('Error', 'Masukkan kode OTP dulu, bro!');
    setLoading(true);
    try {
      const res = await AuthService.verifyLogin(identifier.trim(), otpCode.trim());
      if (res.success) { router.replace('/screens/other/HomeScreenApp'); }
      else { Alert.alert('Gagal', res.error || 'OTP salah.'); }
    } catch (err) { Alert.alert('Error', 'Gagal memverifikasi.'); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="XyNest Login" subtitle="Masuk via Email, Username (@), atau No HP (+)">
      {step === 1 ? (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Email, @username, atau +62..." placeholderTextColor="#8E8E93" value={identifier} onChangeText={setIdentifier} autoCapitalize="none" />
          <TouchableOpacity style={styles.button} onPress={handleRequestOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Kirim OTP</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="6 Digit OTP" placeholderTextColor="#8E8E93" value={otpCode} onChangeText={setOtpCode} keyboardType="number-pad" maxLength={6} />
          <TouchableOpacity style={[styles.button, styles.verifyBtn]} onPress={handleVerifyOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Verifikasi & Masuk</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}><Text style={styles.backText}>← Ganti Akun</Text></TouchableOpacity>
        </View>
      )}
      <TouchableOpacity onPress={() => router.push('/screens/auth/RegisterScreenApp')} style={styles.switchScreen}>
        <Text style={styles.switchText}>Belum punya akun? <Text style={styles.link}>Daftar</Text></Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  input: { backgroundColor: '#F2F2F7', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, fontSize: 15, color: '#1C1C1E' },
  button: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  verifyBtn: { backgroundColor: '#34C759' },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  backBtn: { alignItems: 'center', marginTop: 8 },
  backText: { color: '#8E8E93', fontSize: 14 },
  switchScreen: { marginTop: 20, alignItems: 'center' },
  switchText: { fontSize: 13, color: '#636366' },
  link: { color: '#007AFF', fontWeight: '600' }
});