import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useSavedRecipes } from '../entities/recipe/saved-store';
import { RecipeForm } from '../features/recipes/RecipeForm';
import { useRecipeTranslation } from '../shared/recipe-i18n';
import { useSavedRecipeTranslation } from '../shared/saved-recipe-i18n';
export function MyRecipesPage() {
  const s = useSavedRecipeTranslation();
  const { r } = useRecipeTranslation();
  const recipes = useSavedRecipes((state) => state.recipes);
  const [creating, setCreating] = useState(false);
  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">COOK HELPER</p>
          <h1>{s.title}</h1>
          <p className="subtitle">{s.subtitle}</p>
        </div>
        <button className="primary-button" onClick={() => setCreating(true)}>
          + {s.add}
        </button>
      </section>
      {recipes.length === 0 ? (
        <section className="empty-state">
          <h2>{s.empty}</h2>
          <p>{s.emptyHint}</p>
          <Link className="secondary-button" to="/recipes">
            {s.browse}
          </Link>
        </section>
      ) : (
        <div className="recipe-grid">
          {recipes.map((recipe) => (
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
                <p className="eyebrow">
                  {recipe.apiId ? s.imported : s.custom}
                </p>
                <h2>
                  <Link to={'/my-recipes/' + recipe.id}>{recipe.title}</Link>
                </h2>
                <p className="saved-recipe-preview muted">
                  {recipe.ingredients.join(', ')}
                </p>
                <Link
                  className="secondary-button"
                  to={'/my-recipes/' + recipe.id}
                >
                  {r.view} →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
      {creating && <RecipeForm onClose={() => setCreating(false)} />}
    </>
  );
}
