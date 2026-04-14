import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {zustandStorage} from '../services/persistence';
import {enqueueOfflineAction, pushToast, useUIStore} from './uiStore';
import {trackEvent} from './monitorStore';
import {PRODUCT_INDEX} from './productStore';

export type CartLineItem = {
  productId: string;
  quantity: number;
};

export type CartState = {
  cart: CartLineItem[];
  checkoutResetVersion: number;
  cartTotal: number;
  addToCart: (productId: string, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  markCheckoutCompleted: () => void;
};

const getCartTotal = (items: CartLineItem[]) =>
  items.reduce(
    (sum, item) => sum + (PRODUCT_INDEX[item.productId]?.price ?? 0) * item.quantity,
    0,
  );

const initialCart: CartLineItem[] = [
  {productId: 'pi5-lab-kit', quantity: 1},
  {productId: 'can-motor-drive', quantity: 1},
];

export const initialCartState = {
  cart: initialCart,
  checkoutResetVersion: 0,
  cartTotal: getCartTotal(initialCart),
};

export const useCartStore = create<CartState>()(
  persist(
    set => ({
      ...initialCartState,
      addToCart: (productId, quantity = 1) => {
        set(state => {
          const existing = state.cart.find(item => item.productId === productId);
          const nextCart = existing
            ? state.cart.map(item =>
                item.productId === productId
                  ? {...item, quantity: item.quantity + quantity}
                  : item,
              )
            : [...state.cart, {productId, quantity}];

          return {
            cart: nextCart,
            cartTotal: getCartTotal(nextCart),
          };
        });

        if (useUIStore.getState().isOffline) {
          enqueueOfflineAction('cart.add', {productId, quantity});
        }

        trackEvent('cart.added', {productId, quantity});
      },
      updateCartQuantity: (productId, quantity) => {
        const safeQuantity = Math.max(1, quantity);

        set(state => {
          const nextCart = state.cart.map(item =>
            item.productId === productId
              ? {...item, quantity: safeQuantity}
              : item,
          );

          return {
            cart: nextCart,
            cartTotal: getCartTotal(nextCart),
          };
        });

        if (useUIStore.getState().isOffline) {
          enqueueOfflineAction('cart.update', {productId, quantity: safeQuantity});
        }

        trackEvent('cart.quantity-updated', {productId, quantity: safeQuantity});
      },
      removeFromCart: productId => {
        set(state => {
          const nextCart = state.cart.filter(item => item.productId !== productId);

          return {
            cart: nextCart,
            cartTotal: getCartTotal(nextCart),
          };
        });

        if (useUIStore.getState().isOffline) {
          enqueueOfflineAction('cart.remove', {productId});
        }

        pushToast({
          title: 'Removed from cart',
          message: 'The item was removed from your cart.',
          tone: 'info',
          durationMs: 1800,
        });
        trackEvent('cart.removed', {productId});
      },
      clearCart: () => {
        set({
          cart: [],
          cartTotal: 0,
        });
      },
      markCheckoutCompleted: () =>
        set(state => ({
          checkoutResetVersion: state.checkoutResetVersion + 1,
        })),
    }),
    {
      name: 'embedded-shop-cart',
      storage: createJSONStorage(() => zustandStorage),
      partialize: state => ({
        cart: state.cart,
        checkoutResetVersion: state.checkoutResetVersion,
      }),
    },
  ),
);
