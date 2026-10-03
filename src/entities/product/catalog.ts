import type { Product } from './model.ts';
export type CatalogProduct = {
  id: string;
  ru: string;
  en: string;
  apiName: string;
  type: Product['type'];
  aliases: string[];
};
const rows: [string, string, string, Product['type'], string?][] = [
  ['pancakes', 'Блины', 'Pancakes', 'preCooked', 'блин,блинчики,crepes'],
  ['dumplings', 'Пельмени', 'Dumplings', 'frozen', 'пельмешки,pelmeni'],
  ['ice-cream', 'Мороженое', 'Ice cream', 'frozen', 'мороженное,пломбир'],
  [
    'tomato',
    'Помидоры',
    'Tomato',
    'vegetable',
    'помидор,томат,томаты,tomatoes',
  ],
  ['potato', 'Картофель', 'Potato', 'vegetable', 'картошка,potatoes'],
  ['carrot', 'Морковь', 'Carrot', 'vegetable', 'carrots'],
  ['onion', 'Лук', 'Onion', 'vegetable', 'onions'],
  ['cucumber', 'Огурцы', 'Cucumber', 'vegetable', 'огурец,cucumbers'],
  ['cabbage', 'Капуста', 'Cabbage', 'vegetable'],
  ['broccoli', 'Брокколи', 'Broccoli', 'vegetable'],
  ['cauliflower', 'Цветная капуста', 'Cauliflower', 'vegetable'],
  [
    'bell-pepper',
    'Болгарский перец',
    'Bell pepper',
    'vegetable',
    'сладкий перец',
  ],
  ['zucchini', 'Кабачок', 'Zucchini', 'vegetable', 'кабачки'],
  ['eggplant', 'Баклажан', 'Eggplant', 'vegetable'],
  ['garlic', 'Чеснок', 'Garlic', 'vegetable'],
  ['spinach', 'Шпинат', 'Spinach', 'vegetable'],
  ['mushroom', 'Шампиньоны', 'Mushroom', 'vegetable', 'грибы,mushrooms'],
  ['lettuce', 'Листовой салат', 'Lettuce', 'vegetable'],
  ['apple', 'Яблоки', 'Apple', 'fruit', 'яблоко,apples'],
  ['banana', 'Бананы', 'Banana', 'fruit', 'банан,bananas'],
  ['lemon', 'Лимон', 'Lemon', 'fruit'],
  ['orange', 'Апельсин', 'Orange', 'fruit'],
  ['avocado', 'Авокадо', 'Avocado', 'fruit'],
  ['chicken', 'Курица', 'Chicken', 'meat'],
  ['chicken-breast', 'Куриная грудка', 'Chicken breast', 'meat'],
  ['beef', 'Говядина', 'Beef', 'meat'],
  ['pork', 'Свинина', 'Pork', 'meat'],
  ['turkey', 'Индейка', 'Turkey', 'meat'],
  ['ground-beef', 'Говяжий фарш', 'Ground beef', 'meat'],
  ['bacon', 'Бекон', 'Bacon', 'meat'],
  ['salmon', 'Лосось', 'Salmon', 'fish'],
  ['tuna', 'Тунец', 'Tuna', 'fish'],
  ['shrimp', 'Креветки', 'Shrimp', 'fish'],
  ['milk', 'Молоко', 'Milk', 'dairy'],
  [
    'condensed-milk',
    'Сгущёнка',
    'Condensed milk',
    'dairy',
    'сгущенка,сгущённое молоко,сгущенное молоко,молоко сгущённое,молоко сгущенное,sweetened condensed milk',
  ],
  ['cheese', 'Сыр', 'Cheese', 'dairy'],
  ['butter', 'Сливочное масло', 'Butter', 'dairy'],
  ['cottage-cheese', 'Творог', 'Cottage cheese', 'dairy'],
  ['sour-cream', 'Сметана', 'Sour cream', 'dairy'],
  ['yogurt', 'Йогурт', 'Yogurt', 'dairy'],
  ['cream', 'Сливки', 'Cream', 'dairy'],
  ['mozzarella', 'Моцарелла', 'Mozzarella', 'dairy'],
  ['egg', 'Яйца', 'Egg', 'eggs', 'яйцо,eggs'],
  ['rice', 'Рис', 'Rice', 'grain'],
  ['buckwheat', 'Гречка', 'Buckwheat', 'grain', 'гречневая крупа'],
  ['oats', 'Овсянка', 'Oats', 'grain', 'овсяные хлопья'],
  ['flour', 'Мука', 'Flour', 'grain'],
  ['bread', 'Хлеб', 'Bread', 'grain'],
  ['pasta', 'Макароны', 'Pasta', 'pasta'],
  ['spaghetti', 'Спагетти', 'Spaghetti', 'pasta'],
  ['olive-oil', 'Оливковое масло', 'Olive oil', 'sauce'],
  ['sunflower-oil', 'Подсолнечное масло', 'Sunflower oil', 'sauce'],
  ['soy-sauce', 'Соевый соус', 'Soy sauce', 'sauce'],
  ['ketchup', 'Кетчуп', 'Ketchup', 'sauce'],
  ['mayonnaise', 'Майонез', 'Mayonnaise', 'sauce'],
  ['black-pepper', 'Чёрный перец', 'Black pepper', 'spice'],
  ['paprika', 'Паприка', 'Paprika', 'spice'],
  ['dill', 'Укроп', 'Dill', 'spice'],
  ['parsley', 'Петрушка', 'Parsley', 'spice'],
  ['sugar', 'Сахар', 'Sugar', 'other'],
  ['honey', 'Мёд', 'Honey', 'other'],
  ['peas', 'Зелёный горошек', 'Peas', 'vegetable'],
  ['corn', 'Кукуруза', 'Corn', 'vegetable'],
  ['beans', 'Фасоль', 'Beans', 'vegetable'],
  ['semolina', 'Манная крупа', 'Semolina', 'grain', 'манка'],
  ['millet', 'Пшено', 'Millet', 'grain'],
  ['bulgur', 'Булгур', 'Bulgur', 'grain'],
  ['bavarian-sausages', 'Баварские колбаски', 'Bavarian sausages', 'meat'],
  ['boiled-sausage', 'Варёная колбаса', 'Boiled sausage', 'meat'],
  ['smoked-sausage', 'Копчёная колбаса', 'Smoked sausage', 'meat'],
  ['turmeric', 'Куркума', 'Turmeric', 'spice'],
  ['parmesan', 'Пармезан', 'Parmesan', 'dairy'],
  ['fish', 'Рыба', 'Fish', 'fish'],
  ['sausage', 'Колбаса', 'Sausage', 'meat'],
  ['beetroot', 'Свёкла', 'Beetroot', 'vegetable', 'beet,beets'],
  ['salt', 'Соль', 'Salt', 'spice'],
  ['jam', 'Варенье', 'Jam', 'other', 'джем'],
  ['water', 'Вода', 'Water', 'drink'],
  ['juice', 'Сок', 'Juice', 'drink'],
  ['coffee', 'Кофе', 'Coffee', 'drink'],
  ['tea', 'Чай', 'Tea', 'drink'],
  ['pear', 'Груша', 'Pear', 'fruit', 'pears'],
  ['ham', 'Ветчина', 'Ham', 'meat'],
  ['tomato-sauce', 'Томатный соус', 'Tomato sauce', 'sauce'],
  ['mustard', 'Горчица', 'Mustard', 'sauce'],
];
export const productCatalog: CatalogProduct[] = rows.map(
  ([id, ru, en, type, aliases]) => ({
    id,
    ru,
    en,
    type,
    apiName: en.toLowerCase(),
    aliases: aliases?.split(',') ?? [],
  })
);
export const catalogText = (value: string) =>
  value.trim().toLowerCase().replaceAll('ё', 'е').replace(/\s+/g, ' ');
export function findCatalogProduct(name: string) {
  const query = catalogText(name);
  return productCatalog.find((p) =>
    [p.ru, p.en, p.apiName, ...p.aliases].some((n) => catalogText(n) === query)
  );
}
export function searchCatalog(
  query: string,
  categoryLabels: Partial<Record<CatalogProduct['type'], string>> = {}
) {
  const normalized = catalogText(query);
  const matchesCategory = (product: CatalogProduct) =>
    normalized.length > 0 &&
    [product.type, categoryLabels[product.type]].some(
      (label) => label !== undefined && catalogText(label).includes(normalized)
    );
  const matches = productCatalog.filter(
    (product) =>
      matchesCategory(product) ||
      [product.ru, product.en, ...product.aliases].some((name) =>
        catalogText(name).includes(normalized)
      )
  );
  return matches.some(matchesCategory) ? matches : matches.slice(0, 10);
}
