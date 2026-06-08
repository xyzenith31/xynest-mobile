import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { authDb } from '@/databases/AuthDatabase';
import { UserService } from '@/services/UserService';
import AppLayout from '../../layouts/AppLayout';

interface SettingItemProps {
  title: string;
  onPress?: () => void;
}

export default function SettingScreenApp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Konfirmasi Logout",
      "Apakah Anda yakin ingin keluar dari akun Anda?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Keluar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await UserService.logout();
            } catch (err) {
              console.error("Gagal menghubungi API logout:", err);
            } finally {
              await authDb.clearSession();
              setLoading(false);
              router.replace('/screens/auth/LoginScreenApp');
            }
          }
        }
      ]
    );
  };

  const SettingItem = ({ title, onPress }: SettingItemProps) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress || (() => console.log(`${title} ditekan`))}
      activeOpacity={0.7}
    >
      <Text style={styles.settingText}>{title}</Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF3B30" />
        <Text style={{ marginTop: 10, color: '#8E8E93' }}>Mengakhiri sesi...</Text>
      </View>
    );
  }

  return (
    <AppLayout title="Pengaturan">
      <View style={styles.card}>
        <SettingItem 
          title="Account / Profil" 
          onPress={() => router.push('/screens/settings/AccountScreenApp')} 
        />
        <SettingItem title="Privacy" />
        <SettingItem title="Appearance" />
        <SettingItem title="Notification" />
        <SettingItem title="Storage & Data" />
        <SettingItem title="Language" />
        <SettingItem title="Accessibility" />
        <SettingItem 
          title="Device Management" 
          onPress={() => router.push('/screens/settings/DeviceManagerScreenApp')} 
        />
        <SettingItem title="Donation" />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutTxt}>Keluar Sesi (Logout)</Text>
      </TouchableOpacity>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7', },
  card: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F2F2F7', backgroundColor: '#FFF', },
  settingText: { fontSize: 16, color: '#1C1C1E', },
  chevron: { fontSize: 22, color: '#C7C7CC', lineHeight: 22, },
  logoutBtn: { backgroundColor: '#FF3B30', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 24, shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, },
  logoutTxt: { color: '#FFF', fontSize: 16, fontWeight: 'bold', },
});