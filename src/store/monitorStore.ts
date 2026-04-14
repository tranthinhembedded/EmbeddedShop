import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {zustandStorage} from '../services/persistence';

type AnalyticsEvent = {
  id: string;
  name: string;
  timestamp: string;
  payload?: Record<string, unknown>;
};

type ScreenVisit = {
  id: string;
  screen: string;
  timestamp: string;
  params?: Record<string, unknown>;
};

type ApiMetric = {
  id: string;
  path: string;
  method: string;
  durationMs: number;
  status: 'success' | 'error';
  timestamp: string;
  code?: string;
};

type RenderMetric = {
  id: string;
  screen: string;
  phase: 'mount' | 'update';
  durationMs: number;
  timestamp: string;
};

type FrameMetric = {
  id: string;
  fps: number;
  timestamp: string;
};

type MemoryMetric = {
  id: string;
  usedMb: number;
  timestamp: string;
};

export type MonitorAlert = {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
};

type MonitorState = {
  analyticsEvents: AnalyticsEvent[];
  screenVisits: ScreenVisit[];
  apiCalls: ApiMetric[];
  renderMetrics: RenderMetric[];
  frameMetrics: FrameMetric[];
  memoryMetrics: MemoryMetric[];
  alerts: MonitorAlert[];
  trackEvent: (name: string, payload?: Record<string, unknown>) => void;
  trackScreen: (screen: string, params?: Record<string, unknown>) => void;
  trackApiCall: (
    path: string,
    method: string,
    durationMs: number,
    status: 'success' | 'error',
    code?: string,
  ) => void;
  trackRender: (
    screen: string,
    phase: 'mount' | 'update',
    durationMs: number,
  ) => void;
  trackFrame: (fps: number) => void;
  trackMemory: (usedMb: number) => void;
  pushAlert: (
    level: 'info' | 'warning' | 'error',
    message: string,
  ) => void;
  clear: () => void;
};

const MAX_ITEMS = 40;

const appendLimited = <T,>(items: T[], item: T) =>
  [item, ...items].slice(0, MAX_ITEMS);

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useMonitorStore = create<MonitorState>()(
  persist(
    set => ({
      analyticsEvents: [],
      screenVisits: [],
      apiCalls: [],
      renderMetrics: [],
      frameMetrics: [],
      memoryMetrics: [],
      alerts: [],
      trackEvent: (name, payload) =>
        set(state => ({
          analyticsEvents: appendLimited(state.analyticsEvents, {
            id: createId('evt'),
            name,
            payload,
            timestamp: new Date().toISOString(),
          }),
        })),
      trackScreen: (screen, params) =>
        set(state => ({
          screenVisits: appendLimited(state.screenVisits, {
            id: createId('screen'),
            screen,
            params,
            timestamp: new Date().toISOString(),
          }),
        })),
      trackApiCall: (path, method, durationMs, status, code) =>
        set(state => ({
          apiCalls: appendLimited(state.apiCalls, {
            id: createId('api'),
            path,
            method,
            durationMs,
            status,
            code,
            timestamp: new Date().toISOString(),
          }),
        })),
      trackRender: (screen, phase, durationMs) =>
        set(state => ({
          renderMetrics: appendLimited(state.renderMetrics, {
            id: createId('render'),
            screen,
            phase,
            durationMs,
            timestamp: new Date().toISOString(),
          }),
        })),
      trackFrame: fps =>
        set(state => ({
          frameMetrics: appendLimited(state.frameMetrics, {
            id: createId('frame'),
            fps,
            timestamp: new Date().toISOString(),
          }),
        })),
      trackMemory: usedMb =>
        set(state => ({
          memoryMetrics: appendLimited(state.memoryMetrics, {
            id: createId('memory'),
            usedMb,
            timestamp: new Date().toISOString(),
          }),
        })),
      pushAlert: (level, message) =>
        set(state => ({
          alerts: appendLimited(state.alerts, {
            id: createId('alert'),
            level,
            message,
            timestamp: new Date().toISOString(),
          }),
        })),
      clear: () =>
        set({
          analyticsEvents: [],
          screenVisits: [],
          apiCalls: [],
          renderMetrics: [],
          frameMetrics: [],
          memoryMetrics: [],
          alerts: [],
        }),
    }),
    {
      name: 'embedded-shop-monitor',
      storage: createJSONStorage(() => zustandStorage),
      partialize: state => ({
        analyticsEvents: state.analyticsEvents,
        screenVisits: state.screenVisits,
        apiCalls: state.apiCalls,
        renderMetrics: state.renderMetrics,
        frameMetrics: state.frameMetrics,
        memoryMetrics: state.memoryMetrics,
        alerts: state.alerts,
      }),
    },
  ),
);

export const trackEvent = (
  name: string,
  payload?: Record<string, unknown>,
) => {
  useMonitorStore.getState().trackEvent(name, payload);
};

export const trackScreenVisit = (
  screen: string,
  params?: Record<string, unknown>,
) => {
  useMonitorStore.getState().trackScreen(screen, params);
};

export const trackApiMetric = (
  path: string,
  method: string,
  durationMs: number,
  status: 'success' | 'error',
  code?: string,
) => {
  useMonitorStore.getState().trackApiCall(
    path,
    method,
    durationMs,
    status,
    code,
  );
};

export const trackRenderMetric = (
  screen: string,
  phase: 'mount' | 'update',
  durationMs: number,
) => {
  useMonitorStore.getState().trackRender(screen, phase, durationMs);
};

export const pushMonitorAlert = (
  level: 'info' | 'warning' | 'error',
  message: string,
) => {
  useMonitorStore.getState().pushAlert(level, message);
};
