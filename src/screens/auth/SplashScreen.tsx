import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {SPLASH_MIN_DISPLAY_MS} from '../../utils/constants';

type SplashScreenProps = {
  isAuthenticated?: boolean;
  minimumDisplayTimeMs?: number;
  onReady?: (isAuthenticated: boolean) => void;
};

const STATUS_CARDS = [
  {label: 'CORE_LINK', value: 'STABLE', accent: '#2BC8FF'},
  {label: 'AUTH_KEY', value: 'VERIFIED', accent: '#98D933'},
  {label: 'SYNC_RATE', value: '12.8ms', accent: '#A98747'},
  {label: 'ENC_NODE', value: 'AES-256', accent: '#43596A'},
] as const;

export default function SplashScreen({
  isAuthenticated = false,
  minimumDisplayTimeMs = SPLASH_MIN_DISPLAY_MS,
  onReady,
}: SplashScreenProps): React.JSX.Element {
  const isTestEnvironment = typeof jest !== 'undefined';
  const intro = useRef(new Animated.Value(isTestEnvironment ? 1 : 0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const chipPulse = useRef(new Animated.Value(0)).current;
  const squareBlue = useRef(new Animated.Value(0)).current;
  const squareLime = useRef(new Animated.Value(0)).current;
  const orbitSpin = useRef(new Animated.Value(0)).current;
  const scanLine = useRef(new Animated.Value(isTestEnvironment ? 0.55 : 0)).current;
  const progressShimmer = useRef(
    new Animated.Value(isTestEnvironment ? 0.8 : 0),
  ).current;

  useEffect(() => {
    if (isTestEnvironment) {
      return;
    }

    const introAnimation = Animated.timing(intro, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    const progressAnimation = Animated.timing(progress, {
      toValue: 1,
      duration: minimumDisplayTimeMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    const chipPulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(chipPulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(chipPulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const blueSquareAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(squareBlue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(squareBlue, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const limeSquareAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(squareLime, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(squareLime, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const orbitAnimation = Animated.loop(
      Animated.timing(orbitSpin, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const scanLineAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, {
          toValue: 1,
          duration: 3200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanLine, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(progressShimmer, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(progressShimmer, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    introAnimation.start();
    progressAnimation.start();
    chipPulseAnimation.start();
    blueSquareAnimation.start();
    limeSquareAnimation.start();
    orbitAnimation.start();
    scanLineAnimation.start();
    shimmerAnimation.start();

    const timer = setTimeout(() => {
      onReady?.(isAuthenticated);
    }, minimumDisplayTimeMs);

    return () => {
      clearTimeout(timer);
      intro.stopAnimation();
      progress.stopAnimation();
      chipPulse.stopAnimation();
      squareBlue.stopAnimation();
      squareLime.stopAnimation();
      orbitSpin.stopAnimation();
      scanLine.stopAnimation();
      progressShimmer.stopAnimation();
    };
  }, [
    chipPulse,
    intro,
    isAuthenticated,
    isTestEnvironment,
    minimumDisplayTimeMs,
    onReady,
    orbitSpin,
    progress,
    progressShimmer,
    scanLine,
    squareBlue,
    squareLime,
  ]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['10%', '67%'],
  });
  const pulseScale = chipPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });
  const pulseOpacity = chipPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0.52],
  });
  const blueSquareTranslateY = squareBlue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });
  const blueSquareOpacity = squareBlue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });
  const limeSquareTranslateY = squareLime.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });
  const limeSquareOpacity = squareLime.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });
  const orbitRotate = orbitSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const orbitRotateReverse = orbitSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });
  const introOpacity = intro.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const introTranslateY = intro.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });
  const logoScale = intro.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });
  const heroPanelOpacity = intro.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });
  const scanLineTranslateY = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [-180, 920],
  });
  const scanLineOpacity = scanLine.interpolate({
    inputRange: [0, 0.2, 0.5, 1],
    outputRange: [0, 0.2, 0.12, 0],
  });
  const shimmerTranslateX = progressShimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 280],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gridLayer} pointerEvents="none">
        {Array.from({length: 90}).map((_, index) => (
          <View
            key={index}
            style={[
              styles.gridDot,
              {
                left: `${(index % 9) * 12.5}%`,
                top: `${Math.floor(index / 9) * 9.3}%`,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.noiseWash} pointerEvents="none" />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.scanLine,
          {
            opacity: scanLineOpacity,
            transform: [{translateY: scanLineTranslateY}],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.secureBadge,
          {
            opacity: introOpacity,
            transform: [{translateY: introTranslateY}],
          },
        ]}>
        <View style={styles.secureBadgeIcon}>
          <View style={styles.secureBadgeDot} />
          <View style={styles.secureBadgeWaveSmall} />
          <View style={styles.secureBadgeWaveLarge} />
        </View>
        <Text style={styles.secureBadgeLabel}>SECURE_CHANNEL</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.heroArea,
          {
            opacity: heroPanelOpacity,
            transform: [{translateY: introTranslateY}],
          },
        ]}>
        <Animated.View
          style={[
            styles.floatingSquare,
            styles.floatingSquareBlue,
            {
              opacity: blueSquareOpacity,
              transform: [{translateY: blueSquareTranslateY}],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingSquare,
            styles.floatingSquareLime,
            {
              opacity: limeSquareOpacity,
              transform: [{translateY: limeSquareTranslateY}],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: introOpacity,
              transform: [{scale: logoScale}],
            },
          ]}>
          <Animated.View
            style={[
              styles.orbitSquare,
              styles.orbitSquareBlue,
              {transform: [{rotate: orbitRotate}]},
            ]}
          />
          <Animated.View
            style={[
              styles.orbitSquare,
              styles.orbitSquareLime,
              {transform: [{rotate: orbitRotateReverse}]},
            ]}
          />
          <Animated.View
            style={[
              styles.coreGlow,
              {
                opacity: pulseOpacity,
                transform: [{scale: pulseScale}],
              },
            ]}
          />
          <View style={styles.coreTile}>
            <ChipGlyph />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.wordmark,
            {
              opacity: introOpacity,
              transform: [{translateY: introTranslateY}],
            },
          ]}>
          <Text style={styles.wordmarkTitle}>
            <Text style={styles.wordmarkEmbedded}>EMBEDDED </Text>
            <Text style={styles.wordmarkShop}>SHOP</Text>
          </Text>
          <View style={styles.subtitleRow}>
            <View style={styles.subtitleLine} />
            <Text style={styles.subtitle}>INDUSTRIAL PROCUREMENT INTERFACE</Text>
            <View style={styles.subtitleLine} />
          </View>
        </Animated.View>
      </Animated.View>

      <View style={styles.metricsGrid}>
        {STATUS_CARDS.map((item, index) => {
          const start = 0.18 + index * 0.12;
          const end = Math.min(start + 0.28, 1);
          const cardOpacity = intro.interpolate({
            inputRange: [0, start, end, 1],
            outputRange: [0, 0, 1, 1],
          });
          const cardTranslateY = intro.interpolate({
            inputRange: [0, start, end, 1],
            outputRange: [16, 16, 0, 0],
          });

          return (
            <Animated.View
              key={item.label}
              style={[
                styles.metricCell,
                {
                  opacity: cardOpacity,
                  transform: [{translateY: cardTranslateY}],
                },
              ]}>
              <StatusCard label={item.label} value={item.value} accent={item.accent} />
            </Animated.View>
          );
        })}
      </View>

      <Animated.View
        style={[
          styles.footer,
          {
            opacity: introOpacity,
            transform: [{translateY: introTranslateY}],
          },
        ]}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, {width: progressWidth}]} />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.progressShimmer,
              {transform: [{translateX: shimmerTranslateX}]},
            ]}
          />
        </View>
        <View style={styles.initializingRow}>
          <View style={styles.initializingDot} />
          <Text style={styles.initializingText}>SYSTEM INITIALIZING</Text>
        </View>
        <Text style={styles.versionText}>LAB LINK EST. - CONSOLE V4.0.2</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

