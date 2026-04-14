import {useMemo} from 'react';

import {useAuthStore} from '../store/authStore';

export function useAuth() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);
  const user = useAuthStore(state => state.user);
  const signIn = useAuthStore(state => state.login);
  const signOut = useAuthStore(state => state.logout);

  return useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      signIn,
      signOut,
    }),
    [isAuthenticated, isLoading, signIn, signOut, user],
  );
}
