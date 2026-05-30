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
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const [isRendered, setIsRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 60,
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
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
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
            <Ionicons name={iconConfig.name as any} size={28} color={iconConfig.color} />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDanger = btn.style === 'danger';
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.buttonCapsule, 
                    isCancel ? styles.buttonCancel : isDanger ? styles.buttonDanger : styles.buttonDefault,
                    buttons.length > 1 && { flex: 1, marginHorizontal: 6 }
                  ]}
                  onPress={btn.onPress}
                  activeOpacity={0.75}
                >
                  <Text style={[
                    styles.buttonText, 
                    isCancel && styles.buttonTextCancel,
                    isDanger && styles.buttonTextDanger
                  ]}>
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
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)', },
  dialogContainer: { width: '80%', maxWidth: 320, backgroundColor: '#FFFFFF', borderRadius: 28, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 10, },
  iconWrapper: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 16, },
  title: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 8, textAlign: 'center', letterSpacing: -0.3, },
  message: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginBottom: 24, lineHeight: 20, paddingHorizontal: 4, },
  buttonContainer: { flexDirection: 'row', justifyContent: 'center', width: '100%', },
  buttonCapsule: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999, alignItems: 'center', justifyContent: 'center', minWidth: 110, },
  buttonDefault: { backgroundColor: '#007AFF', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3, },
  buttonCancel: { backgroundColor: '#F2F2F7', },
  buttonDanger: { backgroundColor: '#FFECEB', },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', },
  buttonTextCancel: { color: '#3A3A3C', },
  buttonTextDanger: { color: '#FF3B30', }
});