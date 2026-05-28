import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '@/services/AuthService';
import AuthLayout from '@/app/layouts/AuthLayout';

export default function LoginScreenApp() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    if (!identifier.trim()) return Alert.alert('Error', 'Input wajib diisi, bro!');
    setLoading(true);
    try {
      const res = await AuthService.requestLogin(identifier.trim());
      if (res.success) { 
        Alert.alert('Sukses', res.message || 'Kode verifikasi telah dikirim!');
        
        router.push({
          pathname: '/screens/auth/VerificationScreenApp' as any,
          params: { type: 'login', identifier: identifier.trim() }
        });
      } else { 
        Alert.alert('Gagal', res.error || 'Identitas tidak ditemukan.'); 
      }
    } catch (err) { 
      Alert.alert('Error', 'Gagal terhubung ke API server.'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <AuthLayout 
      title="Selamat Datang" 
      subtitle="Masuk dengan Email atau Nomor Handphone XyNest Anda"
    >
      <View style={styles.form}>
        <TextInput 
          style={styles.input} 
          placeholder="Email, @username, atau +62..." 
          placeholderTextColor="#8E8E93" 
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
        <Text style={styles.switchText}>Belum punya akun? <Text style={styles.link}>Daftar</Text></Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  input: { backgroundColor: '#F2F2F7', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, fontSize: 15, color: '#1C1C1E' },
  button: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  switchScreen: { alignItems: 'center', marginTop: 20 },
  switchText: { fontSize: 14, color: '#636366' },
  link: { color: '#007AFF', fontWeight: '600' }
});