import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {PRODUCT_INDEX} from '../../catalog';
import {useAppAlert} from '../../components/common/AppAlertProvider';
import type {RootStackParamList} from '../../navigation/types';
import {
  PaymentMethod,
  PaymentMethodType,
  ShippingAddress,
  useShopApp,
} from '../../store/shopAppContext';
import {CONTROL_ROOM_THEME, WORKBENCH_THEME} from '../../theme';
import {isValidVietnamPhoneNumber} from '../../utils/helpers';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;
type CheckoutStepId = 'shipping' | 'payment' | 'review';
type FieldErrors = Partial<
  Record<
    | 'contactName'
    | 'phone'
    | 'email'
    | 'address'
    | 'paymentMethod'
    | 'cardHolder'
    | 'cardNumber'
    | 'cardExpiry',
    string
  >
>;

const CHECKOUT_STEPS: Array<{id: CheckoutStepId; label: string}> = [
  {id: 'shipping', label: 'Shipping'},
  {id: 'payment', label: 'Payment'},
  {id: 'review', label: 'Review'},
];

const PAYMENT_TYPE_COPY: Record<
  PaymentMethodType,
  {label: string; description: string}
> = {
  'credit-card': {
    label: 'Credit card',
    description: 'Visa, Mastercard, or Amex via simulated checkout.',
  },
  'debit-card': {
    label: 'Debit card',
    description: 'Local bank debit card through the secure gateway.',
  },
  paypal: {
    label: 'PayPal',
    description: 'Simulated PayPal approval for procurement teams.',
  },
  'cash-on-delivery': {
    label: 'Cash on delivery',
    description: 'Available for selected local shipment destinations.',
  },
};

