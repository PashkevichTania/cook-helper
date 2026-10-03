import spriteSource from '../../assets/food-icons.svg?raw';
import spriteUrl from '../../assets/food-icons.svg?url';
import { findCatalogProduct } from './catalog';
import { categoryEmoji, type Product } from './model';

const iconIds = new Set(
  Array.from(
    spriteSource.matchAll(/<symbol\s+id="([^"]+)"/g),
    (match) => match[1]
  )
);
const iconAliases: Record<string, string> = {
  'black-pepper': 'pepper',
  'chicken-breast': 'chicken',
  spaghetti: 'pasta',
};
type IconProduct = Pick<Product, 'type'> & {
  catalogId?: string;
  name?: string;
  apiName?: string;
};

export function ProductIcon({
  product,
  catalogId,
}: {
  product: IconProduct;
  catalogId?: string;
}) {
  const id =
    catalogId ??
    product.catalogId ??
    findCatalogProduct(product.name ?? '')?.id ??
    findCatalogProduct(product.apiName ?? '')?.id ??
    product.name?.trim().toLowerCase();
  const icon = id ? (iconAliases[id] ?? id) : undefined;
  if (!icon || !iconIds.has(icon)) {
    return (
      <span className="food-icon-fallback" aria-hidden="true">
        {categoryEmoji[product.type]}
      </span>
    );
  }
  return (
    <svg
      className="food-icon"
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <use href={spriteUrl + '#' + icon} />
    </svg>
  );
}
