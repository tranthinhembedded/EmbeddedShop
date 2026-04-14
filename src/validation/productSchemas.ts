import {z} from 'zod';

import type {ManagedProductCategory} from '../types/productManagement';

const categories = [
  'sbc',
  'fpga',
  'robotics',
  'sensors',
  'power',
  'connectivity',
] as const satisfies readonly ManagedProductCategory[];

export const productImageSchema = z.object({
  id: z.string().min(1),
  uri: z.string().trim().url('Image preview must use a valid URL.'),
  name: z.string().trim().min(1, 'Image name is required.'),
  sizeInMb: z
    .number()
    .min(0.1, 'Image size must be greater than 0MB.')
    .max(10, 'Each image must be 10MB or smaller.'),
});

export const productSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(3, 'SKU must have at least 3 characters.')
    .max(32, 'SKU must be 32 characters or fewer.')
    .regex(/^[A-Z0-9-]+$/, 'SKU can only use uppercase letters, numbers, and dashes.'),
  name: z
    .string()
    .trim()
    .min(3, 'Product name must have at least 3 characters.')
    .max(120, 'Product name is too long.'),
  description: z
    .string()
    .trim()
    .min(20, 'Description should be at least 20 characters.')
    .max(2000, 'Description must stay within 2000 characters.'),
  price: z
    .number()
    .min(0, 'Price must be 0 or greater.'),
  category: z.enum(categories),
  tags: z
    .array(z.string().trim().min(1))
    .min(1, 'Please select at least one tag.')
    .max(6, 'Please keep the tag list to 6 items or fewer.'),
  images: z
    .array(productImageSchema)
    .min(1, 'Please add at least one product image.')
    .max(5, 'You can attach up to 5 images.'),
  stockQuantity: z
    .number()
    .int('Stock quantity must be a whole number.')
    .min(0, 'Stock quantity must be 0 or greater.'),
});

export type ProductFormValues = z.infer<typeof productSchema>;
