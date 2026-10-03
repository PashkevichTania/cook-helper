import assert from 'node:assert/strict';
import test from 'node:test';

import type { Recipe } from '../src/entities/recipe/model.ts';
import {
  customRecipeSchema,
  saveApiRecipe,
} from '../src/entities/recipe/saved-model.ts';
const recipe: Recipe = {
  id: '42',
  title: 'Soup',
  image: null,
  readyInMinutes: 20,
  servings: 2,
  ingredients: [{ id: 1, name: 'potato', original: '2 potatoes' }],
  sections: [
    { name: 'Prep', steps: ['Peel potatoes.'] },
    { name: 'Cook', steps: ['Boil.', 'Serve.'] },
  ],
  sourceName: 'Kitchen',
  sourceUrl: 'https://example.com/soup',
  credits: 'Author',
};
test('custom recipes require only name, preparation and ingredients', () => {
  const valid = {
    id: 'local-1',
    title: ' Soup ',
    preparation: ' Boil potatoes. ',
    ingredients: [' potatoes '],
  };
  assert.deepEqual(customRecipeSchema.parse(valid), {
    id: 'local-1',
    title: 'Soup',
    preparation: 'Boil potatoes.',
    ingredients: ['potatoes'],
  });
  for (const invalid of [
    { title: ' ' },
    { preparation: ' ' },
    { ingredients: [] },
    { ingredients: [' '] },
  ])
    assert.equal(
      customRecipeSchema.safeParse({ ...valid, ...invalid }).success,
      false
    );
});
test('API import keeps quantities, all instructions and attribution without user input', () => {
  const saved = saveApiRecipe(recipe);
  assert.equal(
    saved.preparation,
    'Prep\n1. Peel potatoes.\n\nCook\n1. Boil.\n2. Serve.'
  );
  assert.deepEqual(saved.ingredients, ['2 potatoes']);
  assert.equal(saved.sourceUrl, recipe.sourceUrl);
  assert.equal(saved.credits, 'Author');
  assert.equal(saved.readyInMinutes, 20);
  assert.equal(saved.id, saveApiRecipe(recipe).id);
});
test('API recipes without instructions can still be saved without asking for input', () => {
  assert.equal(saveApiRecipe({ ...recipe, sections: [] }).preparation, '');
  assert.deepEqual(
    saveApiRecipe({
      ...recipe,
      ingredients: [{ id: 1, name: 'potato', original: '' }],
    }).ingredients,
    ['potato']
  );
});
test('an API snapshot is independent of later provider changes', () => {
  const source = structuredClone(recipe);
  const saved = saveApiRecipe(source);
  source.ingredients[0].original = 'changed';
  source.sections[0].steps[0] = 'changed';
  assert.deepEqual(saved.ingredients, ['2 potatoes']);
  assert.ok(saved.preparation.includes('Peel potatoes.'));
});
