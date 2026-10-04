import type { Product } from '../entities/product/model';
import { ProductIcon } from '../entities/product/ProductIcon';
import { useIngredientSelection } from '../entities/product/selection';
import { useTranslation } from './i18n';

export function IngredientSelection({ products }: { products: Product[] }) {
  const { t } = useTranslation();
  const { excludedIds, toggle, selectAll, excludeAll } =
    useIngredientSelection();
  return (
    <div className="ingredient-selection">
      <div className="selection-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={selectAll}
          disabled={!products.some((p) => excludedIds.includes(p.id))}
        >
          {t.selectAll}
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => excludeAll(products)}
          disabled={!products.some((p) => !excludedIds.includes(p.id))}
        >
          {t.excludeAll}
        </button>
      </div>
      <p className="muted">
        {t.selectedIngredients}:{' '}
        {products.filter((p) => !excludedIds.includes(p.id)).length} /{' '}
        {products.length}
      </p>
      <div className="ingredient-options">
        {products.map((product) => (
          <label key={product.id} className="ingredient-option">
            <input
              type="checkbox"
              checked={!excludedIds.includes(product.id)}
              onChange={() => toggle(product.id)}
            />
            <ProductIcon product={product} />
            <span>{product.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
