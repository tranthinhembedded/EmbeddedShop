import {useMutation, useQueryClient} from '@tanstack/react-query';

import {getApiErrorMessage, showRequestToast} from '../services/httpClient';
import {useAuthStore} from '../store/authStore';
import {pushToast} from '../store/uiStore';
import type {
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
} from '../types/auth';

export const authQueryKeys = {
  root: ['auth'] as const,
};

export const useLoginMutation = () =>
  useMutation({
    mutationKey: [...authQueryKeys.root, 'login'],
    mutationFn: (payload: LoginPayload) => useAuthStore.getState().login(payload),
    onSuccess: session => {
      pushToast({
        title: 'Welcome back',
        message: `Signed in as ${session.user.fullName}.`,
        tone: 'success',
        durationMs: 2200,
      });
    },
    onError: error => showRequestToast('Unable to sign in', error),
  });

export const useRegisterMutation = () =>
  useMutation({
    mutationKey: [...authQueryKeys.root, 'register'],
    mutationFn: (payload: RegisterPayload) => useAuthStore.getState().register(payload),
    onSuccess: session => {
      pushToast({
        title: 'Account created',
        message: `Welcome to ShopAI, ${session.user.fullName}.`,
        tone: 'success',
        durationMs: 2400,
      });
    },
    onError: error => showRequestToast('Unable to create account', error),
  });

export const useForgotPasswordMutation = () =>
  useMutation({
    mutationKey: [...authQueryKeys.root, 'forgot-password'],
    mutationFn: (payload: ForgotPasswordPayload) =>
      useAuthStore.getState().forgotPassword(payload),
    onSuccess: response => {
      pushToast({
        title: 'Reset link queued',
        message: response.message,
        tone: 'info',
        durationMs: 3200,
      });
    },
    onError: error => showRequestToast('Unable to request reset link', error),
  });

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...authQueryKeys.root, 'logout'],
    mutationFn: () => useAuthStore.getState().logout(),
    onSuccess: async () => {
      await queryClient.cancelQueries();
      await queryClient.invalidateQueries();
      pushToast({
        title: 'Signed out',
        message: 'Your ShopAI session has been cleared.',
        tone: 'info',
        durationMs: 2200,
      });
    },
    onError: error => {
      pushToast({
        title: 'Sign out issue',
        message: getApiErrorMessage(error),
        tone: 'warning',
        durationMs: 2600,
      });
    },
  });
};
