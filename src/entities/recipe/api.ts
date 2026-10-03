import { z } from 'zod';

import {
  type Recipe,
  type RecipeRequest,
  recipeSchema,
  type RecipeSearchResult,
  resultSchema,
} from './model';

export class RecipeClientError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}
async function request<T>(
  input: RecipeRequest,
  schema: z.ZodType<T>,
  signal?: AbortSignal
): Promise<T> {
  try {
    const response = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(20_000)])
        : AbortSignal.timeout(20_000),
    });
    const data: unknown = await response.json();
    if (!response.ok) {
      const error = z.object({ error: z.string() }).safeParse(data);
      throw new RecipeClientError(
        error.success ? error.data.error : 'PROVIDER_UNAVAILABLE'
      );
    }
    const result = schema.safeParse(data);
    if (!result.success)
      throw new RecipeClientError('INVALID_PROVIDER_RESPONSE');
    return result.data;
  } catch (error) {
    if (error instanceof RecipeClientError) throw error;
    throw new RecipeClientError('NETWORK_ERROR');
  }
}
export interface RecipeProvider {
  findByIngredients(
    ingredients: string[],
    signal?: AbortSignal
  ): Promise<RecipeSearchResult[]>;
  getRecipe(id: string, signal?: AbortSignal): Promise<Recipe>;
}
export const recipeProvider: RecipeProvider = {
  findByIngredients: (ingredients, signal) =>
    request({ action: 'search', ingredients }, resultSchema.array(), signal),
  getRecipe: (id, signal) =>
    request({ action: 'detail', id }, recipeSchema, signal),
};
