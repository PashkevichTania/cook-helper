import { useEffect, useRef, useState } from 'react';

import {
  categories,
  categoryEmoji,
  normalizeProduct,
  type Product,
  productSchema,
  units,
  zones,
} from '../../entities/product/model';
import { useFridgeStore } from '../../entities/product/store';
import { ingredientNameSchema } from '../../entities/recipe/model';
import { useTranslation } from '../../shared/i18n';
import { useRecipeTranslation } from '../../shared/recipe-i18n';
import { ProductPicker } from './ProductPicker';

export function ProductForm({
  product,
  initialZone = 'middleShelf',
  onClose,
}: {
  product?: Product;
  initialZone?: Product['fridgeZone'];
  onClose: () => void;
}) {
  const { t, language } = useTranslation();
  const { r } = useRecipeTranslation();
  const save = useFridgeStore((state) => state.save);
  const remove = useFridgeStore((state) => state.remove);
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(product?.name ?? '');
  const [apiName, setApiName] = useState(product?.apiName ?? '');
  const [type, setType] = useState<Product['type'] | 'auto'>(
    product?.type ?? 'auto'
  );
  const [error, setError] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    element?.querySelector<HTMLInputElement>('[name=name]')?.focus();
    return () => element?.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="product-dialog"
      aria-labelledby="product-form-title"
      onCancel={onClose}
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">COOK HELPER</span>
          <h2 id="product-form-title">{product ? t.edit : t.add}</h2>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label={t.close}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <p className="muted">{t.formHint}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const name = String(data.get('name')).trim();
          const normalized = normalizeProduct(name);
          const customName = String(data.get('apiName') ?? '').trim();
          if (
            customName &&
            !ingredientNameSchema.safeParse(customName).success
          ) {
            setError(true);
            return;
          }
          const result = productSchema.safeParse({
            id: product?.id ?? crypto.randomUUID(),
            name,
            apiName: customName || normalized?.apiName,
            catalogId: normalized?.id,
            custom: !normalized,
            type:
              data.get('type') === 'auto'
                ? (normalized?.type ?? 'other')
                : data.get('type'),
            quantity: data.get('quantity')
              ? Number(data.get('quantity'))
              : undefined,
            unit: data.get('quantity') ? data.get('unit') : undefined,
            fridgeZone: data.get('zone'),
            addedAt: product?.addedAt ?? new Date().toISOString(),
            expiresAt: data.get('expiresAt') || undefined,
          });
          if (!result.success) {
            setError(true);
            return;
          }
          save(result.data);
          onClose();
        }}
      >
        <ProductPicker
          value={name}
          onChange={(value) => {
            setName(value);
            setApiName('');
            setType('auto');
          }}
          onSelect={(item) => {
            setName(language === 'ru' ? item.ru : item.en);
            setApiName(item.apiName);
            setType(item.type);
          }}
        />
        <label>
          {r.apiName}
          <input
            name="apiName"
            maxLength={100}
            value={apiName}
            onChange={(event) => setApiName(event.target.value)}
            pattern="[a-zA-Z][a-zA-Z0-9 '\(\)\-]*"
            placeholder="chicken breast"
            aria-describedby="api-name-hint"
          />
          <span id="api-name-hint" className="muted">
            {r.apiHint}
          </span>
        </label>
        <div className="form-grid">
          <label>
            {t.category}
            <select
              name="type"
              value={type}
              onChange={(event) =>
                setType(event.target.value as Product['type'] | 'auto')
              }
            >
              <option value="auto">{t.autoCategory}</option>
              {categories.map((type) => (
                <option key={type} value={type}>
                  {categoryEmoji[type]} {t[type]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.zone}
            <select
              name="zone"
              defaultValue={product?.fridgeZone ?? initialZone}
            >
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {t[zone]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-grid">
          <label>
            {t.quantity} <span className="optional">({t.optional})</span>
            <input
              name="quantity"
              type="number"
              min="0.001"
              step="any"
              defaultValue={product?.quantity}
              placeholder="—"
            />
          </label>
          <label>
            {t.unit}
            <select name="unit" defaultValue={product?.unit ?? 'pcs'}>
              {units.map((unit) => (
                <option key={unit} value={unit}>
                  {t[unit]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          {t.expiry} <span className="optional">({t.optional})</span>
          <input
            name="expiresAt"
            type="date"
            defaultValue={product?.expiresAt}
          />
        </label>
        {error && (
          <p className="error-message" role="alert">
            {t.invalid}
          </p>
        )}
        <div className="form-actions">
          {product && (
            <button
              type="button"
              className="delete-button"
              onClick={() => {
                remove(product.id);
                onClose();
              }}
            >
              {t.remove}
            </button>
          )}
          <button type="button" className="secondary-button" onClick={onClose}>
            {t.cancel}
          </button>
          <button className="primary-button" type="submit">
            {t.save}
          </button>
        </div>
      </form>
    </dialog>
  );
}
