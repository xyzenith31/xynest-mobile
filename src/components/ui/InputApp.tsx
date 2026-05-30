import React, { useState, useRef } from 'react';
import { View, TextInput, StyleSheet, Animated, TextInputProps, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputAppProps extends TextInputProps {
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  prefix?: string;
  onLeftIconPress?: () => void;
}

export default function InputApp({ iconName, iconColor = '#007AFF', prefix, onLeftIconPress, ...props }: InputAppProps) {
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(scaleAnim, { toValue: 1.01, useNativeDriver: true }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const hasValue = props.value !== undefined && props.value.length > 0;

  return (
    <Animated.View style={[
      styles.container, 
      isFocused && styles.focused, 
      { transform: [{ scale: scaleAnim }] }
    ]}>
      
      {iconName && (
        <TouchableOpacity 
          disabled={!onLeftIconPress} 
          onPress={onLeftIconPress} 
          activeOpacity={onLeftIconPress ? 0.7 : 1}
          style={styles.iconWrapper}
        >
          <Ionicons name={iconName} size={20} color={iconColor} style={styles.icon} />
        </TouchableOpacity>
      )}
      
      {prefix && hasValue && <Text style={styles.prefixText}>{prefix}</Text>}
      
      <TextInput
        style={styles.input}
        placeholderTextColor="#8E8E93"
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: 12,
  },
  focused: {
    borderColor: '#007AFF',
    backgroundColor: '#FFF',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  prefixText: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: 'bold',
    marginRight: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    paddingVertical: 0, 
  }
});