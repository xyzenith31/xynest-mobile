import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, AppState, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DeviceService } from '@/services/DeviceService';
import { BannedService } from '@/services/admin/BannedService';
import { authDb } from '@/databases/AuthDatabase';
import { supabase } from '@/config/supabase';
import NotificationInteractive, { NotificationButton, NotificationType } from '@/components/ui/NotificationInteractiveApp';
import InputApp from '@/components/ui/InputApp';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  scrollable?: boolean;
}

export default function AppLayout({ children, title, scrollable = true }: AppLayoutProps) {
  const router = useRouter();
  const isCheckingRef = useRef(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [banNotifyVisible, setBanNotifyVisible] = useState(false);
  const [banNotifyConfig, setBanNotifyConfig] = useState({ title: '', message: '', buttons: [] as NotificationButton[] });
  const [appealVisible, setAppealVisible] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealText, setAppealText] = useState('');

  const triggerLogoutAndBan = async (reason: string) => {
    await authDb.clearSession();
    setBanNotifyConfig({
      title: 'Akun Diblokir',
      message: `Anda baru saja diblokir oleh admin.\nAlasan: ${reason}`,
      buttons: [
        { text: 'Keluar', style: 'cancel', onPress: () => {
            setBanNotifyVisible(false);
            router.replace('/screens/auth/LoginScreenApp');
        }},
        { text: 'Ajukan Banding', style: 'default', onPress: () => {
            setBanNotifyVisible(false);
            setAppealVisible(true);
        }}
      ]
    });
    setBanNotifyVisible(true);
  };

  useEffect(() => {
    let isMounted = true;
    let banSubscription: any;

    const initializeAuth = async () => {
    const user = await authDb.getSession(); 
    setCurrentUser(user);

    if (user?.id) {
      banSubscription = supabase
        .channel('banned_listener')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'banned_users', 
          filter: `user_id=eq.${user.id}` 
        }, (payload: any) => {
          if (isMounted) triggerLogoutAndBan(payload.new.reason);
        })
        .subscribe();
    }
  };

    const checkSession = async () => {
      if (isCheckingRef.current) return;
      const token = await authDb.getToken();
      if (!token) return;

      isCheckingRef.current = true;
      try {
        const sessionStatus = await DeviceService.checkSessionValidity();
        if (sessionStatus === false && isMounted) {
          await authDb.clearSession();
          router.replace('/screens/auth/LoginScreenApp');
        }
      } catch (err: any) {
        console.log("Error network/server:", err);
      } finally {
        if (isMounted) isCheckingRef.current = false;
      }
    };

    initializeAuth();
    checkSession();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') checkSession();
    });
    
    const interval = setInterval(() => {
      if (isMounted) checkSession();
    }, 3000);

    return () => {
      isMounted = false;
      subscription.remove();
      clearInterval(interval);
      if (banSubscription) supabase.removeChannel(banSubscription);
    };
  }, []);

  const handleAppealSubmit = async () => {
    if (!currentUser?.email && !currentUser?.username) return;
    
    const identifier = currentUser.email || currentUser.username;
    const res = await BannedService.submitAppeal(identifier, appealReason, appealText);
    
    setAppealVisible(false);
    alert(res.success ? 'Banding berhasil dikirim.' : `Gagal: ${res.error}`);
    router.replace('/screens/auth/LoginScreenApp');
  };

  const content = scrollable ? (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>{children}</ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      {content}

      <NotificationInteractive
        visible={banNotifyVisible}
        title={banNotifyConfig.title}
        message={banNotifyConfig.message}
        type="error"
        buttons={banNotifyConfig.buttons}
        onDismiss={() => setBanNotifyVisible(false)}
      />

      <Modal visible={appealVisible} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajukan Banding</Text>
            <Text style={styles.modalSubtitle}>Sesi dihapus. Isi form ini sebelum logout sepenuhnya.</Text>
            
            <InputApp iconName="help-circle" iconColor="#8E8E93" placeholder="Alasan (Singkat)" value={appealReason} onChangeText={setAppealReason} />
            <InputApp iconName="document-text" iconColor="#8E8E93" placeholder="Pesan Detail" value={appealText} onChangeText={setAppealText} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.btnCancel]} onPress={() => {
                setAppealVisible(false);
                router.replace('/screens/auth/LoginScreenApp');
              }}>
                <Text style={styles.btnTextCancel}>Keluar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.btnSubmit]} onPress={handleAppealSubmit}>
                <Text style={styles.btnTextSubmit}>Kirim</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E' },
  scroll: { padding: 24, flexGrow: 1 },
  content: { padding: 24, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', padding: 24, borderRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 13, color: '#8E8E93', marginBottom: 20, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', marginTop: 16, justifyContent: 'space-between' },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 25, alignItems: 'center', marginHorizontal: 5 },
  btnCancel: { backgroundColor: '#FFECEB' },
  btnSubmit: { backgroundColor: '#007AFF' },
  btnTextCancel: { color: '#FF3B30', fontWeight: 'bold' },
  btnTextSubmit: { color: '#FFF', fontWeight: 'bold' }
});