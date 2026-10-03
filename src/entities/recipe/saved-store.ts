import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useStorageStatus } from '../product/store';
import { type SavedRecipe, savedRecipeSchema } from './saved-model';

type SavedRecipesStore = {
  recipes: SavedRecipe[];
  save: (recipe: SavedRecipe) => boolean;
  remove: (id: string) => boolean;
};
// Report failed writes to the caller instead of showing a false success.
let writeFailed = false;
const storage = createJSONStorage(() => ({
  getItem: (name: string) => {
    try {
      const value = localStorage.getItem(name);
      if (value) JSON.parse(value);
      return value;
    } catch {
      useStorageStatus.setState({ error: true });
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      writeFailed = true;
      useStorageStatus.setState({ error: true });
    }
  },
  removeItem: (name: string) => localStorage.removeItem(name),
}));
export const useSavedRecipes = create<SavedRecipesStore>()(
  persist(
    (set, get) => ({
      recipes: [],
      save: (input) => {
        const recipe = savedRecipeSchema.parse(input);
        const previous = get().recipes;
        writeFailed = false;
        set({
          recipes: previous.some((item) => item.id === recipe.id)
            ? previous.map((item) => (item.id === recipe.id ? recipe : item))
            : [recipe, ...previous],
        });
        if (writeFailed) {
          set({ recipes: previous });
          return false;
        }
        return true;
      },
      remove: (id) => {
        const previous = get().recipes;
        writeFailed = false;
        set({ recipes: previous.filter((item) => item.id !== id) });
        if (writeFailed) {
          set({ recipes: previous });
          return false;
        }
        return true;
      },
    }),
    {
      name: 'cook-helper-recipes',
      version: 1,
      storage,
      partialize: (state) => ({ recipes: state.recipes }),
      merge: (persisted, current) => {
        const result = savedRecipeSchema
          .array()
          .safeParse(
            (persisted as Partial<SavedRecipesStore> | undefined)?.recipes
          );
        if (persisted && !result.success)
          useStorageStatus.setState({ error: true });
        return { ...current, recipes: result.success ? result.data : [] };
      },
    }
  )
);
