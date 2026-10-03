import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

import { handleChatRequest } from './server/chat.ts';
import { handleRecipeRequest } from './server/recipes.ts';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'local-recipe-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.split('?')[0] === '/api/chat') {
            const env = loadEnv(mode, import.meta.dirname, 'GEMINI_');
            void handleChatRequest(
              req,
              res,
              env.GEMINI_API_KEY ?? '',
              env.GEMINI_MODEL || undefined
            );
            return;
          }
          if (req.url?.split('?')[0] !== '/api/recipes') {
            next();
            return;
          }
          const env = loadEnv(mode, import.meta.dirname, 'SPOONACULAR_');
          void handleRecipeRequest(req, res, env.SPOONACULAR_API_KEY ?? '');
        });
      },
    },
  ],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
}));
