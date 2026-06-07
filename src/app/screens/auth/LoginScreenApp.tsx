import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Keyboard, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { LoginService } from '@/services/LoginService';
import { BannedService } from '@/services/admin/BannedService';
import AuthLayout from '@/app/layouts/AuthLayout';
import InputApp from '@/components/ui/InputApp';
import NotificationInteractive, { NotificationType, NotificationButton } from '@/components/ui/NotificationInteractiveApp';
import LoadingSpinnerApp from '@/components/ui/LoadingSpinnerApp';

export default function LoginScreenApp() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [notifyVisible, setNotifyVisible] = useState(false);
  const [notifyConfig, setNotifyConfig] = useState({title: '', message: '', type: 'info' as NotificationType, buttons: [] as NotificationButton[]});
  const [appealVisible, setAppealVisible] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealText, setAppealText] = useState('');
  const [adminBanReason, setAdminBanReason] = useState('');
  const [banExpiryDate, setBanExpiryDate] = useState('');

  const showNotification = (title: string, message: string, type: NotificationType, buttons: NotificationButton[]) => {
    setNotifyConfig({ title, message, type, buttons });
    setNotifyVisible(true);
  };

  const handleAppealSubmit = async () => {
    if (!identifier.trim()) {
      return showNotification('Error Identitas', 'Sesi identitas Anda hilang. Silakan isi form login kembali.', 'error', [
         { text: 'Oke', onPress: () => setNotifyVisible(false) }
      ]);
    }

    if (!appealReason.trim() || !appealText.trim()) {
       return showNotification('Peringatan', 'Harap isi alasan (singkat) dan pesan detail banding dengan lengkap.', 'warning', [
         { text: 'Mengerti', onPress: () => setNotifyVisible(false) }
       ]);
    }

    setAppealVisible(false);
    setLoading(true);
    
    const res = await BannedService.submitAppeal(identifier.trim(), appealReason, appealText);
    setLoading(false);

    if (res.success) {
      showNotification(
        'Banding Terkirim', 
        'Banding berhasil dikirim. Menunggu tinjauan dari pihak administrator.', 
        'success', 
        [{ text: 'Oke', onPress: () => setNotifyVisible(false) }]
      );
      setAppealReason('');
      setAppealText('');
    } else {
      showNotification(
        'Pengiriman Gagal', 
        res.error || 'Gagal mengirim banding. Server tidak merespons.', 
        'error', 
        [
          { text: 'Coba Lagi', onPress: () => {
              setNotifyVisible(false);
              setAppealVisible(true);
          }},
          { text: 'Tutup', style: 'cancel', onPress: () => setNotifyVisible(false) }
        ]
      );
    }
  };

  const handleRequestOtp = useCallback(async () => {
    if (!identifier.trim()) {
      return showNotification('Form Tidak Lengkap', 'Email, Username, atau Nomor Ponsel wajib diisi, bro!', 'warning', [
        { text: 'Oke', onPress: () => setNotifyVisible(false) }
      ]);
    }
    
    Keyboard.dismiss();
    setLoading(true);
    try {
      const res = await LoginService.requestLogin(identifier.trim());
      setLoading(false);
      
      if (res.success) {
        showNotification('Akun Ditemukan', 'Kode verifikasi telah dikirim. Klik Oke untuk melanjutkan.', 'success', [{ text: 'Oke', onPress: () => { setNotifyVisible(false); router.push({ pathname: '/screens/auth/VerificationScreenApp' as any, params: { type: 'login', identifier: identifier.trim() }}); }}]);
      } else {
        if (res.is_banned && res.ban_details) {
          const reasonFromAdmin = res.ban_details.reason || 'Melanggar ketentuan layanan.';
          const expiryDate = new Date(res.ban_details.expires_at).toLocaleString('id-ID');
          
          setAdminBanReason(reasonFromAdmin);
          setBanExpiryDate(expiryDate);
          
          showNotification(
            'Akun Ditangguhkan', 
            `Status: Banned\nSelesai: ${expiryDate}\n\nAlasan Admin:\n"${reasonFromAdmin}"`, 
            'error', 
            [
              { text: 'Oke', style: 'cancel', onPress: () => setNotifyVisible(false) },
              { text: 'Ajukan Banding', style: 'default', onPress: () => {
                  setNotifyVisible(false);
                  setAppealVisible(true); 
              }}
            ]
          );
        } else {
          showNotification('Gagal Masuk', res.error || res.message || 'Akun tidak ditemukan.', 'error', [
            { text: 'Oke', onPress: () => setNotifyVisible(false) }
          ]);
        }
      }
    } catch (err: any) {
      setLoading(false);
      showNotification('Koneksi Terputus', 'Anda sedang offline atau server tidak merespon.', 'warning', [
        { text: 'Mengerti', onPress: () => setNotifyVisible(false) }
      ]);
    }
  }, [identifier, router]);

  const submitAppeal = async () => {
    if (!appealReason || !appealText) {
       return showNotification('Peringatan', 'Harap isi alasan (singkat) dan pesan detail banding.', 'warning', [
         { text: 'Oke', onPress: () => setNotifyVisible(false) }
       ]);
    }

    setAppealVisible(false);
    setLoading(true);
    
    const res = await BannedService.submitAppeal(identifier.trim(), appealReason, appealText);
    setLoading(false);

    if (res.success) {
      showNotification('Banding Terkirim', 'Banding berhasil dikirim. Menunggu tinjauan dari pihak administrator.', 'success', [
        { text: 'Oke', onPress: () => setNotifyVisible(false) }
      ]);
      setAppealReason('');
      setAppealText('');
    } else {
      showNotification('Pengiriman Gagal', res.error || 'Gagal mengirim banding.', 'error', [
        { text: 'Coba Lagi', onPress: () => setNotifyVisible(false) }
      ]);
    }
  };

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
          <Text style={styles.btnText}>Login Akun</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push('/screens/auth/RegisterScreenApp')} style={styles.switchScreen} activeOpacity={0.7}>
        <Text style={styles.switchText}>Belum punya akun? <Text style={styles.link}>Daftar Sekarang</Text></Text>
      </TouchableOpacity>

      <Modal visible={appealVisible} transparent animationType="fade" onRequestClose={() => setAppealVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajukan Banding</Text>
            <Text style={styles.modalSubtitle}>Sesi ditangguhkan. Isi form ini untuk mengajukan banding.</Text>
            
            <InputApp iconName="help-circle" iconColor="#8E8E93" placeholder="Alasan (Singkat)" value={appealReason} onChangeText={setAppealReason} />
            <InputApp iconName="document-text" iconColor="#8E8E93" placeholder="Pesan Detail" value={appealText} onChangeText={setAppealText} />

            <View style={{ flexDirection: 'row', marginTop: 16, justifyContent: 'space-between' }}>
              <TouchableOpacity 
                style={{ flex: 1, paddingVertical: 12, borderRadius: 25, alignItems: 'center', marginHorizontal: 5, backgroundColor: '#FFECEB' }} 
                onPress={() => setAppealVisible(false)}
              >
                <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ flex: 1, paddingVertical: 12, borderRadius: 25, alignItems: 'center', marginHorizontal: 5, backgroundColor: '#007AFF' }} 
                onPress={handleAppealSubmit}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Kirim Banding</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <LoadingSpinnerApp visible={loading} />

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
  link: { color: '#007AFF', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', padding: 24, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, elevation: 5 },
  modalHeader: { marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4, textAlign: 'center' },
  modalSubtitle: { fontSize: 13, color: '#8E8E93', textAlign: 'center' },
  banInfoBox: { backgroundColor: '#FFECEB', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FFD1CF' },
  banInfoTitle: { fontSize: 12, fontWeight: 'bold', color: '#FF3B30', marginBottom: 4 },
  banInfoText: { fontSize: 13, color: '#3A3A3C', fontStyle: 'italic', marginBottom: 6 },
  banExpiryText: { fontSize: 11, color: '#8E8E93', fontWeight: '500' },
  modalButtons: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 25, alignItems: 'center', marginHorizontal: 5 },
  btnCancel: { backgroundColor: '#F2F2F7' },
  btnSubmit: { backgroundColor: '#007AFF' },
  btnTextCancel: { color: '#3A3A3C', fontWeight: 'bold', fontSize: 15 },
  btnTextSubmit: { color: '#FFF', fontWeight: 'bold', fontSize: 15 }
});