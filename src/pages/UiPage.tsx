import './UiPage.css';

import { useMemo, useState } from 'react';

import { Button } from '../components/ui/button';
import { useTranslation } from '../shared/i18n';

const sources = import.meta.glob<string>(
  ['/src/**/*.svg', '/public/**/*.svg'],
  { eager: true, query: '?raw', import: 'default' }
);
const urls = import.meta.glob<string>('/src/**/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});
const variants = [
  'default',
  'outline',
  'secondary',
  'ghost',
  'destructive',
  'link',
] as const;
const sizes = ['xs', 'sm', 'default', 'lg'] as const;
const iconSizes = ['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const;
function collectIcons() {
  return Object.entries(sources).flatMap(([path, source]) => {
    const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
    const url = path.startsWith('/public/')
      ? import.meta.env.BASE_URL + path.slice(8)
      : urls[path];
    const symbols = Array.from(doc.querySelectorAll('symbol'));
    return (symbols.length ? symbols : [doc.documentElement]).map(
      (element) => ({
        key: path + '#' + element.id,
        name: element.id || path.split('/').at(-1)!,
        path: path.slice(1),
        url,
        symbol: symbols.length ? element.id : undefined,
        viewBox: element.getAttribute('viewBox') || '0 0 64 64',
      })
    );
  });
}
export function UiPage() {
  const { language } = useTranslation();
  const ru = language === 'ru';
  const icons = useMemo(() => collectIcons(), []);
  const [query, setQuery] = useState('');
  const [size, setSize] = useState(48);
  const [count, setCount] = useState(0);
  const [checked, setChecked] = useState(true);
  const filtered = icons.filter((icon) =>
    (icon.name + ' ' + icon.path)
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );
  return (
    <div className="ui-lab">
      <div className="page-heading">
        <div>
          <p className="eyebrow">COOK HELPER / UI LAB</p>
          <h1>{ru ? 'Компоненты и иконки' : 'Components & icons'}</h1>
          <p className="subtitle">
            {ru
              ? 'Тестовая площадка интерфейса. Переключайте тему и язык в шапке.'
              : 'Interface playground. Switch theme and language in the header.'}
          </p>
        </div>
      </div>
      <section className="ui-lab-panel" aria-labelledby="buttons-title">
        <h2 id="buttons-title">Button</h2>
        <p className="muted">
          {ru
            ? 'Варианты, размеры и состояния существующего компонента'
            : 'Variants, sizes and states of the existing component'}
        </p>
        <div className="ui-lab-buttons">
          {variants.map((variant) => (
            <div className="ui-lab-example" key={variant}>
              <code>{variant}</code>
              <Button variant={variant} onClick={() => setCount(count + 1)}>
                {ru ? 'Нажми меня' : 'Click me'}
              </Button>
              <Button variant={variant} disabled>
                {ru ? 'Недоступно' : 'Disabled'}
              </Button>
            </div>
          ))}
        </div>
        <div className="ui-lab-row">
          {sizes.map((size) => (
            <Button key={size} size={size} onClick={() => setCount(count + 1)}>
              {size}
            </Button>
          ))}
          {iconSizes.map((size) => (
            <Button
              key={size}
              size={size}
              variant="outline"
              aria-label={size}
              title={size}
              onClick={() => setCount(count + 1)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Button>
          ))}
        </div>
        <p className="muted" role="status">
          {ru ? 'Нажатий' : 'Clicks'}: {count}
        </p>
        <div className="ui-lab-row">
          <button
            className="primary-button"
            onClick={() => setCount(count + 1)}
          >
            {ru ? 'Основная кнопка приложения' : 'App primary button'}
          </button>
          <button
            className="secondary-button"
            onClick={() => setCount(count + 1)}
          >
            {ru ? 'Вторичная кнопка' : 'Secondary button'}
          </button>
        </div>
      </section>
      <section className="ui-lab-panel" aria-labelledby="fields-title">
        <h2 id="fields-title">{ru ? 'Поля и состояния' : 'Fields & states'}</h2>
        <div className="ui-lab-fields">
          <label>
            {ru ? 'Название' : 'Name'}
            <input placeholder={ru ? 'Например, помидоры' : 'e.g. Tomatoes'} />
          </label>
          <label>
            {ru ? 'Категория' : 'Category'}
            <select>
              <option>{ru ? 'Овощи' : 'Vegetables'}</option>
              <option>{ru ? 'Фрукты' : 'Fruit'}</option>
            </select>
          </label>
          <label>
            {ru ? 'Недоступное поле' : 'Disabled field'}
            <input disabled value="Cook Helper" readOnly />
          </label>
          <label>
            {ru ? 'Ошибка ввода' : 'Invalid input'}
            <input
              aria-invalid="true"
              aria-describedby="demo-error"
              defaultValue="?"
            />
            <small id="demo-error">
              {ru ? 'Пример сообщения об ошибке' : 'Example validation message'}
            </small>
          </label>
        </div>
        <label className="ui-lab-check">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
          />
          {ru ? 'Показывать уведомления' : 'Show notifications'}
        </label>
        <div className="ui-lab-row">
          <span className="temperature">+4 °C</span>
          <span className="muted">
            {ru ? 'Вспомогательный текст' : 'Supporting text'}
          </span>
        </div>
      </section>
      <section className="ui-lab-panel" aria-labelledby="icons-title">
        <div className="panel-heading">
          <h2 id="icons-title">{ru ? 'SVG-иконки' : 'SVG icons'}</h2>
          <span className="muted" role="status">
            {filtered.length} / {icons.length}
          </span>
        </div>
        <div className="ui-lab-toolbar">
          <label>
            {ru ? 'Поиск по имени или файлу' : 'Search by name or file'}
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="tomato, food-icons…"
            />
          </label>
          <label>
            {ru ? 'Размер' : 'Size'}: {size}px
            <input
              type="range"
              min="24"
              max="96"
              step="8"
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
            />
          </label>
        </div>
        <div className="ui-lab-icons">
          {filtered.map((icon) => (
            <figure className="ui-lab-icon" key={icon.key}>
              <div className="ui-lab-icon-preview">
                {icon.symbol ? (
                  <svg
                    width={size}
                    height={size}
                    viewBox={icon.viewBox}
                    role="img"
                    aria-label={icon.name}
                  >
                    <use href={icon.url + '#' + icon.symbol} />
                  </svg>
                ) : (
                  <img
                    src={icon.url}
                    width={size}
                    height={size}
                    alt={icon.name}
                  />
                )}
              </div>
              <figcaption>
                <code>{icon.name}</code>
                <small>{icon.path}</small>
              </figcaption>
            </figure>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="subtitle">
            {ru
              ? 'Иконки не найдены. Попробуйте другой запрос.'
              : 'No icons found. Try another search.'}
          </p>
        )}
      </section>
    </div>
  );
}
