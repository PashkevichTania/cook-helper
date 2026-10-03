import { useTranslation } from './i18n';

const ru = {
  search: 'Подобрать рецепты',
  searching: 'Ищем рецепты…',
  ingredients: 'Ингредиенты для поиска',
  intro: 'Нажмите «Подобрать рецепты», чтобы найти блюда из ваших продуктов.',
  note: 'Проверяем наличие, а не количество. Вода и соль считаются доступными. Рецепты остаются на языке оригинала.',
  unknown:
    'Эти продукты пока не участвуют в поиске. Нажмите на название и укажите английское название ингредиента.',
  excluded: 'Исключено просроченных продуктов:',
  empty:
    'Нет ингредиентов для поиска. Добавьте продукты или уточните их английские названия.',
  all: 'Все рецепты',
  readyOnly: 'Без недостающих ингредиентов',
  ready: 'Все ингредиенты есть',
  missing: 'Не хватает',
  match: 'ингредиентов есть',
  view: 'Открыть рецепт',
  noResults: 'Рецепты не найдены',
  noResultsHint: 'Попробуйте добавить другие ингредиенты или отключить фильтр.',
  found: 'Найдено рецептов',
  loading: 'Загружаем рецепт…',
  back: 'К рецептам',
  minutes: 'мин',
  servings: 'порций',
  ingredientList: 'Ингредиенты',
  steps: 'Приготовление',
  source: 'Оригинал рецепта',
  credits: 'Источник',
  noSteps: 'В API нет пошаговой инструкции. Посмотрите оригинал рецепта.',
  noSource: 'Ссылка на оригинал не предоставлена.',
  unconfirmed: 'Наличие не подтверждено',
  available: 'Есть',
  detailNote:
    'Сопоставление с текущим холодильником. Проверьте количество и точный вид ингредиентов перед приготовлением.',
  noImage: 'Фото отсутствует',
  apiName: 'Название для поиска (на английском)',
  apiHint:
    'Необязательно. Например, chicken breast. Нужно для продуктов, которых нет в нашем словаре.',
  retry: 'Повторить',
  invalidId: 'Неверный адрес рецепта',
  tooMany: 'В поиске можно использовать до 50 разных ингредиентов.',
};
const en: Record<keyof typeof ru, string> = {
  search: 'Find recipes',
  searching: 'Finding recipes…',
  ingredients: 'Search ingredients',
  intro: 'Select “Find recipes” to discover meals using your ingredients.',
  note: 'We check presence, not amounts. Water and salt are always available. Recipes stay in their original language.',
  unknown:
    'These products are not included yet. Select a name and add its English ingredient name.',
  excluded: 'Expired products excluded:',
  empty:
    'No search ingredients yet. Add products or provide their English names.',
  all: 'All recipes',
  readyOnly: 'No missing ingredients',
  ready: 'All ingredients available',
  missing: 'Missing',
  match: 'ingredients available',
  view: 'View recipe',
  noResults: 'No recipes found',
  noResultsHint: 'Try adding different ingredients or turning off the filter.',
  found: 'Recipes found',
  loading: 'Loading recipe…',
  back: 'Back to recipes',
  minutes: 'min',
  servings: 'servings',
  ingredientList: 'Ingredients',
  steps: 'Instructions',
  source: 'Original recipe',
  credits: 'Source',
  noSteps:
    'The API has no step-by-step instructions. Check the original recipe.',
  noSource: 'No original source link was provided.',
  unconfirmed: 'Availability unconfirmed',
  available: 'Available',
  detailNote:
    'Matched against your current fridge. Check quantities and exact ingredient varieties before cooking.',
  noImage: 'No photo',
  apiName: 'Search name (in English)',
  apiHint:
    'Optional. For example, chicken breast. Use this for products that are not in our dictionary.',
  retry: 'Try again',
  invalidId: 'Invalid recipe address',
  tooMany: 'Search supports up to 50 distinct ingredients.',
};
const errors: Record<string, [string, string]> = {
  NOT_CONFIGURED: [
    'Поиск ещё не настроен на сервере.',
    'Recipe search is not configured on the server yet.',
  ],
  PROVIDER_AUTH: [
    'Spoonacular отклонил ключ доступа. Проверьте настройки сервера.',
    'Spoonacular rejected the API key. Check server configuration.',
  ],
  QUOTA_EXCEEDED: [
    'Дневная квота Spoonacular исчерпана. Попробуйте после её обновления.',
    'The daily Spoonacular quota is exhausted. Try after it resets.',
  ],
  RATE_LIMITED: [
    'Слишком много запросов. Подождите минуту и попробуйте снова.',
    'Too many requests. Wait a minute and try again.',
  ],
  NOT_FOUND: ['Рецепт не найден.', 'Recipe not found.'],
  INVALID_REQUEST: [
    'Не удалось обработать ингредиенты. Проверьте английские названия.',
    'Could not process ingredients. Check the English names.',
  ],
  NETWORK_ERROR: [
    'Не удалось связаться с сервером. Проверьте соединение и повторите поиск.',
    'Cannot reach the server. Check your connection and retry.',
  ],
};
export function useRecipeTranslation() {
  const { language } = useTranslation();
  return {
    r: language === 'ru' ? ru : en,
    errorText: (code: string) =>
      errors[code]?.[language === 'ru' ? 0 : 1] ??
      (language === 'ru'
        ? 'Сервис рецептов временно недоступен. Попробуйте позже.'
        : 'The recipe service is temporarily unavailable. Try later.'),
  };
}
