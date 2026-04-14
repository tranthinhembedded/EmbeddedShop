import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';

import {Product} from '../catalog';
import {getProductImageSource} from '../productImages';
import {ThemeTokens} from '../theme';

const alpha = (hex: string, value: number) => {
  const clean = hex.replace('#', '');
  const expanded =
    clean.length === 3
      ? clean
          .split('')
          .map(character => `${character}${character}`)
          .join('')
      : clean;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${value})`;
};

type HardwareGlyphProps = {
  product: Pick<Product, 'accent' | 'code' | 'id' | 'name' | 'panel'>;
  theme: ThemeTokens;
  size?: number;
};

export function HardwareGlyph({
  product,
  size = 152,
  theme,
}: HardwareGlyphProps): React.JSX.Element {
  const traceColor = alpha(product.accent, 0.26);
  const chipShadow = alpha(product.accent, 0.34);
  const shellColor = alpha(product.accent, 0.1);
  const portColor = alpha(theme.text, 0.22);
  const imageSource = getProductImageSource(product.id);
  const radius = Math.max(12, Math.round(size * 0.18));

  if (imageSource) {
    return (
      <View
        style={[
          styles.imageShell,
          {
            width: size,
            height: size,
            borderRadius: radius,
            padding: Math.max(4, Math.round(size * 0.06)),
          },
        ]}>
        <Image source={imageSource} style={styles.image} resizeMode="contain" />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.shell,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderColor: shellColor,
          backgroundColor: product.panel,
        },
      ]}>
      <View style={[styles.corner, styles.cornerTopLeft, {backgroundColor: theme.text}]} />
      <View style={[styles.corner, styles.cornerTopRight, {backgroundColor: theme.text}]} />
      <View style={[styles.corner, styles.cornerBottomLeft, {backgroundColor: theme.text}]} />
      <View style={[styles.corner, styles.cornerBottomRight, {backgroundColor: theme.text}]} />

      <View style={[styles.traceHorizontal, {top: size * 0.22, backgroundColor: traceColor}]} />
      <View style={[styles.traceHorizontal, {top: size * 0.7, backgroundColor: traceColor}]} />
      <View style={[styles.traceVertical, {left: size * 0.2, backgroundColor: traceColor}]} />
      <View style={[styles.traceVertical, {left: size * 0.76, backgroundColor: traceColor}]} />

      <View
        style={[
          styles.port,
          styles.portLeft,
          {top: size * 0.18, backgroundColor: portColor},
        ]}
      />
      <View
        style={[
          styles.port,
          styles.portRight,
          {top: size * 0.18, backgroundColor: portColor},
        ]}
      />
      <View
        style={[
          styles.portWide,
          styles.portWideLeft,
          {backgroundColor: portColor},
        ]}
      />
      <View
        style={[
          styles.portWide,
          styles.portWideRight,
          {backgroundColor: portColor},
        ]}
      />

      <View
        style={[
          styles.chip,
          {
            width: size * 0.46,
            height: size * 0.46,
            backgroundColor: product.accent,
            shadowColor: chipShadow,
          },
        ]}>
        <Text style={styles.code}>{product.code}</Text>
      </View>

      <View style={[styles.labelStrip, {backgroundColor: alpha(theme.bg, 0.4)}]}>
        <Text numberOfLines={1} style={[styles.label, {color: theme.text}]}>
          {product.name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageShell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  shell: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 18,
    height: 2,
    opacity: 0.6,
  },
  cornerTopLeft: {
    top: 10,
    left: 10,
  },
  cornerTopRight: {
    top: 10,
    right: 10,
  },
  cornerBottomLeft: {
    bottom: 10,
    left: 10,
  },
  cornerBottomRight: {
    bottom: 10,
    right: 10,
  },
  traceHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  traceVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  chip: {
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.36,
    shadowRadius: 18,
    elevation: 6,
  },
  code: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
    color: '#07111A',
  },
  port: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  portLeft: {
    left: 12,
  },
  portRight: {
    right: 12,
  },
  portWide: {
    position: 'absolute',
    width: 34,
    height: 12,
    borderRadius: 4,
  },
  portWideLeft: {
    left: 14,
    bottom: 18,
  },
  portWideRight: {
    right: 14,
    bottom: 18,
  },
  labelStrip: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
