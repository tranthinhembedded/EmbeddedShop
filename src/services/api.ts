import type {ApiError} from '../types/api';
import {trackApiMetric, pushMonitorAlert} from '../store/monitorStore';
import {enqueueOfflineAction, useUIStore} from '../store/uiStore';

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  retry?: {
    retries?: number;
    delayMs?: number;
    backoffMs?: number;
  };
};

type RetryOptions = {
  retries?: number;
  delayMs?: number;
  backoffMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};

const DEFAULT_RETRY_DELAY_MS = 450;
const DEFAULT_RETRY_BACKOFF_MS = 300;

const FRIENDLY_ERROR_MESSAGES: Record<string, string> = {
  NETWORK_UNAVAILABLE:
    'Unable to reach the server right now. Please check your connection and try again.',
  REQUEST_TIMEOUT:
    'The request took too long to complete. Please try again.',
  SERVICE_UNAVAILABLE:
    'The service is temporarily unavailable. Please retry in a moment.',
  API_NOT_CONFIGURED:
    'This service is not connected yet. Please retry later or contact support.',
  UNKNOWN_ERROR:
    'Something went wrong. Please try again.',
};

const wait = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms);
  });

export class ApiClientError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly retryable: boolean;
  readonly userMessage: string;
  readonly details?: unknown;

  constructor({
    code,
    message,
    status,
    retryable = false,
    userMessage,
    details,
  }: ApiError) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
    this.userMessage =
      userMessage ?? FRIENDLY_ERROR_MESSAGES[code] ?? FRIENDLY_ERROR_MESSAGES.UNKNOWN_ERROR;
    this.details = details;
  }

  toApiError(): ApiError {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      retryable: this.retryable,
      userMessage: this.userMessage,
      details: this.details,
    };
  }
}

export const toApiClientError = (error: unknown): ApiClientError => {
  if (error instanceof ApiClientError) {
    return error;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new ApiClientError({
      code: 'REQUEST_TIMEOUT',
      message: error.message || 'Request aborted.',
      retryable: true,
    });
  }

  if (error instanceof TypeError) {
    return new ApiClientError({
      code: 'NETWORK_UNAVAILABLE',
      message: error.message || 'Network request failed.',
      retryable: true,
    });
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  ) {
    const nextError = error as ApiError;
    return new ApiClientError(nextError);
  }

  if (error instanceof Error) {
    return new ApiClientError({
      code: 'UNKNOWN_ERROR',
      message: error.message,
      details: error,
    });
  }

  return new ApiClientError({
    code: 'UNKNOWN_ERROR',
    message: 'Unknown error.',
    details: error,
  });
};

export const getUserFriendlyErrorMessage = (error: unknown) =>
  toApiClientError(error).userMessage;

export const isRetryableError = (error: unknown) =>
  toApiClientError(error).retryable;

export async function retryAsync<T>(
  task: () => Promise<T>,
  {
    retries = 0,
    delayMs = DEFAULT_RETRY_DELAY_MS,
    backoffMs = DEFAULT_RETRY_BACKOFF_MS,
    shouldRetry = error => isRetryableError(error),
  }: RetryOptions = {},
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await task();
    } catch (error) {
      const normalized = toApiClientError(error);
      const canRetry = attempt < retries && shouldRetry(normalized, attempt);

      if (!canRetry) {
        throw normalized;
      }

      attempt += 1;
      await wait(delayMs + backoffMs * (attempt - 1));
    }
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  const startedAt = Date.now();

  if (useUIStore.getState().isOffline) {
    enqueueOfflineAction('api-request', {
      path,
      method,
    });

    const offlineError = new ApiClientError({
      code: 'NETWORK_UNAVAILABLE',
      message: 'Offline queue captured the API request.',
      retryable: true,
      userMessage:
        'You are offline right now. The action has been queued and will sync when connectivity returns.',
    });

    trackApiMetric(path, method, Date.now() - startedAt, 'error', offlineError.code);
    pushMonitorAlert('warning', `Queued offline API request for ${method} ${path}`);
    throw offlineError;
  }

  const notConfiguredError = new ApiClientError({
    code: 'API_NOT_CONFIGURED',
    message: 'API client scaffold is not wired yet.',
    retryable: true,
  });

  try {
    const result = await retryAsync(
      async () => Promise.reject(notConfiguredError),
      {
        retries: options.retry?.retries ?? 0,
        delayMs: options.retry?.delayMs,
        backoffMs: options.retry?.backoffMs,
      },
    );

    trackApiMetric(path, method, Date.now() - startedAt, 'success');
    return result;
  } catch (error) {
    const normalized = toApiClientError(error);
    trackApiMetric(path, method, Date.now() - startedAt, 'error', normalized.code);
    pushMonitorAlert('warning', `${method} ${path} failed with ${normalized.code}.`);
    throw normalized;
  }
}
