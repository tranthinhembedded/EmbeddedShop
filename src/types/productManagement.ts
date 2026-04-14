import type {CategoryId} from '../catalog';

export type ManagedProductCategory = Exclude<CategoryId, 'all'>;

export type ManagedProductImage = {
  id: string;
  uri: string;
  name: string;
  sizeInMb: number;
};

export type ManagedProduct = {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  category: ManagedProductCategory;
  tags: string[];
  images: ManagedProductImage[];
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductListParams = {
  page?: number;
  pageSize?: number;
  query?: string;
  category?: ManagedProductCategory | 'all';
  sortBy?: 'updated-desc' | 'updated-asc' | 'price-asc' | 'price-desc' | 'stock-desc';
};

export type ProductListResponse = {
  items: ManagedProduct[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ProductMutationPayload = {
  sku: string;
  name: string;
  description: string;
  price: number;
  category: ManagedProductCategory;
  tags: string[];
  images: ManagedProductImage[];
  stockQuantity: number;
};
