import React from 'react';
import {StyleSheet, Text, TextInput, TextInputProps, View} from 'react-native';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export default function Input({
  label,
  error,
  style,
  ...props
}: InputProps): React.JSX.Element {
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        placeholderTextColor="#6F879B"
        style={[styles.input, style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: '#AFC1CF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#29455B',
    backgroundColor: '#102130',
    color: '#F4F7FA',
    paddingHorizontal: 14,
    fontSize: 14,
  },
  error: {
    color: '#FF6B7C',
    fontSize: 12,
    marginTop: 6,
  },
});
