import { create } from 'zustand';

import type { Product } from './model';

type SelectionState = {
  excludedIds: string[];
  toggle: (id: string) => void;
  selectAll: () => void;
  excludeAll: (products: Product[]) => void;
};

export const useIngredientSelection = create<SelectionState>((set) => ({
  excludedIds: [],
  toggle: (id) =>
    set((state) => ({
      excludedIds: state.excludedIds.includes(id)
        ? state.excludedIds.filter((value) => value !== id)
        : [...state.excludedIds, id],
    })),
  selectAll: () => set({ excludedIds: [] }),
  excludeAll: (products) =>
    set((state) => ({
      excludedIds: [
        ...new Set([...state.excludedIds, ...products.map((p) => p.id)]),
      ],
    })),
}));