const alpha = (hex: string, value: number) => {
  const normalized = hex.replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map(char => char + char)
          .join('')
      : normalized;
  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${value})`;
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const maskAccountReference = (
  method: Pick<PaymentMethod, 'type' | 'accountReference'> | null,
) => {
  if (!method) {
    return 'No payment method selected';
  }

  if (method.type === 'paypal' || method.type === 'cash-on-delivery') {
    return method.accountReference;
  }

  const digits = method.accountReference.replace(/\s+/g, '');
  if (digits.length <= 4) {
    return digits;
  }

  return `**** ${digits.slice(-4)}`;
};

export default function CheckoutScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const {
    dark,
    profile,
    cart,
    cartTotal,
    shippingAddresses,
    paymentMethods,
    placeOrder,
    markCheckoutCompleted,
  } = useShopApp();
  const {showAlert} = useAppAlert();
  const theme = dark ? CONTROL_ROOM_THEME : WORKBENCH_THEME;
  const subtotal = route.params.subtotal ?? cartTotal;
  const shippingLabel = route.params.shippingLabel ?? 'Standard dispatch';
  const shippingFee = route.params.shippingFee ?? 185000;
  const discountAmount = route.params.discountAmount ?? 0;
  const appliedPromoCode = route.params.appliedPromoCode ?? null;
  const total =
    route.params.total ?? Math.max(subtotal - discountAmount, 0) + shippingFee;

  const reviewLines = useMemo(
    () => cart.map(item => ({entry: item, product: PRODUCT_INDEX[item.productId]})),
    [cart],
  );
  const defaultAddress = useMemo(
    () => shippingAddresses.find(item => item.isDefault) ?? shippingAddresses[0] ?? null,
    [shippingAddresses],
  );
  const defaultPaymentMethod = useMemo(
    () => paymentMethods.find(item => item.isDefault) ?? paymentMethods[0] ?? null,
    [paymentMethods],
  );

  const [step, setStep] = useState<CheckoutStepId>('shipping');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    defaultAddress?.id ?? null,
  );
  const [company, setCompany] = useState(defaultAddress?.company ?? '');
  const [contactName, setContactName] = useState(
    defaultAddress?.contactName ?? profile.fullName,
  );
  const [phone, setPhone] = useState(defaultAddress?.phone ?? '');
  const [email, setEmail] = useState(defaultAddress?.email ?? profile.email);
  const [address, setAddress] = useState(defaultAddress?.address ?? '');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | null
  >(defaultPaymentMethod?.id ?? null);
  const [paymentType, setPaymentType] = useState<PaymentMethodType>(
    defaultPaymentMethod?.type ?? 'credit-card',
  );
  const [cardHolder, setCardHolder] = useState(
    defaultPaymentMethod?.holderName ?? profile.fullName,
  );
  const [cardNumber, setCardNumber] = useState(
    defaultPaymentMethod?.accountReference ?? '',
  );
  const [cardExpiry, setCardExpiry] = useState(
    defaultPaymentMethod?.expiry ?? '',
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  const selectedPayment = useMemo(
    () =>
      paymentMethods.find(item => item.id === selectedPaymentMethodId) ??
      defaultPaymentMethod,
    [defaultPaymentMethod, paymentMethods, selectedPaymentMethodId],
  );

  const applyAddress = useCallback(
    (entry: ShippingAddress | null) => {
      setSelectedAddressId(entry?.id ?? null);
      setCompany(entry?.company ?? '');
      setContactName(entry?.contactName ?? profile.fullName);
      setPhone(entry?.phone ?? '');
      setEmail(entry?.email ?? profile.email);
      setAddress(entry?.address ?? '');
      setErrors(previous => ({
        ...previous,
        contactName: undefined,
        phone: undefined,
        email: undefined,
        address: undefined,
      }));
    },
    [profile.email, profile.fullName],
  );

  const applyPaymentMethod = useCallback(
    (method: PaymentMethod | null) => {
      setSelectedPaymentMethodId(method?.id ?? null);
      setPaymentType(method?.type ?? 'credit-card');
      setCardHolder(method?.holderName ?? profile.fullName);
      setCardNumber(method?.accountReference ?? '');
      setCardExpiry(method?.expiry ?? '');
      setErrors(previous => ({
        ...previous,
        paymentMethod: undefined,
        cardHolder: undefined,
        cardNumber: undefined,
        cardExpiry: undefined,
      }));
    },
    [profile.fullName],
  );

  useEffect(() => {
    if (!selectedAddressId) {
      if (defaultAddress) {
        applyAddress(defaultAddress);
      }
      return;
    }

    const currentAddress = shippingAddresses.find(item => item.id === selectedAddressId);
    if (!currentAddress) {
      applyAddress(defaultAddress);
    }
  }, [applyAddress, defaultAddress, selectedAddressId, shippingAddresses]);

  useEffect(() => {
    if (!selectedPaymentMethodId) {
      if (defaultPaymentMethod) {
        applyPaymentMethod(defaultPaymentMethod);
      }
      return;
    }

    const currentMethod = paymentMethods.find(
      item => item.id === selectedPaymentMethodId,
    );
    if (!currentMethod) {
      applyPaymentMethod(defaultPaymentMethod);
    }
  }, [
    applyPaymentMethod,
    defaultPaymentMethod,
    paymentMethods,
    selectedPaymentMethodId,
  ]);

  const clearError = (key: keyof FieldErrors) =>
    setErrors(previous => ({...previous, [key]: undefined}));

  const validateShipping = () => {
    const nextErrors: FieldErrors = {};
    if (!contactName.trim()) {
      nextErrors.contactName = 'Contact name is required.';
    }
    if (!isValidVietnamPhoneNumber(phone)) {
      nextErrors.phone =
        'Use a valid VN phone format: 09xxxxxxxx, 0xxxxxxxxx, or +84xxxxxxxxx.';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!address.trim() || address.trim().length < 10) {
      nextErrors.address = 'Enter a complete shipping address.';
    }
    setErrors(previous => ({
      ...previous,
      contactName: nextErrors.contactName,
      phone: nextErrors.phone,
      email: nextErrors.email,
      address: nextErrors.address,
    }));
    return Object.keys(nextErrors).length === 0;
  };

  const validatePayment = () => {
    const nextErrors: FieldErrors = {};
    const normalizedCardNumber = cardNumber.replace(/\s+/g, '');

    if (!selectedPaymentMethodId && paymentMethods.length > 0) {
      nextErrors.paymentMethod = 'Select a payment method.';
    }

    if (paymentType === 'credit-card' || paymentType === 'debit-card') {
      if (!cardHolder.trim()) {
        nextErrors.cardHolder = 'Card holder name is required.';
      }
      if (normalizedCardNumber.length < 12) {
        nextErrors.cardNumber = 'Enter a valid card number.';
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry.trim())) {
        nextErrors.cardExpiry = 'Use MM/YY format.';
      }
    }

    if (paymentType === 'paypal') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cardNumber.trim())) {
        nextErrors.cardNumber = 'Enter a valid PayPal email.';
      }
      if (!cardHolder.trim()) {
        nextErrors.cardHolder = 'Approver name is required.';
      }
    }

    if (paymentType === 'cash-on-delivery') {
      if (!cardHolder.trim()) {
        nextErrors.cardHolder = 'Receiver name is required.';
      }
      if (!cardNumber.trim()) {
        nextErrors.cardNumber = 'Enter a short receiving note or reference.';
      }
    }

    setErrors(previous => ({
      ...previous,
      paymentMethod: nextErrors.paymentMethod,
      cardHolder: nextErrors.cardHolder,
      cardNumber: nextErrors.cardNumber,
      cardExpiry: nextErrors.cardExpiry,
    }));
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (step === 'shipping') {
      if (validateShipping()) {
        setStep('payment');
      }
      return;
    }

    if (step === 'payment' && validatePayment()) {
      setStep('review');
    }
  };

  const goBack = () => {
    if (step === 'review') {
      setStep('payment');
      return;
    }

    if (step === 'payment') {
      setStep('shipping');
      return;
    }

    navigation.goBack();
  };

  const placeCurrentOrder = () => {
    const shippingValid = validateShipping();
    const paymentValid = validatePayment();

    if (!shippingValid || !paymentValid) {
      setStep(!shippingValid ? 'shipping' : 'payment');
      return;
    }

    const result = placeOrder(contactName, {shippingFee, discountAmount});

    if (!result.success) {
      showAlert({
        tone: 'warning',
        eyebrow: 'CHECK CART',
        title: 'Cart is empty',
        message: 'Add hardware to the cart before placing an order.',
        buttons: [
          {
            text: 'Back to cart',
            onPress: () => navigation.goBack(),
          },
        ],
      });
      return;
    }

    markCheckoutCompleted();
    showAlert({
      tone: 'success',
      eyebrow: 'ORDER CONFIRMED',
      title: 'Order placed',
      message: `Order ${result.orderId} created for ${contactName}. Your procurement batch is now queued for processing.`,
      code: result.orderId,
      codeLabel: 'TRACKING',
      buttons: [
        {
          text: 'Done',
          onPress: () => navigation.goBack(),
        },
      ],
    });
  };

  if (!cart.length) {
    return (
      <SafeAreaView style={[styles.safe, {backgroundColor: theme.bg}]}>
        <View style={styles.wrap}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: alpha(theme.border, 0.92),
              },
            ]}>
            <Text style={[styles.kicker, {color: theme.accent}]}>CHECKOUT</Text>
            <Text style={[styles.title, {color: theme.text}]}>Cart is empty</Text>
            <Text style={[styles.text, {color: theme.textMuted}]}>
              Add some modules to the procurement bench before continuing.
            </Text>
            <Pressable
              onPress={() => navigation.goBack()}
              style={[
                styles.primaryButton,
                styles.primaryButtonSpaced,
                {backgroundColor: theme.accent},
              ]}>
              <Text style={styles.primaryText}>Back to cart</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, {backgroundColor: theme.bg}]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}>
        <View style={styles.wrap}>
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={[
                styles.back,
                {
                  backgroundColor: alpha(theme.panelAlt, 0.92),
                  borderColor: alpha(theme.border, 0.92),
                },
              ]}>
              <Text style={[styles.backText, {color: theme.text}]}>Back</Text>
            </Pressable>
            <View style={styles.fill}>
              <Text style={[styles.kicker, {color: theme.accent}]}>CHECKOUT</Text>
              <Text style={[styles.title, {color: theme.text}]}>
                Engineering checkout
              </Text>
              <Text style={[styles.text, {color: theme.textMuted}]}>
                Complete shipping, payment, and final review before dispatch.
              </Text>
            </View>
          </View>

          <View style={styles.badges}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: alpha(theme.accent, 0.12),
                  borderColor: alpha(theme.accent, 0.26),
                },
              ]}>
              <Text style={[styles.badgeText, {color: theme.accent}]}>
                {shippingLabel}
              </Text>
            </View>
            {appliedPromoCode ? (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: alpha(theme.lime, 0.12),
                    borderColor: alpha(theme.lime, 0.26),
                  },
                ]}>
                <Text style={[styles.badgeText, {color: theme.lime}]}>
                  Promo {appliedPromoCode}
                </Text>
              </View>
            ) : null}
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.surface,
                  borderColor: alpha(theme.border, 0.92),
                },
              ]}>
              <View style={styles.steps}>
                {CHECKOUT_STEPS.map((item, index) => {
                  const currentIndex = CHECKOUT_STEPS.findIndex(
                    stepItem => stepItem.id === step,
                  );
                  const active = item.id === step;
                  const done = index < currentIndex;

                  return (
                    <View key={item.id} style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepDot,
                          {
                            backgroundColor:
                              active || done
                                ? alpha(theme.accent, 0.18)
                                : alpha(theme.panelAlt, 0.92),
                            borderColor:
                              active || done
                                ? alpha(theme.accent, 0.34)
                                : alpha(theme.border, 0.92),
                          },
                        ]}>
                        <Text
                          style={[
                            styles.stepDotText,
                            {
                              color:
                                active || done ? theme.accent : theme.textMuted,
                            },
                          ]}>
                          {index + 1}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.stepText,
                          {color: active ? theme.text : theme.textMuted},
                        ]}>
                        {item.label}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {step === 'shipping' ? (
                <View>
                  <View style={styles.sectionHeader}>
                    <View style={styles.fill}>
                      <Text style={[styles.kicker, {color: theme.accent}]}>
                        STEP 1: SHIPPING ADDRESS
                      </Text>
                      <Text style={[styles.text, {color: theme.textMuted}]}>
                        Choose a saved address or enter a new shipping destination.
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        navigation.navigate('ShippingAddresses', {
                          tab: route.params.tab,
                        })
                      }>
                      <Text style={[styles.sectionLink, {color: theme.accent}]}>
                        Manage
                      </Text>
                    </Pressable>
                  </View>

                  {shippingAddresses.length ? (
                    <View style={styles.chips}>
                      {shippingAddresses.map(savedAddress => {
                        const selected = selectedAddressId === savedAddress.id;

                        return (
                          <Pressable
                            key={savedAddress.id}
                            onPress={() => applyAddress(savedAddress)}
                            style={[
                              styles.chip,
                              {
                                backgroundColor: selected
                                  ? alpha(theme.accent, 0.14)
                                  : alpha(theme.panelAlt, 0.92),
                                borderColor: selected
                                  ? alpha(theme.accent, 0.34)
                                  : alpha(theme.border, 0.92),
                              },
                            ]}>
                            <Text
                              style={[
                                styles.chipText,
                                {
                                  color: selected ? theme.text : theme.textMuted,
                                },
                              ]}>
                              {savedAddress.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.note,
                        {
                          backgroundColor: alpha(theme.panelAlt, 0.92),
                          borderColor: alpha(theme.border, 0.92),
                        },
                      ]}>
                      <Text style={[styles.text, {color: theme.textMuted}]}>
                        No saved shipping addresses yet. Add one to your profile or
                        enter a temporary address below.
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.label, styles.mt12, {color: theme.textMuted}]}>
                    COMPANY
                  </Text>
                  <TextInput
                    value={company}
                    onChangeText={setCompany}
                    style={[
                      styles.field,
                      {
                        color: theme.text,
                        backgroundColor: alpha(theme.panelAlt, 0.92),
                        borderColor: alpha(theme.border, 0.92),
                      },
                    ]}
                  />

                  <Text style={[styles.label, styles.mt12, {color: theme.textMuted}]}>
                    CONTACT
                  </Text>
                  <TextInput
                    value={contactName}
                    onChangeText={value => {
                      setContactName(value);
                      clearError('contactName');
                    }}
                    style={[
                      styles.field,
                      {
                        color: theme.text,
                        backgroundColor: alpha(theme.panelAlt, 0.92),
                        borderColor: errors.contactName
                          ? theme.danger
                          : alpha(theme.border, 0.92),
                      },
                    ]}
                  />
                  {errors.contactName ? (
                    <Text style={[styles.error, {color: theme.danger}]}>
                      {errors.contactName}
                    </Text>
                  ) : null}

                  <Text style={[styles.label, styles.mt12, {color: theme.textMuted}]}>
                    PHONE
                  </Text>
                  <TextInput
                    value={phone}
                    keyboardType="phone-pad"
                    onChangeText={value => {
                      setPhone(value);
                      clearError('phone');
                    }}
                    style={[
                      styles.field,
                      {
                        color: theme.text,
                        backgroundColor: alpha(theme.panelAlt, 0.92),
                        borderColor: errors.phone
                          ? theme.danger
                          : alpha(theme.border, 0.92),
                      },
                    ]}
                  />
                  {errors.phone ? (
                    <Text style={[styles.error, {color: theme.danger}]}>
                      {errors.phone}
                    </Text>
                  ) : null}

                  <Text style={[styles.label, styles.mt12, {color: theme.textMuted}]}>
                    EMAIL
                  </Text>
                  <TextInput
                    value={email}
                    keyboardType="email-address"
                    onChangeText={value => {
                      setEmail(value);
                      clearError('email');
                    }}
                    style={[
                      styles.field,
                      {
                        color: theme.text,
                        backgroundColor: alpha(theme.panelAlt, 0.92),
                        borderColor: errors.email
                          ? theme.danger
                          : alpha(theme.border, 0.92),
                      },
                    ]}
                  />
                  {errors.email ? (
                    <Text style={[styles.error, {color: theme.danger}]}>
                      {errors.email}
                    </Text>
                  ) : null}

                  <Text style={[styles.label, styles.mt12, {color: theme.textMuted}]}>
                    ADDRESS
                  </Text>
                  <TextInput
                    value={address}
                    multiline
                    onChangeText={value => {
                      setSelectedAddressId(null);
                      setAddress(value);
                      clearError('address');
                    }}
                    style={[
                      styles.field,
                      styles.multiline,
                      {
                        color: theme.text,
                        backgroundColor: alpha(theme.panelAlt, 0.92),
                        borderColor: errors.address
                          ? theme.danger
                          : alpha(theme.border, 0.92),
                      },
                    ]}
                  />
                  {errors.address ? (
                    <Text style={[styles.error, {color: theme.danger}]}>
                      {errors.address}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {step === 'payment' ? (
                <View>
                  <View style={styles.sectionHeader}>
                    <View style={styles.fill}>
                      <Text style={[styles.kicker, {color: theme.accent}]}>
                        STEP 2: PAYMENT METHOD
                      </Text>
                      <Text style={[styles.text, {color: theme.textMuted}]}>
                        Select how your team would like to settle this order.
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        navigation.navigate('PaymentMethods', {
                          tab: route.params.tab,
                        })
                      }>
                      <Text style={[styles.sectionLink, {color: theme.accent}]}>
                        Manage
                      </Text>
                    </Pressable>
                  </View>

                  {paymentMethods.map(method => {
                    const active = selectedPaymentMethodId === method.id;

                    return (
                      <Pressable
                        key={method.id}
                        onPress={() => applyPaymentMethod(method)}
                        style={[
                          styles.option,
                          {
                            backgroundColor: active
                              ? alpha(theme.accent, 0.12)
                              : alpha(theme.panelAlt, 0.92),
                            borderColor: active
                              ? alpha(theme.accent, 0.34)
                              : alpha(theme.border, 0.92),
                          },
                        ]}>
                        <View
                          style={[
                            styles.radio,
                            {
                              borderColor: active
                                ? theme.accent
                                : alpha(theme.border, 0.92),
                            },
                          ]}>
                          {active ? (
                            <View
                              style={[
                                styles.radioFill,
                                {backgroundColor: theme.accent},
                              ]}
                            />
                          ) : null}
                        </View>
                        <View style={styles.fill}>
                          <Text style={[styles.optionTitle, {color: theme.text}]}>
                            {method.label}
                          </Text>
                          <Text style={[styles.text, {color: theme.textMuted}]}>
                            {method.description}
                          </Text>
                          <Text style={[styles.optionMeta, {color: theme.textMuted}]}>
                            {maskAccountReference(method)}
                            {method.expiry ? `  |  ${method.expiry}` : ''}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}

                  {errors.paymentMethod ? (
                    <Text style={[styles.error, {color: theme.danger}]}>
                      {errors.paymentMethod}
                    </Text>
                  ) : null}

                  <Text style={[styles.label, styles.mt12, {color: theme.textMuted}]}>
                    {paymentType === 'cash-on-delivery'
                      ? 'RECEIVER'
                      : paymentType === 'paypal'
                        ? 'APPROVER'
                        : 'CARD HOLDER'}
                  </Text>
                  <TextInput
                    value={cardHolder}
                    onChangeText={value => {
                      setCardHolder(value);
                      clearError('cardHolder');
                    }}
                    style={[
                      styles.field,
                      {
                        color: theme.text,
                        backgroundColor: alpha(theme.panelAlt, 0.92),
                        borderColor: errors.cardHolder
                          ? theme.danger
                          : alpha(theme.border, 0.92),
                      },
                    ]}
                  />
                  {errors.cardHolder ? (
                    <Text style={[styles.error, {color: theme.danger}]}>
                      {errors.cardHolder}
                    </Text>
                  ) : null}

                  <Text style={[styles.label, styles.mt12, {color: theme.textMuted}]}>
                    {paymentType === 'paypal'
                      ? 'PAYPAL EMAIL'
                      : paymentType === 'cash-on-delivery'
                        ? 'REFERENCE'
                        : 'CARD NUMBER'}
                  </Text>
                  <TextInput
                    value={cardNumber}
                    keyboardType={
                      paymentType === 'paypal' ? 'email-address' : 'default'
                    }
                    onChangeText={value => {
                      setCardNumber(value);
                      clearError('cardNumber');
                    }}
                    style={[
                      styles.field,
                      {
                        color: theme.text,
                        backgroundColor: alpha(theme.panelAlt, 0.92),
                        borderColor: errors.cardNumber
                          ? theme.danger
                          : alpha(theme.border, 0.92),
                      },
                    ]}
                  />
                  {errors.cardNumber ? (
                    <Text style={[styles.error, {color: theme.danger}]}>
                      {errors.cardNumber}
                    </Text>
                  ) : null}

                  {paymentType === 'credit-card' || paymentType === 'debit-card' ? (
                    <>
                      <Text
                        style={[styles.label, styles.mt12, {color: theme.textMuted}]}>
                        EXPIRY
                      </Text>
                      <TextInput
                        value={cardExpiry}
                        placeholder="MM/YY"
                        placeholderTextColor={theme.textMuted}
                        onChangeText={value => {
                          setCardExpiry(value);
                          clearError('cardExpiry');
                        }}
                        style={[
                          styles.field,
                          {
                            color: theme.text,
                            backgroundColor: alpha(theme.panelAlt, 0.92),
                            borderColor: errors.cardExpiry
                              ? theme.danger
                              : alpha(theme.border, 0.92),
                          },
                        ]}
                      />
                      {errors.cardExpiry ? (
                        <Text style={[styles.error, {color: theme.danger}]}>
                          {errors.cardExpiry}
                        </Text>
                      ) : null}
                    </>
                  ) : (
                    <View
                      style={[
                        styles.note,
                        {
                          backgroundColor: alpha(theme.panelAlt, 0.92),
                          borderColor: alpha(theme.border, 0.92),
                        },
                      ]}>
                      <Text style={[styles.text, {color: theme.textMuted}]}>
                        {PAYMENT_TYPE_COPY[paymentType].description}
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}

              {step === 'review' ? (
                <View>
                  <Text style={[styles.kicker, {color: theme.accent}]}>
                    STEP 3: REVIEW ORDER
                  </Text>
                  <Text style={[styles.text, {color: theme.textMuted}]}>
                    Confirm shipping details, payment method, and order total
                    before placing the order.
                  </Text>

                  <View
                    style={[
                      styles.note,
                      {
                        backgroundColor: alpha(theme.panelAlt, 0.92),
                        borderColor: alpha(theme.border, 0.92),
                      },
                    ]}>
                    <Text style={[styles.label, {color: theme.textMuted}]}>
                      SHIPPING TO
                    </Text>
                    <Text style={[styles.optionTitle, {color: theme.text}]}>
                      {contactName}
                    </Text>
                    <Text style={[styles.text, {color: theme.textMuted}]}>
                      {company || 'No company specified'}
                    </Text>
                    <Text style={[styles.text, {color: theme.textMuted}]}>
                      {phone}
                    </Text>
                    <Text style={[styles.text, {color: theme.textMuted}]}>
                      {email}
                    </Text>
                    <Text style={[styles.text, {color: theme.textMuted}]}>
                      {address}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.note,
                      {
                        backgroundColor: alpha(theme.panelAlt, 0.92),
                        borderColor: alpha(theme.border, 0.92),
                      },
                    ]}>
                    <Text style={[styles.label, {color: theme.textMuted}]}>
                      PAYMENT
                    </Text>
                    <Text style={[styles.optionTitle, {color: theme.text}]}>
                      {selectedPayment?.label ?? PAYMENT_TYPE_COPY[paymentType].label}
                    </Text>
                    <Text style={[styles.text, {color: theme.textMuted}]}>
                      {selectedPayment?.description ??
                        PAYMENT_TYPE_COPY[paymentType].description}
                    </Text>
                    <Text style={[styles.text, {color: theme.textMuted}]}>
                      {maskAccountReference(
                        selectedPayment ?? {
                          type: paymentType,
                          accountReference: cardNumber,
                        },
                      )}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.note,
                      {
                        backgroundColor: alpha(theme.panelAlt, 0.92),
                        borderColor: alpha(theme.border, 0.92),
                      },
                    ]}>
                    <Text style={[styles.label, {color: theme.textMuted}]}>
                      ORDER ITEMS
                    </Text>
                    {reviewLines.map(({entry, product}) => (
                      <View key={product.id} style={styles.summaryRow}>
                        <View style={styles.fill}>
                          <Text style={[styles.textStrong, {color: theme.text}]}>
                            {product.name}
                          </Text>
                          <Text style={[styles.label, {color: theme.textMuted}]}>
                            Qty {entry.quantity}
                          </Text>
                        </View>
                        <Text style={[styles.textStrong, {color: theme.text}]}>
                          {formatPrice(product.price * entry.quantity)}
                        </Text>
                      </View>
                    ))}
                    <View
                      style={[
                        styles.divider,
                        {backgroundColor: alpha(theme.border, 0.92)},
                      ]}
                    />
                    <View style={styles.summaryRow}>
                      <Text style={[styles.text, {color: theme.textMuted}]}>
                        Subtotal
                      </Text>
                      <Text style={[styles.textStrong, {color: theme.text}]}>
                        {formatPrice(subtotal)}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.text, {color: theme.textMuted}]}>
                        Shipping ({shippingLabel})
                      </Text>
                      <Text style={[styles.textStrong, {color: theme.text}]}>
                        {shippingFee ? formatPrice(shippingFee) : 'Free'}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.text, {color: theme.textMuted}]}>
                        Discount {appliedPromoCode ? `(${appliedPromoCode})` : ''}
                      </Text>
                      <Text
                        style={[
                          styles.textStrong,
                          {color: discountAmount ? theme.lime : theme.textMuted},
                        ]}>
                        {discountAmount
                          ? `-${formatPrice(discountAmount)}`
                          : formatPrice(0)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.divider,
                        {backgroundColor: alpha(theme.border, 0.92)},
                      ]}
                    />
                    <View style={styles.summaryRow}>
                      <Text style={[styles.totalLabel, {color: theme.text}]}>
                        Order total
                      </Text>
                      <Text style={[styles.totalValue, {color: theme.lime}]}>
                        {formatPrice(total)}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}

              <View style={styles.actions}>
                <Pressable
                  onPress={goBack}
                  style={[
                    styles.secondaryButton,
                    {
                      backgroundColor: alpha(theme.panelAlt, 0.92),
                      borderColor: alpha(theme.border, 0.92),
                    },
                  ]}>
                  <Text style={[styles.secondaryText, {color: theme.text}]}>
                    {step === 'shipping' ? 'Cancel' : 'Back'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={step === 'review' ? placeCurrentOrder : goNext}
                  style={[styles.primaryButton, {backgroundColor: theme.accent}]}>
                  <Text style={styles.primaryText}>
                    {step === 'review' ? 'Place order' : 'Continue'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1},
  fill: {flex: 1},
  wrap: {flex: 1, paddingHorizontal: 16, paddingTop: 12},
  header: {flexDirection: 'row', alignItems: 'flex-start', gap: 12},
  back: {
    minWidth: 76,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {fontSize: 14, fontWeight: '700'},
  card: {borderRadius: 28, borderWidth: 1, padding: 18},
  kicker: {fontSize: 12, fontWeight: '800', letterSpacing: 2},
  title: {fontSize: 32, lineHeight: 38, fontWeight: '800', marginTop: 4},
  text: {fontSize: 15, lineHeight: 22, marginTop: 6},
  textStrong: {fontSize: 15, lineHeight: 22, fontWeight: '700'},
  badges: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16},
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {fontSize: 12, fontWeight: '800', letterSpacing: 1.2},
  scroll: {paddingTop: 16, paddingBottom: 32},
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 18,
  },
  stepItem: {flex: 1, alignItems: 'center', gap: 8},
  stepDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotText: {fontSize: 20, fontWeight: '800'},
  stepText: {fontSize: 15, fontWeight: '700'},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14, marginBottom: 8},
  chip: {
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {fontSize: 14, fontWeight: '700'},
  label: {fontSize: 12, fontWeight: '800', letterSpacing: 1.6},
  mt12: {marginTop: 12},
  field: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    marginTop: 8,
  },
  multiline: {minHeight: 108, paddingTop: 14, textAlignVertical: 'top'},
  error: {marginTop: 6, fontSize: 13, lineHeight: 18, fontWeight: '600'},
  option: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  optionMeta: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    fontWeight: '700',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioFill: {width: 10, height: 10, borderRadius: 5},
  optionTitle: {fontSize: 18, lineHeight: 24, fontWeight: '800'},
  note: {marginTop: 14, borderRadius: 20, borderWidth: 1, padding: 16},
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 12,
  },
  divider: {height: 1, marginTop: 14, marginBottom: 2},
  totalLabel: {fontSize: 16, fontWeight: '800'},
  totalValue: {fontSize: 24, fontWeight: '900'},
  actions: {flexDirection: 'row', gap: 12, marginTop: 18},
  secondaryButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {fontSize: 17, fontWeight: '800'},
  primaryButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonSpaced: {marginTop: 16},
  primaryText: {color: '#041019', fontSize: 17, fontWeight: '900'},
});

