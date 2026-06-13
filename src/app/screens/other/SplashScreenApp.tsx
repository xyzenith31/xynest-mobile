import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text, Animated as RNAnimated } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppearance } from '../../../utils/tools/AppearanceApp';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function SplashScreenApp() {
  const { theme, accentColor, isDarkMode } = useAppearance();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const pageOpacity = useSharedValue(1);
  const spinnerOpacity = useSharedValue(0);
  const rotateAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    scale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });

    const spinnerTimer = setTimeout(() => {
      spinnerOpacity.value = withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) });
      RNAnimated.loop(
        RNAnimated.timing(rotateAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
      ).start();
    }, 400);

    const timer = setTimeout(() => {
      pageOpacity.value = withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) }, (isFinished) => {
        if (isFinished) {
          runOnJS(navigateToNextPage)();
        }
      });
    }, 3000); 

    return () => {
      clearTimeout(spinnerTimer);
      clearTimeout(timer);
      rotateAnim.stopAnimation();
    };
  }, []);

  const navigateToNextPage = () => {
    console.log("Navigating to next page...");
  };

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const animatedPageStyle = useAnimatedStyle(() => ({
    opacity: pageOpacity.value,
  }));

  const spinnerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: spinnerOpacity.value,
  }));

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.bg }, animatedPageStyle]}>
      <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
        <Image
          source={require('../../../../assets/mylogo.png')} 
          style={styles.logo}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </Animated.View>

      <View style={styles.bottomSection}>
        <Animated.View style={[spinnerAnimatedStyle, styles.spinnerContainer]}>
          <RNAnimated.View 
            style={[styles.spinnerWrapper, { transform: [{ rotate: rotation }], shadowColor: accentColor }]}
          >
            <Ionicons name="aperture" size={32} color={accentColor} />
          </RNAnimated.View>
        </Animated.View>

        <Animated.View style={[styles.copyrightContainer, animatedLogoStyle]}>
          <Text style={[styles.copyrightText, { color: theme.subText }]}>
            © 2026 Copyright by Sambat Corporation
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  logo: { width: width * 0.28, height: width * 0.28 },
  bottomSection: { position: 'absolute', bottom: 40, alignItems: 'center', width: '100%' },
  spinnerContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 28 }, // Jarak diperbesar agar agak ke atas
  spinnerWrapper: { justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 15, elevation: 15 },
  copyrightContainer: { alignItems: 'center', width: '100%' },
  copyrightText: { fontSize: 12, fontWeight: '500', textAlign: 'center' }
});