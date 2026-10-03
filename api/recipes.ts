import type { ServerResponse } from 'node:http';
import { env } from 'node:process';

import { type ApiRequest,handleRecipeRequest } from '../server/recipes.ts';

export default function handler(req: ApiRequest, res: ServerResponse) {
  return handleRecipeRequest(req, res, env.SPOONACULAR_API_KEY ?? '');
}
