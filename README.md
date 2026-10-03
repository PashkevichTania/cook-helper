# Cook Helper

Personal fridge inventory and Spoonacular recipe discovery built with React, TypeScript, Vite, Zustand Persist, React Router and TanStack Query.

## Local development

1. Install dependencies: `npm install`.
2. Copy `.env.example` to `.env.local` and set `SPOONACULAR_API_KEY` (from the [Spoonacular console](https://spoonacular.com/food-api/console)). Never use a `VITE_` prefix for secrets.
3. Start with `npm run dev`. Vite serves the frontend and the same recipe handler used by Vercel. No separate backend process is needed.

`.env.local` and other environment files are ignored by Git; only the empty example is tracked. The key is read server-side and sent to Spoonacular via `x-api-key`. It is never returned to the browser.

## Vercel

Add `SPOONACULAR_API_KEY` in the project's environment settings for the required environments, then deploy. `api/recipes.ts` is a Node.js Vercel Function; `vercel.json` supplies SPA fallback while reserving `/api/` routes. Use the Vite framework preset and `npm run build`. `vite preview` previews static files only and does not run this API; use `npm run dev` for integrated local testing.

## Recipe flow

- Add fridge products, then open Recipes and explicitly select Find recipes.
- Known Russian/English names use a small local dictionary. Other products stay saved and are listed as unresolved; optionally add their English search name in the product editor. They are excluded from search until resolved. Recipes themselves are not translated.
- Search sends only distinct English ingredient names for non-expired products. Quantities, original product names and dates are not sent.
- The server calls `findByIngredients` for 12 results with `ranking=2` and `ignorePantry=false`. Only salt and water are assumed available. Oil, flour and other pantry items are not assumed.
- Results show available and missing ingredients. The ready-only filter works locally. Matching checks presence, not quantities, and depends on Spoonacular's ingredient matching.
- Full information loads only when a recipe is opened. Instructions use `analyzedInstructions`; when missing, the page links to the original source if provided. Images and links are validated, and provider text is rendered as text, not executable HTML.
- Details use the current inventory and matching evidence from a search for that exact ingredient set. On direct visits without search evidence, unmatched ingredients are marked availability unconfirmed.
- Client and server cache successful responses for 15 minutes. Changed inventory uses a different search key and does not automatically spend another API request.
- The proxy validates a closed request schema, limits bodies to 8 KiB, limits searches to 50 ingredients, applies a 15-second provider timeout, and translates quota/auth/network errors into safe error codes.
- Server caches are bounded to 100 entries. Identical in-flight requests are deduplicated. Each warm server instance allows up to 20 uncached requests/minute and 3 concurrent provider requests. These limits are per-process, not a distributed quota guarantee; public Vercel deployments may run multiple instances. Set provider spending limits or Vercel firewall limits if stronger protection is needed.

## Fridge

- Russian/English interface, visual zones, add/edit/delete/search and local browser storage.
- Amounts and expiry dates are optional. Expiring soon means today through three local calendar days ahead. Earlier dates are expired and remain visible with a warning, but cannot enter recipe search.
- Each batch is independent. Users manually adjust inventory after cooking.
- Data is not synchronized; clearing browser storage removes it.

## Gemini AI Chef

Set `GEMINI_API_KEY` in `.env.local` locally and in Vercel environment settings on deployment. Optional `GEMINI_MODEL` defaults to `gemini-3.5-flash`. Model availability and quotas depend on the Google project and region. The key stays server-side; it is sent only to Google's fixed API endpoint via `x-goog-api-key`.

`/chef` provides text chat, quick questions, a current inventory panel, cancellation, error recovery, and a new-conversation action. History and drafts survive navigation in the same tab but are not persisted across reloads. Each request includes the selected language, current local date, non-expired product names, optional quantities/units/expiry, and up to 10 recent conversation pairs (24,000 characters total). Unknown product names are supported without translation or Spoonacular normalization. The server filters expired inventory again and instructs the model to treat only salt and water as always available. Inventory rules are prompt instructions, not a guarantee of model correctness; replies are rendered as plain text and cannot change inventory.

Messages and inventory are sent to Google Gemini when the user sends a message or selects a quick question. Chat text is not logged or cached by this app's server. Limits: 2,000 characters per user message, 100 products, 64 KiB request body, 25-second provider timeout, 6 requests/minute and 2 concurrent requests per warm server instance. Limits are process-local, not distributed. Stop cancels the browser request; provider work may already have started and may still consume quota. Automatic retries are disabled. Failed or cancelled questions remain editable.

## Verification

```sh
npm run build
npm run lint
node --experimental-strip-types --test tests/product.test.ts tests/recipes.test.ts tests/chat.test.ts tests/fridge.test.ts
```

Tests cover expiration boundaries, unknown names, ingredient matching, pantry assumptions, provider errors, input validation, cache deduplication, throttling and HTTP errors. Tests use fake provider responses and do not consume the API quota.

## Visual fridge and product catalog

The fridge has a main cabinet, freezer and a separate inner door. Drag a product by its grip to any storage zone. Pointer input supports mouse and touch; keyboard users can press Space on the grip, cycle zones with arrows and confirm with Enter (Escape cancels). The product editor also provides a zone selector. Moves preserve identity, amount and expiration, and persist locally.

The searchable product combobox uses `src/entities/product/catalog.ts`, a bilingual catalog with aliases. Choosing an entry fills its category and English recipe-search name. Unmatched names save as custom products with an optional English search name. Typing a different name clears the previous selection's metadata. Existing inventories load without migration; catalog metadata is optional.

## My recipes

My recipes stores custom recipes and API snapshots in browser localStorage (`cook-helper-recipes`). Custom recipes require a name, preparation instructions and at least one ingredient, entered one per line. Recipes can be edited and deleted. Saving from the API detail page needs no additional input, keeps all supplied preparation steps and attribution, and avoids duplicates. If the provider supplies no instructions, the saved page explicitly says so. Saved details do not request the API again; images still use the original remote URL. Storage is specific to this browser and is removed when its site data is cleared.
