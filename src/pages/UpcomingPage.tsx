import { Link } from 'react-router-dom';

import { availableProducts } from '../entities/product/model';
import { ProductIcon } from '../entities/product/ProductIcon';
import { useFridgeStore } from '../entities/product/store';
import { useTranslation } from '../shared/i18n';
import { useToday } from '../shared/useToday';

export function UpcomingPage({ chef = false }: { chef?: boolean }) {
  const { t } = useTranslation();
  const products = useFridgeStore((state) => state.products);
  const now = useToday();
  const available = availableProducts(products, now);
  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">COOK HELPER</p>
          <h1>{chef ? t.chefTitle : t.recipeTitle}</h1>
          <p className="subtitle">{chef ? t.chefSubtitle : t.recipeSubtitle}</p>
        </div>
      </section>
      <section className="upcoming-panel">
        <span className="upcoming-emoji" aria-hidden="true">
          {chef ? '👨‍🍳' : '🍲'}
        </span>
        <h2>{chef ? t.chefPending : t.recipePending}</h2>
        <p>{chef ? t.chefPendingText : t.recipePendingText}</p>
        <Link to="/fridge" className="secondary-button">
          ← {t.back}
        </Link>
      </section>
      <section className="context-panel">
        <h2>{t.context}</h2>
        <div className="ingredient-chips">
          {available.map((product) => (
            <span key={product.id}>
              <ProductIcon product={product} /> {product.name}
            </span>
          ))}
          {!available.length && <p className="muted">{t.noAvailable}</p>}
        </div>
        <p className="muted">{t.pantry}</p>
      </section>
    </>
  );
}
