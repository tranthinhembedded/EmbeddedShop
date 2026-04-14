import React from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Stack, Text} from '../../design-system';

const {width} = Dimensions.get('window');
const CONTENT_MAX_WIDTH = Math.min(width - 48, 420);

function BackgroundBlobs() {
  return (
    <>
      <View style={styles.blobTopRight} pointerEvents="none" />
      <View style={styles.blobBottomLeft} pointerEvents="none" />
      <View style={styles.blobCenterRight} pointerEvents="none" />
    </>
  );
}

function GlassCard({children}: {children: React.ReactNode}) {
  return <View style={styles.glassCard}>{children}</View>;
}

type AuthScaffoldProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showDemoCredentials?: boolean;
};

export function AuthScaffold({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  showDemoCredentials = true,
}: AuthScaffoldProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <BackgroundBlobs />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}>
          <View style={styles.contentShell}>
            <View style={styles.brandWrapper}>
              <Image
                source={require('../../../icons/logo.webp')}
                style={styles.logoImage}
              />
              <View style={styles.brandLabel}>
                <Text style={styles.brandName}>EmbeddedShop</Text>
              </View>
            </View>

            <View style={styles.headingWrapper}>
              {eyebrow ? <Text style={styles.eyebrowText}>{eyebrow}</Text> : null}
              <Text style={styles.titleText}>{title}</Text>
              {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
            </View>

            <GlassCard>{children}</GlassCard>

            {showDemoCredentials ? (
              <View style={styles.demoCard}>
                <Text style={styles.demoLabel}>SEEDED DEMO ACCOUNTS</Text>
                <View style={styles.demoRow}>
                  <View style={styles.demoPill}>
                    <Text style={styles.demoPillRole}>Admin</Text>
                    <Text style={styles.demoPillInfo}>
                      admin@embeddedshop.app · EmbeddedShop123
                    </Text>
                  </View>
                  <View style={[styles.demoPill, styles.demoPillSecondary]}>
                    <Text style={[styles.demoPillRole, styles.demoPillRoleSecondary]}>
                      Member
                    </Text>
                    <Text style={styles.demoPillInfo}>
                      demo@embeddedshop.app · Demo1234
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {footer ? <View style={styles.footerWrapper}>{footer}</View> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthRememberRow({
  checked,
  onChange,
  forgotLabel = 'Forgot password?',
  onForgotPress,
  error,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  forgotLabel?: string;
  onForgotPress?: () => void;
  error?: string;
}): React.JSX.Element {
  return (
    <Stack direction="horizontal" align="center" justify="between" gap="sm">
      <Pressable style={styles.rememberToggle} onPress={() => onChange(!checked)}>
        <View
          style={[
            styles.rememberCheckbox,
            checked ? styles.rememberCheckboxChecked : null,
            error ? styles.rememberCheckboxError : null,
          ]}>
          {checked ? <View style={styles.rememberCheckboxDot} /> : null}
        </View>

        <Text style={styles.rememberLabel}>Remember me</Text>
      </Pressable>

      {onForgotPress ? (
        <Pressable onPress={onForgotPress} style={styles.forgotButton}>
          <Text style={styles.forgotLabel}>{forgotLabel}</Text>
        </Pressable>
      ) : null}

      {error ? (
        <View style={styles.rememberErrorWrap}>
          <Text variant="caption" color="error" weight="medium">
            {error}
          </Text>
        </View>
      ) : null}
    </Stack>
  );
}

export function AuthSwitchLink({
  prompt,
  actionLabel,
  onPress,
}: {
  prompt: string;
  actionLabel: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Stack direction="horizontal" align="center" justify="center" gap="sm">
      <Text style={styles.switchPrompt}>{prompt}</Text>
      <Pressable hitSlop={10} onPress={onPress} style={styles.switchActionButton}>
        <Text style={styles.switchActionLabel}>{actionLabel}</Text>
      </Pressable>
    </Stack>
  );
}

const BRAND_CYAN = '#41D7FF';
const BRAND_LIME = '#B7FF5A';
const NAVY_950 = '#07111A';
const NAVY_800 = '#1F3240';
const MUTED = '#7D96AA';

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: NAVY_950,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
  },
  contentShell: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  blobTopRight: {
    position: 'absolute',
    top: -48,
    right: -44,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#41D7FF14',
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: 80,
    left: -72,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#0E86FF12',
  },
  blobCenterRight: {
    position: 'absolute',
    top: '42%',
    right: -42,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#B7FF5A0D',
  },
  brandWrapper: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 18,
    gap: 10,
  },
  logoImage: {
    width: 68,
    height: 68,
    borderRadius: 18,
  },
  brandLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E8F3FF',
    letterSpacing: -0.3,
  },
  headingWrapper: {
    marginBottom: 18,
    gap: 6,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '800',
    color: BRAND_CYAN,
    letterSpacing: 1.2,
  },
  titleText: {
    fontSize: 25,
    fontWeight: '700',
    color: '#E8F3FF',
    letterSpacing: -0.6,
  },
  subtitleText: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
  },
  glassCard: {
    backgroundColor: '#0F1F2DE8',
    borderWidth: 1,
    borderColor: NAVY_800,
    borderRadius: 22,
    padding: 20,
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 10,
  },
  demoCard: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: NAVY_800,
    backgroundColor: '#0C1821C8',
    padding: 14,
    gap: 8,
  },
  demoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 1.1,
  },
  demoRow: {
    gap: 8,
  },
  demoPill: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#41D7FF2E',
    backgroundColor: '#123B49AA',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  demoPillSecondary: {
    borderColor: '#B7FF5A2E',
    backgroundColor: '#20361AAA',
  },
  demoPillRole: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND_CYAN,
    marginBottom: 2,
  },
  demoPillRoleSecondary: {
    color: BRAND_LIME,
  },
  demoPillInfo: {
    fontSize: 12,
    color: MUTED,
  },
  footerWrapper: {
    marginTop: 14,
    alignSelf: 'center',
  },
  switchPrompt: {
    fontSize: 14,
    color: MUTED,
  },
  switchActionButton: {
    minHeight: 36,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchActionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_CYAN,
  },
  forgotButton: {
    paddingHorizontal: 0,
  },
  rememberToggle: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1F3A50',
    backgroundColor: '#112333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberCheckboxChecked: {
    borderColor: BRAND_CYAN,
    backgroundColor: '#123B49',
  },
  rememberCheckboxError: {
    borderColor: '#FF6B7C',
  },
  rememberCheckboxDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND_CYAN,
  },
  rememberLabel: {
    marginLeft: 12,
    color: '#E8F3FF',
    fontSize: 15,
    fontWeight: '600',
  },
  forgotLabel: {
    color: BRAND_CYAN,
    fontSize: 14,
    fontWeight: '600',
  },
  rememberErrorWrap: {
    width: '100%',
  },
});
