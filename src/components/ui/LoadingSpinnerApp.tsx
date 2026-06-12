import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Modal, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppearance } from '@/utils/tools/AppearanceApp';

interface LoadingSpinnerProps {
  visible: boolean;
  message?: string; 
}

export default function LoadingSpinnerApp({ visible }: LoadingSpinnerProps) {
  const { accentColor, isDarkMode } = useAppearance();
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
      <View style={[
        styles.overlay, 
        { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.65)' }
      ]}>
        <Animated.View style={[{ opacity: fadeAnim }]}>
          <Animated.View style={[
            styles.spinnerWrapper, 
            { 
              transform: [{ rotate: rotation }],
              shadowColor: accentColor 
            }
          ]}>
            <Ionicons name="aperture" size={60} color={accentColor} />
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 9999, },
  spinnerWrapper: { justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 15, elevation: 15, }
});