import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { DeviceService, DeviceSession } from '@/services/DeviceService';
import { authDb } from '@/databases/AuthDatabase';
import AppLayout from '../../layouts/AppLayout';
import QRCodeScanner from '@/utils/tools/QRCodeScanner';

export default function DeviceManagerScreenApp() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [isScannerVisible, setIsScannerVisible] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    const res = await DeviceService.getActiveDevices();
    if (res.success && res.data) {
      setDevices(res.data);
    } else {
      console.log("Gagal memuat perangkat:", res.error);
    }
    setLoading(false);
  };

  const handleRemoveDevice = (device: DeviceSession) => {
    const targetId = device.id || device.device_id;

    if (!targetId) {
      Alert.alert("Gagal", "ID Perangkat tidak ditemukan.");
      return;
    }

    Alert.alert(
      "Keluarkan Perangkat",
      `Apakah Anda yakin ingin mengeluarkan perangkat ${device.device_model || 'ini'}?`,
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Keluarkan", 
          style: "destructive", 
          onPress: async () => {
            setLoading(true);
            const res = await DeviceService.removeDevice(targetId!);
            
            if (device.is_current_device) {
              await authDb.clearSession(); 
              setLoading(false);
              router.replace('/screens/auth/LoginScreenApp');
              return;
            }

            if (res.success) {
              Alert.alert("Sukses", "Perangkat berhasil dikeluarkan.");
              fetchDevices();
            } else {
              if (res.error?.includes('Sesi tidak valid') || res.error?.includes('dikeluarkan')) {
                fetchDevices();
              } else {
                Alert.alert("Gagal", res.error || "Gagal mengeluarkan perangkat.");
              }
            }
            setLoading(false);
          } 
        }
      ]
    );
  };

  const handleQRScanned = (data: string) => {
    setIsScannerVisible(false);
    Alert.alert(
      "QR Code Ditemukan", 
      `Memproses otorisasi untuk:\n${data}`,
      [
        {
          text: "Otorisasi Perangkat",
          onPress: () => {
            Alert.alert("Sukses", "Sesi berhasil diberikan ke perangkat baru.");
            fetchDevices();
          }
        },
        { text: "Batal", style: "cancel" }
      ]
    );
  };

  const renderDeviceItem = ({ item }: { item: DeviceSession }) => (
    <View style={styles.deviceCard}>
      <View style={styles.deviceInfo}>
        <View style={styles.headerRow}>
          <Text style={styles.deviceModel}>{item.device_model || 'Unknown Device'}</Text>
          {item.is_current_device && (
            <View style={styles.badgeActive}>
              <Text style={styles.badgeText}>Perangkat Ini</Text>
            </View>
          )}
        </View>
        <Text style={styles.deviceDetail}>{item.platform || 'Unknown OS'} • OS {item.os_version || 'Unknown'}</Text>
      </View>

      <TouchableOpacity 
        style={styles.removeBtn} 
        onPress={() => handleRemoveDevice(item)}
      >
        <Text style={styles.removeBtnText}>Keluarkan</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <AppLayout title="Perangkat Aktif" scrollable={false}>
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.scanBtn} 
          onPress={() => setIsScannerVisible(true)}
        >
          <Text style={styles.scanBtnText}>📷 Pindai QR untuk Login Desktop</Text>
        </TouchableOpacity>
      </View>

      {loading && devices.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Memuat data perangkat...</Text>
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item, index) => {
            const keyId = item.id || item.device_id || index;
            return keyId.toString();
          }}
          renderItem={renderDeviceItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchDevices}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Tidak ada perangkat aktif ditemukan.</Text>
          }
        />
      )}

      <QRCodeScanner 
        visible={isScannerVisible}
        onClose={() => setIsScannerVisible(false)}
        onScan={handleQRScanned}
      />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#8E8E93', fontSize: 14 },
  actionContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  scanBtn: { backgroundColor: '#007AFF', padding: 14, borderRadius: 12, alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  scanBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  listContainer: { paddingBottom: 24, paddingHorizontal: 16, paddingTop: 8 },
  deviceCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  deviceInfo: { flex: 1, paddingRight: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  deviceModel: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E', marginRight: 8 },
  badgeActive: { backgroundColor: '#E5F1FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#007AFF' },
  deviceDetail: { fontSize: 13, color: '#8E8E93' },
  removeBtn: { backgroundColor: '#FF3B3015', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  removeBtnText: { color: '#FF3B30', fontSize: 13, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 32, color: '#8E8E93', fontSize: 14 }
});