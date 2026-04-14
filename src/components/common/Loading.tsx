import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';

type LoadingProps = {
  label?: string;
  detail?: string;
  color?: string;
  secondaryColor?: string;
  textColor?: string;
  detailColor?: string;
  trackColor?: string;
  compact?: boolean;
};

export default function Loading({
  label = 'Loading...',
  detail,
  color = '#2BC8FF',
  secondaryColor = '#98D933',
  textColor = '#E8F1F7',
  detailColor = '#AFC1CF',
  trackColor = 'rgba(43, 200, 255, 0.14)',
  compact = false,
}: LoadingProps): React.JSX.Element {
  const isTestEnvironment = typeof jest !== 'undefined';
  const beam = useRef(new Animated.Value(isTestEnvironment ? 0.45 : 0)).current;

  useEffect(() => {
    if (isTestEnvironment) {
      return;
    }

    const animation = Animated.loop(
      Animated.timing(beam, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      beam.stopAnimation();
    };
  }, [beam, isTestEnvironment]);

  const beamTranslateX = beam.interpolate({
    inputRange: [0, 1],
    outputRange: [-32, 94],
  });
  const pulseA = beam.interpolate({
    inputRange: [0, 0.25, 0.5, 1],
    outputRange: [0.35, 1, 0.35, 0.35],
  });
  const pulseB = beam.interpolate({
    inputRange: [0, 0.2, 0.5, 0.8, 1],
    outputRange: [0.35, 0.35, 1, 0.35, 0.35],
  });
  const pulseC = beam.interpolate({
    inputRange: [0, 0.5, 0.75, 1],
    outputRange: [0.35, 0.35, 1, 0.35],
  });

  return (
    <View style={[styles.container, compact ? styles.containerCompact : null]}>
      <View style={[styles.loaderVisual, compact ? styles.loaderVisualCompact : null]}>
        <View style={[styles.track, {backgroundColor: trackColor}]}>
          <Animated.View
            style={[
              styles.beam,
              {
                backgroundColor: color,
                transform: [{translateX: beamTranslateX}],
              },
            ]}
          />
        </View>
        <View style={styles.nodeRow}>
          <Animated.View
            style={[
              styles.node,
              styles.nodeLeft,
              {backgroundColor: color, opacity: pulseA},
            ]}
          />
          <Animated.View
            style={[
              styles.node,
              styles.nodeCenter,
              {backgroundColor: secondaryColor, opacity: pulseB},
            ]}
          />
          <Animated.View
            style={[
              styles.node,
              styles.nodeRight,
              {backgroundColor: color, opacity: pulseC},
            ]}
          />
        </View>
      </View>
      <Text style={[styles.label, compact ? styles.labelCompact : null, {color: textColor}]}>
        {label}
      </Text>
      {detail ? <Text style={[styles.detail, {color: detailColor}]}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  containerCompact: {
    flexDirection: 'row',
    paddingVertical: 0,
  },
  loaderVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loaderVisualCompact: {
    marginBottom: 0,
    marginRight: 10,
  },
  track: {
    width: 94,
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  beam: {
    width: 32,
    height: '100%',
    borderRadius: 999,
    opacity: 0.9,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  node: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  nodeLeft: {marginRight: 8},
  nodeCenter: {marginRight: 8},
  nodeRight: {marginRight: 0},
  label: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  labelCompact: {
    fontSize: 12,
    textAlign: 'left',
  },
  detail: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
});
