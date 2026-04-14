export type AuthRole = 'admin' | 'member';

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: AuthRole;
  createdAt: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

export type AuthSession = {
  user: AuthUser;
  tokens: AuthTokens;
};

export type LoginPayload = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type RefreshTokenPayload = {
  refreshToken: string;
};
