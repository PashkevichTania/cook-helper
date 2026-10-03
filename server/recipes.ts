import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  normalizeNames,
  type RecipeRequest,
  recipeRequestSchema,
} from '../src/entities/recipe/model.ts';
import { createSpoonacularProvider, RecipeApiError } from './spoonacular.ts';

// Cache and limits are process-local, not a distributed quota guarantee on Vercel.
export function createRecipeService(fetcher: typeof fetch = fetch) {
  const cache = new Map<string, { expires: number; data: unknown }>();
  const pending = new Map<string, Promise<unknown>>();
  let windowStart = 0;
  let requests = 0;
  let activeKey = '';
  return async (input: RecipeRequest, apiKey: string) => {
    if (!apiKey.trim()) throw new RecipeApiError(503, 'NOT_CONFIGURED');
    if (activeKey !== apiKey) {
      cache.clear();
      activeKey = apiKey;
    }
    const request =
      input.action === 'search'
        ? { ...input, ingredients: normalizeNames(input.ingredients) }
        : input;
    const key = JSON.stringify(request);
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) return hit.data;
    if (pending.has(key)) return pending.get(key);
    if (Date.now() - windowStart >= 60_000) {
      windowStart = Date.now();
      requests = 0;
    }
    if (requests >= 20 || pending.size >= 3)
      throw new RecipeApiError(429, 'RATE_LIMITED');
    requests++;
    const provider = createSpoonacularProvider(apiKey, fetcher);
    const work = (async () => {
      const data =
        request.action === 'search'
          ? await provider.findByIngredients(request.ingredients)
          : await provider.getRecipe(request.id);
      if (cache.size >= 100) cache.delete(cache.keys().next().value!);
      cache.set(key, { expires: Date.now() + 15 * 60_000, data });
      return data;
    })();
    pending.set(key, work);
    try {
      return await work;
    } finally {
      pending.delete(key);
    }
  };
}
const service = createRecipeService();
export type ApiRequest = IncomingMessage & { body?: unknown };
async function readBody(req: ApiRequest): Promise<unknown> {
  if (Number(req.headers['content-length'] ?? 0) > 8192)
    throw new RecipeApiError(413, 'INVALID_REQUEST');
  if (req.body !== undefined) {
    const serialized =
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(serialized) > 8192)
      throw new RecipeApiError(413, 'INVALID_REQUEST');
    try {
      return JSON.parse(serialized);
    } catch {
      throw new RecipeApiError(400, 'INVALID_REQUEST');
    }
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > 8192) throw new RecipeApiError(413, 'INVALID_REQUEST');
    chunks.push(bytes);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new RecipeApiError(400, 'INVALID_REQUEST');
  }
}
export async function handleRecipeRequest(
  req: ApiRequest,
  res: ServerResponse,
  apiKey: string,
  run = service
) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      throw new RecipeApiError(405, 'METHOD_NOT_ALLOWED');
    }
    if (
      !req.headers['content-type']?.toLowerCase().startsWith('application/json')
    )
      throw new RecipeApiError(415, 'INVALID_REQUEST');
    if (req.headers['sec-fetch-site'] === 'cross-site')
      throw new RecipeApiError(403, 'INVALID_REQUEST');
    const result = recipeRequestSchema.safeParse(await readBody(req));
    if (!result.success) throw new RecipeApiError(400, 'INVALID_REQUEST');
    const data = await run(result.data, apiKey);
    res.statusCode = 200;
    res.end(JSON.stringify(data));
  } catch (error) {
    const safe =
      error instanceof RecipeApiError
        ? error
        : new RecipeApiError(500, 'INTERNAL_ERROR');
    if (safe.code === 'RATE_LIMITED') res.setHeader('Retry-After', '60');
    res.statusCode = safe.status;
    res.end(JSON.stringify({ error: safe.code }));
  }
}
