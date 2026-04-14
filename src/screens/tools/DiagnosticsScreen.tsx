import React, {useMemo} from 'react';
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

import {useRenderMetric} from '../../hooks/useRenderMetric';
import type {RootStackParamList} from '../../navigation/types';
import {useMonitorStore} from '../../store/monitorStore';
import {useShopApp} from '../../store/shopAppContext';
import {useUIStore} from '../../store/uiStore';
import {CONTROL_ROOM_THEME, WORKBENCH_THEME} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Diagnostics'>;

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

function StatCard({
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
        styles.statCard,
        {
          backgroundColor: alpha(theme.panelAlt, 0.92),
          borderColor: alpha(theme.border, 0.88),
        },
      ]}>
      <Text style={[styles.statValue, {color: theme.text}]}>{value}</Text>
      <Text style={[styles.statLabel, {color: theme.textMuted}]}>{label}</Text>
    </View>
  );
}

function SectionCard({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: typeof CONTROL_ROOM_THEME;
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: alpha(theme.panel, 0.96),
          borderColor: alpha(theme.border, 0.92),
        },
      ]}>
      <Text style={[styles.sectionTitle, {color: theme.text}]}>{title}</Text>
      {children}
    </View>
  );
}

function FeedRow({
  title,
  subtitle,
  theme,
}: {
  title: string;
  subtitle: string;
  theme: typeof CONTROL_ROOM_THEME;
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.feedRow,
        {
          borderColor: alpha(theme.border, 0.76),
        },
      ]}>
      <Text style={[styles.feedTitle, {color: theme.text}]}>{title}</Text>
      <Text style={[styles.feedSubtitle, {color: theme.textMuted}]}>
        {subtitle}
      </Text>
    </View>
  );
}

