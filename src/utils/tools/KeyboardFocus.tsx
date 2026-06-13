import React from 'react';
import { 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet, 
  TouchableWithoutFeedback, 
  Keyboard,
  View,
  Dimensions
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface KeyboardFocusProps {
  children: React.ReactNode;
  style?: any;
}

export default function KeyboardFocus({ children, style }: KeyboardFocusProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.fullscreen, style]}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContent}>
          {children}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fullscreen: { flex: 1,width: width, height: height, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 ,},
  innerContent: { flex: 1, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', },
});