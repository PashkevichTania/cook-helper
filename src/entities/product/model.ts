import { z } from 'zod';

import { findCatalogProduct } from './catalog.ts';

export const zones = [
  'topShelf',
  'middleShelf',
  'bottomShelf',
  'drawer',
  'door',
  'freezer',
  'pantryGrains',
  'pantrySpices',
] as const;
export const categories = [
  'vegetable',
  'fruit',
  'meat',
  'fish',
  'dairy',
  'eggs',
  'grain',
  'pasta',
  'drink',
  'sauce',
  'spice',
  'frozen',
  'preCooked',
  'other',
] as const;
export const units = ['g', 'kg', 'ml', 'l', 'pcs', 'pack'] as const;
export const categoryEmoji: Record<(typeof categories)[number], string> = {
  vegetable: '🥕',
  fruit: '🍎',
  meat: '🥩',
  fish: '🐟',
  dairy: '🥛',
  eggs: '🥚',
  grain: '🌾',
  pasta: '🍝',
  drink: '🥤',
  sauce: '🥫',
  spice: '🌿',
  frozen: '🧊',
  preCooked: '🍱',
  other: '🛒',
};

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && localDate(date) === value;
}

export const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  apiName: z.string().optional(),
  catalogId: z.string().optional(),
  custom: z.boolean().optional(),
  type: z.enum(categories),
  quantity: z.number().positive().finite().optional(),
  unit: z.enum(units).optional(),
  fridgeZone: z.enum(zones),
  addedAt: z.string(),
  expiresAt: z.string().refine(validDate).optional(),
});
export type Product = z.infer<typeof productSchema>;
export type ExpirationStatus = 'none' | 'fresh' | 'soon' | 'expired';

export function expirationStatus(
  expiresAt?: string,
  now = new Date()
): ExpirationStatus {
  if (!expiresAt) return 'none';
  if (expiresAt < localDate(now)) return 'expired';
  const threshold = new Date(now);
  threshold.setDate(threshold.getDate() + 3);
  return expiresAt <= localDate(threshold) ? 'soon' : 'fresh';
}

// Shared by future recipe requests and AI context. Never persist this derived list.
export function availableProducts(products: Product[], now = new Date()) {
  return products.filter(
    (product) => expirationStatus(product.expiresAt, now) !== 'expired'
  );
}

export function normalizeProduct(name: string) {
  return findCatalogProduct(name);
}
export function moveProduct(
  products: Product[],
  id: string,
  zone: Product['fridgeZone']
): Product[] {
  if (!zones.includes(zone)) return products;
  return products.map((product) =>
    product.id === id ? { ...product, fridgeZone: zone } : product
  );
}
