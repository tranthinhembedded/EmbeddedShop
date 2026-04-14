import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

export default function ProductScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Product Screen</Text>
      <Text style={styles.caption}>Reserved for product-specific screens in the next phase.</Text>
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
