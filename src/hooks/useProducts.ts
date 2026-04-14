import {useMemo} from 'react';

import {CATEGORIES, PRODUCTS} from '../store/productStore';

export function useProducts() {
  return useMemo(
    () => ({
      products: PRODUCTS,
      categories: CATEGORIES,
    }),
    [],
  );
}
