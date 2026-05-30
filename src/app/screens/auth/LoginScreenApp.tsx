import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LoginService } from '@/services/LoginService';
import AuthLayout from '@/app/layouts/AuthLayout';
import InputApp from '@/components/ui/InputApp';

export default function LoginScreenApp() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    if (!identifier.trim()) return Alert.alert('Error', 'Input wajib diisi, bro!');
    setLoading(true);

    try {
      const res = await LoginService.requestLogin(identifier.trim());
      if (res.success) {
        setLoading(false);
        router.push({
          pathname: '/screens/auth/VerificationScreenApp' as any,
          params: { type: 'login', identifier: identifier.trim() }
        });
      } else {
        Alert.alert('Gagal', res.error || 'Identitas tidak ditemukan.');
        setLoading(false);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Gagal terhubung ke API server.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Selamat Datang" subtitle="Masuk ke XyNest dengan Email atau Nomor Handphone Anda">
      <View style={styles.form}>
        <InputApp
          iconName="person"
          iconColor="#007AFF"
          placeholder="Email, @username, atau nomor..."
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.button} onPress={handleRequestOtp} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Minta Kode Verifikasi</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push('/screens/auth/RegisterScreenApp')} style={styles.switchScreen}>
        <Text style={styles.switchText}>Belum punya akun? <Text style={styles.link}>Daftar Sekarang</Text></Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { marginTop: 10 },
  button: { 
    backgroundColor: '#007AFF', 
    paddingVertical: 14,
    borderRadius: 25, 
    alignItems: 'center', 
    marginTop: 8,
  },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  switchScreen: { marginTop: 32, alignItems: 'center' },
  switchText: { fontSize: 14, color: '#636366' },
  link: { color: '#007AFF', fontWeight: 'bold' }
});