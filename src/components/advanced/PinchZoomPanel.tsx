import React, {useRef, useState} from 'react';
import {Animated, StyleSheet, View} from 'react-native';

export default function PinchZoomPanel({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const scale = useRef(new Animated.Value(1)).current;
  const [baseDistance, setBaseDistance] = useState<number | null>(null);

  const getDistance = (touches: ReadonlyArray<{pageX: number; pageY: number}>) => {
    if (touches.length < 2) {
      return null;
    }

    const [first, second] = touches;
    const dx = second.pageX - first.pageX;
    const dy = second.pageY - first.pageY;

    return Math.sqrt(dx * dx + dy * dy);
  };

  return (
    <View
      onMoveShouldSetResponder={event => event.nativeEvent.touches.length >= 2}
      onResponderGrant={event => {
        const distance = getDistance(event.nativeEvent.touches);
        setBaseDistance(distance);
      }}
      onResponderMove={event => {
        const distance = getDistance(event.nativeEvent.touches);

        if (!distance || !baseDistance) {
          return;
        }

        const nextScale = Math.max(1, Math.min(2.4, distance / baseDistance));
        scale.setValue(nextScale);
      }}
      onResponderRelease={() => {
        setBaseDistance(null);

        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 18,
          bounciness: 8,
        }).start();
      }}
      style={styles.container}>
      <Animated.View style={{transform: [{scale}]}}>{children}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
