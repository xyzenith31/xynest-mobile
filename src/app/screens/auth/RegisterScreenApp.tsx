import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { AuthService } from '@/services/AuthService';
import AuthLayout from '@/app/layouts/AuthLayout';

export default function RegisterScreenApp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showCalendar, setShowCalendar] = useState(false);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const handleTypeDate = (text: string) => {
    let clean = text.replace(/[^0-9]/g, '');
    if (clean.length >= 3 && clean.length <= 4) clean = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    else if (clean.length >= 5) clean = `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
    setBirthDate(clean);
  };

  const handleCalendarPick = (event: any, date?: Date) => {
    setShowCalendar(false);
    if (date) {
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      setBirthDate(`${d}/${m}/${date.getFullYear()}`);
    }
  };

  const handleRegister = async () => {
    if (!email || !username || !fullName || !phoneNumber || !gender || !birthDate) return Alert.alert('Error', 'Semua data wajib diisi, bro!');
    setLoading(true);
    try {
      const res = await AuthService.register({ email, username, full_name: fullName, phone_number: phoneNumber, gender, birth_date: birthDate });
      if (res.success) { Alert.alert('Sukses', res.message); setStep(2); }
      else { Alert.alert('Gagal', res.error || 'Gagal mendaftar.'); }
    } catch (err) { Alert.alert('Error', 'Gagal koneksi ke server.'); }
    finally { setLoading(false); }
  };

  const handleVerifyRegister = async () => {
    if (!otpCode.trim()) return Alert.alert('Error', 'Isi kode OTP dulu!');
    setLoading(true);
    try {
      const res = await AuthService.verifyRegister(email, otpCode.trim());
      if (res.success) { Alert.alert('Sukses', 'Akun aktif & otomatis masuk!'); router.replace('/screens/other/HomeScreenApp'); }
      else { Alert.alert('Gagal', res.error || 'OTP salah.'); }
    } catch (err) { Alert.alert('Error', 'Gagal aktivasi.'); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Registrasi Akun" subtitle="Gabung XyNest langsung aktif tanpa login ulang">
      {step === 1 ? (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Nama Lengkap" placeholderTextColor="#8E8E93" value={fullName} onChangeText={setFullName} />
          <TextInput style={styles.input} placeholder="Username (Contoh: @donny)" placeholderTextColor="#8E8E93" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#8E8E93" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="No HP internasional (Contoh: +62812...)" placeholderTextColor="#8E8E93" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
          
          <Text style={styles.label}>Gender:</Text>
          <View style={styles.rowGender}>
            {['pria', 'wanita', 'tidak ingin menyebutkan'].map((g) => (
              <TouchableOpacity key={g} style={[styles.genderBox, gender === g && styles.genderSel]} onPress={() => setGender(g)}>
                <Text style={[styles.genderTxt, gender === g && styles.genderTxtSel]}>{g === 'tidak ingin menyebutkan' ? 'Bebas' : g.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Tanggal Lahir:</Text>
          <View style={styles.rowDate}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="DD/MM/YYYY (Umur Min. 17)" placeholderTextColor="#8E8E93" value={birthDate} onChangeText={handleTypeDate} keyboardType="number-pad" maxLength={10} />
            <TouchableOpacity style={styles.calBtn} onPress={() => setShowCalendar(true)}><Text style={{ fontSize: 16 }}>📅</Text></TouchableOpacity>
          </View>
          {showCalendar && <DateTimePicker value={new Date(2005, 0, 1)} mode="date" maximumDate={new Date()} display="default" onChange={handleCalendarPick} />}

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Kirim OTP Aktivasi</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="6 Digit OTP Pendaftaran" placeholderTextColor="#8E8E93" value={otpCode} onChangeText={setOtpCode} keyboardType="number-pad" maxLength={6} />
          <TouchableOpacity style={[styles.button, styles.verifyBtn]} onPress={handleVerifyRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Aktivasi & Masuk Otomatis</Text>}
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity onPress={() => router.push('/screens/auth/LoginScreenApp')} style={styles.switchScreen}>
        <Text style={styles.switchText}>Sudah punya akun? <Text style={styles.link}>Masuk</Text></Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: 10 },
  label: { fontSize: 12, fontWeight: '600', color: '#636366', marginTop: 2 },
  input: { backgroundColor: '#F2F2F7', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, fontSize: 14, color: '#1C1C1E' },
  rowGender: { flexDirection: 'row', gap: 6 },
  genderBox: { flex: 1, backgroundColor: '#F2F2F7', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  genderSel: { backgroundColor: '#E1F5FE', borderColor: '#007AFF' },
  genderTxt: { fontSize: 11, color: '#636366' },
  genderTxtSel: { color: '#007AFF', fontWeight: '600' },
  rowDate: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  calBtn: { backgroundColor: '#E5E5EA', padding: 10, borderRadius: 10 },
  button: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  verifyBtn: { backgroundColor: '#34C759' },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  switchScreen: { marginTop: 16, alignItems: 'center' },
  switchText: { fontSize: 13, color: '#636366' },
  link: { color: '#007AFF', fontWeight: '600' }
});