import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Modal, Text } from 'react-native';

interface LoadingSpinnerProps {
  visible: boolean;
  message?: string;
}

export default function LoadingSpinnerApp({ visible, message = 'Memuat...' }: LoadingSpinnerProps) {
  const spinValue1 = useRef(new Animated.Value(0)).current;
  const spinValue2 = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.timing(spinValue1, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.timing(spinValue2, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      spinValue1.setValue(0);
      spinValue2.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const spin1 = spinValue1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spin2 = spinValue2.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'], 
  });

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <View style={styles.spinnerContainer}>
            <Animated.View style={[styles.circle, styles.circle1, { transform: [{ rotate: spin1 }] }]} />
            <Animated.View style={[styles.circle, styles.circle2, { transform: [{ rotate: spin2 }] }]} />
          </View>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 9999, },
  container: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 20, alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10, minWidth: 160, },
  spinnerContainer: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 16, },
  circle: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 4, borderColor: 'transparent', },
  circle1: { borderTopColor: '#007AFF', borderRightColor: '#007AFF', opacity: 0.8, },
  circle2: { width: 44, height: 44, borderRadius: 22, borderBottomColor: '#FF2D55', borderLeftColor: '#FF2D55', },
  message: { fontSize: 15, fontWeight: '600', color: '#333333', letterSpacing: 0.5, },
});