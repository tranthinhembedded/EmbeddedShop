import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type DimensionValue,
  type ViewProps,
} from 'react-native';

type LoadingSkeletonProps = ViewProps & {
  width?: DimensionValue;
  height?: number;
  rounded?: number;
};

export default function LoadingSkeleton({
  width = '100%',
  height = 16,
  rounded = 12,
  style,
  ...props
}: LoadingSkeletonProps): React.JSX.Element {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      shimmer.stopAnimation();
    };
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View
      {...props}
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius: rounded,
        },
        style,
      ]}>
      <Animated.View
        style={[
          styles.beam,
          {
            transform: [{translateX}],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    backgroundColor: 'rgba(148, 163, 184, 0.16)',
  },
  beam: {
    width: 120,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
});
