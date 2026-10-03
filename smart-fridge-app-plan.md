# Smart Fridge Recipe App — Product & Technical Plan

## 1. Product Vision

Build a personal web app that answers one core question:

> **What can I cook with what I already have in my fridge?**

The app should make the fridge inventory visually understandable, use a recipe API to find meals based on available ingredients, and provide an AI cooking assistant that can reason about the user's current fridge contents.

The MVP should be free to run for personal use.

---

## 2. Core Product Principles

- The **fridge is the center of the product**, not just a secondary inventory page.
- The main action is: **"What can I cook?"**
- Recipes should prioritize:
  - maximum number of ingredients already available,
  - minimum number of missing ingredients,
  - ingredients that will expire soon.
- The app should work without authentication or a database in the MVP.
- User data should be stored locally.
- External APIs should be hidden behind a small backend/proxy so API keys are not exposed.
- Recipe and AI providers should be abstracted so they can be replaced later.

---

## 3. Recommended Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui
- Zustand
- Zustand Persist
- TanStack Query
- Zod

### Backend / API Proxy

A very small backend or serverless API.

Possible options:

- Hono
- Express
- Vercel Functions (this since we're hosting on Vercel)
- Cloudflare Workers

The backend is responsible for:

- storing API keys,
- proxying Spoonacular requests,
- proxying Gemini requests,
- normalizing external API responses,
- optionally caching API results.

### Storage

For the MVP:

- Zustand
- localStorage via Zustand Persist

No database is required initially.

---

## 4. External APIs

## 4.1 Recipe API — Spoonacular

Spoonacular should be the primary recipe provider because the main application feature is recipe discovery based on fridge ingredients.

The most important endpoint is:

```http
GET /recipes/findByIngredients
```

Example input:

```text
ingredients=chicken,tomato,cheese,onion
ranking=1
ignorePantry=true
number=10
```

Useful response data:

- usedIngredients
- missedIngredients
- unusedIngredients
- usedIngredientCount
- missedIngredientCount

This directly supports the main UX:

- ingredients already available,
- ingredients that need to be purchased,
- recipes that can be cooked immediately,
- recipes that require only one or two extra products.

### API Usage Strategy

To stay within the free daily limit:

1. Do not search automatically on every render.
2. Trigger recipe discovery only when the user explicitly requests it.
3. Fetch only 10–15 results initially.
4. Fetch full recipe information only after a user opens a recipe.
5. Cache search results with TanStack Query.
6. Avoid unnecessary refetches.

### Recipe Provider Abstraction

Use an adapter interface so Spoonacular can be replaced later.

Example:

```ts
interface RecipeProvider {
  findByIngredients(
    ingredients: string[],
    options?: RecipeSearchOptions
  ): Promise<RecipeSearchResult[]>;

  search(
    query: string,
    options?: RecipeSearchOptions
  ): Promise<RecipeSearchResult[]>;

  getRecipe(id: string): Promise<Recipe>;
}
```

---

## 4.2 AI Provider — Gemini Free Tier

Use Gemini as the initial AI provider.

Example user requests:

- What can I cook in 20 minutes?
- Suggest something high-protein.
- What can I cook without buying anything?
- Use the chicken first because it expires soon.
- I want pasta. What am I missing?
- Suggest a breakfast without milk.

### AI Provider Abstraction

```ts
interface AIProvider {
  sendMessage(input: AIRequest): Promise<AIResponse>;
}
```

This keeps the app flexible if Gemini is replaced later.

---

## 5. Main Routes

```text
/fridge
/recipes
/recipes/:id
/chef
```

### `/fridge`

Main application page.

Responsibilities:

- display the fridge visually,
- display the user's products,
- add/edit/delete products,
- organize products by fridge zone,
- highlight products expiring soon,
- expose the main CTA:
  - **What can I cook?**

### `/recipes`

Recipe discovery page.

Responsibilities:

- show recipes based on fridge contents,
- allow manual search,
- filter by meal type,
- show ingredient match information,
- show missing ingredients,
- show recipes that can be cooked immediately.

### `/recipes/:id`

Recipe details.

Responsibilities:

- image,
- title,
- cooking time,
- ingredient list,
- preparation steps,
- fridge ingredient match,
- missing ingredients,
- optional AI actions.

### `/chef`

AI cooking assistant.

Responsibilities:

- automatically know the current fridge contents,
- answer cooking questions,
- recommend recipes,
- prioritize expiring ingredients,
- explain what must be purchased,
- optionally render structured recipe cards inside chat.

---

## 6. Fridge Page

The fridge should be visually recognizable instead of being only a list.

Possible layout:

```text
┌──────────────────────────────────────────┐
│ What is in your fridge?                  │
│                                          │
│  ┌──────────────┐    12 products         │
│  │   🍗 🍅 🥚   │     🥚 Eggs            │
│  │ 🥦 🥕 🧅     │    🥛 Milk             │
│  ├──────────────┤    🧀 Cheese           │
│  │ FREEZER      │    🍗 Chicken          │
│  │ ❄️ 🍦 🥩     │    🍅 Tomatoes         │
│  └──────────────┘                        │
│                                          │
│  [ + Add Product ]                       │
│                                          │
│  [ 🍳 What can I cook? ]                 │
└──────────────────────────────────────────┘
```

The fridge can initially be implemented with regular HTML/CSS.

Later improvements:

- SVG fridge illustration,
- drag and drop between shelves,
- animated doors,
- product tooltips,
- visual expiration indicators.

---

## 7. Product Entity

Recommended product model:

```ts
type ProductType =
  | "vegetable"
  | "fruit"
  | "meat"
  | "fish"
  | "dairy"
  | "eggs"
  | "grain"
  | "pasta"
  | "drink"
  | "sauce"
  | "spice"
  | "frozen"
  | "pre cooked"
  | "other";

type FridgeZone =
  | "freezer"
  | "topShelf"
  | "middleShelf"
  | "bottomShelf"
  | "drawer"
  | "door";

type Unit =
  | "g"
  | "kg"
  | "ml"
  | "l"
  | "pcs"
  | "pack";

interface Product {
  id: string;

  name: string;
  apiName: string;

  type: ProductType;
  emoji: string;

  quantity?: number;
  unit?: Unit;

  fridgeZone: FridgeZone;

  addedAt: string;
  expiresAt?: string;
}
```

### Why `name` and `apiName` are separate

The UI may be in English or Russian while the recipe API works best with English ingredient names.

Example:

```ts
{
  name: "Куриная грудка",
  apiName: "chicken breast",
  type: "meat",
  emoji: "🍗"
}
```

---

## 8. Product Emoji Strategy

No external API is required.

Use a local mapping for product categories:

```ts
const productTypeEmoji = {
  vegetable: "🥦",
  fruit: "🍎",
  meat: "🥩",
  fish: "🐟",
  dairy: "🥛",
  eggs: "🥚",
  grain: "🌾",
  drink: "🧃",
  sauce: "🥫",
  frozen: "❄️",
  other: "🍽️",
};
```

Also maintain a more specific ingredient dictionary:

```text
tomato  -> 🍅
potato  -> 🥔
carrot  -> 🥕
cheese  -> 🧀
milk    -> 🥛
egg     -> 🥚
chicken -> 🍗
apple   -> 🍎
banana  -> 🍌
```

AI can be used as a fallback to normalize uncommon products.

---

## 9. Product Normalization

When the user adds a Russian product name such as:

```text
творог
```

The app can normalize it to:

```json
{
  "apiName": "cottage cheese",
  "type": "dairy",
  "emoji": "🥛"
}
```

Recommended strategy:

1. Check local product dictionary.
2. If the product exists, use the local mapping.
3. Otherwise ask the AI once.
4. Store the normalized result locally.
5. Reuse it in the future.

This minimizes unnecessary AI usage.

---

## 10. Recipe Matching UX

The recipe list should focus on fridge compatibility.

Example card:

```text
Chicken Cheese Omelette

5 / 5 ingredients available

✓ Chicken
✓ Eggs
✓ Cheese
✓ Tomato
✓ Onion

✓ Can be cooked right now
```

Another example:

```text
Tomato Chicken Pasta

6 / 7 ingredients available

Missing:
+ Pasta

[ View Recipe ]
```

Important actions:

- **Can cook now**
- **Fewest missing ingredients**
- **Use expiring ingredients**
- **Fast recipes**

---

## 11. Meal Type Filtering

Application-level model:

```ts
type MealType =
  | "breakfast"
  | "lunch"
  | "dinner";
```

Do not tightly couple the UI model to Spoonacular's exact category model.

Create a translation layer between internal meal types and API filters.

This allows changing recipe providers without changing the UI.

---

## 12. AI Chef

The AI Chef should automatically receive fridge context.

Example context:

```json
{
  "fridge": [
    {
      "name": "chicken breast",
      "quantity": 500,
      "unit": "g"
    },
    {
      "name": "tomato",
      "quantity": 3,
      "unit": "pcs"
    },
    {
      "name": "cheddar",
      "quantity": 200,
      "unit": "g"
    }
  ]
}
```

### Quick Prompts

Provide preset actions such as:

- What can I cook right now?
- Dinner in 30 minutes
- Use products that expire soon
- No shopping required
- High-protein meal
- Quick breakfast

### Structured AI Response

Prefer structured data instead of plain text only.

Example:

```ts
interface AIRecipeSuggestion {
  title: string;
  description: string;

  usedIngredients: string[];
  missingIngredients: string[];

  cookingTime: number;

  steps: string[];
}
```

This allows the UI to render proper recipe cards inside the chat.

---

## 13. Expiration Dates

Expiration dates should be included early because they make the fridge concept much more useful.

Example:

```text
Expiring soon

🍗 Chicken       today
🥛 Milk          tomorrow
🍅 Tomatoes      in 2 days
```

Possible recipe ranking rule:

```text
priorityScore =
  ingredientMatchScore
  + expiringIngredientBonus
  - missingIngredientPenalty
```

The AI can also receive expiration information and prioritize those products.

---

## 14. Zustand Stores

Recommended stores:

### `useFridgeStore`

Responsibilities:

- products,
- add product,
- update product,
- remove product,
- move product between fridge zones.

Persist with Zustand Persist.

### `usePreferencesStore`

Responsibilities:

- meal preferences,
- dietary preferences,
- UI preferences,
- recipe filters.

### `useChatStore`

Responsibilities:

- AI conversation state,
- recent prompts,
- optional session history.

Do not store external API request state in Zustand.

Use TanStack Query for recipe requests and caching.

---

## 15. Suggested Project Structure

```text
src/
  app/
    router/
    providers/

  entities/
    product/
      model/
      ui/
      lib/

    recipe/
      model/
      ui/
      lib/

  features/
    fridge/
    recipe-search/
    recipe-matching/
    assistant/
    product-form/

  pages/
    fridge/
    recipes/
    recipe-details/
    chef/

  shared/
    api/
    config/
    hooks/
    lib/
    types/
    ui/
```

A lightweight Feature-Sliced-inspired structure is enough.

There is no need to implement strict FSD rules.

---

## 16. API Layer

Frontend:

```text
React
  ↓
/api/recipes/*
  ↓
Recipe Provider Adapter
  ↓
Spoonacular
```

AI:

```text
React
  ↓
/api/chat
  ↓
AI Provider Adapter
  ↓
Gemini
```

Never expose provider keys directly in frontend code.

Avoid placing secret API keys in public `VITE_*` variables if they are sent directly from the browser to third-party providers.

---

## 17. UI Color Palette

Provided palette:

```text
#f2aeb4  soft pink
#59ccd9  cyan
#f29e38  orange
#26afca  blue
#6f91ad  muted blue
```

Suggested usage:

```text
Primary          #26afca
Secondary        #59ccd9
CTA / Accent     #f29e38
Soft Accent      #f2aeb4
Muted UI         #6f91ad
```

Use a light neutral background so the palette does not become visually overwhelming.

The orange works well for key CTAs:

- What can I cook?
- Add product
- View recipe
- Cook this

---

## 18. MVP Development Plan

### Phase 1 — Foundation

- Create React + TypeScript + Vite project.
- Install Tailwind.
- Configure shadcn/ui.
- Add React Router.
- Add Zustand.
- Add Zustand Persist.
- Add TanStack Query.
- Add Zod.
- Configure the color palette.
- Create the base application layout.
- Create navigation:
  - Fridge
  - Recipes
  - AI Chef

### Phase 2 — Fridge Inventory

- Define Product types.
- Create `useFridgeStore`.
- Persist fridge state in localStorage.
- Add product form.
- Edit product.
- Delete product.
- Add quantity and unit.
- Add expiration date.
- Add fridge zone.
- Add emoji/category mapping.
- Build the visual fridge UI.

### Phase 3 — Recipe API

- Create backend/proxy.
- Add Spoonacular API key server-side.
- Build `RecipeProvider`.
- Implement `findByIngredients`.
- Add recipe result normalization.
- Add TanStack Query hooks.
- Add recipe cards.
- Add recipe details page.

### Phase 4 — Fridge Recipe Discovery

Build the main product flow:

```text
Fridge
  ↓
What can I cook?
  ↓
findByIngredients
  ↓
Recipe ranking
  ↓
Recipe cards
```

Add:

- used ingredient count,
- missing ingredient count,
- missing ingredient list,
- "can cook now" filter,
- match percentage,
- sorting by best fridge match.

### Phase 5 — Recipe Search Page

Add:

- text search,
- breakfast filter,
- lunch filter,
- dinner filter,
- quick recipes,
- vegetarian filter if desired,
- manual browsing independent of fridge inventory.

### Phase 6 — AI Chef

- Add Gemini backend integration.
- Add `AIProvider`.
- Send fridge context automatically.
- Add preset prompts.
- Add streaming if useful.
- Return structured recipe suggestions.
- Connect AI recommendations to Spoonacular recipes where possible.

### Phase 7 — Expiration Intelligence

- Highlight expiring products.
- Sort products by expiration.
- Prioritize recipes using expiring ingredients.
- Allow the AI to reason about expiration dates.

### Phase 8 — Polish

- Responsive layout.
- Mobile navigation.
- Loading skeletons.
- Empty states.
- Error states.
- Recipe favorites.
- Better recipe images.
- Better fridge visuals.
- Accessibility improvements.

---

## 19. Optional Future Features

Not required for the MVP:

- Open Food Facts integration.
- Barcode scanner.
- Drag and drop products between shelves.
- User accounts.
- Cloud synchronization.
- Supabase.
- Recipe favorites stored in the cloud.
- Shopping list.
- Automatic shopping list generation.
- Nutrition tracking.
- Calories/macros.
- Custom recipes.
- Meal planning.
- Weekly meal plan.
- PWA/offline mode.

---

## 20. MVP Cost Goal

The application should be designed to run at approximately zero cost for personal use.

Expected initial setup:

```text
React                  $0
TypeScript             $0
Vite                   $0
Tailwind               $0
shadcn/ui              $0
Zustand                $0
TanStack Query         $0
Spoonacular Free Tier  $0
Gemini Free Tier       $0
Database               $0
Authentication         $0
```

The architecture should remain simple until real usage requires more infrastructure.

---

## 21. Final Architecture

```text
React + TypeScript + Vite
        │
        ├── React Router
        ├── Tailwind
        ├── shadcn/ui
        ├── Zustand + Persist
        └── TanStack Query
                │
                ▼
          Backend / BFF
           ┌────┴─────┐
           │          │
     Spoonacular    Gemini
       Recipes      AI Chef
```

The central product flow is:

```text
Fridge
  ↓
Ingredients
  ↓
findByIngredients
  ↓
Match Score
  ↓
Recipe
  ↓
AI Chef
```

That flow should remain the main design and technical priority of the application.
