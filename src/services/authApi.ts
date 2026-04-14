import type {AxiosRequestConfig} from 'axios';

import {apiClient} from './httpClient';
import type {
  AuthSession,
  ForgotPasswordPayload,
  LoginPayload,
  RefreshTokenPayload,
  RegisterPayload,
} from '../types/auth';

const skipAuthConfig = () =>
  ({skipAuth: true} as AxiosRequestConfig);

export const loginRequest = async (payload: LoginPayload) => {
  const response = await apiClient.post<AuthSession>(
    '/auth/login',
    payload,
    skipAuthConfig(),
  );

  return response.data;
};

export const registerRequest = async (payload: RegisterPayload) => {
  const response = await apiClient.post<AuthSession>(
    '/auth/register',
    payload,
    skipAuthConfig(),
  );

  return response.data;
};

export const forgotPasswordRequest = async (payload: ForgotPasswordPayload) => {
  const response = await apiClient.post<{message: string}>(
    '/auth/forgot-password',
    payload,
    skipAuthConfig(),
  );

  return response.data;
};

export const logoutRequest = async (refreshToken?: string | null) => {
  const response = await apiClient.post<{message: string}>('/auth/logout', {
    refreshToken: refreshToken ?? undefined,
  });

  return response.data;
};

export const refreshTokenRequest = async (payload: RefreshTokenPayload) => {
  const response = await apiClient.post<AuthSession>(
    '/auth/refresh',
    payload,
    skipAuthConfig(),
  );

  return response.data;
};
