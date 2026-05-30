import React, { useState, useCallback, useRef, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Animated, PanResponder, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

const CustomSelectApp = ({ 
  options, selectedValue, onSelect, placeholder, 
  iconName = 'list', iconColor = '#FF9500', compact = false 
}: CustomSelectAppProps) => {
  const [visible, setVisible] = useState(false);
  
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const openModal = useCallback(() => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true })
    ]).start();
  }, [translateY, opacity]);

  const closeModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start(() => setVisible(false));
  }, [translateY, opacity]);

  const handleSelect = useCallback((val: string) => {
    onSelect(val);
    closeModal();
  }, [onSelect, closeModal]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 1.2) {
          closeModal();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      }
    })
  ).current;

  const selectedLabel = options.find(o => o.value === selectedValue)?.label;

  return (
    <>
      <TouchableOpacity style={[styles.trigger, compact && styles.triggerCompact]} onPress={openModal} activeOpacity={0.7}>
        {(!compact && iconName) && <Ionicons name={iconName} size={20} color={iconColor} style={styles.triggerIcon} />}
        <Text style={[styles.triggerText, compact && styles.triggerTextCompact, !selectedLabel && styles.placeholderText]} numberOfLines={1}>
          {selectedLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#8E8E93" />
      </TouchableOpacity>

      <Modal visible={visible} transparent={true} animationType="none" onRequestClose={closeModal} hardwareAccelerated={true}>
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={closeModal}>
            <Animated.View style={[styles.backdrop, { opacity }]} />
          </TouchableWithoutFeedback>

          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
            <View {...panResponder.panHandlers} style={styles.dragArea}>
              <View style={styles.dragIndicatorWrapper}>
                <View style={styles.dragIndicator} />
              </View>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Pilih {placeholder}</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {options.map((item) => (
                <TouchableOpacity key={item.value} style={styles.optionItem} onPress={() => handleSelect(item.value)}>
                  <View style={styles.optionLeft}>
                    {item.iconName && <Ionicons name={item.iconName} size={24} color={item.iconColor || '#1C1C1E'} style={styles.optionIcon} />}
                    <Text style={[styles.optionText, item.value === selectedValue && styles.selectedOptionText]}>{item.label}</Text>
                  </View>
                  {item.value === selectedValue && <Ionicons name="checkmark-circle" size={24} color="#007AFF" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

export default memo(CustomSelectApp);

const styles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 12 },
  triggerCompact: { backgroundColor: 'transparent', paddingHorizontal: 0, paddingVertical: 0, marginBottom: 0 },
  triggerIcon: { marginRight: 10 },
  triggerText: { flex: 1, fontSize: 15, color: '#1C1C1E' },
  triggerTextCompact: { flex: 0, marginRight: 8, fontSize: 15, fontWeight: '500' },
  placeholderText: { color: '#8E8E93' },
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  bottomSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  dragArea: { paddingHorizontal: 24, backgroundColor: 'transparent' }, 
  dragIndicatorWrapper: { alignItems: 'center', paddingTop: 12, paddingBottom: 16 },
  dragIndicator: { width: 40, height: 5, backgroundColor: '#D1D1D6', borderRadius: 3 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  optionLeft: { flexDirection: 'row', alignItems: 'center' },
  optionIcon: { marginRight: 12 },
  optionText: { fontSize: 16, color: '#1C1C1E' },
  selectedOptionText: { color: '#007AFF', fontWeight: 'bold' }
});