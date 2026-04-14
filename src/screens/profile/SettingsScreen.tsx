import React from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {useLogoutMutation} from '../../hooks/useAuthMutations';
import type {RootStackParamList} from '../../navigation/types';
import {useAuthStore} from '../../store/authStore';
import {useShopApp} from '../../store/shopAppContext';
import {CONTROL_ROOM_THEME, WORKBENCH_THEME} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

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

function MetricCard({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: typeof CONTROL_ROOM_THEME;
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.metricCard,
        {
          backgroundColor: alpha(theme.panelAlt, 0.9),
          borderColor: alpha(theme.border, 0.9),
        },
      ]}>
      <Text style={[styles.metricValue, {color: theme.text}]}>{value}</Text>
      <Text style={[styles.metricLabel, {color: theme.textMuted}]}>{label}</Text>
    </View>
  );
}

function SettingRow({
  title,
  description,
  value,
  onValueChange,
  theme,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  theme: typeof CONTROL_ROOM_THEME;
}): React.JSX.Element {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, {color: theme.text}]}>{title}</Text>
        <Text style={[styles.settingDescription, {color: theme.textMuted}]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{false: alpha(theme.border, 0.8), true: theme.accent}}
        thumbColor={theme.surface}
      />
    </View>
  );
}

export default function SettingsScreen({
  navigation,
}: Props): React.JSX.Element {
  const authUser = useAuthStore(state => state.user);
  const logoutMutation = useLogoutMutation();
  const {
    dark,
    setDark,
    notifications,
    setNotifications,
    favorites,
    cart,
    orders,
  } = useShopApp();
  const theme = dark ? CONTROL_ROOM_THEME : WORKBENCH_THEME;

  return (
    <SafeAreaView style={[styles.safeArea, {backgroundColor: theme.bg}]}>
      <StatusBar
        backgroundColor={theme.bg}
        barStyle={dark ? 'light-content' : 'dark-content'}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[
              styles.backButton,
              {
                backgroundColor: alpha(theme.panelAlt, 0.92),
                borderColor: alpha(theme.border, 0.92),
              },
            ]}>
            <Text style={[styles.backButtonLabel, {color: theme.text}]}>Back</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              navigation.navigate('MainTabs', {
                screen: 'Profile',
              })
            }>
            <Text style={[styles.linkLabel, {color: theme.accent}]}>Profile</Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: alpha(theme.panel, 0.96),
              borderColor: alpha(theme.border, 0.94),
            },
          ]}>
          <Text style={[styles.eyebrow, {color: theme.accent}]}>SETTINGS</Text>
          <Text style={[styles.title, {color: theme.text}]}>
            Control room preferences
          </Text>
          <Text style={[styles.body, {color: theme.textMuted}]}>
            Adjust the visual mode and order updates without changing the current
            shopping flow.
          </Text>
          {authUser ? (
            <Text style={[styles.sessionText, {color: theme.textMuted}]}>
              Signed in as {authUser.fullName} ({authUser.email})
            </Text>
          ) : null}
        </View>

        <View style={styles.metricsRow}>
          <MetricCard label="Favorites" value={`${favorites.length}`} theme={theme} />
          <MetricCard
            label="Cart items"
            value={`${cart.reduce((sum, item) => sum + item.quantity, 0)}`}
            theme={theme}
          />
          <MetricCard label="Orders" value={`${orders.length}`} theme={theme} />
        </View>

        <View
          style={[
            styles.panel,
            {
              backgroundColor: alpha(theme.panel, 0.96),
              borderColor: alpha(theme.border, 0.94),
            },
          ]}>
          <SettingRow
            title="Control-room theme"
            description="Switch between dark control room and light workbench."
            value={dark}
            onValueChange={() => setDark(previous => !previous)}
            theme={theme}
          />
          <View
            style={[
              styles.divider,
              {backgroundColor: alpha(theme.border, 0.7)},
            ]}
          />
          <SettingRow
            title="Order notifications"
            description="Receive dispatch updates for boards and lab assemblies."
            value={notifications}
            onValueChange={setNotifications}
            theme={theme}
          />
        </View>

        <Pressable
          onPress={() => navigation.navigate('OrderHistory', {tab: 'profile'})}
          style={[
            styles.primaryButton,
            {backgroundColor: theme.accent},
          ]}>
          <Text style={styles.primaryButtonLabel}>Open order history</Text>
        </Pressable>

        <View style={styles.actionStack}>
          <Pressable
            onPress={() => navigation.navigate('ProductManager')}
            style={[
              styles.secondaryButton,
              {
                backgroundColor: alpha(theme.panelAlt, 0.92),
                borderColor: alpha(theme.border, 0.92),
              },
            ]}>
            <Text style={[styles.secondaryButtonLabel, {color: theme.text}]}>
              Open product manager
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('AdvancedLab', {tab: 'profile'})}
            style={[
              styles.secondaryButton,
              {
                backgroundColor: alpha(theme.panelAlt, 0.92),
                borderColor: alpha(theme.border, 0.92),
              },
            ]}>
            <Text style={[styles.secondaryButtonLabel, {color: theme.text}]}>
              Open advanced lab
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Diagnostics')}
            style={[
              styles.secondaryButton,
              {
                backgroundColor: alpha(theme.panelAlt, 0.92),
                borderColor: alpha(theme.border, 0.92),
              },
            ]}>
            <Text style={[styles.secondaryButtonLabel, {color: theme.text}]}>
              Open diagnostics
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('PostsExam')}
            style={[
              styles.secondaryButton,
              {
                backgroundColor: alpha(theme.panelAlt, 0.92),
                borderColor: alpha(theme.border, 0.92),
              },
            ]}>
            <Text style={[styles.secondaryButtonLabel, {color: theme.text}]}>
              Open posts exam
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('MapExam')}
            style={[
              styles.secondaryButton,
              {
                backgroundColor: alpha(theme.panelAlt, 0.92),
                borderColor: alpha(theme.border, 0.92),
              },
            ]}>
            <Text style={[styles.secondaryButtonLabel, {color: theme.text}]}>
              Open map exam
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('AIChatExam')}
            style={[
              styles.secondaryButton,
              {
                backgroundColor: alpha(theme.panelAlt, 0.92),
                borderColor: alpha(theme.border, 0.92),
              },
            ]}>
            <Text style={[styles.secondaryButtonLabel, {color: theme.text}]}>
              Open AI Chat
            </Text>
          </Pressable>

          <Pressable
            onPress={async () => {
              await logoutMutation.mutateAsync();
              navigation.replace('Auth');
            }}
            style={[
              styles.secondaryButton,
              logoutMutation.isPending ? styles.secondaryButtonDisabled : null,
              {
                backgroundColor: alpha(theme.panelAlt, 0.92),
                borderColor: alpha(theme.border, 0.92),
              },
            ]}>
            <Text style={[styles.secondaryButtonLabel, {color: theme.text}]}>
              {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1},
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  backButtonLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  sessionText: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  panel: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  settingCopy: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonLabel: {
    color: '#061018',
    fontSize: 16,
    fontWeight: '900',
  },
  actionStack: {
    gap: 12,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonDisabled: {
    opacity: 0.7,
  },
  secondaryButtonLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
});
