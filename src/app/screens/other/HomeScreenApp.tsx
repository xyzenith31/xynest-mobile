import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authDb, UserSession } from '@/databases/AuthDatabase';
import { AuthService } from '@/services/AuthService';

export default function HomeScreenApp() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const isValid = await AuthService.checkSessionValidity();
      if (isValid) { setUser(await authDb.getSession()); } 
      else { router.replace('/screens/auth/LoginScreenApp'); }
      setLoading(false);
    };
    fetchSession();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    await AuthService.logout();
    router.replace('/screens/auth/LoginScreenApp');
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.card}>
        <Text style={styles.welcome}>Sesi Aktif Terautentikasi</Text>
        <Text style={styles.name}>{user?.full_name}</Text>
        <Text style={styles.username}>@{user?.username}</Text>
        <View style={styles.divider} />
        <View style={styles.row}><Text style={styles.lbl}>Email</Text><Text style={styles.val}>{user?.email}</Text></View>
        <View style={styles.row}><Text style={styles.lbl}>No HP</Text><Text style={styles.val}>{user?.phone_number}</Text></View>
        <View style={styles.row}><Text style={styles.lbl}>Gender</Text><Text style={styles.val}>{user?.gender}</Text></View>
        <View style={styles.row}><Text style={styles.lbl}>Lahir</Text><Text style={styles.val}>{user?.birth_date}</Text></View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}><Text style={styles.logoutTxt}>Keluar Sesi (Logout)</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', padding: 24, justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
  card: { backgroundColor: '#FFF', padding: 24, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
  welcome: { fontSize: 12, color: '#007AFF', fontWeight: '700', textTransform: 'uppercase', textAlign: 'center', letterSpacing: 1 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1E', textAlign: 'center', marginTop: 6 },
  username: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#E5E5EA', marginVertical: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  lbl: { fontSize: 14, color: '#636366' },
  val: { fontSize: 14, color: '#1C1C1E', fontWeight: '600' },
  logoutBtn: { backgroundColor: '#FF3B30', marginTop: 20, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  logoutTxt: { color: '#FFF', fontSize: 15, fontWeight: '600' }
});