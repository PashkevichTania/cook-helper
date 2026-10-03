import { useEffect, useRef, useState } from 'react';

import {
  customRecipeSchema,
  type SavedRecipe,
} from '../../entities/recipe/saved-model';
import { useSavedRecipes } from '../../entities/recipe/saved-store';
import { useTranslation } from '../../shared/i18n';
import { useSavedRecipeTranslation } from '../../shared/saved-recipe-i18n';
export function RecipeForm({
  recipe,
  onClose,
}: {
  recipe?: SavedRecipe;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const s = useSavedRecipeTranslation();
  const save = useSavedRecipes((state) => state.save);
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<'invalid' | 'storage' | null>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    element?.querySelector<HTMLInputElement>('[name=title]')?.focus();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="product-dialog recipe-form"
      aria-labelledby="recipe-form-title"
      onCancel={onClose}
    >
      <div className="dialog-heading">
        <h2 id="recipe-form-title">{recipe ? s.edit : s.add}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label={t.close}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <p className="muted">{s.required}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const result = customRecipeSchema.safeParse({
            ...recipe,
            id: recipe?.id ?? crypto.randomUUID(),
            title: data.get('title'),
            preparation: data.get('preparation'),
            ingredients: String(data.get('ingredients') ?? '')
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean),
          });
          if (!result.success) {
            setError('invalid');
            return;
          }
          if (!save(result.data)) {
            setError('storage');
            return;
          }
          onClose();
        }}
      >
        <label>
          {s.name}
          <input name="title" required defaultValue={recipe?.title} />
        </label>
        <label>
          {s.ingredients}
          <textarea
            name="ingredients"
            required
            rows={5}
            defaultValue={recipe?.ingredients.join('\n')}
            aria-describedby="recipe-ingredients-hint"
          />
          <span className="muted" id="recipe-ingredients-hint">
            {s.ingredientsHint}
          </span>
        </label>
        <label>
          {s.preparation}
          <textarea
            name="preparation"
            required
            rows={7}
            defaultValue={recipe?.preparation}
            placeholder={s.preparationHint}
          />
        </label>
        {error && (
          <p role="alert" className="error-message">
            {error === 'invalid' ? s.required : s.saveError}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            {t.cancel}
          </button>
          <button type="submit" className="primary-button">
            {t.save}
          </button>
        </div>
      </form>
    </dialog>
  );
}
