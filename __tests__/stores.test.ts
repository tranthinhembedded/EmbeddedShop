import {useCartStore} from '../src/store/cartStore';
import {useProductStore} from '../src/store/productStore';
import {useUIStore} from '../src/store/uiStore';
import {useUserStore} from '../src/store/userStore';

describe('advanced stores', () => {
  beforeEach(() => {
    useProductStore.setState({
      query: '',
      category: 'all',
      sortMode: 'popularity',
      inStockOnly: false,
      favorites: ['pi5-lab-kit', 'lidar-slam-core'],
      selectedBrand: 'all',
      searchHistory: ['Raspberry Pi', 'Lidar', 'Motor driver'],
      catalogViewMode: 'grid',
      favoritesViewMode: 'grid',
    });

    useCartStore.setState({
      cart: [
        {productId: 'pi5-lab-kit', quantity: 1},
        {productId: 'can-motor-drive', quantity: 1},
      ],
      cartTotal: 5580000,
      checkoutResetVersion: 0,
    });

    useUIStore.setState({
      isOffline: false,
      syncInFlight: false,
      queuedActions: [],
      toasts: [],
      notifications: [],
    });
  });

  test('persists product favorites changes through the store api', () => {
    useProductStore.getState().toggleFavorite('de10-nano');

    expect(useProductStore.getState().favorites).toContain('de10-nano');
  });

  test('queues offline cart actions when offline mode is enabled', () => {
    useUIStore.getState().setOffline(true);
    useCartStore.getState().addToCart('de10-nano', 2);

    expect(useCartStore.getState().cart.some(item => item.productId === 'de10-nano')).toBe(true);
    expect(useUIStore.getState().queuedActions[0]).toMatchObject({
      type: 'cart.add',
    });
  });

  test('creates an order and clears the cart', () => {
    const result = useUserStore.getState().placeOrder('Alex Johnson', {
      shippingFee: 100000,
      discountAmount: 0,
    });

    expect(result).toMatchObject({success: true});
    expect(useCartStore.getState().cart).toHaveLength(0);
    expect(useUserStore.getState().orders[0]?.id).toBeDefined();
  });
});
