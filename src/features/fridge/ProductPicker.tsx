import { useId, useState } from 'react';

import {
  type CatalogProduct,
  findCatalogProduct,
  searchCatalog,
} from '../../entities/product/catalog';
import { ProductIcon } from '../../entities/product/ProductIcon';
import { useTranslation } from '../../shared/i18n';

export function ProductPicker({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (product: CatalogProduct) => void;
}) {
  const { t, language } = useTranslation();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const options = searchCatalog(value, t);
  const custom = value.trim().length > 0 && !findCatalogProduct(value);
  const count = options.length + (custom ? 1 : 0);
  const select = (index: number) => {
    if (index < options.length && index >= 0) onSelect(options[index]);
    setOpen(false);
    setActive(-1);
  };
  return (
    <div className="product-picker">
      <label htmlFor={id}>{t.name}</label>
      <input
        id={id}
        name="name"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={
          open && active >= 0 ? `${id}-option-${active}` : undefined
        }
        required
        maxLength={100}
        value={value}
        placeholder={t.namePlaceholder}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
            setActive((i) =>
              e.key === 'ArrowDown'
                ? Math.min(i + 1, count - 1)
                : Math.max(i - 1, 0)
            );
          }
          if (e.key === 'Enter' && open && active >= 0) {
            e.preventDefault();
            select(active);
          }
          if (e.key === 'Escape' && open) {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          }
        }}
      />
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="catalog-options"
          aria-label={t.name}
        >
          {options.map((p, i) => (
            <li
              key={p.id}
              id={`${id}-option-${i}`}
              role="option"
              aria-selected={active === i}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(i)}
            >
              <span>
                <ProductIcon product={p} catalogId={p.id} />
              </span>
              <div>
                <strong>{language === 'ru' ? p.ru : p.en}</strong>
                <small>
                  {t[p.type]} · {p.apiName}
                </small>
              </div>
            </li>
          ))}
          {custom && (
            <li
              id={`${id}-option-${options.length}`}
              role="option"
              aria-selected={active === options.length}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(options.length)}
            >
              <span>＋</span>
              <div>
                <strong>
                  {language === 'ru' ? 'Свой продукт' : 'Custom product'}:{' '}
                  {value.trim()}
                </strong>
                <small>
                  {language === 'ru'
                    ? 'Сохранится под вашим названием'
                    : 'Keep your own name'}
                </small>
              </div>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
