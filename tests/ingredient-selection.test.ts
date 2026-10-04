import assert from 'node:assert/strict';
import test from 'node:test';

import { chatInventory } from '../src/entities/chat/model.ts';
import type { Product } from '../src/entities/product/model.ts';
import { useIngredientSelection } from '../src/entities/product/selection.ts';
import {
  cookingInventory,
  searchKey,
} from '../src/entities/recipe/matching.ts';

const products: Product[] = [
  {
    id: '1',
    name: 'Milk carton',
    apiName: 'milk',
    type: 'dairy',
    fridgeZone: 'door',
    addedAt: '2026-10-01',
  },
  {
    id: '2',
    name: 'Another milk carton',
    apiName: 'milk',
    type: 'dairy',
    fridgeZone: 'door',
    addedAt: '2026-10-01',
  },
  {
    id: '3',
    name: 'Eggs',
    apiName: 'eggs',
    type: 'eggs',
    fridgeZone: 'door',
    addedAt: '2026-10-01',
    expiresAt: '2026-10-02',
  },
];
const now = new Date('2026-10-04T12:00:00');
const selected = () =>
  products.filter(
    (p) => !useIngredientSelection.getState().excludedIds.includes(p.id)
  );

test('selection filters recipe and chat inputs, preserves duplicate ingredients and excludes expired products', () => {
  const state = useIngredientSelection.getState();
  state.selectAll();
  const originalKey = searchKey(cookingInventory(selected(), now).ingredients);
  state.toggle('1');
  assert.deepEqual(cookingInventory(selected(), now).ingredients, ['milk']);
  assert.deepEqual(
    chatInventory(selected(), now).fridge.map((p) => p.name),
    ['Another milk carton']
  );
  state.toggle('2');
  assert.deepEqual(cookingInventory(selected(), now).ingredients, []);
  assert.deepEqual(chatInventory(selected(), now).fridge, []);
  assert.notDeepEqual(
    searchKey(cookingInventory(selected(), now).ingredients),
    originalKey
  );
  state.selectAll();
  assert.equal(chatInventory(selected(), now).fridge.length, 2);
  state.excludeAll(products);
  assert.deepEqual(selected(), []);
  state.selectAll();
});
