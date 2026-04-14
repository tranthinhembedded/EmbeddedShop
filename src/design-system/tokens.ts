export type DesignSystemResolvedTheme = {
  name: 'light' | 'dark';
  colors: {
    background: string;
    surface: string;
    card: string;
    input: string;
    border: string;
    foreground: string;
    muted: string;
    ring: string;
    primary: string;
    primaryForeground: string;
    primarySoft: string;
    secondary: string;
    secondaryForeground: string;
    secondarySoft: string;
    success: string;
    successForeground: string;
    successSoft: string;
    error: string;
    errorForeground: string;
    errorSoft: string;
    warning: string;
    warningForeground: string;
    warningSoft: string;
    info: string;
    infoForeground: string;
    infoSoft: string;
  };
};

export const designTokens = {
  colors: {
    brand: {
      cyan: '#41D7FF',
      blue: '#0E86FF',
      lime: '#B7FF5A',
    },
    primary: {
      50: '#E6F6FF',
      100: '#C7EBFF',
      200: '#9FDBFF',
      300: '#66C6FF',
      400: '#2DB3FF',
      500: '#0E86FF',
      600: '#0068D6',
      700: '#0052AB',
      800: '#0B3D73',
      900: '#0A274A',
    },
    secondary: {
      50: '#EAF8EF',
      100: '#D7F0E0',
      200: '#B3E1C4',
      300: '#82CDA0',
      400: '#59B883',
      500: '#3EA864',
      600: '#2F7E4C',
      700: '#255E3A',
      800: '#1C452C',
      900: '#142F20',
    },
    neutral: {
      0: '#FFFFFF',
      50: '#F8FBFF',
      100: '#F1F6FA',
      200: '#DDE6EE',
      300: '#C3D0DB',
      400: '#99AABA',
      500: '#667A89',
      600: '#4E6272',
      700: '#364A59',
      800: '#1F3240',
      900: '#0C1821',
      950: '#07111A',
    },
    semantic: {
      success: '#2F9E5A',
      error: '#D44B60',
      warning: '#D4832F',
      info: '#2B8AE6',
    },
  },
  typography: {
    fontFamilies: {
      sans: 'System',
      serif: 'Georgia',
      mono: 'Courier New',
    },
    fontSizes: {
      caption: 12,
      label: 14,
      body: 16,
      title: 24,
      hero: 30,
    },
    fontWeights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      caption: 16,
      label: 20,
      body: 24,
      title: 32,
      hero: 38,
    },
  },
  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    18: 72,
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 24,
  },
  shadows: {
    sm: '0 4px 12px rgba(12, 24, 33, 0.08)',
    md: '0 12px 28px rgba(12, 24, 33, 0.14)',
    lg: '0 18px 40px rgba(7, 17, 26, 0.18)',
  },
} as const;

export const designSystemLightTheme: DesignSystemResolvedTheme = {
  name: 'light',
  colors: {
    background: '#F1F6FA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    input: '#FFFFFF',
    border: '#DDE6EE',
    foreground: '#0C1821',
    muted: '#667A89',
    ring: '#0E86FF',
    primary: '#0E86FF',
    primaryForeground: '#061018',
    primarySoft: '#DDEEFF',
    secondary: '#3EA864',
    secondaryForeground: '#F4FFF8',
    secondarySoft: '#E6F7ED',
    success: '#2F9E5A',
    successForeground: '#F2FFF5',
    successSoft: '#E9F8EE',
    error: '#D44B60',
    errorForeground: '#FFF5F7',
    errorSoft: '#FBE8EC',
    warning: '#D4832F',
    warningForeground: '#FFF9F2',
    warningSoft: '#FFF1DF',
    info: '#2B8AE6',
    infoForeground: '#F3F9FF',
    infoSoft: '#E8F2FD',
  },
};

export const designSystemDarkTheme: DesignSystemResolvedTheme = {
  name: 'dark',
  colors: {
    background: '#07111A',
    surface: '#0C1A26',
    card: '#0F1F2D',
    input: '#112333',
    border: '#1F3A50',
    foreground: '#E8F3FF',
    muted: '#7D96AA',
    ring: '#41D7FF',
    primary: '#41D7FF',
    primaryForeground: '#05111A',
    primarySoft: '#123B49',
    secondary: '#B7FF5A',
    secondaryForeground: '#0C1821',
    secondarySoft: '#20361A',
    success: '#5BCB7F',
    successForeground: '#061A0E',
    successSoft: '#173325',
    error: '#FF6B7C',
    errorForeground: '#29060C',
    errorSoft: '#34121C',
    warning: '#FFBA49',
    warningForeground: '#271200',
    warningSoft: '#3A2A0F',
    info: '#41D7FF',
    infoForeground: '#05111A',
    infoSoft: '#123243',
  },
};
