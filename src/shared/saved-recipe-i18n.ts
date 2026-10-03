import { useTranslation } from './i18n';
const ru = {
  title: 'Мои рецепты',
  subtitle:
    'Свои рецепты и любимые блюда из поиска — под рукой в этом браузере.',
  add: 'Написать рецепт',
  edit: 'Редактировать рецепт',
  name: 'Название',
  preparation: 'Приготовление',
  ingredients: 'Продукты',
  ingredientsHint:
    'Каждый продукт с новой строки. Количество можно указать рядом.',
  preparationHint: 'Опишите, как приготовить блюдо.',
  required: 'Название, приготовление и хотя бы один продукт обязательны.',
  empty: 'Здесь будут ваши рецепты',
  emptyHint: 'Напишите свой рецепт или сохраните понравившийся из поиска.',
  browse: 'Найти рецепты',
  saveApi: 'Сохранить в мои рецепты',
  saved: 'Сохранено — открыть',
  custom: 'Свой рецепт',
  imported: 'Из API',
  missing: 'Рецепт не найден',
  noPreparation: 'Источник не передал инструкцию по приготовлению.',
  deleteConfirm: 'Удалить этот рецепт?',
  saveError: 'Не удалось сохранить изменения в браузере. Попробуйте ещё раз.',
  importError:
    'Не удалось сохранить рецепт: источник не передал название или продукты.',
};
const en: typeof ru = {
  title: 'My recipes',
  subtitle:
    'Your own recipes and favorites from search, saved in this browser.',
  add: 'Write a recipe',
  edit: 'Edit recipe',
  name: 'Name',
  preparation: 'Preparation',
  ingredients: 'Ingredients',
  ingredientsHint:
    'One ingredient per line. Add quantities alongside if needed.',
  preparationHint: 'Describe how to prepare the dish.',
  required: 'Name, preparation and at least one ingredient are required.',
  empty: 'Your recipes will appear here',
  emptyHint: 'Write your own recipe or save a favorite from search.',
  browse: 'Find recipes',
  saveApi: 'Save to my recipes',
  saved: 'Saved — open',
  custom: 'Your recipe',
  imported: 'From API',
  missing: 'Recipe not found',
  noPreparation: 'The source did not provide preparation instructions.',
  deleteConfirm: 'Delete this recipe?',
  saveError: 'Could not save changes in this browser. Please try again.',
  importError:
    'Could not save this recipe: the source did not provide a name or ingredients.',
};
export function useSavedRecipeTranslation() {
  const { language } = useTranslation();
  return language === 'ru' ? ru : en;
}
