import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../../navigation/types';
import {CONTROL_ROOM_THEME} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'NotFound'>;

export default function NotFoundScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>NOT FOUND</Text>
        <Text style={styles.title}>The route does not exist.</Text>
        <Text style={styles.body}>
          {route.params?.path
            ? `Unmatched path: ${route.params.path}`
            : 'The requested path could not be resolved.'}
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => navigation.replace('MainTabs')}>
          <Text style={styles.buttonLabel}>Return to storefront</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CONTROL_ROOM_THEME.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  eyebrow: {
    color: CONTROL_ROOM_THEME.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 12,
  },
  title: {
    color: CONTROL_ROOM_THEME.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    marginBottom: 12,
  },
  body: {
    color: CONTROL_ROOM_THEME.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    marginTop: 24,
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CONTROL_ROOM_THEME.accent,
  },
  buttonLabel: {
    color: '#061018',
    fontSize: 15,
    fontWeight: '900',
  },
});
