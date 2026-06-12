// src/app/screens/settings/SettingScreenApp.tsx
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { StyleSheet, Text, View, Animated, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authDb, UserSession } from '@/databases/AuthDatabase';
import { UserService } from '@/services/UserService';
import AppLayout from '../../layouts/AppLayout';
import LoadingSpinnerApp from '@/components/ui/LoadingSpinnerApp';
import NotificationInteractiveApp, { NotificationButton } from '@/components/ui/NotificationInteractiveApp';
import { Avatar } from '@/components/ux/Avatar';

interface SettingItemProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress?: () => void;
  isDestructive?: boolean;
  hideDivider?: boolean;
}

const SettingItem = memo(({ title, icon, iconColor = '#007AFF', onPress, isDestructive = false, hideDivider = false }: SettingItemProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => { 
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 20 }),
      Animated.timing(opacityAnim, { toValue: 0.7, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true })
    ]).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={[
        styles.settingItem,
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim }
      ]}>
        <View style={styles.settingItemLeft}>
          <View style={[styles.iconBox, { backgroundColor: isDestructive ? '#FFEBEA' : `${iconColor}15` }]}>
            <Ionicons name={icon} size={20} color={isDestructive ? '#FF3B30' : iconColor} />
          </View>
          <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.settingText, isDestructive && styles.destructiveText]}>{title}</Text>
        </View>
        {!isDestructive && <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />}
      </Animated.View>
      {!hideDivider && <View style={styles.divider} />}
    </Pressable>
  );
});

export default function SettingScreenApp() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [showSuccessLogout, setShowSuccessLogout] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const data = await authDb.getUserData();
      if (data) setUserData(data);
    };
    fetchUser();
  }, []);

  const executeLogout = useCallback(() => {
    setShowConfirmLogout(false);
    
    setTimeout(async () => {
      setLoading(true);
      try {
        await UserService.logout();
      } catch (err) {
        console.error("Gagal logout:", err);
      } finally {
        await authDb.clearSession();
        setLoading(false);
        setTimeout(() => setShowSuccessLogout(true), 300);
      }
    }, 300);
  }, []);

  const finishLogout = useCallback(() => {
    setShowSuccessLogout(false);
    setTimeout(() => {
      router.replace('/screens/auth/LoginScreenApp');
    }, 300);
  }, [router]);

  const confirmButtons: NotificationButton[] = [
    { text: "Batal", style: "cancel", onPress: () => setShowConfirmLogout(false) },
    { text: "Oke", style: "danger", onPress: executeLogout }
  ];

  const successButtons: NotificationButton[] = [
    { text: "Oke", style: "default", onPress: finishLogout }
  ];

  return (
    <AppLayout title="Pengaturan" scrollable={false}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileSection}>
          <Avatar 
            url={userData?.profiles} 
            name={userData?.full_name || 'Pengguna'} 
            size={96} 
          />
          <Text style={styles.fullNameText}>{userData?.full_name || 'Nama Lengkap'}</Text>
          <Text style={styles.usernameText}>{userData?.username || 'username'}</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Akun & Keamanan</Text>
          <SettingItem title="Account / Profil" icon="person-outline" iconColor="#007AFF" onPress={() => router.push('/screens/settings/AccountScreenApp')} />
          <SettingItem title="Privacy" icon="lock-closed-outline" iconColor="#34C759" />
          <SettingItem title="Device Management" icon="hardware-chip-outline" iconColor="#8E8E93" onPress={() => router.push('/screens/settings/DeviceManagerScreenApp')} hideDivider />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Preferensi</Text>
          <SettingItem 
            title="Appearance" 
            icon="color-palette-outline" 
            iconColor="#AF52DE" 
            onPress={() => router.push('/screens/settings/AppearanceScreenApp')} 
          />
          <SettingItem title="Notification" icon="notifications-outline" iconColor="#FF9500" />
          <SettingItem title="Storage & Data" icon="server-outline" iconColor="#5856D6" />
          
          {/* ROUTING LANGUAGE DITAMBAHKAN DI SINI BRO 👇 */}
          <SettingItem 
            title="Language" 
            icon="language-outline" 
            iconColor="#32ADE6" 
            onPress={() => router.push('/screens/settings/LanguageScreenApp')}
            hideDivider 
          />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Lainnya</Text>
          <SettingItem title="Accessibility" icon="accessibility-outline" iconColor="#00C7BE" />
          <SettingItem title="Donation" icon="heart-outline" iconColor="#FF2D55" onPress={() => router.push('/screens/settings/DonationScreenApp')} hideDivider />
        </View>

        <View style={styles.logoutContainer}>
          <SettingItem 
            title="Keluar Sesi (Logout)" 
            icon="log-out-outline" 
            isDestructive={true} 
            hideDivider={true}
            onPress={() => setShowConfirmLogout(true)} 
          />
        </View>
      </ScrollView>

      <LoadingSpinnerApp visible={loading} />

      <NotificationInteractiveApp
        visible={showConfirmLogout}
        title="Konfirmasi Logout"
        message="Apakah Anda yakin ingin keluar dari akun Anda? Anda harus login kembali untuk masuk."
        type="warning"
        buttons={confirmButtons}
        onDismiss={() => setShowConfirmLogout(false)}
      />

      <NotificationInteractiveApp
        visible={showSuccessLogout}
        title="Berhasil Logout"
        message="Anda telah berhasil keluar dari sistem dengan aman."
        type="success"
        buttons={successButtons}
      />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent:{paddingTop:20, paddingBottom:40,backgroundColor:'#FAFAFC'}, // Tambah paddingTop 20 biar gak mepet
  profileSection:{alignItems:'center',marginTop:10,marginBottom:36}, // margin top dikurangi karena udah ada paddingTop di atas
  fullNameText:{fontSize:22,fontWeight:'700',color:'#1C1C1E',marginTop:16,letterSpacing:-0.5},
  usernameText:{fontSize:15,color:'#8E8E93',marginTop:4},
  sectionContainer:{marginBottom:24,paddingHorizontal:16},
  sectionTitle:{fontSize:13,fontWeight:'600',color:'#8E8E93',textTransform:'uppercase',letterSpacing:0.5,marginBottom:8,marginLeft:4},
  settingItem:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:14,paddingHorizontal:8},
  settingItemLeft:{flexDirection:'row',alignItems:'center',flex:1},
  iconBox:{width:38,height:38,borderRadius:12,justifyContent:'center',alignItems:'center',marginRight:16},
  settingText:{fontSize:16,color:'#1C1C1E',fontWeight:'500',flex:1,flexShrink:1,marginRight:8},
  destructiveText:{color:'#FF3B30',fontWeight:'600'},
  divider:{height:StyleSheet.hairlineWidth,backgroundColor:'#E5E5EA',marginLeft:62},
  logoutContainer:{marginTop:10,paddingHorizontal:16}
});