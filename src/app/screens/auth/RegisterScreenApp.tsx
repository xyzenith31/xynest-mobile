import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, LayoutAnimation, Keyboard } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { RegisterService } from '@/services/auth/RegisterService';
import AuthLayout from '@/app/layouts/AuthLayout';
import InputApp from '@/components/ui/InputApp';
import CustomSelectApp, { SelectOption } from '@/components/ui/CustomSelectApp';
import CustomPhoneNumberApp from '@/components/ui/CustomPhoneNumberApp';
import NotificationInteractive, { NotificationType, NotificationButton } from '@/components/ui/NotificationInteractiveApp';
import LoadingSpinnerApp from '@/components/ui/LoadingSpinnerApp';

const genderOptions: SelectOption[] = [
  { label: 'Pria', value: 'Pria', iconName: 'male', iconColor: '#007AFF' },
  { label: 'Wanita', value: 'Wanita', iconName: 'female', iconColor: '#FF2D55' },
  { label: 'Tidak ingin menyebutkan', value: 'Lainnya', iconName: 'eye-off', iconColor: '#8E8E93' }
];

export default function RegisterScreenApp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('62');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [notifyVisible, setNotifyVisible] = useState(false);
  const [notifyConfig, setNotifyConfig] = useState({title: '', message: '', type: 'info' as NotificationType, buttons: [] as NotificationButton[]});

  const handleGoToLogin = () => setIsExiting(true);
  const handleExitComplete = () => router.canGoBack() ? router.back() : router.replace('/screens/auth/LoginScreenApp');
  
  const showNotification = (title: string, message: string, type: NotificationType, buttons: NotificationButton[]) => {
    setNotifyConfig({ title, message, type, buttons });
    setNotifyVisible(true);
  };

  const handleUsernameChange = (text: string) => {
    let cleanText = text.replace(/\s/g, '');
    if (cleanText.length > 0 && !cleanText.startsWith('@')) cleanText = '@' + cleanText;
    if (cleanText === '@') cleanText = '';
    setUsername(cleanText);
  };

  const handleTypeDate = (text: string) => {
    let clean = text.replace(/[^0-9]/g, '');
    if (clean.length >= 3 && clean.length <= 4) clean = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    else if (clean.length >= 5) clean = `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
    setBirthDate(clean);
  };

  const handleValueChange = (event: any, date?: Date) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowCalendar(false);
    const selectedDate = date instanceof Date ? date : (event instanceof Date ? event : null);
    if (selectedDate) {
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const yyyy = selectedDate.getFullYear();
      setBirthDate(`${dd}/${mm}/${yyyy}`);
    }
  };

  const calculateAge = (dateString: string) => {
    const parts = dateString.split('/');
    if (parts.length !== 3) return 0;
    const formattedDate = `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
    const birth = new Date(formattedDate + 'T00:00:00Z');
    const today = new Date();
    
    let age = today.getUTCFullYear() - birth.getUTCFullYear();
    const m = today.getUTCMonth() - birth.getUTCMonth();
    if (m < 0 || (m === 0 && today.getUTCDate() < birth.getUTCDate())) {
      age--;
    }
    return age;
  };

  const executeRegistration = async () => {
    setNotifyVisible(false);
    setLoading(true);
    Keyboard.dismiss();
    try {
      const payload = {
        email: email.trim(), 
        username: username.trim(), 
        full_name: fullName.trim(),
        phone_number: phoneNumber ? `+${countryCode}${phoneNumber}` : undefined,
        gender, 
        birth_date: birthDate
      };
      
      const res = await RegisterService.register(payload);
      
      if (res.success) {
        setLoading(false);
        showNotification(
          'Pendaftaran Sukses', 
          'Kode verifikasi telah terkirim! Silakan periksa inbox Email Anda.', 
          'success', 
          [{ 
            text: 'Oke', 
            onPress: () => {
              setNotifyVisible(false);
              router.push({ pathname: '/screens/auth/VerificationScreenApp' as any, params: { type: 'register', identifier: email.trim() } });
            } 
          }]
        );
      } else {
        setLoading(false);
        showNotification('Gagal Mendaftar', res.error || res.message || 'Terjadi kesalahan saat mendaftar.', 'error', [
          { text: 'Oke', onPress: () => setNotifyVisible(false) }
        ]);
      }
    } catch (err: any) {
      setLoading(false);
      showNotification(
        'Koneksi Bermasalah', 
        'Anda sedang offline atau server tidak merespon. Silakan nyalakan WiFi atau data seluler Anda.', 
        'warning', 
        [{ text: 'Mengerti', onPress: () => setNotifyVisible(false) }]
      );
    }
  };

  const handleRegisterSubmit = () => {
    if (!email || !username || !fullName || !gender || !birthDate || !phoneNumber) {
      return showNotification('Form Tidak Lengkap', 'Harap isi semua kolom wajib!', 'warning', [
        { text: 'Oke', onPress: () => setNotifyVisible(false) }
      ]);
    }
    
    if (calculateAge(birthDate) < 17) { 
      return showNotification('Pendaftaran Ditolak', 'Maaf, umur Anda terlalu rendah untuk menggunakan layanan ini.', 'error', [
        { text: 'Oke', onPress: () => setNotifyVisible(false) }
      ]);
    }

    showNotification(
      'Konfirmasi Data', 
      'Apakah Anda yakin data yang Anda masukkan sudah benar?', 
      'info', 
      [
        { text: 'Batal', style: 'cancel', onPress: () => setNotifyVisible(false) },
        { text: 'Lanjutkan', onPress: () => executeRegistration() }
      ]
    );
  };

  return (
    <AuthLayout 
      slideDirection="right" 
      isExiting={isExiting} 
      onExitComplete={handleExitComplete}
      title="Buat Akun Baru" 
      subtitle="Bergabunglah dengan Xynest sekarang juga."
    >
      <View style={styles.form}>
        <InputApp iconName="mail" iconColor="#FF2D55" placeholder="Email Anda" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <InputApp iconName="at" iconColor="#AF52DE" placeholder="Username Anda" value={username} onChangeText={handleUsernameChange} autoCapitalize="none" />
        <InputApp iconName="person" iconColor="#007AFF" placeholder="Nama Lengkap Anda" value={fullName} onChangeText={setFullName} />
        <CustomPhoneNumberApp countryCode={countryCode} setCountryCode={setCountryCode} phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber} />
        <CustomSelectApp options={genderOptions} selectedValue={gender} onSelect={setGender} placeholder="Pilih Jenis Kelamin" iconName="male-female" iconColor="#FF9500" />
        <InputApp iconName="calendar" iconColor="#5856D6" placeholder="DD/MM/YYYY (Klik ikon)" value={birthDate} onChangeText={handleTypeDate} keyboardType="numeric" maxLength={10} onLeftIconPress={() => {LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setShowCalendar(true);}} />
        
        {showCalendar && <DateTimePicker value={new Date()} mode="date" display="default" onValueChange={handleValueChange} onDismiss={() => setShowCalendar(false)} maximumDate={new Date()} />}
        
        <TouchableOpacity style={styles.button} onPress={handleRegisterSubmit} disabled={loading} activeOpacity={0.8}>
          <Text style={styles.btnText}>Daftar Akun</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleGoToLogin} style={styles.switchScreen} activeOpacity={0.7}>
        <Text style={styles.switchText}>Sudah punya akun? <Text style={styles.link}>Masuk</Text></Text>
      </TouchableOpacity>
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
  form: { paddingBottom: 10 },
  button: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 25, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  switchScreen: { paddingTop: 20, alignItems: 'center' },
  switchText: { fontSize: 14, color: '#636366' },
  link: { color: '#007AFF', fontWeight: 'bold' }
});