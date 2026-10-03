import { z } from 'zod';

export const ingredientNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z][a-zA-Z0-9 '\-()]*$/);
export const recipeRequestSchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('search'),
      ingredients: z.array(ingredientNameSchema).min(1).max(50),
    })
    .strict(),
  z
    .object({
      action: z.literal('detail'),
      id: z.string().regex(/^[1-9]\d{0,9}$/),
    })
    .strict(),
]);
export const ingredientSchema = z.object({
  id: z.number().int().nullable(),
  name: z.string(),
  original: z.string(),
});
export const resultSchema = z.object({
  id: z.string(),
  title: z.string(),
  image: z.string().nullable(),
  usedIngredients: z.array(ingredientSchema),
  missingIngredients: z.array(ingredientSchema),
});
export const recipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  image: z.string().nullable(),
  readyInMinutes: z.number().nullable(),
  servings: z.number().nullable(),
  ingredients: z.array(ingredientSchema),
  sections: z.array(z.object({ name: z.string(), steps: z.array(z.string()) })),
  sourceName: z.string(),
  sourceUrl: z.string().nullable(),
  credits: z.string(),
});
export type Ingredient = z.infer<typeof ingredientSchema>;
export type RecipeSearchResult = z.infer<typeof resultSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type RecipeRequest = z.infer<typeof recipeRequestSchema>;

export function isPantry(ingredient: { id?: number | null; name: string }) {
  return (
    ingredient.id === 2047 ||
    ingredient.id === 14412 ||
    /^(salt|water)$/i.test(ingredient.name.trim())
  );
}
export function normalizeNames(names: string[]) {
  return [...new Set(names.map((name) => name.trim().toLowerCase()))].sort();
}
