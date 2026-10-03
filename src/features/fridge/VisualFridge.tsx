import { useRef, useState } from 'react';

import {
  expirationStatus,
  type Product,
  zones,
} from '../../entities/product/model';
import { ProductIcon } from '../../entities/product/ProductIcon';
import { useFridgeStore } from '../../entities/product/store';
import { useTranslation } from '../../shared/i18n';

const dropTargets = [...zones, 'trash'] as const;
type DropTarget = (typeof dropTargets)[number];

type Drag = {
  id: string;
  x: number;
  y: number;
  zone: DropTarget | null;
  keyboard: boolean;
};
export function VisualFridge({
  products,
  now,
  onEdit,
  onAdd,
}: {
  products: Product[];
  now: Date;
  onEdit: (product: Product) => void;
  onAdd: (zone: Product['fridgeZone']) => void;
}) {
  const { t, language } = useTranslation();
  const move = useFridgeStore((s) => s.move);
  const remove = useFridgeStore((s) => s.remove);
  const trashLabel = language === 'ru' ? 'Корзина' : 'Trash';
  const trashHint =
    language === 'ru'
      ? 'Перетащите сюда, чтобы удалить'
      : 'Drop here to delete';
  const [drag, setDrag] = useState<Drag | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const start = useRef<{ id: string; x: number; y: number } | null>(null);
  const current = useRef<Drag | null>(null);
  const update = (value: Drag | null) => {
    current.current = value;
    setDrag(value);
  };
  const label = language === 'ru' ? 'Переместить' : 'Move';
  const finish = () => {
    const value = current.current;
    if (value?.zone) {
      if (value.zone === 'trash') remove(value.id);
      else move(value.id, value.zone);
      setAnnouncement(
        `${products.find((p) => p.id === value.id)?.name}: ${value.zone === 'trash' ? (language === 'ru' ? 'Удалено' : 'Deleted') : t[value.zone]}`
      );
    }
    start.current = null;
    update(null);
  };
  const cancel = () => {
    start.current = null;
    update(null);
  };
  function storageZone(zone: Product['fridgeZone']) {
    const items = products.filter((p) => p.fridgeZone === zone);
    return (
      <div
        key={zone}
        data-storage-zone={zone}
        className={`storage-zone storage-${zone} ${drag?.zone === zone ? 'drop-active' : ''}`}
      >
        <div className="zone-heading">
          <span>{t[zone]}</span>
          <div className="zone-actions">
            <small>{items.length}</small>
            <button
              type="button"
              className="zone-add"
              onClick={() => onAdd(zone)}
              aria-label={`${t.add}: ${t[zone]}`}
              title={`${t.add}: ${t[zone]}`}
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>
        </div>
        <div className="zone-products">
          {items.map((p) => (
            <div
              key={p.id}
              className={`fridge-item ${expirationStatus(p.expiresAt, now)} ${drag?.id === p.id ? 'is-dragging' : ''}`}
            >
              <button
                className="fridge-item-edit"
                onClick={() => onEdit(p)}
                aria-label={`${t.edit}: ${p.name}`}
              >
                <span aria-hidden="true">
                  <ProductIcon product={p} />
                </span>
                <small>{p.name}</small>
                {expirationStatus(p.expiresAt, now) === 'expired' && (
                  <b aria-label={t.expired}>!</b>
                )}
              </button>
              <button
                className="drag-grip"
                aria-label={`${label}: ${p.name}`}
                aria-describedby="fridge-drag-help"
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  e.currentTarget.focus();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  start.current = { id: p.id, x: e.clientX, y: e.clientY };
                }}
                onPointerMove={(e) => {
                  const origin = start.current;
                  if (!origin || origin.id !== p.id) return;
                  if (
                    !current.current &&
                    Math.hypot(e.clientX - origin.x, e.clientY - origin.y) < 6
                  )
                    return;
                  const target = document
                    .elementFromPoint(e.clientX, e.clientY)
                    ?.closest<HTMLElement>('[data-storage-zone]')
                    ?.dataset.storageZone;
                  update({
                    id: p.id,
                    x: e.clientX,
                    y: e.clientY,
                    zone: dropTargets.includes(target as DropTarget)
                      ? (target as DropTarget)
                      : null,
                    keyboard: false,
                  });
                }}
                onPointerUp={finish}
                onPointerCancel={cancel}
                onLostPointerCapture={() => {
                  if (start.current) cancel();
                }}
                onKeyDown={(e) => {
                  if (
                    (e.key === ' ' || e.key === 'Enter') &&
                    !current.current
                  ) {
                    e.preventDefault();
                    update({
                      id: p.id,
                      x: 0,
                      y: 0,
                      zone: p.fridgeZone,
                      keyboard: true,
                    });
                    setAnnouncement(`${label}: ${p.name}`);
                    return;
                  }
                  if (!current.current?.keyboard || current.current.id !== p.id)
                    return;
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    cancel();
                    return;
                  }
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    finish();
                    return;
                  }
                  if (
                    [
                      'ArrowLeft',
                      'ArrowRight',
                      'ArrowUp',
                      'ArrowDown',
                    ].includes(e.key)
                  ) {
                    e.preventDefault();
                    const index = dropTargets.indexOf(current.current.zone!);
                    const next =
                      dropTargets[
                        (index +
                          (['ArrowRight', 'ArrowDown'].includes(e.key)
                            ? 1
                            : dropTargets.length - 1)) %
                          dropTargets.length
                      ];
                    update({ ...current.current, zone: next });
                    setAnnouncement(next === 'trash' ? trashHint : t[next]);
                  }
                }}
              >
                ⠿
              </button>
            </div>
          ))}
          {!items.length && (
            <span className="zone-empty">
              {drag
                ? language === 'ru'
                  ? 'Положить сюда'
                  : 'Drop here'
                : t.emptyShelf}
            </span>
          )}
        </div>
        {zone === 'door' && (
          <div className="door-rails" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        )}
      </div>
    );
  }
  const item = products.find((p) => p.id === drag?.id);
  return (
    <>
      <div className="kitchen-scene">
        <div className={`open-fridge ${drag ? 'drag-in-progress' : ''}`}>
          <div className="fridge-cabinet">
            <div className="cabinet-label">
              COOK HELPER <span>●</span>
            </div>
            <div className="cabinet-liner">
              {(
                ['topShelf', 'middleShelf', 'bottomShelf', 'drawer'] as const
              ).map(storageZone)}
            </div>
            <div className="freezer-compartment">{storageZone('freezer')}</div>
          </div>
          <div className="fridge-door">
            <div className="door-top">{t.door}</div>
            {storageZone('door')}
            <div className="door-handle" aria-hidden="true" />
          </div>
        </div>
        <div
          className={`fridge-trash ${drag?.zone === 'trash' ? 'trash-active' : ''}`}
          data-storage-zone="trash"
          role="group"
          aria-label={trashHint}
          title={trashHint}
        >
          <svg viewBox="0 0 100 120" aria-hidden="true" focusable="false">
            <ellipse cx="50" cy="111" rx="35" ry="6" fill="#28473a18" />
            <path
              d="M23 36h54l-5 64q-1 8-9 8H37q-8 0-9-8Z"
              fill="#9bb6ab"
              stroke="#58796c"
              strokeWidth="3"
            />
            <path
              d="M34 46l3 49m13-49v49m16-49-3 49"
              stroke="#dce9e2"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <g className="trash-lid">
              <path
                d="M40 25v-8h20v8"
                fill="none"
                stroke="#58796c"
                strokeWidth="5"
                strokeLinejoin="round"
              />
              <rect
                x="18"
                y="25"
                width="64"
                height="12"
                rx="5"
                fill="#b8cec2"
                stroke="#58796c"
                strokeWidth="3"
              />
            </g>
            <rect x="41" y="101" width="18" height="5" rx="2" fill="#58796c" />
          </svg>
          <strong>{trashLabel}</strong>
          <small>{trashHint}</small>
        </div>
        <section className="pantry-cabinet" aria-label={t.pantryCabinet}>
          <div className="pantry-countertop" aria-hidden="true">
            <span className="pantry-jar" />
          </div>
          <h3>{t.pantryCabinet}</h3>
          <div className="pantry-drawer" data-storage-zone="pantryGrains">
            {' '}
            <div className="drawer-interior">{storageZone('pantryGrains')}</div>
            <div className="drawer-front" aria-hidden="true">
              <span />
            </div>
          </div>
          <div className="pantry-drawer" data-storage-zone="pantrySpices">
            <div className="drawer-interior">{storageZone('pantrySpices')}</div>
            <div className="drawer-front" aria-hidden="true">
              <span />
            </div>
          </div>
          <div className="cabinet-plinth" aria-hidden="true" />
        </section>
      </div>
      <p id="fridge-drag-help" className="fridge-footnote">
        {language === 'ru'
          ? 'Тяните за ⠿ между полками или в корзину для удаления. Клавиатура: пробел, стрелки, Enter; Esc — отмена.'
          : 'Drag ⠿ between zones or into the trash to delete. Keyboard: Space, arrows, Enter; Esc to cancel.'}
      </p>
      <p className="sr-only" role="status">
        {announcement}
      </p>
      {drag && !drag.keyboard && item && (
        <div
          className="drag-preview"
          style={{ left: drag.x + 12, top: drag.y + 12 }}
          aria-hidden="true"
        >
          <ProductIcon product={item} /> {item.name}
        </div>
      )}
    </>
  );
}
