import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

export default function ProfileScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Screen</Text>
      <Text style={styles.caption}>Reserved for dedicated account flows and settings screens.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#07111A',
  },
  title: {
    color: '#F4F7FA',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  caption: {
    color: '#8CA1B3',
    fontSize: 14,
    textAlign: 'center',
  },
});
