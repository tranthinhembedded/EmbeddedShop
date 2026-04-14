import type {LinkingOptions} from '@react-navigation/native';

import type {RootStackParamList} from './types';

export const appLinking: LinkingOptions<RootStackParamList> = {
  prefixes: ['embeddedshop://', 'https://embeddedshop.example.com'],
  config: {
    screens: {
      Splash: 'splash',
      Auth: {
        path: 'auth',
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
        },
      },
      MainTabs: {
        path: '',
        screens: {
          Home: '',
          Search: 'catalog',
          Favorites: 'favorites',
          Cart: 'cart',
          Profile: 'profile',
        },
      },
      ProductDetail: {
        path: 'product/:productId/:tab?',
        parse: {
          productId: value => value,
          tab: value => value,
        },
      },
      Checkout: {
        path: 'checkout/:tab?',
        parse: {
          tab: value => value,
          subtotal: Number,
          shippingFee: Number,
          discountAmount: Number,
          total: Number,
        },
      },
      OrderHistory: 'orders/:tab?',
      EditProfile: 'profile/edit/:tab?',
      ShippingAddresses: 'profile/addresses/:tab?',
      PaymentMethods: 'profile/payments/:tab?',
      Settings: 'settings/:tab?',
      ProductManager: 'product-manager',
      AdvancedLab: 'advanced-lab/:tab?',
      Diagnostics: 'diagnostics',
      PostsExam: 'posts-exam',
      NotFound: '*',
    },
  },
};
