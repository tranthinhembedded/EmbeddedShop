export type ApiError = {
  code: string;
  message: string;
  status?: number;
  retryable?: boolean;
  userMessage?: string;
  details?: unknown;
};

export type ApiResponse<T> = {
  data: T;
  error: ApiError | null;
};
