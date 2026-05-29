import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface QRCodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export default function QRCodeScanner({ visible, onClose, onScan }: QRCodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!visible) return null;

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.center}>
          <Text style={styles.text}>Aplikasi membutuhkan izin kamera untuk memindai QR.</Text>
          <TouchableOpacity style={styles.btn} onPress={requestPermission}>
            <Text style={styles.btnText}>Izinkan Kamera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={onClose}>
            <Text style={[styles.btnText, styles.textCancel]}>Batal</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={({ data }) => {
            onScan(data);
          }}
        />
        
        <View style={styles.overlay}>
          <View style={styles.scanBox} />
          <Text style={styles.instruction}>Arahkan kamera ke QR Code di Web/Desktop</Text>
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Tutup Pemindai</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');
const boxSize = width * 0.7;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { textAlign: 'center', marginBottom: 20, fontSize: 16 },
  btn: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  btnCancel: { backgroundColor: '#F2F2F7' },
  textCancel: { color: '#FF3B30' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  scanBox: { width: boxSize, height: boxSize, borderWidth: 2, borderColor: '#007AFF', backgroundColor: 'transparent', borderRadius: 12 },
  instruction: { color: '#FFF', marginTop: 20, fontSize: 16, fontWeight: '600' },
  closeBtn: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#FF3B30', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 30 },
  closeBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});