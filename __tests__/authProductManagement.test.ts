import {createManagedProduct, listManagedProducts} from '../src/services/productManagementApi';
import {useAuthStore} from '../src/store/authStore';

describe('auth and product management flow', () => {
  afterEach(async () => {
    await useAuthStore.getState().logout();
  });

  it('logs in and fetches paginated products through the protected API', async () => {
    await useAuthStore.getState().login({
      email: 'admin@embeddedshop.app',
      password: 'EmbeddedShop123',
      rememberMe: false,
    });

    const response = await listManagedProducts({
      page: 1,
      pageSize: 4,
      query: '',
      category: 'all',
      sortBy: 'updated-desc',
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(response.items.length).toBeGreaterThan(0);
    expect(response.total).toBeGreaterThan(0);
  });

  it('creates a product after authentication', async () => {
    await useAuthStore.getState().login({
      email: 'admin@embeddedshop.app',
      password: 'EmbeddedShop123',
      rememberMe: true,
    });

    const result = await createManagedProduct({
      sku: `TEST-${Date.now()}`,
      name: 'ShopAI Test Product',
      description:
        'A test product created from Jest to verify the protected CRUD pipeline.',
      price: 1250000,
      category: 'sbc',
      tags: ['ROS2', 'Gateway'],
      images: [
        {
          id: 'test-image-1',
          uri: 'https://placehold.co/640x480/102434/F3FAFF.png?text=Jest',
          name: 'jest-image.png',
          sizeInMb: 1.4,
        },
      ],
      stockQuantity: 12,
    });

    expect(result.product.id).toContain('product-');
    expect(result.product.name).toBe('ShopAI Test Product');
    expect(result.message).toBe('Product created successfully.');
  });
});
