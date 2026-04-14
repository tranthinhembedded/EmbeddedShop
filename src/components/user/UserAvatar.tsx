import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type UserAvatarProps = {
  label: string;
  size?: number;
};

export default function UserAvatar({
  label,
  size = 40,
}: UserAvatarProps): React.JSX.Element {
  return (
    <View style={[styles.avatar, {width: size, height: size, borderRadius: size / 2}]}>
      <Text style={styles.label}>{label.slice(0, 2).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#173041',
  },
  label: {
    color: '#F4F7FA',
    fontSize: 14,
    fontWeight: '800',
  },
});
