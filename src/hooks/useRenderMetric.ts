import {useEffect, useRef} from 'react';

import {trackRenderMetric} from '../store/monitorStore';

const now = () => {
  const globalWithPerformance = globalThis as typeof globalThis & {
    performance?: {
      now?: () => number;
    };
  };

  return globalWithPerformance.performance?.now?.() ?? Date.now();
};

export function useRenderMetric(screen: string) {
  const mountedRef = useRef(false);
  const startedAtRef = useRef(now());

  useEffect(() => {
    const endedAt = now();
    const durationMs = Math.round((endedAt - startedAtRef.current) * 100) / 100;

    trackRenderMetric(screen, mountedRef.current ? 'update' : 'mount', durationMs);
    mountedRef.current = true;
    startedAtRef.current = now();
  });
}
