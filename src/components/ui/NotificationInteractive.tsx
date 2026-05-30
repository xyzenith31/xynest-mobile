import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.exp),
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 9,
          tension: 45,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsRendered(false);
      });
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!isRendered) return null;
  
  const getIconConfig = () => {
    switch (type) {
      case 'success': 
        return { name: 'checkmark-outline', color: '#34C759', bg: '#EAF9ED' };
      case 'error': 
        return { name: 'close-outline', color: '#FF3B30', bg: '#FFECEB' };
      case 'warning': 
        return { name: 'warning-outline', color: '#FF9500', bg: '#FFF4E5' };
      default: 
        return { name: 'information-outline', color: '#007AFF', bg: '#E5F1FF' };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Modal transparent visible={isRendered} animationType="none" onRequestClose={onDismiss}>
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        
        <Animated.View style={[
          styles.dialogContainer, 
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
        ]}>
          
          <View style={[styles.iconWrapper, { backgroundColor: iconConfig.bg }]}>
            <Ionicons name={iconConfig.name as any} size={32} color={iconConfig.color} />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.buttonCapsule, 
                    isCancel ? styles.buttonCancel : styles.buttonDefault,
                    buttons.length > 1 && { flex: 1, marginHorizontal: 6 }
                  ]}
                  onPress={btn.onPress}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.buttonText, isCancel && styles.buttonTextCancel]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 9999, },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', },
  dialogContainer: { width: '85%', maxWidth: 360, backgroundColor: '#FFFFFF', borderRadius: 40, paddingHorizontal: 28, paddingTop: 32, paddingBottom: 28, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 15, },
  iconWrapper: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 20, },
  title: { fontSize: 20, fontWeight: '800', color: '#1C1C1E', marginBottom: 10, textAlign: 'center', letterSpacing: -0.5, },
  message: { fontSize: 15, color: '#8E8E93', textAlign: 'center', marginBottom: 28, lineHeight: 22, paddingHorizontal: 10, },
  buttonContainer: { flexDirection: 'row', justifyContent: 'center', width: '100%', },
  buttonCapsule: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center', minWidth: 120, },
  buttonDefault: { backgroundColor: '#007AFF', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4, },
  buttonCancel: { backgroundColor: '#F2F2F7' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3, },
  buttonTextCancel: { color: '#1C1C1E' },
});