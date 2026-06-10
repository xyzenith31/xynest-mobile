import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Easing, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'danger';
}

interface NotificationInteractiveProps {
  visible: boolean;
  title: string;
  message: string;
  type?: NotificationType;
  buttons: NotificationButton[];
  onDismiss?: () => void;
}

const { width } = Dimensions.get('window');

export default function NotificationInteractive({
  visible,
  title,
  message,
  type = 'info',
  buttons,
  onDismiss,
}: NotificationInteractiveProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isRendered, setIsRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true })
      ]).start(() => setIsRendered(false));
    }
  }, [visible]);

  if (!isRendered) return null;

  const getIconConfig = () => {
    switch (type) {
      case 'success': return { name: 'checkmark-circle', color: '#34C759', bg: '#E8F8EE' };
      case 'error': return { name: 'close-circle', color: '#FF3B30', bg: '#FFEBEA' };
      case 'warning': return { name: 'warning', color: '#FFCC00', bg: '#FFF9E5' };
      case 'info': default: return { name: 'information-circle', color: '#007AFF', bg: '#E5F1FF' };
    }
  };

  const icon = getIconConfig();

  return (
    <Modal transparent visible={isRendered} animationType="none" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.dialog, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          
          <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
            <Ionicons name={icon.name as any} size={36} color={icon.color} />
          </View>

          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          
          <ScrollView style={styles.messageScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.message}>{message}</Text>
          </ScrollView>

          <View style={styles.buttonContainer}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDanger = btn.style === 'danger';
              return (
                <TouchableOpacity 
                  key={index} 
                  activeOpacity={0.7}
                  style={[
                    styles.button, 
                    isCancel ? styles.btnCancel : isDanger ? styles.btnDanger : styles.btnDefault
                  ]} 
                  onPress={btn.onPress}
                >
                  <Text 
                    style={[styles.buttonText, isCancel ? styles.textCancel : styles.textDefault]}
                    numberOfLines={1}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  dialog: { width: Math.min(width * 0.82, 310), backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 10 },
  iconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 8, textAlign: 'center', letterSpacing: -0.4 },
  messageScroll: { maxHeight: 100, width: '100%', marginBottom: 18 },
  message: { fontSize: 13, color: '#8E8E93', textAlign: 'center', lineHeight: 18 },
  buttonContainer: { flexDirection: 'row', width: '100%', gap: 8, justifyContent: 'center', alignItems: 'center' },
  button: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 999, alignItems: 'center', justifyContent: 'center', minHeight: 40 },
  btnDefault: { backgroundColor: '#007AFF' },
  btnDanger: { backgroundColor: '#FF3B30' },
  btnCancel: { backgroundColor: '#F2F2F7' },
  buttonText: { fontSize: 13, fontWeight: '600', letterSpacing: -0.2, textAlign: 'center'}, textDefault: { color: '#FFFFFF' }, textCancel: { color: '#8E8E93' },
});