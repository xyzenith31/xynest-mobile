import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { UserService } from '../../../services/UserService';
import { authDb } from '../../../databases/AuthDatabase';
import AppLayout from '../../layouts/AppLayout';
import { Avatar } from '../../../components/ux/Avatar';

export default function AccountScreenApp() {
  const [loading, setLoading] = useState(false);
  const [activeEditField, setActiveEditField] = useState<string | null>(null);
  const [emailStep, setEmailStep] = useState<number>(0);
  const [newEmail, setNewEmail] = useState('');
  const [otpOldEmail, setOtpOldEmail] = useState('');
  const [otpNewEmail, setOtpNewEmail] = useState('');
  const [otpPassword, setOtpPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [userData, setUserData] = useState({
    full_name: '', username: '', phone_number: '', email: '', gender: '', birth_date: '', profileUrl: null as string | null
  });

  useEffect(() => { loadProfileData(); }, []);

  const loadProfileData = async () => {
    const cachedData = await authDb.getUserData();
    if (cachedData) updateStateFromData(cachedData);
    const result = await UserService.getProfile();
    if (result.success && result.data) updateStateFromData(result.data);
  };

  const updateStateFromData = (data: any) => {
    setUserData({
      full_name: data.full_name || '', username: data.username || '', phone_number: data.phone_number || '',
      email: data.email || '', gender: data.gender || '', birth_date: data.birth_date || '', profileUrl: data.profiles || null
    });
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Data = `data:${result.assets[0].mimeType || 'image/jpeg'};base64,${result.assets[0].base64}`;
      setLoading(true);
      const res = await UserService.updateProfile({ profile_base64: base64Data });
      setLoading(false);
      if (res.success) {
        setUserData({ ...userData, profileUrl: res.profiles });
        Alert.alert('Sukses', 'Foto profil berhasil diperbarui.');
      } else {
        Alert.alert('Gagal', res.error || 'Terjadi kesalahan.');
      }
    }
  };

  const handleUpdateGeneral = async (field: string) => {
    if (!inputValue.trim()) return Alert.alert('Error', 'Input tidak boleh kosong.');
    setLoading(true);
    const res = await UserService.updateProfile({ [field]: inputValue });
    setLoading(false);
    if (res.success) {
      Alert.alert('Sukses', `Data berhasil diperbarui.`);
      setUserData({ ...userData, [field]: inputValue });
      setActiveEditField(null);
    } else {
      Alert.alert('Gagal', res.error || 'Terjadi kesalahan.');
    }
  };

  const handleStartEmailChange = async () => {
    setLoading(true);
    const res = await UserService.requestOldEmailOtp();
    setLoading(false);
    if (res.success) {
      setEmailStep(1);
      setOtpOldEmail(''); setNewEmail(''); setOtpNewEmail('');
      setActiveEditField('email');
    } else { Alert.alert('Gagal', res.error); }
  };

  const handleRequestNewEmailOtp = async () => {
    if (!newEmail.trim()) return Alert.alert('Error', 'Masukkan email baru Anda.');
    setLoading(true);
    const res = await UserService.verifyOldAndRequestNewEmail(otpOldEmail, newEmail);
    setLoading(false);
    if (res.success) {
      setEmailStep(3);
      Alert.alert('Sukses', 'OTP telah dikirim ke email baru Anda.');
    } else { Alert.alert('Gagal', res.error); }
  };

  const handleVerifyNewEmail = async () => {
    if (!otpNewEmail.trim()) return Alert.alert('Error', 'Masukkan OTP email baru.');
    setLoading(true);
    const res = await UserService.verifyNewEmailOtp(otpNewEmail);
    setLoading(false);
    if (res.success) {
      Alert.alert('Sukses', 'Email Anda berhasil diperbarui.');
      setUserData({ ...userData, email: newEmail });
      setActiveEditField(null);
      setEmailStep(0);
    } else { Alert.alert('Gagal', res.error); }
  };

  const handleRequestPassword = async () => {
    setLoading(true);
    const res = await UserService.requestPasswordChange();
    setLoading(false);
    if (res.success) {
      Alert.alert('Sukses', 'OTP untuk ganti password telah dikirim ke email Anda.');
      setActiveEditField('password');
      setOtpPassword(''); setNewPassword(''); setConfirmPassword('');
    } else { Alert.alert('Gagal', res.error); }
  };

  const handleVerifyPassword = async () => {
    if (newPassword !== confirmPassword) return Alert.alert('Error', 'Konfirmasi password tidak cocok.');
    setLoading(true);
    const res = await UserService.verifyPasswordChange(otpPassword, newPassword);
    setLoading(false);
    if (res.success) {
      Alert.alert('Sukses', 'Password berhasil diperbarui.');
      setActiveEditField(null);
    } else { Alert.alert('Gagal', res.error); }
  };

  const renderField = (label: string, value: string, fieldKey: string) => (
    <View style={styles.fieldContainer}>
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || '-'}</Text>
      </View>
      <TouchableOpacity onPress={() => {
        if (fieldKey === 'email') {
          handleStartEmailChange();
        } else {
          setInputValue(value);
          setActiveEditField(fieldKey);
        }
      }}>
        {loading && fieldKey === 'email' ? <ActivityIndicator size="small" color="#007AFF" /> : <Text style={styles.editBtnText}>Ubah</Text>}
      </TouchableOpacity>
    </View>
  );

  return (
    <AppLayout title="Akun Saya">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View style={styles.avatarSection}>
          <Avatar url={userData.profileUrl} name={userData.full_name || userData.username} size={100} />
          <TouchableOpacity style={styles.changePhotoBtn} onPress={handlePickImage} disabled={loading}>
            {loading && !activeEditField ? <ActivityIndicator color="#007AFF" /> : <Text style={styles.changePhotoText}>Ubah Foto Profil</Text>}
          </TouchableOpacity>
        </View>

        {activeEditField ? (
          <View style={styles.editorCard}>
            {activeEditField === 'email' ? (
              emailStep === 1 ? (
                <>
                  <Text style={styles.editorTitle}>Verifikasi Keamanan</Text>
                  <Text style={styles.descriptionText}>Kode OTP telah otomatis dikirim ke email lama Anda.</Text>
                  <TextInput style={styles.input} value={otpOldEmail} onChangeText={setOtpOldEmail} placeholder="Masukkan 6-Digit OTP Lama" keyboardType="numeric" />
                  <TouchableOpacity style={styles.saveBtn} onPress={() => {
                    if (!otpOldEmail) return Alert.alert('Error', 'OTP tidak boleh kosong');
                    setEmailStep(2);
                  }}>
                    <Text style={styles.saveBtnText}>Lanjut</Text>
                  </TouchableOpacity>
                </>
              ) : emailStep === 2 ? (
                <>
                  <Text style={styles.editorTitle}>Masukkan Email Baru</Text>
                  <Text style={styles.descriptionText}>Pastikan alamat email baru aktif dan bisa diakses.</Text>
                  <TextInput style={styles.input} value={newEmail} onChangeText={setNewEmail} placeholder="Email Baru" keyboardType="email-address" autoCapitalize="none" />
                  <TouchableOpacity style={styles.saveBtn} onPress={handleRequestNewEmailOtp}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Kirim OTP ke Email Baru</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.editorTitle}>Verifikasi Email Baru</Text>
                  <Text style={styles.descriptionText}>Kode OTP telah dikirim ke {newEmail}</Text>
                  <TextInput style={styles.input} value={otpNewEmail} onChangeText={setOtpNewEmail} placeholder="Masukkan 6-Digit OTP Baru" keyboardType="numeric" />
                  <TouchableOpacity style={styles.saveBtn} onPress={handleVerifyNewEmail}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Simpan Email</Text>}
                  </TouchableOpacity>
                </>
              )
            ) : activeEditField === 'password' ? (
              <>
                <Text style={styles.editorTitle}>Buat Password Baru</Text>
                <TextInput style={styles.input} value={otpPassword} onChangeText={setOtpPassword} placeholder="Kode OTP dari Email" keyboardType="numeric" />
                <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder="Password Baru" secureTextEntry />
                <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Konfirmasi Password Baru" secureTextEntry />
                <TouchableOpacity style={styles.saveBtn} onPress={handleVerifyPassword}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Simpan Password</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.editorTitle}>Update {activeEditField.replace('_', ' ').toUpperCase()}</Text>
                <TextInput 
                  style={styles.input} value={inputValue} onChangeText={setInputValue} 
                  placeholder={activeEditField === 'gender' ? 'PRIA / WANITA' : activeEditField === 'birth_date' ? 'DD/MM/YYYY' : `Masukkan data baru`} 
                />
                <TouchableOpacity style={styles.saveBtn} onPress={() => handleUpdateGeneral(activeEditField)}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Simpan</Text>}
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setActiveEditField(null); setEmailStep(0); }} disabled={loading}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            {renderField('Nama Lengkap', userData.full_name, 'full_name')}
            {renderField('Username', userData.username, 'username')}
            {renderField('Jenis Kelamin', userData.gender, 'gender')}
            {renderField('Tanggal Lahir', userData.birth_date, 'birth_date')}
            {renderField('Nomor Ponsel', userData.phone_number, 'phone_number')}
            {renderField('Email', userData.email, 'email')}
            
            <View style={styles.fieldContainer}>
              <View>
                <Text style={styles.label}>Keamanan</Text>
                <Text style={styles.value}>Password Akun</Text>
              </View>
              <TouchableOpacity onPress={handleRequestPassword}>
                {loading && activeEditField === 'password' ? <ActivityIndicator size="small" color="#007AFF" /> : <Text style={styles.editBtnText}>Ganti</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  avatarSection: { alignItems: 'center', marginVertical: 24 },
  changePhotoBtn: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#E5E5EA', borderRadius: 20 },
  changePhotoText: { color: '#007AFF', fontWeight: '600' },
  card: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', marginHorizontal: 4, marginBottom: 20 },
  fieldContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  label: { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  value: { fontSize: 16, color: '#1C1C1E', fontWeight: '500' },
  editBtnText: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
  editorCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, marginHorizontal: 4, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  editorTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1C1C1E' },
  descriptionText: { marginBottom: 12, color: '#8E8E93', fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#C7C7CC', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16, backgroundColor: '#FAFAFA' },
  saveBtn: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelBtnText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
});