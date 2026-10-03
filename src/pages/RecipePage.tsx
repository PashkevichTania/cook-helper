import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useFridgeStore } from '../entities/product/store';
import { RecipeClientError, recipeProvider } from '../entities/recipe/api';
import {
  cookingInventory,
  ingredientAvailable,
  searchKey,
} from '../entities/recipe/matching';
import type { RecipeSearchResult } from '../entities/recipe/model';
import { saveApiRecipe } from '../entities/recipe/saved-model';
import { useSavedRecipes } from '../entities/recipe/saved-store';
import { useRecipeTranslation } from '../shared/recipe-i18n';
import { useSavedRecipeTranslation } from '../shared/saved-recipe-i18n';
import { useToday } from '../shared/useToday';

export function RecipePage() {
  const { id = '' } = useParams();
  const s = useSavedRecipeTranslation();
  const save = useSavedRecipes((state) => state.save);
  const saved = useSavedRecipes((state) =>
    state.recipes.some((recipe) => recipe.apiId === id)
  );
  const [saveError, setSaveError] = useState<'storage' | 'invalid' | null>(
    null
  );
  const { r, errorText } = useRecipeTranslation();
  const products = useFridgeStore((state) => state.products);
  const now = useToday();
  const inventory = cookingInventory(products, now);
  const client = useQueryClient();
  const valid = /^[1-9]\d{0,9}$/.test(id);
  const query = useQuery({
    queryKey: ['recipes', 'detail', id],
    queryFn: ({ signal }) => recipeProvider.getRecipe(id, signal),
    enabled: valid,
    staleTime: 15 * 60_000,
  });
  const result = client
    .getQueryData<RecipeSearchResult[]>(searchKey(inventory.ingredients))
    ?.find((item) => item.id === id);
  const recipe = query.data;
  return (
    <>
      <Link className="back-link" to="/recipes">
        ← {r.back}
      </Link>
      {!valid ? (
        <p className="error-message">{r.invalidId}</p>
      ) : query.isPending ? (
        <p role="status" className="recipe-loading">
          {r.loading}
        </p>
      ) : query.isError ? (
        <div role="alert" className="error-message">
          <p>
            {errorText(
              query.error instanceof RecipeClientError ? query.error.code : ''
            )}
          </p>
          <button
            className="secondary-button"
            onClick={() => void query.refetch()}
          >
            {r.retry}
          </button>
        </div>
      ) : (
        recipe && (
          <>
            <section className="recipe-detail-hero">
              <div>
                <p className="eyebrow">SPOONACULAR</p>
                <h1>{recipe.title}</h1>
                <div className="saved-recipe-actions">
                  {saved ? (
                    <Link
                      className="secondary-button"
                      to={'/my-recipes/api-' + id}
                    >
                      {s.saved}
                    </Link>
                  ) : (
                    <button
                      className="primary-button"
                      onClick={() => {
                        try {
                          setSaveError(
                            save(saveApiRecipe(recipe)) ? null : 'storage'
                          );
                        } catch {
                          setSaveError('invalid');
                        }
                      }}
                    >
                      {s.saveApi}
                    </button>
                  )}
                </div>
                {saveError && (
                  <p role="alert" className="error-message">
                    {saveError === 'storage' ? s.saveError : s.importError}
                  </p>
                )}
                <div className="recipe-meta">
                  {recipe.readyInMinutes && (
                    <span>
                      ◷ {recipe.readyInMinutes} {r.minutes}
                    </span>
                  )}
                  {recipe.servings && (
                    <span>
                      {recipe.servings} {r.servings}
                    </span>
                  )}
                </div>
                <p className="muted">{r.detailNote}</p>
                <p className="muted">
                  {r.credits}: {recipe.sourceName}
                  {recipe.credits ? ` · ${recipe.credits}` : ''}
                </p>
                {recipe.sourceUrl && (
                  <a
                    className="secondary-button"
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {r.source} ↗
                  </a>
                )}
              </div>
              {recipe.image && (
                <img src={recipe.image} alt="" referrerPolicy="no-referrer" />
              )}
            </section>
            <div className="recipe-detail-grid">
              <section className="context-panel">
                <h2>{r.ingredientList}</h2>
                <ul className="recipe-ingredients">
                  {recipe.ingredients.map((ingredient, index) => {
                    const available = ingredientAvailable(
                      ingredient,
                      inventory.ingredients,
                      result
                    );
                    return (
                      <li key={`${ingredient.id}-${index}`}>
                        <span>{ingredient.original}</span>
                        <small
                          className={
                            available ? 'ingredient-yes' : 'ingredient-no'
                          }
                        >
                          {available ? `✓ ${r.available}` : r.unconfirmed}
                        </small>
                      </li>
                    );
                  })}
                </ul>
              </section>
              <section className="context-panel">
                <h2>{r.steps}</h2>
                {recipe.sections.length ? (
                  recipe.sections.map((section, index) => (
                    <div key={index}>
                      {section.name && (
                        <h3 className="instruction-section">{section.name}</h3>
                      )}
                      <ol className="recipe-steps">
                        {section.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  ))
                ) : (
                  <p className="muted">
                    {r.noSteps} {!recipe.sourceUrl && r.noSource}
                  </p>
                )}
              </section>
            </div>
          </>
        )
      )}
    </>
  );
}
