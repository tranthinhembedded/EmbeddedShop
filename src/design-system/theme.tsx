import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {View, useColorScheme as useSystemColorScheme} from 'react-native';

import {vars} from 'nativewind';

import {
  designSystemDarkTheme,
  designSystemLightTheme,
  type DesignSystemResolvedTheme,
} from './tokens';

export type ThemePreference = 'light' | 'dark' | 'system';

type DesignSystemThemeContextValue = {
  mode: 'light' | 'dark';
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
  theme: DesignSystemResolvedTheme;
};

const DesignSystemThemeContext =
  createContext<DesignSystemThemeContextValue | null>(null);

const toThemeVars = (theme: DesignSystemResolvedTheme) =>
  vars({
    '--color-background': theme.colors.background,
    '--color-surface': theme.colors.surface,
    '--color-card': theme.colors.card,
    '--color-input': theme.colors.input,
    '--color-border': theme.colors.border,
    '--color-foreground': theme.colors.foreground,
    '--color-muted': theme.colors.muted,
    '--color-ring': theme.colors.ring,
    '--color-primary': theme.colors.primary,
    '--color-primary-foreground': theme.colors.primaryForeground,
    '--color-primary-soft': theme.colors.primarySoft,
    '--color-secondary': theme.colors.secondary,
    '--color-secondary-foreground': theme.colors.secondaryForeground,
    '--color-secondary-soft': theme.colors.secondarySoft,
    '--color-success': theme.colors.success,
    '--color-success-foreground': theme.colors.successForeground,
    '--color-success-soft': theme.colors.successSoft,
    '--color-error': theme.colors.error,
    '--color-error-foreground': theme.colors.errorForeground,
    '--color-error-soft': theme.colors.errorSoft,
    '--color-warning': theme.colors.warning,
    '--color-warning-foreground': theme.colors.warningForeground,
    '--color-warning-soft': theme.colors.warningSoft,
    '--color-info': theme.colors.info,
    '--color-info-foreground': theme.colors.infoForeground,
    '--color-info-soft': theme.colors.infoSoft,
  });

export function DesignSystemThemeProvider({
  children,
  initialPreference = 'system',
}: {
  children: React.ReactNode;
  initialPreference?: ThemePreference;
}): React.JSX.Element {
  const systemColorScheme = useSystemColorScheme();
  const [preference, setPreferenceState] =
    useState<ThemePreference>(initialPreference);

  const mode: 'light' | 'dark' =
    preference === 'system'
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : preference;
  const theme = mode === 'dark' ? designSystemDarkTheme : designSystemLightTheme;

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreferenceState(previousPreference => {
      const currentMode = previousPreference === 'system' ? mode : previousPreference;
      return currentMode === 'dark' ? 'light' : 'dark';
    });
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      preference,
      setPreference,
      toggleTheme,
      theme,
    }),
    [mode, preference, setPreference, theme, toggleTheme],
  );

  return (
    <DesignSystemThemeContext.Provider value={value}>
      <View className="flex-1 bg-background" style={toThemeVars(theme)}>
        {children}
      </View>
    </DesignSystemThemeContext.Provider>
  );
}

export function useDesignSystemTheme(): DesignSystemThemeContextValue {
  const context = useContext(DesignSystemThemeContext);

  if (!context) {
    throw new Error(
      'useDesignSystemTheme must be used within DesignSystemThemeProvider.',
    );
  }

  return context;
}
