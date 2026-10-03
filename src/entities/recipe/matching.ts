import {
  availableProducts,
  normalizeProduct,
  type Product,
} from '../product/model.ts';
import {
  type Ingredient,
  ingredientNameSchema,
  isPantry,
  normalizeNames,
  type RecipeSearchResult,
} from './model.ts';

export function cookingInventory(products: Product[], now = new Date()) {
  const available = availableProducts(products, now);
  const unresolved: Product[] = [];
  const names: string[] = [];
  for (const product of available) {
    const candidate =
      product.apiName || normalizeProduct(product.name)?.apiName;
    const parsed = ingredientNameSchema.safeParse(candidate);
    if (parsed.success) names.push(parsed.data);
    else unresolved.push(product);
  }
  return {
    ingredients: normalizeNames(names).filter(
      (name) => !isPantry({ name, id: null })
    ),
    unresolved,
    excludedCount: products.length - available.length,
  };
}
export function searchKey(ingredients: string[]) {
  return ['recipes', 'search', normalizeNames(ingredients)] as const;
}
export function ingredientAvailable(
  ingredient: Ingredient,
  names: string[],
  result?: RecipeSearchResult
) {
  if (isPantry(ingredient)) return true;
  if (names.includes(ingredient.name.trim().toLowerCase())) return true;
  const canonical = normalizeProduct(ingredient.name)?.apiName;
  if (canonical && names.includes(canonical)) return true;
  return !!result?.usedIngredients.some(
    (used) =>
      (ingredient.id !== null && used.id === ingredient.id) ||
      used.name.toLowerCase() === ingredient.name.toLowerCase()
  );
}
