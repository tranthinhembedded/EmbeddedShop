import axios, {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from './axiosBrowser';

import {handleMockRequest} from './mockServer';
import type {ApiError} from '../types/api';
import {pushMonitorAlert, trackApiMetric} from '../store/monitorStore';
import {pushToast} from '../store/uiStore';
import {useAuthStore} from '../store/authStore';

type ExtendedAxiosConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuth?: boolean;
};

const startedAtMap = new WeakMap<InternalAxiosRequestConfig, number>();

const toApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as Partial<ApiError> | undefined;

    return {
      code: responseData?.code ?? error.code ?? 'HTTP_ERROR',
      message: responseData?.message ?? error.message,
      status: error.response?.status,
      retryable:
        responseData?.retryable ??
        (error.response?.status === 408 ||
          error.response?.status === 429 ||
          error.response?.status === 503),
      userMessage: responseData?.userMessage ?? responseData?.message ?? error.message,
      details: responseData?.details ?? error.toJSON?.(),
    };
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return error as ApiError;
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'Unknown request error.',
    userMessage: 'Something went wrong while talking to the service.',
  };
};

const mockAdapter: AxiosAdapter = async config => {
  try {
    const response = await handleMockRequest({
      method: (config.method ?? 'GET').toUpperCase(),
      path: config.url ?? '/',
      headers: config.headers,
      params: config.params as Record<string, unknown> | undefined,
      data: config.data,
    });

    return {
      data: response.data,
      status: response.status,
      statusText: `${response.status}`,
      headers: response.headers ?? {},
      config,
    };
  } catch (error) {
    const apiError = toApiError(error);

    throw new AxiosError(
      apiError.message,
      apiError.code,
      config,
      undefined,
      {
        data: apiError,
        status: apiError.status ?? 500,
        statusText: apiError.message,
        headers: {},
        config,
      },
    );
  }
};

export const apiClient = axios.create({
  baseURL: 'https://embeddedshop.mock/api',
  timeout: 7000,
  adapter: mockAdapter,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  startedAtMap.set(config, Date.now());

  const extendedConfig = config as ExtendedAxiosConfig;
  const accessToken = useAuthStore.getState().tokens?.accessToken;

  if (!extendedConfig.skipAuth && accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  config.headers['X-EmbeddedShop-Request'] = `${Date.now()}`;

  return config;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const startedAt = startedAtMap.get(response.config) ?? Date.now();
    trackApiMetric(
      response.config.url ?? 'unknown',
      (response.config.method ?? 'GET').toUpperCase(),
      Date.now() - startedAt,
      'success',
    );

    return response;
  },
  async (error: unknown) => {
    const normalized = toApiError(error);
    const config = axios.isAxiosError(error)
      ? (error.config as ExtendedAxiosConfig | undefined)
      : undefined;
    const startedAt =
      (config && startedAtMap.get(config)) ??
      Date.now();

    if (
      config &&
      !config._retry &&
      normalized.status === 401 &&
      normalized.code === 'TOKEN_EXPIRED' &&
      useAuthStore.getState().tokens?.refreshToken
    ) {
      config._retry = true;

      try {
        await useAuthStore.getState().refreshToken();
        return apiClient(config);
      } catch (refreshError) {
        useAuthStore.getState().clearSession();
        pushToast({
          title: 'Session expired',
          message: 'Please sign in again to keep working.',
          tone: 'warning',
          durationMs: 2600,
        });
        return Promise.reject(toApiError(refreshError));
      }
    }

    trackApiMetric(
      config?.url ?? 'unknown',
      (config?.method ?? 'GET').toUpperCase(),
      Date.now() - startedAt,
      'error',
      normalized.code,
    );
    pushMonitorAlert('warning', `${config?.method ?? 'GET'} ${config?.url ?? '/'} failed.`);

    return Promise.reject(normalized);
  },
);

export const getApiErrorMessage = (error: unknown) => {
  const normalized = toApiError(error);
  return normalized.userMessage ?? normalized.message;
};

export const showRequestToast = (title: string, error: unknown) => {
  pushToast({
    title,
    message: getApiErrorMessage(error),
    tone: 'error',
    durationMs: 3200,
  });
};
