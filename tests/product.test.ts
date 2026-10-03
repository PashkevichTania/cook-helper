import assert from 'node:assert/strict';
import test from 'node:test';

import {
  availableProducts,
  expirationStatus,
  normalizeProduct,
  productSchema,
} from '../src/entities/product/model.ts';

const now = new Date(2026, 9, 3, 23, 59);
test('expiration uses local calendar dates and includes today through day three', () => {
  assert.equal(expirationStatus(undefined, now), 'none');
  assert.equal(expirationStatus('2026-10-02', now), 'expired');
  assert.equal(expirationStatus('2026-10-03', now), 'soon');
  assert.equal(expirationStatus('2026-10-06', now), 'soon');
  assert.equal(expirationStatus('2026-10-07', now), 'fresh');
  assert.equal(expirationStatus('2027-01-02', new Date(2026, 11, 30)), 'soon');
});
test('only expired products are removed from cooking context', () => {
  const base = {
    name: 'Custom ingredient',
    type: 'other',
    fridgeZone: 'door',
    addedAt: now.toISOString(),
  };
  const products = [
    productSchema.parse({ ...base, id: 'expired', expiresAt: '2026-10-02' }),
    productSchema.parse({ ...base, id: 'today', expiresAt: '2026-10-03' }),
    productSchema.parse({ ...base, id: 'undated' }),
  ];
  assert.deepEqual(
    availableProducts(products, now).map((item) => item.id),
    ['today', 'undated']
  );
  assert.equal(products.length, 3);
});
test('arbitrary names are valid without normalization, while invalid amounts and dates fail', () => {
  const base = {
    id: '1',
    name: '  Бабушкин пирог  ',
    type: 'other',
    fridgeZone: 'middleShelf',
    addedAt: now.toISOString(),
  };
  assert.equal(productSchema.parse(base).name, 'Бабушкин пирог');
  assert.equal(normalizeProduct(base.name), undefined);
  assert.equal(normalizeProduct(' МОЛОКО ')?.apiName, 'milk');
  assert.equal(
    productSchema.safeParse({ ...base, quantity: 0 }).success,
    false
  );
  assert.equal(
    productSchema.safeParse({ ...base, quantity: -1 }).success,
    false
  );
  assert.equal(
    productSchema.safeParse({ ...base, expiresAt: '2026-02-30' }).success,
    false
  );
  assert.equal(productSchema.safeParse({ ...base, name: '  ' }).success, false);
});
