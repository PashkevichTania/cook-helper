import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { createRecipeService, handleRecipeRequest } from '../server/recipes.ts';
import {
  createSpoonacularProvider,
  normalizeRecipe,
  normalizeResults,
  safeUrl,
} from '../server/spoonacular.ts';
import { productSchema } from '../src/entities/product/model.ts';
import {
  cookingInventory,
  ingredientAvailable,
} from '../src/entities/recipe/matching.ts';
import { recipeRequestSchema } from '../src/entities/recipe/model.ts';

const raw = [
  {
    id: 42,
    title: 'Eggs',
    image: 'https://img.spoonacular.com/recipes/42.jpg',
    usedIngredients: [{ id: 1123, name: 'egg', original: '2 eggs' }],
    missedIngredients: [
      { id: 2047, name: 'salt' },
      { id: 14412, name: 'water' },
      { id: 4053, name: 'olive oil' },
      { id: 20081, name: 'flour' },
      { id: 1002047, name: 'garlic salt' },
    ],
  },
];
const mockFetch: typeof fetch = async () => new Response(JSON.stringify(raw));
test('only salt and water are assumed: oil, flour and garlic salt remain missing', () => {
  const [result] = normalizeResults(raw);
  assert.equal(result.usedIngredients.length, 3);
  assert.deepEqual(
    result.missingIngredients.map((entry) => entry.name),
    ['olive oil', 'flour', 'garlic salt']
  );
  assert.throws(
    () => normalizeResults([{ id: 1, title: 'Incomplete' }]),
    /INVALID_PROVIDER_RESPONSE/
  );
});
test('request schema limits count, rejects injected parameters and arbitrary actions', () => {
  assert.equal(
    recipeRequestSchema.safeParse({
      action: 'search',
      ingredients: ['tomato,oil'],
    }).success,
    false
  );
  assert.equal(
    recipeRequestSchema.safeParse({
      action: 'search',
      ingredients: Array(51).fill('egg'),
    }).success,
    false
  );
  assert.equal(
    recipeRequestSchema.safeParse({ action: 'detail', id: '../search' })
      .success,
    false
  );
  assert.equal(
    recipeRequestSchema.safeParse({
      action: 'search',
      ingredients: ['egg'],
      url: 'https://elsewhere.test',
    }).success,
    false
  );
});
test('provider uses fixed API paths, server header, 12 results and no broad pantry exclusion', async () => {
  const provider = createSpoonacularProvider(
    'private-test-key',
    async (url, options) => {
      const parsed = new URL(String(url));
      assert.equal(parsed.origin, 'https://api.spoonacular.com');
      assert.equal(parsed.pathname, '/recipes/findByIngredients');
      assert.equal(parsed.searchParams.get('ingredients'), 'egg');
      assert.equal(parsed.searchParams.get('ignorePantry'), 'false');
      assert.equal(parsed.searchParams.get('number'), '12');
      assert.equal(parsed.href.includes('private-test-key'), false);
      assert.equal(
        new Headers(options?.headers).get('x-api-key'),
        'private-test-key'
      );
      return new Response(JSON.stringify(raw));
    }
  );
  await provider.findByIngredients(['egg', 'Egg']);
});
test('provider translates quota, authentication and network errors without leaking raw data', async () => {
  for (const [status, code] of [
    [402, 'QUOTA_EXCEEDED'],
    [429, 'RATE_LIMITED'],
    [401, 'PROVIDER_AUTH'],
    [404, 'NOT_FOUND'],
    [500, 'PROVIDER_UNAVAILABLE'],
  ] as const) {
    await assert.rejects(
      createSpoonacularProvider(
        'secret',
        async () => new Response('secret error', { status })
      ).findByIngredients(['egg']),
      new RegExp(code)
    );
  }
  await assert.rejects(
    createSpoonacularProvider('secret', async () => {
      throw new Error('secret');
    }).getRecipe('1'),
    /PROVIDER_UNAVAILABLE/
  );
});
test('cache deduplicates concurrent and reordered searches, then limits unique requests', async () => {
  let calls = 0;
  const run = createRecipeService(async () => {
    calls++;
    return mockFetch('https://example.test');
  });
  await Promise.all([
    run({ action: 'search', ingredients: ['egg', 'tomato'] }, 'test'),
    run({ action: 'search', ingredients: ['tomato', 'egg'] }, 'test'),
  ]);
  await run({ action: 'search', ingredients: ['egg', 'tomato'] }, 'test');
  assert.equal(calls, 1);
  for (let i = 0; i < 19; i++)
    await run({ action: 'search', ingredients: [`ingredient${i}`] }, 'test');
  await assert.rejects(
    run({ action: 'search', ingredients: ['one more'] }, 'test'),
    /RATE_LIMITED/
  );
});
test('inventory excludes expired and unresolved products and deduplicates batches', () => {
  const base = { type: 'other', fridgeZone: 'door', addedAt: '2026-10-03' };
  const products = [
    { ...base, id: '1', name: 'Яйца', apiName: 'egg' },
    { ...base, id: '2', name: 'Eggs', apiName: 'egg' },
    {
      ...base,
      id: '3',
      name: 'Молоко',
      apiName: 'milk',
      expiresAt: '2026-10-02',
    },
    { ...base, id: '4', name: 'Домашний пирог' },
  ].map((item) => productSchema.parse(item));
  const result = cookingInventory(products, new Date(2026, 9, 3));
  assert.deepEqual(result.ingredients, ['egg']);
  assert.equal(result.excludedCount, 1);
  assert.equal(result.unresolved.length, 1);
  assert.equal(
    ingredientAvailable(
      { id: 4053, name: 'olive oil', original: 'oil' },
      result.ingredients
    ),
    false
  );
});
test('details handle absent instructions and reject unsafe source or image URLs', () => {
  const result = normalizeRecipe({
    id: 42,
    title: 'Eggs',
    extendedIngredients: [],
    analyzedInstructions: null,
    sourceUrl: 'javascript:alert(1)',
    image: 'https://evil.test/track',
  });
  assert.equal(result.sourceUrl, null);
  assert.equal(result.image, null);
  assert.deepEqual(result.sections, []);
  assert.equal(
    safeUrl('https://example.com/recipe'),
    'https://example.com/recipe'
  );
});
test('HTTP handler rejects invalid methods, JSON and oversized bodies; missing key is actionable', async () => {
  const server = createServer((req, res) => {
    void handleRecipeRequest(req, res, '');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}`;
  try {
    assert.equal((await fetch(url)).status, 405);
    const missing = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'search', ingredients: ['egg'] }),
    });
    assert.equal(missing.status, 503);
    assert.deepEqual(await missing.json(), { error: 'NOT_CONFIGURED' });
    assert.equal(
      (
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{',
        })
      ).status,
      400
    );
    assert.equal(
      (
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'x'.repeat(9000),
        })
      ).status,
      413
    );
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});

test('direct recipe pages recognize dictionary aliases but not unrelated ingredients', () => {
  assert.equal(
    ingredientAvailable(
      { id: 11529, name: 'tomatoes', original: '4 tomatoes' },
      ['tomato']
    ),
    true
  );
  assert.equal(
    ingredientAvailable(
      { id: 4053, name: 'olive oil', original: '1 tbsp oil' },
      ['tomato']
    ),
    false
  );
});
test('detail endpoint fetches only requested recipe information and normalizes instructions', async () => {
  const provider = createSpoonacularProvider('test', async (url) => {
    const parsed = new URL(String(url));
    assert.equal(parsed.pathname, '/recipes/42/information');
    assert.equal(parsed.searchParams.get('includeNutrition'), 'false');
    return new Response(
      JSON.stringify({
        id: 42,
        title: 'Eggs',
        extendedIngredients: [],
        analyzedInstructions: [
          {
            name: 'Cook',
            steps: [
              { number: 2, step: 'Serve' },
              { number: 1, step: 'Cook eggs' },
            ],
          },
        ],
      })
    );
  });
  assert.deepEqual((await provider.getRecipe('42')).sections, [
    { name: 'Cook', steps: ['Cook eggs', 'Serve'] },
  ]);
});
