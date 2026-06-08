import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AppLayout from '../../layouts/AppLayout';
import { DonationService } from '@/services/DonationService';

interface DonationItem {
  id: string;
  order_id: string;
  amount: number;
  message: string;
  status: string;
  full_name: string;
  payment_url: string;
  created_at: string;
}

export default function DonationScreenApp() {
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await DonationService.getDonationHistory();
      setDonations(data || []);
    } catch (error) {
      console.error("Gagal memuat riwayat donasi:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const handleCreateDonation = async () => {
    const nominal = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    
    if (!nominal || nominal <= 0) {
      Alert.alert('Nominal Tidak Valid', 'Silakan masukkan jumlah nominal donasi yang sesuai');
      return;
    }

    setSubmitting(true);
    try {
      const response = await DonationService.createDonationRequest({
        amount: nominal,
        message: message.trim(),
      });

      if (response.success && response.redirect_url) {
        setPaymentUrl(response.redirect_url);
        setAmount('');
        setMessage('');
      } else {
        Alert.alert('Gagal', response.message || 'Gagal memproses donasi.');
      }
    } catch (error) {
      Alert.alert('Koneksi Gagal', 'Pastikan Anda terhubung ke internet.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShouldStartLoad = (request: any) => {
    const { url } = request;
    if (url.includes('example.com') || url.includes('transaction_status=settlement') || url.includes('transaction_status=capture')) {
      setPaymentUrl(null); 
      setLoading(true);
      fetchHistory(); 
      return false; 
    }
    return true; 
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Hapus Riwayat", "Apakah Anda yakin ingin menghapus riwayat donasi ini?",
      [
        { text: "Batal", style: "cancel" },
        { text: "Hapus", style: "destructive", onPress: async () => {
            try {
              await DonationService.deleteDonation(id);
              fetchHistory();
            } catch (error) {
              Alert.alert('Gagal', 'Gagal menghapus riwayat donasi.');
            }
          }
        }
      ]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success': return '#34C759';
      case 'pending': return '#FF9500';
      case 'failed': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const renderDonationItem = ({ item }: { item: DonationItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.nameText}>{item.full_name || 'Hamba Allah'}</Text>
          <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      {item.message ? (
        <Text style={styles.messageText}>"{item.message}"</Text>
      ) : null}

      <View style={styles.cardActions}>
        <Text style={styles.orderIdText}>ID: {item.order_id}</Text>
        
        {/* ACTION BUTTONS (Bayar & Hapus) */}
        <View style={styles.actionButtons}>
          {item.status.toLowerCase() === 'pending' && item.payment_url ? (
            <TouchableOpacity 
              onPress={() => setPaymentUrl(item.payment_url)} 
              style={styles.payBtn}
            >
              <Text style={styles.payBtnText}>Bayar</Text>
            </TouchableOpacity>
          ) : null}
          
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );

  return (
    <>
      <AppLayout title="Dukungan & Donasi" scrollable={false}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Buat Donasi Baru</Text>
          <TextInput
            style={styles.input}
            placeholder="Nominal Donasi"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Pesan dukungan (Opsional)"
            multiline
            numberOfLines={3}
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity 
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} 
            onPress={handleCreateDonation}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Donasi Sekarang</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Riwayat Donasi</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={donations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderDonationItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Belum ada riwayat donasi.</Text>
            }
          />
        )}
      </AppLayout>

      <Modal visible={!!paymentUrl} animationType="slide" transparent={false}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.webviewContainer}>
          <View style={styles.webviewHeader}>
            <TouchableOpacity style={styles.closeIconBtn} onPress={() => { setPaymentUrl(null); fetchHistory(); }}>
              <Ionicons name="close" size={28} color="#1C1C1E" />
            </TouchableOpacity>
          </View>
          {paymentUrl && (
            <WebView
              source={{ uri: paymentUrl }}
              onShouldStartLoadWithRequest={handleShouldStartLoad}
              style={{ flex: 1 }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  formContainer: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 12 },
  input: { backgroundColor: '#F2F2F7', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 12, color: '#1C1C1E' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#A1C6EA' },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  listContainer: { paddingBottom: 40, paddingTop: 8 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  nameText: { fontSize: 14, color: '#007AFF', fontWeight: '600', marginBottom: 4 },
  amountText: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  dateText: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  messageText: { fontSize: 14, color: '#3A3A3C', fontStyle: 'italic', marginBottom: 12, backgroundColor: '#F2F2F7', padding: 10, borderRadius: 8 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F2F2F7', paddingTop: 12 },
  actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  payBtn: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  payBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  orderIdText: { fontSize: 11, color: '#C7C7CC' },
  deleteBtn: { padding: 4 },
  emptyText: { textAlign: 'center', color: '#8E8E93', marginTop: 32, fontSize: 14 },
  webviewContainer: { flex: 1, backgroundColor: '#FFF' },
  webviewHeader: { padding: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7', alignItems: 'flex-end', justifyContent: 'center' },
  closeIconBtn: { padding: 4, backgroundColor: '#F2F2F7', borderRadius: 20 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }
});