import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { AuthService } from '@/services/AuthService';
import AuthLayout from '@/app/layouts/AuthLayout';

export default function RegisterScreenApp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const handleTypeDate = (text: string) => {
    let clean = text.replace(/[^0-9]/g, '');
    if (clean.length >= 3 && clean.length <= 4) clean = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    else if (clean.length >= 5) clean = `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
    setBirthDate(clean);
  };

  const handleCalendarPick = (event: any, date?: Date) => {
    setShowCalendar(false);
    if (date) {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      setBirthDate(`${dd}/${mm}/${yyyy}`);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!email.trim() || !username.trim() || !fullName.trim() || !phoneNumber.trim() || !gender || !birthDate.trim()) {
      return Alert.alert('Error', 'Semua data registrasi wajib diisi, bro!');
    }

    setLoading(true);
    try {
      const res = await AuthService.register({
        email: email.trim(),
        username: username.trim(),
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        gender: gender,
        birth_date: birthDate.trim(),
      });

      if (res.success) {
        Alert.alert('Sukses', res.message || 'Registrasi berhasil, silakan verifikasi akun Anda.');
        
        router.push({
          pathname: '/screens/auth/VerificationScreenApp' as any,
          params: { type: 'register', identifier: email.trim() }
        });
      } else {
        Alert.alert('Gagal', res.error || 'Terjadi kesalahan saat mendaftar.');
      }
    } catch (err) {
      Alert.alert('Error', 'Gagal terhubung ke API server registrasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Daftar Akun" 
      subtitle="Lengkapi data diri Anda untuk bergabung ke XyNest"
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
        <Text style={styles.label}>EMAIL</Text>
        <TextInput style={styles.input} placeholder="contoh@domain.com" placeholderTextColor="#8E8E93" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>USERNAME</Text>
        <TextInput style={styles.input} placeholder="username_kamu" placeholderTextColor="#8E8E93" value={username} onChangeText={setUsername} autoCapitalize="none" />

        <Text style={styles.label}>NAMA LENGKAP</Text>
        <TextInput style={styles.input} placeholder="Nama Lengkap Anda" placeholderTextColor="#8E8E93" value={fullName} onChangeText={setFullName} />

        <Text style={styles.label}>NOMOR HANDPHONE</Text>
        <TextInput style={styles.input} placeholder="08xxxxxxxxxx" placeholderTextColor="#8E8E93" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />

        <Text style={styles.label}>JENIS KELAMIN</Text>
        <View style={styles.rowGender}>
          <TouchableOpacity style={[styles.genderBox, gender === 'pria' && styles.genderSel]} onPress={() => setGender('pria')}>
            <Text style={[styles.genderTxt, gender === 'pria' && styles.genderTxtSel]}>PRIA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.genderBox, gender === 'wanita' && styles.genderSel]} onPress={() => setGender('wanita')}>
            <Text style={[styles.genderTxt, gender === 'wanita' && styles.genderTxtSel]}>WANITA</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>TANGGAL LAHIR (DD/MM/YYYY)</Text>
        <View style={styles.rowDate}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="DD/MM/YYYY" placeholderTextColor="#8E8E93" value={birthDate} onChangeText={handleTypeDate} keyboardType="number-pad" maxLength={10} />
          <TouchableOpacity style={styles.calBtn} onPress={() => setShowCalendar(true)}>
            <Text style={{ fontSize: 16 }}>📅</Text>
          </TouchableOpacity>
        </View>

        {showCalendar && (
          <DateTimePicker value={new Date(2005, 0, 1)} mode="date" display="default" onChange={handleCalendarPick} maximumDate={new Date()} />
        )}

        <TouchableOpacity style={styles.button} onPress={handleRegisterSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Daftar & Minta OTP</Text>}
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity onPress={() => router.push('/screens/auth/LoginScreenApp')} style={styles.switchScreen}>
        <Text style={styles.switchText}>Sudah punya akun? <Text style={styles.link}>Masuk</Text></Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: 10 },
  label: { fontSize: 11, fontWeight: '700', color: '#636366', marginTop: 4 },
  input: { backgroundColor: '#F2F2F7', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, fontSize: 14, color: '#1C1C1E' },
  rowGender: { flexDirection: 'row', gap: 6 },
  genderBox: { flex: 1, backgroundColor: '#F2F2F7', paddingVertical: 11, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  genderSel: { backgroundColor: '#E1F5FE', borderColor: '#007AFF' },
  genderTxt: { fontSize: 13, color: '#636366' },
  genderTxtSel: { color: '#007AFF', fontWeight: '600' },
  rowDate: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  calBtn: { backgroundColor: '#E5E5EA', padding: 10, borderRadius: 10 },
  button: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  switchScreen: { alignItems: 'center', marginTop: 16, marginBottom: 10 },
  switchText: { fontSize: 14, color: '#636366' },
  link: { color: '#007AFF', fontWeight: '600' }
});