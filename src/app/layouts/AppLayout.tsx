import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, View, Text, ScrollView, StatusBar, AppState, 
  Modal, TouchableOpacity, Alert, BackHandler, Animated, 
  PanResponder, Dimensions, Easing, TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

// Hardware Packages (Real-Time Detection)
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import NetInfo from '@react-native-community/netinfo';

import { DeviceService } from '@/services/DeviceService';
import { UserService } from '@/services/UserService';
import { BannedService } from '@/services/admin/BannedService';
import { authDb } from '@/databases/AuthDatabase';

import NotificationInteractive, { NotificationButton } from '@/components/ui/NotificationInteractiveApp';
import LoadingSpinnerApp from '@/components/ui/LoadingSpinnerApp';
import InputApp from '@/components/ui/InputApp';
import { Avatar } from '@/components/ux/Avatar';

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
  
  // ===================== STATE GLOBAL & LOADING =====================
  const [isAppLoading, setIsAppLoading] = useState(true);

  // ===================== STATE OTENTIKASI & BAN (DARI KODE ASLI) =====================
  const isCheckingRef = useRef(false);
  const lastNotifiedStatusRef = useRef('ACTIVE'); 
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [banNotifyVisible, setBanNotifyVisible] = useState(false);
  const [banNotifyConfig, setBanNotifyConfig] = useState({ title: '', message: '', buttons: [] as NotificationButton[] });
  
  const [appealVisible, setAppealVisible] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealText, setAppealText] = useState('');

  // ===================== STATE SIDEBAR & HARDWARE =====================
  const [userData, setUserData] = useState({ full_name: '', profileUrl: null as string | null });
  const panX = useRef(new Animated.Value(0)).current;
  const isDrawerOpen = useRef(false);

  const [network, setNetwork] = useState({ isConnected: true, name: 'Mendeteksi...' });
  const [pingMs, setPingMs] = useState<number>(0);
  const [locationOn, setLocationOn] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [bluetoothOn, setBluetoothOn] = useState(true);

  // ===================== FUNGSI BANNED & AUTH (DARI KODE ASLI) =====================
  const handleForceLogout = async () => {
    await authDb.clearSession();
    router.replace('/screens/auth/LoginScreenApp');
  };

  const triggerBanNotification = (reason: string, status: string) => {
    const isPending = status === 'PENDING';
    setBanNotifyConfig({
      title: isPending ? 'Banding Diproses' : 'Akun Ditangguhkan',
      message: isPending
        ? `Akun Anda sedang ditangguhkan dan banding sedang dalam proses peninjauan oleh admin.\n\nAlasan:\n"${reason}"`
        : `Status akun Anda adalah BANNED.\n\nAlasan Admin:\n"${reason}"`,
      buttons: isPending ? [
        { text: 'Keluar Aplikasi', style: 'cancel', onPress: () => BackHandler.exitApp() },
        { text: 'Logout Akun', style: 'default', onPress: () => { setBanNotifyVisible(false); handleForceLogout(); } }
      ] : [
        { text: 'Tutup', style: 'cancel', onPress: () => setBanNotifyVisible(false) },
        { text: 'Ajukan Banding', style: 'default', onPress: () => { setBanNotifyVisible(false); setAppealVisible(true); } }
      ]
    });
    setBanNotifyVisible(true);
  };

  const handleAppealSubmit = async () => {
    const email = currentUser?.email || currentUser?.user?.email;
    const username = currentUser?.username || currentUser?.user?.user_metadata?.username;
    const identifier = email || username;

    if (!identifier) {
      Alert.alert("Error", "Gagal mengidentifikasi sesi Anda. Silakan logout dan ajukan banding lewat halaman Login.");
      return;
    }
    
    if (!appealReason || !appealText) {
      Alert.alert("Peringatan", "Harap isi alasan dan detail banding.");
      return;
    }

    setIsAppLoading(true);
    const res = await BannedService.submitAppeal(identifier, appealReason, appealText);
    setIsAppLoading(false);
    
    if (res.success) {
      Alert.alert('Berhasil', 'Banding berhasil dikirim. Menunggu tinjauan admin.', [
        { text: 'Oke', onPress: () => {
            setAppealVisible(false);
            lastNotifiedStatusRef.current = 'PENDING';
            triggerBanNotification(appealReason, 'PENDING');
        }}
      ]);
    } else {
      Alert.alert('Gagal', res.error || 'Terjadi kesalahan saat mengirim banding.');
    }
  };

  // ===================== GESTURE HANDLER =====================
  const openDrawer = () => {
    Animated.timing(panX, {
      toValue: DRAWER_WIDTH,
      duration: 350,
      easing: Easing.out(Easing.bezier(0.25, 1, 0.5, 1)), 
      useNativeDriver: true,
    }).start();
    isDrawerOpen.current = true;
  };

  const closeDrawer = () => {
    Animated.timing(panX, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.bezier(0.25, 1, 0.5, 1)),
      useNativeDriver: true,
    }).start();
    isDrawerOpen.current = false;
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        let newX = isDrawerOpen.current ? DRAWER_WIDTH + gestureState.dx : gestureState.dx;
        if (newX < 0) newX = 0;
        if (newX > DRAWER_WIDTH) newX = DRAWER_WIDTH;
        panX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SCREEN_WIDTH * 0.2 || (isDrawerOpen.current && gestureState.dx > -SCREEN_WIDTH * 0.2)) openDrawer();
        else closeDrawer();
      },
    })
  ).current;

  // ===================== USE EFFECTS =====================
  useEffect(() => {
    let isMounted = true;

    // 1. Fungsi Cek Sesi & Ban (Dari asli)
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
              triggerBanNotification(reason || 'Melanggar ketentuan layanan.', userStatusRes.status);
            }
          } else if (userStatusRes.status === 'ACTIVE') {
            lastNotifiedStatusRef.current = 'ACTIVE';
            setBanNotifyVisible(false);
            setAppealVisible(false);
          }
        }
      } catch (err: any) {
        console.log("Error network/server status check:", err);
      } finally {
        if (isMounted) isCheckingRef.current = false;
      }
    };

    // 2. Inisialisasi Auth & Profile
    const initializeAuthAndProfile = async () => {
      const user = await authDb.getSession(); 
      if (isMounted) setCurrentUser(user);
      
      const cachedData = await authDb.getUserData();
      if (cachedData && isMounted) setUserData({ full_name: cachedData.full_name ?? '', profileUrl: cachedData.profiles ?? null });
      
      const result = await UserService.getProfile();
      if (result.success && result.data && isMounted) {
        setUserData({ full_name: result.data.full_name ?? '', profileUrl: result.data.profiles ?? null });
      }

      checkUserStatusAndSession();
    };

    // 3. Inisialisasi Hardware
    const initHardware = async () => {
      // Minta izin lokasi DULU agar NetInfo bisa baca SSID WiFi
      await Location.requestForegroundPermissionsAsync();
      
      const currentBattery = await Battery.getBatteryLevelAsync();
      if (currentBattery > 0 && isMounted) setBatteryLevel(Math.round(currentBattery * 100));
      
      const locEnabled = await Location.hasServicesEnabledAsync();
      if (isMounted) setLocationOn(locEnabled);

      if (isMounted) setIsAppLoading(false); // Selesai loading awal
    };

    initializeAuthAndProfile();
    initHardware();

    // 4. LISTENER NETWORK (SSID)
    const unsubscribeNet = NetInfo.addEventListener(state => {
      if (isMounted) {
        let netName = 'Offline';
        if (state.isConnected) {
          if (state.type === 'wifi') {
            const ssid = (state.details as any)?.ssid;
            netName = (ssid && ssid !== '<unknown ssid>') ? ssid : 'WiFi Terhubung';
          } else if (state.type === 'cellular') {
            netName = (state.details as any)?.carrier || 'Data Seluler';
          } else {
            netName = 'Online';
          }
        }
        setNetwork({ isConnected: state.isConnected ?? false, name: netName });
        if (!state.isConnected) setPingMs(-1);
      }
    });

    // 5. LISTENER BATERAI & PING
    const batterySubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      if (isMounted) setBatteryLevel(Math.round(batteryLevel * 100));
    });

    const checkPing = async () => {
      if (!network.isConnected) return;
      const start = Date.now();
      try {
        await fetch('https://clients3.google.com/generate_204', { cache: 'no-store' });
        if (isMounted) setPingMs(Date.now() - start);
      } catch (error) {
        if (isMounted) setPingMs(-1);
      }
    };

    const pingInterval = setInterval(checkPing, 3000); 
    const locationInterval = setInterval(async () => {
      try {
        const locEnabled = await Location.hasServicesEnabledAsync();
        if (isMounted && locEnabled !== locationOn) setLocationOn(locEnabled);
      } catch (e) {}
    }, 2000);

    // AppState listener dari kode asli
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') checkUserStatusAndSession();
    });
    const banInterval = setInterval(() => { if (isMounted) checkUserStatusAndSession(); }, 5000);

    return () => {
      isMounted = false;
      subscription.remove();
      clearInterval(banInterval);
      unsubscribeNet();
      clearInterval(pingInterval);
      batterySubscription.remove();
      clearInterval(locationInterval);
    };
  }, [network.isConnected, locationOn]);

  const handleNavigation = (route: any) => {
    closeDrawer();
    setTimeout(() => { router.push(route); }, 300);
  };

  // Logika Warna Indikator Ping WiFi
  let wifiColor = "#FFFFFF"; // Default di dalam capsule biru
  let pingText = "Offline";
  if (network.isConnected && pingMs !== -1) {
    if (pingMs <= 30) wifiColor = "#A4D0A4"; // Hijau soft agar masuk dengan bg biru
    else if (pingMs <= 100) wifiColor = "#FFEA79"; // Kuning soft
    else wifiColor = "#FFB3B3"; // Merah soft
    pingText = `${pingMs}ms`;
  }

  const menuItems = [
    { id: 'home', title: 'Home', icon: 'home', color: '#007AFF', route: '/screens/other/HomeScreenApp' },
    { id: 'chats', title: 'My Chats', icon: 'chatbubbles', color: '#34C759', route: '/screens/chats/ChatScreenApp' },
    { id: 'contacts', title: 'My Contact', icon: 'people', color: '#5856D6', route: '/screens/contacts/ContactScreenApp' },
    { id: 'tasks', title: 'My Task', icon: 'checkmark-circle', color: '#FF9500', route: '/screens/tasks/TaskScreenApp' },
    { id: 'location', title: 'My Location', icon: 'location', color: '#FF3B30', route: '/screens/location/LocationScreenApp' },
    { id: 'settings', title: 'My Settings', icon: 'settings', color: '#8E8E93', route: '/screens/settings/SettingScreenApp' },
    { id: 'support', title: 'My Supports', icon: 'help-buoy', color: '#00C7BE', route: '/screens/support/SupportScreenApp' },
  ];

  const content = scrollable ? (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>{children}</ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <LoadingSpinnerApp visible={isAppLoading} />

      {/* ===================== SIDEBAR ===================== */}
      <View style={[styles.sidebarContainer, { paddingTop: insets.top + 20 }]}>
        
        <View style={styles.profileCapsule}>
          <Avatar url={userData.profileUrl} name={userData.full_name || 'User'} size={44} />
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName} numberOfLines={1}>{userData.full_name || 'Memuat...'}</Text>
          </View>
        </View>

        {/* Hardware Indicators (Warna Biru Solid Sesuai Request) */}
        <View style={styles.hardwareCapsule}>
          <View style={styles.hardwareGrid}>
            <View style={styles.hardwareItem}>
              <MaterialIcons name={network.isConnected && pingMs !== -1 ? "wifi" : "wifi-off"} size={22} color={wifiColor} />
              <View style={styles.hardwareTextWrapper}>
                <Text style={styles.hardwareText} numberOfLines={1}>{network.name}</Text>
                <Text style={[styles.hardwareSubText, {color: wifiColor}]}>{pingText}</Text>
              </View>
            </View>
            
            <View style={styles.hardwareItem}>
              <Ionicons name={batteryLevel > 20 ? "battery-half" : "battery-dead"} size={22} color="#FFFFFF" />
              <Text style={styles.hardwareText}>{batteryLevel}%</Text>
            </View>

            <View style={styles.hardwareItem}>
              <Ionicons name={locationOn ? "location" : "location-outline"} size={22} color="#FFFFFF" />
              <Text style={styles.hardwareText}>{locationOn ? "GPS Aktif" : "GPS Mati"}</Text>
            </View>

            <View style={styles.hardwareItem}>
              <Ionicons name={bluetoothOn ? "bluetooth" : "bluetooth-outline"} size={22} color="#FFFFFF" />
              <Text style={styles.hardwareText}>{bluetoothOn ? "BT Aktif" : "BT Mati"}</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
          {menuItems.map((item) => {
            const isActive = pathname === item.route;
            return (
              <TouchableOpacity key={item.id} style={[styles.menuItem, isActive && styles.menuItemActive]} onPress={() => handleNavigation(item.route)}>
                <View style={[styles.menuIconBox, isActive ? { backgroundColor: 'transparent' } : { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon as any} size={20} color={isActive ? '#FFFFFF' : item.color} />
                </View>
                <Text style={[styles.menuText, isActive && styles.menuTextActive]}>{item.title}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* ===================== MAIN CONTENT ===================== */}
      <Animated.View style={[styles.mainAppContainer, { transform: [{ translateX: panX }] }]} {...panResponder.panHandlers}>
        
        {!isDrawerOpen.current && (
          <View style={styles.gestureIndicatorFixed}>
            <View style={styles.gestureBar} />
          </View>
        )}

        {isDrawerOpen && (
          <TouchableWithoutFeedback onPress={closeDrawer}>
            <Animated.View pointerEvents={isDrawerOpen.current ? "auto" : "none"} style={[styles.overlay, { opacity: panX.interpolate({ inputRange: [0, DRAWER_WIDTH], outputRange: [0, 0.15] }) }]} />
          </TouchableWithoutFeedback>
        )}

        <SafeAreaView style={styles.container}>
          {title && (
            <View style={styles.header}>
              <View style={styles.headerLeft} />
              <View style={styles.headerCenter}>
                <Text style={styles.title}>{title}</Text>
              </View>
              <View style={styles.headerRight} />
            </View>
          )}
          {content}
        </SafeAreaView>
      </Animated.View>

      {/* ===================== MODAL & NOTIFIKASI BANNED ===================== */}
      <NotificationInteractive
        visible={banNotifyVisible}
        title={banNotifyConfig.title}
        message={banNotifyConfig.message}
        type={banNotifyConfig.title === 'Banding Diproses' ? 'info' : 'error'}
        buttons={banNotifyConfig.buttons}
        onDismiss={() => {}}
      />

      <Modal visible={appealVisible} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajukan Banding</Text>
            <Text style={styles.modalSubtitle}>Isi form ini untuk meminta peninjauan kembali akun Anda.</Text>
            
            <InputApp iconName="help-circle" iconColor="#8E8E93" placeholder="Alasan (Singkat)" value={appealReason} onChangeText={setAppealReason} />
            <InputApp iconName="document-text" iconColor="#8E8E93" placeholder="Pesan Detail" value={appealText} onChangeText={setAppealText} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.btnCancel]} onPress={() => setAppealVisible(false)}>
                <Text style={styles.btnTextCancel}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.btnSubmit]} onPress={handleAppealSubmit}>
                <Text style={styles.btnTextSubmit}>Kirim Banding</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' }, 
  
  sidebarContainer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: DRAWER_WIDTH, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingBottom: 30 },
  
  profileCapsule: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', padding: 8, borderRadius: 999, marginBottom: 24 },
  profileTextContainer: { marginLeft: 12, flex: 1, paddingRight: 10 },
  profileName: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.3 },
  
  // Hardware Capsule (Biru Solid `#007AFF`)
  hardwareCapsule: {
    backgroundColor: '#007AFF', // Disamakan dengan tombol capsule Home
    padding: 16,
    borderRadius: 20, 
    marginBottom: 24,
  },
  hardwareGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  hardwareItem: { flexDirection: 'row', alignItems: 'center', width: '45%', gap: 8 },
  hardwareTextWrapper: { flex: 1 },
  hardwareText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', flexShrink: 1 }, // Teks jadi Putih
  hardwareSubText: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  
  menuContainer: { flex: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 999, marginBottom: 8 },
  menuItemActive: { backgroundColor: '#007AFF', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  menuIconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuText: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', letterSpacing: -0.3 },
  menuTextActive: { color: '#FFFFFF' },
  
  mainAppContainer: { flex: 1, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: -10, height: 0 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 15 },
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#000', zIndex: 10 },
  container: { flex: 1, backgroundColor: '#FAFAFC', zIndex: 1 },
  
  gestureIndicatorFixed: { position: 'absolute', left: 0, top: '50%', marginTop: -25, height: 50, width: 6, justifyContent: 'center', alignItems: 'flex-start', zIndex: 9999 },
  gestureBar: { height: '100%', width: 5, backgroundColor: '#C7C7CC', borderTopRightRadius: 4, borderBottomRightRadius: 4 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FAFAFC' },
  headerLeft: { flex: 1 },
  headerRight: { flex: 1 },
  headerCenter: { flex: 2, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.5, textAlign: 'center' },
  
  scroll: { padding: 24, flexGrow: 1 },
  content: { padding: 24, flex: 1 },

  // Style untuk Modal Banned
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', padding: 24, borderRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 13, color: '#8E8E93', marginBottom: 20, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', marginTop: 16, justifyContent: 'space-between' },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 25, alignItems: 'center', marginHorizontal: 5 },
  btnCancel: { backgroundColor: '#FFECEB' },
  btnSubmit: { backgroundColor: '#007AFF' },
  btnTextCancel: { color: '#FF3B30', fontWeight: 'bold' },
  btnTextSubmit: { color: '#FFF', fontWeight: 'bold' }
});