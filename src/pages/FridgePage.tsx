import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  availableProducts,
  expirationStatus,
  localDate,
  type Product,
} from '../entities/product/model';
import { ProductIcon } from '../entities/product/ProductIcon';
import { useFridgeStore } from '../entities/product/store';
import { ProductForm } from '../features/fridge/ProductForm';
import { VisualFridge } from '../features/fridge/VisualFridge';
import { useTranslation } from '../shared/i18n';
import { useToday } from '../shared/useToday';

export function FridgePage() {
  const { t, language } = useTranslation();
  const products = useFridgeStore((state) => state.products);
  const now = useToday();
  const [editing, setEditing] = useState<Product | { initialZone: Product['fridgeZone'] } | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'soon' | 'expired'>('all');
  const soon = products.filter(
    (item) => expirationStatus(item.expiresAt, now) === 'soon'
  );
  const expired = products.filter(
    (item) => expirationStatus(item.expiresAt, now) === 'expired'
  );
  const filtered = products.filter(
    (item) =>
      item.name
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()) &&
      (filter === 'all' || expirationStatus(item.expiresAt, now) === filter)
  );
  function expiryLabel(product: Product) {
    const status = expirationStatus(product.expiresAt, now);
    if (status === 'expired') return t.expired;
    if (!product.expiresAt) return t.noExpiry;
    if (product.expiresAt === localDate(now)) return t.today;
    return `${t.until} ${new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short' }).format(new Date(`${product.expiresAt}T12:00:00`))}`;
  }
  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>
        <button className="primary-button" onClick={() => setEditing({ initialZone: 'middleShelf' })}>
          <span aria-hidden="true">＋</span> {t.add}
        </button>
      </section>
      <div className="stats">
        <div>
          <span className="stat-icon cyan">▦</span>
          <div>
            <strong>{products.length}</strong>
            <span>{t.products}</span>
          </div>
        </div>
        <div>
          <span className="stat-icon green">✓</span>
          <div>
            <strong>{availableProducts(products, now).length}</strong>
            <span>{t.available}</span>
          </div>
        </div>
        <div>
          <span className="stat-icon peach">◷</span>
          <div>
            <strong>{soon.length}</strong>
            <span>{t.soon}</span>
          </div>
        </div>
      </div>
      <div className="workspace-grid">
        <section className="fridge-panel">
          <div className="panel-heading">
            <h2>{t.fridge}</h2>
            <span className="temperature">❄ 4°C</span>
          </div>
          <p className="muted">{t.fridgeCaption}</p>
          <VisualFridge
            products={products}
            now={now}
            onEdit={setEditing}
            onAdd={(initialZone) => setEditing({ initialZone })}
          />
        </section>
        <section className="inventory-panel">
          <div className="panel-heading">
            <div>
              <h2>{t.inventory}</h2>
              <p className="muted">{t.inventoryHint}</p>
            </div>
            <span className="count-pill">{products.length}</span>
          </div>
          <div className="inventory-controls">
            <div className="filter-tabs" role="group" aria-label={t.inventory}>
              <button
                aria-pressed={filter === 'all'}
                className={filter === 'all' ? 'selected' : ''}
                onClick={() => setFilter('all')}
              >
                {t.all}
              </button>
              <button
                aria-pressed={filter === 'soon'}
                className={filter === 'soon' ? 'selected' : ''}
                onClick={() => setFilter('soon')}
              >
                {t.soon} <span>{soon.length}</span>
              </button>
              <button
                aria-pressed={filter === 'expired'}
                className={filter === 'expired' ? 'selected' : ''}
                onClick={() => setFilter('expired')}
              >
                {t.expired} <span>{expired.length}</span>
              </button>
            </div>
            <input
              className="search-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.search}
              aria-label={t.search}
            />
          </div>
          {products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-art" aria-hidden="true">
                🥬<span>＋</span>
              </div>
              <h3>{t.emptyTitle}</h3>
              <p>{t.emptyText}</p>
              <button
                className="secondary-button"
                onClick={() => setEditing({ initialZone: 'middleShelf' })}
              >
                ＋ {t.add}
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <h3>{t.noResults}</h3>
              <button
                className="secondary-button"
                onClick={() => {
                  setFilter('all');
                  setQuery('');
                }}
              >
                {t.reset}
              </button>
            </div>
          ) : (
            <div className="product-list">
              {filtered.map((product) => (
                <button
                  key={product.id}
                  className="product-row"
                  onClick={() => setEditing(product)}
                  aria-label={`${t.edit}: ${product.name}`}
                >
                  <span
                    className={`product-emoji category-${product.type}`}
                    aria-hidden="true"
                  >
                    <ProductIcon product={product} />
                  </span>
                  <span className="product-info">
                    <strong>{product.name}</strong>
                    <small>
                      {t[product.fridgeZone]}
                      {product.quantity !== undefined
                        ? ` · ${product.quantity} ${product.unit ? t[product.unit] : ''}`
                        : ''}
                    </small>
                  </span>
                  <span
                    className={`expiry-badge ${expirationStatus(product.expiresAt, now)}`}
                  >
                    {expiryLabel(product)}
                  </span>
                  <span className="row-arrow" aria-hidden="true">
                    ↗
                  </span>
                </button>
              ))}
            </div>
          )}
          {expired.length > 0 && (
            <p className="expired-note">⚠ {t.expiredHint}</p>
          )}
          <div className="pantry-note">
            <span aria-hidden="true">🧂</span>
            <div>
              <strong>{t.pantry}</strong>
              <p>{t.pantryHint}</p>
            </div>
          </div>
        </section>
        <aside className="ideas-panel">
          <div className="cook-card">
            <div className="cooking-art" aria-hidden="true">
              🍳<span>✦</span>
            </div>
            <p className="eyebrow">{t.cookEyebrow}</p>
            <h2>{t.cook}</h2>
            <p>{t.recipeSubtitle}</p>
            <Link className="primary-button" to="/recipes">
              {t.cook} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="freshness-card">
            <span className="section-symbol" aria-hidden="true">
              ◷
            </span>
            <h3>{t.freshnessTitle}</h3>
            {soon.length ? (
              <div className="freshness-list">
                {soon
                  .sort((a, b) => a.expiresAt!.localeCompare(b.expiresAt!))
                  .map((item) => (
                    <button key={item.id} onClick={() => setEditing(item)}>
                      <span>
                        <ProductIcon product={item} /> {item.name}
                      </span>
                      <small>{expiryLabel(item)}</small>
                    </button>
                  ))}
              </div>
            ) : (
              <p>{t.freshnessEmpty}</p>
            )}
          </div>
        </aside>
      </div>
      {editing && (
        <ProductForm
          product={'initialZone' in editing ? undefined : editing}
          initialZone={'initialZone' in editing ? editing.initialZone : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
