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
  ShippingAddress,
  useShopApp,
} from '../../store/shopAppContext';
import {CONTROL_ROOM_THEME, WORKBENCH_THEME} from '../../theme';
import {isValidVietnamPhoneNumber} from '../../utils/helpers';

type Props = NativeStackScreenProps<RootStackParamList, 'ShippingAddresses'>;
type FieldErrors = Partial<
  Record<'label' | 'company' | 'contactName' | 'phone' | 'email' | 'address', string>
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

export default function ShippingAddressesScreen({
  navigation,
}: Props): React.JSX.Element {
  const {
    dark,
    profile,
    shippingAddresses,
    saveShippingAddress,
    removeShippingAddress,
    setDefaultShippingAddress,
  } = useShopApp();
  const theme = dark ? CONTROL_ROOM_THEME : WORKBENCH_THEME;
  const scrollRef = useRef<ScrollView>(null);
  const formYRef = useRef(0);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});

  const orderedAddresses = useMemo(
    () =>
      [...shippingAddresses].sort((left, right) => {
        if (left.isDefault === right.isDefault) {
          return left.label.localeCompare(right.label);
        }

        return left.isDefault ? -1 : 1;
      }),
    [shippingAddresses],
  );

  const focusForm = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(formYRef.current - 16, 0),
        animated: true,
      });
    });
  };

  const resetForm = () => {
    setEditingAddressId(null);
    setLabel('');
    setCompany('');
    setContactName(profile.fullName);
    setPhone('');
    setEmail(profile.email);
    setAddress('');
    setSetAsDefault(shippingAddresses.length === 0);
    setErrors({});
  };

  const startCreate = () => {
    resetForm();
    focusForm();
  };

  const startEdit = (entry: ShippingAddress) => {
    setEditingAddressId(entry.id);
    setLabel(entry.label);
    setCompany(entry.company);
    setContactName(entry.contactName);
    setPhone(entry.phone);
    setEmail(entry.email);
    setAddress(entry.address);
    setSetAsDefault(entry.isDefault);
    setErrors({});
    focusForm();
  };

  const validateForm = () => {
    const nextErrors: FieldErrors = {};

    if (!label.trim()) {
      nextErrors.label = 'Add a short label for this address.';
    }

    if (!company.trim()) {
      nextErrors.company = 'Company or destination name is required.';
    }

    if (!contactName.trim()) {
      nextErrors.contactName = 'Contact person is required.';
    }

    if (!isValidVietnamPhoneNumber(phone)) {
      nextErrors.phone =
        'Use a valid VN phone format: 09xxxxxxxx, 0xxxxxxxxx, or +84xxxxxxxxx.';
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!address.trim() || address.trim().length < 12) {
      nextErrors.address = 'Enter a complete shipping address.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    saveShippingAddress({
      id: editingAddressId ?? undefined,
      label,
      company,
      contactName,
      phone,
      email,
      address,
      isDefault: setAsDefault,
    });
    resetForm();
  };

  const removeDisabled = shippingAddresses.length <= 1;
  const defaultAddress =
    shippingAddresses.find(entry => entry.isDefault) ?? shippingAddresses[0];

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
            <Pressable onPress={startCreate}>
              <Text style={[styles.linkLabel, {color: theme.accent}]}>
                {editingAddressId ? 'New address' : 'Add new'}
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
              SHIPPING ADDRESSES
            </Text>
            <Text style={[styles.title, {color: theme.text}]}>
              Manage delivery destinations
            </Text>
            <Text style={[styles.body, {color: theme.textMuted}]}>
              Keep your lab, factory, and office drop points ready for checkout.
            </Text>

            <View style={styles.metricsRow}>
              <MetricCard
                label="Saved"
                value={`${shippingAddresses.length}`}
                theme={theme}
              />
              <MetricCard
                label="Default"
                value={defaultAddress?.label ?? 'None'}
                theme={theme}
              />
            </View>
          </View>

          {orderedAddresses.map(entry => (
            <View
              key={entry.id}
              style={[
                styles.entryCard,
                {
                  backgroundColor: alpha(theme.panel, 0.96),
                  borderColor: alpha(
                    entry.isDefault ? theme.accent : theme.border,
                    entry.isDefault ? 0.36 : 0.94,
                  ),
                },
              ]}>
              <View style={styles.entryHeader}>
                <View style={styles.flexFill}>
                  <Text style={[styles.entryTitle, {color: theme.text}]}>
                    {entry.label}
                  </Text>
                  <Text style={[styles.entrySubtitle, {color: theme.textMuted}]}>
                    {entry.company}
                  </Text>
                </View>
                {entry.isDefault ? (
                  <View
                    style={[
                      styles.defaultPill,
                      {
                        backgroundColor: alpha(theme.accent, 0.14),
                        borderColor: alpha(theme.accent, 0.3),
                      },
                    ]}>
                    <Text style={[styles.defaultPillLabel, {color: theme.accent}]}>
                      DEFAULT
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={[styles.entryMeta, {color: theme.text}]}>
                {entry.contactName}
              </Text>
              <Text style={[styles.entryMeta, {color: theme.textMuted}]}>
                {entry.phone}
              </Text>
              <Text style={[styles.entryMeta, {color: theme.textMuted}]}>
                {entry.email}
              </Text>
              <Text style={[styles.entryBody, {color: theme.textMuted}]}>
                {entry.address}
              </Text>

              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => startEdit(entry)}
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
                  disabled={entry.isDefault}
                  onPress={() => setDefaultShippingAddress(entry.id)}
                  style={[
                    styles.secondaryAction,
                    {
                      backgroundColor: alpha(
                        entry.isDefault ? theme.accent : theme.panelAlt,
                        entry.isDefault ? 0.16 : 0.92,
                      ),
                      borderColor: alpha(
                        entry.isDefault ? theme.accent : theme.border,
                        entry.isDefault ? 0.34 : 0.92,
                      ),
                    },
                  ]}>
                  <Text
                    style={[
                      styles.secondaryActionLabel,
                      {color: entry.isDefault ? theme.accent : theme.text},
                    ]}>
                    {entry.isDefault ? 'Pinned' : 'Make default'}
                  </Text>
                </Pressable>
                <Pressable
                  disabled={removeDisabled}
                  onPress={() => {
                    if (editingAddressId === entry.id) {
                      resetForm();
                    }
                    removeShippingAddress(entry.id);
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
          ))}

          {removeDisabled ? (
            <Text style={[styles.helperText, {color: theme.textMuted}]}>
              Keep at least one saved address ready for checkout. Edit the current
              default if you need different details.
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
              editingAddressId
                ? {
                    borderColor: alpha(theme.accent, 0.36),
                  }
                : null,
            ]}>
            <Text style={[styles.eyebrow, {color: theme.accent}]}>
              {editingAddressId ? 'EDIT ADDRESS' : 'ADD ADDRESS'}
            </Text>
            <Text style={[styles.formTitle, {color: theme.text}]}>
              {editingAddressId
                ? 'Update the selected destination'
                : 'Create a new delivery destination'}
            </Text>
            {editingAddressId ? (
              <Text style={[styles.editingHint, {color: theme.textMuted}]}>
                You are editing an existing destination. Save to apply changes or
                tap "New address" to start a fresh entry.
              </Text>
            ) : null}

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
              label="Company"
              value={company}
              onChangeText={value => {
                setCompany(value);
                setErrors(previous => ({...previous, company: undefined}));
              }}
              theme={theme}
              error={errors.company}
            />
            <FieldBlock
              label="Contact"
              value={contactName}
              onChangeText={value => {
                setContactName(value);
                setErrors(previous => ({...previous, contactName: undefined}));
              }}
              theme={theme}
              error={errors.contactName}
            />
            <FieldBlock
              label="Phone"
              value={phone}
              keyboardType="phone-pad"
              onChangeText={value => {
                setPhone(value);
                setErrors(previous => ({...previous, phone: undefined}));
              }}
              theme={theme}
              error={errors.phone}
            />
            <FieldBlock
              label="Email"
              value={email}
              keyboardType="email-address"
              onChangeText={value => {
                setEmail(value);
                setErrors(previous => ({...previous, email: undefined}));
              }}
              theme={theme}
              error={errors.email}
            />
            <FieldBlock
              label="Address"
              value={address}
              multiline
              onChangeText={value => {
                setAddress(value);
                setErrors(previous => ({...previous, address: undefined}));
              }}
              theme={theme}
              error={errors.address}
            />

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
                  Use as default address
                </Text>
                <Text style={[styles.switchDescription, {color: theme.textMuted}]}>
                  New checkout sessions will prefill this destination first.
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
                  {editingAddressId ? 'Save address' : 'Add address'}
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
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
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
