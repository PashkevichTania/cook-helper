import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { useChatStore } from '../entities/chat/store';
import { availableProducts } from '../entities/product/model';
import { useFridgeStore } from '../entities/product/store';
import { useChatTranslation } from '../shared/chat-i18n';
import { useTranslation } from '../shared/i18n';
import { IngredientSelection } from '../shared/IngredientSelection';
import { useToday } from '../shared/useToday';

export function ChefPage() {
  const { c, errorText } = useChatTranslation();
  const { t } = useTranslation();
  const { messages, draft, pending, error, setDraft, send, stop, clear } =
    useChatStore();
  const products = useFridgeStore((state) => state.products);
  const now = useToday();
  const available = availableProducts(products, now);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages.length, pending, error]);
  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">GEMINI · COOK HELPER</p>
          <h1>{c.title}</h1>
          <p className="subtitle">{c.subtitle}</p>
        </div>
        <button
          className="secondary-button"
          disabled={!!pending || !messages.length}
          onClick={clear}
        >
          {c.clear}
        </button>
      </section>
      <div className="chef-layout">
        <section className="chat-panel" aria-label={t.chef}>
          <div
            className="chat-log"
            ref={log}
            role="log"
            aria-label={t.chef}
            aria-live="polite"
            aria-relevant="additions text"
          >
            {!messages.length && !pending && (
              <div className="chat-welcome">
                <span aria-hidden="true">👨‍🍳</span>
                <h2>{c.welcome}</h2>
                <p>{c.intro}</p>
                <div className="quick-prompts">
                  {c.prompts.map((prompt) => (
                    <button key={prompt} onClick={() => void send(prompt)}>
                      {prompt} ↗
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <article key={index} className={`chat-message ${message.role}`}>
                <strong>{message.role === 'user' ? c.you : c.assistant}</strong>
                <p>{message.text}</p>
              </article>
            ))}
            {pending && (
              <>
                <article className="chat-message user">
                  <strong>{c.you}</strong>
                  <p>{pending}</p>
                </article>
                <p className="chat-thinking" role="status">
                  {c.thinking}
                </p>
              </>
            )}
          </div>
          {error && (
            <p className="chat-error" role="alert">
              {errorText(error)}
            </p>
          )}
          <form
            className="chat-composer"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <label className="sr-only" htmlFor="chef-message">
              {c.placeholder}
            </label>
            <textarea
              id="chef-message"
              rows={3}
              maxLength={2000}
              value={draft}
              disabled={!!pending}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={c.placeholder}
              aria-describedby="chat-limit"
            />
            <div className="composer-actions">
              <small id="chat-limit">{draft.length}/2000</small>
              {pending ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={stop}
                >
                  {c.stop}
                </button>
              ) : (
                <button
                  className="primary-button"
                  type="submit"
                  disabled={!draft.trim()}
                >
                  {c.send} →
                </button>
              )}
            </div>
            <p className="chat-caption">{c.limit}</p>
          </form>
          <p className="chat-caption chat-disclosure">{c.privacy}</p>
        </section>
        <aside className="chat-context">
          <h2>{c.context}</h2>
          {available.length ? (
            <IngredientSelection products={available} />
          ) : (
            <p className="muted">{c.empty}</p>
          )}
          {products.length > available.length && (
            <p className="expired-note">
              {c.excluded} {products.length - available.length}
            </p>
          )}
          <p className="muted">{c.pantry}</p>
          <Link to="/fridge" className="secondary-button">
            {t.back}
          </Link>
          <p className="muted">{c.note}</p>
        </aside>
      </div>
    </>
  );
}
