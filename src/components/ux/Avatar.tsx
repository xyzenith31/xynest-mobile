import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface AvatarProps {
  url?: string | null;
  name?: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ url, name = 'User Name', size = 100 }) => {
  const getInitials = (fullName: string) => {
    if (!fullName) return 'UN';
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    } else {
      return nameParts[0].substring(0, Math.min(2, nameParts[0].length)).toUpperCase();
    }
  };

  const initials = getInitials(name);
  const defaultUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=256`;
  const imageSource = url && url.startsWith('http') ? { uri: url } : { uri: defaultUrl };

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image
        source={imageSource}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});