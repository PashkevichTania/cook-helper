import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useSavedRecipes } from '../entities/recipe/saved-store';
import { RecipeForm } from '../features/recipes/RecipeForm';
import { useTranslation } from '../shared/i18n';
import { useRecipeTranslation } from '../shared/recipe-i18n';
import { useSavedRecipeTranslation } from '../shared/saved-recipe-i18n';
export function MyRecipePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const recipe = useSavedRecipes((state) =>
    state.recipes.find((item) => item.id === id)
  );
  const remove = useSavedRecipes((state) => state.remove);
  const { t } = useTranslation();
  const { r } = useRecipeTranslation();
  const s = useSavedRecipeTranslation();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(false);
  return (
    <>
      <Link className="back-link" to="/my-recipes">
        ← {s.title}
      </Link>
      {!recipe ? (
        <section className="empty-state">
          <h1>{s.missing}</h1>
        </section>
      ) : (
        <>
          <section className="recipe-detail-hero">
            <div>
              <p className="eyebrow">{recipe.apiId ? s.imported : s.custom}</p>
              <h1>{recipe.title}</h1>
              <div className="recipe-meta">
                {!!recipe.readyInMinutes && (
                  <span>
                    {recipe.readyInMinutes} {r.minutes}
                  </span>
                )}
                {!!recipe.servings && (
                  <span>
                    {recipe.servings} {r.servings}
                  </span>
                )}
              </div>
              {(recipe.sourceName || recipe.credits) && (
                <p className="muted">
                  {r.credits}:{' '}
                  {[recipe.sourceName, recipe.credits]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
              <div className="saved-recipe-actions">
                {recipe.sourceUrl && /^https?:\/\//i.test(recipe.sourceUrl) && (
                  <a
                    className="secondary-button"
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {r.source} ↗
                  </a>
                )}
                <button
                  className="secondary-button"
                  onClick={() => setEditing(true)}
                >
                  {s.edit}
                </button>
                <button
                  className="delete-button"
                  onClick={() => {
                    if (!window.confirm(s.deleteConfirm)) return;
                    if (remove(recipe.id)) navigate('/my-recipes');
                    else setError(true);
                  }}
                >
                  {t.remove}
                </button>
              </div>
              {error && (
                <p className="error-message" role="alert">
                  {s.saveError}
                </p>
              )}
            </div>
            {recipe.image && (
              <img src={recipe.image} alt="" referrerPolicy="no-referrer" />
            )}
          </section>
          <div className="recipe-detail-grid">
            <section className="context-panel">
              <h2>{s.ingredients}</h2>
              <ul className="recipe-ingredients">
                {recipe.ingredients.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
            <section className="context-panel">
              <h2>{s.preparation}</h2>
              <p className="saved-recipe-preparation">
                {recipe.preparation || s.noPreparation}
              </p>
            </section>
          </div>
          {editing && (
            <RecipeForm recipe={recipe} onClose={() => setEditing(false)} />
          )}
        </>
      )}
    </>
  );
}
