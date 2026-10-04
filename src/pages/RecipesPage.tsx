import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { Product } from '../entities/product/model';
import { useIngredientSelection } from '../entities/product/selection';
import { useFridgeStore } from '../entities/product/store';
import { RecipeClientError, recipeProvider } from '../entities/recipe/api';
import { cookingInventory, searchKey } from '../entities/recipe/matching';
import { ProductForm } from '../features/fridge/ProductForm';
import { useTranslation } from '../shared/i18n';
import { IngredientSelection } from '../shared/IngredientSelection';
import { useRecipeTranslation } from '../shared/recipe-i18n';
import { useToday } from '../shared/useToday';

export function RecipesPage() {
  const { t } = useTranslation();
  const { r, errorText } = useRecipeTranslation();
  const products = useFridgeStore((state) => state.products);
  const now = useToday();
  const excludedIds = useIngredientSelection((state) => state.excludedIds);
  const fullInventory = cookingInventory(products, now);
  const selectable = products.filter(
    (product) => cookingInventory([product], now).ingredients.length > 0
  );
  const inventory = cookingInventory(
    products.filter((product) => !excludedIds.includes(product.id)),
    now
  );
  const [readyOnly, setReadyOnly] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const canSearch =
    inventory.ingredients.length > 0 && inventory.ingredients.length <= 50;
  const query = useQuery({
    queryKey: searchKey(inventory.ingredients),
    queryFn: ({ signal }) =>
      recipeProvider.findByIngredients(inventory.ingredients, signal),
    enabled: false,
    staleTime: 15 * 60_000,
    gcTime: 30 * 60_000,
  });
  // A new inventory gets a new key: old matches never describe the current fridge.
  const results = (query.data ?? []).filter(
    (item) => !readyOnly || item.missingIngredients.length === 0
  );
  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">SPOONACULAR</p>
          <h1>{t.recipeTitle}</h1>
          <p className="subtitle">{t.recipeSubtitle}</p>
        </div>
        <button
          className="primary-button"
          disabled={!canSearch || query.isFetching}
          onClick={() => {
            if (!query.data || query.isStale || query.isError)
              void query.refetch();
          }}
        >
          {query.isFetching ? r.searching : r.search}
        </button>
      </section>
      <section className="context-panel recipe-context">
        <h2>{r.ingredients}</h2>
        <IngredientSelection products={selectable} />
        <p className="muted">{r.note}</p>
        {fullInventory.excludedCount > 0 && (
          <p className="expired-note">
            {r.excluded} {fullInventory.excludedCount}
          </p>
        )}
        {fullInventory.unresolved.length > 0 && (
          <div className="unresolved-note">
            <p>{r.unknown}</p>
            <div className="ingredient-chips">
              {fullInventory.unresolved.map((product) => (
                <button
                  key={product.id}
                  className="secondary-button"
                  onClick={() => setEditing(product)}
                >
                  {product.name} ↗
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
      {!canSearch && (
        <div className="empty-state">
          <p>{inventory.ingredients.length > 50 ? r.tooMany : r.empty}</p>
          <Link className="secondary-button" to="/fridge">
            {t.back}
          </Link>
        </div>
      )}
      {query.isError && (
        <p role="alert" className="error-message recipe-error">
          {errorText(
            query.error instanceof RecipeClientError ? query.error.code : ''
          )}
        </p>
      )}
      {query.isFetching && (
        <div role="status" className="recipe-loading">
          {r.searching}
          <div className="recipe-grid" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <div key={n} className="recipe-skeleton" />
            ))}
          </div>
        </div>
      )}
      {!query.isFetching && query.data && (
        <>
          <div className="results-heading">
            <h2>
              {r.found}: {results.length}
            </h2>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={readyOnly}
                onChange={(event) => setReadyOnly(event.target.checked)}
              />
              {r.readyOnly}
            </label>
          </div>
          {results.length === 0 ? (
            <div className="empty-state">
              <h2>{r.noResults}</h2>
              <p>{r.noResultsHint}</p>
            </div>
          ) : (
            <div className="recipe-grid">
              {results.map((recipe) => (
                <article className="recipe-card" key={recipe.id}>
                  {recipe.image ? (
                    <img
                      src={recipe.image}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="recipe-no-image">{r.noImage}</div>
                  )}
                  <div className="recipe-card-body">
                    <h2>
                      <Link to={`/recipes/${recipe.id}`}>{recipe.title}</Link>
                    </h2>
                    <p className="recipe-match">
                      {recipe.usedIngredients.length} /{' '}
                      {recipe.usedIngredients.length +
                        recipe.missingIngredients.length}{' '}
                      {r.match}
                    </p>
                    {recipe.missingIngredients.length === 0 ? (
                      <p className="ready-badge">✓ {r.ready}</p>
                    ) : (
                      <p className="missing-list">
                        <strong>{r.missing}:</strong>{' '}
                        {recipe.missingIngredients
                          .map((item) => item.name)
                          .join(', ')}
                      </p>
                    )}
                    <Link
                      className="secondary-button"
                      to={`/recipes/${recipe.id}`}
                    >
                      {r.view} →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
      {!query.data && !query.isFetching && !query.isError && canSearch && (
        <p className="search-intro">{r.intro}</p>
      )}
      <p className="recipe-attribution">
        Recipes by{' '}
        <a
          href="https://spoonacular.com/food-api"
          target="_blank"
          rel="noreferrer"
        >
          Spoonacular
        </a>
      </p>
      {editing && (
        <ProductForm product={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