function ChipGlyph(): React.JSX.Element {
  return (
    <View style={styles.chipGlyphFrame}>
      <View style={styles.chipGlyphPinLeftTop} />
      <View style={styles.chipGlyphPinLeftMid} />
      <View style={styles.chipGlyphPinLeftBottom} />
      <View style={styles.chipGlyphPinRightTop} />
      <View style={styles.chipGlyphPinRightMid} />
      <View style={styles.chipGlyphPinRightBottom} />
      <View style={styles.chipGlyphPinTopLeft} />
      <View style={styles.chipGlyphPinTopMid} />
      <View style={styles.chipGlyphPinTopRight} />
      <View style={styles.chipGlyphPinBottomLeft} />
      <View style={styles.chipGlyphPinBottomMid} />
      <View style={styles.chipGlyphPinBottomRight} />
      <View style={styles.chipGlyphCore}>
        <View style={styles.chipGlyphCoreInner} />
      </View>
    </View>
  );
}

function StatusCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}): React.JSX.Element {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricAccentBar, {backgroundColor: accent}]} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, {color: accent}]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111A',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 22,
  },
  gridLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridDot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(39, 74, 94, 0.22)',
  },
  noiseWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 11, 16, 0.06)',
  },
  scanLine: {
    position: 'absolute',
    left: -30,
    right: -30,
    height: 88,
    backgroundColor: 'rgba(64, 173, 220, 0.08)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(124, 226, 255, 0.08)',
  },
  secureBadge: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(38, 57, 71, 0.75)',
    backgroundColor: 'rgba(14, 24, 34, 0.56)',
  },
  secureBadgeIcon: {
    width: 16,
    height: 12,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  secureBadgeDot: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#8FCC2E',
  },
  secureBadgeWaveSmall: {
    position: 'absolute',
    bottom: 2,
    width: 10,
    height: 6,
    borderRadius: 10,
    borderWidth: 1.4,
    borderColor: '#8FCC2E',
    borderBottomWidth: 0,
    opacity: 0.52,
  },
  secureBadgeWaveLarge: {
    position: 'absolute',
    bottom: 3,
    width: 16,
    height: 10,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#8FCC2E',
    borderBottomWidth: 0,
    opacity: 0.22,
  },
  secureBadgeLabel: {
    color: '#415261',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  heroArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 12,
  },
  floatingSquare: {
    position: 'absolute',
    width: 30,
    height: 30,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 6,
  },
  floatingSquareBlue: {
    left: '28%',
    top: '30%',
    backgroundColor: '#9FD8F7',
    shadowColor: '#67D0FF',
  },
  floatingSquareLime: {
    right: '25%',
    top: '9%',
    backgroundColor: '#8CC437',
    shadowColor: '#8CC437',
  },
  logoWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  orbitSquare: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 16,
    borderWidth: 4,
  },
  orbitSquareBlue: {
    borderColor: 'rgba(33, 141, 191, 0.28)',
  },
  orbitSquareLime: {
    borderColor: 'rgba(121, 178, 53, 0.28)',
  },
  coreGlow: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 30,
    backgroundColor: 'rgba(28, 63, 86, 0.34)',
    shadowColor: '#2BC8FF',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.25,
    shadowRadius: 28,
  },
  coreTile: {
    width: 106,
    height: 106,
    borderRadius: 20,
    backgroundColor: '#16222E',
    borderWidth: 1,
    borderColor: 'rgba(43, 81, 104, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 16},
    shadowOpacity: 0.28,
    shadowRadius: 30,
    elevation: 8,
  },
  chipGlyphFrame: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipGlyphCore: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 6,
    borderColor: '#3FD0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipGlyphCoreInner: {
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: '#8EDFFF',
  },
  chipGlyphPinLeftTop: {
    position: 'absolute',
    left: 2,
    top: 12,
    width: 10,
    height: 4,
    backgroundColor: '#3FD0FF',
  },
  chipGlyphPinLeftMid: {
    position: 'absolute',
    left: 0,
    top: 23,
    width: 12,
    height: 4,
    backgroundColor: '#3FD0FF',
  },
  chipGlyphPinLeftBottom: {
    position: 'absolute',
    left: 2,
    bottom: 12,
    width: 10,
    height: 4,
    backgroundColor: '#3FD0FF',
  },
  chipGlyphPinRightTop: {
    position: 'absolute',
    right: 2,
    top: 12,
    width: 10,
    height: 4,
    backgroundColor: '#3FD0FF',
  },
  chipGlyphPinRightMid: {
    position: 'absolute',
    right: 0,
    top: 23,
    width: 12,
    height: 4,
    backgroundColor: '#3FD0FF',
  },
  chipGlyphPinRightBottom: {
    position: 'absolute',
    right: 2,
    bottom: 12,
    width: 10,
    height: 4,
    backgroundColor: '#3FD0FF',
  },
  chipGlyphPinTopLeft: {
    position: 'absolute',
    top: 2,
    left: 12,
    width: 4,
    height: 10,
    backgroundColor: '#3FD0FF',
  },
  chipGlyphPinTopMid: {
    position: 'absolute',
    top: 0,
    left: 23,
    width: 4,
    height: 12,
    backgroundColor: '#3FD0FF',
  },
  chipGlyphPinTopRight: {
    position: 'absolute',
    top: 2,
    right: 12,
    width: 4,
    height: 10,
    backgroundColor: '#3FD0FF',
  },
  chipGlyphPinBottomLeft: {
    position: 'absolute',
    bottom: 2,
    left: 12,
    width: 4,
    height: 10,
    backgroundColor: '#3FD0FF',
  },
  chipGlyphPinBottomMid: {
    position: 'absolute',
    bottom: 0,
    left: 23,
    width: 4,
    height: 12,
    backgroundColor: '#3FD0FF',
  },
  chipGlyphPinBottomRight: {
    position: 'absolute',
    bottom: 2,
    right: 12,
    width: 4,
    height: 10,
    backgroundColor: '#3FD0FF',
  },
  wordmark: {
    alignItems: 'center',
    width: '100%',
  },
  wordmarkTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -0.6,
    textAlign: 'center',
    marginBottom: 18,
  },
  wordmarkEmbedded: {
    color: '#AEB7C3',
  },
  wordmarkShop: {
    color: '#2CB7E8',
  },
  subtitleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    flexShrink: 1,
    color: '#8FCC2E',
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
    marginHorizontal: 14,
  },
  subtitleLine: {
    flex: 1,
    maxWidth: 56,
    height: 1,
    backgroundColor: 'rgba(91, 122, 63, 0.5)',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 34,
  },
  metricCell: {
    width: '48.5%',
  },
  metricCard: {
    minHeight: 104,
    borderRadius: 16,
    backgroundColor: 'rgba(18, 28, 38, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(29, 45, 58, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 14,
    overflow: 'hidden',
  },
  metricAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  metricLabel: {
    color: '#53606C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  footer: {
    paddingBottom: 8,
    alignItems: 'center',
  },
  progressTrack: {
    width: '76%',
    height: 6,
    borderRadius: 999,
    backgroundColor: '#162634',
    overflow: 'hidden',
    marginBottom: 26,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#2C7EA3',
  },
  progressShimmer: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    width: 54,
    borderRadius: 999,
    backgroundColor: 'rgba(173, 225, 245, 0.28)',
  },
  initializingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  initializingDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: '#476F20',
    marginRight: 12,
  },
  initializingText: {
    color: '#4D5967',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  versionText: {
    color: '#263543',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
});
