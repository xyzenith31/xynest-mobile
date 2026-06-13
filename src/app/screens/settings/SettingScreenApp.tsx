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
import { useAppearance } from '@/utils/tools/AppearanceApp'; 
import { useLanguage } from '@/utils/tools/LanguageApp';     

interface SettingItemProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  textColor: string;      
  dividerColor: string;   
  isDarkMode: boolean;
  onPress?: () => void;
  isDestructive?: boolean;
  hideDivider?: boolean;
}

const SettingItem = memo(({ title, icon, iconColor = '#007AFF', textColor, dividerColor, isDarkMode, onPress, isDestructive = false, hideDivider = false }: SettingItemProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => { 
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true, speed: 30 }),
      Animated.timing(opacityAnim, { toValue: 0.8, duration: 80, useNativeDriver: true })
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const bgIconCalculated = isDestructive 
    ? (isDarkMode ? 'rgba(255, 69, 58, 0.15)' : '#FFEBEA') 
    : `${iconColor}15`;

  const colorIconCalculated = isDestructive 
    ? (isDarkMode ? '#FF453A' : '#FF3B30') 
    : iconColor;

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
          <View style={[styles.iconBox, { backgroundColor: bgIconCalculated }]}>
            <Ionicons name={icon} size={20} color={colorIconCalculated} />
          </View>
          <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.settingText, { color: textColor }, isDestructive && { color: colorIconCalculated, fontWeight: '600' }]}>{title}</Text>
        </View>
        {!isDestructive && <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />}
      </Animated.View>
      {!hideDivider && <View style={[styles.divider, { backgroundColor: dividerColor }]} />}
    </Pressable>
  );
});

