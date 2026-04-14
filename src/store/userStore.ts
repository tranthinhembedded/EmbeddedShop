import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {
  INITIAL_ORDERS,
  type Order,
  type OrderCancellationReason,
  type CancellableOrderStatus,
  isCancellableOrderStatus,
} from '../catalog';
import {zustandStorage} from '../services/persistence';
import {useCartStore} from './cartStore';
import {
  enqueueOfflineAction,
  pushNotification,
  pushToast,
  useUIStore,
} from './uiStore';
import {trackEvent} from './monitorStore';

type SetStateAction<T> = T | ((previous: T) => T);

const resolveStateAction = <T,>(
  action: SetStateAction<T>,
  previous: T,
): T =>
  typeof action === 'function'
    ? (action as (previous: T) => T)(previous)
    : action;

export type PaymentMethodType =
  | 'credit-card'
  | 'debit-card'
  | 'paypal'
  | 'cash-on-delivery';

export type UserProfile = {
  fullName: string;
  email: string;
  title: string;
  bio: string;
};

export type ShippingAddress = {
  id: string;
  label: string;
  company: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  isDefault: boolean;
};

export type ShippingAddressInput = Omit<ShippingAddress, 'id' | 'isDefault'> & {
  id?: string;
  isDefault?: boolean;
};

export type PaymentMethod = {
  id: string;
  type: PaymentMethodType;
  label: string;
  description: string;
  holderName: string;
  accountReference: string;
  expiry?: string;
  isDefault: boolean;
};

export type PaymentMethodInput = Omit<PaymentMethod, 'id' | 'isDefault'> & {
  id?: string;
  isDefault?: boolean;
};

export type OrderPricing = {
  shippingFee?: number;
  discountAmount?: number;
};

export type PlaceOrderResult =
  | {success: true; orderId: string}
  | {success: false; reason: 'empty-cart'};

export type RequestOrderCancellationResult =
  | {success: true}
  | {success: false; reason: 'not-found' | 'not-cancellable'};

type UserState = {
  dark: boolean;
  notifications: boolean;
  profile: UserProfile;
  emailPublic: boolean;
  shippingAddresses: ShippingAddress[];
  paymentMethods: PaymentMethod[];
  orders: Order[];
  setDark: (value: SetStateAction<boolean>) => void;
  setNotifications: (value: SetStateAction<boolean>) => void;
  setProfile: (value: SetStateAction<UserProfile>) => void;
  setEmailPublic: (value: SetStateAction<boolean>) => void;
  saveShippingAddress: (address: ShippingAddressInput) => string;
  removeShippingAddress: (addressId: string) => void;
  setDefaultShippingAddress: (addressId: string) => void;
  savePaymentMethod: (method: PaymentMethodInput) => string;
  removePaymentMethod: (methodId: string) => void;
  setDefaultPaymentMethod: (methodId: string) => void;
  placeOrder: (
    contactName: string,
    pricing?: OrderPricing,
  ) => PlaceOrderResult;
  requestOrderCancellation: (
    orderId: string,
    cancelReason: OrderCancellationReason,
  ) => RequestOrderCancellationResult;
};

const createLocalId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

const initialProfile: UserProfile = {
  fullName: 'Alex Johnson',
  email: 'alex.johnson@embeddedshop.ai',
  title: 'Senior Procurement Engineer',
  bio: 'Building fast, reliable embedded hardware stacks for robotics and edge AI teams.',
};

const initialAddresses: ShippingAddress[] = [
  {
    id: 'addr-lab',
    label: 'Lab desk',
    company: 'Embedded Robotics Lab',
    contactName: 'Alex Johnson',
    phone: '+84 901 245 768',
    email: 'alex.johnson@embeddedshop.ai',
    address: '12 Nguyen Van Cu, District 5, Ho Chi Minh City',
    isDefault: true,
  },
  {
    id: 'addr-factory',
    label: 'Factory gate',
    company: 'Tan Cang Integration',
    contactName: 'Operations Team',
    phone: '+84 283 730 4421',
    email: 'ops@factory.example',
    address: 'Lot B4, High Tech Park, Thu Duc, Ho Chi Minh City',
    isDefault: false,
  },
  {
    id: 'addr-rd',
    label: 'R&D office',
    company: 'Vision Systems VN',
    contactName: 'Product Engineer',
    phone: '+84 912 604 335',
    email: 'rd@vision.example',
    address: '216 Pasteur, District 3, Ho Chi Minh City',
    isDefault: false,
  },
];

