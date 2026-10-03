import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { moveProduct,type Product, productSchema } from './model';

type StorageState = { error: boolean };
export const useStorageStatus = create<StorageState>(() => ({ error: false }));
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
      useStorageStatus.setState({ error: true });
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch {
      useStorageStatus.setState({ error: true });
    }
  },
}));

type FridgeStore = {
  products: Product[];
  save: (product: Product) => void;
  remove: (id: string) => void;
  move: (id: string, zone: Product['fridgeZone']) => void;
};
export const useFridgeStore = create<FridgeStore>()(
  persist(
    (set) => ({
      products: [],
      move: (id, zone) =>
        set((state) => ({ products: moveProduct(state.products, id, zone) })),
      save: (input) => {
        const product = productSchema.parse(input);
        set((state) => ({
          products: state.products.some((item) => item.id === product.id)
            ? state.products.map((item) =>
                item.id === product.id ? product : item
              )
            : [...state.products, product],
        }));
      },
      remove: (id) =>
        set((state) => ({
          products: state.products.filter((item) => item.id !== id),
        })),
    }),
    {
      name: 'cook-helper-fridge',
      version: 1,
      storage,
      partialize: (state) => ({ products: state.products }),
      merge: (persisted, current) => {
        const result = productSchema
          .array()
          .safeParse((persisted as Partial<FridgeStore> | undefined)?.products);
        if (persisted && !result.success)
          useStorageStatus.setState({ error: true });
        return { ...current, products: result.success ? result.data : [] };
      },
    }
  )
);

type Preferences = {
  language: 'ru' | 'en';
  setLanguage: (language: 'ru' | 'en') => void;
};
export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      language: 'ru',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'cook-helper-preferences',
      version: 1,
      storage,
      partialize: (state) => ({ language: state.language }),
      merge: (persisted, current) => ({
        ...current,
        language:
          (persisted as Partial<Preferences> | undefined)?.language === 'en'
            ? 'en'
            : 'ru',
      }),
    }
  )
);
