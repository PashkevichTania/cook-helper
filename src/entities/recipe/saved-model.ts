import { z } from 'zod';

import type { Recipe } from './model';

export const savedRecipeSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  preparation: z.string().trim(),
  ingredients: z.array(z.string().trim().min(1)).min(1),
  apiId: z.string().optional(),
  image: z.string().nullable().optional(),
  readyInMinutes: z.number().nullable().optional(),
  servings: z.number().nullable().optional(),
  sourceName: z.string().optional(),
  sourceUrl: z.string().nullable().optional(),
  credits: z.string().optional(),
});
export const customRecipeSchema = savedRecipeSchema.extend({
  preparation: z.string().trim().min(1),
});
export type SavedRecipe = z.infer<typeof savedRecipeSchema>;
export function saveApiRecipe(recipe: Recipe): SavedRecipe {
  return savedRecipeSchema.parse({
    ...recipe,
    id: 'api-' + recipe.id,
    apiId: recipe.id,
    preparation: recipe.sections
      .map((section) =>
        [
          section.name,
          ...section.steps.map((step, index) => index + 1 + '. ' + step),
        ]
          .filter(Boolean)
          .join('\n')
      )
      .filter(Boolean)
      .join('\n\n'),
    ingredients: recipe.ingredients.map(
      (item) => item.original.trim() || item.name
    ),
  });
}
