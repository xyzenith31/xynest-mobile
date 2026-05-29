import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionStatus } from 'expo-modules-core';

export default function PermissionScreenApp() {
  const router = useRouter();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationStatus, setLocationStatus] = useState<PermissionStatus | null>(null);
  const [mediaStatus, setMediaStatus] = useState<PermissionStatus | null>(null);
  const [contactStatus, setContactStatus] = useState<PermissionStatus | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const loc = await Location.getForegroundPermissionsAsync();
    setLocationStatus(loc.status);
    
    const media = await MediaLibrary.getPermissionsAsync();
    setMediaStatus(media.status);
    
    const contact = await Contacts.getPermissionsAsync();
    setContactStatus(contact.status);
  };

  const requestAllPermissions = async () => {
    if (!cameraPermission?.granted) {
      await requestCameraPermission();
    }
    
    const locRes = await Location.requestForegroundPermissionsAsync();
    setLocationStatus(locRes.status);

    const mediaRes = await MediaLibrary.requestPermissionsAsync();
    setMediaStatus(mediaRes.status);

    const contactRes = await Contacts.requestPermissionsAsync();
    setContactStatus(contactRes.status);

    Alert.alert("Selesai", "Proses permintaan izin selesai.");
  };

  const handleContinue = async () => {
    await AsyncStorage.setItem('has_seen_permissions', 'true');
    router.replace('/'); 
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Izin Aplikasi</Text>
        <Text style={styles.subtitle}>
          Untuk memberikan pengalaman terbaik, XyNest membutuhkan beberapa izin akses.
        </Text>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionTitle}>📷 Kamera & Mikrofon</Text>
          <Text style={styles.permissionDesc}>
            Status: {cameraPermission?.granted ? 'Diizinkan' : 'Belum Diizinkan'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionTitle}>📍 Lokasi</Text>
          <Text style={styles.permissionDesc}>
            Status: {locationStatus === PermissionStatus.GRANTED ? 'Diizinkan' : 'Belum Diizinkan'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionTitle}>📁 Penyimpanan</Text>
          <Text style={styles.permissionDesc}>
            Status: {mediaStatus === PermissionStatus.GRANTED ? 'Diizinkan' : 'Belum Diizinkan'}
          </Text>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionTitle}>👤 Kontak</Text>
          <Text style={styles.permissionDesc}>
            Status: {contactStatus === PermissionStatus.GRANTED ? 'Diizinkan' : 'Belum Diizinkan'}
          </Text>
        </View>

        <TouchableOpacity style={styles.requestBtn} onPress={requestAllPermissions}>
          <Text style={styles.requestBtnText}>Minta Semua Izin</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueBtnText}>Lanjutkan ke Aplikasi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#8E8E93', marginBottom: 32, lineHeight: 22 },
  permissionItem: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16 },
  permissionTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginBottom: 4 },
  permissionDesc: { fontSize: 14, color: '#8E8E93' },
  requestBtn: { backgroundColor: '#007AFF15', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  requestBtnText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: '#F2F2F7' },
  continueBtn: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center' },
  continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});