export default function SettingScreenApp() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [showSuccessLogout, setShowSuccessLogout] = useState(false);
  const { theme, isDarkMode } = useAppearance();
  const { t_setting: t } = useLanguage();

  useEffect(() => {
    const fetchUser = async () => {
      const data = await authDb.getUserData();
      if (data) setUserData(data);
    };
    fetchUser();
  }, []);

  const executeLogout = useCallback(() => {
    setShowConfirmLogout(false);
    setLoading(true);
    
    setTimeout(async () => {
      try {
        await UserService.logout();
      } catch (err) {
        console.error("Gagal logout:", err);
      } finally {
        await authDb.clearSession();
        setLoading(false);
        setTimeout(() => setShowSuccessLogout(true), 150);
      }
    }, 400);
  }, []);

  const finishLogout = useCallback(() => {
    setShowSuccessLogout(false);
    setTimeout(() => {
      router.replace('/screens/auth/LoginScreenApp');
    }, 200);
  }, [router]);

  const confirmButtons: NotificationButton[] = [
    { text: t.btn_cancel, style: "cancel", onPress: () => setShowConfirmLogout(false) },
    { text: t.btn_ok, style: "danger", onPress: executeLogout }
  ];

  const successButtons: NotificationButton[] = [
    { text: t.btn_ok, style: "default", onPress: finishLogout }
  ];

  return (
    <AppLayout title={t.title} scrollable={false}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.bg }]}
      >
        <View style={styles.profileSection}>
          <Avatar 
            url={userData?.profiles} 
            name={userData?.full_name || t.fallback_name} 
            size={96} 
          />
          <Text style={[styles.fullNameText, { color: theme.text }]}>{userData?.full_name || t.fallback_fullname}</Text>
          <Text style={[styles.usernameText, { color: theme.subText }]}>{userData?.username || 'username'}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.subText }]}>{t.sec_account}</Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingItem title={t.item_account} icon="person-outline" iconColor="#007AFF" textColor={theme.text} dividerColor={theme.border} isDarkMode={isDarkMode} onPress={() => router.push('/screens/settings/AccountScreenApp')} />
          <SettingItem title={t.item_privacy} icon="lock-closed-outline" iconColor="#34C759" textColor={theme.text} dividerColor={theme.border} isDarkMode={isDarkMode} onPress={() => router.push('/screens/other/NotFoundScreenApp')} />
          <SettingItem title={t.item_device} icon="hardware-chip-outline" iconColor="#8E8E93" textColor={theme.text} dividerColor={theme.border} isDarkMode={isDarkMode} onPress={() => router.push('/screens/settings/DeviceManagerScreenApp')} hideDivider />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.subText }]}>{t.sec_pref}</Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingItem title={t.item_appearance} icon="color-palette-outline" iconColor="#AF52DE" textColor={theme.text} dividerColor={theme.border} isDarkMode={isDarkMode} onPress={() => router.push('/screens/settings/AppearanceScreenApp')} />
          <SettingItem title={t.item_notif} icon="notifications-outline" iconColor="#FF9500" textColor={theme.text} dividerColor={theme.border} isDarkMode={isDarkMode} onPress={() => router.push('/screens/other/NotFoundScreenApp')} />
          <SettingItem title={t.item_storage} icon="server-outline" iconColor="#5856D6" textColor={theme.text} dividerColor={theme.border} isDarkMode={isDarkMode} onPress={() => router.push('/screens/other/NotFoundScreenApp')} />
          <SettingItem title={t.item_lang} icon="language-outline" iconColor="#32ADE6" textColor={theme.text} dividerColor={theme.border} isDarkMode={isDarkMode} onPress={() => router.push('/screens/settings/LanguageScreenApp')} hideDivider />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.subText }]}>{t.sec_other}</Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingItem title={t.item_access} icon="accessibility-outline" iconColor="#00C7BE" textColor={theme.text} dividerColor={theme.border} isDarkMode={isDarkMode} onPress={() => router.push('/screens/other/NotFoundScreenApp')} />
          <SettingItem title={t.item_donate} icon="heart-outline" iconColor="#FF2D55" textColor={theme.text} dividerColor={theme.border} isDarkMode={isDarkMode} onPress={() => router.push('/screens/settings/DonationScreenApp')} hideDivider />
        </View>

        <View style={[styles.sectionCard, styles.logoutCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingItem 
            title={t.item_logout} 
            icon="log-out-outline" 
            textColor={theme.text}
            dividerColor={theme.border}
            isDestructive={true} 
            hideDivider={true}
            isDarkMode={isDarkMode}
            onPress={() => setShowConfirmLogout(true)} 
          />
        </View>
      </ScrollView>

      <LoadingSpinnerApp visible={loading} />

      <NotificationInteractiveApp
        visible={showConfirmLogout}
        title={t.logout_confirm_title}
        message={t.logout_confirm_msg}
        type="warning"
        buttons={confirmButtons}
        onDismiss={() => setShowConfirmLogout(false)}
      />

      <NotificationInteractiveApp
        visible={showSuccessLogout}
        title={t.logout_success_title}
        message={t.logout_success_msg}
        type="success"
        buttons={successButtons}
      />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent:{paddingTop:12, paddingBottom:40, paddingHorizontal:16}, 
  profileSection:{alignItems:'center',marginTop:10,marginBottom:28}, 
  fullNameText:{fontSize:22,fontWeight:'700',marginTop:16,letterSpacing:-0.5},
  usernameText:{fontSize:15,marginTop:4},
  sectionTitle:{fontSize:11,fontWeight:'700',textTransform:'uppercase',letterSpacing:0.8,marginBottom:10,marginLeft:8,marginTop:12},
  sectionCard:{borderRadius:20,borderWidth:1,overflow:'hidden',marginBottom:16,paddingHorizontal:4},
  logoutCard:{marginTop:12,marginBottom:0},
  settingItem:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:14,paddingHorizontal:12},
  settingItemLeft:{flexDirection:'row',alignItems:'center',flex:1},
  iconBox:{width:36,height:36,borderRadius:10,justifyContent:'center',alignItems:'center',marginRight:14},
  settingText:{fontSize:15,fontWeight:'500',flex:1,flexShrink:1,marginRight:8},
  divider:{height:StyleSheet.hairlineWidth,marginLeft:62}
});