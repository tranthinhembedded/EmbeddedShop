import {
  appStorage,
  getJson,
  removeStoredValue,
  setJson,
} from './persistence';

export async function setStoredItem(key: string, value: string): Promise<void> {
  appStorage.set(key, value);
}

export async function getStoredItem(key: string): Promise<string | null> {
  return appStorage.getString(key) ?? null;
}

export async function removeStoredItem(key: string): Promise<void> {
  removeStoredValue(key);
}

export async function setStoredJson<T>(key: string, value: T): Promise<void> {
  setJson(key, value);
}

export async function getStoredJson<T>(key: string): Promise<T | null> {
  return getJson<T>(key);
}
