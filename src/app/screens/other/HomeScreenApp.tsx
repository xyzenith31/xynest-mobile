import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { authDb, UserSession } from '@/databases/AuthDatabase';
import { DeviceService } from '@/services/auth/DeviceService';
import { UserService } from '@/services/auth/UserService';
import AppLayout from '../../layouts/AppLayout';

export default function HomeScreenApp() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const isValid = await DeviceService.checkSessionValidity();
      
      if (isValid) { 
        setUser(await authDb.getSession()); 
      } else { 
        await authDb.clearSession(); 
        router.replace('/screens/auth/LoginScreenApp'); 
      }
      setLoading(false);
    };
    fetchSession();
  }, []);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Konfirmasi Hapus Akun",
      "Apakah Anda yakin ingin menghapus akun secara permanen? Seluruh data dan sesi akan dihapus dari sistem.",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus Permanen", 
          style: "destructive", 
          onPress: async () => {
            setLoading(true);
            
            const res = await UserService.deleteAccount(); 
            await authDb.clearSession(); 
            setLoading(false);

            setTimeout(() => {
              if (res && res.success) {
                Alert.alert("Sukses", "Akun berhasil dihapus permanen.", [
                  { text: "OK", onPress: () => router.replace('/screens/auth/LoginScreenApp') }
                ]);
              } else {
                Alert.alert("Gagal", res?.error || "Gagal menghapus akun.");
                router.replace('/screens/auth/LoginScreenApp');
              }
            }, 100);
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, color: '#8E8E93' }}>Memproses permintaan...</Text>
      </View>
    );
  }

  return (
    <AppLayout title="Beranda">
      <View style={styles.card}>
        <Text style={styles.welcome}>Sesi Aktif Terautentikasi</Text>
        <Text style={styles.name}>{user?.full_name}</Text>
        <Text style={styles.username}>{user?.username}</Text>
        <View style={styles.divider} />
        <View style={styles.row}><Text style={styles.lbl}>Email</Text><Text style={styles.val}>{user?.email}</Text></View>
        <View style={styles.row}><Text style={styles.lbl}>Telepon</Text><Text style={styles.val}>{user?.phone_number || '-'}</Text></View>
        <View style={styles.row}><Text style={styles.lbl}>Gender</Text><Text style={styles.val}>{user?.gender}</Text></View>
        <View style={styles.row}><Text style={styles.lbl}>Lahir</Text><Text style={styles.val}>{user?.birth_date}</Text></View>
        
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/screens/settings/SettingScreenApp')}>
          <Text style={styles.settingsTxt}>Buka Pengaturan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteTxt}>Hapus Akun Permanen</Text>
        </TouchableOpacity>
        
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
  card: { backgroundColor: '#FFF', padding: 24, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
  welcome: { fontSize: 12, color: '#007AFF', fontWeight: '700', textTransform: 'uppercase', textAlign: 'center', letterSpacing: 1 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1E', textAlign: 'center', marginTop: 6 },
  username: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#E5E5EA', marginVertical: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  lbl: { fontSize: 13, color: '#8E8E93' },
  val: { fontSize: 13, fontWeight: '500', color: '#1C1C1E' },
  settingsBtn: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  settingsTxt: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: 'transparent', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#FF3B30' },
  deleteTxt: { color: '#FF3B30', fontSize: 14, fontWeight: 'bold' }
});