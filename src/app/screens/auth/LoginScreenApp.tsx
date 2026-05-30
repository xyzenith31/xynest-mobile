import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LoginService } from '@/services/LoginService';
import AuthLayout from '@/app/layouts/AuthLayout';
import InputApp from '@/components/ui/InputApp';
import NotificationInteractive, { NotificationType, NotificationButton } from '@/components/ui/NotificationInteractive';

export default function LoginScreenApp() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [notifyVisible, setNotifyVisible] = useState(false);
  const [notifyConfig, setNotifyConfig] = useState({title: '', message: '', type: 'info' as NotificationType, buttons: [] as NotificationButton[]});

  const showNotification = (title: string, message: string, type: NotificationType, buttons: NotificationButton[]) => {
    setNotifyConfig({ title, message, type, buttons });
    setNotifyVisible(true);
  };

  const handleRequestOtp = useCallback(async () => {
    if (!identifier.trim()) {
      return showNotification('Form Tidak Lengkap', 'Input wajib diisi, bro!', 'warning', [
        { text: 'Oke', onPress: () => setNotifyVisible(false) }
      ]);
    }
    
    setLoading(true);
    try {
      const res = await LoginService.requestLogin(identifier.trim());
      if (res.success) {
        setLoading(false);
        showNotification(
          'Akun Ditemukan', 
          'Kode verifikasi telah dikirim. Klik Oke untuk melanjutkan.', 
          'success', 
          [{ 
            text: 'Oke', 
            onPress: () => {
              setNotifyVisible(false);
              router.push({
                pathname: '/screens/auth/VerificationScreenApp' as any,
                params: { type: 'login', identifier: identifier.trim() }
              });
            }
          }]
        );
      } else {
        setLoading(false);
        showNotification('Gagal Masuk', res.error || 'Akun tidak ditemukan.', 'error', [
          { text: 'Oke', onPress: () => setNotifyVisible(false) }
        ]);
      }
    } catch (err: any) {
      setLoading(false);
      showNotification('Error', 'Gagal terhubung ke API server.', 'error', [
        { text: 'Oke', onPress: () => setNotifyVisible(false) }
      ]);
    }
  }, [identifier, router]);

  return (
    <AuthLayout 
      slideDirection="left"
      title="Selamat Datang" 
      subtitle="Masuk ke Xynest dengan Email atau Nomor Handphone Anda"
    >
      <View style={styles.form}>
        <InputApp
          iconName="person"
          iconColor="#007AFF"
          placeholder="Email, Username Atau Nomor Ponsel Anda"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity style={styles.button} onPress={handleRequestOtp} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Login Akun</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push('/screens/auth/RegisterScreenApp')} style={styles.switchScreen} activeOpacity={0.7}>
        <Text style={styles.switchText}>Belum punya akun? <Text style={styles.link}>Daftar Sekarang</Text></Text>
      </TouchableOpacity>

      <NotificationInteractive
        visible={notifyVisible}
        title={notifyConfig.title}
        message={notifyConfig.message}
        type={notifyConfig.type}
        buttons={notifyConfig.buttons}
        onDismiss={() => setNotifyVisible(false)}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { marginTop: 10 },
  button: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 25, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  switchScreen: { marginTop: 32, alignItems: 'center' },
  switchText: { fontSize: 14, color: '#636366' },
  link: { color: '#007AFF', fontWeight: 'bold' }
});