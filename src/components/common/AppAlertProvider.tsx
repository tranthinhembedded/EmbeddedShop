import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';

import {useShopApp} from '../../store/shopAppContext';
import {
  CONTROL_ROOM_THEME,
  WORKBENCH_THEME,
  type ThemeTokens,
} from '../../theme';

export type AppAlertTone = 'info' | 'success' | 'warning' | 'danger';
export type AppAlertButtonStyle = 'default' | 'cancel' | 'destructive';
export type AppAlertButton = {
  text?: string;
  style?: AppAlertButtonStyle;
  onPress?: () => void;
};
export type AppAlertOptions = {
  eyebrow?: string;
  title: string;
  message: string;
  tone?: AppAlertTone;
  code?: string;
  codeLabel?: string;
  buttons?: AppAlertButton[];
  dismissible?: boolean;
};

type AppAlertState = AppAlertOptions & {
  id: string;
};

type AppAlertContextValue = {
  showAlert: (options: AppAlertOptions) => void;
  closeAlert: () => void;
};

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

const alpha = (hex: string, value: number) => {
  const normalized = hex.replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map(character => character + character)
          .join('')
      : normalized;
  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${value})`;
};

const createAlertId = () => `alert-${Math.random().toString(36).slice(2, 8)}`;

const toneLabel = (tone: AppAlertTone) => {
  switch (tone) {
    case 'success':
      return 'SUCCESS';
    case 'warning':
      return 'ACTION REQUIRED';
    case 'danger':
      return 'PLEASE CONFIRM';
    default:
      return 'NOTICE';
  }
};

const toneColor = (tone: AppAlertTone, theme: ThemeTokens) => {
  switch (tone) {
    case 'success':
      return theme.lime;
    case 'warning':
      return theme.amber;
    case 'danger':
      return theme.danger;
    default:
      return theme.accent;
  }
};

function AppAlertDialog({
  alert,
  theme,
  onClose,
}: {
  alert: AppAlertState | null;
  theme: ThemeTokens;
  onClose: () => void;
}): React.JSX.Element | null {
  if (!alert) {
    return null;
  }

  const actions = alert.buttons?.length ? alert.buttons : [{text: 'OK'}];
  const activeTone = alert.tone ?? 'info';
  const accent = toneColor(activeTone, theme);
  const splitActions = actions.length === 2;
  const dismissible = alert.dismissible ?? false;

  const runAction = (action?: AppAlertButton) => {
    onClose();
    action?.onPress?.();
  };

  const handleRequestClose = () => {
    if (dismissible) {
      onClose();
    }
  };

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={handleRequestClose}>
      <View style={[styles.backdrop, {backgroundColor: alpha(theme.bg, 0.82)}]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismissible ? onClose : undefined}
        />
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: alpha(accent, 0.34),
              shadowColor: accent,
            },
          ]}>
          <View style={styles.header}>
            <View
              style={[
                styles.glyphWrap,
                {
                  backgroundColor: alpha(accent, 0.14),
                  borderColor: alpha(accent, 0.32),
                },
              ]}>
              <View
                style={[
                  styles.glyphCore,
                  {
                    backgroundColor: accent,
                    shadowColor: accent,
                  },
                ]}
              />
            </View>
            <View style={styles.fill}>
              <Text style={[styles.eyebrow, {color: accent}]}>
                {alert.eyebrow ?? toneLabel(activeTone)}
              </Text>
              <Text style={[styles.title, {color: theme.text}]}>{alert.title}</Text>
            </View>
          </View>

          <Text style={[styles.body, {color: theme.textMuted}]}>{alert.message}</Text>

          {alert.code ? (
            <View
              style={[
                styles.codePill,
                {
                  backgroundColor: alpha(theme.panelAlt, 0.96),
                  borderColor: alpha(theme.border, 0.92),
                },
              ]}>
              <Text style={[styles.codeLabel, {color: theme.textMuted}]}>
                {alert.codeLabel ?? 'REFERENCE'}
              </Text>
              <Text style={[styles.codeValue, {color: theme.text}]}>
                {alert.code}
              </Text>
            </View>
          ) : null}

          <View
            style={[
              styles.actionGroup,
              splitActions ? styles.actionGroupSplit : null,
            ]}>
            {actions.map((action, index) => {
              const actionLabel =
                action.text ??
                (action.style === 'cancel' ? 'Cancel' : 'OK');
              const destructive = action.style === 'destructive';
              const neutral = action.style === 'cancel';

              return (
                <Pressable
                  key={`${alert.id}-${actionLabel}-${index}`}
                  onPress={() => runAction(action)}
                  style={[
                    styles.actionButton,
                    splitActions ? styles.actionButtonSplit : null,
                    neutral
                      ? {
                          backgroundColor: alpha(theme.panelAlt, 0.96),
                          borderColor: alpha(theme.border, 0.92),
                        }
                      : {
                          backgroundColor: destructive ? theme.danger : accent,
                          borderColor: destructive
                            ? alpha(theme.danger, 0.2)
                            : alpha(accent, 0.22),
                        },
                  ]}>
                  <Text
                    style={[
                      styles.actionLabel,
                      neutral
                        ? {color: theme.text}
                        : destructive
                          ? styles.actionLabelLight
                          : styles.actionLabelDark,
                    ]}>
                    {actionLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function AppAlertProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const {dark} = useShopApp();
  const theme = dark ? CONTROL_ROOM_THEME : WORKBENCH_THEME;
  const queueRef = useRef<AppAlertState[]>([]);
  const [currentAlert, setCurrentAlert] = useState<AppAlertState | null>(null);

  const closeAlert = useCallback(() => {
    setCurrentAlert(null);
  }, []);

  const showAlert = useCallback((options: AppAlertOptions) => {
    const nextAlert: AppAlertState = {
      ...options,
      id: createAlertId(),
    };

    setCurrentAlert(previous => {
      if (previous) {
        queueRef.current.push(nextAlert);
        return previous;
      }

      return nextAlert;
    });
  }, []);

  useEffect(() => {
    if (currentAlert || !queueRef.current.length) {
      return;
    }

    const [nextAlert, ...rest] = queueRef.current;
    queueRef.current = rest;
    setCurrentAlert(nextAlert);
  }, [currentAlert]);

  const value = useMemo(
    () => ({
      showAlert,
      closeAlert,
    }),
    [closeAlert, showAlert],
  );

  return (
    <AppAlertContext.Provider value={value}>
      {children}
      <AppAlertDialog alert={currentAlert} theme={theme} onClose={closeAlert} />
    </AppAlertContext.Provider>
  );
}

export function useAppAlert(): AppAlertContextValue {
  const context = useContext(AppAlertContext);

  if (!context) {
    throw new Error('useAppAlert must be used within AppAlertProvider.');
  }

  return context;
}

const styles = StyleSheet.create({
  fill: {flex: 1},
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    borderWidth: 1,
    padding: 22,
    shadowOffset: {width: 0, height: 18},
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 12,
  },
  header: {flexDirection: 'row', alignItems: 'center', gap: 14},
  glyphWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphCore: {
    width: 16,
    height: 16,
    borderRadius: 5,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 4,
  },
  eyebrow: {fontSize: 12, fontWeight: '900', letterSpacing: 1.8},
  title: {fontSize: 28, lineHeight: 34, fontWeight: '800', marginTop: 4},
  body: {fontSize: 15, lineHeight: 23, marginTop: 18},
  codePill: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 18,
  },
  codeLabel: {fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 4},
  codeValue: {fontSize: 18, fontWeight: '900', letterSpacing: 0.6},
  actionGroup: {marginTop: 20, gap: 12},
  actionGroupSplit: {flexDirection: 'row'},
  actionButton: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  actionButtonSplit: {flex: 1},
  actionLabel: {fontSize: 17, fontWeight: '900'},
  actionLabelDark: {color: '#041019'},
  actionLabelLight: {color: '#FFF7FA'},
});
