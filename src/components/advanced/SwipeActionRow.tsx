import React, {useMemo, useRef} from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type SwipeAction = {
  label: string;
  tone: 'info' | 'success' | 'warning' | 'error';
  onPress: () => void;
};

export default function SwipeActionRow({
  children,
  actions,
}: {
  children: React.ReactNode;
  actions: SwipeAction[];
}): React.JSX.Element {
  const translateX = useRef(new Animated.Value(0)).current;

  const maxSwipe = Math.min(actions.length * 86, 240);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dy) < 18,
        onPanResponderMove: (_, gestureState) => {
          const nextX = Math.max(-maxSwipe, Math.min(0, gestureState.dx));
          translateX.setValue(nextX);
        },
        onPanResponderRelease: (_, gestureState) => {
          const shouldOpen = gestureState.dx < -48;

          Animated.spring(translateX, {
            toValue: shouldOpen ? -maxSwipe : 0,
            useNativeDriver: true,
            speed: 18,
            bounciness: 8,
          }).start();
        },
      }),
    [maxSwipe, translateX],
  );

  return (
    <View style={styles.container}>
      <View style={styles.actionsRow}>
        {actions.map(action => (
          <Pressable
            key={action.label}
            onPress={() => {
              action.onPress();
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
                speed: 18,
                bounciness: 8,
              }).start();
            }}
            style={[
              styles.actionButton,
              action.tone === 'info'
                ? styles.infoAction
                : action.tone === 'success'
                  ? styles.successAction
                  : action.tone === 'warning'
                    ? styles.warningAction
                    : styles.errorAction,
            ]}>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.swipeSurface,
          {
            transform: [{translateX}],
          },
        ]}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 18,
  },
  actionsRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoAction: {
    backgroundColor: '#2B8AE6',
  },
  successAction: {
    backgroundColor: '#2F9E5A',
  },
  warningAction: {
    backgroundColor: '#D4832F',
  },
  errorAction: {
    backgroundColor: '#D44B60',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  swipeSurface: {
    backgroundColor: '#0F1F2D',
  },
});
