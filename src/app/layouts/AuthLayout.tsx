import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, LogBox, Animated, PanResponder, Dimensions, Easing, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Modal from 'react-native-modal';
import ContextMenuApp from '@/components/ux/ContextMenuApp';
import KeyboardFocus from '@/utils/tools/KeyboardFocus';

LogBox.ignoreLogs([
  'InteractionManager has been deprecated',
  'fetch failed',
  'DateTimePicker'
]);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  slideDirection?: 'left' | 'right' | 'none'; 
  isExiting?: boolean;                        
  onExitComplete?: () => void;                
  isModalVisible?: boolean;
  onCloseModal?: () => void;
  modalContent?: React.ReactNode;
}

export default function AuthLayout({ 
  children, title, subtitle, 
  slideDirection = 'none', 
  isExiting = false, onExitComplete, 
  isModalVisible = false, onCloseModal, modalContent 
}: AuthLayoutProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const startX = slideDirection === 'right' ? SCREEN_WIDTH : slideDirection === 'left' ? -SCREEN_WIDTH : 0;
  const panX = useRef(new Animated.Value(startX)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (slideDirection !== 'right') return false;
        return gestureState.dx > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          panX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 80 || gestureState.vx > 0.8) {
          Animated.timing(panX, {
            toValue: SCREEN_WIDTH,
            duration: 250,
            easing: Easing.out(Easing.poly(4)),
            useNativeDriver: true
          }).start(() => {
            if (onExitComplete) onExitComplete();
            else if (router.canGoBack()) router.back();
            else router.replace('/screens/auth/LoginScreenApp');
          });
        } else {
          Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 3,
            speed: 15
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(panX, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  useEffect(() => {
    if (isExiting) {
      const exitX = slideDirection === 'right' ? SCREEN_WIDTH : slideDirection === 'left' ? -SCREEN_WIDTH : 0;
      Animated.timing(panX, {
        toValue: exitX,
        duration: 250,
        easing: Easing.out(Easing.poly(4)),
        useNativeDriver: true
      }).start(() => {
        if (onExitComplete) onExitComplete();
      });
    }
  }, [isExiting]);

  return (
    <View style={styles.rootWrapper} pointerEvents="box-none">
      <Animated.View 
        style={[
          styles.cardContainer, 
          { 
            opacity: fadeAnim, 
            transform: [{ translateX: panX }],
            paddingTop: insets.top,
            paddingBottom: insets.bottom
          }
        ]} 
        {...panResponder.panHandlers}
      >
        
        <View style={{ position: 'absolute', top: Math.max(insets.top, 10) + 4, right: 4, zIndex: 999 }}>
          <ContextMenuApp />
        </View>

        <KeyboardFocus offset={Platform.OS === 'ios' ? 10 : 0}>
          <ScrollView 
            contentContainerStyle={styles.scroll} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoContainer}>
              <Image source={require('@/assets/mylogo.png')} style={styles.logo} resizeMode="contain" />
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            {children}
          </ScrollView>
        </KeyboardFocus>
        
        <View style={styles.footer}>
          <Text style={styles.copyrightText}>© 2026 Copyright by Sambat Corporation</Text>
        </View>
      </Animated.View>

      <Modal 
        isVisible={isModalVisible} 
        onBackdropPress={onCloseModal} 
        onBackButtonPress={onCloseModal} 
        animationIn="fadeIn" 
        animationOut="fadeOut" 
        useNativeDriver 
        hideModalContentWhileAnimating
      >
        {modalContent}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rootWrapper: { flex: 1, backgroundColor: 'transparent' },
  cardContainer: { flex: 1, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 },
  scroll: { paddingHorizontal: 24, paddingVertical: 16, justifyContent: 'center', flexGrow: 1 },
  logoContainer: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  logo: { width: 80, height: 80 },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', color: '#1C1C1E', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 20 },
  footer: { paddingVertical: 16, alignItems: 'center', backgroundColor: '#FFFFFF' },
  copyrightText: { fontSize: 12, color: '#C7C7CC', fontWeight: '500' }
});