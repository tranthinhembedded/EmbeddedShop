import {createMMKV} from 'react-native-mmkv';

import type {StateStorage} from 'zustand/middleware';

export const appStorage = createMMKV({
  id: 'embedded-shop-app',
});

export const zustandStorage: StateStorage = {
  getItem: (key: string) => appStorage.getString(key) ?? null,
  setItem: (key: string, value: string) => {
    appStorage.set(key, value);
  },
  removeItem: (key: string) => {
    appStorage.remove(key);
  },
};

export const setJson = (key: string, value: unknown) => {
  appStorage.set(key, JSON.stringify(value));
};

export const getJson = <T>(key: string): T | null => {
  const value = appStorage.getString(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const removeStoredValue = (key: string) => {
  appStorage.remove(key);
};
