import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, AppState, Modal, TouchableOpacity, Alert, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DeviceService } from '@/services/DeviceService';
import { UserService } from '@/services/UserService';
import { BannedService } from '@/services/admin/BannedService';
import { authDb } from '@/databases/AuthDatabase';
import NotificationInteractive, { NotificationButton } from '@/components/ui/NotificationInteractiveApp';
import InputApp from '@/components/ui/InputApp';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  scrollable?: boolean;
}

export default function AppLayout({ children, title, scrollable = true }: AppLayoutProps) {
  const router = useRouter();
  
  const isCheckingRef = useRef(false);
  const lastNotifiedStatusRef = useRef('ACTIVE'); // Untuk melacak agar notifikasi tidak spam
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [banNotifyVisible, setBanNotifyVisible] = useState(false);
  const [banNotifyConfig, setBanNotifyConfig] = useState({ title: '', message: '', buttons: [] as NotificationButton[] });
  const [appealVisible, setAppealVisible] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealText, setAppealText] = useState('');

  const handleForceLogout = async () => {
    await authDb.clearSession();
    router.replace('/screens/auth/LoginScreenApp');
  };

  const triggerBanNotification = (reason: string, status: string) => {
    const isPending = status === 'PENDING';

    setBanNotifyConfig({
      title: isPending ? 'Banding Diproses' : 'Akun Ditangguhkan',
      message: isPending
        ? `Akun Anda sedang ditangguhkan dan banding sedang dalam proses peninjauan oleh admin.\n\nAlasan:\n"${reason}"`
        : `Status akun Anda adalah BANNED.\n\nAlasan Admin:\n"${reason}"`,
      buttons: isPending ? [
        { text: 'Keluar Aplikasi', style: 'cancel', onPress: () => {
            BackHandler.exitApp();
        }},
        { text: 'Logout Akun', style: 'default', onPress: () => {
            setBanNotifyVisible(false);
            handleForceLogout();
        }}
      ] : [
        { text: 'Tutup', style: 'cancel', onPress: () => {
            setBanNotifyVisible(false);
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

    const initializeAuth = async () => {
      const user = await authDb.getSession(); 
      if (isMounted) setCurrentUser(user);
      checkUserStatusAndSession();
    };

    const checkUserStatusAndSession = async () => {
      if (isCheckingRef.current) return; 
      
      const token = await authDb.getToken();
      if (!token) return;

      isCheckingRef.current = true;
      try {
        const sessionStatus = await DeviceService.checkSessionValidity();
        if (sessionStatus === false && isMounted) {
          await handleForceLogout();
          return;
        }

        const userStatusRes = await UserService.checkStatus();
        if (userStatusRes.success && isMounted) {
          if (userStatusRes.status === 'BANNED' || userStatusRes.status === 'PENDING') {

            if (lastNotifiedStatusRef.current !== userStatusRes.status) {
              lastNotifiedStatusRef.current = userStatusRes.status;
              const bannedInfo = userStatusRes.ban_details;
              const reason = Array.isArray(bannedInfo) ? bannedInfo[0]?.reason : bannedInfo?.reason;
              triggerBanNotification(reason || 'Melanggar ketentuan layanan.', userStatusRes.status);
            }
            
          } else if (userStatusRes.status === 'ACTIVE') {
            lastNotifiedStatusRef.current = 'ACTIVE';
            setBanNotifyVisible(false);
            setAppealVisible(false);
          }
        }
      } catch (err: any) {
        console.log("Error network/server status check:", err);
      } finally {
        if (isMounted) isCheckingRef.current = false;
      }
    };

    initializeAuth();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') checkUserStatusAndSession();
    });
    
    const interval = setInterval(() => {
      if (isMounted) checkUserStatusAndSession();
    }, 5000);

    return () => {
      isMounted = false;
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

 const handleAppealSubmit = async () => {
    const email = currentUser?.email || currentUser?.user?.email;
    const username = currentUser?.username || currentUser?.user?.user_metadata?.username;
    const identifier = email || username;

    if (!identifier) {
      Alert.alert("Error", "Gagal mengidentifikasi sesi Anda. Silakan logout dan ajukan banding lewat halaman Login.");
      return;
    }
    
    if (!appealReason || !appealText) {
      Alert.alert("Peringatan", "Harap isi alasan dan detail banding.");
      return;
    }

    const res = await BannedService.submitAppeal(identifier, appealReason, appealText);
    
    if (res.success) {
      Alert.alert('Berhasil', 'Banding berhasil dikirim. Menunggu tinjauan admin.', [
        { text: 'Oke', onPress: () => {
            setAppealVisible(false);
            lastNotifiedStatusRef.current = 'PENDING';
            triggerBanNotification(appealReason, 'PENDING');
        }}
      ]);
    } else {
      Alert.alert('Gagal', res.error || 'Terjadi kesalahan saat mengirim banding.');
    }
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
        type={banNotifyConfig.title === 'Banding Diproses' ? 'info' : 'error'}
        buttons={banNotifyConfig.buttons}
        onDismiss={() => {}}
      />

      <Modal visible={appealVisible} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajukan Banding</Text>
            <Text style={styles.modalSubtitle}>Isi form ini untuk meminta peninjauan kembali akun Anda.</Text>
            
            <InputApp iconName="help-circle" iconColor="#8E8E93" placeholder="Alasan (Singkat)" value={appealReason} onChangeText={setAppealReason} />
            <InputApp iconName="document-text" iconColor="#8E8E93" placeholder="Pesan Detail" value={appealText} onChangeText={setAppealText} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.btnCancel]} onPress={() => setAppealVisible(false)}>
                <Text style={styles.btnTextCancel}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.btnSubmit]} onPress={handleAppealSubmit}>
                <Text style={styles.btnTextSubmit}>Kirim Banding</Text>
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