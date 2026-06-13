import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Modal, Platform, Pressable, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserService } from '../../../services/auth/UserService';
import { authDb } from '../../../databases/AuthDatabase';
import { Avatar } from '../../../components/ux/Avatar';
import LoadingSpinnerApp from '../../../components/ui/LoadingSpinnerApp';
import NotificationInteractive, { NotificationType } from '../../../components/ui/NotificationInteractiveApp';
import { useAppearance } from '../../../utils/tools/AppearanceApp';
import { useLanguage } from '../../../utils/tools/LanguageApp';
import KeyboardFocus from '../../../utils/tools/KeyboardFocus';

const { width, height } = Dimensions.get('window');

export default function AccountScreenApp() {
  const router = useRouter();
  const { theme, accentColor, isDarkMode } = useAppearance();
  const { t_account: dict } = useLanguage(); 
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
  const [notifVisible, setNotifVisible] = useState(false);
  const [userData, setUserData] = useState({
    full_name: '', username: '', phone_number: '', email: '', gender: '', birth_date: '', profileUrl: null as string | null
  });
  const [notifConfig, setNotifConfig] = useState<{
    title: string;
    message: string;
    type: NotificationType;
    onOk?: () => void;
  }>({ title: '', message: '', type: 'info' });

  const showNotif = (title: string, message: string, type: NotificationType = 'info', onOk?: () => void) => {
    setNotifConfig({ title, message, type, onOk });
    setNotifVisible(true);
  };

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
        showNotif(dict.success, dict.profilePicUpdated, 'success');
      } else {
        showNotif(dict.failed, res.error || dict.uploadError, 'error');
      }
    }
  };

  const handleDeleteImage = async () => {
    setLoading(true);
    const res = await UserService.updateProfile({ profile_base64: '' });
    setLoading(false);
    if (res.success) {
      setUserData({ ...userData, profileUrl: null });
      showNotif(dict.success, dict.profilePicDeleted, 'success');
    } else {
      showNotif(dict.failed, res.error || dict.deleteError, 'error');
    }
  };

  const handleUpdateGeneral = async (field: string) => {
    if (!inputValue.trim()) return showNotif(dict.warning, dict.inputEmpty, 'warning');
    setLoading(true);
    const res = await UserService.updateProfile({ [field]: inputValue });
    setLoading(false);
    if (res.success) {
      setUserData({ ...userData, [field]: inputValue });
      setActiveEditField(null);
      showNotif(dict.success, dict.dataUpdated, 'success');
    } else {
      showNotif(dict.failed, res.error || dict.errorOccurred, 'error');
    }
  };

  const handleStartEmailChange = async () => {
    setLoading(true);
    const res = await UserService.requestOldEmailOtp();
    setLoading(false);
    if (res.success) {
      showNotif(dict.codeSent, dict.otpOldEmailSent, 'info', () => {
        setEmailStep(1);
        setOtpOldEmail(''); setNewEmail(''); setOtpNewEmail('');
        setActiveEditField('email');
      });
    } else { showNotif(dict.failed, res.error, 'error'); }
  };

  const handleRequestNewEmailOtp = async () => {
    if (!newEmail.trim()) return showNotif(dict.warning, dict.enterNewEmail, 'warning');
    setLoading(true);
    const res = await UserService.verifyOldAndRequestNewEmail(otpOldEmail, newEmail);
    setLoading(false);
    if (res.success) {
      showNotif(dict.codeSent, dict.otpNewEmailSent, 'success', () => {
        setEmailStep(3);
      });
    } else { showNotif(dict.failed, res.error, 'error'); }
  };

  const handleVerifyNewEmail = async () => {
    if (!otpNewEmail.trim()) return showNotif(dict.warning, dict.enterNewOtp, 'warning');
    setLoading(true);
    const res = await UserService.verifyNewEmailOtp(otpNewEmail);
    setLoading(false);
    if (res.success) {
      setUserData({ ...userData, email: newEmail });
      setActiveEditField(null);
      setEmailStep(0);
      showNotif(dict.success, dict.emailUpdated, 'success');
    } else { showNotif(dict.failed, res.error, 'error'); }
  };

  const handleRequestPassword = async () => {
    setLoading(true);
    const res = await UserService.requestPasswordChange();
    setLoading(false);
    if (res.success) {
      showNotif(dict.codeSent, dict.otpPasswordSent, 'info', () => {
        setActiveEditField('password');
        setOtpPassword(''); setNewPassword(''); setConfirmPassword('');
      });
    } else { showNotif(dict.failed, res.error, 'error'); }
  };

  const handleVerifyPassword = async () => {
    if (newPassword !== confirmPassword) return showNotif(dict.warning, dict.passwordMismatch, 'warning');
    if (!otpPassword || !newPassword) return showNotif(dict.warning, dict.fillAllFields, 'warning');
    
    setLoading(true);
    const res = await UserService.verifyPasswordChange(otpPassword, newPassword);
    setLoading(false);
    if (res.success) {
      setActiveEditField(null);
      showNotif(dict.success, dict.passwordUpdated, 'success');
    } else { showNotif(dict.failed, res.error, 'error'); }
  };

  const getIconForField = (fieldKey: string) => {
    switch (fieldKey) {
      case 'full_name': return 'person-outline';
      case 'username': return 'at-circle-outline';
      case 'gender': return 'male-female-outline';
      case 'birth_date': return 'calendar-outline';
      case 'phone_number': return 'call-outline';
      case 'email': return 'mail-outline';
      default: return 'create-outline';
    }
  };

  const renderField = (label: string, value: string, fieldKey: string) => (
    <TouchableOpacity 
      style={[styles.fieldCard, { backgroundColor: theme.surface }]} 
      activeOpacity={0.7}
      onPress={() => {
        if (fieldKey === 'email') {
          handleStartEmailChange();
        } else {
          setInputValue(value);
          setActiveEditField(fieldKey);
        }
      }}
    >
      <View style={[styles.fieldIconContainer, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F4F4F8' }]}>
        <Ionicons name={getIconForField(fieldKey) as any} size={20} color={accentColor} />
      </View>
      <View style={styles.fieldTextContainer}>
        <Text style={[styles.label, { color: '#8E8E93' }]}>{label}</Text>
        <Text style={[styles.value, { color: theme.text }]} numberOfLines={1}>{value || '-'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={isDarkMode ? '#636366' : '#C7C7CC'} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.5 : 1 }]}>
          <Ionicons name="arrow-back" size={24} color={accentColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{dict.myAccount}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={[styles.avatarWrapper, { backgroundColor: theme.surface }]}>
            <Avatar url={userData.profileUrl} name={userData.full_name || userData.username} size={100} />
          </View>
          <View style={styles.avatarActionRow}>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDarkMode ? '#233924' : '#E8F5E9' }]} onPress={handlePickImage} disabled={loading}>
              <Ionicons name="camera" size={20} color="#4CAF50" />
            </TouchableOpacity>
            {userData.profileUrl && (
              <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDarkMode ? '#3D2424' : '#FFEBEE' }]} onPress={handleDeleteImage} disabled={loading}>
                <Ionicons name="trash" size={20} color="#F44336" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.listContainer}>
          {renderField(dict.fullName, userData.full_name, 'full_name')}
          {renderField(dict.username, userData.username, 'username')}
          {renderField(dict.gender, userData.gender, 'gender')}
          {renderField(dict.birthDate, userData.birth_date, 'birth_date')}
          {renderField(dict.phone, userData.phone_number, 'phone_number')}
          {renderField(dict.email, userData.email, 'email')}
          
          <TouchableOpacity 
             style={[styles.fieldCard, { backgroundColor: theme.surface, marginTop: 10 }]} 
             activeOpacity={0.7} 
             onPress={handleRequestPassword}
          >
            <View style={[styles.fieldIconContainer, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F4F4F8' }]}>
              <Ionicons name="lock-closed-outline" size={20} color={accentColor} />
            </View>
            <View style={styles.fieldTextContainer}>
              <Text style={[styles.label, { color: '#8E8E93' }]}>{dict.security}</Text>
              <Text style={[styles.value, { color: theme.text }]}>{dict.changePassword}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDarkMode ? '#636366' : '#C7C7CC'} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={!!activeEditField} transparent animationType="fade" statusBarTranslucent={true} onRequestClose={() => { setActiveEditField(null); setEmailStep(0); }}>
        <KeyboardFocus style={styles.modalOverlay}>
          <View style={[styles.floatingCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <TouchableOpacity onPress={() => { setActiveEditField(null); setEmailStep(0); }} style={styles.closeModalBtn}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {activeEditField === 'email' ? dict.changeEmail : 
                 activeEditField === 'password' ? dict.changePassword : 
                 `${dict.change} ${activeEditField?.replace('_', ' ')}`}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              {activeEditField === 'email' ? (
                emailStep === 1 ? (
                  <>
                    <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#1C2C3A' : '#F0F8FF' }]}>
                      <Ionicons name="information-circle-outline" size={20} color={accentColor} style={{ marginRight: 8 }}/>
                      <Text style={[styles.infoText, { color: accentColor }]}>{dict.otpAutoOldEmail}</Text>
                    </View>
                    <TextInput 
                       style={[styles.input, { borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }]} 
                       value={otpOldEmail} onChangeText={setOtpOldEmail} placeholder={dict.otpOldEmailPlaceholder} placeholderTextColor="#8E8E93" keyboardType="numeric" maxLength={6} 
                    />
                    <TouchableOpacity style={[styles.saveBtn, { backgroundColor: accentColor }]} onPress={() => {
                      if (!otpOldEmail) return showNotif(dict.warning, dict.otpEmptyWarning, 'warning');
                      setEmailStep(2);
                    }}>
                      <Text style={styles.saveBtnText}>{dict.next}</Text>
                    </TouchableOpacity>
                  </>
                ) : emailStep === 2 ? (
                  <>
                    <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#1C2C3A' : '#F0F8FF' }]}>
                      <Ionicons name="mail-unread-outline" size={20} color={accentColor} style={{ marginRight: 8 }}/>
                      <Text style={[styles.infoText, { color: accentColor }]}>{dict.ensureActiveEmail}</Text>
                    </View>
                    <TextInput 
                       style={[styles.input, { borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }]} 
                       value={newEmail} onChangeText={setNewEmail} placeholder={dict.newEmailPlaceholder} placeholderTextColor="#8E8E93" keyboardType="email-address" autoCapitalize="none" 
                    />
                    <TouchableOpacity style={[styles.saveBtn, { backgroundColor: accentColor }]} onPress={handleRequestNewEmailOtp}>
                      <Text style={styles.saveBtnText}>{dict.sendOtpNewEmail}</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#1C2C3A' : '#F0F8FF' }]}>
                      <Ionicons name="checkmark-done-circle-outline" size={20} color={accentColor} style={{ marginRight: 8 }}/>
                      <Text style={[styles.infoText, { color: accentColor }]}>{dict.otpSentTo}{newEmail}</Text>
                    </View>
                    <TextInput 
                       style={[styles.input, { borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }]} 
                       value={otpNewEmail} onChangeText={setOtpNewEmail} placeholder={dict.otpNewEmailPlaceholder} placeholderTextColor="#8E8E93" keyboardType="numeric" maxLength={6} 
                    />
                    <TouchableOpacity style={[styles.saveBtn, { backgroundColor: accentColor }]} onPress={handleVerifyNewEmail}>
                      <Text style={styles.saveBtnText}>{dict.saveNewEmail}</Text>
                    </TouchableOpacity>
                  </>
                )
              ) : activeEditField === 'password' ? (
                <>
                  <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#1C2C3A' : '#F0F8FF' }]}>
                    <Ionicons name="key-outline" size={20} color={accentColor} style={{ marginRight: 8 }}/>
                    <Text style={[styles.infoText, { color: accentColor }]}>{dict.enterOtpAndNewPassword}</Text>
                  </View>
                  <TextInput 
                     style={[styles.input, { borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }]} 
                     value={otpPassword} onChangeText={setOtpPassword} placeholder={dict.otpFromEmail} placeholderTextColor="#8E8E93" keyboardType="numeric" maxLength={6} 
                  />
                  <TextInput 
                     style={[styles.input, { borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }]} 
                     value={newPassword} onChangeText={setNewPassword} placeholder={dict.newPassword} placeholderTextColor="#8E8E93" secureTextEntry 
                  />
                  <TextInput 
                     style={[styles.input, { borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }]} 
                     value={confirmPassword} onChangeText={setConfirmPassword} placeholder={dict.confirmNewPassword} placeholderTextColor="#8E8E93" secureTextEntry 
                  />
                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: accentColor }]} onPress={handleVerifyPassword}>
                    <Text style={styles.saveBtnText}>{dict.savePassword}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TextInput 
                    style={[styles.input, { borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }]} 
                    value={inputValue} onChangeText={setInputValue} 
                    placeholder={activeEditField === 'gender' ? dict.maleFemale : activeEditField === 'birth_date' ? dict.dateFormat : dict.enterNewData} 
                    placeholderTextColor="#8E8E93"
                    autoCapitalize={activeEditField === 'full_name' ? 'words' : 'none'}
                  />
                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: accentColor }]} onPress={() => handleUpdateGeneral(activeEditField!)}>
                    <Text style={styles.saveBtnText}>{dict.saveChanges}</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardFocus>
      </Modal>

      <LoadingSpinnerApp visible={loading} />
      
      <NotificationInteractive 
        visible={notifVisible} 
        title={notifConfig.title} 
        message={notifConfig.message} 
        type={notifConfig.type} 
        buttons={[{ 
          text: 'OK', 
          onPress: () => {
            setNotifVisible(false);
            if (notifConfig.onOk) notifConfig.onOk();
          } 
        }]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 12, paddingHorizontal: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContainer: { paddingBottom: 50, paddingTop: 10 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarWrapper: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8, borderRadius: 100, padding: 4 },
  avatarActionRow: { flexDirection: 'row', gap: 14, marginTop: -20, zIndex: 10 },
  iconButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderWidth: 2, borderColor: '#FFF' },
  listContainer: { paddingHorizontal: 20 },
  fieldCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  fieldIconContainer: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  fieldTextContainer: { flex: 1 },
  label: { fontSize: 11, marginBottom: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  value: { fontSize: 15, fontWeight: '500' },
  modalOverlay: {  width: width, height: height, backgroundColor: 'rgba(0,0,0,0.5)',  justifyContent: 'center',  alignItems: 'center', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, },
  floatingCard: { width: '85%', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  closeModalBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  modalTitle: { fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  modalBody: { padding: 24 },
  infoBox: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 20 },
  infoText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 20 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 16 },
  saveBtn: { paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
});