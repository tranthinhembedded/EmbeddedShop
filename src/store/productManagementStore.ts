import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {zustandStorage} from '../services/persistence';
import type {
  ManagedProduct,
  ProductListParams,
} from '../types/productManagement';

type ProductManagementState = {
  page: number;
  pageSize: number;
  search: string;
  category: ProductListParams['category'];
  sortBy: NonNullable<ProductListParams['sortBy']>;
  selectedProductId: string | null;
  cachedProductIds: string[];
  lastSyncedAt: string | null;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (value: string) => void;
  setCategory: (value: ProductListParams['category']) => void;
  setSortBy: (value: NonNullable<ProductListParams['sortBy']>) => void;
  setSelectedProductId: (productId: string | null) => void;
  resetFilters: () => void;
  recordCacheSnapshot: (products: ManagedProduct[]) => void;
};

export const useProductManagementStore = create<ProductManagementState>()(
  persist(
    set => ({
      page: 1,
      pageSize: 6,
      search: '',
      category: 'all',
      sortBy: 'updated-desc',
      selectedProductId: null,
      cachedProductIds: [],
      lastSyncedAt: null,
      setPage: page => set({page}),
      setPageSize: pageSize => set({pageSize, page: 1}),
      setSearch: search => set({search, page: 1}),
      setCategory: category => set({category, page: 1}),
      setSortBy: sortBy => set({sortBy, page: 1}),
      setSelectedProductId: selectedProductId => set({selectedProductId}),
      resetFilters: () =>
        set({
          page: 1,
          pageSize: 6,
          search: '',
          category: 'all',
          sortBy: 'updated-desc',
        }),
      recordCacheSnapshot: products =>
        set({
          cachedProductIds: products.map(product => product.id),
          lastSyncedAt: new Date().toISOString(),
        }),
    }),
    {
      name: 'embedded-shop-product-management',
      storage: createJSONStorage(() => zustandStorage),
      partialize: state => ({
        page: state.page,
        pageSize: state.pageSize,
        search: state.search,
        category: state.category,
        sortBy: state.sortBy,
        selectedProductId: state.selectedProductId,
        cachedProductIds: state.cachedProductIds,
        lastSyncedAt: state.lastSyncedAt,
      }),
    },
  ),
);
