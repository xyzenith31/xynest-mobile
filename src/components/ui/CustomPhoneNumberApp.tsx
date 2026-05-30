import React, { useState, useCallback, memo } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomSelectApp, { SelectOption } from './CustomSelectApp';

interface Props {
  countryCode: string;
  setCountryCode: (code: string) => void;
  phoneNumber: string;
  setPhoneNumber: (num: string) => void;
}

const COUNTRY_CODES: SelectOption[] = [
  { label: '🇮🇩 +62', value: '62', iconName: 'location', iconColor: '#FF2D55' },
  { label: '🇻🇳 +84', value: '84', iconName: 'location', iconColor: '#FF9500' },
  { label: '🇹🇭 +66', value: '66', iconName: 'location', iconColor: '#5856D6' },
  { label: '🇸🇬 +65', value: '65', iconName: 'location', iconColor: '#34C759' },
  { label: '🇨🇳 +86', value: '86', iconName: 'location', iconColor: '#FF3B30' },
  { label: '🇯🇵 +81', value: '81', iconName: 'location', iconColor: '#007AFF' },
];

const CustomPhoneNumberApp = ({ countryCode, setCountryCode, phoneNumber, setPhoneNumber }: Props) => {
  const [isFocused, setIsFocused] = useState(false);
  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  const handlePhoneChange = useCallback((text: string) => {
    let clean = text.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = clean.substring(1); 
    setPhoneNumber(clean);
  }, [setPhoneNumber]);

  return (
    <View style={[styles.container, isFocused && styles.focused]}>
      <Ionicons name="call" size={20} color={isFocused ? "#007AFF" : "#34C759"} style={styles.icon} />
      
      <CustomSelectApp
        options={COUNTRY_CODES}
        selectedValue={countryCode}
        onSelect={setCountryCode}
        placeholder="+62"
        compact={true}
      />

      <View style={styles.divider} />

      <TextInput
        style={styles.input}
        placeholder="81234567890"
        placeholderTextColor="#8E8E93"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={handlePhoneChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </View>
  );
};

export default memo(CustomPhoneNumberApp);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 25, paddingHorizontal: 18, paddingVertical: 12,borderWidth: 1.5, borderColor: 'transparent', marginBottom: 12 },
  focused: { borderColor: '#007AFF', backgroundColor: '#FFF' },
  icon: { marginRight: 12 },
  divider: { width: 1, height: 20, backgroundColor: '#C7C7CC', marginHorizontal: 16 },
  input: { flex: 1, fontSize: 15, color: '#1C1C1E', paddingVertical: 0 }
});