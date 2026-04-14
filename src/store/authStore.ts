import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {
  forgotPasswordRequest,
  loginRequest,
  logoutRequest,
  refreshTokenRequest,
  registerRequest,
} from '../services/authApi';
import {zustandStorage} from '../services/persistence';
import type {
  AuthSession,
  AuthTokens,
  AuthUser,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
} from '../types/auth';

type AuthState = {
  hasHydrated: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  rememberMe: boolean;
  user: AuthUser | null;
  tokens: AuthTokens | null;
  setHasHydrated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  applySession: (session: AuthSession, rememberMe: boolean) => void;
  clearSession: () => void;
  login: (payload: LoginPayload) => Promise<AuthSession>;
  register: (payload: RegisterPayload) => Promise<AuthSession>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<{message: string}>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<AuthTokens | null>;
};

export const initialAuthState = {
  hasHydrated: false,
  isAuthenticated: false,
  isLoading: false,
  rememberMe: false,
  user: null,
  tokens: null,
} satisfies Omit<
  AuthState,
  | 'setHasHydrated'
  | 'setLoading'
  | 'applySession'
  | 'clearSession'
  | 'login'
  | 'register'
  | 'forgotPassword'
  | 'logout'
  | 'refreshToken'
>;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialAuthState,
      setHasHydrated: value => set({hasHydrated: value}),
      setLoading: value => set({isLoading: value}),
      applySession: (session, rememberMe) =>
        set({
          user: session.user,
          tokens: session.tokens,
          rememberMe,
          isAuthenticated: true,
          isLoading: false,
        }),
      clearSession: () =>
        set({
          user: null,
          tokens: null,
          rememberMe: false,
          isAuthenticated: false,
          isLoading: false,
        }),
      login: async payload => {
        set({isLoading: true});

        try {
          const session = await loginRequest(payload);
          get().applySession(session, payload.rememberMe);
          return session;
        } catch (error) {
          set({isLoading: false});
          throw error;
        }
      },
      register: async payload => {
        set({isLoading: true});

        try {
          const session = await registerRequest(payload);
          get().applySession(session, true);
          return session;
        } catch (error) {
          set({isLoading: false});
          throw error;
        }
      },
      forgotPassword: async payload => {
        set({isLoading: true});

        try {
          const response = await forgotPasswordRequest(payload);
          set({isLoading: false});
          return response;
        } catch (error) {
          set({isLoading: false});
          throw error;
        }
      },
      logout: async () => {
        const refreshToken = get().tokens?.refreshToken;

        try {
          await logoutRequest(refreshToken);
        } finally {
          get().clearSession();
        }
      },
      refreshToken: async () => {
        const refreshToken = get().tokens?.refreshToken;

        if (!refreshToken) {
          get().clearSession();
          return null;
        }

        const session = await refreshTokenRequest({refreshToken});

        set({
          user: session.user,
          tokens: session.tokens,
          isAuthenticated: true,
        });

        return session.tokens;
      },
    }),
    {
      name: 'embedded-shop-auth',
      storage: createJSONStorage(() => zustandStorage),
      partialize: state =>
        state.rememberMe
          ? {
              rememberMe: state.rememberMe,
              isAuthenticated: state.isAuthenticated,
              user: state.user,
              tokens: state.tokens,
            }
          : {
              rememberMe: false,
              isAuthenticated: false,
              user: null,
              tokens: null,
            },
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
