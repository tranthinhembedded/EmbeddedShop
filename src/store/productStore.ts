import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {
  type CategoryId,
  type SortMode,
} from '../catalog';
import {zustandStorage} from '../services/persistence';
import {enqueueOfflineAction, useUIStore} from './uiStore';
import {trackEvent} from './monitorStore';

export {
  CATEGORIES,
  HOME_COLLECTIONS,
  INITIAL_ORDERS,
  PRODUCT_INDEX,
  PRODUCTS,
  TRENDING_TERMS,
} from '../catalog';

type SetStateAction<T> = T | ((previous: T) => T);

const resolveStateAction = <T,>(
  action: SetStateAction<T>,
  previous: T,
): T =>
  typeof action === 'function'
    ? (action as (previous: T) => T)(previous)
    : action;

export type CatalogViewMode = 'grid' | 'list';

type ProductState = {
  query: string;
  category: CategoryId;
  sortMode: SortMode;
  inStockOnly: boolean;
  favorites: string[];
  selectedBrand: string;
  searchHistory: string[];
  catalogViewMode: CatalogViewMode;
  favoritesViewMode: CatalogViewMode;
  setQuery: (value: SetStateAction<string>) => void;
  setCategory: (value: SetStateAction<CategoryId>) => void;
  setSortMode: (value: SetStateAction<SortMode>) => void;
  setInStockOnly: (value: SetStateAction<boolean>) => void;
  setSelectedBrand: (value: SetStateAction<string>) => void;
  addSearchHistory: (term: string) => void;
  clearSearchHistory: () => void;
  setCatalogViewMode: (mode: CatalogViewMode) => void;
  setFavoritesViewMode: (mode: CatalogViewMode) => void;
  toggleFavorite: (productId: string) => void;
  resetFilters: () => void;
};

const SEARCH_HISTORY_SEED = ['Raspberry Pi', 'Lidar', 'Motor driver'];

export const useProductStore = create<ProductState>()(
  persist(
    set => ({
      query: '',
      category: 'all',
      sortMode: 'popularity',
      inStockOnly: false,
      favorites: ['pi5-lab-kit', 'lidar-slam-core'],
      selectedBrand: 'all',
      searchHistory: SEARCH_HISTORY_SEED,
      catalogViewMode: 'grid',
      favoritesViewMode: 'grid',
      setQuery: value =>
        set(state => ({
          query: resolveStateAction(value, state.query),
        })),
      setCategory: value =>
        set(state => ({
          category: resolveStateAction(value, state.category),
        })),
      setSortMode: value =>
        set(state => ({
          sortMode: resolveStateAction(value, state.sortMode),
        })),
      setInStockOnly: value =>
        set(state => ({
          inStockOnly: resolveStateAction(value, state.inStockOnly),
        })),
      setSelectedBrand: value =>
        set(state => ({
          selectedBrand: resolveStateAction(value, state.selectedBrand),
        })),
      addSearchHistory: term =>
        set(state => ({
          searchHistory: [
            term,
            ...state.searchHistory.filter(item => item.toLowerCase() !== term.toLowerCase()),
          ].slice(0, 8),
        })),
      clearSearchHistory: () => set({searchHistory: []}),
      setCatalogViewMode: mode => set({catalogViewMode: mode}),
      setFavoritesViewMode: mode => set({favoritesViewMode: mode}),
      toggleFavorite: productId => {
        set(state => ({
          favorites: state.favorites.includes(productId)
            ? state.favorites.filter(item => item !== productId)
            : [...state.favorites, productId],
        }));

        if (useUIStore.getState().isOffline) {
          enqueueOfflineAction('favorite.toggle', {productId});
        }

        trackEvent('favorite.toggled', {productId});
      },
      resetFilters: () =>
        set({
          query: '',
          category: 'all',
          sortMode: 'popularity',
          inStockOnly: false,
          selectedBrand: 'all',
        }),
    }),
    {
      name: 'embedded-shop-product',
      storage: createJSONStorage(() => zustandStorage),
      partialize: state => ({
        query: state.query,
        category: state.category,
        sortMode: state.sortMode,
        inStockOnly: state.inStockOnly,
        favorites: state.favorites,
        selectedBrand: state.selectedBrand,
        searchHistory: state.searchHistory,
        catalogViewMode: state.catalogViewMode,
        favoritesViewMode: state.favoritesViewMode,
      }),
    },
  ),
);
