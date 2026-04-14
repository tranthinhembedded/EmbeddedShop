import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
};

export default function Button({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
}: ButtonProps): React.JSX.Element {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        variant === 'primary'
          ? styles.primary
          : variant === 'secondary'
            ? styles.secondary
            : styles.ghost,
        disabled && styles.disabled,
      ]}>
      <Text style={[styles.label, variant === 'ghost' ? styles.ghostLabel : styles.filledLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#2BC8FF',
  },
  secondary: {
    backgroundColor: '#173041',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#29455B',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
  },
  filledLabel: {
    color: '#061018',
  },
  ghostLabel: {
    color: '#F4F7FA',
  },
});
