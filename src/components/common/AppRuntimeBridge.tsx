import React, {useEffect} from 'react';
import {onlineManager} from '@tanstack/react-query';
import {
  addEventListener as addNetInfoListener,
  fetch as fetchNetInfo,
  type NetInfoState,
} from '@react-native-community/netinfo';

import {
  pushMonitorAlert,
  useMonitorStore,
} from '../../store/monitorStore';
import {useUIStore} from '../../store/uiStore';

type HermesInternalShape = {
  getRuntimeProperties?: () => Record<string, string | number>;
};

const getUsedMemoryMb = (): number | null => {
  const performanceMemory = (
    globalThis as typeof globalThis & {
      performance?: {
        memory?: {
          usedJSHeapSize?: number;
        };
      };
      HermesInternal?: HermesInternalShape;
    }
  ).performance?.memory?.usedJSHeapSize;

  if (typeof performanceMemory === 'number' && performanceMemory > 0) {
    return Number((performanceMemory / (1024 * 1024)).toFixed(2));
  }

  const hermesMemory = (
    globalThis as typeof globalThis & {
      HermesInternal?: HermesInternalShape;
    }
  ).HermesInternal?.getRuntimeProperties?.();

  const usedBytesCandidate = hermesMemory?.['JSHeapSizeUsed']
    ?? hermesMemory?.['hermes_allocatedBytes'];

  if (typeof usedBytesCandidate === 'number' && usedBytesCandidate > 0) {
    return Number((usedBytesCandidate / (1024 * 1024)).toFixed(2));
  }

  return null;
};

export function AppRuntimeBridge(): React.JSX.Element | null {
  const trackFrame = useMonitorStore(state => state.trackFrame);
  const trackMemory = useMonitorStore(state => state.trackMemory);
  const syncQueuedActions = useUIStore(state => state.syncQueuedActions);
  const isOffline = useUIStore(state => state.isOffline);
  const setOffline = useUIStore(state => state.setOffline);

  useEffect(() => {
    const applyNetworkState = (state: NetInfoState) => {
      const nextOffline =
        state.isConnected === false || state.isInternetReachable === false;

      setOffline(nextOffline);
      onlineManager.setOnline(!nextOffline);
    };

    void fetchNetInfo().then(applyNetworkState).catch(() => {});
    const unsubscribe = addNetInfoListener(applyNetworkState);

    return () => {
      unsubscribe();
    };
  }, [setOffline]);

  useEffect(() => {
    if (!isOffline) {
      void syncQueuedActions();
    }
  }, [isOffline, syncQueuedActions]);

  useEffect(() => {
    let frameCount = 0;
    let lastTimestamp = 0;
    let rafId = 0;

    const onFrame = (timestamp: number) => {
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
      }

      frameCount += 1;
      const elapsed = timestamp - lastTimestamp;

      if (elapsed >= 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed);
        trackFrame(fps);

        if (fps < 45) {
          pushMonitorAlert('warning', `Frame rate dropped to ${fps} FPS.`);
        }

        frameCount = 0;
        lastTimestamp = timestamp;
      }

      rafId = requestAnimationFrame(onFrame);
    };

    rafId = requestAnimationFrame(onFrame);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [trackFrame]);

  useEffect(() => {
    const interval = setInterval(() => {
      const usedMb = getUsedMemoryMb();

      if (typeof usedMb !== 'number') {
        return;
      }

      trackMemory(usedMb);

      if (usedMb > 140) {
        pushMonitorAlert('warning', `Memory usage is elevated at ${usedMb} MB.`);
      }
    }, 12000);

    return () => {
      clearInterval(interval);
    };
  }, [trackMemory]);

  return null;
}
