import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Animated, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DeviceService, DeviceSession } from '@/services/auth/DeviceService';
import QRCodeScanner from '@/utils/tools/QRCodeScanner';
import { useAppearance } from '@/utils/tools/AppearanceApp';
import { useLanguage } from '@/utils/tools/LanguageApp';
import { deviceManagerDict } from '@/utils/language/DeviceManagerScreenAppLanguage';
import LoadingSpinnerApp from '@/components/ui/LoadingSpinnerApp';
import NotificationInteractiveApp from '@/components/ui/NotificationInteractiveApp';

export default function DeviceManagerScreenApp() {
  const router = useRouter();
  const { theme, accentColor, isDarkMode } = useAppearance();
  const { language } = useLanguage();
  const t = deviceManagerDict[language] || deviceManagerDict['id'];
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [isScannerVisible, setIsScannerVisible] = useState(false);

  const [notif, setNotif] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
    buttons: Array<{ text: string; onPress: () => void; primary?: boolean; color?: string }>;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });

  const showNotif = (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info', buttons: any[]) => {
    setNotif({ visible: true, title, message, type, buttons });
  };

  const closeNotif = () => setNotif(prev => ({ ...prev, visible: false }));

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    const res = await DeviceService.getActiveDevices();
    if (res.success && res.data) {
      setDevices(res.data);
    }
    setLoading(false);
  };

  const confirmRemoveDevice = (device: DeviceSession) => {
    const targetId = device.id || device.device_id;
    if (!targetId) {
      showNotif(t.error, t.idNotFound, 'error', [{ text: t.ok, onPress: closeNotif, primary: true }]);
      return;
    }

    showNotif(t.removeTitle, t.removePrompt, 'warning', [
      { text: t.cancel, onPress: closeNotif },
      { 
        text: t.ok, 
        primary: true, 
        color: '#FF3B30',
        onPress: async () => {
          closeNotif();
          setLoading(true);
          const res = await DeviceService.removeDevice(targetId!);
          setLoading(false);

          if (res.success) {
            showNotif(t.success, t.removedSuccess, 'success', [{
              text: t.ok, primary: true, onPress: () => {
                closeNotif();
                fetchDevices();
              }
            }]);
          } else {
            showNotif(t.error, res.error || t.error, 'error', [{ text: t.ok, onPress: closeNotif, primary: true }]);
          }
        } 
      }
    ]);
  };

  const handleQRScanned = (data: string) => {
    setIsScannerVisible(false);
    
    let extractedToken = data;
    let targetPlatform = 'Website';
    let targetModel = 'Desktop Login via QR';
    let targetOsVersion = 'Unknown OS'; 
    
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'xy_login') {
        extractedToken = parsed.token;
        targetPlatform = parsed.platform || targetPlatform;
        targetModel = parsed.device_model || targetModel;
        targetOsVersion = parsed.os_version || targetOsVersion; 
      }
    } catch (e) {
      extractedToken = data;
    }

    showNotif(`${t.authTitle} - ${targetPlatform}`, t.authPrompt, 'info', [
      { text: t.cancel, onPress: closeNotif },
      {
        text: t.ok,
        primary: true,
        onPress: async () => {
          closeNotif();
          setLoading(true);
          const res = await DeviceService.authorizeQRLogin(extractedToken, targetModel, targetPlatform, targetOsVersion);
          setLoading(false);

          if (res.success) {
            showNotif(t.success, t.authSuccess, 'success', [{
              text: t.ok, primary: true, onPress: () => {
                closeNotif();
                fetchDevices();
              }
            }]);
          } else {
            showNotif(t.error, res.error || t.error, 'error', [{ text: t.ok, onPress: closeNotif, primary: true }]);
          }
        }
      }
    ]);
  };

  const getDeviceIconInfo = (platform: string, model: string) => {
    const p = (platform || '').toLowerCase();
    const m = (model || '').toLowerCase();
    if (m.includes('chrome') || p.includes('chrome')) return { name: 'google-chrome', color: '#4285F4' };
    if (m.includes('firefox') || p.includes('firefox')) return { name: 'firefox', color: '#FF7139' };
    if (m.includes('edge') || p.includes('edge')) return { name: 'microsoft-edge', color: '#0078D7' };
    if (p.includes('android') || m.includes('android')) return { name: 'android', color: '#3DDC84' };
    if (p.includes('ios') || m.includes('iphone') || m.includes('ipad')) return { name: 'apple', color: isDarkMode ? '#FFF' : '#000' };
    if (p.includes('mac') || m.includes('mac')) return { name: 'apple', color: isDarkMode ? '#FFF' : '#000' };
    if (p.includes('windows') || m.includes('windows')) return { name: 'microsoft-windows', color: '#00A4EF' };
    if (p.includes('linux') || m.includes('linux')) return { name: 'linux', color: '#FCC624' };
    return { name: 'cellphone-link', color: theme.subText };
  };

  const AnimatedDeviceCard = ({ item, index }: { item: DeviceSession, index: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: index * 80, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 350, delay: index * 80, useNativeDriver: true })
      ]).start();
    }, []);

    const isQRLogin = item.device_model.includes('(via QR)');
    const displayModel = item.device_model.replace('(via QR)', '').trim();
    let displayOs = item.os_version || 'Unknown';
    if (displayOs.startsWith('OS ')) displayOs = displayOs.replace('OS ', '');
    const iconInfo = getDeviceIconInfo(item.platform, item.device_model);

    return (
      <Animated.View style={[
        styles.deviceCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
        { opacity: fadeAnim, transform: [{ translateY }] }
      ]}>
        <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7' }]}>
          <MaterialCommunityIcons name={iconInfo.name as any} size={26} color={iconInfo.color} />
        </View>

        <View style={styles.deviceInfo}>
          <View style={styles.headerRow}>
            {isQRLogin && <Ionicons name="qr-code-outline" size={14} color={theme.subText} style={{ marginRight: 6 }} />}
            <Text style={[styles.deviceModel, { color: theme.text }]} numberOfLines={1}>
              {displayModel || 'Unknown Device'}
            </Text>
          </View>
          <Text style={[styles.deviceDetail, { color: theme.subText }]}>
            {item.platform || 'Unknown OS'} • {displayOs}
          </Text>
          
          {item.is_current_device && (
            <View style={[styles.badgeActive, { backgroundColor: `${accentColor}15` }]}>
              <Text style={[styles.badgeText, { color: accentColor }]}>{t.currentDevice}</Text>
            </View>
          )}
        </View>

        {!item.is_current_device && (
          <TouchableOpacity 
            style={[styles.removeBtn, { backgroundColor: isDarkMode ? '#3A1C1C' : '#FFF0F0' }]} 
            onPress={() => confirmRemoveDevice(item)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  const sortedDevices = [...devices].sort((a, b) => {
    if (a.is_current_device && !b.is_current_device) return -1;
    if (!a.is_current_device && b.is_current_device) return 1;
    return 0;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.5 : 1 }]}>
          <Ionicons name="arrow-back" size={24} color={accentColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.topSection}>
        <View style={[styles.tutorialCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.tutorialHeader}>
            <Ionicons name="information-circle" size={20} color={accentColor} />
            <Text style={[styles.tutorialTitle, { color: theme.text }]}>{t.tutorialTitle}</Text>
          </View>
          <View style={styles.stepRow}>
            <Text style={[styles.stepDot, { color: accentColor }]}>1.</Text>
            <Text style={[styles.stepText, { color: theme.subText }]}>{t.tutorialStep1}</Text>
          </View>
          <View style={styles.stepRow}>
            <Text style={[styles.stepDot, { color: accentColor }]}>2.</Text>
            <Text style={[styles.stepText, { color: theme.subText }]}>{t.tutorialStep2}</Text>
          </View>
          <View style={styles.stepRow}>
            <Text style={[styles.stepDot, { color: accentColor }]}>3.</Text>
            <Text style={[styles.stepText, { color: theme.subText }]}>{t.tutorialStep3}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.scanBtn, { backgroundColor: accentColor }]} 
          onPress={() => setIsScannerVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="scan-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.scanBtnText}>{t.scanBtn}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
            <LoadingSpinnerApp visible={loading} />
        </View>
      ) : (
        <FlatList
          data={sortedDevices}
          keyExtractor={(item, index) => (item.id || item.device_id || index).toString()}
          renderItem={({ item, index }) => <AnimatedDeviceCard item={item} index={index} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchDevices}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.subText }]}>{t.empty}</Text>}
        />
      )}

      <QRCodeScanner 
        visible={isScannerVisible}
        onClose={() => setIsScannerVisible(false)}
        onScan={handleQRScanned}
      />

      <NotificationInteractiveApp
        visible={notif.visible}
        title={notif.title}
        message={notif.message}
        type={notif.type}
        buttons={notif.buttons}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 12, paddingHorizontal: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topSection: { paddingHorizontal: 16, paddingBottom: 12 },
  tutorialCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  tutorialHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tutorialTitle: { fontSize: 15, fontWeight: '700', marginLeft: 8 },
  stepRow: { flexDirection: 'row', marginBottom: 8, paddingRight: 16 },
  stepDot: { fontSize: 13, fontWeight: '700', marginRight: 8, width: 14 },
  stepText: { fontSize: 13, lineHeight: 18, flex: 1 },
  scanBtn: { flexDirection: 'row', padding: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  scanBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  listContainer: { paddingBottom: 32, paddingHorizontal: 16 },
  deviceCard: { padding: 14, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  iconContainer: { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  deviceInfo: { flex: 1, paddingRight: 8, alignItems: 'flex-start' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  deviceModel: { fontSize: 15, fontWeight: '600', marginRight: 8, flexShrink: 1 },
  badgeActive: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  deviceDetail: { fontSize: 12, fontWeight: '400' },
  removeBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 14 }
});