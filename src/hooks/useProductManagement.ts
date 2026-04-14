import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import {useEffect} from 'react';

import {
  createManagedProduct,
  deleteManagedProduct,
  getManagedProduct,
  listManagedProducts,
  updateManagedProduct,
} from '../services/productManagementApi';
import {showRequestToast} from '../services/httpClient';
import {useProductManagementStore} from '../store/productManagementStore';
import {pushToast} from '../store/uiStore';
import type {
  ManagedProduct,
  ProductListParams,
  ProductListResponse,
  ProductMutationPayload,
} from '../types/productManagement';

export const productManagementKeys = {
  root: ['product-management'] as const,
  lists: () => [...productManagementKeys.root, 'list'] as const,
  list: (params: ProductListParams) => [...productManagementKeys.lists(), params] as const,
  details: () => [...productManagementKeys.root, 'detail'] as const,
  detail: (productId: string) => [...productManagementKeys.details(), productId] as const,
};

const updatePagedLists = (
  current: ProductListResponse | undefined,
  updater: (items: ManagedProduct[]) => ManagedProduct[],
) => {
  if (!current) {
    return current;
  }

  const nextItems = updater(current.items);
  return {
    ...current,
    items: nextItems,
    total: nextItems.length > current.items.length ? current.total + 1 : current.total,
  };
};

export const useProductsQuery = (params: ProductListParams) => {
  const recordCacheSnapshot = useProductManagementStore(state => state.recordCacheSnapshot);
  const query = useQuery({
    queryKey: productManagementKeys.list(params),
    queryFn: () => listManagedProducts(params),
    placeholderData: previousData => previousData,
  });

  useEffect(() => {
    if (query.data?.items) {
      recordCacheSnapshot(query.data.items);
    }
  }, [query.data?.items, recordCacheSnapshot]);

  return query;
};

export const useProductQuery = (productId?: string | null) =>
  useQuery({
    queryKey: productId ? productManagementKeys.detail(productId) : productManagementKeys.detail('empty'),
    queryFn: () => getManagedProduct(productId ?? ''),
    enabled: Boolean(productId),
  });

type ListSnapshot = [QueryKey, ProductListResponse | undefined][];

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProductMutationPayload) => createManagedProduct(payload),
    onMutate: async payload => {
      await queryClient.cancelQueries({queryKey: productManagementKeys.lists()});
      const previousLists = queryClient.getQueriesData<ProductListResponse>({
        queryKey: productManagementKeys.lists(),
      });
      const optimisticProduct: ManagedProduct = {
        id: `optimistic-${Date.now()}`,
        sku: payload.sku,
        name: payload.name,
        description: payload.description,
        price: payload.price,
        category: payload.category,
        tags: payload.tags,
        images: payload.images,
        stockQuantity: payload.stockQuantity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueriesData<ProductListResponse>(
        {queryKey: productManagementKeys.lists()},
        current => updatePagedLists(current, items => [optimisticProduct, ...items].slice(0, current?.pageSize ?? items.length)),
      );

      return {previousLists};
    },
    onError: (error, _payload, context) => {
      context?.previousLists.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
      showRequestToast('Unable to create product', error);
    },
    onSuccess: async data => {
      pushToast({
        title: 'Product created',
        message: data.message,
        tone: 'success',
        durationMs: 2200,
      });
      await queryClient.invalidateQueries({queryKey: productManagementKeys.root});
    },
  });
};

export const useUpdateProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: ProductMutationPayload;
    }) => updateManagedProduct(productId, payload),
    onMutate: async ({productId, payload}) => {
      await queryClient.cancelQueries({queryKey: productManagementKeys.root});
      const previousLists: ListSnapshot = queryClient.getQueriesData<ProductListResponse>({
        queryKey: productManagementKeys.lists(),
      });
      const previousDetail = queryClient.getQueryData<ManagedProduct>(
        productManagementKeys.detail(productId),
      );

      queryClient.setQueriesData<ProductListResponse>(
        {queryKey: productManagementKeys.lists()},
        current =>
          current
            ? {
                ...current,
                items: current.items.map(item =>
                  item.id === productId
                    ? {
                        ...item,
                        ...payload,
                        sku: payload.sku,
                        updatedAt: new Date().toISOString(),
                      }
                    : item,
                ),
              }
            : current,
      );
      if (previousDetail) {
        queryClient.setQueryData<ManagedProduct>(productManagementKeys.detail(productId), {
          ...previousDetail,
          ...payload,
          updatedAt: new Date().toISOString(),
        });
      }

      return {previousLists, previousDetail};
    },
    onError: (error, variables, context) => {
      context?.previousLists.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });

      if (context?.previousDetail) {
        queryClient.setQueryData(
          productManagementKeys.detail(variables.productId),
          context.previousDetail,
        );
      }

      showRequestToast('Unable to update product', error);
    },
    onSuccess: async data => {
      pushToast({
        title: 'Product updated',
        message: data.message,
        tone: 'success',
        durationMs: 2200,
      });
      await queryClient.invalidateQueries({queryKey: productManagementKeys.root});
    },
  });
};

export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => deleteManagedProduct(productId),
    onMutate: async productId => {
      await queryClient.cancelQueries({queryKey: productManagementKeys.root});
      const previousLists = queryClient.getQueriesData<ProductListResponse>({
        queryKey: productManagementKeys.lists(),
      });
      const previousDetail = queryClient.getQueryData<ManagedProduct>(
        productManagementKeys.detail(productId),
      );

      queryClient.setQueriesData<ProductListResponse>(
        {queryKey: productManagementKeys.lists()},
        current =>
          current
            ? {
                ...current,
                items: current.items.filter(item => item.id !== productId),
                total: Math.max(0, current.total - 1),
              }
            : current,
      );
      queryClient.removeQueries({queryKey: productManagementKeys.detail(productId)});

      return {previousLists, previousDetail};
    },
    onError: (error, productId, context) => {
      context?.previousLists.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });

      if (context?.previousDetail) {
        queryClient.setQueryData(
          productManagementKeys.detail(productId),
          context.previousDetail,
        );
      }

      showRequestToast('Unable to delete product', error);
    },
    onSuccess: async data => {
      pushToast({
        title: 'Product deleted',
        message: data.message,
        tone: 'success',
        durationMs: 2200,
      });
      await queryClient.invalidateQueries({queryKey: productManagementKeys.root});
    },
  });
};
