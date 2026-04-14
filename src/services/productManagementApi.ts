import {apiClient} from './httpClient';
import type {
  ManagedProduct,
  ProductListParams,
  ProductListResponse,
  ProductMutationPayload,
} from '../types/productManagement';

export const PRODUCT_TAG_OPTIONS = [
  'ROS2',
  'Edge AI',
  'Gateway',
  'Motion',
  'Industrial IO',
  'Machine Vision',
  'Navigation',
  'CAN',
  'Telemetry',
  'Realtime',
] as const;

export const PRODUCT_IMAGE_LIBRARY = [
  {
    id: 'sample-pi',
    uri: 'https://placehold.co/640x480/0F2436/F4FBFF.png?text=Control+Board',
    name: 'control-board.png',
    sizeInMb: 1.3,
  },
  {
    id: 'sample-sensor',
    uri: 'https://placehold.co/640x480/13304A/FFFFFF.png?text=Sensor+Module',
    name: 'sensor-module.png',
    sizeInMb: 1.8,
  },
  {
    id: 'sample-driver',
    uri: 'https://placehold.co/640x480/1B3A2D/F6FFF7.png?text=Motor+Driver',
    name: 'motor-driver.png',
    sizeInMb: 1.6,
  },
  {
    id: 'sample-fpga',
    uri: 'https://placehold.co/640x480/3A2411/FFF8F0.png?text=FPGA+Kit',
    name: 'fpga-kit.png',
    sizeInMb: 1.9,
  },
] as const;

export const listManagedProducts = async (params: ProductListParams) => {
  const response = await apiClient.get<ProductListResponse>('/products', {params});
  return response.data;
};

export const getManagedProduct = async (productId: string) => {
  const response = await apiClient.get<{product: ManagedProduct}>(`/products/${productId}`);
  return response.data.product;
};

export const createManagedProduct = async (payload: ProductMutationPayload) => {
  const response = await apiClient.post<{product: ManagedProduct; message: string}>(
    '/products',
    payload,
  );
  return response.data;
};

export const updateManagedProduct = async (
  productId: string,
  payload: ProductMutationPayload,
) => {
  const response = await apiClient.put<{product: ManagedProduct; message: string}>(
    `/products/${productId}`,
    payload,
  );
  return response.data;
};

export const deleteManagedProduct = async (productId: string) => {
  const response = await apiClient.delete<{id: string; message: string}>(
    `/products/${productId}`,
  );
  return response.data;
};