const initialPaymentMethods: PaymentMethod[] = [
  {
    id: 'pay-visa',
    type: 'credit-card',
    label: 'Visa ending 1111',
    description: 'Primary procurement card for module orders.',
    holderName: 'Alex Johnson',
    accountReference: '4111 1111 1111 1111',
    expiry: '12/28',
    isDefault: true,
  },
  {
    id: 'pay-debit',
    type: 'debit-card',
    label: 'Business debit 4820',
    description: 'Backup debit card for local dispatch.',
    holderName: 'Alex Johnson',
    accountReference: '4820 9080 1122 4401',
    expiry: '08/27',
    isDefault: false,
  },
  {
    id: 'pay-paypal',
    type: 'paypal',
    label: 'PayPal workspace',
    description: 'Procurement wallet for urgent online approvals.',
    holderName: 'Alex Johnson',
    accountReference: 'procurement@embeddedshop.ai',
    expiry: '',
    isDefault: false,
  },
  {
    id: 'pay-cod',
    type: 'cash-on-delivery',
    label: 'Cash on delivery',
    description: 'Available for local shipments and receiving-desk payments.',
    holderName: 'Receiving desk',
    accountReference: 'Pay on arrival',
    expiry: '',
    isDefault: false,
  },
];

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      dark: true,
      notifications: true,
      profile: initialProfile,
      emailPublic: false,
      shippingAddresses: initialAddresses,
      paymentMethods: initialPaymentMethods,
      orders: INITIAL_ORDERS,
      setDark: value =>
        set(state => ({
          dark: resolveStateAction(value, state.dark),
        })),
      setNotifications: value =>
        set(state => ({
          notifications: resolveStateAction(value, state.notifications),
        })),
      setProfile: value =>
        set(state => ({
          profile: resolveStateAction(value, state.profile),
        })),
      setEmailPublic: value =>
        set(state => ({
          emailPublic: resolveStateAction(value, state.emailPublic),
        })),
      saveShippingAddress: nextAddress => {
        const addressId = nextAddress.id ?? createLocalId('addr');

        set(state => {
          const normalizedAddress: ShippingAddress = {
            id: addressId,
            label: nextAddress.label.trim(),
            company: nextAddress.company.trim(),
            contactName: nextAddress.contactName.trim(),
            phone: nextAddress.phone.trim(),
            email: nextAddress.email.trim().toLowerCase(),
            address: nextAddress.address.trim(),
            isDefault: nextAddress.isDefault ?? false,
          };
          const withoutCurrent = state.shippingAddresses.filter(
            item => item.id !== addressId,
          );
          const nextList = [...withoutCurrent, normalizedAddress];

          return {
            shippingAddresses:
              normalizedAddress.isDefault || !nextList.some(item => item.isDefault)
                ? nextList.map(item => ({
                    ...item,
                    isDefault: item.id === addressId,
                  }))
                : nextList,
          };
        });

        return addressId;
      },
      removeShippingAddress: addressId =>
        set(state => {
          const nextList = state.shippingAddresses.filter(
            item => item.id !== addressId,
          );

          if (!nextList.length) {
            return {};
          }

          if (nextList.some(item => item.isDefault)) {
            return {shippingAddresses: nextList};
          }

          return {
            shippingAddresses: nextList.map((item, index) => ({
              ...item,
              isDefault: index === 0,
            })),
          };
        }),
      setDefaultShippingAddress: addressId =>
        set(state => ({
          shippingAddresses: state.shippingAddresses.map(item => ({
            ...item,
            isDefault: item.id === addressId,
          })),
        })),
      savePaymentMethod: nextMethod => {
        const methodId = nextMethod.id ?? createLocalId('pay');

        set(state => {
          const normalizedMethod: PaymentMethod = {
            id: methodId,
            type: nextMethod.type,
            label: nextMethod.label.trim(),
            description: nextMethod.description.trim(),
            holderName: nextMethod.holderName.trim(),
            accountReference: nextMethod.accountReference.trim(),
            expiry: nextMethod.expiry?.trim() ?? '',
            isDefault: nextMethod.isDefault ?? false,
          };
          const withoutCurrent = state.paymentMethods.filter(
            item => item.id !== methodId,
          );
          const nextList = [...withoutCurrent, normalizedMethod];

          return {
            paymentMethods:
              normalizedMethod.isDefault || !nextList.some(item => item.isDefault)
                ? nextList.map(item => ({
                    ...item,
                    isDefault: item.id === methodId,
                  }))
                : nextList,
          };
        });

        return methodId;
      },
      removePaymentMethod: methodId =>
        set(state => {
          const nextList = state.paymentMethods.filter(
            item => item.id !== methodId,
          );

          if (!nextList.length) {
            return {};
          }

          if (nextList.some(item => item.isDefault)) {
            return {paymentMethods: nextList};
          }

          return {
            paymentMethods: nextList.map((item, index) => ({
              ...item,
              isDefault: index === 0,
            })),
          };
        }),
      setDefaultPaymentMethod: methodId =>
        set(state => ({
          paymentMethods: state.paymentMethods.map(item => ({
            ...item,
            isDefault: item.id === methodId,
          })),
        })),
      placeOrder: (_contactName, pricing = {}) => {
        const {cart, cartTotal, clearCart} = useCartStore.getState();

        if (!cart.length) {
          return {success: false, reason: 'empty-cart'};
        }

        const shippingFee = pricing.shippingFee ?? 185000;
        const discountAmount = pricing.discountAmount ?? 0;
        const orderTotal = Math.max(cartTotal - discountAmount, 0) + shippingFee;
        const nextId = `ES-${Date.now().toString().slice(-5)}`;
        const now = new Date().toISOString();

        set(state => ({
          orders: [
            {
              id: nextId,
              date: now.slice(0, 10),
              status: useUIStore.getState().isOffline
                ? 'Awaiting payment'
                : 'Processing',
              total: orderTotal,
              items: cart.reduce((sum, item) => sum + item.quantity, 0),
              lineItems: cart.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
              })),
            },
            ...state.orders,
          ],
        }));

        if (useUIStore.getState().isOffline) {
          enqueueOfflineAction('place-order', {
            orderId: nextId,
            total: orderTotal,
          });
          pushToast({
            title: 'Order queued offline',
            message: 'The order will sync automatically once the app is back online.',
            tone: 'warning',
            durationMs: 3200,
          });
        } else {
          pushToast({
            title: 'Order created',
            message: `Order ${nextId} has been submitted successfully.`,
            tone: 'success',
            durationMs: 2400,
          });
        }

        pushNotification(
          'Order update',
          `Order ${nextId} is now ${
            useUIStore.getState().isOffline ? 'queued for sync' : 'processing'
          }.`,
        );

        trackEvent('order.created', {
          orderId: nextId,
          items: cart.length,
          total: orderTotal,
        });
        clearCart();

        return {success: true, orderId: nextId};
      },
      requestOrderCancellation: (orderId, cancelReason) => {
        const targetOrder = get().orders.find(order => order.id === orderId);

        if (!targetOrder) {
          return {success: false, reason: 'not-found'};
        }

        if (!isCancellableOrderStatus(targetOrder.status)) {
          return {success: false, reason: 'not-cancellable'};
        }

        const previousStatus = targetOrder.status as CancellableOrderStatus;

        set(state => ({
          orders: state.orders.map(order =>
            order.id === orderId
              ? {
                  ...order,
                  status: 'Cancellation review pending',
                  cancelRequest: {
                    reason: cancelReason,
                    requestedAt: new Date().toISOString(),
                    previousStatus,
                  },
                }
              : order,
          ),
        }));

        trackEvent('order.cancellation-requested', {
          orderId,
          reason: cancelReason,
        });

        return {success: true};
      },
    }),
    {
      name: 'embedded-shop-user',
      storage: createJSONStorage(() => zustandStorage),
      partialize: state => ({
        dark: state.dark,
        notifications: state.notifications,
        profile: state.profile,
        emailPublic: state.emailPublic,
        shippingAddresses: state.shippingAddresses,
        paymentMethods: state.paymentMethods,
        orders: state.orders,
      }),
    },
  ),
);
