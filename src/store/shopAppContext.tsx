import React from 'react';

import type {CategoryId, SortMode, OrderCancellationReason} from '../catalog';
import {useShallow} from 'zustand/shallow';

import {useCartStore} from './cartStore';
import {useProductStore} from './productStore';
import {
  useUserStore,
  type OrderPricing,
  type PaymentMethod,
  type PaymentMethodInput,
  type PlaceOrderResult,
  type RequestOrderCancellationResult,
  type ShippingAddress,
  type ShippingAddressInput,
  type UserProfile,
} from './userStore';

export type ShopTabId = 'home' | 'catalog' | 'saved' | 'cart' | 'profile';
export type CartEntry = {productId: string; quantity: number};
export type {
  OrderPricing,
  PaymentMethod,
  PaymentMethodInput,
  PaymentMethodType,
  PlaceOrderResult,
  RequestOrderCancellationResult,
  ShippingAddress,
  ShippingAddressInput,
  UserProfile,
} from './userStore';

type ShopAppContextValue = {
  dark: boolean;
  setDark: React.Dispatch<React.SetStateAction<boolean>>;
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  category: CategoryId;
  setCategory: React.Dispatch<React.SetStateAction<CategoryId>>;
  sortMode: SortMode;
  setSortMode: React.Dispatch<React.SetStateAction<SortMode>>;
  inStockOnly: boolean;
  setInStockOnly: React.Dispatch<React.SetStateAction<boolean>>;
  favorites: string[];
  cart: CartEntry[];
  orders: ReturnType<typeof useUserStore.getState>['orders'];
  notifications: boolean;
  setNotifications: React.Dispatch<React.SetStateAction<boolean>>;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  emailPublic: boolean;
  setEmailPublic: React.Dispatch<React.SetStateAction<boolean>>;
  shippingAddresses: ShippingAddress[];
  saveShippingAddress: (address: ShippingAddressInput) => string;
  removeShippingAddress: (addressId: string) => void;
  setDefaultShippingAddress: (addressId: string) => void;
  paymentMethods: PaymentMethod[];
  savePaymentMethod: (method: PaymentMethodInput) => string;
  removePaymentMethod: (methodId: string) => void;
  setDefaultPaymentMethod: (methodId: string) => void;
  checkoutResetVersion: number;
  cartTotal: number;
  addToCart: (productId: string, quantity?: number) => void;
  toggleFavorite: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  placeOrder: (contactName: string, pricing?: OrderPricing) => PlaceOrderResult;
  requestOrderCancellation: (
    orderId: string,
    cancelReason: OrderCancellationReason,
  ) => RequestOrderCancellationResult;
  markCheckoutCompleted: () => void;
};

export function ShopAppProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <>{children}</>;
}

export function useShopApp(): ShopAppContextValue {
  const productSlice = useProductStore(
    useShallow(state => ({
      query: state.query,
      setQuery: state.setQuery,
      category: state.category,
      setCategory: state.setCategory,
      sortMode: state.sortMode,
      setSortMode: state.setSortMode,
      inStockOnly: state.inStockOnly,
      setInStockOnly: state.setInStockOnly,
      favorites: state.favorites,
      toggleFavorite: state.toggleFavorite,
    })),
  );

  const cartSlice = useCartStore(
    useShallow(state => ({
      cart: state.cart,
      cartTotal: state.cartTotal,
      checkoutResetVersion: state.checkoutResetVersion,
      addToCart: state.addToCart,
      updateCartQuantity: state.updateCartQuantity,
      removeFromCart: state.removeFromCart,
      markCheckoutCompleted: state.markCheckoutCompleted,
    })),
  );

  const userSlice = useUserStore(
    useShallow(state => ({
      dark: state.dark,
      setDark: state.setDark,
      notifications: state.notifications,
      setNotifications: state.setNotifications,
      profile: state.profile,
      setProfile: state.setProfile,
      emailPublic: state.emailPublic,
      setEmailPublic: state.setEmailPublic,
      shippingAddresses: state.shippingAddresses,
      saveShippingAddress: state.saveShippingAddress,
      removeShippingAddress: state.removeShippingAddress,
      setDefaultShippingAddress: state.setDefaultShippingAddress,
      paymentMethods: state.paymentMethods,
      savePaymentMethod: state.savePaymentMethod,
      removePaymentMethod: state.removePaymentMethod,
      setDefaultPaymentMethod: state.setDefaultPaymentMethod,
      orders: state.orders,
      placeOrder: state.placeOrder,
      requestOrderCancellation: state.requestOrderCancellation,
    })),
  );

  return {
    dark: userSlice.dark,
    setDark: userSlice.setDark as React.Dispatch<React.SetStateAction<boolean>>,
    query: productSlice.query,
    setQuery: productSlice.setQuery as React.Dispatch<React.SetStateAction<string>>,
    category: productSlice.category,
    setCategory:
      productSlice.setCategory as React.Dispatch<React.SetStateAction<CategoryId>>,
    sortMode: productSlice.sortMode,
    setSortMode:
      productSlice.setSortMode as React.Dispatch<React.SetStateAction<SortMode>>,
    inStockOnly: productSlice.inStockOnly,
    setInStockOnly:
      productSlice.setInStockOnly as React.Dispatch<
        React.SetStateAction<boolean>
      >,
    favorites: productSlice.favorites,
    cart: cartSlice.cart,
    orders: userSlice.orders,
    notifications: userSlice.notifications,
    setNotifications:
      userSlice.setNotifications as React.Dispatch<React.SetStateAction<boolean>>,
    profile: userSlice.profile,
    setProfile:
      userSlice.setProfile as React.Dispatch<React.SetStateAction<UserProfile>>,
    emailPublic: userSlice.emailPublic,
    setEmailPublic:
      userSlice.setEmailPublic as React.Dispatch<
        React.SetStateAction<boolean>
      >,
    shippingAddresses: userSlice.shippingAddresses,
    saveShippingAddress: userSlice.saveShippingAddress,
    removeShippingAddress: userSlice.removeShippingAddress,
    setDefaultShippingAddress: userSlice.setDefaultShippingAddress,
    paymentMethods: userSlice.paymentMethods,
    savePaymentMethod: userSlice.savePaymentMethod,
    removePaymentMethod: userSlice.removePaymentMethod,
    setDefaultPaymentMethod: userSlice.setDefaultPaymentMethod,
    checkoutResetVersion: cartSlice.checkoutResetVersion,
    cartTotal: cartSlice.cartTotal,
    addToCart: cartSlice.addToCart,
    toggleFavorite: productSlice.toggleFavorite,
    updateCartQuantity: cartSlice.updateCartQuantity,
    removeFromCart: cartSlice.removeFromCart,
    placeOrder: userSlice.placeOrder,
    requestOrderCancellation: userSlice.requestOrderCancellation,
    markCheckoutCompleted: cartSlice.markCheckoutCompleted,
  };
}
