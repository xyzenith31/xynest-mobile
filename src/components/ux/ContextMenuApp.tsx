import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function ContextMenuApp() {
  const [isVisible, setIsVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const toggleMenu = () => {
    if (isVisible) {
      closeMenu();
    } else {
      setIsVisible(true);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 80,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const closeMenu = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 80,   
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 80,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      if (callback) callback();
    });
  };

  const handleNavigation = (path: string) => {
    closeMenu(() => {
      router.push(path as any);
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleMenu} style={styles.triggerButton} activeOpacity={0.5}>
        <Ionicons name="ellipsis-vertical" size={26} color="#1C1C1E" />
      </TouchableOpacity>

      {isVisible && (
        <TouchableWithoutFeedback onPress={() => closeMenu()}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      <Animated.View
        style={[
          styles.menuContainer,
          {
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }
            ],
          },
        ]}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('/screens/auth/LoginQRCodeScreenApp')}>
          <Ionicons name="qr-code-outline" size={20} color="#007AFF" style={styles.icon} />
          <Text style={styles.menuText}>Login via QR Code</Text>
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <TouchableOpacity style={styles.menuItem} onPress={() => closeMenu()}>
          <Ionicons name="help-circle-outline" size={22} color="#34C759" style={styles.icon} />
          <Text style={styles.menuText}>Bantuan</Text>
        </TouchableOpacity>

        <View style={styles.divider} />
        
        <TouchableOpacity style={styles.menuItem} onPress={() => closeMenu()}>
          <Ionicons name="alert-circle-outline" size={22} color="#FF3B30" style={styles.icon} />
          <Text style={styles.menuText}>Keluhan</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, right: 0, zIndex: 999 },
  triggerButton: { padding: 10, backgroundColor: 'transparent' },
  overlay: { position: 'absolute', top: -100, right: -100, width, height },
  menuContainer: { position: 'absolute', top: 40, right: 10, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 8, width: 200, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  icon: { marginRight: 12 },
  menuText: { fontSize: 15, color: '#1C1C1E', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 16 }
});