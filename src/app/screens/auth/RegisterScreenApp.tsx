import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { RegisterService } from '@/services/RegisterService';
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
    if (!email || !username || !fullName || !gender || !birthDate) {
      return Alert.alert('Error', 'Harap isi semua kolom wajib!');
    }
    const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!datePattern.test(birthDate)) {
      return Alert.alert('Error', 'Format tanggal lahir tidak valid (DD/MM/YYYY)');
    }

    setLoading(true);
    try {
      const parts = birthDate.split('/');
      const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      const payload = {
        email: email.trim(),
        username: username.trim(),
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim() || undefined,
        gender,
        birth_date: isoDate
      };

      const res = await RegisterService.register(payload);

      if (res.success) {
        setLoading(false);
        router.push({
          pathname: '/screens/auth/VerificationScreenApp' as any,
          params: { type: 'register', identifier: email.trim() }
        });
      } else {
        Alert.alert('Gagal', res.error || 'Gagal melakukan registrasi.');
        setLoading(false);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Gagal terhubung ke API server. Cek log console bro!');
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Buat Akun Baru" subtitle="Bergabunglah dengan XyNest sekarang juga.">
      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>NAMA LENGKAP</Text>
        <TextInput style={styles.input} placeholder="John Doe" value={fullName} onChangeText={setFullName} />

        <Text style={styles.label}>USERNAME</Text>
        <TextInput style={styles.input} placeholder="johndoe123" value={username} onChangeText={setUsername} autoCapitalize="none" />

        <Text style={styles.label}>EMAIL</Text>
        <TextInput style={styles.input} placeholder="email@contoh.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>NOMOR HANDPHONE (Opsional)</Text>
        <TextInput style={styles.input} placeholder="+62..." value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />

        <Text style={styles.label}>JENIS KELAMIN</Text>
        <View style={styles.rowGender}>
          <TouchableOpacity style={[styles.genderBox, gender === 'Pria' && styles.genderSel]} onPress={() => setGender('Pria')}>
            <Text style={[styles.genderTxt, gender === 'Pria' && styles.genderTxtSel]}>Laki-Laki</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.genderBox, gender === 'Wanita' && styles.genderSel]} onPress={() => setGender('Wanita')}>
            <Text style={[styles.genderTxt, gender === 'Wanita' && styles.genderTxtSel]}>Perempuan</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>TANGGAL LAHIR (DD/MM/YYYY)</Text>
        <View style={styles.rowDate}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="01/12/2000" value={birthDate} onChangeText={handleTypeDate} keyboardType="numeric" maxLength={10} />
          <TouchableOpacity style={styles.calBtn} onPress={() => setShowCalendar(true)}><Text>📅</Text></TouchableOpacity>
        </View>

        {showCalendar && (
          <DateTimePicker value={new Date()} mode="date" display="default" onChange={handleCalendarPick} maximumDate={new Date()} />
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
  calBtn: { backgroundColor: '#E5E5EA', padding: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  button: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 12, marginBottom: 20 },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  switchScreen: { paddingVertical: 16, alignItems: 'center', backgroundColor: '#FFF' },
  switchText: { fontSize: 14, color: '#636366' },
  link: { color: '#007AFF', fontWeight: '600' }
});