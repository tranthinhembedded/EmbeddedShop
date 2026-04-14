import type {NavigatorScreenParams} from '@react-navigation/native';

import type {ShopTabId} from '../store/shopAppContext';

export type CheckoutRouteParams = {
  tab: ShopTabId;
  subtotal?: number;
  shippingLabel?: string;
  shippingFee?: number;
  discountAmount?: number;
  appliedPromoCode?: string | null;
  total?: number;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Favorites: undefined;
  Cart: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ProductDetail: {productId: string; tab: ShopTabId};
  Checkout: CheckoutRouteParams;
  OrderHistory: {tab: ShopTabId};
  EditProfile: {tab: ShopTabId};
  ShippingAddresses: {tab: ShopTabId};
  PaymentMethods: {tab: ShopTabId};
  Settings: {tab: ShopTabId};
  ProductManager: undefined;
  AdvancedLab: {tab?: ShopTabId} | undefined;
  Diagnostics: undefined;
  PostsExam: undefined;
  MapExam: undefined;
  AIChatExam: undefined;
  NotFound: {path?: string} | undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};
