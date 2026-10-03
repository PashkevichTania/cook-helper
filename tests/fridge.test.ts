import assert from 'node:assert/strict';
import test from 'node:test';

import {
  findCatalogProduct,
  productCatalog,
  searchCatalog,
} from '../src/entities/product/catalog.ts';
import { moveProduct, productSchema } from '../src/entities/product/model.ts';

test('catalog supports both languages, aliases and ё normalization', () => {
  assert.equal(findCatalogProduct(' ПОМИДОР ')?.apiName, 'tomato');
  assert.equal(findCatalogProduct('tomatoes')?.id, 'tomato');
  assert.equal(findCatalogProduct('мед')?.id, 'honey');
  assert.ok(searchCatalog('кур').some((p) => p.id === 'chicken-breast'));
  assert.equal(
    new Set(productCatalog.map((p) => p.id)).size,
    productCatalog.length
  );
  assert.equal(findCatalogProduct('__proto__'), undefined);
});
test('custom products save with no API name or catalog reference, old products remain valid', () => {
  const p = {
    id: '1',
    name: 'Мой домашний пирог',
    type: 'other',
    fridgeZone: 'middleShelf',
    addedAt: '2026-10-03',
  };
  assert.equal(findCatalogProduct(p.name), undefined);
  assert.ok(productSchema.safeParse(p).success);
  assert.equal(productSchema.parse({ ...p, custom: true }).custom, true);
});
test('moving preserves batch identity, expiry and all other metadata', () => {
  const p = productSchema.parse({
    id: '1',
    name: 'Milk',
    apiName: 'milk',
    catalogId: 'milk',
    custom: false,
    type: 'dairy',
    quantity: 2,
    unit: 'l',
    fridgeZone: 'middleShelf',
    addedAt: '2026-10-03',
    expiresAt: '2026-10-01',
  });
  const second = { ...p, id: '2' };
  const result = moveProduct([p, second], '1', 'door');
  assert.deepEqual(result[0], { ...p, fridgeZone: 'door' });
  assert.equal(result[1], second);
  assert.equal(p.fridgeZone, 'middleShelf');
  assert.deepEqual(moveProduct([p], 'missing', 'freezer'), [p]);
});

test('pantry zones accept products, preserve data and participate in cooking inventory', () => {
  const flour = productSchema.parse({
    id: 'flour',
    name: 'Flour',
    type: 'grain',
    apiName: 'flour',
    fridgeZone: 'pantryGrains',
    addedAt: '2026-10-03',
  });
  const moved = moveProduct([flour], 'flour', 'pantrySpices');
  assert.equal(moved[0].fridgeZone, 'pantrySpices');
  assert.equal(moved[0].apiName, 'flour');
  assert.ok(productSchema.safeParse(moved[0]).success);
});

test('category search includes every matching product and preserves name lookup', () => {
  const labels = {
    meat: 'Мясо',
    vegetable: 'Овощи',
    dairy: 'Молочные продукты',
  };
  const meat = productCatalog.filter((p) => p.type === 'meat');
  assert.deepEqual(searchCatalog('  МЯСО  ', labels), meat);
  assert.deepEqual(searchCatalog('мяс', labels), meat);
  assert.deepEqual(searchCatalog('meat', labels), meat);
  const vegetables = productCatalog.filter((p) => p.type === 'vegetable');
  assert.ok(vegetables.length > 10);
  assert.deepEqual(searchCatalog('овощ', labels), vegetables);
  assert.deepEqual(
    searchCatalog('молочные', labels),
    productCatalog.filter((p) => p.type === 'dairy')
  );
  assert.ok(
    searchCatalog('кур', labels).some((p) => p.id === 'chicken-breast')
  );
  assert.deepEqual(searchCatalog('несуществующая категория', labels), []);
  assert.equal(searchCatalog('', labels).length, 10);
  assert.equal(findCatalogProduct('мясо'), undefined);
});

test('prepared and frozen foods resolve names, aliases and category searches', () => {
  assert.equal(findCatalogProduct('блины')?.type, 'preCooked');
  assert.equal(findCatalogProduct('пельмени')?.type, 'frozen');
  assert.equal(findCatalogProduct('мороженое')?.type, 'frozen');
  assert.equal(findCatalogProduct('мороженное')?.id, 'ice-cream');
  assert.equal(findCatalogProduct('Ice cream')?.id, 'ice-cream');
  assert.ok(
    searchCatalog('готовая', { preCooked: 'Готовая еда' }).some(
      (p) => p.id === 'pancakes'
    )
  );
  const frozen = searchCatalog('замороженное', { frozen: 'Замороженное' });
  assert.ok(frozen.some((p) => p.id === 'dumplings'));
  assert.ok(frozen.some((p) => p.id === 'ice-cream'));
});
