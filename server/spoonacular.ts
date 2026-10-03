import { z } from 'zod';

import {
  isPantry,
  normalizeNames,
  type Recipe,
  type RecipeSearchResult,
} from '../src/entities/recipe/model.ts';

export class RecipeApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}
const upstreamIngredient = z.object({
  id: z.number().int().nullish(),
  name: z.string().min(1),
  original: z.string().nullish(),
});
const upstreamResult = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  image: z.string().nullish(),
  usedIngredients: z.array(upstreamIngredient),
  missedIngredients: z.array(upstreamIngredient),
});
const upstreamRecipe = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  image: z.string().nullish(),
  readyInMinutes: z.number().nullish(),
  servings: z.number().nullish(),
  extendedIngredients: z.array(upstreamIngredient),
  analyzedInstructions: z
    .array(
      z.object({
        name: z.string().optional(),
        steps: z.array(z.object({ number: z.number(), step: z.string() })),
      })
    )
    .nullish(),
  sourceName: z.string().nullish(),
  sourceUrl: z.string().nullish(),
  spoonacularSourceUrl: z.string().nullish(),
  creditsText: z.string().nullish(),
});
export function safeUrl(value?: string | null, image = false): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password) return null;
    if (image)
      return url.protocol === 'https:' &&
        /(^|\.)spoonacular\.com$/.test(url.hostname)
        ? url.href
        : null;
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
function ingredient(input: z.infer<typeof upstreamIngredient>) {
  return {
    id: input.id ?? null,
    name: input.name,
    original: input.original ?? input.name,
  };
}
export function normalizeResults(data: unknown): RecipeSearchResult[] {
  const parsed = upstreamResult.array().safeParse(data);
  if (!parsed.success)
    throw new RecipeApiError(502, 'INVALID_PROVIDER_RESPONSE');
  return parsed.data
    .map((item) => ({
      id: String(item.id),
      title: item.title,
      image: safeUrl(item.image, true),
      usedIngredients: [
        ...item.usedIngredients,
        ...item.missedIngredients.filter(isPantry),
      ].map(ingredient),
      missingIngredients: item.missedIngredients
        .filter((entry) => !isPantry(entry))
        .map(ingredient),
    }))
    .sort(
      (a, b) =>
        a.missingIngredients.length - b.missingIngredients.length ||
        b.usedIngredients.length - a.usedIngredients.length
    );
}
export function normalizeRecipe(data: unknown): Recipe {
  const parsed = upstreamRecipe.safeParse(data);
  if (!parsed.success)
    throw new RecipeApiError(502, 'INVALID_PROVIDER_RESPONSE');
  const item = parsed.data;
  return {
    id: String(item.id),
    title: item.title,
    image: safeUrl(item.image, true),
    readyInMinutes:
      item.readyInMinutes && item.readyInMinutes > 0
        ? item.readyInMinutes
        : null,
    servings: item.servings && item.servings > 0 ? item.servings : null,
    ingredients: item.extendedIngredients.map(ingredient),
    sections: (item.analyzedInstructions ?? [])
      .map((section) => ({
        name: section.name ?? '',
        steps: [...section.steps]
          .sort((a, b) => a.number - b.number)
          .map((step) => step.step),
      }))
      .filter((section) => section.steps.length),
    sourceName: item.sourceName || 'Spoonacular',
    sourceUrl: safeUrl(item.sourceUrl) ?? safeUrl(item.spoonacularSourceUrl),
    credits: item.creditsText ?? '',
  };
}
export interface RecipeProvider {
  findByIngredients(ingredients: string[]): Promise<RecipeSearchResult[]>;
  getRecipe(id: string): Promise<Recipe>;
}
export function createSpoonacularProvider(
  apiKey: string,
  fetcher: typeof fetch = fetch
): RecipeProvider {
  async function request(path: string, parameters: Record<string, string>) {
    if (!apiKey.trim()) throw new RecipeApiError(503, 'NOT_CONFIGURED');
    const url = new URL(`https://api.spoonacular.com${path}`);
    for (const [key, value] of Object.entries(parameters))
      url.searchParams.set(key, value);
    try {
      const response = await fetcher(url, {
        headers: { 'x-api-key': apiKey, Accept: 'application/json' },
        signal: AbortSignal.timeout(15_000),
        redirect: 'error',
      });
      if (!response.ok) {
        if (response.status === 402)
          throw new RecipeApiError(429, 'QUOTA_EXCEEDED');
        if (response.status === 429)
          throw new RecipeApiError(429, 'RATE_LIMITED');
        if ([401, 403].includes(response.status))
          throw new RecipeApiError(503, 'PROVIDER_AUTH');
        if (response.status === 404) throw new RecipeApiError(404, 'NOT_FOUND');
        throw new RecipeApiError(502, 'PROVIDER_UNAVAILABLE');
      }
      return await response.json();
    } catch (error) {
      if (error instanceof RecipeApiError) throw error;
      throw new RecipeApiError(502, 'PROVIDER_UNAVAILABLE');
    }
  }
  return {
    findByIngredients: async (ingredients) =>
      normalizeResults(
        await request('/recipes/findByIngredients', {
          ingredients: normalizeNames(ingredients).join(','),
          number: '12',
          ranking: '2',
          ignorePantry: 'false',
        })
      ),
    getRecipe: async (id) =>
      normalizeRecipe(
        await request(`/recipes/${id}/information`, {
          includeNutrition: 'false',
        })
      ),
  };
}