export default function DiagnosticsScreen({
  navigation,
}: Props): React.JSX.Element {
  useRenderMetric('Diagnostics');

  const {dark} = useShopApp();
  const theme = dark ? CONTROL_ROOM_THEME : WORKBENCH_THEME;
  const clear = useMonitorStore(state => state.clear);
  const screenVisits = useMonitorStore(state => state.screenVisits);
  const analyticsEvents = useMonitorStore(state => state.analyticsEvents);
  const apiCalls = useMonitorStore(state => state.apiCalls);
  const renderMetrics = useMonitorStore(state => state.renderMetrics);
  const frameMetrics = useMonitorStore(state => state.frameMetrics);
  const memoryMetrics = useMonitorStore(state => state.memoryMetrics);
  const alerts = useMonitorStore(state => state.alerts);
  const notifications = useUIStore(state => state.notifications);
  const queuedActions = useUIStore(state => state.queuedActions);
  const isOffline = useUIStore(state => state.isOffline);
  const syncInFlight = useUIStore(state => state.syncInFlight);
  const setOffline = useUIStore(state => state.setOffline);
  const syncQueuedActions = useUIStore(state => state.syncQueuedActions);

  const averageFps = useMemo(() => {
    if (!frameMetrics.length) {
      return 'N/A';
    }

    const total = frameMetrics.reduce((sum, metric) => sum + metric.fps, 0);
    return `${Math.round(total / frameMetrics.length)}`;
  }, [frameMetrics]);

  const latestMemory = memoryMetrics[0]
    ? `${memoryMetrics[0].usedMb.toFixed(1)} MB`
    : 'N/A';

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
            onPress={() => clear()}
            style={[
              styles.ghostButton,
              {
                backgroundColor: alpha(theme.panelAlt, 0.92),
                borderColor: alpha(theme.border, 0.92),
              },
            ]}>
            <Text style={[styles.ghostButtonLabel, {color: theme.text}]}>Clear logs</Text>
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
          <Text style={[styles.eyebrow, {color: theme.accent}]}>DIAGNOSTICS</Text>
          <Text style={[styles.title, {color: theme.text}]}>
            Runtime telemetry dashboard
          </Text>
          <Text style={[styles.body, {color: theme.textMuted}]}>
            Frame rate, render timing, API scaffolding, offline queue, alerts, and
            analytics events are collected here.
          </Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Avg FPS" value={averageFps} theme={theme} />
          <StatCard label="Memory" value={latestMemory} theme={theme} />
          <StatCard label="Queued actions" value={`${queuedActions.length}`} theme={theme} />
        </View>

        <SectionCard title="Offline control" theme={theme}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <Text style={[styles.feedTitle, {color: theme.text}]}>Offline mode</Text>
              <Text style={[styles.feedSubtitle, {color: theme.textMuted}]}>
                Queue API-like actions, cart mutations, and order sync events locally.
              </Text>
            </View>
            <Switch
              value={isOffline}
              onValueChange={setOffline}
              trackColor={{false: alpha(theme.border, 0.8), true: theme.accent}}
              thumbColor={theme.surface}
            />
          </View>

          <Pressable
            disabled={syncInFlight || isOffline || !queuedActions.length}
            onPress={() => void syncQueuedActions()}
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.accent,
                opacity: syncInFlight || isOffline || !queuedActions.length ? 0.55 : 1,
              },
            ]}>
            <Text style={styles.primaryButtonLabel}>
              {syncInFlight ? 'Syncing...' : 'Sync queued actions'}
            </Text>
          </Pressable>
        </SectionCard>

        <SectionCard title="Recent screens" theme={theme}>
          {screenVisits.slice(0, 5).map(item => (
            <FeedRow
              key={item.id}
              title={item.screen}
              subtitle={new Date(item.timestamp).toLocaleString()}
              theme={theme}
            />
          ))}
          {!screenVisits.length ? (
            <Text style={[styles.emptyLabel, {color: theme.textMuted}]}>
              No screen visits captured yet.
            </Text>
          ) : null}
        </SectionCard>

        <SectionCard title="Alerts" theme={theme}>
          {alerts.slice(0, 5).map(item => (
            <FeedRow
              key={item.id}
              title={`${item.level.toUpperCase()} • ${item.message}`}
              subtitle={new Date(item.timestamp).toLocaleString()}
              theme={theme}
            />
          ))}
          {!alerts.length ? (
            <Text style={[styles.emptyLabel, {color: theme.textMuted}]}>
              No alerts right now.
            </Text>
          ) : null}
        </SectionCard>

        <SectionCard title="API call tracking" theme={theme}>
          {apiCalls.slice(0, 5).map(item => (
            <FeedRow
              key={item.id}
              title={`${item.method} ${item.path}`}
              subtitle={`${item.status} • ${item.durationMs}ms${item.code ? ` • ${item.code}` : ''}`}
              theme={theme}
            />
          ))}
          {!apiCalls.length ? (
            <Text style={[styles.emptyLabel, {color: theme.textMuted}]}>
              API metrics will appear after requests are recorded.
            </Text>
          ) : null}
        </SectionCard>

        <SectionCard title="Analytics events" theme={theme}>
          {analyticsEvents.slice(0, 5).map(item => (
            <FeedRow
              key={item.id}
              title={item.name}
              subtitle={new Date(item.timestamp).toLocaleString()}
              theme={theme}
            />
          ))}
        </SectionCard>

        <SectionCard title="Render metrics" theme={theme}>
          {renderMetrics.slice(0, 5).map(item => (
            <FeedRow
              key={item.id}
              title={`${item.screen} • ${item.phase}`}
              subtitle={`${item.durationMs}ms`}
              theme={theme}
            />
          ))}
        </SectionCard>

        <SectionCard title="Notification inbox" theme={theme}>
          {notifications.slice(0, 5).map(item => (
            <FeedRow
              key={item.id}
              title={item.title}
              subtitle={item.message}
              theme={theme}
            />
          ))}
          {!notifications.length ? (
            <Text style={[styles.emptyLabel, {color: theme.textMuted}]}>
              In-app notification badges and entries will appear here.
            </Text>
          ) : null}
        </SectionCard>
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
  ghostButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  ghostButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 14,
  },
  feedRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  feedTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  feedSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  toggleCopy: {
    flex: 1,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  primaryButtonLabel: {
    color: '#061018',
    fontSize: 15,
    fontWeight: '900',
  },
  emptyLabel: {
    fontSize: 13,
    lineHeight: 20,
  },
});
