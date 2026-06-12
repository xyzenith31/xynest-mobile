import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BluetoothStateManager } from 'react-native-bluetooth-state-manager';
import type { BluetoothState } from 'react-native-bluetooth-state-manager';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import NetInfo from '@react-native-community/netinfo';
import { DeviceService } from '@/services/DeviceService';
import { UserService } from '@/services/UserService';
import { BannedService } from '@/services/admin/BannedService';
import { authDb } from '@/databases/AuthDatabase';
import NotificationInteractive, { NotificationButton } from '@/components/ui/NotificationInteractiveApp';
import LoadingSpinnerApp from '@/components/ui/LoadingSpinnerApp';
import InputApp from '@/components/ui/InputApp';
import { Avatar } from '@/components/ux/Avatar';
import { useAppearance } from '@/utils/tools/AppearanceApp'; 
import { useLanguage } from '@/utils/tools/LanguageApp';   
import { 
  StyleSheet, View, Text, ScrollView, StatusBar, AppState, 
  Modal, TouchableOpacity, BackHandler, Animated, 
  PanResponder, Dimensions, Easing, TouchableWithoutFeedback,
  Platform 
} from 'react-native';  

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  scrollable?: boolean;
}

export default function AppLayout({ children, title, scrollable = true }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode, accentColor } = useAppearance();
  const { t_appLayout: t } = useLanguage();
  const [isAppLoading, setIsAppLoading] = useState(false); 
  const isCheckingRef = useRef(false);
  const lastNotifiedStatusRef = useRef('ACTIVE'); 
  const isConnectedRef = useRef(true); 
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [banNotifyVisible, setBanNotifyVisible] = useState(false);
  const [banNotifyConfig, setBanNotifyConfig] = useState({ title: '', message: '', buttons: [] as NotificationButton[] });
  const [appealVisible, setAppealVisible] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealText, setAppealText] = useState('');
  const [userData, setUserData] = useState({ full_name: '', profileUrl: null as string | null });
  const panX = useRef(new Animated.Value(0)).current;
  const isDrawerOpen = useRef(false);
  const pullAnim = useRef(new Animated.Value(0)).current;
  const [network, setNetwork] = useState({ isConnected: true, name: t?.hw_detecting || 'Mendeteksi...' });
  const [pingMs, setPingMs] = useState<number>(0);
  const [locationOn, setLocationOn] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [bluetoothOn, setBluetoothOn] = useState(true);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pullAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pullAnim, { toValue: 0, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, [pullAnim]);

  const handleForceLogout = async () => {
    await authDb.clearSession();
    router.replace('/screens/auth/LoginScreenApp');
  };

  const triggerBanNotification = (reason: string, status: string) => {
    const isPending = status === 'PENDING';
    setBanNotifyConfig({
      title: isPending ? t?.ban_pending_title : t?.ban_title,
      message: isPending ? `${t?.ban_pending_msg}"${reason}"` : `${t?.ban_msg}"${reason}"`,
      buttons: isPending ? [
        { text: t?.btn_exit, style: 'cancel', onPress: () => BackHandler.exitApp() },
        { text: t?.btn_logout, style: 'default', onPress: () => { setBanNotifyVisible(false); handleForceLogout(); } }
      ] : [
        { text: t?.btn_appeal, style: 'default', onPress: () => { setBanNotifyVisible(false); setAppealVisible(true); } }
      ]
    });
    setBanNotifyVisible(true);
  };

  const handleAppealSubmit = async () => {
    const email = currentUser?.email || currentUser?.user?.email;
    const username = currentUser?.username || currentUser?.user?.user_metadata?.username;
    const identifier = email || username;

    if (!identifier) {
      setBanNotifyConfig({
        title: t?.err_session_title,
        message: t?.err_session_msg,
        buttons: [{ text: t?.btn_logout, style: 'danger', onPress: () => { setBanNotifyVisible(false); handleForceLogout(); } }]
      });
      setBanNotifyVisible(true);
      return;
    }
    
    if (!appealReason || !appealText) {
      setBanNotifyConfig({
        title: t?.warn_title,
        message: t?.warn_msg,
        buttons: [{ text: t?.btn_understand, style: 'default', onPress: () => setBanNotifyVisible(false) }]
      });
      setBanNotifyVisible(true);
      return;
    }

    setIsAppLoading(true);
    const res = await BannedService.submitAppeal(identifier, appealReason, appealText);
    setIsAppLoading(false);
    
    if (res.success) {
      lastNotifiedStatusRef.current = 'PENDING';
      setAppealVisible(false);
      setBanNotifyConfig({
        title: t?.success_title,
        message: t?.success_msg,
        buttons: [
          { text: t?.btn_ok, style: 'default', onPress: () => {
              setBanNotifyVisible(false);
              setTimeout(() => { triggerBanNotification(appealReason, 'PENDING'); }, 350);
          }}
        ]
      });
      setBanNotifyVisible(true);
    } else {
      setBanNotifyConfig({
        title: t?.fail_title,
        message: res.error || 'Internal Error',
        buttons: [{ text: t?.btn_retry, style: 'danger', onPress: () => setBanNotifyVisible(false) }]
      });
      setBanNotifyVisible(true);
    }
  };

  const openDrawer = () => {
    Animated.timing(panX, {
      toValue: DRAWER_WIDTH,
      duration: 300,
      easing: Easing.out(Easing.bezier(0.25, 1, 0.5, 1)), 
      useNativeDriver: true,
    }).start();
    isDrawerOpen.current = true;
  };

  const closeDrawer = () => {
    Animated.timing(panX, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.bezier(0.25, 1, 0.5, 1)),
      useNativeDriver: true,
    }).start();
    isDrawerOpen.current = false;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (!isDrawerOpen.current && gestureState.x0 > 40) {
          return false;
        }
        return Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        let newX = isDrawerOpen.current ? DRAWER_WIDTH + gestureState.dx : gestureState.dx;
        if (newX < 0) newX = 0;
        if (newX > DRAWER_WIDTH) newX = DRAWER_WIDTH;
        panX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SCREEN_WIDTH * 0.15 || gestureState.vx > 0.5) {
          openDrawer();
        } else if (gestureState.dx < -SCREEN_WIDTH * 0.15 || gestureState.vx < -0.5) {
          closeDrawer();
        } else {
          if (isDrawerOpen.current) openDrawer();
          else closeDrawer();
        }
      },
    })
  ).current;

  useEffect(() => {
    let isMounted = true;
    const initializeAuthAndProfile = async () => {
      const cachedData = await authDb.getUserData();
      if (cachedData && isMounted) {
        setUserData({ full_name: cachedData.full_name ?? '', profileUrl: cachedData.profiles ?? null });
      }
      setTimeout(async () => {
        const user = await authDb.getSession(); 
        if (isMounted) setCurrentUser(user);
        const result = await UserService.getProfile();
        if (result.success && result.data && isMounted) {
          setUserData({ full_name: result.data.full_name ?? '', profileUrl: result.data.profiles ?? null });
        }
      }, 400);
    };
    initializeAuthAndProfile();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let banInterval: ReturnType<typeof setInterval>;
    const timer = setTimeout(() => {
      const checkUserStatusAndSession = async () => {
        if (isCheckingRef.current) return; 
        const token = await authDb.getToken();
        if (!token) return;
        isCheckingRef.current = true;
        try {
          const sessionStatus = await DeviceService.checkSessionValidity();
          if (sessionStatus === false && isMounted) {
            await handleForceLogout();
            return;
          }
          const userStatusRes = await UserService.checkStatus();
          if (userStatusRes.success && isMounted) {
            if (userStatusRes.status === 'BANNED' || userStatusRes.status === 'PENDING') {
              if (lastNotifiedStatusRef.current !== userStatusRes.status) {
                lastNotifiedStatusRef.current = userStatusRes.status;
                const bannedInfo = userStatusRes.ban_details;
                const reason = Array.isArray(bannedInfo) ? bannedInfo[0]?.reason : bannedInfo?.reason;
                triggerBanNotification(reason || 'TOS Violation', userStatusRes.status);
              }
            } else if (userStatusRes.status === 'ACTIVE') {
              lastNotifiedStatusRef.current = 'ACTIVE';
              setBanNotifyVisible(false);
              setAppealVisible(false);
            }
          }
        } catch (err: any) {
          console.log("Error status check:", err);
        } finally {
          if (isMounted) isCheckingRef.current = false;
        }
      };
      checkUserStatusAndSession();
      banInterval = setInterval(() => { if (isMounted) checkUserStatusAndSession(); }, 10000);
    }, 600);
    return () => { isMounted = false; if (banInterval) clearInterval(banInterval); clearTimeout(timer); };
  }, [t]);

  useEffect(() => {
    let isMounted = true;
    let pingInterval: ReturnType<typeof setInterval>;
    let locationInterval: ReturnType<typeof setInterval>;

    const timer = setTimeout(() => {
      const initHardware = async () => {
        try {
          const currentBattery = await Battery.getBatteryLevelAsync();
          if (currentBattery > 0 && isMounted) setBatteryLevel(Math.round(currentBattery * 100));
          const providerStatus = await Location.getProviderStatusAsync();
          if (isMounted) setLocationOn(providerStatus.locationServicesEnabled);
          const btState = await BluetoothStateManager.getState();
          if (isMounted) setBluetoothOn(btState === 'PoweredOn');
        } catch(e) {}
      };
      initHardware();

      const checkPing = async () => {
        if (!isConnectedRef.current) return;
        const start = Date.now();
        try {
          await fetch('https://clients3.google.com/generate_204', { cache: 'no-store' });
          if (isMounted) setPingMs(Date.now() - start);
        } catch (error) { if (isMounted) setPingMs(-1); }
      };
      pingInterval = setInterval(checkPing, 6000); 

      locationInterval = setInterval(async () => {
        try {
          const providerStatus = await Location.getProviderStatusAsync();
          if (isMounted) setLocationOn(providerStatus.locationServicesEnabled);
        } catch (e) {}
      }, 6000);
    }, 800);

    const btUnsubscribe = BluetoothStateManager.addListener((bluetoothState: BluetoothState) => {
      if (isMounted) setBluetoothOn(bluetoothState === 'PoweredOn');
    }, true);

    const unsubscribeNet = NetInfo.addEventListener(state => {
      if (isMounted) {
        isConnectedRef.current = state.isConnected ?? false;
        let netName = t?.hw_offline || 'Offline';
        if (state.isConnected) {
          if (state.type === 'wifi') {
            const ssid = (state.details as any)?.ssid;
            netName = (ssid && ssid !== '<unknown ssid>') ? ssid : (t?.hw_wifi_connected || 'WiFi');
          } else if (state.type === 'cellular') {
            netName = (state.details as any)?.carrier || (t?.hw_cellular || 'Cellular');
          } else {
            netName = t?.hw_online || 'Online';
          }
        }
        setNetwork({ isConnected: state.isConnected ?? false, name: netName });
        if (!state.isConnected) setPingMs(-1);
      }
    });

    const batterySubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      if (isMounted) setBatteryLevel(Math.round(batteryLevel * 100));
    });

    return () => {
      isMounted = false;
      unsubscribeNet();
      batterySubscription.remove();
      clearTimeout(timer);
      if (pingInterval) clearInterval(pingInterval);
      if (locationInterval) clearInterval(locationInterval);
      if (btUnsubscribe) btUnsubscribe();
    };
  }, [t]);

  const handleNavigation = (route: string) => {
    if (pathname === route) { closeDrawer(); return; }
    closeDrawer();
    setIsAppLoading(true);
    setTimeout(() => { router.replace(route as any); setIsAppLoading(false); }, 400); 
  };

  const getNotificationType = () => {
    if (banNotifyConfig.title === t?.success_title) return 'success';
    if (banNotifyConfig.title === t?.ban_pending_title) return 'info';
    if (banNotifyConfig.title === t?.warn_title) return 'warning';
    return 'error';
  };

  const menuItems = [
    { id: 'home', title: t?.menu_home || 'Home', icon: 'home', route: '/screens/other/HomeScreenApp', color: '#FF2D55' },
    { id: 'chats', title: t?.menu_chats || 'Chats', icon: 'chatbubbles', route: '/screens/chats/ChatScreenApp', color: '#007AFF' },
    { id: 'contacts', title: t?.menu_contacts || 'Contacts', icon: 'people', route: '/screens/contacts/ContactScreenApp', color: '#34C759' },
    { id: 'tasks', title: t?.menu_tasks || 'Tasks', icon: 'checkmark-circle', route: '/screens/tasks/TaskScreenApp', color: '#FF9500' },
    { id: 'location', title: t?.menu_location || 'Location', icon: 'location', route: '/screens/location/LocationScreenApp', color: '#FF3B30' },
    { id: 'settings', title: t?.menu_settings || 'Settings', icon: 'settings', route: '/screens/settings/SettingScreenApp', color: '#8E8E93' },
    { id: 'support', title: t?.menu_support || 'Support', icon: 'help-buoy', route: '/screens/support/SupportScreenApp', color: '#AF52DE' },
  ];

  const content = scrollable ? (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>{children}</ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />
      
      <LoadingSpinnerApp visible={isAppLoading} />

      <View style={[styles.sidebarContainer, { backgroundColor: theme.surface, paddingTop: insets.top + 20 }]}>
        <View style={[styles.profileCapsule, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#F2F2F7' }]}>
          <Avatar url={userData.profileUrl} name={userData.full_name || 'User'} size={44} />
          <View style={styles.profileTextContainer}>
            <Text style={[styles.profileName, { color: theme.text }]} numberOfLines={1}>{userData.full_name || (t?.loading_user || 'Loading...')}</Text>
          </View>
        </View>

        <View style={[styles.hardwareCapsule, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : accentColor }]}>
          <View style={styles.hardwareGrid}>
            <View style={styles.hardwareItem}>
              <MaterialIcons name={network.isConnected && pingMs !== -1 ? "wifi" : "wifi-off"} size={22} color={network.isConnected && pingMs !== -1 ? "#007AFF" : "#8E8E93"} />
              <View style={styles.hardwareTextWrapper}>
                <Text style={[styles.hardwareText, { color: isDarkMode ? theme.text : '#FFF' }]} numberOfLines={1}>{network.name}</Text>
                <Text style={[styles.hardwareSubText, {color: network.isConnected && pingMs !== -1 ? "#007AFF" : "#8E8E93"}]}>{network.isConnected && pingMs !== -1 ? `${pingMs}ms` : (t?.hw_offline || 'Offline')}</Text>
              </View>
            </View>
            <View style={styles.hardwareItem}>
              <Ionicons name={batteryLevel > 80 ? "battery-full" : batteryLevel > 30 ? "battery-half" : "battery-dead"} size={22} color={batteryLevel > 80 ? "#34C759" : batteryLevel > 30 ? "#FFCC00" : "#FF3B30"} />
              <Text style={[styles.hardwareText, { color: isDarkMode ? theme.text : '#FFF' }]}>{batteryLevel}%</Text>
            </View>
            <View style={styles.hardwareItem}>
              <MaterialIcons name={locationOn ? "location-on" : "location-off"} size={22} color={locationOn ? "#34A853" : "#8E8E93"} />
              <Text style={[styles.hardwareText, { color: isDarkMode ? theme.text : '#FFF' }]}>{locationOn ? (t?.hw_gps_on || 'Location On') : (t?.hw_gps_off || 'Location Off')}</Text>
            </View>
            <View style={styles.hardwareItem}>
              <MaterialIcons name={bluetoothOn ? "bluetooth" : "bluetooth-disabled"} size={22} color={bluetoothOn ? "#0082FC" : "#8E8E93"} />
              <Text style={[styles.hardwareText, { color: isDarkMode ? theme.text : '#FFF' }]}>{bluetoothOn ? (t?.hw_bt_on || 'BT On') : (t?.hw_bt_off || 'BT Off')}</Text>
            </View>
            <View style={styles.hardwareItem}>
              <Ionicons name="phone-portrait" size={22} color={isDarkMode ? theme.text : "#A2AAAD"} />
              <Text style={[styles.hardwareText, { color: isDarkMode ? theme.text : '#FFF' }]} numberOfLines={1}>{Device.modelName || 'Unknown Device'}</Text>
            </View>
            <View style={styles.hardwareItem}>
              <Ionicons name={Platform.OS === 'ios' ? 'logo-apple' : 'logo-android'} size={22} color={Platform.OS === 'ios' ? (isDarkMode ? '#FFFFFF' : '#000000') : '#3DDC84'} />
              <Text style={[styles.hardwareText, { color: isDarkMode ? theme.text : '#FFF' }]} numberOfLines={1}>{Platform.OS === 'ios' ? 'iOS' : 'Android'} {Device.osVersion}</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
          {menuItems.map((item) => {
            const isActive = pathname === item.route;
            return (
              <TouchableOpacity key={item.id} style={[styles.menuItem, isActive && { backgroundColor: accentColor, shadowColor: accentColor, elevation: 4, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 }]} onPress={() => handleNavigation(item.route)}>
                <View style={[styles.menuIconBox, isActive ? { backgroundColor: 'transparent' } : { backgroundColor: `${item.color}15` }]}>
                  <Ionicons name={item.icon as any} size={20} color={isActive ? '#FFFFFF' : item.color} />
                </View>
                <Text style={[styles.menuText, { color: theme.text }, isActive && { color: '#FFFFFF' }]}>{item.title}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      <Animated.View style={[styles.mainAppContainer, { backgroundColor: theme.bg, transform: [{ translateX: panX }] }]} {...panResponder.panHandlers}>
        
        <Animated.View style={[
          styles.gestureIndicatorFixed,
          {
            opacity: panX.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: 'clamp' }),
            transform: [{ translateX: pullAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }) }]
          }
        ]}>
            <TouchableOpacity 
              activeOpacity={0.6}
              onPress={openDrawer} 
              style={styles.hitboxTipis}
            >
               <Ionicons name="chevron-forward" size={18} color={isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)'} />
            </TouchableOpacity>
        </Animated.View>

        {isDrawerOpen && (
          <TouchableWithoutFeedback onPress={closeDrawer}>
            <Animated.View pointerEvents={isDrawerOpen.current ? "auto" : "none"} style={[styles.overlay, { opacity: panX.interpolate({ inputRange: [0, DRAWER_WIDTH], outputRange: [0, 0.15] }) }]} />
          </TouchableWithoutFeedback>
        )}

        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
          {title && (
            <View style={[styles.header, { backgroundColor: theme.bg }]}>
              <View style={styles.headerLeft} />
              <View style={styles.headerCenter}>
                <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
              </View>
              <View style={styles.headerRight} />
            </View>
          )}
          {content}
        </SafeAreaView>
      </Animated.View>

      <NotificationInteractive visible={banNotifyVisible} title={banNotifyConfig.title} message={banNotifyConfig.message} type={getNotificationType()} buttons={banNotifyConfig.buttons} onDismiss={() => {}} />

      <Modal visible={appealVisible} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t?.modal_appeal_title}</Text>
            <Text style={[styles.modalSubtitle, { color: theme.subText }]}>{t?.modal_appeal_sub}</Text>
            <InputApp iconName="help-circle" iconColor="#8E8E93" placeholder={t?.input_reason || 'Reason'} value={appealReason} onChangeText={setAppealReason} />
            <InputApp iconName="document-text" iconColor="#8E8E93" placeholder={t?.input_detail || 'Detail'} value={appealText} onChangeText={setAppealText} />
            <View style={styles.modalButtons}>
              {/* Tombol Batal Dihapus, Tersisa Kirim Banding Full Width */}
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: accentColor }]} onPress={handleAppealSubmit}>
                <Text style={styles.btnTextSubmit}>{t?.btn_submit_appeal || 'Submit'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, 
  sidebarContainer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: DRAWER_WIDTH, paddingHorizontal: 20, paddingBottom: 30 },
  profileCapsule: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 999, marginBottom: 24 },
  profileTextContainer: { marginLeft: 12, flex: 1, paddingRight: 10 },
  profileName: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  hardwareCapsule: { padding: 16, borderRadius: 20, marginBottom: 24 },
  hardwareGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  hardwareItem: { flexDirection: 'row', alignItems: 'center', width: '45%', gap: 8 },
  hardwareTextWrapper: { flex: 1 },
  hardwareText: { fontSize: 13, fontWeight: '700', flexShrink: 1 }, 
  hardwareSubText: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  menuContainer: { flex: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 999, marginBottom: 8 },
  menuIconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuText: { fontSize: 15, fontWeight: '600', letterSpacing: -0.3 },
  mainAppContainer: { flex: 1, shadowColor: '#000', shadowOffset: { width: -10, height: 0 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 15 },
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#000', zIndex: 10 },
  container: { flex: 1, zIndex: 1 },
  gestureIndicatorFixed: { position: 'absolute', left: 0, top: '50%', marginTop: -30, height: 60, width: 30, justifyContent: 'center', alignItems: 'flex-start', zIndex: 9999 },
  hitboxTipis: { width: 30, height: 60, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 4, borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerLeft: { flex: 1 },
  headerRight: { flex: 1 },
  headerCenter: { flex: 2, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', letterSpacing: -0.5, textAlign: 'center' },
  scroll: { padding: 24, flexGrow: 1 },
  content: { padding: 24, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 24, borderRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 13, marginBottom: 20, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', marginTop: 16, justifyContent: 'center' }, // Diganti dari space-between jadi center
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 25, alignItems: 'center', marginHorizontal: 5 },
  btnTextSubmit: { color: '#FFF', fontWeight: 'bold' }
});