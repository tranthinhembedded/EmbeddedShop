import React, {useMemo, useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../../navigation/types';
import {
  PaymentMethod,
  PaymentMethodType,
  useShopApp,
} from '../../store/shopAppContext';
import {CONTROL_ROOM_THEME, WORKBENCH_THEME} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentMethods'>;
type FieldErrors = Partial<
  Record<'label' | 'description' | 'holderName' | 'accountReference' | 'expiry', string>
>;

const alpha = (hex: string, value: number) => {
  const clean = hex.replace('#', '');
  const expanded =
    clean.length === 3
      ? clean
          .split('')
          .map(character => `${character}${character}`)
          .join('')
      : clean;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${value})`;
};

const PAYMENT_TYPE_OPTIONS: Array<{id: PaymentMethodType; label: string; hint: string}> = [
  {
    id: 'credit-card',
    label: 'Credit card',
    hint: 'Primary procurement credit line.',
  },
  {
    id: 'debit-card',
    label: 'Debit card',
    hint: 'Business debit card for dispatch fees.',
  },
  {
    id: 'paypal',
    label: 'PayPal',
    hint: 'Simulated wallet approval for urgent orders.',
  },
  {
    id: 'cash-on-delivery',
    label: 'Cash on delivery',
    hint: 'Pay at the receiving desk when hardware arrives.',
  },
];

const getMethodTone = (
  type: PaymentMethodType,
  theme: typeof CONTROL_ROOM_THEME,
) => {
  switch (type) {
    case 'credit-card':
      return theme.accent;
    case 'debit-card':
      return theme.lime;
    case 'paypal':
      return theme.amber;
    case 'cash-on-delivery':
    default:
      return theme.textMuted;
  }
};

const getMethodLabel = (type: PaymentMethodType) =>
  PAYMENT_TYPE_OPTIONS.find(option => option.id === type)?.label ?? 'Method';

const maskAccountReference = (
  method: Pick<PaymentMethod, 'type' | 'accountReference'>,
) => {
  if (method.type === 'paypal') {
    return method.accountReference;
  }

  if (method.type === 'cash-on-delivery') {
    return method.accountReference;
  }

  const digits = method.accountReference.replace(/\s+/g, '');
  if (digits.length <= 4) {
    return digits;
  }

  return `**** ${digits.slice(-4)}`;
};

export default function PaymentMethodsScreen({
  navigation,
}: Props): React.JSX.Element {
  const {
    dark,
    profile,
    paymentMethods,
    savePaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
  } = useShopApp();
  const theme = dark ? CONTROL_ROOM_THEME : WORKBENCH_THEME;
  const scrollRef = useRef<ScrollView>(null);
  const formYRef = useRef(0);
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  const [methodType, setMethodType] = useState<PaymentMethodType>('credit-card');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [holderName, setHolderName] = useState(profile.fullName);
  const [accountReference, setAccountReference] = useState('');
  const [expiry, setExpiry] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});

  const orderedMethods = useMemo(
    () =>
      [...paymentMethods].sort((left, right) => {
        if (left.isDefault === right.isDefault) {
          return left.label.localeCompare(right.label);
        }

        return left.isDefault ? -1 : 1;
      }),
    [paymentMethods],
  );

  const defaultMethod =
    paymentMethods.find(entry => entry.isDefault) ?? paymentMethods[0];
  const removeDisabled = paymentMethods.length <= 1;

  const focusForm = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(formYRef.current - 16, 0),
        animated: true,
      });
    });
  };

  const resetForm = () => {
    setEditingMethodId(null);
    setMethodType('credit-card');
    setLabel('');
    setDescription('');
    setHolderName(profile.fullName);
    setAccountReference('');
    setExpiry('');
    setSetAsDefault(paymentMethods.length === 0);
    setErrors({});
    focusForm();
  };

  const startEdit = (entry: PaymentMethod) => {
    setEditingMethodId(entry.id);
    setMethodType(entry.type);
    setLabel(entry.label);
    setDescription(entry.description);
    setHolderName(entry.holderName);
    setAccountReference(entry.accountReference);
    setExpiry(entry.expiry ?? '');
    setSetAsDefault(entry.isDefault);
    setErrors({});
    focusForm();
  };

  const validateForm = () => {
    const nextErrors: FieldErrors = {};
    const normalizedReference = accountReference.replace(/\s+/g, '');

    if (!label.trim()) {
      nextErrors.label = 'Method label is required.';
    }

    if (!description.trim()) {
      nextErrors.description = 'Add a short description for this method.';
    }

    if (!holderName.trim()) {
      nextErrors.holderName = 'Holder or approver name is required.';
    }

    if (!accountReference.trim()) {
      nextErrors.accountReference = 'Enter the card number, wallet email, or payment reference.';
    } else if (
      (methodType === 'credit-card' || methodType === 'debit-card') &&
      normalizedReference.length < 12
    ) {
      nextErrors.accountReference = 'Enter a valid card number.';
    } else if (
      methodType === 'paypal' &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountReference.trim())
    ) {
      nextErrors.accountReference = 'Enter a valid PayPal email.';
    }

    if (
      (methodType === 'credit-card' || methodType === 'debit-card') &&
      !/^\d{2}\/\d{2}$/.test(expiry.trim())
    ) {
      nextErrors.expiry = 'Use MM/YY format.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    savePaymentMethod({
      id: editingMethodId ?? undefined,
      type: methodType,
      label,
      description,
      holderName,
      accountReference,
      expiry:
        methodType === 'credit-card' || methodType === 'debit-card'
          ? expiry
          : '',
      isDefault: setAsDefault,
    });
    resetForm();
  };

  return (
    <SafeAreaView style={[styles.safeArea, {backgroundColor: theme.bg}]}>
      <StatusBar
        backgroundColor={theme.bg}
        barStyle={dark ? 'light-content' : 'dark-content'}
      />
      <KeyboardAvoidingView
        style={styles.flexFill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={[
                styles.backButton,
                {
                  backgroundColor: alpha(theme.panelAlt, 0.92),
                  borderColor: alpha(theme.border, 0.92),
                },
              ]}>
              <Text style={[styles.backButtonLabel, {color: theme.text}]}>
                Back
              </Text>
            </Pressable>
            <Pressable onPress={resetForm}>
              <Text style={[styles.linkLabel, {color: theme.accent}]}>
                {editingMethodId ? 'New method' : 'Add new'}
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: alpha(theme.panel, 0.96),
                borderColor: alpha(theme.border, 0.94),
              },
            ]}>
            <Text style={[styles.eyebrow, {color: theme.accent}]}>
              PAYMENT METHODS
            </Text>
            <Text style={[styles.title, {color: theme.text}]}>
              Manage cards and wallets
            </Text>
            <Text style={[styles.body, {color: theme.textMuted}]}>
              Keep the preferred payment rails ready before the next checkout.
            </Text>

            <View style={styles.metricsRow}>
              <MetricCard
                label="Saved"
                value={`${paymentMethods.length}`}
                theme={theme}
              />
              <MetricCard
                label="Default"
                value={defaultMethod?.label ?? 'None'}
                theme={theme}
              />
            </View>
          </View>

          {orderedMethods.map(method => {
            const tone = getMethodTone(method.type, theme);

            return (
              <View
                key={method.id}
                style={[
                  styles.entryCard,
                  {
                    backgroundColor: alpha(theme.panel, 0.96),
                    borderColor: alpha(
                      method.isDefault ? tone : theme.border,
                      method.isDefault ? 0.36 : 0.94,
                    ),
                  },
                ]}>
                <View style={styles.entryHeader}>
                  <View style={styles.flexFill}>
                    <Text style={[styles.entryTitle, {color: theme.text}]}>
                      {method.label}
                    </Text>
                    <Text style={[styles.entrySubtitle, {color: tone}]}>
                      {getMethodLabel(method.type)}
                    </Text>
                  </View>
                  {method.isDefault ? (
                    <View
                      style={[
                        styles.defaultPill,
                        {
                          backgroundColor: alpha(tone, 0.14),
                          borderColor: alpha(tone, 0.3),
                        },
                      ]}>
                      <Text style={[styles.defaultPillLabel, {color: tone}]}>
                        DEFAULT
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text style={[styles.entryMeta, {color: theme.text}]}>
                  {method.holderName}
                </Text>
                <Text style={[styles.entryMeta, {color: theme.textMuted}]}>
                  {maskAccountReference(method)}
                  {method.expiry ? `  |  ${method.expiry}` : ''}
                </Text>
                <Text style={[styles.entryBody, {color: theme.textMuted}]}>
                  {method.description}
                </Text>

                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => startEdit(method)}
                    style={[
                      styles.secondaryAction,
                      {
                        backgroundColor: alpha(theme.panelAlt, 0.92),
                        borderColor: alpha(theme.border, 0.92),
                      },
                    ]}>
                    <Text style={[styles.secondaryActionLabel, {color: theme.text}]}>
                      Edit
                    </Text>
                  </Pressable>
                  <Pressable
                    disabled={method.isDefault}
                    onPress={() => setDefaultPaymentMethod(method.id)}
                    style={[
                      styles.secondaryAction,
                      {
                        backgroundColor: alpha(
                          method.isDefault ? tone : theme.panelAlt,
                          method.isDefault ? 0.16 : 0.92,
                        ),
                        borderColor: alpha(
                          method.isDefault ? tone : theme.border,
                          method.isDefault ? 0.34 : 0.92,
                        ),
                      },
                    ]}>
                    <Text
                      style={[
                        styles.secondaryActionLabel,
                        {color: method.isDefault ? tone : theme.text},
                      ]}>
                      {method.isDefault ? 'Pinned' : 'Make default'}
                    </Text>
                  </Pressable>
                <Pressable
                  disabled={removeDisabled}
                  onPress={() => {
                    if (editingMethodId === method.id) {
                      resetForm();
                      }
                      removePaymentMethod(method.id);
                    }}
                  style={[
                    styles.iconAction,
                    removeDisabled ? styles.dimmedAction : null,
                    {
                      backgroundColor: alpha(theme.panelAlt, 0.92),
                      borderColor: alpha(theme.danger, removeDisabled ? 0.16 : 0.32),
                    },
                  ]}>
                    <Text style={[styles.iconActionLabel, {color: theme.danger}]}>
                      -
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          {removeDisabled ? (
            <Text style={[styles.helperText, {color: theme.textMuted}]}>
              Keep one payment method on file for fast checkout. Edit the current
              default if you need to replace it.
            </Text>
          ) : null}

          <View
            onLayout={event => {
              formYRef.current = event.nativeEvent.layout.y;
            }}
            style={[
              styles.formCard,
              {
                backgroundColor: alpha(theme.panel, 0.96),
                borderColor: alpha(theme.border, 0.94),
              },
              editingMethodId
                ? {
                    borderColor: alpha(theme.accent, 0.36),
                  }
                : null,
            ]}>
            <Text style={[styles.eyebrow, {color: theme.accent}]}>
              {editingMethodId ? 'EDIT METHOD' : 'ADD METHOD'}
            </Text>
            <Text style={[styles.formTitle, {color: theme.text}]}>
              {editingMethodId
                ? 'Update the selected payment rail'
                : 'Create a new payment method'}
            </Text>
            {editingMethodId ? (
              <Text style={[styles.editingHint, {color: theme.textMuted}]}>
                You are editing an existing payment method. Save to apply changes
                or tap "New method" to start a fresh entry.
              </Text>
            ) : null}

            <Text style={[styles.fieldLabel, {color: theme.textMuted}]}>
              METHOD TYPE
            </Text>
            <View style={styles.typeGrid}>
              {PAYMENT_TYPE_OPTIONS.map(option => {
                const active = option.id === methodType;
                const tone = getMethodTone(option.id, theme);

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      setMethodType(option.id);
                      if (
                        option.id !== 'credit-card' &&
                        option.id !== 'debit-card'
                      ) {
                        setExpiry('');
                        setErrors(previous => ({...previous, expiry: undefined}));
                      }
                    }}
                    style={[
                      styles.typeOption,
                      {
                        backgroundColor: alpha(
                          active ? tone : theme.panelAlt,
                          active ? 0.16 : 0.92,
                        ),
                        borderColor: alpha(
                          active ? tone : theme.border,
                          active ? 0.34 : 0.92,
                        ),
                      },
                    ]}>
                    <Text
                      style={[
                        styles.typeOptionTitle,
                        {color: active ? tone : theme.text},
                      ]}>
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.typeOptionHint,
                        {color: active ? tone : theme.textMuted},
                      ]}>
                      {option.hint}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <FieldBlock
              label="Label"
              value={label}
              onChangeText={value => {
                setLabel(value);
                setErrors(previous => ({...previous, label: undefined}));
              }}
              theme={theme}
              error={errors.label}
            />
            <FieldBlock
              label="Description"
              value={description}
              onChangeText={value => {
                setDescription(value);
                setErrors(previous => ({...previous, description: undefined}));
              }}
              theme={theme}
              error={errors.description}
              multiline
            />
            <FieldBlock
              label={methodType === 'cash-on-delivery' ? 'Receiver' : 'Holder name'}
              value={holderName}
              onChangeText={value => {
                setHolderName(value);
                setErrors(previous => ({...previous, holderName: undefined}));
              }}
              theme={theme}
              error={errors.holderName}
            />
            <FieldBlock
              label={
                methodType === 'paypal'
                  ? 'PayPal email'
                  : methodType === 'cash-on-delivery'
                    ? 'Reference'
                    : 'Card number'
              }
              value={accountReference}
              onChangeText={value => {
                setAccountReference(value);
                setErrors(previous => ({...previous, accountReference: undefined}));
              }}
              theme={theme}
              error={errors.accountReference}
              keyboardType={methodType === 'paypal' ? 'email-address' : 'default'}
            />
            {methodType === 'credit-card' || methodType === 'debit-card' ? (
              <FieldBlock
                label="Expiry"
                value={expiry}
                onChangeText={value => {
                  setExpiry(value);
                  setErrors(previous => ({...previous, expiry: undefined}));
                }}
                theme={theme}
                error={errors.expiry}
              />
            ) : null}

            <View
              style={[
                styles.switchCard,
                {
                  backgroundColor: alpha(theme.panelAlt, 0.92),
                  borderColor: alpha(theme.border, 0.92),
                },
              ]}>
              <View style={styles.flexFill}>
                <Text style={[styles.switchTitle, {color: theme.text}]}>
                  Use as default method
                </Text>
                <Text style={[styles.switchDescription, {color: theme.textMuted}]}>
                  New checkout sessions will preselect this payment option.
                </Text>
              </View>
              <Switch
                value={setAsDefault}
                onValueChange={setSetAsDefault}
                trackColor={{false: alpha(theme.border, 0.8), true: theme.accent}}
                thumbColor={theme.surface}
              />
            </View>

            <View style={styles.footerActions}>
              <Pressable
                onPress={resetForm}
                style={[
                  styles.secondaryFooterButton,
                  {
                    backgroundColor: alpha(theme.panelAlt, 0.92),
                    borderColor: alpha(theme.border, 0.92),
                  },
                ]}>
                <Text
                  style={[styles.secondaryFooterButtonLabel, {color: theme.text}]}>
                  Reset
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={[
                  styles.primaryFooterButton,
                  {backgroundColor: theme.accent},
                ]}>
                <Text style={styles.primaryFooterButtonLabel}>
                  {editingMethodId ? 'Save method' : 'Add method'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MetricCard({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: typeof CONTROL_ROOM_THEME;
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.metricCard,
        {
          backgroundColor: alpha(theme.panelAlt, 0.9),
          borderColor: alpha(theme.border, 0.9),
        },
      ]}>
      <Text style={[styles.metricValue, {color: theme.text}]}>{value}</Text>
      <Text style={[styles.metricLabel, {color: theme.textMuted}]}>{label}</Text>
    </View>
  );
}

function FieldBlock({
  label,
  value,
  onChangeText,
  theme,
  error,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  theme: typeof CONTROL_ROOM_THEME;
  error?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address';
}): React.JSX.Element {
  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.fieldLabel, {color: theme.textMuted}]}>
        {label.toUpperCase()}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor={theme.textMuted}
        style={[
          styles.field,
          multiline ? styles.fieldMultiline : null,
          {
            color: theme.text,
            backgroundColor: alpha(theme.panelAlt, 0.92),
            borderColor: error ? theme.danger : alpha(theme.border, 0.92),
          },
        ]}
      />
      {error ? (
        <Text style={[styles.fieldError, {color: theme.danger}]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1},
  flexFill: {flex: 1},
  flexFillText: {flex: 1},
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  backButtonLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  metricValue: {
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  entryCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  entryTitle: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
  },
  entrySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    fontWeight: '700',
  },
  defaultPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  defaultPillLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  entryMeta: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  entryBody: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  secondaryAction: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  secondaryActionLabel: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  iconAction: {
    width: 52,
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmedAction: {opacity: 0.45},
  iconActionLabel: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: -2,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: -4,
  },
  formCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  formTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    marginBottom: 12,
  },
  editingHint: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  typeGrid: {
    gap: 10,
    marginBottom: 14,
  },
  typeOption: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  typeOptionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  typeOptionHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  fieldBlock: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  field: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  fieldMultiline: {
    minHeight: 112,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  fieldError: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginTop: 4,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  switchDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  secondaryFooterButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryFooterButtonLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  primaryFooterButton: {
    flex: 1.25,
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryFooterButtonLabel: {
    color: '#061018',
    fontSize: 16,
    fontWeight: '900',
  },
});

