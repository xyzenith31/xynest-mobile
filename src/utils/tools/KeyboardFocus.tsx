import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface KeyboardFocusProps {
  children: React.ReactNode;
  offset?: number;
  style?: StyleProp<ViewStyle>;
}

export default function KeyboardFocus({ children, offset = 10, style }: KeyboardFocusProps) {
  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? offset : 20}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});