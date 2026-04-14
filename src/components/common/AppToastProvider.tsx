import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useUIStore} from '../../store/uiStore';

const toneColors = {
  info: {
    background: '#102434',
    border: '#2B8AE6',
    title: '#F3F9FF',
    body: '#BFD7F3',
  },
  success: {
    background: '#10291C',
    border: '#2F9E5A',
    title: '#F2FFF5',
    body: '#B7E6C6',
  },
  warning: {
    background: '#312212',
    border: '#D4832F',
    title: '#FFF9F2',
    body: '#FFDDB5',
  },
  error: {
    background: '#351723',
    border: '#D44B60',
    title: '#FFF5F7',
    body: '#F5B6C0',
  },
} as const;

function ToastCard({
  toastId,
  title,
  message,
  tone,
  index,
}: {
  toastId: string;
  title: string;
  message?: string;
  tone: keyof typeof toneColors;
  index: number;
}): React.JSX.Element {
  const dismissToast = useUIStore(state => state.dismissToast);
  const translateY = useRef(new Animated.Value(-24)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const colors = toneColors[tone];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 18,
        bounciness: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.toastCard,
        {
          marginTop: index === 0 ? 0 : 10,
          backgroundColor: colors.background,
          borderColor: colors.border,
          opacity,
          transform: [{translateY}],
        },
      ]}>
      <View style={styles.toastCopy}>
        <Text style={[styles.toastTitle, {color: colors.title}]}>{title}</Text>
        {message ? (
          <Text style={[styles.toastMessage, {color: colors.body}]}>{message}</Text>
        ) : null}
      </View>

      <Pressable onPress={() => dismissToast(toastId)} style={styles.dismissButton}>
        <Text style={[styles.dismissLabel, {color: colors.title}]}>Close</Text>
      </Pressable>
    </Animated.View>
  );
}

export function AppToastProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const toasts = useUIStore(state => state.toasts);
  const dismissToast = useUIStore(state => state.dismissToast);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timers = toasts.map(toast =>
      setTimeout(() => {
        dismissToast(toast.id);
      }, toast.durationMs),
    );

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [dismissToast, toasts]);

  return (
    <>
      {children}
      <View
        pointerEvents="box-none"
        style={[styles.overlay, {paddingTop: Math.max(insets.top, 12)}]}>
        {toasts.map((toast, index) => (
          <ToastCard
            key={toast.id}
            toastId={toast.id}
            title={toast.title}
            message={toast.message}
            tone={toast.tone}
            index={index}
          />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  toastCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowOffset: {width: 0, height: 10},
    shadowRadius: 18,
    elevation: 6,
  },
  toastCopy: {
    flex: 1,
    marginRight: 10,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  toastMessage: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  dismissButton: {
    minHeight: 34,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
});
