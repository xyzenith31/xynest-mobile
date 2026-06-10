import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Modal, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LoadingSpinnerProps {
  visible: boolean;
  message?: string; 
}

export default function LoadingSpinnerApp({ visible }: LoadingSpinnerProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: 250, 
        useNativeDriver: true 
      }).start();

      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        })
      ).start();
    } else {
      Animated.timing(fadeAnim, { 
        toValue: 0, 
        duration: 200, 
        useNativeDriver: true 
      }).start();
      rotateAnim.stopAnimation();
    }
  }, [visible]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.spinnerWrapper, { opacity: fadeAnim, transform: [{ rotate: rotation }] }]}>
          <Ionicons name="aperture" size={54} color="#007AFF" />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.15)', justifyContent: 'center', alignItems: 'center', zIndex: 9999, },
  spinnerWrapper: { justifyContent: 'center', alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 15, elevation: 10, }
});