import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {delay} from '../utils/helpers';
import {pushMonitorAlert, trackEvent} from './monitorStore';
import {zustandStorage} from '../services/persistence';

export type OfflineAction = {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
  createdAt: string;
};

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export type ToastItem = {
  id: string;
  title: string;
  message?: string;
  tone: ToastTone;
  durationMs: number;
};

export type InAppNotification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
};

type UIState = {
  isOffline: boolean;
  syncInFlight: boolean;
  queuedActions: OfflineAction[];
  toasts: ToastItem[];
  notifications: InAppNotification[];
  setOffline: (value: boolean) => void;
  enqueueAction: (type: string, payload?: Record<string, unknown>) => void;
  syncQueuedActions: () => Promise<number>;
  pushToast: (toast: Omit<ToastItem, 'id'>) => string;
  dismissToast: (toastId: string) => void;
  pushNotification: (title: string, message: string) => string;
  markNotificationRead: (notificationId: string) => void;
  clearNotifications: () => void;
};

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      isOffline: false,
      syncInFlight: false,
      queuedActions: [],
      toasts: [],
      notifications: [],
      setOffline: value => {
        const currentOffline = get().isOffline;

        if (currentOffline === value) {
          return;
        }

        set({isOffline: value});
        trackEvent('connectivity.changed', {offline: value});

        if (value) {
          pushMonitorAlert('warning', 'App switched to offline mode.');
          get().pushToast({
            title: 'No internet connection',
            message: 'Please check your connection and try again.',
            tone: 'warning',
            durationMs: 3200,
          });
        } else {
          pushMonitorAlert('info', 'App switched back online.');
          get().pushToast({
            title: 'Back online',
            message: 'Internet connection restored.',
            tone: 'success',
            durationMs: 2400,
          });
        }
      },
      enqueueAction: (type, payload) => {
        const nextAction: OfflineAction = {
          id: createId('queue'),
          type,
          payload,
          createdAt: new Date().toISOString(),
        };

        set(state => ({
          queuedActions: [nextAction, ...state.queuedActions],
        }));

        trackEvent('offline.queue.enqueued', {type});
      },
      syncQueuedActions: async () => {
        if (get().syncInFlight || get().isOffline || !get().queuedActions.length) {
          return 0;
        }

        set({syncInFlight: true});

        try {
          await delay(240);
          const syncedCount = get().queuedActions.length;

          set({
            queuedActions: [],
            syncInFlight: false,
          });

          trackEvent('offline.queue.synced', {count: syncedCount});
          get().pushToast({
            title: 'Offline queue synced',
            message: `${syncedCount} pending change(s) were replayed.`,
            tone: 'success',
            durationMs: 2600,
          });

          return syncedCount;
        } catch {
          set({syncInFlight: false});
          pushMonitorAlert('error', 'Offline queue sync failed.');
          return 0;
        }
      },
      pushToast: toast => {
        const toastId = createId('toast');

        set(state => ({
          toasts: [...state.toasts, {...toast, id: toastId}],
        }));

        return toastId;
      },
      dismissToast: toastId =>
        set(state => ({
          toasts: state.toasts.filter(toast => toast.id !== toastId),
        })),
      pushNotification: (title, message) => {
        const notificationId = createId('notification');

        set(state => ({
          notifications: [
            {
              id: notificationId,
              title,
              message,
              timestamp: new Date().toISOString(),
              read: false,
            },
            ...state.notifications,
          ].slice(0, 50),
        }));

        trackEvent('notification.enqueued', {title});
        return notificationId;
      },
      markNotificationRead: notificationId =>
        set(state => ({
          notifications: state.notifications.map(notification =>
            notification.id === notificationId
              ? {...notification, read: true}
              : notification,
          ),
        })),
      clearNotifications: () => set({notifications: []}),
    }),
    {
      name: 'embedded-shop-ui',
      storage: createJSONStorage(() => zustandStorage),
      partialize: state => ({
        queuedActions: state.queuedActions,
        notifications: state.notifications,
      }),
    },
  ),
);

export const enqueueOfflineAction = (
  type: string,
  payload?: Record<string, unknown>,
) => {
  useUIStore.getState().enqueueAction(type, payload);
};

export const pushToast = (toast: Omit<ToastItem, 'id'>) =>
  useUIStore.getState().pushToast(toast);

export const pushNotification = (title: string, message: string) =>
  useUIStore.getState().pushNotification(title, message);
