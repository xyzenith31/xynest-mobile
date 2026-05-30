import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, LayoutAnimation } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { RegisterService } from '@/services/RegisterService';
import AuthLayout from '@/app/layouts/AuthLayout';
import InputApp from '@/components/ui/InputApp';
import CustomSelectApp, { SelectOption } from '@/components/ui/CustomSelectApp';
import CustomPhoneNumberApp from '@/components/ui/CustomPhoneNumberApp';

const genderOptions: SelectOption[] = [
  { label: 'Pria', value: 'Pria', iconName: 'male', iconColor: '#007AFF' },
  { label: 'Wanita', value: 'Wanita', iconName: 'female', iconColor: '#FF2D55' },
  { label: 'Tidak ingin menyebutkan', value: 'Lainnya', iconName: 'eye-off', iconColor: '#8E8E93' }
];

export default function RegisterScreenApp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('62');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const handleTypeDate = useCallback((text: string) => {
    let clean = text.replace(/[^0-9]/g, '');
    if (clean.length >= 3 && clean.length <= 4) clean = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    else if (clean.length >= 5) clean = `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
    setBirthDate(clean);
  }, []);

  const handleValueChange = useCallback((event: any, date?: Date) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowCalendar(false);
    const selectedDate = date instanceof Date ? date : (event instanceof Date ? event : null);
    
    if (selectedDate) {
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const yyyy = selectedDate.getFullYear();
      setBirthDate(`${dd}/${mm}/${yyyy}`);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setShowCalendar(false);
  }, []);

  const toggleCalendar = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowCalendar(true);
  }, []);

  const handleRegisterSubmit = useCallback(async () => {
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
      const fullPhoneNumber = phoneNumber ? `+${countryCode}${phoneNumber}` : undefined;

      const payload = {
        email: email.trim(),
        username: username.trim(),
        full_name: fullName.trim(),
        phone_number: fullPhoneNumber,
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
      Alert.alert('Error', 'Gagal terhubung ke API server.');
      setLoading(false);
    }
  }, [email, username, fullName, gender, birthDate, phoneNumber, countryCode, router]);

  return (
    <AuthLayout title="Buat Akun Baru" subtitle="Bergabunglah dengan Xynest sekarang juga.">
      <View style={styles.form}>
        
        <InputApp iconName="mail" iconColor="#FF2D55" placeholder="Email Anda" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <InputApp iconName="at" iconColor="#AF52DE" prefix="@" placeholder="Username Anda" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <InputApp iconName="person" iconColor="#007AFF" placeholder="Nama Lengkap Anda" value={fullName} onChangeText={setFullName} />

        <CustomPhoneNumberApp countryCode={countryCode} setCountryCode={setCountryCode} phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber} />
        <CustomSelectApp options={genderOptions} selectedValue={gender} onSelect={setGender} placeholder="Pilih Jenis Kelamin" iconName="male-female" iconColor="#FF9500" />

        <InputApp 
          iconName="calendar" iconColor="#5856D6" 
          placeholder="DD/MM/YYYY (Klik ikon)" 
          value={birthDate} onChangeText={handleTypeDate} keyboardType="numeric" maxLength={10} 
          onLeftIconPress={toggleCalendar}
        />

        {showCalendar && (
          <DateTimePicker 
            value={new Date()} 
            mode="date" 
            display="default" 
            onValueChange={handleValueChange} 
            onDismiss={handleDismiss}
            maximumDate={new Date()} 
          />
        )}

        <TouchableOpacity style={styles.button} onPress={handleRegisterSubmit} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Daftar Akun</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push('/screens/auth/LoginScreenApp')} style={styles.switchScreen} activeOpacity={0.7}>
        <Text style={styles.switchText}>Sudah punya akun? <Text style={styles.link}>Masuk</Text></Text>
      </TouchableOpacity>
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