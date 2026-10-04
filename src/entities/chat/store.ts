import { create } from 'zustand';

import { useIngredientSelection } from '../product/selection';
import { useFridgeStore, usePreferences } from '../product/store';
import {
  chatInventory,
  type ChatMessage,
  chatRequestSchema,
  chatResponseSchema,
  recentConversation,
} from './model';

let controller: AbortController | null = null;
type ChatState = {
  messages: ChatMessage[];
  draft: string;
  pending: string | null;
  error: string | null;
  setDraft: (draft: string) => void;
  send: (text?: string) => Promise<void>;
  stop: () => void;
  clear: () => void;
};
export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  draft: '',
  pending: null,
  error: null,
  setDraft: (draft) => set({ draft }),
  stop: () => {
    controller?.abort();
  },
  clear: () => {
    if (!get().pending) set({ messages: [], draft: '', error: null });
  },
  send: async (text) => {
    if (get().pending) return;
    const prompt = (text ?? get().draft).trim();
    if (!prompt) return;
    const messages = recentConversation(get().messages, prompt);
    const input = chatRequestSchema.safeParse({
      messages,
      language: usePreferences.getState().language,
      ...chatInventory(
        useFridgeStore
          .getState()
          .products.filter(
            (product) =>
              !useIngredientSelection
                .getState()
                .excludedIds.includes(product.id)
          )
      ),
    });
    if (!input.success) {
      set({ error: 'INVALID_REQUEST', draft: prompt });
      return;
    }
    const abort = new AbortController();
    controller = abort;
    set({ pending: prompt, error: null, draft: prompt });
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input.data),
        signal: AbortSignal.any([abort.signal, AbortSignal.timeout(30_000)]),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const code =
          typeof body === 'object' &&
          body !== null &&
          'error' in body &&
          typeof body.error === 'string'
            ? body.error
            : 'PROVIDER_UNAVAILABLE';
        set({ error: code });
        return;
      }
      const result = chatResponseSchema.safeParse(body);
      if (!result.success) {
        set({ error: 'INVALID_RESPONSE' });
        return;
      }
      if (abort.signal.aborted) return;
      set({
        messages: [
          ...get().messages,
          { role: 'user', text: prompt },
          { role: 'assistant', text: result.data.text },
        ].slice(-40) as ChatMessage[],
        draft: '',
        error: null,
      });
    } catch (error) {
      set({
        error: abort.signal.aborted
          ? 'CANCELLED'
          : error instanceof Error && error.name === 'TimeoutError'
            ? 'TIMEOUT'
            : 'NETWORK_ERROR',
      });
    } finally {
      controller = null;
      set({ pending: null });
    }
  },
}));
