import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { DonationService } from '@/services/DonationService';
import { useAppearance } from '@/utils/tools/AppearanceApp';
import { useLanguage } from '@/utils/tools/LanguageApp';
import { donationDict } from '@/utils/language/DonationScreenAppLanguage';
import LoadingSpinnerApp from '@/components/ui/LoadingSpinnerApp';
import NotificationInteractive, { NotificationType, NotificationButton } from '@/components/ui/NotificationInteractiveApp';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, 
  RefreshControl, Modal, LayoutAnimation, Platform, UIManager, 
  Pressable, ScrollView
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

const PREDEFINED_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];

export default function DonationScreenApp() {
  const router = useRouter();
  const { theme, isDarkMode, accentColor } = useAppearance();
  const { language } = useLanguage();
  const t = donationDict[language] || donationDict['id'];
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifConfig, setNotifConfig] = useState({ 
    title: '', 
    message: '', 
    type: 'info' as NotificationType, 
    buttons: [] as NotificationButton[] 
  });

  const showNotif = (title: string, message: string, type: NotificationType, action?: () => void, isDanger?: boolean) => {
    setNotifConfig({
      title, message, type,
      buttons: [{ 
        text: t.okBtn, 
        style: isDanger ? 'danger' : 'default', 
        onPress: () => { setNotifVisible(false); if(action) action(); } 
      }]
    });
    setNotifVisible(true);
  };

  const fetchHistory = useCallback(async () => {
    try {
      const data = await DonationService.getDonationHistory();
      setDonations(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const switchTab = (tab: 'new' | 'history') => {
    if (activeTab === tab) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const toggleQuickAmount = (val: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (selectedQuickAmount === val) {
      setSelectedQuickAmount(null); 
    } else {
      setSelectedQuickAmount(val);
      setAmount(''); 
    }
  };

  const handleAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue) {
      setAmount(new Intl.NumberFormat('id-ID').format(parseInt(numericValue, 10)));
    } else {
      setAmount('');
    }
  };

  const handleSubmit = async () => {
    const nominal = selectedQuickAmount || parseInt(amount.replace(/[^0-9]/g, ''), 10);
    if (!nominal || nominal <= 0) {
      showNotif(t.invalidAmount, t.invalidDesc, 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const response = await DonationService.createDonationRequest({
        amount: nominal,
        message: message.trim() || (selectedQuickAmount ? 'Dukungan' : ''),
      });

      if (response.success && response.redirect_url) {
        setPaymentUrl(response.redirect_url);
        setAmount('');
        setMessage('');
        setSelectedQuickAmount(null);
      } else {
        showNotif(t.failed, response.message || t.failed, 'error');
      }
    } catch (error) {
      showNotif(t.failConnect, t.failConnectDesc, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWebViewClose = () => {
    setPaymentUrl(null);
    fetchHistory();
    showNotif(t.payUnfinishedTitle, t.payUnfinishedMsg, 'warning');
  };

  const handleShouldStartLoad = (request: any) => {
    const { url } = request;
    if (url.includes('transaction_status=settlement') || url.includes('transaction_status=capture')) {
      setPaymentUrl(null); 
      fetchHistory();
      switchTab('history');
      showNotif(t.paySuccessTitle, t.paySuccessMsg, 'success');
      return false; 
    }
    return true; 
  };

  const handleDelete = (id: string) => {
    setNotifConfig({
      title: t.deleteHistory, 
      message: t.deleteConfirm, 
      type: 'warning',
      buttons: [
        { text: t.cancel, style: 'cancel', onPress: () => setNotifVisible(false) },
        { text: t.delete, style: 'danger', onPress: async () => {
            setNotifVisible(false);
            setLoading(true);
            try {
              await DonationService.deleteDonation(id);
              fetchHistory();
            } catch (error) {
              setLoading(false);
              showNotif(t.failed, t.failed, 'error');
            }
          }
        }
      ]
    });
    setNotifVisible(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success': return '#34C759';
      case 'pending': return '#FF9500';
      case 'failed': return '#FF3B30';
      default: return theme.subText;
    }
  };

  const renderDonationItem = ({ item }: { item: DonationItem }) => (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <View style={[styles.iconBox, { backgroundColor: `${accentColor}15` }]}>
            <Ionicons name="gift-outline" size={20} color={accentColor} />
          </View>
          <View>
            <Text style={[styles.amountText, { color: theme.text }]}>{formatCurrency(item.amount)}</Text>
            <Text style={[styles.dateText, { color: theme.subText }]}>
              {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      {item.message ? (
        <View style={[styles.messageBubble, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7' }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.subText} style={{ marginRight: 8 }} />
          <Text style={[styles.messageText, { color: theme.text }]}>{item.message}</Text>
        </View>
      ) : null}

      <View style={[styles.cardActions, { borderTopColor: theme.border }]}>
        <Text style={[styles.orderIdText, { color: theme.subText }]}>ID: {item.order_id}</Text>
        
        <View style={styles.actionButtons}>
          {item.status.toLowerCase() === 'pending' && item.payment_url && (
            <TouchableOpacity onPress={() => setPaymentUrl(item.payment_url)} style={[styles.payBtn, { backgroundColor: accentColor }]}>
              <Text style={styles.payBtnText}>{t.pay}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.deleteBtn, { backgroundColor: '#FF3B3015' }]}>
            <Ionicons name="trash" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.5 : 1 }]}>
          <Ionicons name="arrow-back" size={24} color={accentColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabWrapper}>
        <View style={[styles.segmentedControl, { backgroundColor: isDarkMode ? '#1C1C1E' : '#E5E5EA' }]}>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === 'new' && { backgroundColor: theme.surface, shadowColor: '#000', elevation: 2 }]} 
            onPress={() => switchTab('new')}>
            <Text style={[styles.segmentText, { color: activeTab === 'new' ? theme.text : theme.subText }]}>{t.newDonation}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === 'history' && { backgroundColor: theme.surface, shadowColor: '#000', elevation: 2 }]} 
            onPress={() => switchTab('history')}>
            <Text style={[styles.segmentText, { color: activeTab === 'history' ? theme.text : theme.subText }]}>{t.history}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {activeTab === 'new' ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
            
            <View style={[styles.heroBox, { backgroundColor: `${accentColor}12`, borderColor: `${accentColor}30` }]}>
              <Ionicons name="heart" size={32} color={accentColor} style={styles.heroIcon} />
              <Text style={[styles.heroTitle, { color: theme.text }]}>{t.heroTitle}</Text>
              <Text style={[styles.heroSub, { color: theme.subText }]}>{t.heroSub}</Text>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.quickAmount}</Text>
            
            <View style={styles.gridContainer}>
              {PREDEFINED_AMOUNTS.map((val) => {
                const isSelected = selectedQuickAmount === val;
                return (
                  <TouchableOpacity 
                    key={val} 
                    style={[
                      styles.gridItem, 
                      { backgroundColor: theme.surface, borderColor: theme.border },
                      isSelected && { backgroundColor: accentColor, borderColor: accentColor }
                    ]}
                    onPress={() => toggleQuickAmount(val)}
                  >
                    <Text style={[styles.gridItemText, { color: isSelected ? '#FFFFFF' : accentColor }]}>
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val).replace('Rp', '').trim()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedQuickAmount === null && (
              <View>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.customAmount}</Text>
                
                <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.currencyPrefix, { color: theme.text }]}>Rp</Text>
                  <TextInput
                    style={[styles.inputField, { color: theme.text }]}
                    placeholder="0"
                    placeholderTextColor={theme.subText}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={handleAmountChange}
                  />
                </View>
              </View>
            )}

            <View style={[styles.inputWrapper, styles.textAreaWrapper, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: selectedQuickAmount ? 16 : 0 }]}>
              <TextInput
                style={[styles.inputField, styles.textArea, { color: theme.text }]}
                placeholder={t.message}
                placeholderTextColor={theme.subText}
                multiline
                numberOfLines={3}
                value={message}
                onChangeText={setMessage}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: accentColor }]} 
              onPress={handleSubmit}
            >
               <Text style={styles.submitBtnText}>
                 {selectedQuickAmount ? `Donasi ${formatCurrency(selectedQuickAmount)}` : t.donateNow}
               </Text>
            </TouchableOpacity>

          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              data={donations}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderDonationItem}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHistory(); }} tintColor={accentColor} />}
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.emptyContainer}>
                    <View style={[styles.emptyIconBox, { backgroundColor: `${accentColor}15` }]}>
                      <Ionicons name="receipt-outline" size={40} color={accentColor} />
                    </View>
                    <Text style={[styles.emptyText, { color: theme.subText }]}>{t.emptyHistory}</Text>
                  </View>
                ) : null
              }
            />
          </View>
        )}
      </View>

      <LoadingSpinnerApp visible={loading || submitting} />
      
      <NotificationInteractive 
        visible={notifVisible} 
        title={notifConfig.title} 
        message={notifConfig.message} 
        type={notifConfig.type} 
        buttons={notifConfig.buttons} 
        onDismiss={() => setNotifVisible(false)} 
      />

      <Modal visible={!!paymentUrl} animationType="slide" transparent={false}>
        <SafeAreaView edges={['top', 'bottom']} style={[styles.webviewContainer, { backgroundColor: theme.bg }]}>
          <View style={[styles.webviewHeader, { borderBottomColor: theme.border, backgroundColor: theme.bg }]}>
            <TouchableOpacity style={styles.closeIconBtn} onPress={handleWebViewClose}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>
          {paymentUrl && (
            <WebView
              source={{ uri: paymentUrl }}
              onShouldStartLoadWithRequest={handleShouldStartLoad}
              style={{ flex: 1, backgroundColor: theme.bg }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={[styles.loadingOverlay, { backgroundColor: theme.bg }]}>
                  <LoadingSpinnerApp visible={true} />
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 12, paddingHorizontal: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  tabWrapper: { paddingHorizontal: 16, marginBottom: 16 },
  segmentedControl: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segmentText: { fontSize: 14, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  formContainer: { paddingBottom: 40 },
  heroBox: { padding: 18, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 24 },
  heroIcon: { marginBottom: 8 },
  heroTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  heroSub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12, marginLeft: 4 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', paddingVertical: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  gridItemText: { fontSize: 16, fontWeight: '700' },
  divider: { height: 1, width: '100%', marginVertical: 16 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, marginBottom: 12, height: 54 },
  currencyPrefix: { fontSize: 16, fontWeight: '600', marginRight: 8 },
  inputField: { flex: 1, fontSize: 16, paddingVertical: 0 },
  textAreaWrapper: { height: 'auto', paddingVertical: 12 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  listContainer: { paddingBottom: 40, paddingTop: 4 },
  card: { padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardInfo: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  amountText: { fontSize: 18, fontWeight: '800' },
  dateText: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  messageBubble: { flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 16, alignItems: 'flex-start' },
  messageText: { fontSize: 13, flex: 1, lineHeight: 18 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 14 },
  actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  payBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  payBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  orderIdText: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  deleteBtn: { padding: 8, borderRadius: 8 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyText: { textAlign: 'center', fontSize: 14, lineHeight: 22 },
  webviewContainer: { flex: 1 },
  webviewHeader: { padding: 12, paddingHorizontal: 16, borderBottomWidth: 1, alignItems: 'flex-end' },
  closeIconBtn: { padding: 4 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }
});