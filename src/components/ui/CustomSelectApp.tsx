import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';

export interface SelectOption {
  label: string;
  value: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

interface CustomSelectAppProps {
  options: SelectOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  compact?: boolean;
}

export default function CustomSelectApp({ options, selectedValue, onSelect, placeholder, iconName = 'list', iconColor = '#FF9500', compact = false }: CustomSelectAppProps) {
  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  const handleSelect = (val: string) => {
    onSelect(val);
    closeModal();
  };

  const selectedLabel = options.find(o => o.value === selectedValue)?.label;

  return (
    <>
      <TouchableOpacity 
        style={[styles.trigger, compact && styles.triggerCompact]} 
        onPress={openModal} 
        activeOpacity={0.8}
      >
        {(!compact && iconName) && <Ionicons name={iconName} size={20} color={iconColor} style={styles.triggerIcon} />}
        <Text style={[styles.triggerText, compact && styles.triggerTextCompact, !selectedLabel && styles.placeholderText]} numberOfLines={1}>
          {selectedLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#8E8E93" />
      </TouchableOpacity>

      <Modal
        isVisible={visible}
        onBackdropPress={closeModal}
        onSwipeComplete={closeModal}
        swipeDirection={['down']}
        swipeThreshold={50}
        propagateSwipe={true}
        backdropTransitionOutTiming={0}
        animationInTiming={300}
        animationOutTiming={300}
        style={styles.modal}
      >
        <View style={styles.bottomSheet}>
          <View style={styles.dragIndicatorWrapper}>
            <View style={styles.dragIndicator} />
          </View>

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Pilih {placeholder}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((item) => (
              <TouchableOpacity key={item.value} style={styles.optionItem} onPress={() => handleSelect(item.value)}>
                <View style={styles.optionLeft}>
                  {item.iconName && (
                    <Ionicons name={item.iconName} size={24} color={item.iconColor || '#1C1C1E'} style={styles.optionIcon} />
                  )}
                  <Text style={[styles.optionText, item.value === selectedValue && styles.selectedOptionText]}>
                    {item.label}
                  </Text>
                </View>
                {item.value === selectedValue && <Ionicons name="checkmark-circle" size={24} color="#007AFF" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
  },
  triggerCompact: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginBottom: 0,
  },
  triggerIcon: { marginRight: 10 },
  triggerText: { flex: 1, fontSize: 15, color: '#1C1C1E' },
  triggerTextCompact: { flex: 0, marginRight: 4, fontSize: 15, fontWeight: '500' },
  placeholderText: { color: '#8E8E93' },
  modal: {
    justifyContent: 'flex-end',
    margin: 0, 
  },
  bottomSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '80%', 
  },
  dragIndicatorWrapper: { alignItems: 'center', paddingTop: 12, paddingBottom: 16 },
  dragIndicator: { width: 40, height: 5, backgroundColor: '#D1D1D6', borderRadius: 3 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  optionLeft: { flexDirection: 'row', alignItems: 'center' },
  optionIcon: { marginRight: 12 },
  optionText: { fontSize: 16, color: '#1C1C1E' },
  selectedOptionText: { color: '#007AFF', fontWeight: 'bold' }
});